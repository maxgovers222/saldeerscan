import 'server-only'
import { unstable_cache } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getWijkenByStad, getStaddenByProvincie } from '@/lib/pseo'

export const SITE_URL = 'https://saldeerscan.nl'

export type HubBreadcrumbItem = { name: string; href: string }

export type HubChildLink = { name: string; url: string }

export function toDisplaySlug(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function absoluteUrl(path: string): string {
  if (path.startsWith('http')) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export function hubBreadcrumbItems(path: {
  provincie?: string
  stad?: string
  wijk?: string
  postcode?: string
}): HubBreadcrumbItem[] {
  const items: HubBreadcrumbItem[] = [{ name: 'Home', href: '/' }]
  if (path.provincie) {
    items.push({ name: toDisplaySlug(path.provincie), href: `/${path.provincie}` })
  }
  if (path.provincie && path.stad) {
    items.push({ name: toDisplaySlug(path.stad), href: `/${path.provincie}/${path.stad}` })
  }
  if (path.provincie && path.stad && path.wijk) {
    items.push({
      name: toDisplaySlug(path.wijk),
      href: `/${path.provincie}/${path.stad}/${path.wijk}`,
    })
  }
  if (path.postcode) {
    items.push({ name: `Postcode ${path.postcode}`, href: `/postcode/${path.postcode}` })
  }
  return items
}

export function buildBreadcrumbListLd(items: HubBreadcrumbItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.href),
    })),
  }
}

export function buildHubCollectionLd(params: {
  name: string
  description: string
  url: string
  children: HubChildLink[]
}): Record<string, unknown> {
  const pageUrl = absoluteUrl(params.url)
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': pageUrl,
        name: params.name,
        description: params.description,
        url: pageUrl,
        inLanguage: 'nl-NL',
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: params.children.length,
          itemListElement: params.children.map((child, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: child.name,
            url: absoluteUrl(child.url),
          })),
        },
      },
    ],
  }
}

export async function getHubSteden(provincie: string) {
  return getStaddenByProvincie(provincie)
}

export async function getHubWijken(provincie: string, stad: string) {
  return getWijkenByStad(provincie, stad)
}

export const getPostcodePrefixesWithWijken = unstable_cache(
  async (): Promise<string[]> => {
    const { data } = await supabaseAdmin
      .from('pseo_pages')
      .select('postcode_prefix')
      .eq('status', 'published')
      .is('straat', null)
      .not('wijk', 'is', null)
      .not('postcode_prefix', 'is', null)

    const prefixes = new Set<string>()
    for (const row of data ?? []) {
      const prefix = String(row.postcode_prefix ?? '').slice(0, 4)
      if (/^\d{4}$/.test(prefix)) prefixes.add(prefix)
    }
    return Array.from(prefixes).sort()
  },
  ['pseo', 'postcodePrefixes'],
  { revalidate: 604800 }
)
