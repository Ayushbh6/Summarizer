'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const url = searchParams.get('url');

  useEffect(() => {
    if (!url) {
      setError('No URL provided');
      setIsLoading(false);
      return;
    }

    startSummarization();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [url]);

  const startSummarization = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSummary('');
      setIsComplete(false);

      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/scrape-and-summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process URL');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      setIsLoading(false);

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
              setIsComplete(true);
              break;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                setError(parsed.error);
                break;
              }
              if (parsed.content) {
                setSummary(prev => prev + parsed.content);
              }
            } catch (e) {
              // Ignore invalid JSON
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return; // User cancelled
      }
      console.error('Summarization error:', error);
      setError(error.message || 'An error occurred while processing');
      setIsLoading(false);
    }
  };

  const handleDownloadDocx = async () => {
    try {
      const response = await fetch('/api/generate-docx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ summary, url }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate document');
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'press-release-summary.docx';
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
    startSummarization();
  };

  return (
    <div className="min-h-screen bg-gray-200 font-sans p-6">
      <div className="max-w-4xl mx-auto">
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
                Press Release Summary
              </h1>
              <p className="text-gray-600 text-sm break-all">
                {url}
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <main>
          <div className="neumorphic-card p-8 rounded-3xl">
            {isLoading && (
              <div className="text-center py-12">
                <div className="neumorphic-small w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="animate-spin w-8 h-8 border-2 border-gray-400 border-t-blue-500 rounded-full"></div>
                </div>
                <p className="text-gray-600">Scraping and analyzing content...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-12">
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

            {!isLoading && !error && (
              <>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Summary</h2>
                    {!isComplete && (
                      <div className="flex items-center text-gray-600">
                        <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        <span className="text-sm">Generating...</span>
                      </div>
                    )}
                    {isComplete && (
                      <div className="flex items-center text-green-600">
                        <span className="text-sm">✓ Complete</span>
                      </div>
                    )}
                  </div>
                  
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
                        {summary || 'Waiting for content...'}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>

                {isComplete && summary && (
                  <div className="text-center">
                    <button
                      onClick={handleDownloadDocx}
                      className="neumorphic-button px-8 py-4 rounded-2xl text-lg font-semibold text-gray-700 transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                      📄 Download as DOCX
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
