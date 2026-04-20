import 'server-only'
import { supabaseAdmin } from '@/lib/supabase/admin'

export interface NieuwsArticle {
  id: string
  slug: string
  titel: string
  metaDescription: string | null
  intro: string | null
  hoofdtekst: string | null
  faqItems: Array<{ vraag: string; antwoord: string }>
  jsonLd: Record<string, unknown>
  topicSeed: string | null
  status: 'draft' | 'published'
  publishedAt: string | null
  generatedAt: string | null
}

export async function getNieuwsArticle(slug: string): Promise<NieuwsArticle | null> {
  const { data, error } = await supabaseAdmin
    .from('nieuws_articles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !data) return null

  return mapRow(data)
}

export async function getLatestNieuws(limit = 10): Promise<NieuwsArticle[]> {
  const { data } = await supabaseAdmin
    .from('nieuws_articles')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)

  return (data ?? []).map(mapRow)
}

export async function getAllPublishedNieuws(): Promise<Pick<NieuwsArticle, 'slug' | 'titel' | 'publishedAt' | 'intro'>[]> {
  const { data } = await supabaseAdmin
    .from('nieuws_articles')
    .select('slug, titel, published_at, intro')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  return (data ?? []).map(r => ({
    slug: r.slug,
    titel: r.titel,
    publishedAt: r.published_at ?? null,
    intro: r.intro ?? null,
  }))
}

export async function getRecentNieuwsTitles(limit = 20): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from('nieuws_articles')
    .select('titel')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)

  return (data ?? []).map(r => r.titel)
}

export async function upsertNieuwsArticle(article: {
  slug: string
  titel: string
  metaDescription: string
  intro: string
  hoofdtekst: string
  faqItems: Array<{ vraag: string; antwoord: string }>
  jsonLd: Record<string, unknown>
  topicSeed: string
  status: 'draft' | 'published'
  publishedAt: string
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from('nieuws_articles')
    .upsert({
      slug: article.slug,
      titel: article.titel,
      meta_description: article.metaDescription,
      intro: article.intro,
      hoofdtekst: article.hoofdtekst,
      faq_items: article.faqItems,
      json_ld: article.jsonLd,
      topic_seed: article.topicSeed,
      status: article.status,
      published_at: article.publishedAt,
      generated_at: new Date().toISOString(),
    }, { onConflict: 'slug' })

  if (error) throw new Error(`Upsert nieuws mislukt: ${error.message}`)
}

function mapRow(data: Record<string, unknown>): NieuwsArticle {
  return {
    id: data.id as string,
    slug: data.slug as string,
    titel: data.titel as string,
    metaDescription: (data.meta_description as string) ?? null,
    intro: (data.intro as string) ?? null,
    hoofdtekst: (data.hoofdtekst as string) ?? null,
    faqItems: (data.faq_items as Array<{ vraag: string; antwoord: string }>) ?? [],
    jsonLd: (data.json_ld as Record<string, unknown>) ?? {},
    topicSeed: (data.topic_seed as string) ?? null,
    status: (data.status as 'draft' | 'published') ?? 'draft',
    publishedAt: (data.published_at as string) ?? null,
    generatedAt: (data.generated_at as string) ?? null,
  }
}
