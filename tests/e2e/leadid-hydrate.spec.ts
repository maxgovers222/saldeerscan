import { test, expect } from '@playwright/test'
import { expectedReportFixture } from '../fixtures/report'

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
    __captureGtag: (...args: unknown[]) => void
  }
}

// Alleen desktop — mobile-chrome project vereist volledige `playwright install` op sommige Windows-setup
test.use({ ...require('@playwright/test').devices['Desktop Chrome'] })

/** Vaste UUID voor route-mock; hoeft niet in Supabase te bestaan. */
const MOCK_LEAD_ID = '11111111-1111-4111-8111-111111111111'
const MOCK_LEAD_API_PATH = `/api/leads/${MOCK_LEAD_ID}`
/** Token in URL triggert dezelfde fetch als productie (`?token=`); waarde wordt door de mock genegeerd. */
const MOCK_URL_TOKEN = 'e2e-mock-token'

test.describe('Email leadId rapport-hydratie', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.removeItem('wep_funnel_state')
      } catch {
        /* ignore */
      }
    })
  })

  test('?leadId= laadt mock-API en toont volledig rapport (non-zero)', async ({ page }) => {
    test.setTimeout(60_000)
    const captured: unknown[][] = []
    await page.exposeFunction('__captureGtag', (...args: unknown[]) => {
      captured.push(args)
    })
    await page.addInitScript(() => {
      window.gtag = (...args: unknown[]) => {
        window.__captureGtag(...args)
      }
    })
    await page.route(
      (url: URL) => url.pathname === MOCK_LEAD_API_PATH,
      async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            leadId: MOCK_LEAD_ID,
            report: expectedReportFixture,
          }),
        })
      },
    )

    await page.goto(
      `/check?leadId=${MOCK_LEAD_ID}&token=${encodeURIComponent(MOCK_URL_TOKEN)}`,
      { waitUntil: 'domcontentloaded', timeout: 45_000 },
    )

    await expect(page.getByTestId('report-root')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByTestId('report-annual-loss')).toContainText('400')
    await expect(page.locator('text=Vorige sessie gevonden')).toHaveCount(0)

    await expect.poll(() => captured.filter(event =>
      event[0] === 'event' && event[1] === 'report_reopened',
    ).length).toBe(1)
    const reopened = captured.find(event =>
      event[0] === 'event' && event[1] === 'report_reopened',
    )!
    const payload = reopened[2] as Record<string, unknown>
    expect(payload.report_version).toBe(1)
    expect(Object.keys(payload).sort()).toEqual(['email_status', 'report_version'])
    expect(JSON.stringify(payload)).not.toContain(MOCK_LEAD_ID)
    expect(JSON.stringify(payload)).not.toContain(MOCK_URL_TOKEN)
  })

  test('?leadId= zonder token stabiliseert en claimt bij failure geen verzending', async ({ page }) => {
    let requestCount = 0
    await page.route(
      (url: URL) => url.pathname === MOCK_LEAD_API_PATH,
      async route => {
        requestCount += 1
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            leadId: MOCK_LEAD_ID,
            report: {
              ...expectedReportFixture,
              delivery: { emailStatus: 'failed' },
            },
          }),
        })
      },
    )

    await page.goto(`/check?leadId=${MOCK_LEAD_ID}`, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    })

    await expect(page.getByTestId('report-root')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Download het volledige rapport hieronder als PDF.')).toBeVisible()
    await expect(page.getByText(/verstuurd naar uw e-mail/i)).toHaveCount(0)
    await page.waitForTimeout(750)
    const settledRequestCount = requestCount
    expect(settledRequestCount).toBeLessThanOrEqual(2)
    await page.waitForTimeout(750)
    expect(requestCount).toBe(settledRequestCount)
  })

  test('?leadId= bij 404 toont fouttekst, geen dashboard', async ({ page }) => {
    await page.route(
      (url: URL) => url.pathname === MOCK_LEAD_API_PATH,
      async route => {
        await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' })
      },
    )

    await page.goto(
      `/check?leadId=${MOCK_LEAD_ID}&token=${encodeURIComponent(MOCK_URL_TOKEN)}`,
      { waitUntil: 'domcontentloaded', timeout: 45_000 },
    )

    await expect(page.locator('text=Rapport niet gevonden')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('text=Uw SaldeerScan rapport')).toHaveCount(0)
  })
})
