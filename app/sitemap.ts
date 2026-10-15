import type { MetadataRoute } from 'next'
import { getPseoPagesByProvincie, getStratenByProvincie } from '@/lib/pseo'
import { getAllPublishedKennisbank } from '@/lib/kennisbank'
import { getAllPublishedNieuws } from '@/lib/nieuws'
import { getPostcodePrefixesWithWijken } from '@/lib/pseo-hubs'
import { parsePublishedWijkSlug } from '@/lib/pseo-slug'
import { SITEMAP_IDS } from '@/lib/sitemap-config'

function withLastModified(value: string | null | undefined) {
  if (!value) return {}
  const lastModified = new Date(value)
  return Number.isNaN(lastModified.getTime()) ? {} : { lastModified }
}

export async function generateSitemaps() {
  return SITEMAP_IDS.map(id => ({ id }))
}

export default async function sitemap(
  props: { id: Promise<string> },
): Promise<MetadataRoute.Sitemap> {
  const id = await props.id

  if (id === 'core') {
    return [
      { url: 'https://saldeerscan.nl', changeFrequency: 'daily' as const, priority: 1 },
      { url: 'https://saldeerscan.nl/check', changeFrequency: 'daily' as const, priority: 0.95 },
      { url: 'https://saldeerscan.nl/methode', changeFrequency: 'monthly' as const, priority: 0.7 },
      { url: 'https://saldeerscan.nl/over', changeFrequency: 'monthly' as const, priority: 0.6 },
      { url: 'https://saldeerscan.nl/privacy', changeFrequency: 'monthly' as const, priority: 0.5 },
    ]
  }

  if (id === 'kennisbank') {
    try {
      const articles = await getAllPublishedKennisbank()
      return [
        { url: 'https://saldeerscan.nl/kennisbank', changeFrequency: 'weekly' as const, priority: 0.9 },
        ...articles.map(a => {
          return {
            url: `https://saldeerscan.nl/kennisbank/${a.slug}`,
            ...withLastModified(a.reviewedAt ?? a.generatedAt),
            changeFrequency: 'monthly' as const,
            priority: 0.85,
          }
        }),
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
        { url: 'https://saldeerscan.nl/nieuws', changeFrequency: 'daily' as const, priority: 0.9 },
        ...articles.map(a => {
          return {
            url: `https://saldeerscan.nl/nieuws/${a.slug}`,
            ...withLastModified(a.reviewedAt ?? a.publishedAt),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
          }
        }),
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
        changeFrequency: 'monthly' as const,
        priority: 0.82,
      }))
    } catch (e) {
      console.error('[sitemap] postcode query mislukt:', e)
      return []
    }
  }

  let pages: Awaited<ReturnType<typeof getPseoPagesByProvincie>> = []
  let straten: Awaited<ReturnType<typeof getStratenByProvincie>> = []
  try {
    ;[pages, straten] = await Promise.all([
      getPseoPagesByProvincie(id),
      getStratenByProvincie(id),
    ])
  } catch {
    return []
  }

  const indexableCityCounts = new Map<string, number>()
  for (const page of pages.filter(page => page.indexable)) {
    const parsed = parsePublishedWijkSlug(page.slug)
    if (!parsed) continue
    indexableCityCounts.set(parsed.stad, (indexableCityCounts.get(parsed.stad) ?? 0) + 1)
  }
  const indexableCities = new Set([...indexableCityCounts].filter(([, count]) => count > 0).map(([city]) => city))
  const provincieUrl = indexableCities.size > 0
    ? [{
        url: `https://saldeerscan.nl/${id}`,
        changeFrequency: 'monthly' as const,
        priority: 0.9,
      }]
    : []

  const stadUrls = Array.from(
    new Set(
      pages
        .filter(page => page.indexable)
        .map(p => parsePublishedWijkSlug(p.slug))
        .filter((parsed): parsed is NonNullable<typeof parsed> => parsed !== null)
        .filter(parsed => indexableCities.has(parsed.stad))
        .map(parsed => `/${parsed.provincie}/${parsed.stad}`),
    ),
  ).map(s => ({
    url: `https://saldeerscan.nl${s}`,
    changeFrequency: 'monthly' as const,
    priority: 0.86,
  }))

  const wijkUrls = pages
    .filter(p => p.indexable && parsePublishedWijkSlug(p.slug) !== null)
    .map(p => ({
      url: `https://saldeerscan.nl${p.slug}`,
      ...withLastModified(p.generated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.81,
    }))

  const indexableWijkSlugs = new Set(pages.filter(p => p.indexable).map(p => p.slug))
  const straatUrls = straten.filter(p => {
    if (!p.indexable) return false
    const parts = p.slug.split('/').filter(Boolean)
    return parts.length === 4
      && indexableWijkSlugs.has(`/${parts.slice(0, 3).join('/')}`)
  }).map(p => ({
    url: `https://saldeerscan.nl${p.slug}`,
    ...withLastModified(p.generated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.72,
  }))

  return [...provincieUrl, ...stadUrls, ...wijkUrls, ...straatUrls]
}
