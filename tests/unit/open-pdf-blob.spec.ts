import { expect, test } from '@playwright/test'
import { isMobilePdfClient } from '@/lib/open-pdf-blob'

test('detects common mobile PDF clients', () => {
  expect(isMobilePdfClient()).toBe(false)
})
