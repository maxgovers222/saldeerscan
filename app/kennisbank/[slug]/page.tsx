import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArticleBody } from '@/components/content/ArticleBody'
import { ArticleShell } from '@/components/content/ArticleShell'
import { NetcongestieArticleBody } from '@/components/content/NetcongestieArticleBody'
import { LocalSchema } from '@/components/pseo/LocalSchema'
import { RelatedWijken } from '@/components/pseo/RelatedWijken'
import { getAllKennisbankSlugs, getKennisbankArticle, getKennisbankSummariesBySlugs } from '@/lib/kennisbank'
import { NETCONGESTIE_ARTICLE_SLUG } from '@/lib/netcongestie-article'

export const revalidate = 2592000

type Params = { slug: string }

export async function generateStaticParams() {
  try {
    const slugs = await getAllKennisbankSlugs()
    return slugs.map(slug => ({ slug }))
  } catch { return [] }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const article = await getKennisbankArticle(slug)
  if (!article) return {}
  return {
    title: `${article.titel} | SaldeerScan Kennisbank`,
    description: article.metaDescription ?? undefined,
    alternates: { canonical: `https://saldeerscan.nl/kennisbank/${slug}` },
    openGraph: {
      title: article.titel,
      description: article.metaDescription ?? undefined,
      type: 'article',
      locale: 'nl_NL',
      url: `https://saldeerscan.nl/kennisbank/${slug}`,
    },
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  saldering: 'Saldering',
  zonnepanelen: 'Zonnepanelen',
  netcongestie: 'Netcongestie',
  subsidie: 'Subsidie',
  algemeen: 'Algemeen',
}

function relatedWijkenHub(category: string): { provincie?: string; stad?: string } {
  switch (category) {
    case 'netcongestie':
      return { provincie: 'zuid-holland', stad: 'rotterdam' }
    case 'zonnepanelen':
      return { provincie: 'noord-holland', stad: 'amsterdam' }
    case 'saldering':
      return { provincie: 'utrecht', stad: 'utrecht' }
    case 'subsidie':
      return { provincie: 'gelderland', stad: 'arnhem' }
    default:
      return {}
  }
}

export default async function KennisbankArtikel({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const article = await getKennisbankArticle(slug)
  if (!article) notFound()

  const relatedSummaries = await getKennisbankSummariesBySlugs(article.relatedSlugs)
  const related = relatedSummaries.filter(item => item.slug !== slug).slice(0, 3)
  const publishedDate = article.generatedAt
    ? new Date(article.generatedAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const aside = (
    <>
      {related.length > 0 && (
        <div className="rounded-3xl border border-ink/10 bg-paper p-6 shadow-sm">
          <h2 className="text-base font-semibold text-ink">Gerelateerde artikelen</h2>
          <ul className="mt-4 space-y-3">
            {related.map(item => (
              <li key={item.slug}>
                <Link href={`/kennisbank/${item.slug}`} className="text-sm leading-6 text-ink-muted transition hover:text-trust-dark">
                  {item.titel}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Link href="/kennisbank" className="inline-flex min-h-11 items-center text-sm font-semibold text-trust-dark">
        ← Alle kennisbankartikelen
      </Link>
    </>
  )

  return (
    <>
      <LocalSchema jsonLd={article.jsonLd} />
      <ArticleShell
        kind="kennisbank"
        title={article.titel}
        intro={article.intro}
        date={publishedDate}
        category={CATEGORY_LABELS[article.category] ?? article.category}
        slug={slug}
        aside={aside}
      >
        {article.hoofdtekst && (
          slug === NETCONGESTIE_ARTICLE_SLUG
            ? <NetcongestieArticleBody />
            : <ArticleBody text={article.hoofdtekst} />
        )}

        {article.faqItems.length > 0 && (
          <section className="mt-12 border-t border-ink/10 pt-8">
            <h2 className="mb-6 text-2xl font-bold text-ink">Veelgestelde vragen</h2>
            <div className="space-y-4">
              {article.faqItems.map((faq, index) => (
                <details key={index} className="group rounded-2xl border border-ink/10 bg-paper">
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-ink">
                    {faq.vraag}
                    <span aria-hidden="true" className="text-trust-dark">+</span>
                  </summary>
                  <p className="border-t border-ink/10 px-5 py-4 leading-7 text-ink-muted">
                    {faq.antwoord}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}

        <div className="mt-12 rounded-3xl bg-evergreen-950 p-6 sm:p-8">
          <RelatedWijken
            limit={6}
            {...relatedWijkenHub(article.category)}
            title="Zonnepanelen en saldering per wijk"
            description={`Verdiep dit onderwerp (${article.titel}) met concrete data uit Nederlandse wijken — netcongestie, scores en 2027-impact.`}
          />
        </div>
      </ArticleShell>
    </>
  )
}
