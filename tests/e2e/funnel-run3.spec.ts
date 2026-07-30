import { expect, test, type Page } from '@playwright/test'
import { seedFunnelAtInternalStep } from './fixtures/funnel-state'

async function resumeSavedFunnel(page: Page) {
  await page.getByRole('button', { name: 'Doorgaan', exact: true }).click()
}

test('stage 3 maakt het rapport primair en technische checks optioneel op mobiel', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedFunnelAtInternalStep(page, 3, {
    funnelSessionId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    meterkastAnalyse: null,
    plaatsingsAnalyse: null,
    omvormerAnalyse: null,
  })
  await page.goto('/check')
  await resumeSavedFunnel(page)

  const directReport = page.getByRole('button', { name: /Direct naar mijn rapport/ })
  const refinement = page.getByTestId('technical-refinement')
  await expect(page.getByRole('heading', { name: 'Uw basisrapport is klaar' })).toBeVisible()
  await expect(directReport).toBeVisible()
  await expect(directReport).toHaveClass(/bg-action/)
  await expect(refinement).not.toHaveAttribute('open', '')
  await expect(page.getByRole('button', { name: /Foto van uw meterkast/ })).not.toBeVisible()

  await page.getByText('Mijn advies verfijnen', { exact: true }).click()
  await expect(refinement).toHaveAttribute('open', '')
  await expect(page.getByRole('button', { name: /Foto van uw meterkast/ })).toBeVisible()
})

test('stage 4 toont contact en trustcopy voor de ingeklapte rapportsamenvatting op mobiel', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedFunnelAtInternalStep(page, 6)
  await page.goto('/check')
  await resumeSavedFunnel(page)

  const nameInput = page.locator('#lead-naam')
  const reportDetails = page.getByTestId('stage4-report-details')
  const reportSummary = page.getByText('Rapportsamenvatting bekijken', { exact: true })
  await expect(nameInput).toBeVisible()
  await expect(page.locator('#lead-email')).toBeVisible()
  await expect(page.locator('#lead-telefoon')).toBeVisible()
  await expect(reportDetails).not.toHaveAttribute('open', '')
  await expect(page.getByText('Dit staat in uw PDF-rapport')).not.toBeVisible()
  await expect(page.getByTestId('stage4-cta-trustcopy')).toHaveText(
    'Rapport opent direct · e-mailkopie · gratis en vrijblijvend',
  )

  const nameBox = await nameInput.boundingBox()
  const summaryBox = await reportSummary.boundingBox()
  expect(nameBox).not.toBeNull()
  expect(summaryBox).not.toBeNull()
  expect(nameBox!.y).toBeLessThan(summaryBox!.y)

  await reportSummary.click()
  await expect(page.getByText('Dit staat in uw PDF-rapport')).toBeVisible()

  await page.getByLabel('Landcode').selectOption('+32')
  await page.locator('#lead-telefoon').fill('0478123456')
  await expect(page.locator('#lead-telefoon')).toHaveValue('0478123456')
  await page.locator('#lead-gdpr').click({ force: true })
  await expect(page.locator('#lead-gdpr')).toBeChecked()
})

test('stage 4 houdt de rapportsamenvatting en contactvelden beschikbaar op desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await seedFunnelAtInternalStep(page, 6)
  await page.goto('/check')
  await resumeSavedFunnel(page)

  await expect(page.getByTestId('stage4-report-details')).toHaveJSProperty('open', true)
  await expect(page.getByText('Dit staat in uw PDF-rapport')).toBeVisible()
  await expect(page.locator('#lead-naam')).toBeVisible()
  await expect(page.getByText('Rapportsamenvatting bekijken', { exact: true })).not.toBeVisible()
})
