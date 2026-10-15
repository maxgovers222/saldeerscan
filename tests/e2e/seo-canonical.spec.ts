import { expect, test } from '@playwright/test'

test('the www host redirects to the declared apex while preserving path and report query', async ({ request }) => {
  const response = await request.get('/check?leadId=synthetic-id&token=synthetic-token', {
    headers: { host: 'www.saldeerscan.nl' }, maxRedirects: 0,
  })
  expect(response.status()).toBe(308)
  const target = new URL(response.headers().location)
  expect(target.origin).toBe('https://saldeerscan.nl')
  expect(target.pathname).toBe('/check')
  expect(target.searchParams.get('leadId')).toBe('synthetic-id')
  expect(target.searchParams.get('token')).toBe('synthetic-token')
})
import { EXACT_GSC_REDIRECTS } from '../../lib/gsc-redirects'

test('/check heeft canonieke URL zonder query-params', async ({ page }) => {
  await page.goto('/check?adres=Keizersgracht+1+Amsterdam&wijk=centrum&stad=amsterdam')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://saldeerscan.nl/check',
  )
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    /noindex/i,
  )
})

test('/check met leadId is noindex', async ({ page }) => {
  await page.goto('/check?leadId=00000000-0000-0000-0000-000000000001&token=test')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/i)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://saldeerscan.nl/check',
  )
})

test('/check met wijk/stad context is noindex', async ({ page }) => {
  await page.goto('/check?wijk=poort&stad=almere')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    /noindex/i,
  )
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://saldeerscan.nl/check',
  )
})

test('trailing slash redirect naar canoniek pad', async ({ request }) => {
  const response = await request.get('/check/', { maxRedirects: 0 })
  expect([301, 308]).toContain(response.status())
  expect(response.headers()['location']).toMatch(/\/check$/)
})

test('ongeldige object-promise URL geeft 410', async ({ request }) => {
  for (const path of [
    '/%5Bobject%20Promise%5D',
    '/utrecht/utrecht/%5Bobject%20Promise%5D',
  ]) {
    const response = await request.get(path, { maxRedirects: 0 })
    expect(response.status()).toBe(410)
  }
})

test('historische GSC redirect-errors zijn directe 200-responses', async ({ request }) => {
  for (const path of ['/kennisbank', '/nieuws']) {
    const response = await request.get(path, { maxRedirects: 0 })
    expect(response.status()).toBe(200)
    expect(response.headers()['location']).toBeUndefined()
  }
})

test('alleen exacte malformed GSC-URL\'s redirecten naar hun 1:1 vervanger', async ({ request }) => {
  for (const { source, destination } of EXACT_GSC_REDIRECTS) {
    const response = await request.get(source, { maxRedirects: 0 })
    expect(response.status(), source).toBe(301)
    expect(new URL(response.headers()['location'], 'http://localhost:3000').pathname).toBe(
      destination,
    )
  }

  const unmapped = await request.get(
    '/overijssel/zwolle/onbekend-stad-grid:onbekend',
    { maxRedirects: 0 },
  )
  expect(unmapped.status()).toBe(404)
})
