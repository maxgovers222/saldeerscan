import { expect, test } from '@playwright/test'
import { parsePublishedWijkSlug } from '../../lib/pseo-slug'

test('parsePublishedWijkSlug accepteert geldige wijk-slugs', () => {
  expect(parsePublishedWijkSlug('/utrecht/utrecht/leidsche-rijn')).toEqual({
    provincie: 'utrecht',
    stad: 'utrecht',
    wijk: 'leidsche-rijn',
  })
})

test('parsePublishedWijkSlug wijst ongeldige slugs af', () => {
  expect(parsePublishedWijkSlug('/noord-holland/amsterdam/a')).toBeNull()
  expect(parsePublishedWijkSlug('/noord-holland/amsterdam')).toBeNull()
  expect(parsePublishedWijkSlug('/noord-holland/amsterdam/centrum/extra')).toBeNull()
})
