import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArticleBody } from '@/components/content/ArticleBody'
import { ArticleShell } from '@/components/content/ArticleShell'
import { LocalSchema } from '@/components/pseo/LocalSchema'
import { RelatedWijken } from '@/components/pseo/RelatedWijken'
import { getAllPublishedNieuws, getNieuwsArticle } from '@/lib/nieuws'

export const revalidate = 604800

type Params = { slug: string }

export async function generateStaticParams() {
  try {
    const articles = await getAllPublishedNieuws()
    return articles.map(article => ({ slug: article.slug }))
  } catch { return [] }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const article = await getNieuwsArticle(slug)
  if (!article) return {}
  return {
    title: `${article.titel} | SaldeerScan Nieuws`,
    description: article.metaDescription ?? undefined,
    alternates: { canonical: `https://saldeerscan.nl/nieuws/${slug}` },
    openGraph: {
      title: article.titel,
      description: article.metaDescription ?? undefined,
      type: 'article',
      locale: 'nl_NL',
      url: `https://saldeerscan.nl/nieuws/${slug}`,
      publishedTime: article.publishedAt ?? undefined,
    },
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function NieuwsArtikel({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const [article, allArticles] = await Promise.all([
    getNieuwsArticle(slug),
    getAllPublishedNieuws(),
  ])

  if (!article) notFound()

  const moreArticles = allArticles.filter(item => item.slug !== slug).slice(0, 3)
  const publishedDate = article.publishedAt ? formatDate(article.publishedAt) : null
  const aside = (
    <>
      {moreArticles.length > 0 && (
        <div className="rounded-3xl border border-ink/10 bg-paper p-6 shadow-sm">
          <h2 className="text-base font-semibold text-ink">Meer nieuws</h2>
          <ul className="mt-4 space-y-4">
            {moreArticles.map(item => (
              <li key={item.slug}>
                {item.publishedAt && <span className="mb-1 block font-mono text-xs text-ink-muted">{formatDate(item.publishedAt)}</span>}
                <Link href={`/nieuws/${item.slug}`} className="text-sm font-medium leading-6 text-ink transition hover:text-trust-dark">
                  {item.titel}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Link href="/nieuws" className="inline-flex min-h-11 items-center text-sm font-semibold text-trust-dark">
        ← Alle nieuwsartikelen
      </Link>
    </>
  )

  return (
    <>
      <LocalSchema jsonLd={article.jsonLd} />
      <ArticleShell
        kind="nieuws"
        title={article.titel}
        intro={article.intro}
        date={publishedDate}
        slug={slug}
        aside={aside}
      >
        {article.hoofdtekst && <ArticleBody text={article.hoofdtekst} />}

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
            limit={4}
            title="Wijkdata bij dit nieuws"
            description="Bekijk netcongestie, energiescores en 2027-impact in concrete wijken — vervolg na dit artikel."
          />
        </div>
      </ArticleShell>
    </>
  )
}
