import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

/** pSEO + kennisbank: veel parallelle Supabase-queries; iets lagere concurrency + hogere timeout voorkomt 60s SSG-fails. */
const nextConfig: NextConfig = {
  staticPageGenerationTimeout: 180,
  experimental: {
    staticGenerationMaxConcurrency: 4,
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
