export const SITEMAP_PROVINCIES = [
  'noord-holland',
  'zuid-holland',
  'utrecht',
  'noord-brabant',
  'gelderland',
  'overijssel',
  'friesland',
  'groningen',
  'drenthe',
  'flevoland',
  'zeeland',
  'limburg',
] as const

export const SITEMAP_IDS = [
  'core',
  ...SITEMAP_PROVINCIES,
  'kennisbank',
  'nieuws',
  'postcodes',
] as const
