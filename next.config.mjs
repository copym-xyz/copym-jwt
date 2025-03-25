/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Fix for missing static files
  output: 'standalone',
  // Disable React DevTools in production
  productionBrowserSourceMaps: false,
  // Handle external image domains if needed
  images: {
    domains: [],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3001']
    },
  }
};

export default nextConfig;
