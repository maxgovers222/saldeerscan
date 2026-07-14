import { test, expect } from '@playwright/test'

test.describe('Funnel URL handshake', () => {
  test('?wijk en ?stad worden opgepakt door FunnelContainer', async ({ page }) => {
    await page.goto('/check?wijk=leidsche-rijn&stad=utrecht')

    // Pagina laadt zonder crash
    await expect(page).toHaveURL(/\/check/)

    await expect(page.getByRole('link', { name: 'SaldeerScan.nl', exact: true })).toBeVisible()
    await expect.poll(() => page.evaluate(() => {
      const stored = JSON.parse(localStorage.getItem('wep_funnel_state') ?? '{}')
      return [stored.state?.wijk, stored.state?.stad]
    })).toEqual(['leidsche-rijn', 'utrecht'])
  })

  test('Countdown timer zichtbaar op /check', async ({ page }) => {
    await page.goto('/check')

    // /check gebruikt <CountdownTimer compact /> — één regel i.p.v. Dagen/Uren-kaarten
    await expect(page.locator('text=saldering eindigt 1 jan 2027').first()).toBeVisible({ timeout: 15000 })
    await expect(page.locator('text=Nog').first()).toBeVisible()
  })

  test('?adres param prefilled op /check', async ({ page }) => {
    await page.goto('/check?adres=Keizersgracht+1+Amsterdam')

    await expect(page.getByRole('link', { name: 'SaldeerScan.nl', exact: true })).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Uw adres' }))
      .toHaveValue('Keizersgracht 1 Amsterdam')
  })
})
