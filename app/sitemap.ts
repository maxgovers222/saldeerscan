import { MetadataRoute } from 'next'
import { getPseoPagesByProvincie } from '@/lib/pseo'
import { getAllPublishedKennisbank } from '@/lib/kennisbank'
import { getAllPublishedNieuws } from '@/lib/nieuws'

const PROVINCIES = [
  'noord-holland', 'zuid-holland', 'utrecht', 'noord-brabant',
  'gelderland', 'overijssel', 'friesland', 'groningen',
  'drenthe', 'flevoland', 'zeeland', 'limburg',
]

export async function generateSitemaps() {
  return [
    ...PROVINCIES.map(id => ({ id })),
    { id: 'kennisbank' },
    { id: 'nieuws' },
  ]
}

export default async function sitemap({ id }: { id: string | Promise<string> }): Promise<MetadataRoute.Sitemap> {
  // id = provincie slug (e.g. 'noord-holland') — matches DB storage format
  const resolvedId = await Promise.resolve(id)
  const now = new Date()

  // Kennisbank sitemap
  if (resolvedId === 'kennisbank') {
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
    } catch { return [] }
  }

  // Nieuws sitemap
  if (resolvedId === 'nieuws') {
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
    } catch { return [] }
  }

  // Provincie sitemaps
  let pages: Awaited<ReturnType<typeof getPseoPagesByProvincie>> = []
  try {
    pages = await getPseoPagesByProvincie(resolvedId)
  } catch {
    return []
  }

  // Provincie-overzichtspagina
  const provincieUrl = [{
    url: `https://saldeerscan.nl/${resolvedId}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }]

  // Stad-overzichtspagina's (unieke stads uit de wijk-slugs)
  const stadSlugs = new Set(
    pages
      .map(p => p.slug.split('/').slice(0, 3).join('/'))
      .filter(s => s.split('/').length === 3)
  )
  const stadUrls = Array.from(stadSlugs).map(s => ({
    url: `https://saldeerscan.nl${s}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.85,
  }))

  // Wijk-pagina's
  const wijkUrls = pages.map(p => ({
    url: `https://saldeerscan.nl${p.slug}`,
    lastModified: p.generated_at ? new Date(p.generated_at) : now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [...provincieUrl, ...stadUrls, ...wijkUrls]
}
