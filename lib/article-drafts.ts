import type { SupabaseClient } from '@supabase/supabase-js'

/** Generated copy never publishes or replaces an existing article. */
export async function saveGeneratedArticleDraft(
  client: SupabaseClient,
  table: 'nieuws_articles' | 'kennisbank_articles',
  article: Record<string, unknown> & { slug: string },
): Promise<boolean> {
  if (article.status !== undefined && article.status !== 'draft') {
    throw new Error('Generated articles must be saved as drafts for editorial review')
  }
  const { data, error } = await client.from(table).upsert({
    ...article,
    status: 'draft',
    json_ld: {},
    ...(table === 'nieuws_articles' ? { published_at: null } : {}),
  }, { onConflict: 'slug', ignoreDuplicates: true }).select('slug')
  if (error) throw new Error(`Save article draft failed: ${error.message}`)
  return (data?.length ?? 0) > 0
}
