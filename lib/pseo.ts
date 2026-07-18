import 'server-only'
import { unstable_cache } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { rankUrgentWijken, type WijkStadRow, type WijkStadRowWithStad } from '@/lib/pseo-variation'
import {
  sanitizeGeneratedEnergyCopy,
  sanitizeStructuredEnergyCopy,
} from '@/lib/editorial-standards'

const PSEO_FETCH_REVALIDATE = 604800

/** Prefix voor alle wijk- of straat-URL's onder één stad: `/provincie/stad/` */
function slugPrefixStad(provincie: string, stad: string) {
  return `/${provincie}/${stad}/`
}

const WIJK_SLUG_REGEX = /^[a-z][a-z-]*[a-z]$/

export interface PseoPageData {
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
  generatedAt: string | null
}

function mapPseoPage(
  data: Record<string, unknown>,
  straat: string | null,
): PseoPageData {
  const faqItems = ((data.faq_items as Array<{ vraag: string; antwoord: string }>) ?? [])
    .map((faq) => ({
      vraag: sanitizeGeneratedEnergyCopy(faq.vraag, 'short') ?? faq.vraag,
      antwoord: sanitizeGeneratedEnergyCopy(faq.antwoord) ?? faq.antwoord,
    }))

  return {
    slug: data.slug as string,
    provincie: data.provincie as string,
    stad: data.stad as string,
    wijk: (data.wijk as string) ?? null,
    straat,
    titel: sanitizeGeneratedEnergyCopy((data.titel as string) ?? null, 'short'),
    metaDescription: sanitizeGeneratedEnergyCopy(
      (data.meta_description as string) ?? null,
      'short',
    ),
    hoofdtekst: sanitizeGeneratedEnergyCopy((data.hoofdtekst as string) ?? null),
    faqItems,
    jsonLd: sanitizeStructuredEnergyCopy(data.json_ld ?? {}) as Record<string, unknown>,
    gemBouwjaar: (data.gem_bouwjaar as number) ?? null,
    gemHealthScore: (data.gem_health_score as number) ?? null,
    netcongestieStatus: (data.netcongestie_status as string) ?? null,
    aantalWoningen: (data.aantal_woningen as number) ?? null,
    generatedAt: (data.generated_at as string) ?? null,
  }
}

export const getPseoPage = unstable_cache(
  async (params: {
    provincie: string
    stad: string
    wijk: string
    straat: string
  }): Promise<PseoPageData | null> => {
    const slug = `/${params.provincie}/${params.stad}/${params.wijk}/${params.straat}`

    const { data, error } = await supabaseAdmin
      .from('pseo_pages')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (error || !data) return null

    return mapPseoPage(data, (data.straat as string) ?? null)
  },
  ['pseo', 'straatPage'],
  { revalidate: PSEO_FETCH_REVALIDATE }
)

export const getTopPseoPages = unstable_cache(
  async (limit = 500) => {
    const { data } = await supabaseAdmin
      .from('pseo_pages')
      .select('slug, straat, aantal_woningen')
      .eq('status', 'published')
      .not('straat', 'is', null)
      .order('aantal_woningen', { ascending: false, nullsFirst: false })
      .limit(limit)
    return (data ?? []).flatMap((row) => {
      const parts = (row.slug as string).split('/').filter(Boolean)
      if (parts.length !== 4 || !row.straat) return []
      const [provincie, stad, wijk, straat] = parts
      return [{ provincie, stad, wijk, straat }]
    })
  },
  ['pseo', 'topPseoPages'],
  { revalidate: PSEO_FETCH_REVALIDATE }
)

export const getWijkPage = unstable_cache(
  async (params: { provincie: string; stad: string; wijk: string }): Promise<PseoPageData | null> => {
    const slug = `/${params.provincie}/${params.stad}/${params.wijk}`

    const { data, error } = await supabaseAdmin
      .from('pseo_pages')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (error || !data) return null

    return mapPseoPage(data, null)
  },
  ['pseo', 'wijkPage'],
  { revalidate: PSEO_FETCH_REVALIDATE }
)

export const getTopWijken = unstable_cache(
  async (limit = 500) => {
    const { data } = await supabaseAdmin
      .from('pseo_pages')
      .select('slug, aantal_woningen')
      .eq('status', 'published')
      .not('wijk', 'is', null)
      .is('straat', null)
      .order('aantal_woningen', { ascending: false, nullsFirst: false })
      .limit(limit)
    const out: { provincie: string; stad: string; wijk: string }[] = []
    for (const row of data ?? []) {
      const parts = (row.slug as string).split('/').filter(Boolean)
      if (parts.length !== 3) continue
      const [provincie, stad, wijk] = parts
      if (!provincie || !stad || !wijk || !WIJK_SLUG_REGEX.test(wijk)) continue
      out.push({ provincie, stad, wijk })
    }
    return out
  },
  ['pseo', 'topWijken'],
  { revalidate: PSEO_FETCH_REVALIDATE }
)

export async function getPseoPagesByProvincie(provincie: string) {
  const { data } = await supabaseAdmin
    .from('pseo_pages')
    .select('slug, generated_at')
    .like('slug', `/${provincie}/%`)
    .eq('status', 'published')
    .is('straat', null)
    .not('wijk', 'is', null)
  return (data ?? []).filter((row) => {
    const parts = row.slug.split('/').filter(Boolean)
    return parts.length === 3 && parts[0] === provincie
  })
}

export async function getStratenByProvincie(provincie: string) {
  const { data } = await supabaseAdmin
    .from('pseo_pages')
    .select('slug, generated_at')
    .like('slug', `/${provincie}/%`)
    .eq('status', 'published')
    .not('straat', 'is', null)
    .order('aantal_woningen', { ascending: false, nullsFirst: false })
  return (data ?? []).filter((row) => {
    const parts = row.slug.split('/').filter(Boolean)
    return parts.length === 4 && parts[0] === provincie
  })
}

export const getWijkenByStad = unstable_cache(
  async (provincie: string, stad: string) => {
    const prefix = slugPrefixStad(provincie, stad)
    const { data } = await supabaseAdmin
      .from('pseo_pages')
      .select('slug, gem_bouwjaar, gem_health_score, netcongestie_status, aantal_woningen')
      .like('slug', `${prefix}%`)
      .is('straat', null)
      .not('wijk', 'is', null)
      .eq('status', 'published')
      .order('aantal_woningen', { ascending: false, nullsFirst: false })
    return (data ?? [])
      .filter((row) => {
        const parts = row.slug.split('/').filter(Boolean)
        if (parts.length !== 3) return false
        const wijkSlug = parts[2]
        return (
          parts[0] === provincie
          && parts[1] === stad
          && WIJK_SLUG_REGEX.test(wijkSlug)
        )
      })
      .map((row) => {
        const wijk = row.slug.split('/').filter(Boolean)[2] as string
        return {
          wijk,
          gem_bouwjaar: row.gem_bouwjaar,
          gem_health_score: row.gem_health_score,
          netcongestie_status: row.netcongestie_status,
          aantal_woningen: row.aantal_woningen,
        }
      })
  },
  ['pseo', 'wijkenByStad'],
  { revalidate: PSEO_FETCH_REVALIDATE }
)

export const getStaddenByProvincie = unstable_cache(
  async (provincie: string) => {
    const { data } = await supabaseAdmin
      .from('pseo_pages')
      .select('slug, aantal_woningen')
      .like('slug', `/${provincie}/%`)
      .is('straat', null)
      .not('wijk', 'is', null)
      .eq('status', 'published')
    if (!data) return []

    const map = new Map<string, number>()
    for (const row of data) {
      const parts = row.slug.split('/').filter(Boolean)
      if (parts.length !== 3 || parts[0] !== provincie) continue
      const stad = parts[1]
      map.set(stad, (map.get(stad) ?? 0) + (row.aantal_woningen ?? 0))
    }
    return Array.from(map.entries())
      .map(([stad, totalWoningen]) => ({ stad, totalWoningen }))
      .sort((a, b) => b.totalWoningen - a.totalWoningen)
  },
  ['pseo', 'staddenByProvincie'],
  { revalidate: PSEO_FETCH_REVALIDATE }
)

// Haalt andere straten op in dezelfde wijk (voor interne linking)
// Matcht op slug-prefix i.p.v. provincie/stad-kolommen: seed-scripts slaan soms titelcase
// provincienaam op, terwijl routes URL-slugs gebruiken (zelfde patroon als slug lookup).
export const getStratenByWijk = unstable_cache(
  async (
    provincie: string,
    stad: string,
    wijk: string,
    excludeStraat: string,
    limit = 6
  ): Promise<Array<{ straat: string; provincie: string; stad: string; wijk: string }>> => {
    const prefix = slugPrefixStad(provincie, stad) + `${wijk}/`
    const { data } = await supabaseAdmin
      .from('pseo_pages')
      .select('slug, straat, aantal_woningen')
      .like('slug', `${prefix}%`)
      .not('straat', 'is', null)
      .neq('straat', excludeStraat)
      .eq('status', 'published')
      .order('aantal_woningen', { ascending: false, nullsFirst: false })
      .limit(limit)
    return (data ?? [])
      .filter((r): r is { slug: string; straat: string; aantal_woningen: number | null } => {
        if (r.straat === null) return false
        const parts = r.slug.split('/').filter(Boolean)
        return (
          parts.length === 4
          && parts[0] === provincie
          && parts[1] === stad
          && parts[2] === wijk
        )
      })
      .map(r => ({ straat: r.straat, provincie, stad, wijk }))
  },
  ['pseo', 'stratenByWijk'],
  { revalidate: PSEO_FETCH_REVALIDATE }
)

// Haalt top straten op voor een wijk (voor interne linking op wijkpagina)
export const getTopStratenByWijk = unstable_cache(
  async (
    provincie: string,
    stad: string,
    wijk: string,
    limit = 8
  ): Promise<Array<{ straat: string; provincie: string; stad: string; wijk: string }>> => {
    const prefix = slugPrefixStad(provincie, stad) + `${wijk}/`
    const { data } = await supabaseAdmin
      .from('pseo_pages')
      .select('slug, straat, aantal_woningen')
      .like('slug', `${prefix}%`)
      .not('straat', 'is', null)
      .eq('status', 'published')
      .order('aantal_woningen', { ascending: false, nullsFirst: false })
      .limit(limit)
    return (data ?? [])
      .filter((r): r is { slug: string; straat: string; aantal_woningen: number | null } => {
        if (r.straat === null) return false
        const parts = r.slug.split('/').filter(Boolean)
        return (
          parts.length === 4
          && parts[0] === provincie
          && parts[1] === stad
          && parts[2] === wijk
        )
      })
      .map(r => ({ straat: r.straat, provincie, stad, wijk }))
  },
  ['pseo', 'topStratenByWijk'],
  { revalidate: PSEO_FETCH_REVALIDATE }
)

export const getWijkenByPostcode = unstable_cache(
  async (postcodePrefix: string): Promise<Array<{
    wijk: string
    stad: string
    provincie: string
    netcongestie_status: string | null
    gem_health_score: number | null
    gem_bouwjaar: number | null
    aantal_woningen: number | null
  }>> => {
    const { data } = await supabaseAdmin
      .from('pseo_pages')
      .select('wijk, stad, provincie, netcongestie_status, gem_health_score, gem_bouwjaar, aantal_woningen')
      .is('straat', null)
      .not('wijk', 'is', null)
      .eq('status', 'published')
      .ilike('postcode_prefix', `${postcodePrefix}%`)
      .order('aantal_woningen', { ascending: false })
      .limit(24)
    return (data ?? []).filter((r): r is {
      wijk: string
      stad: string
      provincie: string
      netcongestie_status: string | null
      gem_health_score: number | null
      gem_bouwjaar: number | null
      aantal_woningen: number | null
    } => r.wijk !== null)
  },
  ['pseo', 'wijkenByPostcode'],
  { revalidate: PSEO_FETCH_REVALIDATE }
)

export function getUrgentWijkenByProvincie(provincie: string, limit = 12) {
  return unstable_cache(
    async () => {
      const prefix = `/${provincie}/`
      const { data } = await supabaseAdmin
        .from('pseo_pages')
        .select('slug, gem_bouwjaar, gem_health_score, netcongestie_status, aantal_woningen')
        .like('slug', `${prefix}%`)
        .is('straat', null)
        .not('wijk', 'is', null)
        .eq('status', 'published')

      const rows: WijkStadRowWithStad[] = (data ?? [])
        .map((row) => {
          const parts = row.slug.split('/').filter(Boolean)
          if (parts.length !== 3 || parts[0] !== provincie) return null
          return {
            stad: parts[1] as string,
            wijk: parts[2] as string,
            gem_bouwjaar: row.gem_bouwjaar,
            gem_health_score: row.gem_health_score,
            netcongestie_status: row.netcongestie_status,
            aantal_woningen: row.aantal_woningen,
          } satisfies WijkStadRowWithStad
        })
        .filter((r): r is WijkStadRowWithStad => r !== null)

      return rankUrgentWijken(rows, limit)
    },
    ['pseo', 'urgentWijkenProvincie', provincie, String(limit)],
    { revalidate: PSEO_FETCH_REVALIDATE }
  )()
}

export function getProvincieHubStats(provincie: string) {
  return unstable_cache(
    async () => {
      const [stads, { data }] = await Promise.all([
        getStaddenByProvincie(provincie),
        supabaseAdmin
          .from('pseo_pages')
          .select('slug')
          .like('slug', `/${provincie}/%`)
          .is('straat', null)
          .not('wijk', 'is', null)
          .eq('status', 'published'),
      ])
      const wijkCount = (data ?? []).filter((row) => {
        const parts = row.slug.split('/').filter(Boolean)
        return parts.length === 3 && parts[0] === provincie
      }).length
      return { stadCount: stads.length, wijkCount }
    },
    ['pseo', 'provincieHubStats', provincie],
    { revalidate: PSEO_FETCH_REVALIDATE }
  )()
}

export const getTopStadden = unstable_cache(
  async (limit = 100) => {
    const { data } = await supabaseAdmin
      .from('pseo_pages')
      .select('slug, aantal_woningen')
      .is('straat', null)
      .not('wijk', 'is', null)
      .eq('status', 'published')
    if (!data) return []

    const map = new Map<string, { provincie: string; totalWoningen: number }>()
    for (const row of data) {
      const parts = row.slug.split('/').filter(Boolean)
      if (parts.length !== 3) continue
      const [provincie, stad] = parts
      if (!stad) continue
      const key = `${provincie}/${stad}`
      const prev = map.get(key)
      map.set(key, {
        provincie,
        totalWoningen: (prev?.totalWoningen ?? 0) + (row.aantal_woningen ?? 0),
      })
    }
    return Array.from(map.entries())
      .map(([key, val]) => ({ stad: key.split('/')[1]!, provincie: val.provincie, totalWoningen: val.totalWoningen }))
      .sort((a, b) => b.totalWoningen - a.totalWoningen)
      .slice(0, limit)
  },
  ['pseo', 'topStadden'],
  { revalidate: PSEO_FETCH_REVALIDATE }
)
