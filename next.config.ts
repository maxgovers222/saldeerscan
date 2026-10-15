import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'
import { EXACT_GSC_REDIRECTS } from './lib/gsc-redirects'
import recoveryRegistry from './lib/pseo-recovery-registry.json'

/** pSEO + kennisbank: veel parallelle Supabase-queries; iets lagere concurrency + hogere timeout voorkomt 60s SSG-fails. */
const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  staticPageGenerationTimeout: 180,
  experimental: {
    staticGenerationMaxConcurrency: 4,
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host' as const, value: 'www.saldeerscan.nl' }],
        destination: 'https://saldeerscan.nl/:path*',
        permanent: true,
      },
      ...[...EXACT_GSC_REDIRECTS, ...recoveryRegistry.redirects].map(({ source, destination }) => ({
      // `:` is speciale path-to-regexp-syntax; escape hem zodat alleen deze URL matcht.
      source: source.replaceAll(':', '\\:'),
      destination,
      statusCode: 301 as const,
      })),
    ]
  },
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/sitemap-index.xml',
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  org: 'saldeerscan',
  project: 'saldeerscan-nextjs',
  silent: true,
  widenClientFileUpload: true,
  disableLogger: true,
  // Sentry draait alleen als NEXT_PUBLIC_SENTRY_DSN is ingesteld
  // Zonder DSN initialiseert Sentry stil zonder fouten te gooien
})
