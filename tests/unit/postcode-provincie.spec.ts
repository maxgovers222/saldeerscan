import { expect, test } from '@playwright/test'
import { extractProvincie } from '../../lib/postcode-provincie'

test('Rotterdam 3077 is Zuid-Holland (not Utrecht)', () => {
  expect(extractProvincie('3077')).toBe('Zuid-Holland')
  expect(extractProvincie('3077PL')).toBe('Zuid-Holland')
})

test('Utrecht city and Amsterdam map correctly', () => {
  expect(extractProvincie('3511')).toBe('Utrecht')
  expect(extractProvincie('1012')).toBe('Noord-Holland')
})

test('Halsteren / Bergen op Zoom area is Noord-Brabant', () => {
  expect(extractProvincie('4661')).toBe('Noord-Brabant')
})

test('rejects invalid prefixes', () => {
  expect(extractProvincie('')).toBeNull()
  expect(extractProvincie('abc')).toBeNull()
})
