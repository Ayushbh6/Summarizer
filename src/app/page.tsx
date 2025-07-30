'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const handleTryNow = () => {
    router.push('/loader');
  };

  return (
    <div className="min-h-screen bg-gray-200 font-sans flex items-center justify-center px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <div className="neumorphic-card p-8 rounded-3xl text-center">
            <h1 className="text-4xl font-bold text-gray-700 mb-4">
              Press Release Summariser
            </h1>
            <p className="text-gray-600 text-lg">
              Transform lengthy press releases into clear, concise summaries
            </p>
          </div>
        </header>

        {/* Hero Section */}
        <main className="text-center">
          <div className="neumorphic-card p-12 rounded-3xl mb-8">
            <h2 className="text-5xl font-bold text-gray-800 mb-6">
              Simplify Your News
            </h2>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Get instant, intelligent summaries that capture the key points without the fluff.
            </p>
            
            <button 
              onClick={handleTryNow}
              className="neumorphic-button px-12 py-4 rounded-2xl text-lg font-semibold text-gray-700 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Try Now
            </button>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="neumorphic-card p-8 rounded-2xl text-center">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-4">AI-Powered Analysis</h3>
              <p className="text-gray-600">Advanced language models extract the most important information</p>
            </div>
            
            <div className="neumorphic-card p-8 rounded-2xl text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-4">Instant Results</h3>
              <p className="text-gray-600">Get your summary in seconds, not minutes</p>
            </div>
            
            <div className="neumorphic-card p-8 rounded-2xl text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-4">Key Points Focus</h3>
              <p className="text-gray-600">Highlights essential facts, figures, and announcements</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
