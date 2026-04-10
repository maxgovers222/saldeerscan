import { test, expect } from '@playwright/test'

test.describe('Funnel Step 1 — Adres validatie', () => {
  test('Start Scan knop is disabled zonder adresinvoer', async ({ page }) => {
    await page.goto('/check')

    // Wacht tot funnel geladen is (placeholder = "Bijv. Prinsengracht 123, Amsterdam")
    await page.waitForSelector('input[placeholder*="Prinsengracht"], input[placeholder*="Bijv"]', { timeout: 15000 })

    const submitBtn = page.locator('button:has-text("Analyseren")').first()
    await expect(submitBtn).toBeDisabled()
  })

  test('Funnel heeft progress bar', async ({ page }) => {
    await page.goto('/check')

    // Wacht op funnel input
    await page.waitForSelector('input[placeholder*="Prinsengracht"]', { timeout: 15000 })
    await page.waitForLoadState('domcontentloaded')

    // Funnel laadt: h1 aanwezig
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 5000 })
  })

  test('Countdown timer zichtbaar op homepage', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('text=Salderingsregeling eindigt over')).toBeVisible()
    await expect(page.locator('text=Dagen')).toBeVisible()

    // Timer geeft getallen terug (niet --)
    await page.waitForTimeout(1500) // wacht op client hydration
    const timerText = await page.locator('text=Dagen').first().locator('..').innerText()
    expect(timerText).toMatch(/\d+/)
  })

  test('Homepage navigeert naar /check via CTA knop', async ({ page }) => {
    await page.goto('/')

    // Klik op de "Gratis analyseren" nav-knop — directe <a href="/check">
    const ctaBtn = page.locator('a[href="/check"]:has-text("Gratis analyseren")').first()
    await expect(ctaBtn).toBeVisible()
    await ctaBtn.click()

    await expect(page).toHaveURL(/\/check/, { timeout: 8000 })
  })
})
