export const PSEO_CONTENT_QUALITY_GATE_VERSION = '2026-08-17.v3'

export const CANONICAL_PROVINCE_SLUGS = [
  'noord-holland',
  'zuid-holland',
  'utrecht',
  'noord-brabant',
  'gelderland',
  'overijssel',
  'friesland',
  'groningen',
  'drenthe',
  'flevoland',
  'zeeland',
  'limburg',
] as const

export type PseoContentLevel = 'wijk' | 'straat'

export type PseoEvidenceValue = string | number

export type PseoSourceEvidence = {
  sourceId: string
  sourceUrl: string
  retrievedAt: string
  geography: string
  values: Partial<Record<
    | 'provincie'
    | 'stad'
    | 'wijk'
    | 'straat'
    | 'gem_bouwjaar'
    | 'gem_health_score'
    | 'netcongestie_status'
    | 'aantal_woningen'
    | 'postcode_prefix',
    PseoEvidenceValue
  >>
}

export type PseoQualityReason =
  | 'invalid-province'
  | 'route-record-mismatch'
  | 'missing-indexable-parent'
  | 'missing-source-evidence'
  | 'invalid-generated-at'
  | 'thin-generated-content'
  | 'insufficient-local-specificity'
  | 'obsolete-saldering-claim'
  | 'unsupported-financial-claim'
  | 'unsupported-net-claim'
  | 'unsupported-local-claim'
  | 'unsafe-structured-data'

export type PseoQualityCandidate = {
  level: PseoContentLevel
  slug: string
  provincie: string
  stad: string
  wijk: string | null
  straat: string | null
  titel: string | null
  metaDescription: string | null
  hoofdtekst: string | null
  faqItems: Array<{ vraag: string; antwoord: string }>
  jsonLd: Record<string, unknown>
  gemBouwjaar: number | null
  gemHealthScore: number | null
  netcongestieStatus: string | null
  aantalWoningen: number | null
  postcodePrefix: string | null
  generatedAt: string | null
  sourceEvidence: PseoSourceEvidence[]
}

export type PseoQualityAssessment = {
  gateVersion: typeof PSEO_CONTENT_QUALITY_GATE_VERSION
  indexable: boolean
  displayGeneratedContent: boolean
  hasSufficientEvidence: boolean
  wordCount: number
  reasons: PseoQualityReason[]
}

export type PseoQualityDatabaseRow = {
  slug: string
  provincie: string
  stad: string
  wijk: string | null
  straat: string | null
  titel: string | null
  meta_description: string | null
  hoofdtekst: string | null
  faq_items: unknown
  json_ld: unknown
  gem_bouwjaar: number | null
  gem_health_score: number | null
  netcongestie_status: string | null
  aantal_woningen: number | null
  postcode_prefix: string | null
  generated_at: string | null
  source_evidence?: PseoSourceEvidence[] | null
}

const INVALID_STRUCTURED_DATA_SENTINEL = '__invalid_pseo_json_ld'

function hasValidJsonLdGraphs(value: unknown): boolean {
  if (Array.isArray(value)) return value.every(hasValidJsonLdGraphs)
  if (!value || typeof value !== 'object') return true

  const record = value as Record<string, unknown>
  if (
    '@graph' in record
    && (
      !Array.isArray(record['@graph'])
      || record['@graph'].some(node =>
        !node || typeof node !== 'object' || Array.isArray(node) || !hasValidJsonLdGraphs(node))
    )
  ) return false

  return Object.values(record).every(hasValidJsonLdGraphs)
}

export function normalizePseoFaqItems(value: unknown): Array<{ vraag: string; antwoord: string }> {
  if (!Array.isArray(value)) return []
  return value.flatMap(item => {
    if (!item || typeof item !== 'object') return []
    const record = item as Record<string, unknown>
    return typeof record.vraag === 'string' && typeof record.antwoord === 'string'
      ? [{ vraag: record.vraag, antwoord: record.antwoord }]
      : []
  })
}

export function normalizePseoJsonLd(value: unknown): Record<string, unknown> {
  if (value == null) return {}
  if (typeof value !== 'object' || Array.isArray(value)) {
    return { [INVALID_STRUCTURED_DATA_SENTINEL]: true }
  }

  const record = value as Record<string, unknown>
  if (!hasValidJsonLdGraphs(record)) {
    return { [INVALID_STRUCTURED_DATA_SENTINEL]: true }
  }

  return record
}

const SOURCE_FAMILY_BY_HOST: ReadonlyMap<string, string> = new Map([
  ['api.pdok.nl', 'pdok'],
  ['service.pdok.nl', 'pdok'],
  ['opendata.cbs.nl', 'cbs'],
  ['cbs.nl', 'cbs'],
  ['www.cbs.nl', 'cbs'],
  ['bagviewer.kadaster.nl', 'kadaster'],
  ['www.kadaster.nl', 'kadaster'],
  ['saldeerscan.nl', 'saldeerscan'],
  ['www.saldeerscan.nl', 'saldeerscan'],
])

const MAX_SOURCE_AGE_MS = 2 * 366 * 24 * 60 * 60 * 1000
const GATE_POLICY_REFERENCE_MS = Date.parse('2026-08-18T00:00:00.000Z')
const GATE_POLICY_VALID_UNTIL_MS = Date.parse('2027-01-01T00:00:00.000Z')

const OBSOLETE_SALDERING_PATTERNS = [
  /2026.{0,80}28\s*%|28\s*%.{0,80}2026/i,
  /2025.{0,80}64\s*%|64\s*%.{0,80}2025/i,
  /salder\w*.{0,180}(?:stapsgewijs|geleidelijk|gefaseerd)/i,
  /(?:stapsgewijs|geleidelijk|gefaseerd).{0,180}salder/i,
  /afbouw\w*.{0,120}(?:start|vanaf|na).{0,80}(?:2025|2026|1\s+januari\s+2027)/i,
  /(?:na|vanaf)\s+1\s+januari\s+2027.{0,160}(?:afbouw|afgebouwd|geleidelijk|stapsgewijs|gefaseerd)/i,
  /(?:salder\w*|mogelijkheid\s+tot\s+salderen).{0,180}(?:neemt\s+(?:jaarlijks\s+)?af|afneemt|vermindert|wordt\s+minder|loopt\s+terug|daalt)/i,
  /(?:neemt\s+(?:jaarlijks\s+)?af|afneemt|vermindert|wordt\s+minder|loopt\s+terug|daalt).{0,180}(?:salder\w*|mogelijkheid\s+tot\s+salderen)/i,
  /neemt.{0,100}(?:salder\w*|mogelijkheid\s+tot\s+salderen).{0,100}\baf\b/i,
  /\b(?:regeling|verreken\w*)\b[^.!?]{0,180}\b(?:(?:elk|ieder)\s+jaar|jaarlijks|minder|kleiner|helft|deel|percentage|beperk\w*|afnem\w*|overblij\w*)\b/i,
  /\b(?:vanaf\s+(?:2027|die\s+datum)|daarna|dan)\b[^.!?]{0,180}\b(?:(?:elk|ieder)\s+jaar|jaarlijks|minder|kleiner|helft|deel|percentage|beperk\w*|afnem\w*|overblij\w*|verreken\w*)\b/i,
]

const UNSUPPORTED_NET_PATTERNS = [
  /teruglever\w*.{0,100}(?:actief gereguleerd|al gereguleerd|wordt beperkt|al beperkt|beperkingen? (?:opleggen|ontstaan|verwacht))/i,
  /(?:dreigende|verwachte)\s+beperkingen?.{0,80}teruglever\w*.{0,50}verwacht/i,
  /beperkingen?\s+(?:op|voor)\s+teruglever\w*.{0,40}(?:al\s+)?actief/i,
  /directe\s+gevolgen\s+voor\s+teruglever\w*/i,
  /(?:netcongestie|netdruk|stroomnet|elektriciteitsnet).{0,160}teruglever\w*|teruglever\w*.{0,160}(?:netcongestie|netdruk|stroomnet|elektriciteitsnet)/i,
  /teruglever\w*.{0,100}(?:onmogelijk|onhaalbaar|verboden)|(?:onmogelijk|onhaalbaar|verboden).{0,100}teruglever\w*/i,
  /(?:kan|kunt|kunnen|mag|mogen).{0,60}(?:niet|geen|nauwelijks).{0,40}(?:stroom\s+)?teruglever\w*|(?:geen|niet|nauwelijks)\s+(?:stroom\s+)?teruglever\w*/i,
  /(?:net|stroomnet|elektriciteitsnet).{0,100}(?:maximale capaciteit|overbelast|vol raakt|volledig vol)/i,
  /(?:thuis)?batterij.{0,120}(?:essentieel|cruciaal|noodzakelijk|(?:een\s+)?noodzaak|onmisbaar|geen luxe|sterk aanbevolen|verplicht)|(?:essentieel|cruciaal|noodzakelijk|(?:een\s+)?noodzaak|onmisbaar|geen luxe|sterk aanbevolen|verplicht).{0,120}(?:thuis)?batterij/i,
  /(?:thuis)?batterij.{0,140}(?:advis\w*|aanbevel\w*|aangeraden|beste keuze|zou\s+moeten\s+overwegen)|(?:advis\w*|aanbevel\w*|aangeraden|beste keuze|zou\s+moeten\s+overwegen).{0,140}(?:thuis)?batterij/i,
  /(?:accu|thuisopslag|energieopslag).{0,140}(?:essentieel|nodig|aanbevel\w*|advis\w*|beste|verstandigste|keuze|oplossing)|(?:essentieel|nodig|aanbevel\w*|advis\w*|beste|verstandigste).{0,140}(?:accu|thuisopslag|energieopslag)/i,
  /(?:opslagsysteem|energieopslagsysteem).{0,140}(?:logische|verstandige|beste|nodige)\s+(?:stap|keuze|oplossing)|(?:logische|verstandige|beste|nodige)\s+(?:stap|keuze|oplossing).{0,140}(?:opslagsysteem|energieopslagsysteem)/i,
  /(?:Liander|Enexis|Stedin|Netbeheer Nederland|Netbeheer NL)/i,
  /(?:Liander|Enexis|Stedin).{0,80}(?:beheert|is\s+de\s+netbeheerder)|(?:netbeheerder\s+(?:is|zou\s+zijn)).{0,40}(?:Liander|Enexis|Stedin)/i,
]

const UNSUPPORTED_LOCAL_PATTERNS = [
  /(?:dak|daken).{0,140}\bgeschikt\b|\bgeschikt\b.{0,140}(?:dak|daken)/i,
  /(?:dak|daken|dakvlak|dakvlakken).{0,140}(?:lenen\s+zich|passen\s+(?:goed|uitstekend)|ideaal|optimaal)|(?:lenen\s+zich|passen\s+(?:goed|uitstekend)|ideaal|optimaal).{0,140}(?:dak|daken|dakvlak|dakvlakken)/i,
  /(?:dak|daken|dakvlak|dakvlakken).{0,160}zonnepanelen.{0,100}(?:zonder\s+problemen|probleemloos|(?:kunnen\s+)?worden\s+geplaatst|plaatsbaar)|(?:dak|daken|dakvlak|dakvlakken).{0,160}(?:zonder\s+problemen|probleemloos).{0,100}zonnepanelen|zonnepanelen.{0,160}(?:zonder\s+problemen|probleemloos|(?:kunnen\s+)?worden\s+geplaatst|plaatsbaar).{0,100}(?:dak|daken|dakvlak|dakvlakken)/i,
  /(?:dak|daken|woning\w*).{0,120}(?:uitstekend geschikt|over het algemeen geschikt|in de meeste gevallen geschikt|(?:meestal|vaak)\s+geschikt|minimaal\s+\d+\s+zonnepanelen)/i,
  /groepenkast.{0,160}(?:vaak|veel woningen|noodzakelijk|vereist|essentieel|(?:een\s+)?(?:upgrade|vervanging|aanpassing)\s+nodig)|(?:upgrade|vervanging|aanpassing).{0,100}(?:nodig|vereist|noodzakelijk|essentieel).{0,100}groepenkast/i,
  /(?:veel|de meeste)\s+(?:woningeigenaren|eigenaren|woningen).{0,140}(?:geïnvesteerd|gerenoveerd|verbeterd|groepenkast)/i,
  /renovatiegolf|renovatiehistorie/i,
  /lokale subsid\w*.{0,100}(?:beschikbaar|van toepassing|mogelijk)/i,
  /ISDE.{0,120}(?:dakcheck|dakinspectie|groepenkast|zonnepanelen|thuisbatterij|batterij).{0,80}(?:dekt|dekken|vergoed|betaalt|kosten)|(?:dakcheck|dakinspectie|groepenkast|zonnepanelen|thuisbatterij|batterij).{0,120}ISDE.{0,80}(?:dekt|dekken|vergoed|betaalt|kosten)/i,
  /(?:top\s*10\s*%|top\s*25\s*%).{0,80}(?:rendabel|wijk)/i,
  /(?:wacht niet|uitstel is geen optie|nu (?:hét|het) moment|verzeker\w* (?:u|uw)|gegarandeerd|garandeert)/i,
]

const FINANCIAL_PATTERNS = [
  /€/u,
  /\b(?:euro|EUR)\b/i,
  /\b(?:terugverdientijd|investering|besparing|rendement|opbrengst|verlies|kosten?|prijs|tarief|bedrag)\b/i,
  /\b(?:EUR\s*\d[\d.,]*|\d[\d.,]*(?:\s*(?:-|–|tot|en)\s*\d[\d.,]*)?\s*(?:euro|EUR))\b/i,
  /terugverdientijd.{0,100}\b\d+(?:[.,]\d+)?(?:\s*(?:-|–|tot)\s*\d+(?:[.,]\d+)?)?\s*(?:jaar|jaren)\b/i,
  /terugverdientijd.{0,100}\b(?:een|twee|drie|vier|vijf|zes|zeven|acht|negen|tien|elf|twaalf|dertien|veertien|vijftien|twintig)\s+(?:jaar|jaren)\b/i,
  /verdien\w*.{0,120}\b(?:binnen\s+)?(?:een|twee|drie|vier|vijf|zes|zeven|acht|negen|tien|elf|twaalf|\d+)\s+(?:jaar|jaren)\b.{0,40}\bterug\b/i,
  /\b(?:nul|een|twee|drie|vier|vijf|zes|zeven|acht|negen|tien|honderd|duizend|miljoen)(?:[\s-]+(?:honderd|duizend|miljoen|\w+))?\s+euro\b/i,
  /\b(?:besparing|rendement|opbrengst|verlies).{0,100}\b\d+(?:[.,]\d+)?\s*%/i,
  /\b(?:\d{1,2}\s*(?:-|–|tot)\s*)?\d{1,2}\s*%\s+(?:hoger|lager|extra)/i,
]

const CURRENT_SALDERING_STOP_PATTERNS = [
  /31\s+december\s+2026.{0,180}(?:stopt|eindigt).{0,80}1\s+januari\s+2027/i,
  /(?:stopt|eindigt).{0,80}1\s+januari\s+2027.{0,180}31\s+december\s+2026/i,
]
const SALDERING_TOKEN_PATTERN = /\b(?:ge)?sald(?:eer|er)\w*/i
const CONTRADICTED_CURRENT_LAW_PATTERNS = [
  /\bgeen\b.{0,80}(?:stop|eind)datum.{0,40}\b(?:ge)?sald(?:eer|er)\w*/i,
  /\b(?:ge)?sald(?:eer|er)\w*.{0,120}\b(?:onjuist|niet\s+juist|niet\s+waar|klopt\s+niet|verzonnen|bestaat\s+niet)\b/i,
  /\b(?:onjuist|niet\s+juist|niet\s+waar|klopt\s+niet|verzonnen|bestaat\s+niet)\b.{0,120}\b(?:ge)?sald(?:eer|er)\w*/i,
]

const APPROVED_SALDERING_COPY_PATTERNS = [
  /(?:^|[.!?]\s+|\n+)salderen\s+blijft\s+(?:100\s*%|honderd\s+procent)\s+mogelijk\s+tot\s+en\s+met\s+31\s+december\s+2026\s+en\s+(?:de\s+regeling\s+)?(?:stopt|eindigt)\s+(?:daarna\s+)?(?:in\s+(?:één|een)\s+keer\s+)?(?:per|op)\s+1\s+januari\s+2027(?=[.!?](?:\s|$))/giu,
]

const SAFE_QUALIFICATION_REPLACEMENTS: Array<[RegExp, string]> = [
  [/(?:bewijst|betekent|zegt)\s+(?:niet|geen)\s+(?:dat|of)?\s*(?:teruglever\w*[^,;.!?]{0,160}?(?:wordt|is)\s+(?:actief\s+)?beperkt|(?:een\s+)?actieve?\s+terugleverbeperking)/gi, ' teruglevering '],
  [/(?:bewijst|betekent|zegt|maakt)[^,;.!?]{0,100}(?:niet|geen|evenmin)[^,;.!?]{0,100}(?:thuis)?batterij[^,;.!?]{0,80}(?:nodig|essentieel|cruciaal|noodzakelijk|verplicht)/gi, ' thuisbatterij '],
  [/geen\s+(?:automatisch\s+|individueel\s+)?(?:thuis)?batterijadvies/gi, ' '],
  [/(?:thuis)?batterij\s+(?:is|wordt)\s+(?:niet|geen)\s+(?:automatisch\s+|per\s+definitie\s+)?(?:nodig|essentieel|cruciaal|noodzakelijk|verplicht)/gi, ' thuisbatterij '],
  [/(?:is|wordt)\s+(?:niet|geen)\s+(?:automatisch\s+|per\s+definitie\s+)?(?:essentieel|cruciaal|noodzakelijk|verplicht)/gi, ' thuisbatterij '],
  [/salder\w*[^,;.!?]{0,100}?\b(?:niet|geen)\b[^,;.!?]{0,40}?(?:stapsgewijs|geleidelijk|gefaseerd)\s+afgebouwd/gi, ' salderingsregeling '],
  [/(?:eerder\s+voorgestelde|oude)\s+afbouwschema[^,;.!?]{0,80}?(?:verworpen|gaat\s+niet\s+door)/gi, ' '],
]

const UNSAFE_STRUCTURED_KEY_PATTERN = /"(?:price|lowPrice|highPrice|priceCurrency|estimatedCost|annualSaving|annualSavings)"\s*:/i

function hasPattern(value: string, patterns: RegExp[]) {
  const normalized = value.replace(/\s+/g, ' ')
  return patterns.some(pattern => pattern.test(normalized))
}

function withoutExplicitSafetyQualifications(value: string): string {
  return SAFE_QUALIFICATION_REPLACEMENTS.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    value.replace(/\s+/g, ' '),
  )
}

function withoutApprovedSalderingCopy(value: string): string {
  return APPROVED_SALDERING_COPY_PATTERNS.reduce(
    (result, pattern) => result.replace(pattern, ' '),
    value,
  )
}

function plainText(value: string | null): string {
  return (value ?? '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function countWords(value: string | null): number {
  const normalized = plainText(value)
  return normalized ? normalized.split(' ').length : 0
}

function normalizedContentUnit(value: string): string {
  return plainText(value)
    .toLocaleLowerCase('nl-NL')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
}

function contentTokenSet(value: string): Set<string> {
  return new Set(normalizedContentUnit(value).split(' ').filter(token => token.length >= 3))
}

function contentSimilarity(left: string, right: string): number {
  const leftTokens = contentTokenSet(left)
  const rightTokens = contentTokenSet(right)
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0
  const intersection = [...leftTokens].filter(token => rightTokens.has(token)).length
  const union = new Set([...leftTokens, ...rightTokens]).size
  return union > 0 ? intersection / union : 0
}

function hasNearDuplicateCluster(units: string[], maximumClusterSize: number): boolean {
  return units.some((unit, index) => {
    const clusterSize = units.reduce((count, candidate, candidateIndex) =>
      count + (candidateIndex === index || contentSimilarity(unit, candidate) >= 0.8 ? 1 : 0), 0)
    return clusterSize > maximumClusterSize
  })
}

function hasSufficientContentDiversity(candidate: PseoQualityCandidate): boolean {
  const substantiveParagraphs = (candidate.hoofdtekst ?? '')
    .split(/\n\s*\n/)
    .map(plainText)
    .filter(paragraph => countWords(paragraph) >= 25)
  const uniqueParagraphs = new Set(substantiveParagraphs.map(normalizedContentUnit))
  const substantiveSentences = plainText(candidate.hoofdtekst)
    .split(/(?<=[.!?])\s+/)
    .filter(sentence => countWords(sentence) >= 6)
  const uniqueSentences = new Set(substantiveSentences.map(normalizedContentUnit))
  const uniqueSentenceRatio = substantiveSentences.length > 0
    ? uniqueSentences.size / substantiveSentences.length
    : 0
  const substantiveFaq = candidate.faqItems.length >= 3
    && candidate.faqItems.every(faq =>
      plainText(faq.vraag).length >= 20 && countWords(faq.antwoord) >= 12)
    && !hasNearDuplicateCluster(candidate.faqItems.map(faq => faq.vraag), 1)
    && !hasNearDuplicateCluster(candidate.faqItems.map(faq => faq.antwoord), 1)

  return substantiveParagraphs.length >= 4
    && uniqueParagraphs.size >= 4
    && substantiveSentences.length >= 8
    && uniqueSentenceRatio >= 0.65
    && !hasNearDuplicateCluster(substantiveSentences, 2)
    && substantiveFaq
}

function isValidYear(value: number | null): value is number {
  return Number.isInteger(value) && value! >= 1600 && value! <= 2027
}

function isValidScore(value: number | null): value is number {
  return Number.isFinite(value) && value! >= 1 && value! <= 100
}

function isValidHouseCount(value: number | null): value is number {
  return Number.isInteger(value) && value! >= 1 && value! <= 250_000
}

function isValidPostcodePrefix(value: string | null): value is string {
  return /^[1-9]\d{3}$/.test(value ?? '')
}

function normalizedEvidenceValue(value: unknown): string {
  return String(value ?? '').trim().toLocaleLowerCase('nl-NL')
}

function isApprovedSourceEvidence(
  evidence: PseoSourceEvidence,
  slug: string,
  generatedAt: string | null,
): boolean {
  if (!evidence || typeof evidence !== 'object') return false
  if (
    typeof evidence.geography !== 'string'
    || typeof evidence.sourceId !== 'string'
    || typeof evidence.sourceUrl !== 'string'
    || typeof evidence.retrievedAt !== 'string'
    || !evidence.values
    || typeof evidence.values !== 'object'
  ) return false
  if (evidence.geography !== slug || evidence.sourceId.trim().length < 6) return false
  const retrievedAt = Date.parse(evidence.retrievedAt)
  const generatedAtTime = Date.parse(generatedAt ?? '')
  if (!Number.isFinite(retrievedAt) || !Number.isFinite(generatedAtTime)) return false
  if (generatedAtTime >= GATE_POLICY_VALID_UNTIL_MS) return false
  if (
    retrievedAt > generatedAtTime
    || retrievedAt > GATE_POLICY_REFERENCE_MS
    || GATE_POLICY_REFERENCE_MS - retrievedAt > MAX_SOURCE_AGE_MS
    || generatedAtTime - retrievedAt > MAX_SOURCE_AGE_MS
  ) return false
  try {
    const url = new URL(evidence.sourceUrl)
    return url.protocol === 'https:'
      && !url.username
      && !url.password
      && !url.port
      && SOURCE_FAMILY_BY_HOST.has(url.hostname)
  } catch {
    return false
  }
}

function sourceFamily(evidence: PseoSourceEvidence): string | null {
  try {
    return SOURCE_FAMILY_BY_HOST.get(new URL(evidence.sourceUrl).hostname) ?? null
  } catch {
    return null
  }
}

function evidenceMatches(
  evidence: PseoSourceEvidence[],
  field: keyof PseoSourceEvidence['values'],
  value: unknown,
): boolean {
  const expected = normalizedEvidenceValue(value)
  return expected.length > 0 && evidence.some(item =>
    normalizedEvidenceValue(item.values?.[field]) === expected)
}

function expectedSlug(candidate: PseoQualityCandidate): string | null {
  if (!candidate.wijk) return null
  const base = `/${candidate.provincie}/${candidate.stad}/${candidate.wijk}`
  return candidate.level === 'straat' && candidate.straat
    ? `${base}/${candidate.straat}`
    : candidate.level === 'wijk' && !candidate.straat
      ? base
      : null
}

function structuredText(candidate: PseoQualityCandidate): string {
  return JSON.stringify(normalizePseoJsonLd(candidate.jsonLd))
}

function generatedText(candidate: PseoQualityCandidate): string {
  return [
    candidate.titel,
    candidate.metaDescription,
    candidate.hoofdtekst,
    ...candidate.faqItems.flatMap(faq => [faq.vraag, faq.antwoord]),
  ]
    .filter((value): value is string => typeof value === 'string')
    .join('\n')
}

export function hasSufficientPseoEvidence(candidate: Pick<
  PseoQualityCandidate,
  | 'level'
  | 'slug'
  | 'provincie'
  | 'stad'
  | 'wijk'
  | 'straat'
  | 'gemBouwjaar'
  | 'gemHealthScore'
  | 'netcongestieStatus'
  | 'aantalWoningen'
  | 'postcodePrefix'
  | 'generatedAt'
  | 'sourceEvidence'
>): boolean {
  const hasYear = isValidYear(candidate.gemBouwjaar)
  const hasScore = isValidScore(candidate.gemHealthScore)
  const hasHomes = isValidHouseCount(candidate.aantalWoningen)
  const hasPostcode = isValidPostcodePrefix(candidate.postcodePrefix)

  const approvedEvidence = candidate.sourceEvidence.filter(item =>
    isApprovedSourceEvidence(item, candidate.slug, candidate.generatedAt))
  const uniqueSources = new Set(approvedEvidence.map(item => item.sourceId))
  const uniqueSourceUrls = new Set(approvedEvidence.map(item => new URL(item.sourceUrl).toString()))
  const sourceFamilies = new Set(approvedEvidence.map(sourceFamily).filter(Boolean))
  const externalSourceFamilies = new Set(
    approvedEvidence
      .map(sourceFamily)
      .filter(family => family && family !== 'saldeerscan'),
  )
  const identityMatches = evidenceMatches(approvedEvidence, 'provincie', candidate.provincie)
    && evidenceMatches(approvedEvidence, 'stad', candidate.stad)
    && evidenceMatches(approvedEvidence, 'wijk', candidate.wijk)
    && (candidate.level === 'wijk'
      || evidenceMatches(approvedEvidence, 'straat', candidate.straat))
  const metricMatches = evidenceMatches(approvedEvidence, 'gem_bouwjaar', candidate.gemBouwjaar)
    && evidenceMatches(approvedEvidence, 'gem_health_score', candidate.gemHealthScore)
    && evidenceMatches(approvedEvidence, 'aantal_woningen', candidate.aantalWoningen)
    && evidenceMatches(approvedEvidence, 'postcode_prefix', candidate.postcodePrefix)
    && (!candidate.netcongestieStatus
      || evidenceMatches(approvedEvidence, 'netcongestie_status', candidate.netcongestieStatus))

  return hasYear
    && hasScore
    && hasHomes
    && hasPostcode
    && uniqueSources.size >= 2
    && uniqueSources.size === approvedEvidence.length
    && uniqueSourceUrls.size === approvedEvidence.length
    && sourceFamilies.size >= 2
    && externalSourceFamilies.size >= 2
    && identityMatches
    && metricMatches
}

export function assessPseoContentQuality(
  candidate: PseoQualityCandidate,
): PseoQualityAssessment {
  const reasons: PseoQualityReason[] = []
  const bodyWordCount = countWords(candidate.hoofdtekst)
  const allGeneratedText = generatedText(candidate)
  const generatedClaimsText = withoutExplicitSafetyQualifications(
    withoutApprovedSalderingCopy(allGeneratedText),
  )
  const allStructuredText = structuredText(candidate)
  const structuredClaimsText = withoutExplicitSafetyQualifications(
    withoutApprovedSalderingCopy(allStructuredText),
  )
  const expected = expectedSlug(candidate)
  const locationNeedle = (candidate.level === 'straat' ? candidate.straat : candidate.wijk)
    ?.replace(/-/g, ' ')
    .toLocaleLowerCase('nl-NL')
  const locationMentions = locationNeedle
    ? allGeneratedText.toLocaleLowerCase('nl-NL').split(locationNeedle).length - 1
    : 0
  const hasSufficientEvidence = hasSufficientPseoEvidence(candidate)
  const bodyText = plainText(candidate.hoofdtekst).toLocaleLowerCase('nl-NL')
  const bodyDigits = bodyText.replace(/\D/g, '')
  const localFactsPresent = [
    String(candidate.gemBouwjaar ?? ''),
    String(candidate.gemHealthScore ?? ''),
    String(candidate.postcodePrefix ?? ''),
  ].every(value => value.length > 0 && bodyText.includes(value.toLocaleLowerCase('nl-NL')))
    && String(candidate.aantalWoningen ?? '').length > 0
    && bodyDigits.includes(String(candidate.aantalWoningen))

  if (!CANONICAL_PROVINCE_SLUGS.includes(candidate.provincie as (typeof CANONICAL_PROVINCE_SLUGS)[number])) {
    reasons.push('invalid-province')
  }
  if (!expected || candidate.slug !== expected) reasons.push('route-record-mismatch')
  if (!hasSufficientEvidence) reasons.push('missing-source-evidence')
  if (!candidate.generatedAt || !Number.isFinite(Date.parse(candidate.generatedAt))) {
    reasons.push('invalid-generated-at')
  }
  if (
    bodyWordCount < 180
    || plainText(candidate.titel).length < 12
    || plainText(candidate.metaDescription).length < 50
    || candidate.faqItems.length < 3
    || !hasSufficientContentDiversity(candidate)
  ) {
    reasons.push('thin-generated-content')
  }
  if (locationMentions < 3 || !localFactsPresent) {
    reasons.push('insufficient-local-specificity')
  }
  const discussesSaldering = SALDERING_TOKEN_PATTERN.test(allGeneratedText)
  if (
    hasPattern(generatedClaimsText, OBSOLETE_SALDERING_PATTERNS)
    || hasPattern(allGeneratedText, CONTRADICTED_CURRENT_LAW_PATTERNS)
    || SALDERING_TOKEN_PATTERN.test(generatedClaimsText)
    || (discussesSaldering && !hasPattern(allGeneratedText, CURRENT_SALDERING_STOP_PATTERNS))
  ) {
    reasons.push('obsolete-saldering-claim')
  }
  if (hasPattern(allGeneratedText, FINANCIAL_PATTERNS)) {
    reasons.push('unsupported-financial-claim')
  }
  if (hasPattern(generatedClaimsText, UNSUPPORTED_NET_PATTERNS)) {
    reasons.push('unsupported-net-claim')
  }
  if (hasPattern(allGeneratedText, UNSUPPORTED_LOCAL_PATTERNS)) {
    reasons.push('unsupported-local-claim')
  }
  if (
    allStructuredText.includes(`"${INVALID_STRUCTURED_DATA_SENTINEL}":true`)
    || UNSAFE_STRUCTURED_KEY_PATTERN.test(allStructuredText)
    || hasPattern(structuredClaimsText, [
      ...OBSOLETE_SALDERING_PATTERNS,
      ...CONTRADICTED_CURRENT_LAW_PATTERNS,
      ...FINANCIAL_PATTERNS,
      ...UNSUPPORTED_NET_PATTERNS,
      ...UNSUPPORTED_LOCAL_PATTERNS,
    ])
    || SALDERING_TOKEN_PATTERN.test(structuredClaimsText)
  ) {
    reasons.push('unsafe-structured-data')
  }

  return {
    gateVersion: PSEO_CONTENT_QUALITY_GATE_VERSION,
    indexable: reasons.length === 0,
    displayGeneratedContent: reasons.length === 0,
    hasSufficientEvidence,
    wordCount: bodyWordCount,
    reasons,
  }
}

export function assessPseoDatabaseRow(row: PseoQualityDatabaseRow): PseoQualityAssessment {
  return assessPseoContentQuality({
    level: row.straat ? 'straat' : 'wijk',
    slug: row.slug,
    provincie: row.provincie,
    stad: row.stad,
    wijk: row.wijk,
    straat: row.straat,
    titel: row.titel,
    metaDescription: row.meta_description,
    hoofdtekst: row.hoofdtekst,
    faqItems: normalizePseoFaqItems(row.faq_items),
    jsonLd: normalizePseoJsonLd(row.json_ld),
    gemBouwjaar: row.gem_bouwjaar,
    gemHealthScore: row.gem_health_score,
    netcongestieStatus: row.netcongestie_status,
    aantalWoningen: row.aantal_woningen,
    postcodePrefix: row.postcode_prefix,
    generatedAt: row.generated_at,
    sourceEvidence: Array.isArray(row.source_evidence) ? row.source_evidence : [],
  })
}

export function requireIndexablePseoParent(
  assessment: PseoQualityAssessment,
  parentIndexable: boolean,
): PseoQualityAssessment {
  if (parentIndexable) return assessment
  return {
    ...assessment,
    indexable: false,
    displayGeneratedContent: false,
    reasons: assessment.reasons.includes('missing-indexable-parent')
      ? assessment.reasons
      : ['missing-indexable-parent', ...assessment.reasons],
  }
}

export function filterIndexablePseoDatabaseRows<T extends PseoQualityDatabaseRow>(
  rows: T[],
): T[] {
  const qualityBySlug = new Map(rows.map(row => [row.slug, assessPseoDatabaseRow(row)]))
  const indexableWijkSlugs = new Set(
    rows
      .filter(row => !row.straat && qualityBySlug.get(row.slug)?.indexable)
      .map(row => row.slug),
  )

  return rows.filter(row => {
    if (!qualityBySlug.get(row.slug)?.indexable) return false
    if (!row.straat) return true
    const parts = row.slug.split('/').filter(Boolean)
    return parts.length === 4
      && indexableWijkSlugs.has(`/${parts.slice(0, 3).join('/')}`)
  })
}

export function formatLocationSlug(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\bijssel/g, 'IJssel')
    .replace(/\b[a-zà-ÿ]/gi, letter => letter.toLocaleUpperCase('nl-NL'))
}

export function buildSafePseoFallback(candidate: PseoQualityCandidate): {
  titel: string
  metaDescription: string
  hoofdtekst: string
  faqItems: Array<{ vraag: string; antwoord: string }>
  jsonLd: Record<string, unknown>
} {
  const localSlug = candidate.level === 'straat'
    ? candidate.straat ?? candidate.wijk ?? 'deze-locatie'
    : candidate.wijk ?? 'deze-locatie'
  const localLabel = formatLocationSlug(localSlug)
  const stadLabel = formatLocationSlug(candidate.stad)
  const levelLabel = candidate.level === 'straat' ? 'straat' : 'wijk'
  const hasEvidence = hasSufficientPseoEvidence(candidate)
  const facts = hasEvidence ? [
    isValidYear(candidate.gemBouwjaar)
      ? `Het huidige gegevensrecord vermeldt een gemiddeld bouwjaar van ${candidate.gemBouwjaar}.`
      : null,
    isValidHouseCount(candidate.aantalWoningen)
      ? `Het record bevat een telling van ${candidate.aantalWoningen.toLocaleString('nl-NL')} woningen.`
      : null,
    isValidPostcodePrefix(candidate.postcodePrefix)
      ? `De geregistreerde postcodeprefix is ${candidate.postcodePrefix}.`
      : null,
  ].filter(Boolean).join(' ') : ''
  const netCopy = hasEvidence && ['ROOD', 'ORANJE', 'GROEN'].includes(candidate.netcongestieStatus ?? '')
    ? `Voor ${localLabel} is de regionale netindicatie ${candidate.netcongestieStatus} opgeslagen. Een regionale kleur zegt niet of teruglevering op een individuele woningaansluiting wordt beperkt; controleer de actuele situatie bij de netbeheerder voor het adres.`
    : `Voor deze ${levelLabel} is geen bruikbare regionale netindicatie beschikbaar. Controleer de actuele situatie bij de netbeheerder voor het adres.`

  const hoofdtekst = [
    `Deze pagina toont alleen de geregistreerde locatiegegevens voor ${localLabel} in ${stadLabel}. Gemiddelden op ${levelLabel}niveau beschrijven geen individueel dak, aansluiting, energiecontract of verbruiksprofiel.`,
    facts || `Het huidige record bevat onvoldoende onderbouwde lokale kenmerken om algemene conclusies over woningen in ${localLabel} te trekken.`,
    'Salderen blijft 100% mogelijk tot en met 31 december 2026 en stopt in één keer per 1 januari 2027. Vanaf 2027 blijft een leveranciersafhankelijke vergoeding voor teruggeleverde stroom bestaan.',
    netCopy,
    'Een financieel bedrag, terugverdientijd, passend aantal panelen of batterijadvies kan niet betrouwbaar uit een wijk- of straatgemiddelde worden afgeleid. Daarvoor zijn minimaal het eigen verbruik, dakvlak, installatie, tarieven en contractvoorwaarden nodig.',
  ].join('\n\n')

  return {
    titel: `Zonnepanelen in ${localLabel} — lokale gegevens`,
    metaDescription: `Bekijk geregistreerde woninggegevens voor ${localLabel} in ${stadLabel}, met uitleg over de stop van salderen per 1 januari 2027 en de grenzen van locatiegemiddelden.`,
    hoofdtekst,
    faqItems: [
      {
        vraag: `Wat zeggen de gegevens over ${localLabel}?`,
        antwoord: facts || `Het record bevat onvoldoende onderbouwde lokale kenmerken voor een inhoudelijke conclusie over woningen in ${localLabel}.`,
      },
      {
        vraag: 'Wanneer stopt de salderingsregeling?',
        antwoord: 'Salderen blijft 100% mogelijk tot en met 31 december 2026 en stopt in één keer per 1 januari 2027. Daarna blijft een leveranciersafhankelijke terugleververgoeding bestaan.',
      },
      {
        vraag: 'Kan deze locatiepagina mijn besparing of terugverdientijd bepalen?',
        antwoord: 'Nee. Een locatiegemiddelde mist gegevens over uw eigen verbruik, dak, installatie en energiecontract. Gebruik daarvoor een adresgerichte berekening en controleer de gebruikte aannames.',
      },
    ],
    jsonLd: {},
  }
}

export function assessPseoHubQuality(input: {
  level: 'provincie' | 'stad'
  childCount: number
  evidenceChildCount: number
}): { indexable: boolean; reason: 'sufficient-aggregate' | 'insufficient-aggregate' } {
  const minimum = input.level === 'stad' ? 2 : 1
  const indexable = input.childCount >= minimum && input.evidenceChildCount >= minimum
  return {
    indexable,
    reason: indexable ? 'sufficient-aggregate' : 'insufficient-aggregate',
  }
}
