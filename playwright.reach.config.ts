import { defineConfig } from '@playwright/test'
import baseConfig from './playwright.config'

if (process.env.REACH_FULL_CORPUS === '1' && !process.env.REACH_FULL_CORPUS_FILE) throw new Error('An explicit public-content snapshot is required')

// Isolated ports and build output keep the user's dev server untouched.
export default defineConfig({
  ...baseConfig,
  testIgnore: [],
  testMatch: process.env.REACH_FULL_CORPUS === '1' ? 'recovery-inventory.spec.ts' : process.env.REACH_PERFORMANCE === '1' ? 'performance-budget.spec.ts' : process.env.REACH_REGRESSION === '1'
    ? ['reach-recovery.spec.ts', 'analytics-contract.spec.ts', 'leadid-hydrate.spec.ts', 'report-responsive.spec.ts', 'step6-validatie.spec.ts', 'funnel-four-stages.spec.ts', 'funnel-handshake.spec.ts', 'pseo-content-quality.spec.ts', 'seo-canonical.spec.ts', 'sitemap.spec.ts', 'accessibility.spec.ts', 'netcongestie-article.spec.ts']
    : 'reach-recovery.spec.ts',
  workers: 1,
  timeout: process.env.REACH_PERFORMANCE === '1' ? 60_000 : 30_000,
  retries: 0,
  use: { ...baseConfig.use, baseURL: 'http://localhost:3116' },
  webServer: [
    {
      command: 'node tests/e2e/fixtures/pseo-mock-server.mjs',
      port: 54336, reuseExistingServer: false,
      env: { PSEO_MOCK_PORT: '54336', PSEO_MOCK_CORPUS_FILE: process.env.REACH_FULL_CORPUS === '1' ? process.env.REACH_FULL_CORPUS_FILE! : '' },
    },
    {
      command: process.env.REACH_PERFORMANCE === '1' ? 'npm run start -- --port 3116' : 'npm run dev -- --port 3116',
      port: 3116, reuseExistingServer: false, timeout: 180_000,
      env: {
        NEXT_DIST_DIR: process.env.REACH_FULL_CORPUS === '1' ? 'tmp/reach-recovery/full-corpus-next' : process.env.REACH_PERFORMANCE === '1' ? 'tmp/reach-recovery/next-build' : '.next-reach',
        NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54336',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'playwright-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'playwright-service-role',
        CRON_SECRET: 'reach-fixture-secret',
        UPSTASH_REDIS_REST_URL: '',
        UPSTASH_REDIS_REST_TOKEN: '',
        NEXT_PUBLIC_GA_MEASUREMENT_ID: '',
      },
    },
  ],
})
