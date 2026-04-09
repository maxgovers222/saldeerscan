import 'server-only'
import { supabaseAdmin } from '@/lib/supabase/admin'

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

export async function getPseoPage(params: {
  provincie: string
  stad: string
  wijk: string
  straat: string
}): Promise<PseoPageData | null> {
  const slug = `/${params.provincie}/${params.stad}/${params.wijk}/${params.straat}`

  const { data, error } = await supabaseAdmin
    .from('pseo_pages')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) return null

  return {
    slug: data.slug,
    provincie: data.provincie,
    stad: data.stad,
    wijk: data.wijk,
    straat: data.straat,
    titel: data.titel,
    metaDescription: data.meta_description,
    hoofdtekst: data.hoofdtekst,
    faqItems: data.faq_items ?? [],
    jsonLd: data.json_ld ?? {},
    gemBouwjaar: data.gem_bouwjaar,
    gemHealthScore: data.gem_health_score,
    netcongestieStatus: data.netcongestie_status,
    aantalWoningen: data.aantal_woningen,
    generatedAt: data.generated_at,
  }
}

export async function getTopPseoPages(limit = 500) {
  const { data } = await supabaseAdmin
    .from('pseo_pages')
    .select('provincie, stad, wijk, straat')
    .not('straat', 'is', null)
    .order('aantal_woningen', { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function getWijkPage(params: {
  provincie: string
  stad: string
  wijk: string
}): Promise<PseoPageData | null> {
  const slug = `/${params.provincie}/${params.stad}/${params.wijk}`

  const { data, error } = await supabaseAdmin
    .from('pseo_pages')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) return null

  return {
    slug: data.slug,
    provincie: data.provincie,
    stad: data.stad,
    wijk: data.wijk,
    straat: null,
    titel: data.titel,
    metaDescription: data.meta_description,
    hoofdtekst: data.hoofdtekst,
    faqItems: data.faq_items ?? [],
    jsonLd: data.json_ld ?? {},
    gemBouwjaar: data.gem_bouwjaar,
    gemHealthScore: data.gem_health_score,
    netcongestieStatus: data.netcongestie_status,
    aantalWoningen: data.aantal_woningen,
    generatedAt: data.generated_at,
  }
}

export async function getTopWijken(limit = 500) {
  const { data } = await supabaseAdmin
    .from('pseo_pages')
    .select('provincie, stad, wijk')
    .not('wijk', 'is', null)
    .is('straat', null)
    .order('aantal_woningen', { ascending: false, nullsFirst: false })
    .limit(limit)
  return (data ?? []).filter(
    (d): d is { provincie: string; stad: string; wijk: string } =>
      !!d.provincie && !!d.stad && !!d.wijk
  )
}

export async function getPseoPagesByProvincie(provincie: string) {
  const { data } = await supabaseAdmin
    .from('pseo_pages')
    .select('slug, generated_at')
    .eq('provincie', provincie)
  return data ?? []
}
