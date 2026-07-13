import { expect, test } from '@playwright/test'
import { buildCheckHref } from '@/lib/conversion-context'

test('builds stable wijk context', () => {
  expect(buildCheckHref({
    landingPath: '/utrecht/utrecht/leidsche-rijn',
    pseoLevel: 'wijk',
    provincie: 'utrecht',
    stad: 'utrecht',
    wijk: 'leidsche-rijn',
  })).toBe(
    '/check?landing_path=%2Futrecht%2Futrecht%2Fleidsche-rijn&pseo_level=wijk&provincie=utrecht&stad=utrecht&wijk=leidsche-rijn',
  )
})

test('omits empty context values', () => {
  expect(buildCheckHref({
    landingPath: '/',
    pseoLevel: 'home',
  })).toBe('/check?landing_path=%2F&pseo_level=home')
})
