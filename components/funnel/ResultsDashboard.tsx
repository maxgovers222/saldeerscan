'use client'

import { memo, useEffect, useRef, useState } from 'react'
import type { FunnelState } from './types'
import { PDFDownloadButton } from './PDFDownloadButton'
import { parseStoredRoi } from '@/lib/roi-result-guard'

const ReferralButtons = memo(function ReferralButtons({ stad }: { stad?: string }) {
  const [copied, setCopied] = useState(false)
  const waUrl = `https://saldeerscan.nl/check?ref=buur&utm_source=referral&utm_medium=whatsapp`
  const copyUrl = `https://saldeerscan.nl/check?ref=buur&utm_source=referral&utm_medium=copy`
  const stadLabel = stad ? stad.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Nederland'
  const waText = encodeURIComponent(`Ik heb net mijn huis laten scannen voor de 2027 salderingswijziging via SaldeerScan.nl. Jij loopt hetzelfde risico in ${stadLabel}! Doe hier de gratis check: ${waUrl}`)

  function handleCopy() {
    const done = () => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
    navigator.clipboard.writeText(copyUrl).then(done).catch(() => {
      try {
        const ta = document.createElement('textarea')
        ta.value = copyUrl
        ta.setAttribute('readonly', '')
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        const ok = document.execCommand('copy')
        document.body.removeChild(ta)
        if (ok) done()
      } catch {
        /* geen clipboard in deze context */
      }
    })
  }

  return (
    <div className="flex gap-3 flex-wrap">
      <a
        href={`https://wa.me/?text=${waText}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-colors"
        style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', color: '#25d366' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.115 1.532 5.836L.057 23.927l6.256-1.641A11.93 11.93 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.793 9.793 0 01-5.003-1.373l-.358-.214-3.718.975.993-3.62-.234-.372A9.786 9.786 0 012.182 12C2.182 6.573 6.573 2.182 12 2.182S21.818 6.573 21.818 12 17.427 21.818 12 21.818z"/>
        </svg>
        Deel via WhatsApp
      </a>
      <button
        type="button"
        data-testid="referral-copy-link"
        onClick={handleCopy}
        className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono transition-colors"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: copied ? '#34d399' : 'rgba(255,255,255,0.5)' }}
      >
        {copied ? (
          <><svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8l4 4 8-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>Gekopieerd!</>
        ) : (
          <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>Kopieer link</>
        )}
      </button>
    </div>
  )
})

/**
 * Rendert bewust maar één van de twee report-varianten (niet beide + CSS hidden) —
 * anders staan er twee identieke koppen/knoppen in de DOM, wat strict-mode
 * Playwright-locators en screenreaders in de war brengt. Start als mobiel (SSR-veilig,
 * zelfde patroon als CountdownTimer) en corrigeert na mount naar de echte breakpoint.
 */
function useIsDesktopViewport(breakpointPx = 768): boolean {
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${breakpointPx}px)`)
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [breakpointPx])
  return isDesktop
}

function useCountUp(target: number, duration = 1400): number {
  const [val, setVal] = useState(0)
  const raf = useRef<number>(0)
  useEffect(() => {
    if (target === 0) return
    const start = performance.now()
    const tick = (now: number) => {
      const pct = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - pct, 3)
      setVal(Math.round(eased * target))
      if (pct < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])
  return val
}

function ShockChart({ besparing }: { besparing: number }) {
  const years = [
    { year: '2024', pct: 100, label: '100%', color: '#34d399' },
    { year: '2025', pct: 64,  label: '64%',  color: '#fbbf24' },
    { year: '2026', pct: 28,  label: '28%',  color: '#fb923c' },
    { year: '2027', pct: 0,   label: '0%',   color: '#f87171' },
  ]
  const [animated, setAnimated] = useState(false)
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 200); return () => clearTimeout(t) }, [])

  return (
    <div className="space-y-3 min-w-0">
      {years.map(({ year, pct, label, color }) => (
        <div key={year} className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-mono text-white/40 w-10 shrink-0">{year}</span>
          <div className="flex-1 min-w-0 bg-slate-800/60 rounded-full h-5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: animated ? `${Math.max(pct, 2)}%` : '0%',
                background: color,
                transitionDelay: `${years.findIndex(y => y.year === year) * 150}ms`,
              }}
            />
          </div>
          <span className="text-xs font-mono w-10 shrink-0 text-right" style={{ color }}>{label}</span>
          <span className="text-xs font-mono text-white/40 w-24 shrink-0 hidden sm:block text-right">
            {pct > 0 ? `€${Math.round(besparing * pct / 100).toLocaleString('nl-NL')}/jr` : '€0/jr'}
          </span>
        </div>
      ))}
    </div>
  )
}

function ROITijdlijn({ terugverdien, besparing }: { terugverdien: number; besparing: number }) {
  const startYear = new Date().getFullYear()
  const milestones = [
    { jaar: startYear, label: 'Installatie', kleur: '#fbbf24', icon: (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M9 1.5L4 9h5L6 14.5l7-8.5H8z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
    )},
    { jaar: startYear + Math.round(terugverdien / 2), label: 'Halverwege', kleur: '#fb923c', icon: (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M1.5 11l4-4 3 3 5.5-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M10.5 4h4v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
    )},
    { jaar: startYear + Math.round(terugverdien), label: 'Terugverdiend', kleur: '#34d399', icon: (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.5 8l3.5 3.5 7.5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    )},
    { jaar: startYear + 15, label: '15 jaar winst', kleur: '#34d399', icon: (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1.5l1.6 3.9 4.4.4-3.2 3 .9 4.3L8 10.8l-3.7 2.3.9-4.3L2 5.8l4.4-.4z"/></svg>
    )},
  ]

  return (
    <div className="relative min-w-0">
      <div className="absolute top-5 left-5 right-5 h-px bg-white/10" />
      <div className="relative flex justify-between gap-0.5">
        {milestones.map((m, i) => (
          <div key={i} className="flex flex-col items-center gap-2.5 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center z-10 bg-slate-900 shrink-0"
              style={{ borderColor: m.kleur, color: m.kleur }}>
              {m.icon}
            </div>
            <div className="text-center min-w-0 px-0.5">
              <p className="text-xs font-bold font-mono" style={{ color: m.kleur }}>{m.jaar}</p>
              <p className="text-[10px] text-white/50 leading-tight mt-0.5" style={{ fontFamily: 'var(--font-sans)' }}>{m.label}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 bg-emerald-950/30 border border-emerald-700/30 rounded-xl px-4 py-3 text-center">
        <p className="text-xs text-emerald-400" style={{ fontFamily: 'var(--font-sans)' }}>
          Na {terugverdien} jaar verdient u <strong>€{Math.round(besparing * (15 - terugverdien)).toLocaleString('nl-NL')}</strong> netto winst over 15 jaar
        </p>
      </div>
    </div>
  )
}

function GevalideerdStempel() {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 800); return () => clearTimeout(t) }, [])
  return (
    <div className={`inline-flex transition-all duration-500 ${visible ? 'opacity-100 scale-100 rotate-3' : 'opacity-0 scale-50 rotate-0'}`}>
      <div className="bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border-2 border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.4)] flex items-center gap-0.5">
        <svg width="10" height="10" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Gevalideerd 2027
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest mb-1 text-white/40" style={{ fontFamily: 'var(--font-sans)' }}>
      {children}
    </p>
  )
}

const cardCls = 'bg-slate-900/40 border border-white/10 rounded-2xl p-5 sm:p-6 min-w-0'

function AlertBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 bg-amber-950/20 border border-amber-500/25 rounded-xl">
      <p className="text-sm font-sans text-amber-300/80 leading-relaxed">{children}</p>
    </div>
  )
}

function ReportAlerts({ state }: { state: FunnelState }) {
  return (
    <>
      {state.is_eigenaar === false && (
        <AlertBanner>
          <strong className="text-amber-300">Let op: u heeft aangegeven huurder te zijn.</strong>{' '}
          Overleg eerst met uw verhuurder of woningcorporatie — wij sturen uw rapport ter informatie.
          Zonnepanelen zijn in huurwoningen steeds vaker mogelijk.
        </AlertBanner>
      )}
      {state.netcongestie?.status === 'ROOD' && (
        <AlertBanner>
          <strong className="text-amber-300">Netcongestie in uw wijk.</strong>{' '}
          Uw terugleving kan beperkt zijn door netcapaciteitstekort.
          Een thuisbatterij is extra waardevol — u slaat overdag op wat u &apos;s avonds gebruikt.
        </AlertBanner>
      )}
    </>
  )
}

function WatGebeurtErNu() {
  return (
    <div className={cardCls}>
      <p className="text-xs font-semibold text-amber-400 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Wat gebeurt er nu?</p>
      <div className="space-y-4">
        {[
          { dot: 'amber', label: 'Uw aanvraag is geregistreerd', timing: 'nu' },
          { dot: 'amber', label: 'Een adviseur neemt naar aanleiding van uw aanvraag contact met u op', timing: '' },
          { dot: 'green', label: 'Vrijblijvende offerte op maat', timing: '' },
        ].map(({ dot, label, timing }, i) => (
          <div key={i} className="flex items-start gap-3 min-w-0">
            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 animate-pulse ${dot === 'amber' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            <div className="flex-1 flex items-baseline justify-between gap-2 min-w-0">
              <span className="text-sm text-white/70 font-sans leading-snug">{label}</span>
              <span className={`text-[10px] font-mono shrink-0 ${dot === 'amber' ? 'text-amber-400' : 'text-emerald-400'}`}>{timing}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] font-mono text-white/20 mt-4">
        Nog geen contact ontvangen? Mail ons: info@saldeerscan.nl
      </p>
    </div>
  )
}

interface ReportMetrics {
  score: number
  heeftPanelen: boolean
  huidigePanelenAantal: number | null
  batterijInvestering: number
  batterijMeerBesparing: number
  besparing: number
  verlies: number
  terugverdien: number
  investering: number
  animBesparing: number
  animVerlies: number
  animScore: number
}

function useReportMetrics(state: FunnelState, roi: NonNullable<ReturnType<typeof parseStoredRoi>>): ReportMetrics {
  const score = state.healthScore?.score ?? 0
  const heeftPanelen = state.heeft_panelen === true
  const huidigePanelenAantal = state.huidige_panelen_aantal
  const batterijInvestering = Math.max(
    roi.scenarioMetBatterij.investeringEur - roi.scenarioNu.investeringEur,
    0
  )
  const batterijMeerBesparing = Math.max(
    roi.scenarioMetBatterij.besparingJaarEur - roi.scenarioNu.besparingJaarEur,
    0
  )
  const besparing = heeftPanelen
    ? roi.scenarioMetBatterij.besparingJaarEur
    : roi.scenarioNu.besparingJaarEur
  const verlies = roi.shockEffect2027.jaarlijksVerlies
  const terugverdien = heeftPanelen
    ? (batterijMeerBesparing > 0 ? Math.round((batterijInvestering / batterijMeerBesparing) * 10) / 10 : 99)
    : (roi.scenarioNu.terugverdientijdJaar ?? 8)
  const investering = roi.scenarioNu.investeringEur

  const animBesparing = useCountUp(besparing, 1600)
  const animVerlies   = useCountUp(verlies, 1800)
  const animScore     = useCountUp(score, 1200)

  return {
    score, heeftPanelen, huidigePanelenAantal, batterijInvestering, batterijMeerBesparing,
    besparing, verlies, terugverdien, investering, animBesparing, animVerlies, animScore,
  }
}

/** Mobiel: compacte samenvatting — het volledige rapport (grafieken, tabellen) staat in e-mail + PDF, niet knus op een klein scherm. */
function ReportMobileSummary({ state, roi, metrics }: {
  state: FunnelState
  roi: NonNullable<ReturnType<typeof parseStoredRoi>>
  metrics: ReportMetrics
}) {
  const { animVerlies, animBesparing, animScore, heeftPanelen, terugverdien } = metrics
  const emailStatus = state.reportModel?.delivery.emailStatus ?? 'pending'
  const emailSummary = emailStatus === 'sent'
    ? 'Uw volledige analyse staat in uw e-mail. Download hieronder het PDF-rapport voor alle grafieken en details.'
    : emailStatus === 'failed'
      ? 'De e-mail kon niet worden verstuurd. Uw volledige analyse en PDF-rapport staan hieronder klaar.'
      : 'Uw volledige analyse en PDF-rapport staan hieronder klaar.'

  return (
    <div className="space-y-5 min-w-0 px-4 py-6" data-testid="report-mobile-summary">
      <div className="text-center pb-1">
        <div className="w-14 h-14 bg-emerald-950/30 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path d="M6 16l6 6L26 8" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-xs text-white/40 mb-0.5" style={{ fontFamily: 'var(--font-sans)' }}>Persoonlijk investeringsrapport</p>
        <h2 className="text-xl font-black text-white" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
          Uw SaldeerScan rapport
        </h2>
        <p className="text-sm text-white/50 mt-2 font-sans leading-relaxed">
          {emailSummary}
        </p>
      </div>

      <ReportAlerts state={state} />

      {state.adres && (
        <div className="bg-slate-900/40 border border-white/8 rounded-xl px-4 py-3 min-w-0">
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5" style={{ fontFamily: 'var(--font-sans)' }}>Adres</p>
          <p className="text-sm font-mono text-white/80 break-words">{state.adres}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        <div className={`${cardCls} text-center`}>
          <p className="text-[10px] text-amber-400/70 uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-sans)' }}>Verlies per jaar vanaf 2027</p>
          <p className="text-3xl font-black font-mono text-amber-400" data-testid="report-annual-loss">−€{animVerlies.toLocaleString('nl-NL')}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className={`${cardCls} text-center`}>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-sans)' }}>Besparing/jaar</p>
            <p className="text-lg font-black font-mono text-amber-400">€{animBesparing.toLocaleString('nl-NL')}</p>
          </div>
          <div className={`${cardCls} text-center`}>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-sans)' }}>Energie score</p>
            <p className="text-lg font-black font-mono" style={{ color: metrics.score >= 70 ? '#34d399' : metrics.score >= 50 ? '#fbbf24' : '#f87171' }}>
              {animScore}/100
            </p>
          </div>
        </div>
        <div className={cardCls}>
          <p className="text-xs text-white/50 font-sans leading-relaxed">
            {heeftPanelen
              ? <>Met uw bestaande panelen en een thuisbatterij is de terugverdientijd circa <strong className="text-white/80">{terugverdien} jaar</strong>.</>
              : <>Met {roi.aantalPanelen} panelen is de terugverdientijd circa <strong className="text-white/80">{terugverdien} jaar</strong>.</>}
            {' '}Alle grafieken, tijdlijnen en aanbevelingen staan in uw PDF-rapport.
          </p>
        </div>
      </div>

      <PDFDownloadButton state={state} />

      <WatGebeurtErNu />

      <div className={cardCls}>
        <p className="text-xs font-semibold text-amber-400 mb-1" style={{ fontFamily: 'var(--font-heading)' }}>Uw buur mist dit misschien ook</p>
        <p className="text-sm text-white/50 mb-4 font-sans">
          Stuur de check door aan uw buren{state.stad ? ` in ${state.stad.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}` : ''}.
        </p>
        <ReferralButtons stad={state.stad} />
      </div>

      <p className="text-[10px] text-white/20 text-center pb-1" style={{ fontFamily: 'var(--font-sans)' }}>
        © 2026 SaldeerScan.nl · Rapport gegenereerd op {new Date().toLocaleDateString('nl-NL')}
      </p>
    </div>
  )
}

/** Desktop: volledig rapport, donker thema, brede layout. */
function ReportDesktopFull({ state, roi, metrics }: {
  state: FunnelState
  roi: NonNullable<ReturnType<typeof parseStoredRoi>>
  metrics: ReportMetrics
}) {
  const {
    score, heeftPanelen, huidigePanelenAantal, batterijInvestering, batterijMeerBesparing,
    besparing, verlies, terugverdien, investering, animBesparing, animVerlies, animScore,
  } = metrics
  const emailSent = state.reportModel?.delivery.emailStatus === 'sent'

  return (
    <div className="space-y-6 min-w-0 px-6 sm:px-10 py-8" data-testid="report-desktop-full">
      <ReportAlerts state={state} />

      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-white/40 mb-0.5" style={{ fontFamily: 'var(--font-sans)' }}>Persoonlijk investeringsrapport</p>
          <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
            Uw SaldeerScan rapport
          </h2>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 13l4 4L19 7" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {state.adres && (
        <div className="bg-slate-900/40 border border-white/8 rounded-xl px-4 py-3 min-w-0">
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5" style={{ fontFamily: 'var(--font-sans)' }}>Adres</p>
          <p className="text-sm font-mono text-white/80">{state.adres}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${cardCls} border-amber-500/20`}>
          <SectionLabel>Impact 2027</SectionLabel>
          <h3 className="text-base font-bold mb-5 text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            Jaarlijks saldeer-verlies na 1 januari 2027
          </h3>

          <div className="text-center mb-6">
            <div className="text-5xl font-black font-mono mb-1.5 text-amber-400" data-testid="report-annual-loss">
              −€{animVerlies.toLocaleString('nl-NL')}
            </div>
            <p className="text-xs text-white/40" style={{ fontFamily: 'var(--font-sans)' }}>per jaar · vanaf 1 januari 2027</p>
          </div>

          <ShockChart besparing={besparing} />

          <div className="mt-4 bg-red-950/30 border border-red-700/30 rounded-xl px-4 py-3 flex items-start gap-2.5">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="text-red-400 shrink-0 mt-0.5">
              <path d="M8 2L1 14h14L8 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
              <path d="M8 6v4M8 11.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <p className="text-xs text-red-300/90" style={{ fontFamily: 'var(--font-sans)' }}>
              {Math.abs(verlies) < 1 ? (
                <>Op basis van uw invoer is het berekende 2027-effect in deze bandbreedte minimaal. Het advies blijft wel: voorbereiden op einde saldering (2027).</>
              ) : heeftPanelen ? (
                <>Zonder thuisbatterij bouwt u over 5 jaar ongeveer <strong className="text-red-200">€{(verlies * 5).toLocaleString('nl-NL')}</strong> minder voordeel op t.o.v. tijdig handelen (op basis van deze scan).</>
              ) : (
                <>Zonder actie bouwt u over 5 jaar ongeveer <strong className="text-red-200">€{(verlies * 5).toLocaleString('nl-NL')}</strong> minder voordeel op t.o.v. tijdig handelen (op basis van deze scan).</>
              )}
            </p>
          </div>
        </div>

        <div className={`${cardCls} border-emerald-500/20 relative`}>
          <div className="flex justify-end mb-3">
            <GevalideerdStempel />
          </div>
          <SectionLabel>Geadviseerde configuratie</SectionLabel>
          <h3 className="text-base font-bold mb-5 text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            {heeftPanelen ? 'Uw optimale optimalisatie (bestaande panelen)' : 'Uw optimale opstelling'}
          </h3>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-amber-950/20 border border-amber-500/25 rounded-xl p-4 min-w-0">
              <p className="text-[10px] text-amber-400/80 uppercase tracking-widest mb-1.5" style={{ fontFamily: 'var(--font-sans)' }}>
                {heeftPanelen ? 'Bestaande zonnepanelen' : 'Zonnepanelen'}
              </p>
              <p className="text-2xl font-black font-mono text-amber-400">{heeftPanelen ? (huidigePanelenAantal ?? '—') : roi.aantalPanelen}</p>
              <p className="text-[11px] text-white/40 mt-0.5" style={{ fontFamily: 'var(--font-sans)' }}>
                {heeftPanelen
                  ? 'huidige situatie (stap 2)'
                  : `adviesmodel · ${Math.round(roi.aantalPanelen * 0.4)} m²`}
              </p>
            </div>
            <div className="bg-emerald-950/20 border border-emerald-500/25 rounded-xl p-4 min-w-0">
              <p className="text-[10px] text-emerald-400/80 uppercase tracking-widest mb-1.5" style={{ fontFamily: 'var(--font-sans)' }}>Thuisbatterij</p>
              <p className="text-2xl font-black font-mono text-emerald-400">10 kWh</p>
              <p className="text-[11px] text-white/40 mt-0.5" style={{ fontFamily: 'var(--font-sans)' }}>
                {heeftPanelen ? 'primaire investering' : 'aanbevolen uitbreiding'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Besparing/jaar', value: `€${animBesparing.toLocaleString('nl-NL')}`, color: '#fbbf24' },
              { label: heeftPanelen ? 'Batterij investering' : 'Investering', value: (heeftPanelen ? batterijInvestering : investering) > 0 ? `€${(heeftPanelen ? batterijInvestering : investering).toLocaleString('nl-NL')}` : '—', color: '#e2e8f0' },
              { label: 'Energie score', value: `${animScore}/100`, color: score >= 70 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-800/40 border border-white/5 rounded-xl p-3 min-w-0">
                <p className="text-[10px] text-white/40 mb-1" style={{ fontFamily: 'var(--font-sans)' }}>{label}</p>
                <p className="font-bold font-mono text-sm break-words" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>

          {heeftPanelen && (
            <div className="mt-3 bg-emerald-950/20 border border-emerald-500/25 rounded-xl px-4 py-3">
              <p className="text-xs text-emerald-300/90" style={{ fontFamily: 'var(--font-sans)' }}>
                {batterijMeerBesparing > 0 ? (
                  <>Advies: behoud uw zonnepanelen en overweeg een thuisbatterij. Extra besparing door batterij-opslag is ongeveer <strong>€{batterijMeerBesparing.toLocaleString('nl-NL')}/jaar</strong> in dit model.</>
                ) : (
                  <>Advies: met bestaande panelen is optimalisatie (o.a. verbruikstiming / batterij) maatwerk. Vraag een adviseur om een locatiecheck — de extra winst valt sterk per situatie verschillend uit.</>
                )}
              </p>
            </div>
          )}

          {roi.isdeSchatting && roi.isdeSchatting.bedragEur > 0 && (
            <div className="mt-3 bg-amber-950/20 border border-amber-500/15 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] text-amber-400/70 uppercase tracking-widest" style={{ fontFamily: 'var(--font-sans)' }}>ISDE Subsidie</p>
                <p className="text-sm font-bold font-mono text-amber-400">€{roi.isdeSchatting.bedragEur.toLocaleString('nl-NL')}</p>
              </div>
              <p className="text-[11px] text-white/30 text-right" style={{ fontFamily: 'var(--font-sans)' }}>via RVO<br/>subsidieregeling</p>
            </div>
          )}
        </div>
      </div>

      <div className={cardCls}>
        <SectionLabel>Terugverdientijd</SectionLabel>
        <h3 className="text-base font-bold mb-6 text-white" style={{ fontFamily: 'var(--font-heading)' }}>
          ROI tijdlijn
        </h3>
        <ROITijdlijn terugverdien={terugverdien} besparing={besparing} />
      </div>

      <WatGebeurtErNu />

      <div className={cardCls}>
        <p className="text-xs font-semibold text-amber-400 mb-1" style={{ fontFamily: 'var(--font-heading)' }}>Uw buur mist dit misschien ook</p>
        <p className="text-sm text-white/50 mb-4 font-sans">
          Stuur dit rapport door aan uw buren{state.stad ? ` in ${state.stad.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}` : ''} — zij lopen hetzelfde 2027-risico.
        </p>
        <ReferralButtons stad={state.stad} />
      </div>

      <div className="max-w-md">
        <PDFDownloadButton state={state} />
        <p className="text-[10px] text-white/30 text-center mt-3 font-sans">
          {emailSent
            ? 'Download het volledige rapport als PDF — ook verstuurd naar uw e-mail.'
            : 'Download het volledige rapport hieronder als PDF.'}
        </p>
      </div>

      <p className="text-[10px] text-white/20 text-center pb-2" style={{ fontFamily: 'var(--font-sans)' }}>
        © 2026 SaldeerScan.nl · AVG-compliant · Rapport gegenereerd op {new Date().toLocaleDateString('nl-NL')}
      </p>
    </div>
  )
}

export function ResultsDashboard({ state }: { state: FunnelState }) {
  const roi = parseStoredRoi(state.roiResult ?? null)
  if (!roi) {
    return (
      <div className="p-6 sm:p-10 text-center space-y-3">
        <p className="text-sm font-sans text-white/80 leading-relaxed">
          Onvoldoende data om dit rapport te tonen. Start de check opnieuw of open de link uit uw bevestigingsmail opnieuw.
        </p>
      </div>
    )
  }

  const metrics = useReportMetrics(state, roi)
  const isDesktop = useIsDesktopViewport()

  return (
    <div className="min-w-0 overflow-x-hidden" data-testid="report-root">
      {isDesktop
        ? <ReportDesktopFull state={state} roi={roi} metrics={metrics} />
        : <ReportMobileSummary state={state} roi={roi} metrics={metrics} />}
    </div>
  )
}
