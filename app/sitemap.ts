import { MetadataRoute } from 'next'
import { getPseoPagesByProvincie } from '@/lib/pseo'

const PROVINCIES = [
  'noord-holland', 'zuid-holland', 'utrecht', 'noord-brabant',
  'gelderland', 'overijssel', 'friesland', 'groningen',
  'drenthe', 'flevoland', 'zeeland', 'limburg',
]

export async function generateSitemaps() {
  return PROVINCIES.map(id => ({ id }))
}

export default async function sitemap({ id }: { id: string | Promise<string> }): Promise<MetadataRoute.Sitemap> {
  // id = provincie slug (e.g. 'noord-holland')
  // In Next.js 16, id may be passed as a Promise
  const resolvedId = await Promise.resolve(id)
  // Convert slug back to provincie name for DB query
  const provincieNaam = resolvedId.replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())  // 'noord holland' → 'Noord Holland'

  let pages: Awaited<ReturnType<typeof getPseoPagesByProvincie>> = []
  try {
    pages = await getPseoPagesByProvincie(provincieNaam)
  } catch {
    // DB not available at build time — return empty sitemap for this provincie
    return []
  }

  return pages.map(p => ({
    url: `https://woningenergieplan.nl${p.slug}`,
    lastModified: p.generated_at ? new Date(p.generated_at) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))
}
