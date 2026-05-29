import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Add external image domains here per project
      // { protocol: 'https', hostname: 'example.com' },
    ],
  },
  turbopack: {
    // Pin workspace root to this project to suppress multi-lockfile warnings
    root: __dirname,
  },
}

export default withNextIntl(nextConfig)
