import 'server-only'
import { unstable_cache } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { saveGeneratedArticleDraft } from '@/lib/article-drafts'
import { REVIEWED_KNOWLEDGE } from '@/lib/reviewed-energy-articles'
import { buildArticleSchema } from '@/lib/article-schema'
import {
  sanitizeGeneratedEnergyCopy,
  sanitizeStructuredEnergyCopy,
} from '@/lib/editorial-standards'
import {
  NETCONGESTIE_ARTICLE,
  NETCONGESTIE_ARTICLE_SLUG,
} from '@/lib/netcongestie-article'

const KENNISBANK_REVALIDATE = 86400
const EDITORIAL_VERSION = '2026-10-15.reviewed-corpus.v1'

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
  reviewedAt?: string
  sources?: Array<{ label: string; url: string }>
}

export const getKennisbankArticle = unstable_cache(
  async (slug: string): Promise<KennisbankArticle | null> => {
    const { data, error } = await supabaseAdmin
      .from('kennisbank_articles')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (error || !data) return slug === NETCONGESTIE_ARTICLE_SLUG ? NETCONGESTIE_ARTICLE : null

    return mapRow(data)
  },
  ['kennisbank', 'article', EDITORIAL_VERSION],
  { revalidate: KENNISBANK_REVALIDATE }
)

export const getAllKennisbankSlugs = unstable_cache(
  async (): Promise<string[]> => {
    const { data } = await supabaseAdmin
      .from('kennisbank_articles')
      .select('slug')
      .eq('status', 'published')

    return [...new Set([
      NETCONGESTIE_ARTICLE_SLUG,
      ...(data ?? []).map(r => r.slug),
    ])]
  },
  ['kennisbank', 'allSlugs', EDITORIAL_VERSION],
  { revalidate: KENNISBANK_REVALIDATE }
)

export const getAllPublishedKennisbank = unstable_cache(
  async (): Promise<KennisbankSummary[]> => {
    const { data } = await supabaseAdmin
      .from('kennisbank_articles')
      .select('slug, titel, category, intro, generated_at')
      .eq('status', 'published')
      .order('generated_at', { ascending: false })

    const summaries = (data ?? []).map(r => ({
      slug: r.slug,
      titel: REVIEWED_KNOWLEDGE[r.slug]?.titel ?? sanitizeGeneratedEnergyCopy(r.titel, 'short') ?? r.titel,
      category: r.category ?? 'algemeen',
      intro: REVIEWED_KNOWLEDGE[r.slug]?.intro ?? sanitizeGeneratedEnergyCopy(r.intro ?? null),
      generatedAt: r.generated_at ?? null,
      reviewedAt: REVIEWED_KNOWLEDGE[r.slug]?.reviewedAt,
    }))
    return [
      {
        slug: NETCONGESTIE_ARTICLE.slug,
        titel: NETCONGESTIE_ARTICLE.titel,
        category: NETCONGESTIE_ARTICLE.category,
        intro: NETCONGESTIE_ARTICLE.intro,
        generatedAt: summaries.find(item => item.slug === NETCONGESTIE_ARTICLE_SLUG)?.generatedAt ?? NETCONGESTIE_ARTICLE.generatedAt,
        reviewedAt: NETCONGESTIE_ARTICLE.reviewedAt,
      },
      ...summaries.filter(item => item.slug !== NETCONGESTIE_ARTICLE_SLUG),
    ]
  },
  ['kennisbank', 'allPublished', EDITORIAL_VERSION],
  { revalidate: KENNISBANK_REVALIDATE }
)

/** Alleen voor gerelateerde artikelen — geen volledige tabel per pagina tijdens build. */
type KennisbankSummary = Pick<KennisbankArticle, 'slug' | 'titel' | 'category' | 'intro' | 'generatedAt' | 'reviewedAt'>
export async function getKennisbankSummariesBySlugs(
  slugs: string[]
): Promise<KennisbankSummary[]> {
  const unique = [...new Set(slugs.filter(Boolean))]
  if (unique.length === 0) return []

  const databaseSlugs = unique.slice(0, 20)
  const { data } = databaseSlugs.length > 0
    ? await supabaseAdmin
        .from('kennisbank_articles')
        .select('slug, titel, category, intro, generated_at')
        .eq('status', 'published')
        .in('slug', databaseSlugs)
    : { data: [] }

  const summaries = (data ?? []).map(r => ({
    slug: r.slug,
    titel: REVIEWED_KNOWLEDGE[r.slug]?.titel ?? sanitizeGeneratedEnergyCopy(r.titel, 'short') ?? r.titel,
    category: r.category ?? 'algemeen',
    intro: REVIEWED_KNOWLEDGE[r.slug]?.intro ?? sanitizeGeneratedEnergyCopy(r.intro ?? null),
    generatedAt: r.generated_at ?? null,
    reviewedAt: REVIEWED_KNOWLEDGE[r.slug]?.reviewedAt,
  }))
  return unique.includes(NETCONGESTIE_ARTICLE_SLUG)
    ? [
        {
          slug: NETCONGESTIE_ARTICLE.slug,
          titel: NETCONGESTIE_ARTICLE.titel,
          category: NETCONGESTIE_ARTICLE.category,
          intro: NETCONGESTIE_ARTICLE.intro,
          generatedAt: summaries.find(item => item.slug === NETCONGESTIE_ARTICLE_SLUG)?.generatedAt ?? NETCONGESTIE_ARTICLE.generatedAt,
          reviewedAt: NETCONGESTIE_ARTICLE.reviewedAt,
        },
        ...summaries.filter(item => item.slug !== NETCONGESTIE_ARTICLE_SLUG),
      ]
    : summaries
}

export async function saveKennisbankDraft(article: {
  slug: string
  titel: string
  metaDescription: string
  intro: string
  hoofdtekst: string
  faqItems: Array<{ vraag: string; antwoord: string }>
  category: string
  relatedSlugs: string[]
  status: 'draft'
}): Promise<boolean> {
  return saveGeneratedArticleDraft(supabaseAdmin, 'kennisbank_articles', {
      slug: article.slug,
      titel: article.titel,
      meta_description: article.metaDescription,
      intro: article.intro,
      hoofdtekst: article.hoofdtekst,
      faq_items: article.faqItems,
      category: article.category,
      related_slugs: article.relatedSlugs,
      status: article.status,
      generated_at: new Date().toISOString(),
    })
}

function mapRow(data: Record<string, unknown>): KennisbankArticle {
  const correction = REVIEWED_KNOWLEDGE[data.slug as string]
    ?? (data.slug === NETCONGESTIE_ARTICLE_SLUG ? NETCONGESTIE_ARTICLE : null)
  if (correction) {
    return { id: data.id as string, slug: data.slug as string, ...correction,
      jsonLd: buildArticleSchema({ slug: data.slug as string, titel: correction.titel,
        metaDescription: correction.metaDescription, publishedAt: data.generated_at as string,
        modifiedAt: correction.reviewedAt, type: 'kennisbank', faqItems: correction.faqItems }),
      category: (data.category as KennisbankArticle['category']) ?? 'algemeen',
      relatedSlugs: (data.related_slugs as string[]) ?? [],
      status: data.status as KennisbankArticle['status'], generatedAt: data.generated_at as string,
    }
  }
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
