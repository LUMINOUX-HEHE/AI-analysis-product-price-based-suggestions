/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable image optimization for development
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
