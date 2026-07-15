import { expect, test } from '@playwright/test'
import { makeFunnelStateFixture } from '../fixtures/funnel-state'
import { seedFunnelAtInternalStep } from './fixtures/funnel-state'

const visualStageCases = [
  { internalStep: 1, visualStage: 1, label: 'Uw woning' },
  { internalStep: 2, visualStage: 2, label: 'Uw situatie' },
  { internalStep: 3, visualStage: 3, label: 'Verfijn uw advies' },
  { internalStep: 4, visualStage: 3, label: 'Verfijn uw advies' },
  { internalStep: 5, visualStage: 3, label: 'Verfijn uw advies' },
  { internalStep: 6, visualStage: 4, label: 'Ontvang uw rapport' },
] as const

const acceptanceViewports = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 900 },
  { width: 1440, height: 1000 },
] as const

for (const { internalStep, visualStage, label } of visualStageCases) {
  test(`internal step ${internalStep} toont klantstadium ${visualStage}`, async ({ page }) => {
    await seedFunnelAtInternalStep(page, internalStep)
    await page.goto('/check')
    await page.getByRole('button', { name: 'Doorgaan', exact: true }).click()

    await expect(page.getByRole('progressbar', {
      name: `Stadium ${visualStage} van 4: ${label}`,
    })).toBeVisible()
  })
}

for (const internalStep of [3, 6] as const) {
  for (const viewport of acceptanceViewports) {
    test(`internal step ${internalStep} blijft binnen ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await seedFunnelAtInternalStep(page, internalStep)
      await page.goto('/check')
      await page.getByRole('button', { name: 'Doorgaan', exact: true }).click()

      const width = await page.evaluate(() => ({
        document: document.documentElement.scrollWidth,
        viewport: document.documentElement.clientWidth,
      }))
      expect(width.document).toBeLessThanOrEqual(width.viewport)
    })
  }
}

test('explicit adres is not overwritten by saved state', async ({ page }) => {
  const state = makeFunnelStateFixture({ adres: 'Oud adres', step: 4 })
  await page.addInitScript(({ state }) => {
    localStorage.setItem('wep_funnel_state', JSON.stringify({
      version: 2,
      savedAt: Date.now(),
      state,
    }))
  }, { state })
  await page.goto('/check?adres=Nieuw%20adres')
  await expect(page.getByText('Vorige sessie gevonden')).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Uw adres' })).toHaveValue('Nieuw adres')
  await page.getByRole('button', { name: 'Deze link gebruiken' }).click()
  await expect(page.getByText('Vorige sessie gevonden')).toHaveCount(0)
  await expect(page.getByRole('combobox', { name: 'Uw adres' })).toHaveValue('Nieuw adres')
})
