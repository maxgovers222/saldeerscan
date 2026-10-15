import 'server-only'
import { unstable_cache } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  canonicalLocationPath, directoryLocation, lookupSourceSlug, parseLocationPath,
  projectPseoPublication, PSEO_PUBLICATION_CACHE_KEY, PSEO_LEGACY_ENTRIES,
} from './pseo-publication'

const revalidate = 604800
type CatalogRow = { slug: string; status: string; generated_at: string | null; wijk: string | null; straat: string | null }
type DirectoryEntry = NonNullable<ReturnType<typeof directoryLocation>> & { generated_at: string | null }
export type PseoPageData = NonNullable<ReturnType<typeof projectPseoPublication>>

/** Cache route fields rather than thousands of unreviewed article bodies. */
export const getPseoCatalog = unstable_cache(async (): Promise<DirectoryEntry[]> => {
  const rows: CatalogRow[] = []
  for (let offset = 0; offset < 10000; offset += 500) {
    const { data, error } = await supabaseAdmin.from('pseo_pages')
      .select('slug,status,generated_at,wijk,straat').eq('status', 'published')
      .order('slug').range(offset, offset + 499)
    if (error) throw new Error(`pSEO route catalog unavailable: ${error.code}`)
    rows.push(...(data ?? []) as CatalogRow[])
    if (!data || data.length < 500) {
      const unique = new Map<string, DirectoryEntry>()
      for (const row of rows) {
        const entry = directoryLocation(row)
        if (entry) unique.set(entry.slug, { ...entry, generated_at: row.generated_at })
      }
      return [...unique.values()].sort((a, b) => a.slug.localeCompare(b.slug))
    }
  }
  throw new Error('pSEO route catalog exceeded the reviewed release limit')
}, ['pseo', 'route-catalog', PSEO_PUBLICATION_CACHE_KEY], { revalidate })

async function loadPage(path: string): Promise<PseoPageData | null> {
  const parts = parseLocationPath(path)
  if (!parts) return null
  const { data, error } = await supabaseAdmin.from('pseo_pages').select('*')
    .eq('slug', lookupSourceSlug(path)).eq('status', 'published').maybeSingle()
  if (error) throw new Error(`pSEO page unavailable: ${error.code}`)
  if (!data) return null
  const parentIndexable = !parts.straat || (await getPseoCatalog()).some(entry => entry.slug === `/${parts.provincie}/${parts.stad}/${parts.wijk}`)
  return projectPseoPublication(data as Record<string, unknown>, { parentIndexable })
}
export const getWijkPage = unstable_cache(
  async (p: { provincie: string; stad: string; wijk: string }) => loadPage(`/${p.provincie}/${p.stad}/${p.wijk}`),
  ['pseo', 'wijkPage', PSEO_PUBLICATION_CACHE_KEY], { revalidate },
)
export const getPseoPage = unstable_cache(
  async (p: { provincie: string; stad: string; wijk: string; straat: string }) => loadPage(`/${p.provincie}/${p.stad}/${p.wijk}/${p.straat}`),
  ['pseo', 'straatPage', PSEO_PUBLICATION_CACHE_KEY], { revalidate },
)
const take = <T,>(rows: T[], limit: number) => limit > 0 ? rows.slice(0, limit) : rows
const isWijk = (entry: DirectoryEntry) => entry.straat === null
const asCard = (entry: DirectoryEntry) => ({
  wijk: entry.wijk, stad: entry.stad, provincie: entry.provincie,
  gem_bouwjaar: null, gem_health_score: null, netcongestie_status: null, aantal_woningen: null,
  quality_indexable: true,
})
export async function getTopWijken(limit = 500) {
  return take((await getPseoCatalog()).filter(isWijk), limit).map(({ provincie, stad, wijk }) => ({ provincie, stad, wijk }))
}
export async function getTopPseoPages(limit = 500) {
  const rows = await getPseoCatalog()
  const parents = new Set(rows.filter(isWijk).map(row => row.slug))
  return take(rows.filter(row => row.straat && parents.has(`/${row.provincie}/${row.stad}/${row.wijk}`)), limit)
}
export async function getWijkenByStad(provincie: string, stad: string) {
  return (await getPseoCatalog()).filter(row => isWijk(row) && row.provincie === provincie && row.stad === stad).map(asCard)
}
export async function getPseoPagesByProvincie(provincie: string) {
  return (await getPseoCatalog()).filter(row => isWijk(row) && row.provincie === provincie)
    .map(row => ({ slug: row.slug, generated_at: '2026-10-15', indexable: true, hasSufficientEvidence: false }))
}
export async function getStratenByProvincie(provincie: string) {
  return (await getTopPseoPages(0)).filter(row => row.provincie === provincie)
    .map(row => ({ slug: row.slug, generated_at: '2026-10-15', indexable: true, hasSufficientEvidence: false }))
}
export async function getStaddenByProvincie(provincie: string) {
  const counts = new Map<string, number>()
  for (const row of (await getPseoCatalog()).filter(row => isWijk(row) && row.provincie === provincie)) counts.set(row.stad, (counts.get(row.stad) ?? 0) + 1)
  return [...counts].map(([stad, indexableCount]) => ({ stad, indexableCount, totalWoningen: 0, indexableWoningen: 0 })).sort((a, b) => a.stad.localeCompare(b.stad))
}
export async function getTopStadden(limit = 100) {
  const cities = new Map<string, { provincie: string; stad: string; totalWoningen: number; indexableCount: number }>()
  for (const row of (await getPseoCatalog()).filter(isWijk)) {
    const key = `${row.provincie}/${row.stad}`
    const previous = cities.get(key)
    cities.set(key, { provincie: row.provincie, stad: row.stad, totalWoningen: 0, indexableCount: (previous?.indexableCount ?? 0) + 1 })
  }
  return take([...cities.values()], limit)
}
export async function getTopStratenByWijk(provincie: string, stad: string, wijk: string, limit = 8) {
  return take((await getTopPseoPages(0)).filter(row => row.provincie === provincie && row.stad === stad && row.wijk === wijk), limit)
}
export async function getStratenByWijk(provincie: string, stad: string, wijk: string, excludeStraat: string, limit = 6) {
  return take((await getTopStratenByWijk(provincie, stad, wijk, 0)).filter(row => row.straat !== excludeStraat), limit)
}
export async function getIndexableWijkenByProvincie(provincie: string, limit = 12) {
  return take((await getPseoCatalog()).filter(row => isWijk(row) && row.provincie === provincie), limit).map(asCard)
}
export async function getProvincieHubStats(provincie: string) {
  const cities = await getStaddenByProvincie(provincie)
  const wijkCount = cities.reduce((sum, city) => sum + city.indexableCount, 0)
  return { stadCount: cities.length, wijkCount, sourceStadCount: cities.length, sourceWijkCount: wijkCount, indexableStadCount: cities.length, indexableWijkCount: wijkCount }
}
/** Legacy postcode tags have no verified boundary evidence. */
export async function getWijkenByPostcode(_postcodePrefix: string): Promise<ReturnType<typeof asCard>[]> { return [] }
export async function getLegacyPostcodePrefixes() {
  const published = new Set((await getPseoCatalog()).map(row => canonicalLocationPath(row.sourceSlug)))
  return [...new Set(PSEO_LEGACY_ENTRIES.filter(entry => published.has(entry.path)).map(entry => entry.legacyPostcode).filter((prefix): prefix is string => prefix !== null))].sort()
}
