import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface PressRelease {
  url: string;
  date: string;
  title: string;
  parsedDate: Date;
}

export async function POST(request: NextRequest) {
  try {
    const { baseUrl, startYear, endYear } = await request.json();

    if (!baseUrl || !startYear || !endYear) {
      return NextResponse.json({ 
        error: 'Base URL, start year, and end year are required' 
      }, { status: 400 });
    }

    const startYearNum = parseInt(startYear);
    const endYearNum = parseInt(endYear);
    
    if (startYearNum > endYearNum) {
      return NextResponse.json({ 
        error: 'Start year must be less than or equal to end year' 
      }, { status: 400 });
    }

    console.log(`Scraping base URL: ${baseUrl} for years ${startYearNum}-${endYearNum}`);

    const allPressReleases: PressRelease[] = [];
    const yearRange = endYearNum - startYearNum + 1;
    const maxPagesToScrape = yearRange * 2; // 2 pages per year assumption
    const stopBeforeYear = startYearNum - 1; // Stop if we find press releases from before start year

    // Function to parse various date formats
    const parseDate = (dateString: string): Date | null => {
      try {
        // Handle formats like "JUL 23, 2025 4:05PM EDT"
        const cleanDate = dateString.replace(/\s+\d{1,2}:\d{2}(AM|PM)\s+(EDT|EST|PST|PDT|CST|CDT|MST|MDT)?\s*$/i, '').trim();
        
        // Try different date parsing approaches
        const formats = [
          cleanDate, // Original cleaned format
          cleanDate.replace(/^(\w{3})\s+(\d{1,2}),\s+(\d{4})/, '$1 $2, $3'), // "JUL 23, 2025"
          cleanDate.replace(/^(\w+)\s+(\d{1,2}),\s+(\d{4})/, '$1 $2, $3'), // Full month name
        ];

        for (const format of formats) {
          const parsed = new Date(format);
          if (!isNaN(parsed.getTime())) {
            return parsed;
          }
        }
        
        return null;
      } catch (error) {
        console.warn('Date parsing error:', error);
        return null;
      }
    };

    // Function to scrape a single page
    const scrapePage = async (url: string): Promise<{ pressReleases: PressRelease[], hasMore: boolean }> => {
      console.log(`Scraping page: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      
      const pageReleases: PressRelease[] = [];
      
      // Common selectors for press release links and dates
      const selectors = [
        // Generic selectors
        'a[href*="press"], a[href*="news"], a[href*="release"]',
        '.press-release a, .news-item a, .post a',
        'article a, .entry a, .item a',
        // Specific patterns
        'a[href*="/press-release"], a[href*="/news/"], a[href*="/pr/"]'
      ];

      for (const selector of selectors) {
        $(selector).each((_, element) => {
          const $link = $(element);
          let href = $link.attr('href');
          
          if (!href) return;
          
          // Convert relative URLs to absolute
          if (href.startsWith('/')) {
            const baseUrlObj = new URL(baseUrl);
            href = `${baseUrlObj.origin}${href}`;
          } else if (!href.startsWith('http')) {
            href = new URL(href, baseUrl).href;
          }
          
          const title = $link.text().trim() || $link.find('*').first().text().trim();
          
          // Look for date near the link
          let dateText = '';
          
          // Try to find date in parent elements
          const $parent = $link.closest('li, div, article, .item, .post, .entry');
          const dateSelectors = [
            '.date', '.time', '.published', '[class*="date"]', '[class*="time"]'
          ];
          
          for (const dateSelector of dateSelectors) {
            const $dateElement = $parent.find(dateSelector);
            if ($dateElement.length > 0) {
              dateText = $dateElement.text().trim();
              break;
            }
          }
          
          // If no date found in structured elements, look for date patterns in text
          if (!dateText) {
            const parentText = $parent.text();
            const datePatterns = [
              /\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+\d{1,2},?\s+\d{4}/i,
              /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/i,
              /\d{1,2}\/\d{1,2}\/\d{4}/,
              /\d{4}-\d{2}-\d{2}/
            ];
            
            for (const pattern of datePatterns) {
              const match = parentText.match(pattern);
              if (match) {
                dateText = match[0];
                break;
              }
            }
          }
          
          if (title && dateText) {
            const parsedDate = parseDate(dateText);
            if (parsedDate) {
              // Check if this URL is already in our list
              const existingRelease = pageReleases.find(pr => pr.url === href);
              if (!existingRelease) {
                pageReleases.push({
                  url: href,
                  date: dateText,
                  title: title,
                  parsedDate: parsedDate
                });
              }
            }
          }
        });
        
        // If we found releases with this selector, break
        if (pageReleases.length > 0) break;
      }
      
      // Check for pagination
      let hasMore = false;
      const paginationSelectors = [
        'a[href*="page="]', 'a[href*="p="]', '.next', '.pagination a', 
        'a:contains("Next")', 'a:contains(">")', '[class*="next"]'
      ];
      
      for (const selector of paginationSelectors) {
        if ($(selector).length > 0) {
          hasMore = true;
          break;
        }
      }
      
      return { pressReleases: pageReleases, hasMore };
    };

    // Start scraping from page 1
    let currentPage = 1;
    let shouldContinue = true;
    
    while (currentPage <= maxPagesToScrape && shouldContinue) {
      // Construct page URL
      let pageUrl = baseUrl;
      if (currentPage > 1) {
        // Try common pagination patterns
        const separator = baseUrl.includes('?') ? '&' : '?';
        const pagePatterns = [`${separator}page=${currentPage}`, `${separator}p=${currentPage}`];
        
        // Use the first pattern by default
        pageUrl = `${baseUrl}${pagePatterns[0]}`;
      }
      
      try {
        const { pressReleases, hasMore } = await scrapePage(pageUrl);
        
        console.log(`Page ${currentPage}: Found ${pressReleases.length} press releases`);
        
        // Filter releases within year range and check stopping condition
        for (const release of pressReleases) {
          const releaseYear = release.parsedDate.getFullYear();
          
          // If we found a release from before our start year, stop scraping
          if (releaseYear < stopBeforeYear) {
            console.log(`Found release from ${releaseYear}, stopping scrape (before ${stopBeforeYear})`);
            shouldContinue = false;
            break;
          }
          
          // Add release if it's within our target range
          if (releaseYear >= startYearNum && releaseYear <= endYearNum) {
            allPressReleases.push(release);
          }
        }
        
        // If no pagination or we hit our stopping condition, break
        if (!hasMore || !shouldContinue) {
          break;
        }
        
        currentPage++;
        
        // Add a small delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error scraping page ${currentPage}:`, error);
        // Continue to next page instead of failing completely
        currentPage++;
      }
    }

    // Sort by date (newest first)
    allPressReleases.sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime());
    
    // Remove duplicates based on URL
    const uniqueReleases = allPressReleases.filter((release, index, array) => 
      array.findIndex(r => r.url === release.url) === index
    );

    console.log(`Scraping complete. Found ${uniqueReleases.length} unique press releases`);

    return NextResponse.json({
      success: true,
      pressReleases: uniqueReleases.map(pr => ({
        url: pr.url,
        date: pr.date,
        title: pr.title
      })),
      totalFound: uniqueReleases.length,
      yearRange: `${startYearNum}-${endYearNum}`,
      pagesScrapped: currentPage - 1
    });

  } catch (error) {
    console.error('Base URL scraping error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
