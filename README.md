# AI-Powered Web Content Summarizer

A powerful Next.js application that scrapes web content and generates professional business analyst summaries using AI. Perfect for quickly analyzing press releases, news articles, and other web content.

## 🚀 Features

- **Web Content Scraping**: Intelligently extracts meaningful content from web pages
- **AI-Powered Analysis**: Uses advanced AI models to generate professional summaries
- **Batch Processing**: Process multiple URLs efficiently
- **Professional Format**: Structured summaries with key sections like Executive Summary, Financial Highlights, and Strategic Implications
- **Export to DOCX**: Generate downloadable Word documents from summaries
- **Clean UI**: Modern, responsive interface built with Next.js and Tailwind CSS

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Web Scraping**: Cheerio
- **AI Integration**: OpenRouter API (Google Gemini 2.5 Flash Lite)
- **Document Generation**: docx library
- **Deployment**: Vercel-ready

## 📋 Prerequisites

Before running this application, make sure you have:

- Node.js 18+ installed
- An OpenRouter API key ([Get one here](https://openrouter.ai))

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ayushbh6/Summarizer.git
   cd Summarizer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Usage

### Single URL Analysis
1. Enter a URL in the input field on the homepage
2. Click "Analyze" to scrape and summarize the content
3. View the structured analysis with key insights
4. Download as DOCX if needed

### Batch Processing
1. Navigate to the batch processing page
2. Upload a list of URLs or enter them manually
3. Process multiple URLs simultaneously
4. Review all summaries in one place

## 📊 Summary Structure

Each generated summary includes:

- **Executive Summary**: Brief overview in 2-3 sentences
- **Key Announcements**: Main points and announcements
- **Financial Highlights**: Revenue, profits, and financial data
- **Strategic Implications**: Business impact and importance
- **Key Figures**: Important people mentioned
- **Timeline**: Critical dates and milestones
- **Market Impact**: Effects on market/industry

## 🔌 API Endpoints

### `/api/scrape-and-summarize`
- **Method**: POST
- **Body**: `{ "url": "https://example.com" }`
- **Response**: Structured summary of the webpage content

### `/api/scrape-and-summarize-batch`
- **Method**: POST
- **Body**: `{ "url": "https://example.com" }`
- **Response**: Summary optimized for batch processing

### `/api/generate-docx`
- **Method**: POST
- **Body**: `{ "summary": "...", "url": "..." }`
- **Response**: Downloadable DOCX file

### `/api/scrape-base-url`
- **Method**: POST
- **Body**: `{ "url": "https://example.com" }`
- **Response**: Basic scraped content without AI processing

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Add your `OPENROUTER_API_KEY` to Vercel environment variables
   - Deploy!

### Environment Variables for Production

Make sure to set these environment variables in your deployment platform:

- `OPENROUTER_API_KEY`: Your OpenRouter API key

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/Ayushbh6/Summarizer/issues) page
2. Create a new issue if your problem isn't already reported
3. Provide detailed information about your environment and the issue

## 🙏 Acknowledgments

- [OpenRouter](https://openrouter.ai) for AI API access
- [Next.js](https://nextjs.org) for the amazing React framework
- [Cheerio](https://cheerio.js.org) for server-side HTML parsing
- [Tailwind CSS](https://tailwindcss.com) for styling

---

**Made with ❤️ for efficient content analysis and summarization**
