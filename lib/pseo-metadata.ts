import type { Metadata } from 'next'
import { CANONICAL_PROVINCE_SLUGS, formatLocationSlug } from './pseo-content-quality'
import type { PostcodeClusterSummary } from './pseo-variation'

export const ALL_PROVINCIE_SLUGS: string[] = [...CANONICAL_PROVINCE_SLUGS]
export function provincieDisplaySlug(provincie: string) { return provincie === 'friesland' ? 'Friesland / Fryslân' : formatLocationSlug(provincie) }
export type StadHubSummary = { wijkCount: number; roodCount: number; gemScore: number | null }
export type ProvincieHubSummary = { stadCount: number; wijkCount: number }
export function buildPseoRobots(indexable: boolean): Metadata['robots'] { return indexable ? undefined : { index: false, follow: true } }
export function buildHubMetadata(p: { kind: 'provincie' | 'stad'; provincie: string; stad?: string; stadSummary?: StadHubSummary; provincieSummary?: ProvincieHubSummary; indexable?: boolean }): Metadata {
  const name = p.kind === 'provincie' ? provincieDisplaySlug(p.provincie) : formatLocationSlug(p.stad!)
  const title = `Zonnepanelen ${name}: locatiepagina’s en uw 2027-berekening`
  const description = `Bekijk locatiepagina’s in ${name}, hun bronnen en beperkingen. Bereken met uw eigen productie, verbruik en contract wat het einde van salderen voor u betekent.`
  const url = `https://saldeerscan.nl/${p.provincie}${p.kind === 'stad' ? `/${p.stad}` : ''}`
  return { title, description, alternates: { canonical: url }, robots: buildPseoRobots(p.indexable ?? false), openGraph: { title, description, url, locale: 'nl_NL', type: 'website' } }
}
export function buildPostcodeMetadata(code: string, _cluster?: PostcodeClusterSummary, indexable = false): Metadata {
  const clean = code.toUpperCase().replace(/\s/g, '')
  const prefix = clean.slice(0, 4)
  const title = `Zonnepanelen postcode ${prefix}: bereken uw eigen situatie`
  const description = `Bereken de gevolgen van het einde van salderen met uw eigen productie, verbruik en contract. Een postcode bepaalt geen energiescore, netcapaciteit of persoonlijk voordeel.`
  const url = `https://saldeerscan.nl/postcode/${prefix}`
  return { title, description, alternates: { canonical: url }, robots: buildPseoRobots(indexable && clean === prefix), openGraph: { title, description, url, locale: 'nl_NL', type: 'website' } }
}
// Compatibility helper for callers without a reviewed page projection. Never infer metrics.
export function buildWijkMetadata(p: { provincie: string; stad: string; wijk: string; titel?: string | null; gemBouwjaar?: number | null; gemHealthScore?: number | null; netcongestieStatus?: string | null; indexable?: boolean }): Metadata {
  const name = formatLocationSlug(p.wijk)
  const title = `Zonnepanelen ${name}: uw situatie in 2027`
  const description = `Gebruik uw eigen productie, verbruik en energiecontract voor een persoonlijke berekening. Lokale gemiddelden voor ${name} bepalen geen technisch of financieel advies.`
  const url = `https://saldeerscan.nl/${p.provincie}/${p.stad}/${p.wijk}`
  return { title, description, alternates: { canonical: url }, robots: buildPseoRobots(p.indexable ?? false), openGraph: { title, description, url, locale: 'nl_NL', type: 'website' } }
}
