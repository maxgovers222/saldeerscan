import { expect, test } from '@playwright/test'
import { INDEXING_DEFAULT_PRIORITY_PATHS, orderedIndexingUrls } from '../../lib/indexing-priority'

test('orderedIndexingUrls bevat GSC-prioriteitswijken vóór dynamische rotatie', () => {
  const urls = orderedIndexingUrls([])
  for (const path of INDEXING_DEFAULT_PRIORITY_PATHS) {
    expect(urls).toContain(`https://saldeerscan.nl${path}`)
  }
  expect(urls.indexOf('https://saldeerscan.nl/limburg/sittard-geleen/born')).toBeLessThan(
    urls.length,
  )
})
