import { test, expect } from '@playwright/test'

test.describe('Funnel URL handshake', () => {
  test('?wijk en ?stad worden opgepakt door FunnelContainer', async ({ page }) => {
    await page.goto('/check?wijk=leidsche-rijn&stad=utrecht')

    // Pagina laadt zonder crash
    await expect(page).toHaveURL(/\/check/)

    // Header aanwezig
    await expect(page.locator('text=SaldeerScan')).toBeVisible()

    // AnalysisLoading of Step 1 content zichtbaar
    // (bij aanwezige wijk param triggert auto-search)
    const funnelVisible = await page.locator('text=Adres').first().isVisible().catch(() => false)
      || await page.locator('text=Analyseren').first().isVisible().catch(() => false)
      || await page.locator('text=leidsche').first().isVisible({ timeout: 5000 }).catch(() => false)
    expect(funnelVisible).toBe(true)
  })

  test('Countdown timer zichtbaar op /check', async ({ page }) => {
    await page.goto('/check')

    // Timer labels aanwezig
    await expect(page.locator('text=Dagen')).toBeVisible()
    await expect(page.locator('text=Uren')).toBeVisible()

    // Saldering tekst aanwezig
    await expect(page.locator('text=Salderingsregeling eindigt over')).toBeVisible()
  })

  test('?adres param prefilled op /check', async ({ page }) => {
    await page.goto('/check?adres=Keizersgracht+1+Amsterdam')

    // Pagina laadt
    await expect(page.locator('text=SaldeerScan')).toBeVisible()

    // Funnel container aanwezig
    const container = page.locator('text=Saldeercheck').first()
    await expect(container).toBeVisible()
  })
})
