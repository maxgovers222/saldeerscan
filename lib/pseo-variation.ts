/**
 * Pure pSEO helpers — variation, urgency narratives and aggregates.
 * Logic mirrored from app/[provincie]/[stad]/[wijk]/page.tsx where applicable.
 */

export type NetcongestieStatus = 'ROOD' | 'ORANJE' | 'GROEN'

export type RenovatieContent = { titel: string; tekst: string }

/** Row shape from getWijkenByStad() in lib/pseo.ts */
export type WijkStadRow = {
  wijk: string
  gem_bouwjaar: number | null
  gem_health_score: number | null
  netcongestie_status: string | null
  aantal_woningen: number | null
}

/** WijkStadRow extended with stad slug — returned by getUrgentWijkenByProvincie() */
export type WijkStadRowWithStad = WijkStadRow & { stad: string }

export type StraatWijkMetrics = {
  gemBouwjaar: number | null
  gemHealthScore: number | null
  netcongestieStatus: string | null
}

export type StadSummary = {
  wijkCount: number
  totaalWoningen: number
  gemiddeldBouwjaar: number | null
  gemiddeldeScore: number | null
  netcongestie: Record<'ROOD' | 'ORANJE' | 'GROEN' | 'onbekend', number>
  ernstigsteNet: NetcongestieStatus | null
}

export type PostcodeClusterSummary = {
  wijkCount: number
  uniekeSteden: number
  uniekeProvincies: number
  netcongestie: Record<'ROOD' | 'ORANJE' | 'GROEN' | 'onbekend', number>
  ernstigsteNet: NetcongestieStatus | null
  /** Korte copy voor SEO-componenten */
  kop: string
}

export type StraatVsWijkDeltaResult = {
  streetScore: number
  parentWijkScore: number
  deltaScore: number
  streetBesparing: number
  wijkBesparing: number
  deltaBesparing: number
  deltaBouwjaar: number | null
  /** Korte vergelijkende zin */
  samenvatting: string
}

// ── Core score & savings (wijk page) ────────────────────────────────────────

export function resolveWijkScore(bouwjaar: number | null, healthScore: number | null): number {
  if (healthScore !== null && healthScore > 0) return healthScore
  if (!bouwjaar) return 52
  if (bouwjaar < 1960) return 34
  if (bouwjaar < 1975) return 44
  if (bouwjaar < 1990) return 55
  if (bouwjaar < 2005) return 66
  if (bouwjaar < 2015) return 74
  return 81
}

export function scoreLabel(score: number): { label: string; color: string } {
  if (score >= 75) return { label: 'Uitstekend', color: '#10b981' }
  if (score >= 60) return { label: 'Goed', color: '#f59e0b' }
  if (score >= 45) return { label: 'Matig', color: '#f97316' }
  return { label: 'Laag', color: '#ef4444' }
}

export function computeBesparing(bouwjaar: number | null, score: number): number {
  const base = bouwjaar
    ? bouwjaar < 1970
      ? 720
      : bouwjaar < 1990
        ? 960
        : bouwjaar < 2010
          ? 840
          : 660
    : 780
  return Math.round(base * (score / 65))
}

/** Indicatief verschil in jaarwaarde vanaf 2027 bij het gehanteerde standaardprofiel. */
export function computeVerlies(bouwjaar: number | null, score: number): number {
  return Math.round(computeBesparing(bouwjaar, score) * 0.4)
}

export function computeVerliesFromBesparing(besparing: number): number {
  return Math.round(besparing * 0.4)
}

export function formatPseoEuro(amount: number): string {
  return `€${amount.toLocaleString('nl-NL')}`
}

/** SEO-titel op basis van dezelfde besparing/verlies-berekening als de wijkpagina. */
export function buildWijkSeoTitle(wijkDisplay: string, besparing: number, verlies: number): string {
  const primary = `${wijkDisplay}: ${formatPseoEuro(besparing)}/jaar · ${formatPseoEuro(verlies)} risico 2027`
  if (primary.length <= 60) return primary
  return `${wijkDisplay}: ${formatPseoEuro(verlies)} risico per 2027`
}

export function buildWijkSeoDescription(wijkDisplay: string, besparing: number, verlies: number): string {
  return `Gratis 2027-check voor ${wijkDisplay}: geraamde besparing ${formatPseoEuro(besparing)}/jaar met saldering t/m 2026, indicatief ${formatPseoEuro(verlies)}/jaar verschil na 1 januari 2027.`
}

const EURO_RANGE_RE =
  /€\s?\d{1,4}(?:\.\d{3})*(?:,\d{2})?\s*(?:[–-]|tot)\s*€?\s?\d{1,4}(?:\.\d{3})*(?:,\d{2})?/gi

/** Vervang AI-bandbreedtes in wijkcopy door het berekende wijkbedrag. */
export function alignPseoSavingsCopy(text: string | null, besparing: number): string | null {
  if (!text) return null
  return text.replace(EURO_RANGE_RE, formatPseoEuro(besparing))
}

export function wijkTemplateIndex(wijk: string): 0 | 1 | 2 {
  const sum = [...wijk].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return (sum % 3) as 0 | 1 | 2
}

export function renovatieIntelligence(
  bouwjaar: number | null,
  wijkDisplay: string
): RenovatieContent | null {
  if (!bouwjaar) return null
  const t = wijkTemplateIndex(wijkDisplay.toLowerCase())
  const w = wijkDisplay
  const yr = bouwjaar

  if (yr < 1945) {
    const items: RenovatieContent[] = [
      {
        titel: 'Historisch woningbezit — renovatiepotentieel',
        tekst: `Hoewel de BAG-data uitgaat van bouwjaar ${yr}, zijn panden in ${w} in de loop der decennia vaak ingrijpend verbeterd. Nieuwe daken, muurisolatie en vervangen kozijnen zijn in deze periode gebruikelijk. Heeft u na de aankoop isolatie of dubbel glas geplaatst? Dan ligt uw werkelijke rendement in 2027 waarschijnlijk **15–20% hoger** dan de basis-analyse aangeeft.`,
      },
      {
        titel: `Panden uit vóór 1945 in ${w}`,
        tekst: `Gevels opnieuw gevoegd, daken vernieuwd, kozijnen vervangen — panden uit vóór 1945 in ${w} hebben een rijke renovatiehistorie. Waar spouwmuurisolatie of HR-glas al is geplaatst, stijgt het zonnepaneel-rendement in 2027 met **15–20%** boven de bouwjaar-analyse.`,
      },
      {
        titel: 'Energetisch potentieel van historisch vastgoed',
        tekst: `Het historisch karakter van ${w} staat los van de huidige thermische kwaliteit. Veel eigenaren hebben de afgelopen twintig jaar in isolatie en HR-glas geïnvesteerd. Heeft u dat ook gedaan? Reken dan op een rendement dat **15–20% hoger** uitvalt dan de BAG-bouwjaardata suggereert.`,
      },
    ]
    return items[t]
  }

  if (yr < 1965) {
    const items: RenovatieContent[] = [
      {
        titel: `Naoorlogse wederopbouw — isolatie bepaalt rendement`,
        tekst: `De naoorlogse bouw in ${w} (bouwjaar ${yr}) is functioneel maar thermisch matig. Veel eigenaren hebben sindsdien geïnvesteerd in na-isolatie of HR++ beglazing. Is dat bij u ook het geval? Dan is uw werkelijke rendement in 2027 naar verwachting **15–20% hoger** dan de basis-analyse op grond van het bouwjaar aangeeft.`,
      },
      {
        titel: `Wederopbouw-woningen in ${w}: spreiding is groot`,
        tekst: `Woningen gebouwd ná 1945 werden snel neergezet voor een groeiende bevolking — thermische kwaliteit was bijzaak. Maar tientallen jaren verbeteringen later staat er in veel gevallen een goed geïsoleerde woning. Als dat voor uw huis geldt, verwacht dan **15–20% extra rendement** bovenop wat de bouwjaardata impliceert.`,
      },
      {
        titel: 'Naoorlogse bouw en energiewinst',
        tekst: `In naoorlogse wijken zoals ${w} is de spreiding in energiekwaliteit groot. Heeft u de afgelopen jaren isolatie aangebracht of HR-glas laten plaatsen? Dan is uw zonnepotentieel in 2027 waarschijnlijk **15–20% hoger** dan het bouwjaar ${yr} als startpunt suggereert.`,
      },
    ]
    return items[t]
  }

  if (yr < 1985) {
    const items: RenovatieContent[] = [
      {
        titel: 'Energiecrisis-generatie — isolatie als erfenis',
        tekst: `De BAG-data registreert bouwjaar ${yr} voor ${w}, maar de energiecrisis van die periode heeft veel eigenaren aangezet tot isolatiemaatregelen. Heeft u na de aankoop dakisolatie, vloerisolatie of HR-glas geplaatst? Dan is uw werkelijke rendement in 2027 waarschijnlijk **15–20% hoger** dan de basis-analyse aangeeft.`,
      },
      {
        titel: `Jaren '70–'80 in ${w}: thermisch wisselend`,
        tekst: `Woningen uit de jaren '70–'80 in ${w} zijn thermisch wisselend van kwaliteit. De bouwstroom was groot maar energienormen minimaal — tóch zijn er sindsdien veel verbeteringen doorgevoerd. Als uw woning geïsoleerd is, kunt u rekenen op **15–20% hogere** zonnepanelopbrengst dan de bouwjaaranalyse suggereert.`,
      },
      {
        titel: 'Renovatiegolf na de energiecrisis',
        tekst: `Hoewel ${w} zijn hoofdbouwperiode rond ${yr} kent, heeft de renovatiegolf van de jaren '80–'90 de energetische kwaliteit van veel woningen sterk verbeterd. Heeft u zelf ook in isolatie of dubbel glas geïnvesteerd? Dan wijkt uw rendement in 2027 positief af — naar schatting **15–20% hoger**.`,
      },
    ]
    return items[t]
  }

  if (yr < 2000) {
    const items: RenovatieContent[] = [
      {
        titel: 'Overgangsgeneratie — energienormen in opkomst',
        tekst: `Woningen uit de jaren '90 in ${w} werden gebouwd toen energienormen begonnen aan te trekken, maar HR-glas en dakisolatie waren nog geen standaard. Heeft u sindsdien isolatiemaatregelen genomen? Dan ligt uw actuele rendement voor 2027 waarschijnlijk **15–20% hoger** dan het bouwjaar ${yr} impliceert.`,
      },
      {
        titel: `Energiepotentieel in ${w}: meer dan het bouwjaar`,
        tekst: `De overgangsgeneratie in ${w} (rond bouwjaar ${yr}) kent woningen die energetisch sterk variëren. Goede na-isolatie kan een woning uit deze periode ver boven haar bouwjaarscore tillen. Heeft u dat gedaan? Verwacht dan **15–20% extra** op het geraamde zonne-rendement.`,
      },
      {
        titel: `Bouwjaar ${yr} als startpunt, niet eindpunt`,
        tekst: `In ${w} hebben veel eigenaren sinds ${yr} geïnvesteerd in CV-ketels, dakisolatie of zonneboilers. Als uw woning inmiddels energielabel B of beter heeft, is uw zonnepotentieel in 2027 naar verwachting **15–20% hoger** dan de basis-analyse.`,
      },
    ]
    return items[t]
  }

  const items: RenovatieContent[] = [
    {
      titel: `Moderne nieuwbouw in ${w} — verbruik als volgende stap`,
      tekst: `Moderne woningen in ${w} (bouwjaar ${yr}) zijn energetisch vaak al sterk. Na het einde van salderen wordt het belangrijker om opwek en direct eigen verbruik op elkaar af te stemmen. Een thuisbatterij kan een optie zijn, maar rendement hangt af van uw uurlijkse profiel, tarieven en offerte.`,
    },
    {
      titel: 'Energiezuinige basis, eerst het profiel toetsen',
      tekst: `Energiezuinige nieuwbouw uit ${yr} in ${w} heeft een solide basis voor zonne-energie. Begin met het afstemmen van panelen en apparaten op uw werkelijke verbruik. Laat apart berekenen of opslag voldoende extra eigen gebruik oplevert om de investering te rechtvaardigen.`,
    },
    {
      titel: `${w} — optimaliseer uw zonne-installatie na 2027`,
      tekst: `Na ${yr} gebouwde woningen in ${w} kunnen veel elektrische toepassingen combineren. Slim plannen van verbruik is een eerste stap. Een thuisbatterij is niet automatisch de logische keuze; vergelijk investering, levensduur, tarieven en het verwachte extra eigen gebruik.`,
    },
  ]
  return items[t]
}

// ── Netcongestie copy (wijk page ribbon + badges) ─────────────────────────────

export type NetcongestieNarrative = {
  status: NetcongestieStatus | null
  label: string
  dot: string
  /** Korte uitleg voor kaarten / linten */
  narrative: string
}

type NetCongestieDef = {
  label: string
  dot: string
  narrative: (wijk: string) => string
}

const NET_COPY: Record<NetcongestieStatus, NetCongestieDef> = {
  ROOD: {
    label: 'Vol stroomnet',
    dot: '#ef4444',
    narrative: (wijk) =>
      `De regionale netindicatie rond ${wijk} staat op rood. Dat kan vooral gevolgen hebben voor nieuwe of zwaardere aansluitingen en lokale spanning; het bewijst geen actieve terugleverbeperking voor uw woning.`,
  },
  ORANJE: {
    label: 'Druk stroomnet',
    dot: '#f59e0b',
    narrative: (wijk) =>
      `De regionale netindicatie in ${wijk} staat op oranje. Controleer de actuele situatie bij de netbeheerder wanneer u een nieuwe of zwaardere aansluiting overweegt.`,
  },
  GROEN: {
    label: 'Vrij stroomnet',
    dot: '#10b981',
    narrative: (wijk) =>
      `De regionale netindicatie in ${wijk} staat op groen. Dit is een momentopname, geen garantie voor onbeperkte teruglevering of toekomstige aansluitcapaciteit.`,
  },
}

export function netcongestieNarrative(
  status: string | null,
  wijkDisplay: string
): NetcongestieNarrative {
  if (!status || !['ROOD', 'ORANJE', 'GROEN'].includes(status)) {
    return {
      status: null,
      label: '—',
      dot: 'rgba(255,255,255,0.25)',
      narrative: `Er is geen netstatus voor ${wijkDisplay} in onze dataset; controleer tijdens de adres-check de actuele situatie.`,
    }
  }
  const s = status as NetcongestieStatus
  const cfg = NET_COPY[s]
  return {
    status: s,
    label: cfg.label,
    dot: cfg.dot,
    narrative: cfg.narrative(wijkDisplay),
  }
}

// ── Aggregates ────────────────────────────────────────────────────────────────

function parseNetStatus(s: string | null): keyof StadSummary['netcongestie'] {
  if (s === 'ROOD' || s === 'ORANJE' || s === 'GROEN') return s
  return 'onbekend'
}

export function summarizeStad(rows: WijkStadRow[]): StadSummary {
  const netcongestie: StadSummary['netcongestie'] = {
    ROOD: 0,
    ORANJE: 0,
    GROEN: 0,
    onbekend: 0,
  }
  let woningSom = 0
  let gewogenJaar = 0
  let gewogenScore = 0

  for (const r of rows) {
    netcongestie[parseNetStatus(r.netcongestie_status)]++
    const w = r.aantal_woningen ?? 0
    woningSom += w
    if (r.gem_bouwjaar && w > 0) {
      gewogenJaar += r.gem_bouwjaar * w
    }
    const sc = resolveWijkScore(r.gem_bouwjaar, r.gem_health_score)
    if (w > 0) gewogenScore += sc * w
  }

  const ernstigsteNet: NetcongestieStatus | null =
    netcongestie.ROOD > 0 ? 'ROOD' : netcongestie.ORANJE > 0 ? 'ORANJE' : netcongestie.GROEN > 0 ? 'GROEN' : null

  return {
    wijkCount: rows.length,
    totaalWoningen: woningSom,
    gemiddeldBouwjaar:
      woningSom > 0 && gewogenJaar > 0 ? Math.round(gewogenJaar / woningSom) : null,
    gemiddeldeScore:
      woningSom > 0 ? Math.round((gewogenScore / woningSom) * 10) / 10 : null,
    netcongestie,
    ernstigsteNet,
  }
}

export function congestionRank(status: string | null): number {
  if (status === 'ROOD') return 3
  if (status === 'ORANJE') return 2
  if (status === 'GROEN') return 1
  return 0
}

export type RankedUrgentWijk<T extends WijkStadRow = WijkStadRow> = T & {
  score: number
  verlies: number
  besparing: number
}

/** Hoogste urgentie eerst: netcongestie zwaarder dan alleen financiële schok */
export function rankUrgentWijken<T extends WijkStadRow>(
  rows: T[],
  limit?: number
): RankedUrgentWijk<T>[] {
  const enriched = rows.map((row) => {
    const score = resolveWijkScore(row.gem_bouwjaar, row.gem_health_score)
    const besparing = computeBesparing(row.gem_bouwjaar, score)
    const verlies = computeVerliesFromBesparing(besparing)
    return { ...row, score, besparing, verlies }
  })

  enriched.sort((a, b) => {
    const cn = congestionRank(b.netcongestie_status) - congestionRank(a.netcongestie_status)
    if (cn !== 0) return cn
    return b.verlies - a.verlies
  })

  return typeof limit === 'number' ? enriched.slice(0, limit) : enriched
}

export function straatVsWijkDelta(straat: StraatWijkMetrics, wijk: StraatWijkMetrics): StraatVsWijkDeltaResult {
  const streetScore = resolveWijkScore(straat.gemBouwjaar, straat.gemHealthScore)
  const parentWijkScore = resolveWijkScore(wijk.gemBouwjaar, wijk.gemHealthScore)
  const streetBesparing = computeBesparing(straat.gemBouwjaar, streetScore)
  const wijkBesparing = computeBesparing(wijk.gemBouwjaar, parentWijkScore)
  const deltaScore = streetScore - parentWijkScore
  const deltaBesparing = streetBesparing - wijkBesparing

  let deltaBouwjaar: number | null = null
  if (straat.gemBouwjaar != null && wijk.gemBouwjaar != null) {
    deltaBouwjaar = straat.gemBouwjaar - wijk.gemBouwjaar
  }

  let samenvatting: string
  if (Math.abs(deltaScore) < 2 && Math.abs(deltaBesparing) < 30) {
    samenvatting = 'Deze straat sluit qua profiel nauw aan bij het gemiddelde van de wijk.'
  } else if (deltaScore > 0 && deltaBesparing > 0) {
    samenvatting =
      'De straat scoort iets sterker dan het wijkgemiddelde; verwacht marginaal hogere jaarlijkse besparing vóór 2027.'
  } else if (deltaScore < 0 && deltaBesparing < 0) {
    samenvatting =
      'De straat ligt onder het wijkgemiddelde qua score; de geschatte besparing is iets lager dan elders in de wijk.'
  } else {
    samenvatting =
      'Straat en wijk verschillen op score en besparing; een adres-check geeft het meest nauwkeurige beeld.'
  }

  return {
    streetScore,
    parentWijkScore,
    deltaScore,
    streetBesparing,
    wijkBesparing,
    deltaBesparing,
    deltaBouwjaar,
    samenvatting,
  }
}

export type PostcodeWijkRow = {
  wijk: string
  stad: string
  provincie: string
  netcongestie_status: string | null
}

export function postcodeClusterSummary(rows: PostcodeWijkRow[]): PostcodeClusterSummary {
  const netcongestie: PostcodeClusterSummary['netcongestie'] = {
    ROOD: 0,
    ORANJE: 0,
    GROEN: 0,
    onbekend: 0,
  }
  const steden = new Set<string>()
  const provincies = new Set<string>()

  for (const r of rows) {
    netcongestie[parseNetStatus(r.netcongestie_status)]++
    steden.add(r.stad)
    provincies.add(r.provincie)
  }

  const ernstigsteNet: NetcongestieStatus | null =
    netcongestie.ROOD > 0 ? 'ROOD' : netcongestie.ORANJE > 0 ? 'ORANJE' : netcongestie.GROEN > 0 ? 'GROEN' : null

  const kop =
    rows.length === 0
      ? 'Nog geen wijkdata voor dit postcodecluster.'
      : `${rows.length} ${rows.length === 1 ? 'wijk' : 'wijken'} in het gebied` +
        (ernstigsteNet
          ? `; zwaarste netdruk: ${ernstigsteNet === 'ROOD' ? 'vol net' : ernstigsteNet === 'ORANJE' ? 'druk net' : 'vrij net'}.`
          : '.')

  return {
    wijkCount: rows.length,
    uniekeSteden: steden.size,
    uniekeProvincies: provincies.size,
    netcongestie,
    ernstigsteNet,
    kop,
  }
}
