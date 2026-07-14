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
      ? <strong key={i} className="text-white font-semibold">{part}</strong>
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

// ── Palette & shared styles ───────────────────────────────────────────────────

const G     = '#00aa65'
const AMBER = '#f59e0b'
const N1    = '#020617'
const N2    = '#0f172a'

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
  // Verlies = terugleveringsvoordeel dat wegvalt na 2027 (~40% van besparing)
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
    ROOD:   { cls: 'bg-red-950/50 border-red-700 text-red-400' },
    ORANJE: { cls: 'bg-amber-950/50 border-amber-700 text-amber-400' },
    GROEN:  { cls: 'bg-emerald-950/50 border-emerald-700 text-emerald-400' },
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
        title={wijkDisplay}
        summary={`Wat stoppen met salderen betekent voor woningen in ${wijkDisplay}, gebaseerd op lokale woningdata en netdruk.`}
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

      <section className="py-20 px-6" style={{ background: N2 }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: G, fontFamily: 'var(--font-heading)' }}>
              2027 Urgentie
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
              Besparing per jaar<br />in {wijkDisplay}
            </h2>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: G, fontFamily: 'var(--font-heading)' }}>Salderingsafbouw</p>
                <h3 className="text-lg font-extrabold text-white" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
                  Wat kost wachten u in {wijkDisplay}?
                </h3>
              </div>
              <div className="bg-red-950/50 border border-red-700/60 rounded-xl px-4 py-3 shrink-0 text-right">
                <p className="text-xs font-semibold uppercase tracking-widest text-red-400/70 mb-0.5" style={{ fontFamily: 'var(--font-heading)' }}>Verlies vanaf 2027</p>
                <p className="text-xl font-extrabold text-red-400" style={{ fontFamily: 'var(--font-heading)' }}>
                  −€{verlies}<span className="text-xs font-normal text-red-400/60">/jaar</span>
                </p>
              </div>
            </div>

            <WijkSaldeerChart besparing={besparing} wijk={wijkDisplay} />

            <div className="mt-4 flex items-start gap-2 bg-amber-950/30 border border-amber-700/40 rounded-xl px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="text-amber-400 shrink-0 mt-0.5">
                <path d="M9 1.5L4 9h5L6 14.5l7-8.5H8z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
              </svg>
              <p className="text-sm text-amber-300/80 leading-relaxed">
                <span className="font-bold text-amber-400">Shock 2027:</span>{' '}
                Verlies door saldering in {wijkDisplay}: <span className="font-bold text-amber-400">€{verlies} per jaar</span> vanaf 1 januari 2027 voor woningen zonder batterijopslag.
              </p>
            </div>

            <div className="mt-8">
              <CountdownTimer />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2-koloms content ────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: N1 }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: G, fontFamily: 'var(--font-heading)' }}>
              Wijkanalyse
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
              Energieprofiel {wijkDisplay}
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Links: analyse tekst (2/3 breed) */}
            <div className="lg:col-span-2 space-y-6">
              {analyse.length > 0 && (
                <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-7 transition-all hover:border-white/20">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: G, fontFamily: 'var(--font-heading)' }}>
                    Bouwtechnische analyse
                  </p>
                  <h3 className="font-extrabold text-lg mb-5 text-white" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}>
                    Woningkenmerken &amp; zonnepotentieel
                  </h3>
                  <div className="space-y-4">
                    {analyse.map((para, i) => (
                      <p key={i} className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{renderBold(para)}</p>
                    ))}
                  </div>
                </div>
              )}

              {netwerk.length > 0 && (
                <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-7 transition-all hover:border-white/20">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: G, fontFamily: 'var(--font-heading)' }}>
                    Netwerkbeperkingen
                  </p>
                  <h3 className="font-extrabold text-lg mb-5 text-white" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}>
                    Netcapaciteit &amp; batterijopties
                  </h3>
                  <div className="space-y-4">
                    {netwerk.map((para, i) => (
                      <p key={i} className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{renderBold(para)}</p>
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
              <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-5 sticky top-20">
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: G, fontFamily: 'var(--font-heading)' }}>
                  Quick Facts — {wijkDisplay}
                </p>

                <div className="space-y-3">
                  {[
                    { label: 'Gem. bouwjaar', value: page.gemBouwjaar ? `${page.gemBouwjaar}` : '—', sub: 'BAG registratie' },
                    { label: 'Energy Score', value: `${score}/100`, sub: scorelabel },
                    { label: 'Est. besparing', value: `€${besparing}/jr`, sub: 'zonder batterij, 2024' },
                    { label: 'Verlies 2027', value: `−€${verlies}/jr`, sub: 'bij 0% saldering', danger: true },
                    { label: 'Netcongestie', value: page.netcongestieStatus ?? '—', sub: netNarrative.label ?? '' },
                    ...(page.aantalWoningen ? [{ label: 'Woningen', value: `${page.aantalWoningen.toLocaleString('nl')}`, sub: 'in dit postcodegebied' }] : []),
                    ...(ranking ? [{ label: 'Wijk Ranking', value: ranking.top ? 'Top 10%' : 'Top 25%', sub: 'rendement in ' + stadDisplay }] : []),
                  ].map(({ label, value, sub, danger }) => (
                    <div key={label} className="flex items-start justify-between gap-2 pb-3 border-b border-white/5 last:border-0 last:pb-0">
                      <div>
                        <p className="text-xs font-semibold text-white/50">{label}</p>
                        <p className="text-xs text-white/25">{sub}</p>
                      </div>
                      <span className={`text-sm font-extrabold shrink-0 ${danger ? 'text-red-400' : 'text-amber-400'}`}
                        style={{ fontFamily: 'var(--font-heading)' }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <WijkCtaButton provincie={provincie} wijk={wijk} stad={stad}
                  className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-white/60 underline decoration-white/20 underline-offset-4 transition hover:text-white">
                  Mijn adres scannen →
                </WijkCtaButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      {page.faqItems.length > 0 && (
        <section className="py-20 px-6" style={{ background: N2 }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: G, fontFamily: 'var(--font-heading)' }}>
                Veelgestelde vragen
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
                Alles over zonnepanelen<br />in {wijkDisplay}
              </h2>
            </div>
            <div className="space-y-3">
              {page.faqItems.map((faq, i) => (
                <div key={i} className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-5 sm:p-6 transition-all hover:border-white/20">
                  <h3 className="font-bold text-white mb-2" style={{ fontFamily: 'var(--font-heading)' }}>{faq.vraag}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{faq.antwoord}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Bottom CTA ──────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: N1 }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 text-white" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
            Bereken wat {wijkDisplay}<br />
            <span style={{ color: AMBER }}>u kunt besparen</span>
          </h2>
          <p className="mb-6 text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Voer uw adres in voor een analyse op maat — BAG-data, ROI-berekening en ISDE subsidie check in 3 minuten.
          </p>
          <WijkCtaButton
            provincie={provincie}
            stad={stad}
            wijk={wijk}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-white/65 underline decoration-white/25 underline-offset-4 transition hover:text-white"
          >
            Ga naar de persoonlijke adrescheck →
          </WijkCtaButton>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-5 text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>
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
          className="py-10 px-6 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="max-w-5xl mx-auto">
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-4">
              Populaire straten in {toDisplay(wijk)}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {topStraten.map((s) => (
                <a
                  key={s.straat}
                  href={`/${provincie}/${stad}/${wijk}/${s.straat}`}
                  data-analytics-event="pseo_second_click"
                  data-analytics-label={`wijk-top-straat:${s.straat}`}
                  className="bg-slate-900/40 border border-white/10 hover:border-white/20 rounded-xl p-3 transition-all hover:bg-slate-900/60 group"
                >
                  <p className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors capitalize" style={{ fontFamily: 'var(--font-heading)' }}>
                    {toDisplay(s.straat)}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}


      {comparisonRows.length > 0 && (
        <section className="py-16 px-6" style={{ background: N1 }}>
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
        <section className="py-16 px-6" style={{ background: N2 }}>
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: G, fontFamily: 'var(--font-heading)' }}>
                Interne vergelijking
              </p>
              <h2 className="text-2xl font-extrabold text-white" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
                Andere wijken in {stadDisplay}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {relatedWijken.map((w) => {
                const ws = resolveWijkScore(w.gem_bouwjaar, w.gem_health_score)
                const net = w.netcongestie_status ? netConfig[w.netcongestie_status as keyof typeof netConfig] : null
                return (
                  <a key={w.wijk} href={`/${provincie}/${stad}/${w.wijk}`}
                    data-analytics-event="pseo_second_click"
                    data-analytics-label={`wijk-related:${w.wijk}`}
                    className="bg-slate-900/40 border border-white/10 hover:border-white/20 rounded-xl p-4 transition-all hover:bg-slate-900/60 group">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors" style={{ fontFamily: 'var(--font-heading)' }}>
                        {toDisplay(w.wijk)}
                      </p>
                      {w.netcongestie_status && netConfig[w.netcongestie_status as keyof typeof netConfig] && (
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${netConfig[w.netcongestie_status as keyof typeof netConfig].cls}`}>
                          {w.netcongestie_status}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
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
      <section className="py-10 px-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-5xl mx-auto">
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
              <a
                key={link.slug}
                href={`/kennisbank/${link.slug}`}
                className="flex items-center gap-1.5 text-slate-400 hover:text-amber-300 transition-colors text-sm border border-white/10 rounded-lg px-3 py-2 hover:border-amber-500/30"
              >
                <svg className="w-3.5 h-3.5 text-amber-500/60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
