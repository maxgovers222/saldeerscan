import { cache } from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPseoPage, getTopPseoPages, getStratenByWijk, getWijkPage } from '@/lib/pseo'
import { LocalSchema } from '@/components/pseo/LocalSchema'
import { PseoConversionCard } from '@/components/pseo/PseoConversionCard'
import { PseoHero } from '@/components/pseo/PseoHero'
import { PseoPageShell } from '@/components/pseo/PseoPageShell'
import { PseoStatusBadge, type PseoStatus } from '@/components/pseo/PseoStatusBadge'
import { RenovatieInsightCard } from '@/components/pseo/RenovatieInsightCard'
import { renovatieIntelligence, straatVsWijkDelta } from '@/lib/pseo-variation'

// Deduplicate Supabase fetches: generateMetadata + page component share one request
const getCachedPseoPage = cache(getPseoPage)

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDisplay(slug: string) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function toStatus(status: string | null): PseoStatus | undefined {
  return status === 'ROOD' || status === 'ORANJE' || status === 'GROEN'
    ? status
    : undefined
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
    ROOD: { label: 'Vol stroomnet' },
    ORANJE: { label: 'Druk stroomnet' },
    GROEN: { label: 'Vrij stroomnet' },
  }
  const netStatus = toStatus(page.netcongestieStatus)

  return (
    <PseoPageShell
      headerContext={`${toDisplay(p.straat)}, ${toDisplay(p.stad)}`}
    >
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

      <PseoHero
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: toDisplay(p.provincie), href: `/${p.provincie}` },
          { name: toDisplay(p.stad), href: `/${p.provincie}/${p.stad}` },
          {
            name: toDisplay(p.wijk),
            href: `/${p.provincie}/${p.stad}/${p.wijk}`,
          },
          { name: toDisplay(p.straat) },
        ]}
        eyebrow={`${toDisplay(p.wijk)} · Straatanalyse 2027`}
        title={page.titel ?? `Zonnepanelen & batterij op ${toDisplay(p.straat)}`}
        summary={page.metaDescription ?? `Lokale woningdata en 2027-impact voor ${toDisplay(p.straat)} in ${toDisplay(p.stad)}.`}
        badge={netStatus ? (
          <PseoStatusBadge
            status={netStatus}
            label={netBadge[netStatus].label}
          />
        ) : undefined}
        metrics={[
          {
            label: 'Gem. bouwjaar',
            value: page.gemBouwjaar ? String(page.gemBouwjaar) : '—',
          },
          {
            label: 'Energiescore',
            value: page.gemHealthScore ? `${page.gemHealthScore}/100` : '—',
            note: healthLabel ?? undefined,
          },
          {
            label: 'Woningen',
            value: page.aantalWoningen ? String(page.aantalWoningen) : '—',
          },
        ]}
      />

      <PseoConversionCard
        context={{
          landingPath: `/${p.provincie}/${p.stad}/${p.wijk}/${p.straat}`,
          pseoLevel: 'straat',
          provincie: p.provincie,
          stad: p.stad,
          wijk: p.wijk,
          straat: p.straat,
        }}
        title={`Uw woning aan ${toDisplay(p.straat)} controleren`}
        description="Vul uw huisnummer en adres in voor uw eigen woningdata en 2027-impact."
        placeholder={`${toDisplay(p.straat)} en huisnummer`}
      />

      <div className="bg-paper text-ink">
      {straatDelta && (
        <section className="px-4 pb-8 max-w-4xl mx-auto">
          <div className="rounded-2xl border border-trust/25 bg-trust/5 p-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-trust-dark">Straat vs wijk</p>
            <p className="mb-4 text-sm leading-relaxed text-ink-muted">{straatDelta.samenvatting}</p>
            <p className="font-mono text-xs text-ink-muted">
              Score {straatDelta.streetScore}/100 op straatniveau · wijkgemiddelde {straatDelta.parentWijkScore}/100
              {straatDelta.deltaBouwjaar != null && (
                <span> · bouwjaarverschil {straatDelta.deltaBouwjaar > 0 ? '+' : ''}{straatDelta.deltaBouwjaar} jaar t.o.v. wijk</span>
              )}
            </p>
            <a
              href={`/${p.provincie}/${p.stad}/${p.wijk}`}
              data-analytics-event="pseo_second_click"
              data-analytics-label={`straat-uplink:${p.wijk}`}
              className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-trust-dark hover:text-trust"
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
          <div className="max-w-none">
            {page.hoofdtekst.split('\n\n').map((para, i) => (
              <p key={i} className="mb-4 leading-relaxed text-ink-muted">{para}</p>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      {page.faqItems.length > 0 && (
        <section className="px-4 pb-16 max-w-4xl mx-auto">
          <h2 className="mb-6 font-heading text-2xl font-bold text-ink">Veelgestelde vragen</h2>
          <div className="space-y-4">
            {page.faqItems.map((faq, i) => (
              <div key={i} className="rounded-2xl border border-ink/10 bg-mist p-5">
                <h3 className="mb-2 font-semibold text-ink">{faq.vraag}</h3>
                <p className="text-sm leading-relaxed text-ink-muted">{faq.antwoord}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      {/* Andere straten in wijk */}
      {andereStraten.length > 0 && (
        <section className="px-4 pb-16 max-w-4xl mx-auto">
          <div className="border-t border-ink/10 pt-10">
            <p className="mb-4 text-xs uppercase tracking-wider text-ink-muted">
              Andere straten in {p.wijk.replace(/-/g, ' ')}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {andereStraten.map((s) => (
                <a
                  key={s.straat}
                  href={`/${s.provincie}/${s.stad}/${s.wijk}/${s.straat}`}
                  data-analytics-event="pseo_second_click"
                  data-analytics-label={`straat-peer:${s.straat}`}
                  className="group rounded-xl border border-ink/10 bg-mist p-4 transition hover:border-trust/40 hover:bg-trust/5"
                >
                  <p className="font-heading text-sm font-bold capitalize text-ink transition-colors group-hover:text-trust-dark">
                    {s.straat.replace(/-/g, ' ')}
                  </p>
                  <p className="mt-1 font-mono text-xs text-ink-muted">
                    {s.wijk.replace(/-/g, ' ')}
                  </p>
                </a>
              ))}
            </div>
            <a
              href={`/${p.provincie}/${p.stad}/${p.wijk}`}
              data-analytics-event="pseo_second_click"
              data-analytics-label={`straat-uplink-footer:${p.wijk}`}
              className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm text-ink-muted transition-colors hover:text-trust-dark"
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
      <section className="border-t border-ink/10 bg-mist px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <p className="mb-4 text-xs uppercase tracking-wider text-ink-muted">Lees ook in de Kennisbank</p>
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
                className="flex min-h-11 items-center gap-1.5 rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm text-ink-muted transition hover:border-trust/40 hover:text-trust-dark">
                {link.titel}
              </a>
            ))}
          </div>
        </div>
      </section>
      </div>
    </PseoPageShell>
  )
}
