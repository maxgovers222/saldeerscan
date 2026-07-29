import type { Metadata } from 'next'
import { toDisplaySlug } from '@/lib/pseo-hubs'
import { getWijkCtrTemplate } from '@/lib/pseo-ctr'
import {
  buildWijkSeoDescription,
  buildWijkSeoTitle,
  computeBesparing,
  computeVerliesFromBesparing,
  resolveWijkScore,
  type PostcodeClusterSummary,
} from '@/lib/pseo-variation'

const PROVINCIE_LABELS: Record<string, string> = {
  utrecht: 'Utrecht',
  'noord-holland': 'Noord-Holland',
  'zuid-holland': 'Zuid-Holland',
  'noord-brabant': 'Noord-Brabant',
  gelderland: 'Gelderland',
  overijssel: 'Overijssel',
  flevoland: 'Flevoland',
  groningen: 'Groningen',
  friesland: 'Friesland',
  drenthe: 'Drenthe',
  limburg: 'Limburg',
  zeeland: 'Zeeland',
}

/** Canonical provincie hub slugs (valid `[provincie]` routes). */
export const ALL_PROVINCIE_SLUGS = Object.keys(PROVINCIE_LABELS)

export function provincieDisplaySlug(provincie: string): string {
  return PROVINCIE_LABELS[provincie] ?? toDisplaySlug(provincie)
}

export type StadHubSummary = {
  wijkCount: number
  roodCount: number
  gemScore: number | null
}

export type ProvincieHubSummary = {
  stadCount: number
  wijkCount: number
}

export function buildHubMetadata(params: {
  kind: 'provincie' | 'stad'
  provincie: string
  stad?: string
  stadSummary?: StadHubSummary
  provincieSummary?: ProvincieHubSummary
}): Metadata {
  const provLabel = provincieDisplaySlug(params.provincie)
  if (params.kind === 'provincie') {
    const s = params.provincieSummary
    const title = `Zonnepanelen ${provLabel} — 2027 Saldeercheck per stad`
    const description = s
      ? `${s.stadCount} steden en ${s.wijkCount} wijkanalyses in ${provLabel}. Netcongestie per wijk, energiescores en gratis 2027 saldeercheck vóór 1 januari 2027.`
      : `Overzicht per stad en wijk in ${provLabel}. Gratis AI-scan, netcongestie check en ROI-berekening voor uw woning vóór 2027.`
    const url = `https://saldeerscan.nl/${params.provincie}`
    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: { title, description, type: 'website', locale: 'nl_NL', url },
    }
  }
  const stad = params.stad!
  const stadDisplay = toDisplaySlug(stad)
  const s = params.stadSummary
  const title = `Zonnepanelen ${stadDisplay} — 2027 Saldeercheck per wijk`
  const description = s
    ? `${s.wijkCount} wijken in ${stadDisplay} (${provLabel}), waarvan ${s.roodCount} met vol net. Gemiddelde energiescore ${s.gemScore ?? '—'}/100. Gratis adres-check en ROI vóór 2027.`
    : `Bekijk de 2027 salderingsstatus per wijk in ${stadDisplay}. Gratis AI-scan, ROI-berekening en investeringsrapport voor uw woning.`
  const url = `https://saldeerscan.nl/${params.provincie}/${stad}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, type: 'website', locale: 'nl_NL', url },
  }
}

export function buildPostcodeMetadata(code: string, cluster?: PostcodeClusterSummary): Metadata {
  const clean = code.toUpperCase().replace(/\s/g, '').slice(0, 4)
  const title = `Zonnepanelen ${clean} — Saldeerscan`
  const description =
    cluster && cluster.wijkCount > 0
      ? `Postcode ${clean}: ${cluster.wijkCount} wijkanalyses, ${cluster.uniekeSteden} ${cluster.uniekeSteden === 1 ? 'stad' : 'steden'}. Netverdeling ROOD/ORANJE/GROEN — kies uw wijk voor score, bouwjaar en 2027 verlies.`
      : `Bekijk de zonnepanelen-potentie en netcongestiestatus voor postcode ${clean} en omgeving.`
  const url = `https://saldeerscan.nl/postcode/${clean}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `Zonnepanelen postcode ${clean}`,
      description:
        cluster && cluster.wijkCount > 0
          ? `${cluster.wijkCount} wijken rond ${clean}; netdruk en zonnepanelen-check.`
          : `Netcongestiestatus en opbrengst voor postcode ${clean}.`,
      url,
      siteName: 'SaldeerScan.nl',
      locale: 'nl_NL',
      type: 'website',
    },
  }
}

export function buildWijkMetadata(input: {
  provincie: string
  stad: string
  wijk: string
  titel?: string | null
  gemBouwjaar?: number | null
  gemHealthScore?: number | null
  netcongestieStatus?: string | null
}): Metadata {
  const wijkDisplay = toDisplaySlug(input.wijk)
  const score = resolveWijkScore(input.gemBouwjaar ?? null, input.gemHealthScore ?? null)
  const besparing = computeBesparing(input.gemBouwjaar ?? null, score)
  const verlies = computeVerliesFromBesparing(besparing)
  const ctrTemplate = getWijkCtrTemplate(input)

  const title = ctrTemplate?.title ?? buildWijkSeoTitle(wijkDisplay, besparing, verlies)
  const description =
    ctrTemplate?.description ?? buildWijkSeoDescription(wijkDisplay, besparing, verlies)

  const path = `/${input.provincie}/${input.stad}/${input.wijk}`
  const url = `https://saldeerscan.nl${path}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'nl_NL',
      url,
      images: [
        {
          url: `https://saldeerscan.nl/api/og?titel=${encodeURIComponent(title)}&score=${input.gemHealthScore ?? ''}&status=${input.netcongestieStatus ?? ''}&type=wijk`,
          width: 1200,
          height: 630,
        },
      ],
    },
  }
}
