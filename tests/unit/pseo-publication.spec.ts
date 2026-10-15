import { expect, test } from '@playwright/test'
import originalRows from '../fixtures/recovery-location-rows.json'
import {
  PSEO_LEGACY_ENTRIES, PSEO_REVIEWED_COPIES, PSEO_PROVINCE_REDIRECTS,
  canonicalLocationPath, directoryLocation, projectPseoPublication, lookupSourceSlug,
} from '../../lib/pseo-publication'

const now = Date.parse('2026-10-16T12:00:00Z')
const project = (row: Record<string, unknown>) => projectPseoPublication(row, { now })!

test('all twelve reviewed original records render only the sourced replacement, with no invented metrics', () => {
  for (const copy of PSEO_REVIEWED_COPIES) {
    const row = originalRows.find(item => item.slug === copy.path)!
    expect(row).toBeTruthy()
    const page = project(row)
    expect(page.quality.state).toBe('reviewed')
    expect(page.quality.indexable).toBe(true)
    expect(page.hoofdtekst).toBe(copy.content.hoofdtekst)
    expect(page.aantalWoningen).toBe(copy.content.aantal_woningen)
    expect(page.evidence?.origin).toBe('CBS')
    expect(page.gemBouwjaar).toBeNull()
    expect(page.gemHealthScore).toBeNull()
    expect(page.netcongestieStatus).toBeNull()
    expect(page.postcodePrefix).toBeNull()
    expect(JSON.stringify(page.jsonLd)).not.toMatch(/ROOD|locatiescore|350–700|stapsgewijs|garandeert/)
  }
  expect(project(originalRows.find(row => row.slug.endsWith('/born'))!).evidence?.scope.kind).toBe('buurt')
})

test('the same reviewed content remains valid after the optional database patch, regardless of jsonb key order', () => {
  function reorder(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(reorder)
    return value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).reverse().map(([key, item]) => [key, reorder(item)])) : value
  }
  for (const copy of PSEO_REVIEWED_COPIES) {
    const row = { ...reorder(copy.content) as object, slug: copy.path, status: 'published' }
    expect(project(row).quality.state).toBe('reviewed')
  }
})

test('a newer editor change fails the display guard without automatically removing the audited URL', () => {
  const original = originalRows.find(row => row.slug.endsWith('/ijsselmonde'))!
  const page = project({ ...original, titel: 'A newer editor headline', hoofdtekst: '<script>unsafe</script> €999 gegarandeerd' })
  expect(page.quality).toMatchObject({ state: 'repair-pending', reason: 'review-original-changed', indexable: true, hasSufficientEvidence: false })
  expect(page.hoofdtekst).not.toContain('€999')
  expect(page.hoofdtekst).not.toContain('<script>')
  expect(page.aantalWoningen).toBeNull()
  expect(page.evidence).toBeNull()
})

test('new unreviewed publication cannot inherit retained-route approval or leak its generated claims', () => {
  const page = project({ slug: '/utrecht/utrecht/new-ai-location', status: 'published', titel: 'Gegarandeerd €900', hoofdtekst: 'Een batterij is noodzakelijk.', gem_health_score: 99 })
  expect(page.quality).toMatchObject({ indexable: false, state: 'new-unreviewed' })
  expect(JSON.stringify(page)).not.toContain('€900')
  expect(page.gemHealthScore).toBeNull()
  expect(directoryLocation({ slug: '/utrecht/utrecht/new-ai-location', status: 'published' })).toBeNull()
})

test('the rollback mode removes reviewed facts while preserving truthful fallback, canonical and audited discovery', () => {
  const original = originalRows.find(row => row.slug.endsWith('/ijsselmonde'))!
  const page = projectPseoPublication(original, { now, reviewedContentEnabled: false })!
  expect(page.quality).toMatchObject({ indexable: true, state: 'repair-pending', reason: 'reviewed-content-disabled' })
  expect(page.evidence).toBeNull()
  expect(page.aantalWoningen).toBeNull()
  expect(page.gemHealthScore).toBeNull()
  expect(page.hoofdtekst).not.toContain('€350')
})

test('draft status, missing street parents and stale evidence do not grant approval', () => {
  const original = originalRows[0]
  expect(project({ ...original, status: 'draft' }).quality.indexable).toBe(false)
  const street = PSEO_LEGACY_ENTRIES.find(entry => entry.path.split('/').length === 5)!
  expect(projectPseoPublication({ slug: street.sourceSlug, status: 'published' }, { now, parentIndexable: false })!.quality).toMatchObject({ indexable: false, reason: 'missing-parent' })
  expect(projectPseoPublication(original, { now: Date.parse('2029-01-01') })!.evidence).toBeNull()
})

test('province aliases consolidate only the exact audited routes and preserve lookup of existing rows', () => {
  const aliases = PSEO_LEGACY_ENTRIES.filter(entry => entry.sourceSlug !== entry.path)
  expect(aliases).toHaveLength(22)
  expect(PSEO_PROVINCE_REDIRECTS).toHaveLength(25)
  for (const alias of aliases) {
    expect(lookupSourceSlug(alias.path)).toBe(alias.sourceSlug)
    expect(canonicalLocationPath(alias.sourceSlug)).toBe(alias.path)
    expect(directoryLocation({ slug: alias.sourceSlug, status: 'published' })?.slug).toBe(alias.path)
  }
  expect(PSEO_PROVINCE_REDIRECTS.some(route => route.source.includes('*'))).toBe(false)
  expect(new Set(PSEO_LEGACY_ENTRIES.map(entry => entry.path)).size).toBe(2275)
})
