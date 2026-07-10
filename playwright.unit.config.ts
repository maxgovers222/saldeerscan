import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/unit',
  timeout: 10_000,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
})
