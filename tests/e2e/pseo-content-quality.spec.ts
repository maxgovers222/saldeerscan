import { expect, test, type Page } from '@playwright/test'
import registry from '../../lib/pseo-recovery-registry.json'

const site = 'https://saldeerscan.nl'
async function robots(page: Page) { return page.evaluate(() => document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '') }
const locations = (xml: string) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1])

for (const copy of registry.reviewed) {
  test(`reviewed ${copy.path} shows its exact source scope and retains its canonical`, async ({ page }, testInfo) => {
    const response = await page.goto(copy.path)
    expect(response?.status()).toBe(200)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', site + copy.path)
    expect(await robots(page)).not.toContain('noindex')
    const facts = page.getByTestId('reviewed-location-facts')
    await expect(facts).toContainText(copy.content.source_evidence[0].scope.code)
    await expect(facts).toContainText(copy.content.aantal_woningen.toLocaleString('nl-NL'))
    await expect(page.getByTestId('location-reviewed-body')).toHaveText(/Salderen stopt op 1 januari 2027/)
    const body = await page.locator('body').innerText()
    expect(body).not.toMatch(/score\s+\d+\/100|netcongestie\s+(ROOD|ORANJE|GROEN)|stapsgewijs|batterij is essentieel/i)
    for (const block of await page.locator('script[type="application/ld+json"]').allTextContents()) {
      expect(() => JSON.parse(block)).not.toThrow()
      expect(block).not.toMatch(/stapsgewijs|ROOD|health_score|€\s?\d/u)
    }
    if (copy.path.endsWith('/born')) await expect(facts).toContainText('niet de volledige woonplaats Born')
    if (copy.path.endsWith('/ijsselmonde')) {
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      await page.screenshot({ path: `tmp/reach-recovery/source-page-${testInfo.project.name}.png`, fullPage: true })
    }
  })
}

for (const path of ['/noord-holland/purmerend/purmerend-noord', '/noord-brabant/waalwijk/waalwijk-noord', '/utrecht/utrecht/oost/biltstraat']) {
  test(`audited route ${path} keeps discovery while unsupported claims stay hidden`, async ({ page }) => {
    expect((await page.goto(path))?.status()).toBe(200)
    expect(await robots(page)).not.toContain('noindex')
    await expect(page.getByTestId('reviewed-location-facts')).toHaveCount(0)
    await expect(page.getByTestId('location-reviewed-body')).toContainText('nog onvoldoende onderbouwd')
    expect(await page.locator('body').innerText()).not.toMatch(/score\s+\d+\/100|€\s?\d|netcongestie\s+(ROOD|ORANJE|GROEN)/u)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', site + path)
  })
}

test('a newly generated unreviewed street is noindex and absent from discovery', async ({ page, request }) => {
  const path = '/noord-holland/haarlemmermeer/hoofddorp/teststraat'
  expect((await page.goto(path))?.status()).toBe(200)
  expect(await robots(page)).toContain('noindex')
  const xml = await (await request.get('/sitemap/noord-holland.xml')).text()
  expect(locations(xml)).not.toContain(site + path)
  expect(await page.locator('body').innerText()).not.toMatch(/score\s+\d+\/100|€\s?\d/u)
})

test('reviewed and retained repair routes have the same sitemap and parent eligibility', async ({ page, request }) => {
  for (const province of ['utrecht', 'noord-holland', 'zuid-holland', 'noord-brabant', 'limburg', 'gelderland']) {
    const response = await request.get(`/sitemap/${province}.xml`)
    expect(response.ok()).toBe(true)
    const urls = locations(await response.text())
    for (const copy of registry.reviewed.filter(copy => copy.path.startsWith(`/${province}/`))) {
      expect(urls).toContain(site + copy.path)
      const city = copy.path.split('/').slice(0, 3).join('/')
      expect(urls).toContain(site + city)
    }
    expect(urls).toContain(`${site}/${province}`)
  }
  for (const path of ['/noord-holland/haarlemmermeer', '/zuid-holland/rotterdam', '/zuid-holland']) {
    expect((await page.goto(path))?.status()).toBe(200)
    expect(await robots(page)).not.toContain('noindex')
    expect(await page.locator('body').innerText()).not.toMatch(/Score \d+|€\s?\d/u)
  }
})

test('exact Fryslan alias redirects resolve directly to the same existing record under Friesland', async ({ request, page }) => {
  const old = '/fryslan/leeuwarden/binnenstad'
  const canonical = '/friesland/leeuwarden/binnenstad'
  const redirect = await request.get(old, { maxRedirects: 0 })
  expect(redirect.status()).toBe(301)
  expect(redirect.headers().location).toBe(canonical)
  expect((await page.goto(canonical))?.status()).toBe(200)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', site + canonical)
  const xml = await (await request.get('/sitemap/friesland.xml')).text()
  expect(locations(xml)).toContain(site + canonical)
  expect(xml).not.toContain('/fryslan/')
})

test('postcode pages make no unsupported neighborhood or network claims; variants use a base canonical', async ({ page }) => {
  await page.goto('/postcode/1012AB')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', site + '/postcode/1012')
  expect(await robots(page)).toContain('noindex')
  expect(await page.locator('body').innerText()).not.toMatch(/Score \d+|ROOD|ORANJE|GROEN|wijkanalyses/u)
  await expect(page.getByRole('heading', { name: 'Wat kunt u hier controleren?' })).toBeVisible()
})
