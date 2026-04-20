import { Metadata } from 'next'
import Link from 'next/link'
import { getAllPublishedKennisbank } from '@/lib/kennisbank'
import { NavDark, FooterDark } from '@/components/NavDark'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Kennisbank Zonnepanelen & Saldering 2027 | SaldeerScan',
  description: 'Alles over zonnepanelen, saldering en de wijzigingen per 1 januari 2027. Uitgebreide artikelen voor Nederlandse huiseigenaren.',
  alternates: { canonical: 'https://saldeerscan.nl/kennisbank' },
  openGraph: {
    title: 'Kennisbank Zonnepanelen & Saldering 2027',
    description: 'Alles over zonnepanelen, saldering en de wijzigingen per 1 januari 2027.',
    type: 'website',
    locale: 'nl_NL',
    url: 'https://saldeerscan.nl/kennisbank',
  },
}

const CATEGORY_LABELS: Record<string, string> = {
  saldering: 'Saldering',
  zonnepanelen: 'Zonnepanelen',
  netcongestie: 'Netcongestie',
  subsidie: 'Subsidie',
  algemeen: 'Algemeen',
}

const CATEGORY_COLORS: Record<string, string> = {
  saldering: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  zonnepanelen: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  netcongestie: 'bg-red-500/20 text-red-300 border-red-500/30',
  subsidie: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  algemeen: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
}

export default async function KennisbankOverzicht() {
  const articles = await getAllPublishedKennisbank()

  return (
    <main className="min-h-screen bg-[#020617]">
      <NavDark />
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        <Link href="/" className="text-slate-500 hover:text-white transition-colors text-sm">Home</Link>
        <span className="text-slate-700">/</span>
        <span className="text-slate-300 text-sm">Kennisbank</span>
      </div>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-12">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1 mb-6">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-300 text-xs font-medium tracking-wide uppercase">Saldering stopt 1 jan 2027</span>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-white font-bold leading-tight mb-4">
            Kennisbank
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Uitgebreide artikelen over zonnepanelen, saldering en energiebesparing.
            Alles wat u moet weten over de wijzigingen per 1 januari 2027.
          </p>
        </div>
      </section>

      {/* Articles grid */}
      <section className="max-w-6xl mx-auto px-4 pb-24">
        {articles.length === 0 ? (
          <p className="text-slate-500 text-center py-16">Artikelen worden binnenkort gepubliceerd.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map(article => (
              <Link
                key={article.slug}
                href={`/kennisbank/${article.slug}`}
                className="group bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-amber-500/30 hover:bg-slate-900/60 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${CATEGORY_COLORS[article.category] ?? CATEGORY_COLORS.algemeen}`}>
                    {CATEGORY_LABELS[article.category] ?? article.category}
                  </span>
                </div>
                <h2 className="font-heading text-lg text-white font-semibold mb-3 group-hover:text-amber-300 transition-colors leading-snug">
                  {article.titel}
                </h2>
                {article.intro && (
                  <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
                    {article.intro.slice(0, 140)}{article.intro.length > 140 ? '…' : ''}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-1 text-amber-400 text-sm font-medium">
                  Lees artikel
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
            Wat betekent 2027 voor uw woning?
          </h2>
          <p className="text-slate-400 mb-6 max-w-lg mx-auto">
            Bereken gratis uw persoonlijke besparing en rendement met onze AI-analyse.
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
      <FooterDark />
    </main>
  )
}
