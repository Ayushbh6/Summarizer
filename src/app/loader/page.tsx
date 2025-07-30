'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoaderPage() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<'single' | 'range' | null>(null);
  const [url, setUrl] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [startMonth, setStartMonth] = useState('');
  const [endMonth, setEndMonth] = useState('');

  const handleBack = () => {
    router.push('/');
  };

  const handleProcess = () => {
    if (selectedOption === 'single' && url) {
      // Navigate to results page with the URL
      router.push(`/results?url=${encodeURIComponent(url)}`);
    } else if (selectedOption === 'range' && baseUrl && startYear && endYear) {
      // Build URL with optional month parameters
      const params = new URLSearchParams({
        baseUrl,
        startYear,
        endYear
      });
      
      if (startMonth) params.append('startMonth', startMonth);
      if (endMonth) params.append('endMonth', endMonth);
      
      // Navigate to batch results page with base URL and date range
      router.push(`/batch-results?${params.toString()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 font-sans flex items-center justify-center px-6">
      <div className="max-w-3xl mx-auto w-full">
        {/* Header */}
        <header className="mb-8">
          <div className="neumorphic-card p-6 rounded-3xl text-center">
            <button 
              onClick={handleBack}
              className="neumorphic-button px-4 py-2 rounded-xl text-sm font-medium text-gray-600 float-left"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold text-gray-700">
              Choose Your Method
            </h1>
            <p className="text-gray-600 mt-2">
              Select how you&apos;d like to process press releases
            </p>
          </div>
        </header>

        {/* Options */}
        <main className="space-y-6">
          {/* Single URL Option */}
          <div 
            className={`neumorphic-card p-8 rounded-3xl cursor-pointer transition-all duration-200 ${
              selectedOption === 'single' ? 'neumorphic-pressed' : ''
            }`}
            onClick={() => setSelectedOption('single')}
          >
            <div className="flex items-center mb-4">
              <div className="neumorphic-small w-6 h-6 rounded-full flex items-center justify-center mr-4">
                <div className={`w-3 h-3 rounded-full ${selectedOption === 'single' ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Single Press Release URL</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Process one specific press release from a direct URL
            </p>
            
            {selectedOption === 'single' && (
              <div className="neumorphic-inset p-6 rounded-2xl">
                <label className="block text-gray-700 font-medium mb-3">
                  Press Release URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/press-release"
                  className="w-full p-4 rounded-xl bg-gray-200 border-none outline-none text-gray-700 neumorphic-inset"
                />
              </div>
            )}
          </div>

          {/* Year Range Option */}
          <div 
            className={`neumorphic-card p-8 rounded-3xl cursor-pointer transition-all duration-200 ${
              selectedOption === 'range' ? 'neumorphic-pressed' : ''
            }`}
            onClick={() => setSelectedOption('range')}
          >
            <div className="flex items-center mb-4">
              <div className="neumorphic-small w-6 h-6 rounded-full flex items-center justify-center mr-4">
                <div className={`w-3 h-3 rounded-full ${selectedOption === 'range' ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Base URL with Year Range</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Extract all press releases from a company&apos;s news page within a specific year range
            </p>
            
            {selectedOption === 'range' && (
              <div className="neumorphic-inset p-6 rounded-2xl">
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-3">
                      Base URL (News/Press Page)
                    </label>
                    <input
                      type="url"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="https://example.com/news"
                      className="w-full p-4 rounded-xl bg-gray-200 border-none outline-none text-gray-700 neumorphic-inset"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-3">
                        Start Year
                      </label>
                      <input
                        type="number"
                        value={startYear}
                        onChange={(e) => setStartYear(e.target.value)}
                        placeholder="2023"
                        min="2000"
                        max={new Date().getFullYear()}
                        className="w-full p-4 rounded-xl bg-gray-200 border-none outline-none text-gray-700 neumorphic-inset"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 font-medium mb-3">
                        End Year
                      </label>
                      <input
                        type="number"
                        value={endYear}
                        onChange={(e) => setEndYear(e.target.value)}
                        placeholder="2024"
                        min="2000"
                        max={new Date().getFullYear()}
                        className="w-full p-4 rounded-xl bg-gray-200 border-none outline-none text-gray-700 neumorphic-inset"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-3">
                        Start Month <span className="text-sm text-gray-500">(Optional - defaults to current month)</span>
                      </label>
                      <select
                        value={startMonth}
                        onChange={(e) => setStartMonth(e.target.value)}
                        className="w-full p-4 rounded-xl bg-gray-200 border-none outline-none text-gray-700 neumorphic-inset"
                      >
                        <option value="">Select Month</option>
                        <option value="1">January</option>
                        <option value="2">February</option>
                        <option value="3">March</option>
                        <option value="4">April</option>
                        <option value="5">May</option>
                        <option value="6">June</option>
                        <option value="7">July</option>
                        <option value="8">August</option>
                        <option value="9">September</option>
                        <option value="10">October</option>
                        <option value="11">November</option>
                        <option value="12">December</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 font-medium mb-3">
                        End Month <span className="text-sm text-gray-500">(Optional - defaults to current month)</span>
                      </label>
                      <select
                        value={endMonth}
                        onChange={(e) => setEndMonth(e.target.value)}
                        className="w-full p-4 rounded-xl bg-gray-200 border-none outline-none text-gray-700 neumorphic-inset"
                      >
                        <option value="">Select Month</option>
                        <option value="1">January</option>
                        <option value="2">February</option>
                        <option value="3">March</option>
                        <option value="4">April</option>
                        <option value="5">May</option>
                        <option value="6">June</option>
                        <option value="7">July</option>
                        <option value="8">August</option>
                        <option value="9">September</option>
                        <option value="10">October</option>
                        <option value="11">November</option>
                        <option value="12">December</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Process Button */}
          {selectedOption && (
            <div className="text-center pt-6">
              <button
                onClick={handleProcess}
                disabled={
                  (selectedOption === 'single' && !url) ||
                  (selectedOption === 'range' && (!baseUrl || !startYear || !endYear))
                }
                className="neumorphic-button px-12 py-4 rounded-2xl text-lg font-semibold text-gray-700 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Process Press Releases
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
