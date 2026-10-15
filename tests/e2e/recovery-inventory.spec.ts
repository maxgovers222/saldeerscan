import { expect, test } from '@playwright/test'
import registry from '../../lib/pseo-recovery-registry.json'

test.skip(process.env.REACH_FULL_CORPUS !== '1', 'Requires the complete public-content snapshot, not the small journey fixture')
const locations = (xml: string) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]).pathname)

test('all 2275 audited records survive paginated discovery with the two explicit orphan exceptions', async ({ request }) => {
  const provinces = [...new Set(registry.entries.map(entry => entry.path.split('/')[1]))]
  const paths: string[] = []
  for (const province of provinces) {
    const response = await request.get(`/sitemap/${province}.xml`)
    expect(response.status()).toBe(200)
    paths.push(...locations(await response.text()))
  }
  expect(new Set(paths).size).toBe(paths.length)
  expect(paths.filter(path => path.split('/').length === 2)).toHaveLength(12)
  expect(paths.filter(path => path.split('/').length === 3)).toHaveLength(340)
  expect(paths.filter(path => path.split('/').length >= 4)).toHaveLength(2273)
  const orphans = new Set(['/noord-brabant/eindhoven/strijp/kastanjelaan', '/noord-holland/amsterdam/centrum/prinsengracht'])
  for (const entry of registry.entries) {
    if (orphans.has(entry.path)) expect(paths).not.toContain(entry.path)
    else expect(paths).toContain(entry.path)
    if (entry.sourceSlug !== entry.path) expect(paths).not.toContain(entry.sourceSlug)
  }
})

test('recent traffic pages, repaired source pages and orphan exceptions render from the complete snapshot', async ({ page }) => {
  for (const path of [
    '/zuid-holland/rotterdam/ijsselmonde', '/gelderland/arnhem/geitenkamp',
    '/noord-holland/purmerend/purmerend-noord', '/zuid-holland/rotterdam/charlois', '/noord-brabant/waalwijk/waalwijk-noord',
  ]) {
    expect((await page.goto(path))?.status()).toBe(200)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://saldeerscan.nl${path}`)
    expect(await page.evaluate(() => document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '')).not.toContain('noindex')
    expect(await page.locator('body').innerText()).not.toMatch(/score\s+\d+\/100|netcongestie\s+(ROOD|ORANJE|GROEN)|€\s?\d/u)
  }
  for (const path of ['/noord-brabant/eindhoven/strijp/kastanjelaan', '/noord-holland/amsterdam/centrum/prinsengracht']) {
    expect((await page.goto(path))?.status()).toBe(200)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    const missingParent = path.split('/').slice(0, -1).join('/')
    await expect(page.locator(`a[href="${missingParent}"]`)).toHaveCount(0)
  }
})
