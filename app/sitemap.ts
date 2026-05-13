import { MetadataRoute } from 'next'
import { getPseoPagesByProvincie, getStratenByProvincie } from '@/lib/pseo'
import { getAllPublishedKennisbank } from '@/lib/kennisbank'
import { getAllPublishedNieuws } from '@/lib/nieuws'
import { getPostcodePrefixesWithWijken } from '@/lib/pseo-hubs'

const PROVINCIES = [
  'noord-holland', 'zuid-holland', 'utrecht', 'noord-brabant',
  'gelderland', 'overijssel', 'friesland', 'groningen',
  'drenthe', 'flevoland', 'zeeland', 'limburg',
]

export async function generateSitemaps() {
  return [
    { id: 'core' },
    ...PROVINCIES.map(id => ({ id })),
    { id: 'kennisbank' },
    { id: 'nieuws' },
    { id: 'postcodes' },
  ]
}

export default async function sitemap({ id }: { id: string }): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  if (id === 'core') {
    return [
      { url: 'https://saldeerscan.nl', lastModified: now, changeFrequency: 'daily' as const, priority: 1 },
      { url: 'https://saldeerscan.nl/check', lastModified: now, changeFrequency: 'daily' as const, priority: 0.95 },
      { url: 'https://saldeerscan.nl/privacy', lastModified: now, changeFrequency: 'monthly' as const, priority: 0.5 },
      { url: 'https://saldeerscan.nl/kennisbank', lastModified: now, changeFrequency: 'weekly' as const, priority: 0.9 },
      { url: 'https://saldeerscan.nl/nieuws', lastModified: now, changeFrequency: 'daily' as const, priority: 0.9 },
      { url: 'https://saldeerscan.nl/postcode/1012', lastModified: now, changeFrequency: 'monthly' as const, priority: 0.88 },
      { url: 'https://saldeerscan.nl/postcode/3012', lastModified: now, changeFrequency: 'monthly' as const, priority: 0.88 },
      ...PROVINCIES.map(provincie => ({
        url: `https://saldeerscan.nl/${provincie}`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.9,
      })),
    ]
  }

  if (id === 'kennisbank') {
    try {
      const articles = await getAllPublishedKennisbank()
      return [
        { url: 'https://saldeerscan.nl/kennisbank', lastModified: now, changeFrequency: 'weekly' as const, priority: 0.9 },
        ...articles.map(a => ({
          url: `https://saldeerscan.nl/kennisbank/${a.slug}`,
          lastModified: a.generatedAt ? new Date(a.generatedAt) : now,
          changeFrequency: 'monthly' as const,
          priority: 0.85,
        })),
      ]
    } catch (e) {
      console.error('[sitemap] kennisbank query mislukt:', e)
      return []
    }
  }

  if (id === 'nieuws') {
    try {
      const articles = await getAllPublishedNieuws()
      return [
        { url: 'https://saldeerscan.nl/nieuws', lastModified: now, changeFrequency: 'daily' as const, priority: 0.9 },
        ...articles.map(a => ({
          url: `https://saldeerscan.nl/nieuws/${a.slug}`,
          lastModified: a.publishedAt ? new Date(a.publishedAt) : now,
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        })),
      ]
    } catch (e) {
      console.error('[sitemap] nieuws query mislukt:', e)
      return []
    }
  }

  if (id === 'postcodes') {
    try {
      const prefixes = await getPostcodePrefixesWithWijken()
      return prefixes.map(prefix => ({
        url: `https://saldeerscan.nl/postcode/${prefix}`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.82,
      }))
    } catch (e) {
      console.error('[sitemap] postcode query mislukt:', e)
      return []
    }
  }

  const provincieUrl = [{
    url: `https://saldeerscan.nl/${id}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }]

  let pages: Awaited<ReturnType<typeof getPseoPagesByProvincie>> = []
  let straten: Awaited<ReturnType<typeof getStratenByProvincie>> = []
  try {
    ;[pages, straten] = await Promise.all([
      getPseoPagesByProvincie(id),
      getStratenByProvincie(id),
    ])
  } catch {
    return provincieUrl
  }

  const stadSlugs = new Set(
    pages
      .map(p => p.slug.split('/').slice(0, 3).join('/'))
      .filter(s => s.split('/').length === 3)
  )
  const stadUrls = Array.from(stadSlugs).map(s => ({
    url: `https://saldeerscan.nl${s}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.86,
  }))

  const wijkUrls = pages.map(p => ({
    url: `https://saldeerscan.nl${p.slug}`,
    lastModified: p.generated_at ? new Date(p.generated_at) : now,
    changeFrequency: 'monthly' as const,
    priority: 0.81,
  }))

  const straatUrls = straten.map(p => ({
    url: `https://saldeerscan.nl${p.slug}`,
    lastModified: p.generated_at ? new Date(p.generated_at) : now,
    changeFrequency: 'monthly' as const,
    priority: 0.72,
  }))

  return [...provincieUrl, ...stadUrls, ...wijkUrls, ...straatUrls]
}
