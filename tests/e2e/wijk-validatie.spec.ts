import { test, expect } from '@playwright/test'

/**
 * Gebruik alleen wijken die aantoonbaar in de DB zitten (golden batch).
 * Voeg meer toe zodra seed:wijken meer wijken genereert.
 */
const WIJK_URLS = [
  '/utrecht/utrecht/leidsche-rijn',
  '/overijssel/zwolle/stadshagen',
]

const NET_BADGE_TEXTS = ['ROOD', 'ORANJE', 'GROEN']

for (const url of WIJK_URLS.slice(0, 6)) {
  test(`Wijk pagina laadt correct: ${url}`, async ({ page }) => {
    const response = await page.goto(url)

    // Pagina moet 200 teruggeven (niet 404)
    expect(response?.status()).not.toBe(404)

    // <h1> moet zichtbaar zijn en niet leeg
    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible()
    const h1Text = await h1.innerText()
    expect(h1Text.trim().length).toBeGreaterThan(2)

    // Netcongestie indicator: één van de drie statussen moet zichtbaar zijn
    const hasNetBadge = await page.evaluate((texts) => {
      const body = document.body.innerText
      return texts.some(t => body.includes(t))
    }, NET_BADGE_TEXTS)
    expect(hasNetBadge).toBe(true)

    // Data ribbon aanwezig (3 kaarten)
    const ribbonCards = page.locator('text=Grid Status')
    await expect(ribbonCards.first()).toBeVisible()
  })
}
