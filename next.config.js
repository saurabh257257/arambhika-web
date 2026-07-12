/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Allow images from the uploads directory
  images: { unoptimized: true },
}

module.exports = nextConfig
