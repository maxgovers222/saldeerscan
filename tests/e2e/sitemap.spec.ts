import { expect, test } from '@playwright/test'

function sitemapLocations(xml: string): string[] {
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), match => match[1])
}

function sitemapUrlBlock(xml: string, url: string): string {
  return (
    Array.from(xml.matchAll(/<url>[\s\S]*?<\/url>/g), match => match[0])
      .find(block => block.includes(`<loc>${url}</loc>`)) ?? ''
  )
}

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
  expect(sitemapLocations(xml)).toEqual([
    'https://saldeerscan.nl',
    'https://saldeerscan.nl/check',
    'https://saldeerscan.nl/methode',
    'https://saldeerscan.nl/privacy',
    'https://saldeerscan.nl/postcode/1012',
    'https://saldeerscan.nl/postcode/3012',
  ])
  expect(xml).not.toContain('<lastmod>')
})

test('hubs staan alleen in hun eigen sitemap en lastmod komt uit brondata', async ({ request }) => {
  const [coreXml, kennisbankXml, nieuwsXml, utrechtXml] = await Promise.all(
    ['core', 'kennisbank', 'nieuws', 'utrecht'].map(async id => {
      const response = await request.get(`/sitemap/${id}.xml`)
      expect(response.ok()).toBe(true)
      return response.text()
    }),
  )

  const locations = [
    ...sitemapLocations(coreXml),
    ...sitemapLocations(kennisbankXml),
    ...sitemapLocations(nieuwsXml),
    ...sitemapLocations(utrechtXml),
  ]
  for (const hubUrl of [
    'https://saldeerscan.nl/kennisbank',
    'https://saldeerscan.nl/nieuws',
    'https://saldeerscan.nl/utrecht',
  ]) {
    expect(locations.filter(location => location === hubUrl)).toHaveLength(1)
  }

  expect(sitemapUrlBlock(utrechtXml, 'https://saldeerscan.nl/utrecht')).not.toContain(
    '<lastmod>',
  )
  expect(
    sitemapUrlBlock(utrechtXml, 'https://saldeerscan.nl/utrecht/utrecht/leidsche-rijn'),
  ).toContain('<lastmod>2026-07-14T12:00:00.000Z</lastmod>')
})
