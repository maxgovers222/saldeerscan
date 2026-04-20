import { Metadata } from 'next'
import Link from 'next/link'
import { getAllPublishedNieuws } from '@/lib/nieuws'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Nieuws Zonnepanelen & Saldering 2027 | SaldeerScan',
  description: 'Actueel nieuws over zonnepanelen, saldering en de energietransitie in Nederland. Wekelijkse updates voor woningeigenaren.',
  alternates: { canonical: 'https://saldeerscan.nl/nieuws' },
  openGraph: {
    title: 'Nieuws Zonnepanelen & Saldering 2027',
    description: 'Actueel nieuws over zonnepanelen en saldering in Nederland.',
    type: 'website',
    locale: 'nl_NL',
    url: 'https://saldeerscan.nl/nieuws',
  },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function NieuwsOverzicht() {
  const articles = await getAllPublishedNieuws()

  return (
    <main className="min-h-screen bg-[#020617]">
      {/* Header */}
      <div className="border-b border-white/5 bg-slate-950/80">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors text-sm">Home</Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-200 text-sm">Nieuws</span>
        </div>
      </div>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-10">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1 mb-6">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-300 text-xs font-medium tracking-wide uppercase">Wekelijks bijgewerkt</span>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-white font-bold leading-tight mb-4">
            Nieuws
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Actuele berichten over zonnepanelen, netcongestie en de salderingswijzigingen.
            Blijf op de hoogte van alles rondom 1 januari 2027.
          </p>
        </div>
      </section>

      {/* Articles list */}
      <section className="max-w-6xl mx-auto px-4 pb-24">
        {articles.length === 0 ? (
          <p className="text-slate-500 text-center py-16">Eerste nieuwsartikelen worden binnenkort gepubliceerd.</p>
        ) : (
          <div className="space-y-4">
            {articles.map(article => (
              <Link
                key={article.slug}
                href={`/nieuws/${article.slug}`}
                className="group flex flex-col md:flex-row md:items-start gap-4 bg-slate-900/40 border border-white/10 rounded-2xl p-6 hover:border-amber-500/30 hover:bg-slate-900/60 transition-all"
              >
                <div className="shrink-0">
                  {article.publishedAt && (
                    <span className="text-slate-500 text-sm font-mono whitespace-nowrap">
                      {formatDate(article.publishedAt)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-heading text-lg text-white font-semibold mb-2 group-hover:text-amber-300 transition-colors leading-snug">
                    {article.titel}
                  </h2>
                  {article.intro && (
                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">
                      {article.intro}
                    </p>
                  )}
                </div>
                <div className="shrink-0 flex items-center gap-1 text-amber-400 text-sm font-medium whitespace-nowrap">
                  Lees meer
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 bg-amber-950/20 border border-amber-500/25 rounded-2xl p-8 text-center">
          <h2 className="font-heading text-2xl text-white font-bold mb-3">
            Persoonlijk advies voor uw woning
          </h2>
          <p className="text-slate-400 mb-6 max-w-lg mx-auto">
            Bereken gratis wat de 2027-wijzigingen betekenen voor uw specifieke situatie.
          </p>
          <Link
            href="/check"
            className="inline-flex items-center gap-2 bg-amber-500 text-slate-950 font-semibold px-6 py-3 rounded-xl shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:bg-amber-400 transition-colors"
          >
            Gratis 2027-check starten
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>
    </main>
  )
}
