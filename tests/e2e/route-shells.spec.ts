import { expect, test } from '@playwright/test'

const pseoRoutes = [
  {
    path: '/noord-holland',
    h1: /Zonnepanelen Noord-Holland/i,
    schema: 'CollectionPage',
  },
  {
    path: '/noord-holland/amsterdam',
    h1: /Zonnepanelen Amsterdam/i,
    schema: 'CollectionPage',
  },
  {
    path: '/utrecht/utrecht/leidsche-rijn',
    h1: /Leidsche Rijn/i,
    schema: 'BreadcrumbList',
  },
  {
    path: '/postcode/1012',
    h1: /Zonnepanelen postcode 1012/i,
    schema: 'BreadcrumbList',
  },
] as const

const wijkRoutesWithSampleStreets = [
  '/utrecht/utrecht/oost',
  '/noord-holland/amsterdam/centrum',
  '/zuid-holland/rotterdam/feijenoord',
  '/noord-brabant/eindhoven/strijp',
  '/gelderland/arnhem/presikhaaf',
  '/utrecht/utrecht/leidsche-rijn',
  '/overijssel/zwolle/stadshagen',
] as const

function isStreetPath(href: string | null): href is string {
  if (!href?.startsWith('/')) return false
  return href.split('/').filter(Boolean).length === 4
}

for (const route of pseoRoutes) {
  test(`${route.path} behoudt shell, H1, canonical en schema`, async ({ page }) => {
    const response = await page.goto(route.path)
    test.skip(response?.status() === 404, `Fixture ontbreekt voor ${route.path}`)

    await expect(page.getByRole('navigation', { name: 'Hoofdnavigatie' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: route.h1 })).toBeVisible()
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      new RegExp(
        `https://saldeerscan\\.nl${route.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
      ),
    )
    const schema = (
      await page.locator('script[type="application/ld+json"]').allTextContents()
    ).join('\n')
    expect(schema).toContain(route.schema)
    await expect(page.getByTestId('pseo-conversion-entry')).toBeVisible()
  })
}

for (const path of ['/check', '/kennisbank', '/nieuws', '/privacy']) {
  test(`${path} gebruikt de gedeelde site shell`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('navigation', { name: 'Hoofdnavigatie' })).toBeVisible()
    await expect(page.locator('main h1')).toBeVisible()
    await expect(page.getByRole('contentinfo')).toBeVisible()
  })
}

test('straatroute behoudt conversie, kruimelpad en FAQ-filtering', async ({ page }) => {
  for (const wijkPath of wijkRoutesWithSampleStreets) {
    const wijkResponse = await page.goto(wijkPath)
    if (wijkResponse?.status() === 404) continue

    const streets = page.getByTestId('pseo-populaire-straten').locator('a[href^="/"]')
    if ((await streets.count()) === 0) continue

    const href = await streets.first().getAttribute('href')
    if (!isStreetPath(href)) continue

    const streetResponse = await page.goto(href)
    if (streetResponse?.status() === 404) continue

    await expect(page.getByTestId('pseo-conversion-entry')).toBeVisible()
    await expect(page.locator('script[type="application/ld+json"]')).not.toContainText(
      '"@type":"FAQPage"',
    )
    await expect(page.getByRole('navigation', { name: 'Kruimelpad' })).toBeVisible()
    return
  }

  test.skip(true, 'Geen lokale straatfixture beschikbaar; voer de pSEO-seed uit.')
})
