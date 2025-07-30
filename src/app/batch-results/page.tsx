'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PressRelease {
  url: string;
  date: string;
  title: string;
}

interface ScrapingResult {
  success: boolean;
  pressReleases: PressRelease[];
  totalFound: number;
  yearRange: string;
  pagesScrapped: number;
}

export default function BatchResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [scrapingResult, setScrapingResult] = useState<ScrapingResult | null>(null);
  const [selectedReleases, setSelectedReleases] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedSummaries, setProcessedSummaries] = useState<{[url: string]: string}>({});
  const [expandedSummary, setExpandedSummary] = useState<string | null>(null);

  const baseUrl = searchParams.get('baseUrl');
  const startYear = searchParams.get('startYear');
  const endYear = searchParams.get('endYear');

  useEffect(() => {
    if (!baseUrl || !startYear || !endYear) {
      setError('Missing required parameters');
      setIsLoading(false);
      return;
    }

    startBaseScraping();
  }, [baseUrl, startYear, endYear]);

  const startBaseScraping = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/scrape-base-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          baseUrl, 
          startYear: parseInt(startYear!), 
          endYear: parseInt(endYear!) 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to scrape base URL');
      }

      const result = await response.json();
      setScrapingResult(result);
      setIsLoading(false);

    } catch (error: any) {
      console.error('Base scraping error:', error);
      setError(error.message || 'An error occurred while scraping');
      setIsLoading(false);
    }
  };

  const handleReleaseToggle = (url: string) => {
    setSelectedReleases(prev => {
      if (prev.includes(url)) {
        return prev.filter(u => u !== url);
      } else {
        return [...prev, url];
      }
    });
  };

  const handleSelectAll = () => {
    if (!scrapingResult) return;
    
    if (selectedReleases.length === scrapingResult.pressReleases.length) {
      setSelectedReleases([]);
    } else {
      setSelectedReleases(scrapingResult.pressReleases.map(pr => pr.url));
    }
  };

  const handleProcessSelected = async () => {
    if (selectedReleases.length === 0) return;

    setIsProcessing(true);
    
    try {
      // Process all URLs in parallel for speed using non-streaming batch endpoint
      const processingPromises = selectedReleases.map(async (url) => {
        try {
          const response = await fetch('/api/scrape-and-summarize-batch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
          });

          if (!response.ok) {
            return { url, summary: 'Error: Failed to process this press release' };
          }

          const result = await response.json();
          
          if (!result.success) {
            return { url, summary: result.error || 'Error: Failed to generate summary' };
          }

          return { url, summary: result.summary };

        } catch (error) {
          console.error(`Error processing ${url}:`, error);
          return { url, summary: 'Error: Failed to generate summary' };
        }
      });

      // Wait for all summaries to complete
      const results = await Promise.all(processingPromises);
      
      // Update all summaries at once
      const newSummaries: {[url: string]: string} = {};
      results.forEach(result => {
        newSummaries[result.url] = result.summary;
      });
      
      setProcessedSummaries(newSummaries);
      
    } catch (error) {
      console.error('Batch processing error:', error);
    }

    setIsProcessing(false);
  };

  const handleDownloadAll = async () => {
    if (Object.keys(processedSummaries).length === 0) return;

    try {
      // Combine all summaries into one document
      const combinedSummary = Object.entries(processedSummaries)
        .map(([url, summary]) => {
          const release = scrapingResult?.pressReleases.find(pr => pr.url === url);
          return `# ${release?.title || 'Press Release'}\n\n${summary}\n\n${url}\n\n---\n\n`;
        })
        .join('');

      const response = await fetch('/api/generate-docx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          summary: combinedSummary, 
          url: `Batch processing: ${selectedReleases.length} press releases` 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate document');
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `press-release-batch-summary-${startYear}-${endYear}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download document');
    }
  };

  const handleBack = () => {
    router.push('/loader');
  };

  const handleRetry = () => {
    startBaseScraping();
  };

  return (
    <div className="min-h-screen bg-gray-200 font-sans p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="neumorphic-card p-6 rounded-3xl">
            <button 
              onClick={handleBack}
              className="neumorphic-button px-4 py-2 rounded-xl text-sm font-medium text-gray-600 float-left"
            >
              ← Back
            </button>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-700 mb-2">
                Batch Press Release Processing
              </h1>
              <p className="text-gray-600 text-sm">
                {baseUrl} • Years: {startYear}-{endYear}
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <main>
          {isLoading && (
            <div className="neumorphic-card p-12 rounded-3xl text-center">
              <div className="neumorphic-small w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin w-8 h-8 border-2 border-gray-400 border-t-blue-500 rounded-full"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Scanning Press Releases</h3>
              <p className="text-gray-600">Finding all press releases within your specified date range...</p>
            </div>
          )}

          {error && (
            <div className="neumorphic-card p-12 rounded-3xl text-center">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-4">Error</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={handleRetry}
                className="neumorphic-button px-6 py-3 rounded-xl font-semibold text-gray-700"
              >
                Try Again
              </button>
            </div>
          )}

          {scrapingResult && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="neumorphic-card p-6 rounded-3xl">
                <div className="grid md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{scrapingResult.totalFound}</div>
                    <div className="text-gray-600 text-sm">Press Releases Found</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{scrapingResult.pagesScrapped}</div>
                    <div className="text-gray-600 text-sm">Pages Scraped</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{selectedReleases.length}</div>
                    <div className="text-gray-600 text-sm">Selected</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{Object.keys(processedSummaries).length}</div>
                    <div className="text-gray-600 text-sm">Processed</div>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="neumorphic-card p-6 rounded-3xl">
                {isProcessing && (
                  <div className="mb-6 neumorphic-inset p-4 rounded-2xl text-center">
                    <div className="neumorphic-small w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <div className="animate-spin w-6 h-6 border-2 border-gray-400 border-t-blue-500 rounded-full"></div>
                    </div>
                    <p className="text-gray-600">
                      Processing {selectedReleases.length} press releases in parallel...
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      This may take a few moments. All summaries will appear once complete.
                    </p>
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleSelectAll}
                      className="neumorphic-button px-4 py-2 rounded-xl text-sm font-medium text-gray-700"
                    >
                      {selectedReleases.length === scrapingResult.pressReleases.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <span className="text-gray-600 text-sm">
                      {selectedReleases.length} of {scrapingResult.pressReleases.length} selected
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {Object.keys(processedSummaries).length > 0 && (
                      <button
                        onClick={handleDownloadAll}
                        className="neumorphic-button px-6 py-3 rounded-xl font-semibold text-gray-700"
                      >
                        📄 Download All Summaries
                      </button>
                    )}
                    <button
                      onClick={handleProcessSelected}
                      disabled={selectedReleases.length === 0 || isProcessing}
                      className="neumorphic-button px-6 py-3 rounded-xl font-semibold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? `Processing ${selectedReleases.length} releases...` : `Process Selected (${selectedReleases.length})`}
                    </button>
                  </div>
                </div>
              </div>

              {/* Press Releases List */}
              <div className="neumorphic-card p-6 rounded-3xl">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Found Press Releases</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {scrapingResult.pressReleases.map((release, index) => (
                    <div key={index} className="neumorphic-inset p-4 rounded-2xl">
                      <div className="flex items-start space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedReleases.includes(release.url)}
                          onChange={() => handleReleaseToggle(release.url)}
                          className="mt-1 w-4 h-4"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-800 mb-1 truncate">{release.title}</h4>
                          <p className="text-gray-600 text-sm mb-2">{release.date}</p>
                          <p className="text-gray-500 text-xs break-all">{release.url}</p>
                          
                          {processedSummaries[release.url] && (
                            <div className="mt-4 neumorphic-small p-4 rounded-xl">
                              <div className="flex items-center justify-between">
                                <div className="text-green-600 text-sm font-medium">✓ Summary Generated</div>
                                <button
                                  onClick={() => setExpandedSummary(processedSummaries[release.url])}
                                  className="neumorphic-button px-3 py-1 rounded-lg text-xs font-medium text-blue-600 hover:text-blue-800"
                                >
                                  View Full Summary →
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Summary Modal */}
        {expandedSummary && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-200 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden neumorphic-card">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-800">Press Release Summary</h3>
                  <button
                    onClick={() => setExpandedSummary(null)}
                    className="neumorphic-button w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="neumorphic-inset p-6 rounded-2xl">
                  <div className="press-release-content prose prose-gray max-w-none prose-headings:text-gray-800 prose-p:text-gray-700 prose-strong:text-gray-800 prose-ul:text-gray-700 prose-li:text-gray-700">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({children}) => <h1 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-3">{children}</h1>,
                        h2: ({children}) => <h2 className="text-xl font-bold text-gray-800 mb-3 mt-6 flex items-center">
                          <span className="w-2 h-6 bg-blue-500 mr-3 rounded"></span>
                          {children}
                        </h2>,
                        h3: ({children}) => <h3 className="text-lg font-semibold text-gray-700 mb-2 mt-4">{children}</h3>,
                        p: ({children}) => <p className="text-gray-700 mb-3 leading-relaxed">{children}</p>,
                        ul: ({children}) => <ul className="list-none mb-4 space-y-2">{children}</ul>,
                        li: ({children}) => <li className="text-gray-700 flex items-start">
                          <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span>{children}</span>
                        </li>,
                        strong: ({children}) => <strong className="font-semibold text-gray-800">{children}</strong>,
                        em: ({children}) => <em className="italic text-gray-600">{children}</em>,
                        code: ({children}) => <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">{children}</code>,
                        blockquote: ({children}) => <blockquote className="border-l-4 border-blue-300 pl-4 italic text-gray-600 my-4 neumorphic-inset p-4 rounded-r-lg">{children}</blockquote>,
                      }}
                    >
                      {expandedSummary}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
