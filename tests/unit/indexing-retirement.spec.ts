import { expect, test } from '@playwright/test'
import { GET } from '../../app/api/indexing/cron/route'

test('retired indexing route never loads credentials or makes network requests', async () => {
  const previousFetch = globalThis.fetch
  const calls: unknown[] = []
  globalThis.fetch = async (...args) => {
    calls.push(args)
    throw new Error('Retired route must not call an external service')
  }
  try {
    const response = await GET()
    expect(response.status).toBe(410)
    expect(await response.json()).toMatchObject({
      status: 'retired',
      sitemap: 'https://saldeerscan.nl/sitemap.xml',
    })
    expect(calls).toEqual([])
  } finally {
    globalThis.fetch = previousFetch
  }
})
