import { expect, test } from '@playwright/test'
import {
  expectedExistingPanelsReportFixture,
  expectedReportFixture,
} from '../fixtures/report'
import { seedReportState } from './fixtures/report-state'

test('mobile shows the key result, metrics, disclosures and PDF action', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedReportState(page, expectedReportFixture)
  await page.goto('/check')
  await page.getByRole('button', { name: 'Doorgaan' }).click()

  await expect(page.getByTestId('report-annual-loss')).toBeVisible()
  await expect(page.getByTestId('report-supporting-metrics')).toBeVisible()
  await expect(page.getByRole('group', { name: 'Uw aanbevolen oplossing' })).toBeVisible()
  await expect(page.getByRole('button', { name: /PDF-rapport/ })).toBeVisible()
  await expect(page.getByTestId('report-desktop-grid')).toBeHidden()
})

test('desktop is full width without a mobile-to-desktop hydration switch', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await seedReportState(page, expectedReportFixture)
  await page.goto('/check')
  await page.getByRole('button', { name: 'Doorgaan' }).click()
  await expect(page.getByTestId('report-desktop-grid')).toBeVisible()
  await expect(page.getByTestId('report-mobile-details')).toBeHidden()
  const before = await page.getByTestId('report-root').boundingBox()
  await page.waitForTimeout(500)
  const after = await page.getByTestId('report-root').boundingBox()
  expect(after?.width).toBe(before?.width)
})

test('email failure never claims the report was sent', async ({ page }) => {
  await seedReportState(page, {
    ...expectedReportFixture,
    delivery: { emailStatus: 'failed' },
  })
  await page.goto('/check')
  await page.getByRole('button', { name: 'Doorgaan' }).click()
  await expect(page.getByText('Aanvraag ontvangen')).toBeVisible()
  await expect(page.getByText(/e-mail kon niet worden verstuurd/i)).toBeVisible()
  await expect(page.getByText(/verzonden naar uw e-mail/i)).toHaveCount(0)
})

test('existing panels show an upgrade recommendation on web', async ({ page }) => {
  await seedReportState(page, expectedExistingPanelsReportFixture)
  await page.goto('/check')
  await page.getByRole('button', { name: 'Doorgaan' }).click()
  await expect(page.getByText('Thuisbatterij en slim verbruik')).toBeVisible()
  await expect(page.getByText(/10 bestaande panelen/i)).toBeVisible()
  await expect(page.getByText(/€360.*extra/i)).toBeVisible()
})
