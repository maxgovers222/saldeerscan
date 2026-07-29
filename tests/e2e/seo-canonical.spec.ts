import { expect, test } from '@playwright/test'

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
