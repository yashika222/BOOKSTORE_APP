/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['antd', '@ant-design/icons'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.gutenberg.org',
      },
      {
        protocol: 'https',
        hostname: 'gutenberg.org',
      },
      {
        protocol: 'https',
        hostname: 'covers.openlibrary.org',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

export default nextConfig;
