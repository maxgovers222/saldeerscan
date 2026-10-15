import { expect, test } from '@playwright/test'
import type { SupabaseClient } from '@supabase/supabase-js'
import { saveGeneratedArticleDraft } from '../../lib/article-drafts'

function draftClient(inserted: boolean) {
  const calls: Array<{ table: string; row: Record<string, unknown>; options: unknown }> = []
  const client = {
    from(table: string) {
      return {
        upsert(row: Record<string, unknown>, options: unknown) {
          calls.push({ table, row, options })
          return { select: async () => ({ data: inserted ? [{ slug: row.slug }] : [], error: null }) }
        },
      }
    },
  } as unknown as SupabaseClient
  return { client, calls }
}

test('new generated news stays unpublished without publication schema', async () => {
  const { client, calls } = draftClient(true)
  expect(await saveGeneratedArticleDraft(client, 'nieuws_articles', {
    slug: 'test', status: 'draft', published_at: '2026-10-13', json_ld: { '@type': 'NewsArticle' },
  })).toBe(true)
  expect(calls[0].row).toMatchObject({ status: 'draft', published_at: null, json_ld: {} })
  expect(calls[0].options).toEqual({ onConflict: 'slug', ignoreDuplicates: true })
})

test('an existing published article is left unchanged instead of replaced or demoted', async () => {
  const { client, calls } = draftClient(false)
  expect(await saveGeneratedArticleDraft(client, 'kennisbank_articles', { slug: 'existing' })).toBe(false)
  expect(calls[0].options).toEqual({ onConflict: 'slug', ignoreDuplicates: true })
})

test('publication requests are rejected before accessing the database', async () => {
  const { client, calls } = draftClient(true)
  await expect(saveGeneratedArticleDraft(client, 'nieuws_articles', {
    slug: 'test', status: 'published',
  })).rejects.toThrow('editorial review')
  expect(calls).toEqual([])
})
