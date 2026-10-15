import 'server-only'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { buildArticleSchema } from '@/lib/json-ld'
import { saveGeneratedArticleDraft } from '@/lib/article-drafts'
import { REVIEWED_NEWS_COPY } from '@/lib/reviewed-news'
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
  reviewedAt?: string
  sources?: Array<{ label: string; url: string }>
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

export async function getAllPublishedNieuws(): Promise<Pick<NieuwsArticle, 'slug' | 'titel' | 'publishedAt' | 'intro' | 'reviewedAt'>[]> {
  const { data } = await supabaseAdmin
    .from('nieuws_articles')
    .select('slug, titel, published_at, intro')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  return (data ?? []).map(r => ({
    slug: r.slug,
    titel: REVIEWED_NEWS_COPY[r.slug]?.titel ?? (r.slug === LIANDER_ARTICLE_SLUG
      ? LIANDER_ARTICLE_CORRECTION.titel
      : sanitizeGeneratedEnergyCopy(r.titel, 'short') ?? r.titel),
    publishedAt: r.published_at ?? null,
    reviewedAt: REVIEWED_NEWS_COPY[r.slug]?.reviewedAt,
    intro: REVIEWED_NEWS_COPY[r.slug]?.intro ?? (r.slug === LIANDER_ARTICLE_SLUG
      ? LIANDER_ARTICLE_CORRECTION.intro
      : sanitizeGeneratedEnergyCopy(r.intro ?? null)),
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
    REVIEWED_NEWS_COPY[r.slug]?.titel ?? (r.slug === LIANDER_ARTICLE_SLUG
      ? LIANDER_ARTICLE_CORRECTION.titel
      : sanitizeGeneratedEnergyCopy(r.titel, 'short') ?? r.titel)
  )
}

export async function saveNieuwsDraft(article: {
  slug: string
  titel: string
  metaDescription: string
  intro: string
  hoofdtekst: string
  faqItems: Array<{ vraag: string; antwoord: string }>
  topicSeed: string
  status: 'draft'
}): Promise<boolean> {
  return saveGeneratedArticleDraft(supabaseAdmin, 'nieuws_articles', {
      slug: article.slug,
      titel: article.titel,
      meta_description: article.metaDescription,
      intro: article.intro,
      hoofdtekst: article.hoofdtekst,
      faq_items: article.faqItems,
      topic_seed: article.topicSeed,
      status: article.status,
      generated_at: new Date().toISOString(),
    })
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
  const correction = REVIEWED_NEWS_COPY[article.slug]
    ?? (article.slug === LIANDER_ARTICLE_SLUG ? LIANDER_ARTICLE_CORRECTION : null)
  if (!correction) return article

  return {
    ...article,
    ...correction,
    faqItems: [...correction.faqItems],
    jsonLd: buildArticleSchema({
      slug: article.slug,
      titel: correction.titel,
      metaDescription: correction.metaDescription,
      publishedAt: article.publishedAt ?? article.generatedAt ?? new Date().toISOString(),
      type: 'nieuws',
      modifiedAt: 'reviewedAt' in correction ? correction.reviewedAt : undefined,
      faqItems: [...correction.faqItems],
    }),
  }
}
