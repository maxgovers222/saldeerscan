import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getStaddenByProvincie, getProvincieHubStats, getUrgentWijkenByProvincie } from '@/lib/pseo'
import {
  buildBreadcrumbListLd,
  buildHubCollectionLd,
  hubBreadcrumbItems,
  toDisplaySlug,
} from '@/lib/pseo-hubs'
import { ALL_PROVINCIE_SLUGS, buildHubMetadata, provincieDisplaySlug } from '@/lib/pseo-metadata'
import { buildCheckHref } from '@/lib/conversion-context'

export const revalidate = 604800

type Params = { provincie: string }

export async function generateStaticParams() {
  return ALL_PROVINCIE_SLUGS.map(provincie => ({ provincie }))
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { provincie } = await params
  const provincieSummary = await getProvincieHubStats(provincie)
  return buildHubMetadata({ kind: 'provincie', provincie, provincieSummary })
}

const N1 = '#020617'
const AMBER = '#f59e0b'
const G = '#00aa65'

const NET_CONFIG = {
  ROOD:   { label: 'Vol',   dot: '#ef4444', cls: 'bg-red-950/50 border-red-700/60 text-red-400' },
  ORANJE: { label: 'Druk',  dot: '#f59e0b', cls: 'bg-amber-950/50 border-amber-700/60 text-amber-400' },
  GROEN:  { label: 'Vrij',  dot: '#10b981', cls: 'bg-emerald-950/50 border-emerald-700/60 text-emerald-400' },
}

const amberBtnCls = [
  'bg-amber-500 text-slate-950 font-bold rounded-full',
  'transition-all duration-300',
  'shadow-[0_0_25px_rgba(245,158,11,0.4)]',
  'hover:opacity-90 active:scale-105',
].join(' ')

export default async function ProvincePage({ params }: { params: Promise<Params> }) {
  const { provincie } = await params
  if (!ALL_PROVINCIE_SLUGS.includes(provincie)) notFound()

  const [stads, urgentWijken] = await Promise.all([
    getStaddenByProvincie(provincie),
    getUrgentWijkenByProvincie(provincie, 12),
  ])
  if (stads.length === 0) notFound()

  const provLabel = provincieDisplaySlug(provincie)
  const totalWoningen = stads.reduce((s, c) => s + c.totalWoningen, 0)
  const checkHref = buildCheckHref({
    landingPath: `/${provincie}`,
    pseoLevel: 'provincie',
    provincie,
  })

  const hubChildren = stads.map(s => ({
    name: `Zonnepanelen ${toDisplaySlug(s.stad)} — 2027 Saldeercheck`,
    url: `/${provincie}/${s.stad}`,
  }))
  const jsonLd = buildHubCollectionLd({
    name: `Zonnepanelen ${provLabel} — 2027 Saldeercheck`,
    description: `Overzicht per stad in ${provLabel} voor de 2027 salderingsimpact op zonnepanelen.`,
    url: `/${provincie}`,
    children: hubChildren,
  })

  const breadcrumbLd = buildBreadcrumbListLd(hubBreadcrumbItems({ provincie }))

  return (
    <div className="min-h-screen pb-20" style={{ background: N1 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: G }}>
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path d="M9 2L15.5 6V13L9 17L2.5 13V6L9 2Z" fill="white" fillOpacity="0.25" stroke="white" strokeWidth="1.3" strokeLinejoin="round"/>
                <path d="M9 6.5L12 8.5V12L9 14L6 12V8.5L9 6.5Z" fill="white"/>
              </svg>
            </div>
            <span className="font-bold text-[#0e352e] tracking-tight text-lg" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
              SaldeerScan<span style={{ color: G }}>.nl</span>
            </span>
          </a>
          <a href={checkHref} className="text-sm font-bold px-5 py-2.5 rounded-full bg-amber-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:brightness-110 transition-all">
            Gratis analyseren
          </a>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-6 pt-6">
        <p className="text-xs font-mono text-white/30">
          <a href="/" className="hover:text-white/60 transition-colors">Home</a>
          {' · '}
          <span className="text-white/50">{provLabel}</span>
        </p>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-10 pb-12">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
        }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(245,158,11,0.06)' }} />

        <div className="relative max-w-5xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: AMBER, fontFamily: 'var(--font-sans)' }}>
            Zonnepanelen per regio
          </p>
          <h1 className="font-black text-white mb-2 leading-none"
            style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.2rem, 6vw, 3.8rem)', letterSpacing: '-0.03em' }}>
            Zonnepanelen {provLabel}
          </h1>
          <p className="text-base mb-8 font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {stads.length} steden · {totalWoningen > 0 ? `${Math.round(totalWoningen / 1000)}k+ woningen` : 'alle wijken'} · 2027 impact
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl mx-auto">
            <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center">
              <p className="text-[9px] font-mono uppercase tracking-widest text-white/30 mb-1">Steden</p>
              <p className="text-2xl font-black font-mono" style={{ color: AMBER }}>{stads.length}</p>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center">
              <p className="text-[9px] font-mono uppercase tracking-widest text-white/30 mb-1">Woningen</p>
              <p className="text-2xl font-black font-mono" style={{ color: AMBER }}>
                {totalWoningen > 0 ? `${Math.round(totalWoningen / 1000)}k` : '—'}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center">
              <p className="text-[9px] font-mono uppercase tracking-widest text-white/30 mb-1">Deadline</p>
              <p className="text-lg font-black font-mono text-red-400">1 jan 2027</p>
            </div>
          </div>
        </div>
      </section>

      {urgentWijken.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 pt-4 pb-8">
          <div className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-500/70 mb-1" style={{ fontFamily: 'var(--font-sans)' }}>
              Focus 2027
            </p>
            <h2 className="text-lg font-extrabold text-white" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
              Meest urgente wijken in {provLabel}
            </h2>
            <p className="text-xs font-sans text-white/40 mt-1 max-w-2xl">
              Wijken met de zwaarste netdruk en hoogst geschat verlies na afbouw saldering — spring direct naar de wijkanalyse.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {urgentWijken.map(w => {
              const net = w.netcongestie_status ? NET_CONFIG[w.netcongestie_status as keyof typeof NET_CONFIG] : null
              const stadSlug = (w as { stad: string }).stad
              return (
                <a
                  key={`${provincie}-${stadSlug}-${w.wijk}`}
                  href={`/${provincie}/${stadSlug}/${w.wijk}`}
                  data-analytics-event="pseo_second_click"
                  data-analytics-label={`prov-urgent:${stadSlug}:${w.wijk}`}
                  className="group rounded-2xl border border-amber-500/25 bg-amber-950/15 px-4 py-4 hover:border-amber-500/45 hover:bg-amber-950/25 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-bold text-white text-sm group-hover:text-amber-300 transition-colors" style={{ fontFamily: 'var(--font-heading)' }}>
                      {toDisplaySlug(w.wijk)}
                    </span>
                    {net && (
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${net.cls}`}>
                        {w.netcongestie_status}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-mono text-white/35">
                    {toDisplaySlug(stadSlug)} · score {w.gem_health_score ?? '—'}/100
                    {w.gem_bouwjaar ? ` · bouwjaar ${w.gem_bouwjaar}` : ''}
                  </p>
                </a>
              )
            })}
          </div>
        </section>
      )}

      <section className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1" style={{ fontFamily: 'var(--font-sans)' }}>Steden</p>
          <h2 className="text-xl font-extrabold text-white" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
            Alle steden in {provLabel}
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {stads.map((s) => (
            <a
              key={s.stad}
              href={`/${provincie}/${s.stad}`}
              data-analytics-event="pseo_second_click"
              data-analytics-label={`prov-stad:${s.stad}`}
              className="group bg-slate-900/40 border border-white/10 rounded-2xl p-5 hover:border-amber-500/30 hover:bg-slate-900/60 transition-all duration-200"
            >
              <h3 className="font-bold text-white text-base mb-1 group-hover:text-amber-400 transition-colors"
                style={{ fontFamily: 'var(--font-heading)' }}>
                {toDisplaySlug(s.stad)}
              </h3>
              {s.totalWoningen > 0 && (
                <p className="text-xs font-mono text-white/35">
                  {s.totalWoningen.toLocaleString('nl-NL')} woningen
                </p>
              )}
              <p className="mt-3 text-[10px] font-mono text-amber-500/60 group-hover:text-amber-400 transition-colors">
                Bekijk wijken →
              </p>
            </a>
          ))}
        </div>
      </section>

      {/* Andere provincies */}
      <section className="max-w-5xl mx-auto px-6 pb-6">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-3" style={{ fontFamily: 'var(--font-sans)' }}>Andere provincies</p>
        <div className="flex flex-wrap gap-2">
          {ALL_PROVINCIE_SLUGS.filter(p => p !== provincie).map(p => (
            <a key={p} href={`/${p}`}
              data-analytics-event="pseo_second_click"
              data-analytics-label={`prov-other:${p}`}
              className="text-xs font-mono px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-all">
              {provincieDisplaySlug(p)}
            </a>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 pb-10">
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-extrabold text-white mb-2" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
            Uw woning in {provLabel} analyseren?
          </h2>
          <p className="text-sm mb-5 max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Gratis AI-scan op basis van BAG-data. ROI-berekening en 2027 impact in 3 minuten.
          </p>
          <a href={checkHref}
            data-analytics-event="pseo_check_cta"
            data-analytics-label={`prov-cta:${provincie}`}
            className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-full bg-amber-500 text-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.45)] hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] transition-all text-sm"
            style={{ fontFamily: 'var(--font-heading)' }}>
            Start gratis Saldeercheck
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </section>

      <footer className="py-12 px-6" style={{ background: N1, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: G }}>
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                    <path d="M9 2L15.5 6V13L9 17L2.5 13V6L9 2Z" fill="white" fillOpacity="0.25" stroke="white" strokeWidth="1.3" strokeLinejoin="round" />
                    <path d="M9 6.5L12 8.5V12L9 14L6 12V8.5L9 6.5Z" fill="white" />
                  </svg>
                </div>
                <span className="font-bold text-white text-base" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
                  SaldeerScan.nl
                </span>
              </div>
              <p className="text-sm max-w-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Gratis energieanalyse voor Nederlandse woningeigenaren.
              </p>
            </div>
            <a href={checkHref} className={`text-sm px-6 py-3 ${amberBtnCls}`}>
              Gratis analyseren
            </a>
          </div>
          <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            <div className="flex gap-6 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
              <a href="/privacy" className="hover:text-white/50 transition-colors">Privacyverklaring</a>
              <a href={checkHref} className="hover:text-white/50 transition-colors">Analyseer uw woning</a>
            </div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.15)' }}>© {new Date().getFullYear()} SaldeerScan.nl</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
