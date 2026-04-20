import 'server-only'
import { supabaseAdmin } from '@/lib/supabase/admin'

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

export async function getKennisbankArticle(slug: string): Promise<KennisbankArticle | null> {
  const { data, error } = await supabaseAdmin
    .from('kennisbank_articles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !data) return null

  return mapRow(data)
}

export async function getAllKennisbankSlugs(): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from('kennisbank_articles')
    .select('slug')
    .eq('status', 'published')

  return (data ?? []).map(r => r.slug)
}

export async function getAllPublishedKennisbank(): Promise<Pick<KennisbankArticle, 'slug' | 'titel' | 'category' | 'intro' | 'generatedAt'>[]> {
  const { data } = await supabaseAdmin
    .from('kennisbank_articles')
    .select('slug, titel, category, intro, generated_at')
    .eq('status', 'published')
    .order('generated_at', { ascending: false })

  return (data ?? []).map(r => ({
    slug: r.slug,
    titel: r.titel,
    category: r.category ?? 'algemeen',
    intro: r.intro ?? null,
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
  return {
    id: data.id as string,
    slug: data.slug as string,
    titel: data.titel as string,
    metaDescription: (data.meta_description as string) ?? null,
    intro: (data.intro as string) ?? null,
    hoofdtekst: (data.hoofdtekst as string) ?? null,
    faqItems: (data.faq_items as Array<{ vraag: string; antwoord: string }>) ?? [],
    jsonLd: (data.json_ld as Record<string, unknown>) ?? {},
    category: (data.category as KennisbankArticle['category']) ?? 'algemeen',
    relatedSlugs: (data.related_slugs as string[]) ?? [],
    status: (data.status as 'draft' | 'published') ?? 'draft',
    generatedAt: (data.generated_at as string) ?? null,
  }
}
