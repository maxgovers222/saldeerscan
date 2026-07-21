import {
  congestionRank,
  resolveWijkScore,
  computeBesparing,
  computeVerliesFromBesparing,
} from '@/lib/pseo-variation'

export const INDEXING_BASE_URL = 'https://saldeerscan.nl'

/**
 * Wijken met meetbare GSC-impressies (jul 2026).
 * Altijd vóór rotatie, na `INDEXING_PRIORITY_PATHS` uit env.
 */
export const INDEXING_DEFAULT_PRIORITY_PATHS = [
  '/limburg/sittard-geleen/born',
  '/overijssel/dalfsen/dalfsen',
  '/zuid-holland/rotterdam/ijsselmonde',
  '/noord-brabant/helmond/brouwhuis',
  '/noord-holland/zaanstad/zaandam-west',
  '/noord-brabant/meierijstad/veghel',
  '/noord-holland/hilversum/oost',
  '/gelderland/arnhem/malburgen-oost-noord',
  '/utrecht/utrecht/leidsche-rijn',
  '/noord-brabant/bergen-op-zoom/bergen-op-zoom',
  '/flevoland/almere/almere-buiten',
  '/noord-holland/amsterdam/centrum',
] as const

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
  last_pinged_at?: string | null
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
  const paths = [
    ...parseCommaPaths(process.env.INDEXING_PRIORITY_PATHS),
    ...INDEXING_DEFAULT_PRIORITY_PATHS,
  ]
  const seen = new Set<string>()
  const urls: string[] = []
  for (const raw of paths) {
    const path = raw.startsWith('/') ? raw : `/${raw}`
    const url = `${INDEXING_BASE_URL}${path}`
    if (seen.has(url)) continue
    seen.add(url)
    urls.push(url)
  }
  return urls
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
 * Vaste volgorde voor indexatie:
 * 1. Handmatige paden (INDEXING_PRIORITY_PATHS)
 * 2. Nooit-gepingde wijken (last_pinged_at IS NULL), gesorteerd op urgentie
 * 3. Al-gepingde wijken, gesorteerd op urgentie
 * 4. Nooit-gepingde straten, gesorteerd op volume
 * 5. Al-gepingde straten, gesorteerd op volume
 *
 * Nooit-gepingde pagina's gaan altijd voor zodat nieuwe pSEO-pages zo snel
 * mogelijk een eerste ping krijgen in plaats van achteraan te roteren.
 */
export function orderedIndexingUrls(pages: IndexingPageRow[]): string[] {
  const manual = priorityPathUrls()
  const wijkRows = pages.filter(page => !page.straat)
  const straatRows = pages.filter(page => page.straat)

  const neverWijken = wijkRows.filter(p => !p.last_pinged_at)
  const seenWijken  = wijkRows.filter(p =>  p.last_pinged_at)
  const neverStraten = straatRows.filter(p => !p.last_pinged_at)
  const seenStraten  = straatRows.filter(p =>  p.last_pinged_at)

  const sortByUrgency = (a: IndexingPageRow, b: IndexingPageRow) =>
    wijkUrgencySortKey(b) - wijkUrgencySortKey(a)
  const sortByVolume = (a: IndexingPageRow, b: IndexingPageRow) =>
    (b.aantal_woningen ?? 0) - (a.aantal_woningen ?? 0)

  const ordered = [
    ...neverWijken.sort(sortByUrgency),
    ...seenWijken.sort(sortByUrgency),
    ...neverStraten.sort(sortByVolume),
    ...seenStraten.sort(sortByVolume),
  ]

  const seen = new Set(manual)
  const dynamicUrls = ordered
    .map(p => `${INDEXING_BASE_URL}${p.slug}`)
    .filter(u => !seen.has(u))

  return [...manual, ...dynamicUrls]
}

export function buildPrioritizedIndexingUrls(
  pages: IndexingPageRow[],
  options: { batchSize: number; dayOfYear: number }
): { urls: string[]; offset: number; dynamicCount: number } {
  const hubs = hubUrlList()
  const hubSet = new Set(hubs)

  // Splits in nooit-gepingt vs. al-gepingt (hubs uitgesloten)
  const neverPinged = orderedIndexingUrls(
    pages.filter(p => !p.last_pinged_at)
  ).filter(u => !hubSet.has(u))

  const alreadyPinged = orderedIndexingUrls(
    pages.filter(p => p.last_pinged_at)
  ).filter(u => !hubSet.has(u))

  const dynamicBudget = Math.max(0, options.batchSize - hubs.length)

  // Nooit-gepingde pagina's vullen de batch eerst (geen rotatie — altijd vooraan).
  // De resterende plekken gaan naar al-gepingde pagina's met dayOfYear-rotatie.
  const neverSlice = neverPinged.slice(0, dynamicBudget)
  const remaining = dynamicBudget - neverSlice.length

  let offset = 0
  const seenSlice: string[] = []
  if (remaining > 0 && alreadyPinged.length > 0) {
    offset = (options.dayOfYear * Math.max(1, Math.floor(remaining / 3))) % alreadyPinged.length
    for (let i = 0; i < remaining; i++) {
      seenSlice.push(alreadyPinged[(offset + i) % alreadyPinged.length])
    }
  }

  const dynamicUrls = [...neverSlice, ...seenSlice]

  return {
    urls: [...hubs, ...dynamicUrls],
    offset,
    dynamicCount: dynamicUrls.length,
  }
}
