import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'performance-budget.spec.ts',
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'npm run start',
    port: 3000,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
