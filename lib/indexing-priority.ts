import {
  congestionRank,
  resolveWijkScore,
  computeBesparing,
  computeVerliesFromBesparing,
} from '@/lib/pseo-variation'

export const INDEXING_BASE_URL = 'https://saldeerscan.nl'

export const INDEXING_HUB_URLS = [
  `${INDEXING_BASE_URL}`,
  `${INDEXING_BASE_URL}/check`,
  `${INDEXING_BASE_URL}/kennisbank`,
  `${INDEXING_BASE_URL}/nieuws`,
  `${INDEXING_BASE_URL}/postcode/1012`,
  `${INDEXING_BASE_URL}/postcode/3012`,
  `${INDEXING_BASE_URL}/noord-holland`,
  `${INDEXING_BASE_URL}/zuid-holland`,
  `${INDEXING_BASE_URL}/utrecht`,
  `${INDEXING_BASE_URL}/noord-brabant`,
  `${INDEXING_BASE_URL}/gelderland`,
  `${INDEXING_BASE_URL}/overijssel`,
  `${INDEXING_BASE_URL}/friesland`,
  `${INDEXING_BASE_URL}/groningen`,
  `${INDEXING_BASE_URL}/drenthe`,
  `${INDEXING_BASE_URL}/flevoland`,
  `${INDEXING_BASE_URL}/zeeland`,
  `${INDEXING_BASE_URL}/limburg`,
]

export type IndexingPageRow = {
  slug: string
  straat: string | null
  aantal_woningen: number | null
  netcongestie_status?: string | null
  gem_bouwjaar?: number | null
  gem_health_score?: number | null
  generated_at?: string | null
}

function parseCommaPaths(raw: string | undefined): string[] {
  if (!raw?.trim()) return []
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(p => (p.startsWith('/') ? p : `/${p}`))
}

function extraHubUrls(): string[] {
  return parseCommaPaths(process.env.INDEXING_EXTRA_INDEXING_URLS).map(p => `${INDEXING_BASE_URL}${p}`)
}

/** Handmatige GSC- of campagne-paden: krijgen voorrang in de dynamische batch (na vaste hubs). */
function priorityPathUrls(): string[] {
  return parseCommaPaths(process.env.INDEXING_PRIORITY_PATHS).map(p => `${INDEXING_BASE_URL}${p}`)
}

function hubUrlList(): string[] {
  return [...INDEXING_HUB_URLS, ...extraHubUrls()].filter((u, i, arr) => arr.indexOf(u) === i)
}

/** Sorteersleutel: eerst netdruk (ROOD), dan geschat verlies 2027, dan volume. */
function wijkUrgencySortKey(row: IndexingPageRow): number {
  if (row.straat) return -1
  const c = congestionRank(row.netcongestie_status ?? null)
  const score = resolveWijkScore(row.gem_bouwjaar ?? null, row.gem_health_score ?? null)
  const besparing = computeBesparing(row.gem_bouwjaar ?? null, score)
  const verlies = computeVerliesFromBesparing(besparing)
  return c * 1e12 + verlies * 1e6 + (row.aantal_woningen ?? 0)
}

/**
 * Vaste volgorde voor indexatie: handmatige paden → wijken (urgentie) → straten (volume).
 * Geen day-of-year shuffle meer over een ongesorteerde lijst.
 */
export function orderedIndexingUrls(pages: IndexingPageRow[]): string[] {
  const manual = priorityPathUrls()
  const wijkRows = pages.filter(page => !page.straat)
  const straatRows = pages.filter(page => page.straat)

  const sortedWijken = [...wijkRows].sort((a, b) => wijkUrgencySortKey(b) - wijkUrgencySortKey(a))
  const sortedStraten = [...straatRows].sort(
    (a, b) => (b.aantal_woningen ?? 0) - (a.aantal_woningen ?? 0),
  )

  const seen = new Set(manual)
  const wijkUrls = sortedWijken.map(p => `${INDEXING_BASE_URL}${p.slug}`).filter(u => !seen.has(u))
  for (const u of wijkUrls) seen.add(u)
  const straatUrls = sortedStraten.map(p => `${INDEXING_BASE_URL}${p.slug}`).filter(u => !seen.has(u))

  return [...manual, ...wijkUrls, ...straatUrls]
}

export function buildPrioritizedIndexingUrls(
  pages: IndexingPageRow[],
  options: { batchSize: number; dayOfYear: number }
): { urls: string[]; offset: number; dynamicCount: number } {
  const hubs = hubUrlList()
  const hubSet = new Set(hubs)
  const ordered = orderedIndexingUrls(pages).filter(u => !hubSet.has(u))

  const dynamicBudget = Math.max(0, options.batchSize - hubs.length)
  const offset =
    ordered.length === 0 ? 0 : (options.dayOfYear * Math.max(1, Math.floor(dynamicBudget / 3))) % ordered.length

  const dynamicUrls: string[] = []
  for (let i = 0; i < dynamicBudget && ordered.length > 0; i++) {
    dynamicUrls.push(ordered[(offset + i) % ordered.length])
  }

  return {
    urls: [...hubs, ...dynamicUrls],
    offset,
    dynamicCount: dynamicUrls.length,
  }
}
