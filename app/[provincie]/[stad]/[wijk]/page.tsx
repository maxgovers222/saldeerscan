import { cache } from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWijkPage, getTopWijken, getWijkenByStad, getTopStratenByWijk } from '@/lib/pseo'
import { buildWijkMetadata } from '@/lib/pseo-metadata'
import {
  computeBesparing,
  computeVerlies,
  netcongestieNarrative,
  renovatieIntelligence,
  resolveWijkScore,
  scoreLabel,
} from '@/lib/pseo-variation'
import { LocalSchema } from '@/components/pseo/LocalSchema'
import { PseoConversionCard } from '@/components/pseo/PseoConversionCard'
import { PseoHero } from '@/components/pseo/PseoHero'
import { PseoPageShell } from '@/components/pseo/PseoPageShell'
import { PseoStatusBadge, type PseoStatus } from '@/components/pseo/PseoStatusBadge'
import { WijkSaldeerChart } from '@/components/pseo/WijkSaldeerChart'
import { RenovatieInsightCard } from '@/components/pseo/RenovatieInsightCard'
import { WijkComparisonTable, buildWijkComparisonRows } from '@/components/pseo/WijkComparisonTable'
import { CountdownTimer } from '@/components/CountdownTimer'
import { WijkCtaButton } from '@/components/pseo/WijkCtaButton'
import { buildCheckHref } from '@/lib/conversion-context'
import { getWijkCtrTemplate } from '@/lib/pseo-ctr'

const getCachedWijkPage = cache(getWijkPage)

export const revalidate = 604800

type Params = { provincie: string; stad: string; wijk: string }

export async function generateStaticParams() {
  try {
    const wijken = await getTopWijken(2000)
    return wijken.map(w => ({ provincie: w.provincie, stad: w.stad, wijk: w.wijk }))
  } catch { return [] }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { provincie, stad, wijk } = await params
  const page = await getCachedWijkPage({ provincie, stad, wijk })
  return buildWijkMetadata({
    provincie,
    stad,
    wijk,
    titel: page?.titel ?? null,
    gemBouwjaar: page?.gemBouwjaar ?? null,
    gemHealthScore: page?.gemHealthScore ?? null,
    netcongestieStatus: page?.netcongestieStatus ?? null,
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDisplay(slug: string) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function toStatus(status: string | null): PseoStatus | undefined {
  return status === 'ROOD' || status === 'ORANJE' || status === 'GROEN'
    ? status
    : undefined
}

function renderBold(text: string) {
  const parts = text.split('**')
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="font-semibold text-ink">{part}</strong>
      : part
  )
}

function neighborhoodRanking(bouwjaar: number | null, score: number): { top: boolean; label: string } | null {
  if (!bouwjaar) return null
  const rendementScore = bouwjaar >= 1995 && bouwjaar <= 2015 ? 92 : score
  if (rendementScore >= 90) return { top: true, label: 'Top 10% meest rendabele wijken' }
  if (rendementScore >= 74) return { top: true, label: 'Top 25% meest rendabele wijken' }
  return null
}

function splitContent(tekst: string | null): { analyse: string[]; netwerk: string[] } {
  if (!tekst) return { analyse: [], netwerk: [] }
  const paras = tekst.split('\n\n').filter(Boolean)
  const mid = Math.ceil(paras.length / 2)
  return { analyse: paras.slice(0, mid), netwerk: paras.slice(mid) }
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function WijkPage({ params }: { params: Promise<Params> }) {
  const { provincie, stad, wijk } = await params
  const [page, wijkenInStad, topStraten] = await Promise.all([
    getCachedWijkPage({ provincie, stad, wijk }),
    getWijkenByStad(provincie, stad),
    getTopStratenByWijk(provincie, stad, wijk, 8),
  ])
  if (!page) notFound()
  const relatedWijken = wijkenInStad.filter(w => w.wijk !== wijk).slice(0, 18)

  const wijkDisplay = toDisplay(wijk)
  const stadDisplay = toDisplay(stad)
  const ctrTemplate = getWijkCtrTemplate({ provincie, stad, wijk })
  const checkHref = buildCheckHref({
    landingPath: `/${provincie}/${stad}/${wijk}`,
    pseoLevel: 'wijk',
    provincie,
    stad,
    wijk,
  })
  const score = resolveWijkScore(page.gemBouwjaar, page.gemHealthScore)
  const { label: scorelabel } = scoreLabel(score)
  const besparing = computeBesparing(page.gemBouwjaar, score)
  // Indicatief verschil vanaf 2027 op basis van het standaardprofiel.
  const verlies = computeVerlies(page.gemBouwjaar, score)
  const ranking = neighborhoodRanking(page.gemBouwjaar, score)
  const { analyse, netwerk } = splitContent(page.hoofdtekst)
  const renovatieContent = renovatieIntelligence(page.gemBouwjaar, wijkDisplay)
  const comparisonRows = buildWijkComparisonRows(
    wijkenInStad.filter(w => w.wijk !== wijk).slice(0, 6),
    (slug) => `/${provincie}/${stad}/${slug}`,
    toDisplay,
  )

  const netNarrative = netcongestieNarrative(page.netcongestieStatus, wijkDisplay)
  const netConfig = {
    ROOD:   { cls: 'border-danger/25 bg-danger/10 text-ink' },
    ORANJE: { cls: 'border-warning/25 bg-warning/10 text-ink' },
    GROEN:  { cls: 'border-trust/25 bg-trust/10 text-trust-dark' },
  }
  const netStatus = toStatus(page.netcongestieStatus)

  const placeSchema = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: `${wijkDisplay}, ${stadDisplay}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: stadDisplay,
      addressRegion: toDisplay(provincie),
      addressCountry: 'NL',
    },
  }

  return (
    <PseoPageShell headerContext={`${wijkDisplay}, ${stadDisplay}`} ctaHref={checkHref}>
      {page.jsonLd && Object.keys(page.jsonLd).length > 0 && <LocalSchema jsonLd={page.jsonLd} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(placeSchema).replace(/<\/script>/g, '<\\/script>') }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://saldeerscan.nl' },
          { '@type': 'ListItem', position: 2, name: toDisplay(provincie), item: `https://saldeerscan.nl/${provincie}` },
          { '@type': 'ListItem', position: 3, name: stadDisplay, item: `https://saldeerscan.nl/${provincie}/${stad}` },
          { '@type': 'ListItem', position: 4, name: wijkDisplay, item: `https://saldeerscan.nl/${provincie}/${stad}/${wijk}` },
        ],
      }).replace(/<\/script>/g, '<\\/script>') }} />

      <PseoHero
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: toDisplay(provincie), href: `/${provincie}` },
          { name: stadDisplay, href: `/${provincie}/${stad}` },
          { name: wijkDisplay },
        ]}
        eyebrow={`${stadDisplay} · Wijkanalyse 2027`}
        title={ctrTemplate?.h1 ?? wijkDisplay}
        summary={
          ctrTemplate?.heroSummary
          ?? `Wat stoppen met salderen betekent voor woningen in ${wijkDisplay}, gebaseerd op lokale woningdata en netdruk.`
        }
        badge={netStatus || ranking ? (
          <div className="flex flex-wrap items-center gap-3">
            {netStatus && <PseoStatusBadge status={netStatus} />}
            {ranking && (
              <span className="rounded-lg border border-action/30 bg-action/10 px-2.5 py-1 text-xs font-semibold text-action">
                {ranking.label} in {stadDisplay}
              </span>
            )}
          </div>
        ) : undefined}
        metrics={[
          { label: 'Energiescore', value: `${score}/100`, note: scorelabel },
          { label: 'Gem. bouwjaar', value: page.gemBouwjaar ? String(page.gemBouwjaar) : '—' },
          { label: 'Mogelijke besparing', value: `€${besparing}/jaar`, tone: 'trust' },
        ]}
      />

      <PseoConversionCard
        context={{
          landingPath: `/${provincie}/${stad}/${wijk}`,
          pseoLevel: 'wijk',
          provincie,
          stad,
          wijk,
        }}
        title={`Wat betekent 2027 voor uw woning in ${wijkDisplay}?`}
        description="De wijkcijfers zijn een gemiddelde. Vul uw adres in voor uw woningkenmerken, verwachte impact en beste vervolgstap."
        placeholder={`Uw adres in ${wijkDisplay}`}
      />

      <section className="bg-mist px-6 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="mb-3 font-heading text-xs font-semibold uppercase tracking-widest text-trust-dark">
              2027 Urgentie
            </p>
            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Besparing per jaar<br />in {wijkDisplay}
            </h2>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-paper p-6 shadow-sm sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <p className="mb-1 font-heading text-xs font-semibold uppercase tracking-widest text-trust-dark">Einde salderen</p>
                <h3 className="font-heading text-lg font-extrabold tracking-tight text-ink">
                  Wat verandert er in {wijkDisplay}?
                </h3>
              </div>
              <div className="shrink-0 rounded-xl border border-danger/25 bg-paper px-4 py-3 text-right">
                <p className="mb-0.5 font-heading text-xs font-semibold uppercase tracking-widest text-danger">Geraamd verschil 2027</p>
                <p className="font-heading text-xl font-extrabold text-danger">
                  −€{verlies}<span className="text-xs font-normal">/jaar</span>
                </p>
              </div>
            </div>

            <WijkSaldeerChart besparing={besparing} wijk={wijkDisplay} />

            <div className="mt-4 flex items-start gap-2 rounded-xl border border-warning/25 bg-warning/10 px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="mt-0.5 shrink-0 text-warning">
                <path d="M9 1.5L4 9h5L6 14.5l7-8.5H8z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
              </svg>
              <p className="text-sm leading-relaxed text-ink-muted">
                <span className="font-bold text-ink">Indicatie vanaf 2027:</span>{' '}
                geraamd verschil in jaarwaarde in {wijkDisplay}: <span className="font-bold text-ink">€{verlies} per jaar</span>. De uitkomst hangt af van uw eigen verbruik, leverancierstarieven en installatie.
              </p>
            </div>

            <div className="mt-8 rounded-2xl bg-evergreen-900 px-4 py-6">
              <CountdownTimer />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2-koloms content ────────────────────────────────────── */}
      <section className="bg-paper px-6 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="mb-3 font-heading text-xs font-semibold uppercase tracking-widest text-trust-dark">
              Wijkanalyse
            </p>
            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Energieprofiel {wijkDisplay}
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Links: analyse tekst (2/3 breed) */}
            <div className="lg:col-span-2 space-y-6">
              {analyse.length > 0 && (
                <div className="rounded-2xl border border-trust/20 bg-trust/5 p-6 sm:p-7">
                  <p className="mb-2 font-heading text-xs font-semibold uppercase tracking-widest text-trust-dark">
                    Bouwtechnische analyse
                  </p>
                  <h3 className="mb-5 font-heading text-lg font-extrabold tracking-tight text-ink">
                    Woningkenmerken &amp; zonnepotentieel
                  </h3>
                  <div className="space-y-4">
                    {analyse.map((para, i) => (
                      <p key={i} className="text-sm leading-relaxed text-ink-muted">{renderBold(para)}</p>
                    ))}
                  </div>
                </div>
              )}

              {netwerk.length > 0 && (
                <div className="rounded-2xl border border-trust/20 bg-trust/5 p-6 sm:p-7">
                  <p className="mb-2 font-heading text-xs font-semibold uppercase tracking-widest text-trust-dark">
                    Netwerkbeperkingen
                  </p>
                  <h3 className="mb-5 font-heading text-lg font-extrabold tracking-tight text-ink">
                    Netcapaciteit &amp; batterijopties
                  </h3>
                  <div className="space-y-4">
                    {netwerk.map((para, i) => (
                      <p key={i} className="text-sm leading-relaxed text-ink-muted">{renderBold(para)}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Renovatie-Intelligence ──────────────────────── */}
              {renovatieContent && (
                <RenovatieInsightCard titel={renovatieContent.titel} tekst={renovatieContent.tekst} />
              )}
            </div>

            {/* Rechts: Quick Facts */}
            <div>
              <div className="sticky top-20 rounded-2xl border border-ink/10 bg-mist p-5">
                <p className="mb-4 font-heading text-xs font-semibold uppercase tracking-widest text-trust-dark">
                  Quick Facts — {wijkDisplay}
                </p>

                <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  {[
                    { label: 'Gem. bouwjaar', value: page.gemBouwjaar ? `${page.gemBouwjaar}` : '—', sub: 'BAG registratie' },
                    { label: 'Energy Score', value: `${score}/100`, sub: scorelabel },
                    { label: 'Est. besparing', value: `€${besparing}/jr`, sub: 'indicatief met saldering t/m 2026' },
                    { label: 'Verschil 2027', value: `−€${verlies}/jr`, sub: 'indicatief na einde salderen', danger: true },
                    { label: 'Netcongestie', value: page.netcongestieStatus ?? '—', sub: netNarrative.label ?? '' },
                    ...(page.aantalWoningen ? [{ label: 'Woningen', value: `${page.aantalWoningen.toLocaleString('nl')}`, sub: 'in dit postcodegebied' }] : []),
                    ...(ranking ? [{ label: 'Wijk Ranking', value: ranking.top ? 'Top 10%' : 'Top 25%', sub: 'rendement in ' + stadDisplay }] : []),
                  ].map(({ label, value, sub, danger }) => (
                    <div key={label} className="rounded-xl border border-ink/10 bg-paper p-3">
                      <dt className="text-xs font-semibold text-ink-muted">{label}</dt>
                      <dd className={`mt-1 font-heading text-sm font-extrabold ${danger ? 'text-danger' : 'text-trust-dark'}`}>
                        {value}
                      </dd>
                      <dd className="mt-0.5 text-xs text-ink-muted">{sub}</dd>
                    </div>
                  ))}
                </dl>

                <WijkCtaButton provincie={provincie} wijk={wijk} stad={stad}
                  className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-trust/30 px-4 text-sm font-semibold text-trust-dark transition hover:border-trust hover:bg-trust/10">
                  Mijn adres scannen →
                </WijkCtaButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      {page.faqItems.length > 0 && (
        <section className="bg-mist px-6 py-16 sm:py-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <p className="mb-3 font-heading text-xs font-semibold uppercase tracking-widest text-trust-dark">
                Veelgestelde vragen
              </p>
              <h2 className="font-heading text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                Alles over zonnepanelen<br />in {wijkDisplay}
              </h2>
            </div>
            <div className="space-y-3">
              {page.faqItems.map((faq, i) => (
                <div key={i} className="rounded-2xl border border-ink/10 bg-paper p-5 sm:p-6">
                  <h3 className="mb-2 font-heading font-bold text-ink">{faq.vraag}</h3>
                  <p className="text-sm leading-relaxed text-ink-muted">{faq.antwoord}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Bottom CTA ──────────────────────────────────────────── */}
      <section className="bg-evergreen-900 px-6 py-16 sm:py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="mb-4 font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Bereken wat {wijkDisplay}<br />
            <span className="text-action">u kunt besparen</span>
          </h2>
          <p className="mb-6 text-base leading-relaxed text-white/65">
            Voer uw adres in voor een analyse op maat met BAG-data, een indicatieve ROI-berekening en lokale netinformatie.
          </p>
          <WijkCtaButton
            provincie={provincie}
            stad={stad}
            wijk={wijk}
            className="inline-flex min-h-11 items-center rounded-xl bg-action px-5 py-3 font-heading text-sm font-bold text-evergreen-950 shadow-[0_12px_32px_rgba(255,176,32,.22)] transition hover:bg-action-hover"
          >
            Ga naar de persoonlijke adrescheck →
          </WijkCtaButton>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-5 text-sm text-white/65">
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              BAG-data
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              AVG-compliant
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Geen account nodig
            </span>
          </div>
        </div>
      </section>

      {/* ── Populaire straten in wijk ───────────────────────────────────────────── */}
      {topStraten.length > 0 && (
        <section
          data-testid="pseo-populaire-straten"
          className="border-t border-ink/10 bg-paper px-6 py-10"
        >
          <div className="max-w-5xl mx-auto">
            <p className="mb-4 text-xs uppercase tracking-wider text-ink-muted">
              Populaire straten in {toDisplay(wijk)}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {topStraten.map((s) => (
                <a
                  key={s.straat}
                  href={`/${provincie}/${stad}/${wijk}/${s.straat}`}
                  data-analytics-event="pseo_second_click"
                  data-analytics-label={`wijk-top-straat:${s.straat}`}
                  className="group rounded-xl border border-ink/10 bg-mist p-3 transition hover:border-trust/40 hover:bg-trust/5"
                >
                  <p className="font-heading text-sm font-bold capitalize text-ink transition-colors group-hover:text-trust-dark">
                    {toDisplay(s.straat)}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}


      {comparisonRows.length > 0 && (
        <section className="bg-mist px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <WijkComparisonTable
              rows={comparisonRows}
              title="Vergelijk met buurwijken"
              stadContextLabel={`Gemiddelde wijkscore in ${stadDisplay} versus uw wijk (${score}/100).`}
            />
          </div>
        </section>
      )}

      {/* ── Andere wijken in stad ───────────────────────────────── */}
      {relatedWijken.length > 0 && (
        <section className="bg-paper px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <p className="mb-2 font-heading text-xs font-semibold uppercase tracking-widest text-trust-dark">
                Interne vergelijking
              </p>
              <h2 className="font-heading text-2xl font-extrabold tracking-tight text-ink">
                Andere wijken in {stadDisplay}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {relatedWijken.map((w) => {
                const ws = resolveWijkScore(w.gem_bouwjaar, w.gem_health_score)
                return (
                  <a key={w.wijk} href={`/${provincie}/${stad}/${w.wijk}`}
                    data-analytics-event="pseo_second_click"
                    data-analytics-label={`wijk-related:${w.wijk}`}
                    className="group rounded-xl border border-ink/10 bg-mist p-4 transition hover:border-trust/40 hover:bg-trust/5">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-heading text-sm font-bold text-ink transition-colors group-hover:text-trust-dark">
                        {toDisplay(w.wijk)}
                      </p>
                      {w.netcongestie_status && netConfig[w.netcongestie_status as keyof typeof netConfig] && (
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${netConfig[w.netcongestie_status as keyof typeof netConfig].cls}`}>
                          {w.netcongestie_status}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 font-mono text-xs text-ink-muted">
                      Score {ws}/100 {w.gem_bouwjaar ? `· ${w.gem_bouwjaar}` : ''}
                    </p>
                  </a>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Kennisbank interne linking ──────────────────────────── */}
      <section className="border-t border-ink/10 bg-mist px-6 py-10">
        <div className="max-w-5xl mx-auto">
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
              <a
                key={link.slug}
                href={`/kennisbank/${link.slug}`}
                className="flex min-h-11 items-center gap-1.5 rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm text-ink-muted transition hover:border-trust/40 hover:text-trust-dark"
              >
                <svg className="size-3.5 shrink-0 text-trust-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {link.titel}
              </a>
            ))}
          </div>
        </div>
      </section>

    </PseoPageShell>
  )
}
