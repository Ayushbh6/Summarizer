import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Step 1: Scrape the webpage content
    console.log('Scraping URL:', url);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    
    // Step 2: Extract content using Cheerio
    const $ = cheerio.load(html);
    
    // Remove script and style elements
    $('script, style, nav, header, footer, aside, .nav, .navigation, .menu, .sidebar').remove();
    
    // Extract text content from main content areas
    let content = '';
    const contentSelectors = [
      'main',
      '[role="main"]',
      '.main',
      '.content',
      '.post',
      '.article',
      '.press-release',
      '.news',
      'article',
      '.entry-content',
      '.post-content'
    ];
    
    // Try to find main content using common selectors
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text().trim();
        break;
      }
    }
    
    // If no main content found, use body but filter out common noise
    if (!content) {
      content = $('body').text().trim();
    }
    
    // Clean up the content
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
    
    if (!content || content.length < 100) {
      return NextResponse.json({ error: 'No meaningful content found on the page' }, { status: 400 });
    }

    console.log('Extracted content length:', content.length);

    // Step 3: Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Prepare the prompt for professional analyst summary
          const prompt = `You are a professional business analyst. Please analyze the following press release content and provide a comprehensive, well-structured summary. 

Format your response as follows:
- **Executive Summary**: A brief overview in 2-3 sentences
- **Key Announcements**: Main points and announcements
- **Financial Highlights**: Any financial data, revenue, profits, etc.
- **Strategic Implications**: Business impact and strategic importance
- **Key Figures**: Important people mentioned
- **Timeline**: Important dates mentioned
- **Market Impact**: Potential effects on market/industry

Keep the analysis professional, objective, and well-formatted with clear headings and bullet points where appropriate.

Content to analyze:
${content}`;

          const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'qwen/qwen3-235b-a22b-2507',
              messages: [{ role: 'user', content: prompt }],
              stream: true,
            }),
          });

          if (!openRouterResponse.ok) {
            throw new Error(`OpenRouter API error: ${openRouterResponse.status}`);
          }

          const reader = openRouterResponse.body?.getReader();
          if (!reader) {
            throw new Error('Response body is not readable');
          }

          const decoder = new TextDecoder();
          let buffer = '';

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });

              while (true) {
                const lineEnd = buffer.indexOf('\n');
                if (lineEnd === -1) break;

                const line = buffer.slice(0, lineEnd).trim();
                buffer = buffer.slice(lineEnd + 1);

                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') {
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    break;
                  }

                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices[0].delta.content;
                    if (content) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                    }
                  } catch (e) {
                    // Ignore invalid JSON
                  }
                }
              }
            }
          } finally {
            reader.cancel();
          }
        } catch (error) {
          console.error('Streaming error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown streaming error';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
