import 'server-only'
import { unstable_cache } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  sanitizeGeneratedEnergyCopy,
  sanitizeStructuredEnergyCopy,
} from '@/lib/editorial-standards'

const KENNISBANK_REVALIDATE = 86400

export interface KennisbankArticle {
  id: string
  slug: string
  titel: string
  metaDescription: string | null
  intro: string | null
  hoofdtekst: string | null
  faqItems: Array<{ vraag: string; antwoord: string }>
  jsonLd: Record<string, unknown>
  category: 'saldering' | 'zonnepanelen' | 'netcongestie' | 'subsidie' | 'algemeen'
  relatedSlugs: string[]
  status: 'draft' | 'published'
  generatedAt: string | null
}

export const getKennisbankArticle = unstable_cache(
  async (slug: string): Promise<KennisbankArticle | null> => {
    const { data, error } = await supabaseAdmin
      .from('kennisbank_articles')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (error || !data) return null

    return mapRow(data)
  },
  ['kennisbank', 'article'],
  { revalidate: KENNISBANK_REVALIDATE }
)

export const getAllKennisbankSlugs = unstable_cache(
  async (): Promise<string[]> => {
    const { data } = await supabaseAdmin
      .from('kennisbank_articles')
      .select('slug')
      .eq('status', 'published')

    return (data ?? []).map(r => r.slug)
  },
  ['kennisbank', 'allSlugs'],
  { revalidate: KENNISBANK_REVALIDATE }
)

export const getAllPublishedKennisbank = unstable_cache(
  async (): Promise<Pick<KennisbankArticle, 'slug' | 'titel' | 'category' | 'intro' | 'generatedAt'>[]> => {
    const { data } = await supabaseAdmin
      .from('kennisbank_articles')
      .select('slug, titel, category, intro, generated_at')
      .eq('status', 'published')
      .order('generated_at', { ascending: false })

    return (data ?? []).map(r => ({
      slug: r.slug,
      titel: sanitizeGeneratedEnergyCopy(r.titel, 'short') ?? r.titel,
      category: r.category ?? 'algemeen',
      intro: sanitizeGeneratedEnergyCopy(r.intro ?? null),
      generatedAt: r.generated_at ?? null,
    }))
  },
  ['kennisbank', 'allPublished'],
  { revalidate: KENNISBANK_REVALIDATE }
)

/** Alleen voor gerelateerde artikelen — geen volledige tabel per pagina tijdens build. */
export async function getKennisbankSummariesBySlugs(
  slugs: string[]
): Promise<Pick<KennisbankArticle, 'slug' | 'titel' | 'category' | 'intro' | 'generatedAt'>[]> {
  const unique = [...new Set(slugs.filter(Boolean))]
  if (unique.length === 0) return []

  const { data } = await supabaseAdmin
    .from('kennisbank_articles')
    .select('slug, titel, category, intro, generated_at')
    .eq('status', 'published')
    .in('slug', unique.slice(0, 20))

  return (data ?? []).map(r => ({
    slug: r.slug,
    titel: sanitizeGeneratedEnergyCopy(r.titel, 'short') ?? r.titel,
    category: r.category ?? 'algemeen',
    intro: sanitizeGeneratedEnergyCopy(r.intro ?? null),
    generatedAt: r.generated_at ?? null,
  }))
}

export async function upsertKennisbankArticle(article: {
  slug: string
  titel: string
  metaDescription: string
  intro: string
  hoofdtekst: string
  faqItems: Array<{ vraag: string; antwoord: string }>
  jsonLd: Record<string, unknown>
  category: string
  relatedSlugs: string[]
  status: 'draft' | 'published'
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from('kennisbank_articles')
    .upsert({
      slug: article.slug,
      titel: article.titel,
      meta_description: article.metaDescription,
      intro: article.intro,
      hoofdtekst: article.hoofdtekst,
      faq_items: article.faqItems,
      json_ld: article.jsonLd,
      category: article.category,
      related_slugs: article.relatedSlugs,
      status: article.status,
      generated_at: new Date().toISOString(),
    }, { onConflict: 'slug' })

  if (error) throw new Error(`Upsert kennisbank mislukt: ${error.message}`)
}

function mapRow(data: Record<string, unknown>): KennisbankArticle {
  const faqItems = ((data.faq_items as Array<{ vraag: string; antwoord: string }>) ?? [])
    .map((faq) => ({
      vraag: sanitizeGeneratedEnergyCopy(faq.vraag, 'short') ?? faq.vraag,
      antwoord: sanitizeGeneratedEnergyCopy(faq.antwoord) ?? faq.antwoord,
    }))

  return {
    id: data.id as string,
    slug: data.slug as string,
    titel: sanitizeGeneratedEnergyCopy(data.titel as string, 'short') ?? data.titel as string,
    metaDescription: sanitizeGeneratedEnergyCopy((data.meta_description as string) ?? null, 'short'),
    intro: sanitizeGeneratedEnergyCopy((data.intro as string) ?? null),
    hoofdtekst: sanitizeGeneratedEnergyCopy((data.hoofdtekst as string) ?? null),
    faqItems,
    jsonLd: sanitizeStructuredEnergyCopy(data.json_ld ?? {}) as Record<string, unknown>,
    category: (data.category as KennisbankArticle['category']) ?? 'algemeen',
    relatedSlugs: (data.related_slugs as string[]) ?? [],
    status: (data.status as 'draft' | 'published') ?? 'draft',
    generatedAt: (data.generated_at as string) ?? null,
  }
}
