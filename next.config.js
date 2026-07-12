/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  webpack: (config, { isServer }) => {
    if (isServer) {
      const existing = Array.isArray(config.externals) ? config.externals : []
      config.externals = [...existing, 'better-sqlite3', 'formidable']
    } else {
      // Client bundle: tell webpack these Node modules don't exist in browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        os: false,
        'better-sqlite3': false,
        formidable: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
