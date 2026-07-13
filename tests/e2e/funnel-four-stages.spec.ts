import { expect, test } from '@playwright/test'
import { makeFunnelStateFixture } from '../fixtures/funnel-state'

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
