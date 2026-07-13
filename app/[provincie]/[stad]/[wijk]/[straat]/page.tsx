import { cache } from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPseoPage, getTopPseoPages, getStratenByWijk, getWijkPage } from '@/lib/pseo'
import { LocalSchema } from '@/components/pseo/LocalSchema'
import { RenovatieInsightCard } from '@/components/pseo/RenovatieInsightCard'
import { renovatieIntelligence, straatVsWijkDelta } from '@/lib/pseo-variation'
import { buildCheckHref } from '@/lib/conversion-context'

// Deduplicate Supabase fetches: generateMetadata + page component share one request
const getCachedPseoPage = cache(getPseoPage)

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDisplay(slug: string) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ISR: revalidate every 30 days
export const revalidate = 2592000

type Params = { provincie: string; stad: string; wijk: string; straat: string }

export async function generateStaticParams() {
  try {
    const pages = await getTopPseoPages(1000)
    return pages.map(p => ({
      provincie: p.provincie,
      stad: p.stad,
      wijk: p.wijk ?? 'centrum',
      straat: p.straat ?? 'onbekend',
    }))
  } catch {
    // DB not available at build time — ISR handles runtime generation
    return []
  }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const p = await params
  const page = await getCachedPseoPage(p)
  if (!page) return { title: 'Pagina niet gevonden' }

  return {
    title: page.titel ?? `Energiebesparing ${p.straat} ${p.stad}`,
    description: page.metaDescription ?? undefined,
    alternates: { canonical: `https://saldeerscan.nl${page.slug}` },
    openGraph: {
      title: page.titel ?? undefined,
      description: page.metaDescription ?? undefined,
      url: `https://saldeerscan.nl${page.slug}`,
      siteName: 'SaldeerScan.nl',
      locale: 'nl_NL',
      type: 'website',
      images: [{
        url: `https://saldeerscan.nl/api/og?titel=${encodeURIComponent(page.titel ?? `Energiebesparing ${p.straat}`)}&score=${page.gemHealthScore ?? ''}&status=${page.netcongestieStatus ?? ''}&type=straat`,
        width: 1200,
        height: 630,
      }],
    },
  }
}

export default async function PseoStreetPage({ params }: { params: Promise<Params> }) {
  const p = await params
  const page = await getCachedPseoPage(p)
  if (!page) notFound()
  const checkHref = `${buildCheckHref({
    landingPath: `/${p.provincie}/${p.stad}/${p.wijk}/${p.straat}`,
    pseoLevel: 'straat',
    provincie: p.provincie,
    stad: p.stad,
    wijk: p.wijk,
    straat: p.straat,
  })}&adres=${encodeURIComponent(`${p.straat} ${p.stad}`)}`

  const wijkPage = await getWijkPage({ provincie: p.provincie, stad: p.stad, wijk: p.wijk })
  const straatDelta = wijkPage
    ? straatVsWijkDelta(
        {
          gemBouwjaar: page.gemBouwjaar,
          gemHealthScore: page.gemHealthScore,
          netcongestieStatus: page.netcongestieStatus,
        },
        {
          gemBouwjaar: wijkPage.gemBouwjaar,
          gemHealthScore: wijkPage.gemHealthScore,
          netcongestieStatus: wijkPage.netcongestieStatus,
        },
      )
    : null

  const straatRenovatie = renovatieIntelligence(
    page.gemBouwjaar,
    `${toDisplay(p.straat)} — ${toDisplay(p.wijk)}`,
  )

  const andereStraten = await getStratenByWijk(p.provincie, p.stad, p.wijk, p.straat, 6)

  // Strip FAQPage schema van straat-niveau (vermijdt structured data spam bij 2270+ pagina's)
  const pageJsonLd = (() => {
    if (!page.jsonLd || Object.keys(page.jsonLd).length === 0) return page.jsonLd
    try {
      const parsed = page.jsonLd as Record<string, unknown>
      if (parsed['@graph'] && Array.isArray(parsed['@graph'])) {
        const filtered = (parsed['@graph'] as Array<{ '@type': string }>).filter(n => n['@type'] !== 'FAQPage')
        return { ...parsed, '@graph': filtered }
      }
      if (parsed['@type'] === 'FAQPage') return null
      return parsed
    } catch {
      return page.jsonLd
    }
  })()

  const healthLabel = page.gemHealthScore
    ? page.gemHealthScore >= 75 ? 'Uitstekend'
    : page.gemHealthScore >= 55 ? 'Goed'
    : page.gemHealthScore >= 35 ? 'Matig' : 'Slecht'
    : null

  const netBadge = {
    ROOD: { label: 'Vol stroomnet', color: 'text-red-400 bg-red-900/30' },
    ORANJE: { label: 'Druk stroomnet', color: 'text-amber-400 bg-amber-900/30' },
    GROEN: { label: 'Vrij stroomnet', color: 'text-emerald-400 bg-emerald-900/30' },
  }

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-100">
      {/* JSON-LD — FAQPage gefilterd op straat-niveau */}
      {pageJsonLd && Object.keys(pageJsonLd).length > 0 && (
        <LocalSchema jsonLd={pageJsonLd} />
      )}

      {/* BreadcrumbList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://saldeerscan.nl/" },
              { "@type": "ListItem", "position": 2, "name": toDisplay(p.provincie), "item": `https://saldeerscan.nl/${p.provincie}` },
              { "@type": "ListItem", "position": 3, "name": toDisplay(p.stad), "item": `https://saldeerscan.nl/${p.provincie}/${p.stad}` },
              { "@type": "ListItem", "position": 4, "name": toDisplay(p.wijk), "item": `https://saldeerscan.nl/${p.provincie}/${p.stad}/${p.wijk}` },
              { "@type": "ListItem", "position": 5, "name": toDisplay(p.straat), "item": `https://saldeerscan.nl/${p.provincie}/${p.stad}/${p.wijk}/${p.straat}` },
            ]
          })
        }}
      />

      {/* Hero */}
      <section className="px-4 py-16 max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6 flex-wrap">
          <a href="/" className="hover:text-amber-400 transition-colors">Home</a>
          <span>/</span>
          <a href={`/${p.provincie}`} className="hover:text-amber-400 transition-colors capitalize">{p.provincie.replace(/-/g, ' ')}</a>
          <span>/</span>
          <a href={`/${p.provincie}/${p.stad}`} className="hover:text-amber-400 transition-colors capitalize">{p.stad.replace(/-/g, ' ')}</a>
          <span>/</span>
          <a
            href={`/${p.provincie}/${p.stad}/${p.wijk}`}
            data-analytics-event="pseo_second_click"
            data-analytics-label={`straat-breadcrumb-wijk:${p.wijk}`}
            className="hover:text-amber-400 transition-colors capitalize font-semibold text-amber-500/90"
          >
            {p.wijk.replace(/-/g, ' ')}
          </a>
          <span>/</span>
          <span className="text-slate-400 capitalize">{p.straat.replace(/-/g, ' ')}</span>
        </nav>

        <div className="flex flex-wrap gap-3 mb-6">
          {page.netcongestieStatus && netBadge[page.netcongestieStatus as keyof typeof netBadge] && (
            <span className={`text-xs font-mono px-3 py-1 rounded-full ${netBadge[page.netcongestieStatus as keyof typeof netBadge].color}`}>
              {netBadge[page.netcongestieStatus as keyof typeof netBadge].label}
            </span>
          )}
          {page.gemBouwjaar && (
            <span className="text-xs font-mono px-3 py-1 rounded-full text-slate-400 bg-slate-800">
              Bouwjaar ~{page.gemBouwjaar}
            </span>
          )}
          {healthLabel && (
            <span className="text-xs font-mono px-3 py-1 rounded-full text-amber-400 bg-amber-900/30">
              Score: {healthLabel}
            </span>
          )}
          {page.aantalWoningen && (
            <span className="text-xs font-mono px-3 py-1 rounded-full text-slate-400 bg-slate-800">
              {page.aantalWoningen} woningen
            </span>
          )}
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          {page.titel ?? `Zonnepanelen & batterij op ${p.straat}`}
        </h1>

        {page.metaDescription && (
          <p className="text-slate-400 text-lg mb-8">{page.metaDescription}</p>
        )}

        {/* CTA */}
        <a
          href={checkHref}
          data-analytics-event="pseo_check_cta"
          data-analytics-label={`straat:${p.wijk}:${p.straat}`}
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-6 py-3 rounded-lg transition-colors"
        >
          Check uw woning gratis →
        </a>
      </section>

      {straatDelta && (
        <section className="px-4 pb-8 max-w-4xl mx-auto">
          <div className="rounded-2xl border border-amber-500/25 bg-amber-950/20 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-2">Straat vs wijk</p>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">{straatDelta.samenvatting}</p>
            <p className="text-xs font-mono text-slate-500">
              Score {straatDelta.streetScore}/100 op straatniveau · wijkgemiddelde {straatDelta.parentWijkScore}/100
              {straatDelta.deltaBouwjaar != null && (
                <span> · bouwjaarverschil {straatDelta.deltaBouwjaar > 0 ? '+' : ''}{straatDelta.deltaBouwjaar} jaar t.o.v. wijk</span>
              )}
            </p>
            <a
              href={`/${p.provincie}/${p.stad}/${p.wijk}`}
              data-analytics-event="pseo_second_click"
              data-analytics-label={`straat-uplink:${p.wijk}`}
              className="mt-4 inline-flex text-sm font-semibold text-amber-300 hover:text-amber-200"
            >
              Bekijk volledige wijkanalyse →
            </a>
          </div>
        </section>
      )}

      {straatRenovatie && (
        <section className="px-4 pb-10 max-w-4xl mx-auto">
          <RenovatieInsightCard titel={straatRenovatie.titel} tekst={straatRenovatie.tekst} />
        </section>
      )}

      {/* Main content */}
      {page.hoofdtekst && (
        <section className="px-4 pb-12 max-w-4xl mx-auto">
          <div className="prose prose-invert prose-slate max-w-none">
            {page.hoofdtekst.split('\n\n').map((para, i) => (
              <p key={i} className="text-slate-300 mb-4 leading-relaxed">{para}</p>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      {page.faqItems.length > 0 && (
        <section className="px-4 pb-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-amber-400">Veelgestelde vragen</h2>
          <div className="space-y-4">
            {page.faqItems.map((faq, i) => (
              <div key={i} className="border border-slate-700 rounded-lg p-5 bg-slate-800/50">
                <h3 className="font-semibold text-slate-100 mb-2">{faq.vraag}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{faq.antwoord}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      {/* Andere straten in wijk */}
      {andereStraten.length > 0 && (
        <section className="px-4 pb-16 max-w-4xl mx-auto">
          <div className="border-t border-slate-800 pt-10">
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-4">
              Andere straten in {p.wijk.replace(/-/g, ' ')}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {andereStraten.map((s) => (
                <a
                  key={s.straat}
                  href={`/${s.provincie}/${s.stad}/${s.wijk}/${s.straat}`}
                  data-analytics-event="pseo_second_click"
                  data-analytics-label={`straat-peer:${s.straat}`}
                  className="bg-slate-900/40 border border-white/10 hover:border-white/20 rounded-xl p-4 transition-all hover:bg-slate-900/60 group"
                >
                  <p className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors capitalize" style={{ fontFamily: 'var(--font-heading)' }}>
                    {s.straat.replace(/-/g, ' ')}
                  </p>
                  <p className="text-xs font-mono mt-1 text-slate-500">
                    {s.wijk.replace(/-/g, ' ')}
                  </p>
                </a>
              ))}
            </div>
            <a
              href={`/${p.provincie}/${p.stad}/${p.wijk}`}
              data-analytics-event="pseo_second_click"
              data-analytics-label={`straat-uplink-footer:${p.wijk}`}
              className="inline-flex items-center gap-2 mt-4 text-sm text-slate-400 hover:text-amber-300 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Bekijk alle straten in {p.wijk.replace(/-/g, ' ')}
            </a>
          </div>
        </section>
      )}
      {/* Kennisbank interne links — identiek patroon als wijk-pagina */}
      <section className="py-10 px-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-slate-500 text-xs uppercase tracking-wider mb-4">Lees ook in de Kennisbank</p>
          <div className="flex flex-wrap gap-3">
            {(page.netcongestieStatus === 'ROOD'
              ? [
                  { slug: 'wat-is-salderen', titel: 'Wat is salderen?' },
                  { slug: 'einde-salderen-2027-uitleg', titel: 'Einde salderen 2027' },
                  { slug: 'netcongestie-problemen-nederland', titel: 'Netcongestie in Nederland' },
                ]
              : [
                  { slug: 'wat-is-salderen', titel: 'Wat is salderen?' },
                  { slug: 'einde-salderen-2027-uitleg', titel: 'Einde salderen 2027' },
                  { slug: 'thuisbatterij-saldering-alternatief', titel: 'Thuisbatterij als alternatief' },
                ]
            ).map(link => (
              <a key={link.slug} href={`/kennisbank/${link.slug}`}
                className="flex items-center gap-1.5 text-slate-400 hover:text-amber-300 transition-colors text-sm border border-white/10 rounded-lg px-3 py-2 hover:border-amber-500/30">
                {link.titel}
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
