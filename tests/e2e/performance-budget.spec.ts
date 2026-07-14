import { expect, test, type Page } from '@playwright/test'

async function clientJsBytes(page: Page): Promise<number> {
  return page.evaluate(() =>
    performance.getEntriesByType('resource')
      .filter(entry => entry.name.includes('/_next/static/') && entry.name.endsWith('.js'))
      .reduce((sum, entry) => {
        const resource = entry as PerformanceResourceTiming
        return sum + (resource.transferSize || resource.encodedBodySize || 0)
      }, 0),
  )
}

test('homepage client JavaScript stays under 300 KB transferred', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  expect(await clientJsBytes(page)).toBeLessThanOrEqual(300_000)
})

test('initial check client JavaScript stays under 450 KB transferred', async ({ page }) => {
  await page.goto('/check', { waitUntil: 'networkidle' })
  expect(await clientJsBytes(page)).toBeLessThanOrEqual(450_000)
})

test('initial routes do not contact Mapbox browser endpoints', async ({ page }) => {
  const requests: string[] = []
  page.on('request', request => requests.push(request.url()))
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.goto('/check', { waitUntil: 'networkidle' })
  expect(requests.some(url => /api\.mapbox\.com|events\.mapbox\.com/i.test(url)))
    .toBe(false)
})
