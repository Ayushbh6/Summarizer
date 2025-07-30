import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployments
  output: 'standalone',
  
  // Optimize images for production
  images: {
    unoptimized: true,
  },
  
  // Configure external packages for server components
  serverExternalPackages: ['cheerio'],
};

export default nextConfig;
