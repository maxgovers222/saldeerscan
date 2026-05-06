import { test, expect } from '@playwright/test'

/**
 * Golden wijken — zelfde DB-batch als productie-seed (wijk smoke).
 */
const WIJK_URLS = [
  '/utrecht/utrecht/leidsche-rijn',
  '/overijssel/zwolle/stadshagen',
]

/**
 * Wijk-URL's die na `npm run seed:pseo` (SAMPLE_PAGES) minstens één straat-pagina hebben.
 * Wordt gebruikt vóór golden wijken zodat straat-E2E lokaal/CI betrouwbaar draait.
 */
const WIJK_URLS_WITH_SAMPLE_STREETS = [
  '/utrecht/utrecht/oost',
  '/noord-holland/amsterdam/centrum',
  '/zuid-holland/rotterdam/feijenoord',
  '/noord-brabant/eindhoven/strijp',
  '/gelderland/arnhem/presikhaaf',
]

const NET_BADGE_TEXTS = ['ROOD', 'ORANJE', 'GROEN']

/** Relatief pad met precies 4 segmenten: /provincie/stad/wijk/straat */
function isStraatPath(href: string | null): href is string {
  if (!href || !href.startsWith('/')) return false
  const parts = href.split('/').filter(Boolean)
  return parts.length === 4
}

for (const url of WIJK_URLS.slice(0, 6)) {
  test(`Wijk pagina laadt correct: ${url}`, async ({ page }) => {
    const response = await page.goto(url)

    test.skip(
      response?.status() === 404,
      `pSEO niet gebouwd (404) — run build/seed voor golden batch: ${url}`,
    )
    expect(response?.status()).not.toBe(404)

    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible()
    const h1Text = await h1.innerText()
    expect(h1Text.trim().length).toBeGreaterThan(2)

    const hasNetBadge = await page.evaluate((texts) => {
      const body = document.body.innerText
      return texts.some(t => body.includes(t))
    }, NET_BADGE_TEXTS)
    expect(hasNetBadge).toBe(true)

    const ribbonCards = page.locator('text=Grid Status')
    await expect(ribbonCards.first()).toBeVisible()
  })
}

test('Straat pagina (via populaire straten op wijk)', async ({ page }) => {
  const candidates = [...WIJK_URLS_WITH_SAMPLE_STREETS, ...WIJK_URLS]

  for (const wijkUrl of candidates) {
    const wijkResp = await page.goto(wijkUrl)
    if (wijkResp?.status() === 404) continue

    const section = page.getByTestId('pseo-populaire-straten')
    if ((await section.count()) === 0) continue

    const straatLinks = section.locator('a[href^="/"]')
    if ((await straatLinks.count()) === 0) continue

    const href = await straatLinks.first().getAttribute('href')
    if (!isStraatPath(href)) continue

    const streetResp = await page.goto(href)
    if (streetResp?.status() === 404) continue

    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible()
    const h1Text = await h1.innerText()
    expect(h1Text.trim().length).toBeGreaterThan(2)

    const breadcrumb = page.locator('nav').filter({ hasText: 'Home' }).first()
    await expect(breadcrumb).toBeVisible({ timeout: 5000 })

    await expect(page.locator('a:has-text("Check uw woning")').first()).toBeVisible()
    return
  }

  test.skip(
    true,
    'Geen wijk met "Populaire straten" — run o.a. `npm run seed:pseo` of seed straat-batch voor golden wijken.',
  )
})
