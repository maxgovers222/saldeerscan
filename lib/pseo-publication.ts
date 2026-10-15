import { createHash } from 'node:crypto'
import registry from './pseo-recovery-registry.json'
import { CANONICAL_PROVINCE_SLUGS, formatLocationSlug } from './pseo-content-quality'

/** Transitional discovery preserves audited URLs; evidence approval controls displayed claims separately. */
export const PSEO_PUBLICATION_VERSION = registry.version
export const PSEO_REVIEWED_CONTENT_ENABLED = process.env.PSEO_REVIEWED_CONTENT !== 'off'
export const PSEO_PUBLICATION_CACHE_KEY = `${registry.version}:${PSEO_REVIEWED_CONTENT_ENABLED ? 'reviewed' : 'safe-copy'}`
export const PSEO_PROVINCE_REDIRECTS = registry.redirects
export const PSEO_LEGACY_ENTRIES = registry.entries
export const PSEO_REVIEWED_COPIES = registry.reviewed
const bySource = new Map(registry.entries.map(entry => [entry.sourceSlug, entry]))
const byPath = new Map(registry.entries.map(entry => [entry.path, entry]))
const reviewedByPath = new Map(registry.reviewed.map(copy => [copy.path, copy]))
export const SALDERING_SOURCE = 'https://www.rijksoverheid.nl/themas/klimaat-milieu-en-natuur/energie-thuis/salderingsregeling'

export type PublicationState = 'reviewed' | 'repair-pending' | 'new-unreviewed'
export type PseoPublicationDecision = {
  version: string
  indexable: boolean
  hasSufficientEvidence: boolean
  state: PublicationState
  reason: 'matched-reviewed-copy' | 'review-original-changed' | 'audited-route-held-for-repair' | 'not-in-reviewed-inventory' | 'missing-parent' | 'reviewed-content-disabled'
}
type Row = Record<string, unknown>
export type ReviewedLocationEvidence = (typeof registry.reviewed)[number]['content']['source_evidence'][number]

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (value && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(',')}}`
  return JSON.stringify(value) ?? 'null'
}
function hash(value: unknown) { return createHash('sha256').update(canonicalJson(value)).digest('hex') }

export function parseLocationPath(path: string) {
  const parts = path.split('/').filter(Boolean)
  if (![3, 4].includes(parts.length) || path !== `/${parts.join('/')}` || parts.some(part => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(part))) return null
  const [provincie, stad, wijk, straat] = parts
  if (!CANONICAL_PROVINCE_SLUGS.includes(provincie as (typeof CANONICAL_PROVINCE_SLUGS)[number])) return null
  return { provincie, stad, wijk, straat: straat ?? null }
}

export function lookupSourceSlug(path: string) { return byPath.get(path)?.sourceSlug ?? path }
export function canonicalLocationPath(sourceSlug: string) { return bySource.get(sourceSlug)?.path ?? sourceSlug }

/** Only the audited inventory can be retained in discovery; new published rows do not bypass review. */
export function directoryLocation(row: Row) {
  if (row.status !== 'published' || typeof row.slug !== 'string') return null
  const entry = bySource.get(row.slug)
  if (!entry) return null
  const parts = parseLocationPath(entry.path)
  return parts ? { ...parts, slug: entry.path, sourceSlug: entry.sourceSlug } : null
}

function verifiedCopy(row: Row, path: string, now: number) {
  const copy = reviewedByPath.get(path)
  if (!copy || row.status !== 'published') return null
  const image = Object.fromEntries(copy.fields.map(field => [field, field === 'source_evidence' ? row[field] ?? [] : row[field] ?? null]))
  const fingerprint = hash(image)
  if (fingerprint !== copy.beforeHash && fingerprint !== copy.afterHash) return null
  const evidence = copy.content.source_evidence[0]
  const retrieved = Date.parse(evidence.retrievedAt)
  const source = new URL(evidence.sourceUrl)
  if (!Number.isFinite(retrieved) || retrieved > now || now - retrieved > 2 * 366 * 86400000
    || source.protocol !== 'https:' || source.hostname !== 'opendata.cbs.nl'
    || source.pathname !== '/ODataApi/OData/86165NED/TypedDataSet'
    || evidence.values.aantal_woningen !== copy.content.aantal_woningen
    || evidence.origin !== 'CBS' || evidence.geography !== path
    || !/^(?:WK\d{6}|BU\d{8})$/.test(evidence.scope.code)) return null
  return copy
}

export function projectPseoPublication(row: Row, options: { parentIndexable?: boolean; now?: number; reviewedContentEnabled?: boolean } = {}) {
  const path = canonicalLocationPath(String(row.slug ?? ''))
  const parts = parseLocationPath(path)
  if (!parts) return null
  const retained = directoryLocation(row) !== null
  const reviewedEnabled = options.reviewedContentEnabled ?? PSEO_REVIEWED_CONTENT_ENABLED
  const copy = reviewedEnabled ? verifiedCopy(row, path, options.now ?? Date.now()) : null
  const parentOkay = !parts.straat || options.parentIndexable !== false
  const quality: PseoPublicationDecision = {
    version: PSEO_PUBLICATION_VERSION,
    indexable: retained && parentOkay,
    hasSufficientEvidence: copy !== null,
    state: copy ? 'reviewed' : retained ? 'repair-pending' : 'new-unreviewed',
    reason: !parentOkay ? 'missing-parent' : !reviewedEnabled ? 'reviewed-content-disabled' : copy ? 'matched-reviewed-copy'
      : reviewedByPath.has(path) ? 'review-original-changed' : retained ? 'audited-route-held-for-repair' : 'not-in-reviewed-inventory',
  }
  const name = formatLocationSlug(parts.straat ?? parts.wijk)
  const city = formatLocationSlug(parts.stad)
  const title = `Zonnepanelen in ${name}, ${city}: uw situatie in 2027`
  const description = `Wat verandert er na het einde van salderen? Gebruik uw eigen productie, verbruik en contract. De lokale kenmerken van ${name} worden nog gecontroleerd.`
  const body = [
    `Woont u in ${name}, ${city}, en heeft u zonnepanelen? Uw jaarproductie, totale stroomverbruik, direct eigen gebruik en energiecontract bepalen de financiële gevolgen. Een plaatsnaam bepaalt geen opbrengst of passend aantal panelen.`,
    `De eerder opgeslagen lokale woningcijfers en netindicaties zijn nog onvoldoende onderbouwd. Daarom tonen we voor ${name} geen energiescore, gemiddeld bouwjaar, woningtelling, postcode-afbakening, netkleur of lokale besparing. Er is hier geen technische beoordeling van uw dak of aansluiting uitgevoerd.`,
    'Salderen blijft 100% mogelijk tot en met 31 december 2026 en stopt in één keer per 1 januari 2027. Voor teruggeleverde stroom blijft vanaf 2027 een vergoeding bestaan. Tot 1 januari 2030 is het wettelijke minimum 50% van het kale leveringstarief. Terugleverkosten worden apart gerekend; controleer uw eigen contract.',
    'Leg uw productie, verbruik en contracttarieven klaar voor de berekening. Vergelijk eerst dezelfde woning in 2026 en 2027 en bekijk daarna het extra effect van een batterij. Het rapport toont aannames en kan ook uitwijzen dat een batterij niet aantrekkelijk is. Een installateur moet technische geschiktheid op locatie controleren.',
  ].join('\n\n')
  const faq = [
    { vraag: `Zijn er gecontroleerde woningcijfers voor ${name}?`, antwoord: 'Op deze pagina nog niet. Eerdere ononderbouwde lokale cijfers worden niet getoond. Gebruik uw eigen gegevens voor een persoonlijke indicatie.' },
    { vraag: 'Wanneer stopt salderen?', antwoord: 'De regeling stopt op 1 januari 2027. Tot en met 31 december 2026 kunt u nog salderen. Daarna blijft een terugleververgoeding bestaan; uw contractkosten staan daar los van.' },
    { vraag: 'Kan ik mijn rapport zonder adviesaanvraag ontvangen?', antwoord: 'Ja. U kunt het gratis rapport zonder telefoonnummer ontvangen. Een doorverwijzing voor advies kiest u afzonderlijk.' },
  ]
  return {
    slug: path, ...parts,
    titel: copy?.content.titel ?? title,
    metaDescription: copy?.content.meta_description ?? description,
    hoofdtekst: copy?.content.hoofdtekst ?? body,
    faqItems: copy?.content.faq_items ?? faq,
    jsonLd: copy?.content.json_ld ?? { '@context': 'https://schema.org', '@type': 'WebPage', url: `https://saldeerscan.nl${path}`, name: title, description, inLanguage: 'nl-NL' },
    // Never reconstruct missing metrics from build-year defaults or a legacy regional color.
    gemBouwjaar: null, gemHealthScore: null, netcongestieStatus: null, postcodePrefix: null,
    aantalWoningen: copy?.content.aantal_woningen ?? null,
    evidence: copy?.content.source_evidence[0] ?? null,
    reviewedAt: copy ? String(copy.review.date) : null,
    generatedAt: copy ? String(copy.review.date) : typeof row.generated_at === 'string' ? row.generated_at : null,
    quality,
  }
}

/** Existing directory navigation is not certification of its children's local facts. */
export function discoverableHub(childCount: number) { return childCount > 0 }
