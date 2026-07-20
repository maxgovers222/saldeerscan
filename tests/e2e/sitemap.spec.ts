import { expect, test } from '@playwright/test'

test('root sitemap serves the named sitemap index', async ({ request }) => {
  const response = await request.get('/sitemap.xml')
  const xml = await response.text()

  expect(response.ok()).toBe(true)
  expect(response.headers()['content-type']).toContain('application/xml')
  expect(xml).toContain('<sitemapindex')
  expect(xml).toContain('/sitemap/core.xml')
  expect(xml).toContain('/sitemap/utrecht.xml')
  expect(xml).toContain('/sitemap/postcodes.xml')
  expect(xml).not.toContain('/sitemap/0.xml')
})

test('core sitemap resolves through the Next metadata route', async ({ request }) => {
  const response = await request.get('/sitemap/core.xml')
  const xml = await response.text()

  expect(response.ok()).toBe(true)
  expect(xml).toContain('<urlset')
  expect(xml).toContain('<loc>https://saldeerscan.nl</loc>')
  expect(xml).toContain('<loc>https://saldeerscan.nl/methode</loc>')
})
