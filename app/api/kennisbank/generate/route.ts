import { generateKennisbankContent } from '@/lib/gemini'
import { getAllKennisbankSlugs, saveKennisbankDraft } from '@/lib/kennisbank'

export async function POST(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const slug = body?.slug as string | undefined
  if (!slug || typeof slug !== 'string') {
    return Response.json({ error: 'slug vereist' }, { status: 400 })
  }

  const allSlugs = await getAllKennisbankSlugs()

  const content = await generateKennisbankContent({ slug, allSlugs })
  const created = await saveKennisbankDraft({
    slug,
    titel: content.titel,
    metaDescription: content.metaDescription ?? '',
    intro: content.intro ?? '',
    hoofdtekst: content.hoofdtekst,
    faqItems: content.faqItems,
    category: content.category ?? 'algemeen',
    relatedSlugs: content.relatedSlugs ?? [],
    status: 'draft',
  })

  return Response.json({ ok: true, slug, status: created ? 'draft' : 'unchanged', requiresEditorialReview: true })
}
