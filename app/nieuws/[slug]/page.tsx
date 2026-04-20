import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getNieuwsArticle, getAllPublishedNieuws } from '@/lib/nieuws'
import { LocalSchema } from '@/components/pseo/LocalSchema'
import { NavDark, FooterDark } from '@/components/NavDark'

export const revalidate = 604800

type Params = { slug: string }

export async function generateStaticParams() {
  try {
    const articles = await getAllPublishedNieuws()
    return articles.map(a => ({ slug: a.slug }))
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

function renderMarkdown(text: string) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('## ')) {
      return (
        <h2 key={i} className="font-heading text-xl text-white font-bold mt-8 mb-3">
          {renderInline(line.slice(3))}
        </h2>
      )
    }
    if (line.startsWith('### ')) {
      return (
        <h3 key={i} className="font-heading text-lg text-white font-semibold mt-6 mb-2">
          {renderInline(line.slice(4))}
        </h3>
      )
    }
    if (line.trim() === '') return <div key={i} className="h-3" />
    return (
      <p key={i} className="text-slate-300 leading-relaxed mb-2">
        {renderInline(line)}
      </p>
    )
  })
}

function renderInline(text: string) {
  const parts = text.split('**')
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="text-white font-semibold">{part}</strong>
      : part
  )
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

  const moreArticles = allArticles.filter(a => a.slug !== slug).slice(0, 3)

  return (
    <main className="min-h-screen bg-[#020617]">
      <LocalSchema jsonLd={article.jsonLd} />
      <NavDark />
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
        <Link href="/" className="text-slate-500 hover:text-white transition-colors text-sm">Home</Link>
        <span className="text-slate-700">/</span>
        <Link href="/nieuws" className="text-slate-500 hover:text-white transition-colors text-sm">Nieuws</Link>
        <span className="text-slate-700">/</span>
        <span className="text-slate-300 text-sm truncate max-w-xs">{article.titel}</span>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Published date */}
        {article.publishedAt && (
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <time className="text-slate-500 text-sm font-mono" dateTime={article.publishedAt}>
              {formatDate(article.publishedAt)}
            </time>
          </div>
        )}

        <h1 className="font-heading text-3xl md:text-4xl text-white font-bold leading-tight mb-6">
          {article.titel}
        </h1>

        {article.intro && (
          <p className="text-slate-300 text-lg leading-relaxed mb-8 border-l-2 border-amber-500/40 pl-4">
            {article.intro}
          </p>
        )}

        {article.hoofdtekst && (
          <div className="mb-12">
            {renderMarkdown(article.hoofdtekst)}
          </div>
        )}

        {/* FAQ */}
        {article.faqItems.length > 0 && (
          <section className="border-t border-white/10 pt-8 mb-12">
            <h2 className="font-heading text-2xl text-white font-bold mb-6">Veelgestelde vragen</h2>
            <div className="space-y-4">
              {article.faqItems.map((faq, i) => (
                <details key={i} className="group bg-slate-900/40 border border-white/10 rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-white font-medium select-none list-none">
                    {faq.vraag}
                    <svg className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform shrink-0 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-5 pb-4 text-slate-300 leading-relaxed border-t border-white/5 pt-3">
                    {faq.antwoord}
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="bg-amber-950/20 border border-amber-500/25 rounded-2xl p-6 mb-12 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-white font-semibold mb-1">Wat betekent dit voor uw woning?</p>
            <p className="text-slate-400 text-sm">Bereken gratis uw persoonlijke rendement en besparing.</p>
          </div>
          <Link
            href="/check"
            className="shrink-0 inline-flex items-center gap-2 bg-amber-500 text-slate-950 font-semibold px-5 py-2.5 rounded-xl shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:bg-amber-400 transition-colors text-sm"
          >
            Gratis check starten
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* More news */}
        {moreArticles.length > 0 && (
          <section className="border-t border-white/10 pt-8">
            <h2 className="font-heading text-xl text-white font-bold mb-6">Meer nieuws</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {moreArticles.map(a => (
                <Link
                  key={a.slug}
                  href={`/nieuws/${a.slug}`}
                  className="group bg-slate-900/40 border border-white/10 rounded-xl p-4 hover:border-amber-500/30 transition-all"
                >
                  {a.publishedAt && (
                    <span className="text-slate-500 text-xs font-mono block mb-2">
                      {formatDate(a.publishedAt)}
                    </span>
                  )}
                  <p className="text-white text-sm font-medium group-hover:text-amber-300 transition-colors leading-snug">
                    {a.titel}
                  </p>
                </Link>
              ))}
            </div>
            <Link
              href="/nieuws"
              className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-sm mt-6"
            >
              Alle nieuwsartikelen
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </section>
        )}
      </div>
      <FooterDark />
    </main>
  )
}
