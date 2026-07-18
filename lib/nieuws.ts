import 'server-only'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { buildArticleSchema } from '@/lib/json-ld'
import {
  LIANDER_ARTICLE_CORRECTION,
  LIANDER_ARTICLE_SLUG,
  sanitizeGeneratedEnergyCopy,
  sanitizeStructuredEnergyCopy,
} from '@/lib/editorial-standards'

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

  return applyNieuwsOverride(mapRow(data))
}

export async function getLatestNieuws(limit = 10): Promise<NieuwsArticle[]> {
  const { data } = await supabaseAdmin
    .from('nieuws_articles')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)

  return (data ?? []).map(row => applyNieuwsOverride(mapRow(row)))
}

export async function getAllPublishedNieuws(): Promise<Pick<NieuwsArticle, 'slug' | 'titel' | 'publishedAt' | 'intro'>[]> {
  const { data } = await supabaseAdmin
    .from('nieuws_articles')
    .select('slug, titel, published_at, intro')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  return (data ?? []).map(r => ({
    slug: r.slug,
    titel: r.slug === LIANDER_ARTICLE_SLUG
      ? LIANDER_ARTICLE_CORRECTION.titel
      : sanitizeGeneratedEnergyCopy(r.titel, 'short') ?? r.titel,
    publishedAt: r.published_at ?? null,
    intro: r.slug === LIANDER_ARTICLE_SLUG
      ? LIANDER_ARTICLE_CORRECTION.intro
      : sanitizeGeneratedEnergyCopy(r.intro ?? null),
  }))
}

export async function getRecentNieuwsTitles(limit = 20): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from('nieuws_articles')
    .select('slug, titel')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)

  return (data ?? []).map(r =>
    r.slug === LIANDER_ARTICLE_SLUG
      ? LIANDER_ARTICLE_CORRECTION.titel
      : sanitizeGeneratedEnergyCopy(r.titel, 'short') ?? r.titel
  )
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
    topicSeed: (data.topic_seed as string) ?? null,
    status: (data.status as 'draft' | 'published') ?? 'draft',
    publishedAt: (data.published_at as string) ?? null,
    generatedAt: (data.generated_at as string) ?? null,
  }
}

function applyNieuwsOverride(article: NieuwsArticle): NieuwsArticle {
  if (article.slug !== LIANDER_ARTICLE_SLUG) return article

  return {
    ...article,
    ...LIANDER_ARTICLE_CORRECTION,
    faqItems: [...LIANDER_ARTICLE_CORRECTION.faqItems],
    jsonLd: buildArticleSchema({
      slug: article.slug,
      titel: LIANDER_ARTICLE_CORRECTION.titel,
      metaDescription: LIANDER_ARTICLE_CORRECTION.metaDescription,
      publishedAt: article.publishedAt ?? article.generatedAt ?? new Date().toISOString(),
      type: 'nieuws',
      faqItems: [...LIANDER_ARTICLE_CORRECTION.faqItems],
    }),
  }
}
