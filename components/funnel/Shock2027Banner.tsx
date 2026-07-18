'use client'

import type { ShockEffect2027 } from './types'

interface Shock2027BannerProps {
  shock: ShockEffect2027
  besparingNu: number
}

export function Shock2027Banner({ shock, besparingNu }: Shock2027BannerProps) {
  const jaar = new Date().getFullYear()
  const pct = jaar <= 2026 ? 100 : 0

  return (
    <aside
      aria-label="Financiële impact vanaf 2027"
      className="space-y-4 rounded-xl border border-warning/25 bg-action/10 p-5"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-widest text-ink-muted" style={{ fontFamily: 'var(--font-sans)' }}>
            Besparing nu ({jaar})
          </p>
          <p className="font-mono text-xl font-bold text-trust-dark">
            €{besparingNu.toLocaleString('nl-NL')}<span className="text-xs text-ink-muted">/jaar</span>
          </p>
          <p className="mt-0.5 text-[10px] text-ink-muted" style={{ fontFamily: 'var(--font-sans)' }}>Saldering: {pct}%</p>
        </div>
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-widest text-ink-muted" style={{ fontFamily: 'var(--font-sans)' }}>
            Verschil vanaf 2027
          </p>
          <p className="font-mono text-xl font-bold text-danger">
            −€{shock.jaarlijksVerlies.toLocaleString('nl-NL')}<span className="text-xs text-ink-muted">/jaar</span>
          </p>
          <p className="mt-0.5 text-[10px] text-ink-muted" style={{ fontFamily: 'var(--font-sans)' }}>Saldering: 0%</p>
        </div>
      </div>

      <div className="h-px bg-ink/10" />

      <div className="flex items-start gap-2.5">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="mt-0.5 shrink-0 text-warning">
          <path d="M8 2L1 14h14L8 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
          <path d="M8 6v4M8 11.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        <div>
          <p className="text-sm leading-relaxed text-ink-muted" style={{ fontFamily: 'var(--font-sans)' }}>
            De geraamde jaarwaarde daalt met{' '}
            <span className="font-bold text-ink">€{shock.maandelijksVerlies.toLocaleString('nl-NL')}</span> per maand.{' '}
            Geraamd verschil over 5 jaar:{' '}
            <span className="font-bold text-ink">€{shock.cumulatiefVerlies5Jaar.toLocaleString('nl-NL')}</span>
          </p>
        </div>
      </div>
    </aside>
  )
}
