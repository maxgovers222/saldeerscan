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
      { url: 'https://saldeerscan.nl/privacy', changeFrequency: 'monthly' as const, priority: 0.5 },
      { url: 'https://saldeerscan.nl/postcode/1012', changeFrequency: 'monthly' as const, priority: 0.88 },
      { url: 'https://saldeerscan.nl/postcode/3012', changeFrequency: 'monthly' as const, priority: 0.88 },
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
            ...withLastModified(a.generatedAt),
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
            ...withLastModified(a.publishedAt),
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

  const provincieUrl = [{
    url: `https://saldeerscan.nl/${id}`,
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

  const stadUrls = Array.from(
    new Set(
      pages
        .map(p => parsePublishedWijkSlug(p.slug))
        .filter((parsed): parsed is NonNullable<typeof parsed> => parsed !== null)
        .map(parsed => `/${parsed.provincie}/${parsed.stad}`),
    ),
  ).map(s => ({
    url: `https://saldeerscan.nl${s}`,
    changeFrequency: 'monthly' as const,
    priority: 0.86,
  }))

  const wijkUrls = pages
    .filter(p => parsePublishedWijkSlug(p.slug) !== null)
    .map(p => ({
      url: `https://saldeerscan.nl${p.slug}`,
      ...withLastModified(p.generated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.81,
    }))

  const straatUrls = straten.map(p => ({
    url: `https://saldeerscan.nl${p.slug}`,
    ...withLastModified(p.generated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.72,
  }))

  return [...provincieUrl, ...stadUrls, ...wijkUrls, ...straatUrls]
}
