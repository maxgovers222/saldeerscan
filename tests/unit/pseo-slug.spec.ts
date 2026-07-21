import { expect, test } from '@playwright/test'
import { parsePublishedWijkSlug } from '../../lib/pseo-slug'

test('parsePublishedWijkSlug accepteert geldige wijk-slugs', () => {
  expect(parsePublishedWijkSlug('/utrecht/utrecht/leidsche-rijn')).toEqual({
    provincie: 'utrecht',
    stad: 'utrecht',
    wijk: 'leidsche-rijn',
  })
})

test('parsePublishedWijkSlug accepteert CBS-wijknamen met cijfers', () => {
  expect(parsePublishedWijkSlug('/gelderland/scherpenzeel/wijk-00')).toEqual({
    provincie: 'gelderland',
    stad: 'scherpenzeel',
    wijk: 'wijk-00',
  })
  expect(parsePublishedWijkSlug('/limburg/voerendaal/wijk02-kunrade')).toEqual({
    provincie: 'limburg',
    stad: 'voerendaal',
    wijk: 'wijk02-kunrade',
  })
})

test('parsePublishedWijkSlug wijst ongeldige slugs af', () => {
  expect(parsePublishedWijkSlug('/noord-holland/amsterdam/')).toBeNull()
  expect(parsePublishedWijkSlug('/noord-holland/amsterdam')).toBeNull()
  expect(parsePublishedWijkSlug('/noord-holland/amsterdam/centrum/extra')).toBeNull()
  expect(parsePublishedWijkSlug('/noord-holland/amsterdam/UPPER')).toBeNull()
})
