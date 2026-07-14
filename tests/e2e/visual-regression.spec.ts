import { expect, test, type Page } from '@playwright/test'
import { expectedReportFixture } from '../fixtures/report'
import { seedFunnelAtInternalStep } from './fixtures/funnel-state'
import { seedReportState } from './fixtures/report-state'

const homepageSizes = [
  { name: '360', width: 360, height: 800 },
  { name: '390', width: 390, height: 844 },
  { name: '768', width: 768, height: 1024 },
  { name: '1024', width: 1024, height: 900 },
  { name: '1440', width: 1440, height: 1000 },
]

async function mockDynamicStats(page: Page) {
  await page.route('**/api/stats', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ count: 120, minGeleden: null }),
  }))
}

async function waitForVisualReady(page: Page) {
  await page.evaluate(() => document.fonts.ready)
}

for (const size of homepageSizes) {
  test(`homepage ${size.name}`, async ({ page }) => {
    await page.setViewportSize({ width: size.width, height: size.height })
    await mockDynamicStats(page)
    await page.goto('/')
    await waitForVisualReady(page)

    const socialProof = page.getByTestId('social-proof-dynamic')
    await expect(socialProof).toBeVisible()
    const mask = await socialProof.count() > 0 ? [socialProof] : []
    await expect(page).toHaveScreenshot(`home-${size.name}.png`, {
      fullPage: true,
      mask,
    })
  })
}

test('funnel step 2 mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mockDynamicStats(page)
  await seedFunnelAtInternalStep(page, 2)
  await page.goto('/check')
  await page.getByRole('button', { name: 'Doorgaan', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Uw besparingsanalyse' })).toBeVisible()
  await expect(page.getByText('Herberekenen...')).toHaveCount(0)
  await waitForVisualReady(page)

  await expect(page).toHaveScreenshot('funnel-step-2-mobile.png', {
    fullPage: true,
  })
})

for (const viewport of [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 1000 },
]) {
  test(`report ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await mockDynamicStats(page)
    await seedReportState(page, expectedReportFixture)
    await page.goto('/check')
    await page.getByRole('button', { name: 'Doorgaan', exact: true }).click()
    await expect(page.getByTestId('report-root')).toBeVisible()
    await expect(page.getByRole('button', { name: /PDF-rapport/ })).toBeVisible()
    await waitForVisualReady(page)

    await expect(page).toHaveScreenshot(`report-${viewport.name}.png`, {
      fullPage: true,
    })
  })
}
