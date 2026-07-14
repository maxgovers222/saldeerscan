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

    // FunnelProgress: role="progressbar" + aria-label "Stap 1 van 6" (geen h1 in /check content)
    await expect(page.getByRole('progressbar', { name: /Stap 1 van 6/ })).toBeVisible({ timeout: 8000 })
  })

  test('Homepage toont de 2027-urgentie zonder client-countdown', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('Persoonlijk energieadvies voor 2027')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Wat kost stoppen met salderen u?' })).toBeVisible()
    await expect(page.getByText('Salderingsregeling eindigt over')).toHaveCount(0)
  })

  test('Homepage navigeert naar /check via CTA knop', async ({ page }) => {
    await page.goto('/')

    // Klik op de gedeelde header-CTA naar /check.
    const ctaBtn = page.getByRole('link', { name: 'Gratis check' })
    await expect(ctaBtn).toBeVisible()
    await ctaBtn.click()

    await expect(page).toHaveURL(/\/check/, { timeout: 8000 })
  })
})
