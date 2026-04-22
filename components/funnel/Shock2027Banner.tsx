'use client'

import type { ShockEffect2027 } from './types'

interface Shock2027BannerProps {
  shock: ShockEffect2027
  besparingNu: number
}

export function Shock2027Banner({ shock, besparingNu }: Shock2027BannerProps) {
  const jaar = new Date().getFullYear()
  const pct = jaar <= 2025 ? 64 : jaar === 2026 ? 28 : 0

  return (
    <div className="rounded-xl border border-amber-500/25 bg-amber-950/20 p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1" style={{ fontFamily: 'var(--font-sans)' }}>
            Besparing nu ({jaar})
          </p>
          <p className="font-mono font-bold text-amber-400 text-xl">
            €{besparingNu.toLocaleString('nl-NL')}<span className="text-xs text-white/30">/jaar</span>
          </p>
          <p className="text-[10px] text-white/30 mt-0.5" style={{ fontFamily: 'var(--font-sans)' }}>Saldering: {pct}%</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1" style={{ fontFamily: 'var(--font-sans)' }}>
            Verlies vanaf 2027
          </p>
          <p className="font-mono font-bold text-red-400 text-xl">
            −€{shock.jaarlijksVerlies.toLocaleString('nl-NL')}<span className="text-xs text-white/30">/jaar</span>
          </p>
          <p className="text-[10px] text-white/30 mt-0.5" style={{ fontFamily: 'var(--font-sans)' }}>Saldering: 0%</p>
        </div>
      </div>

      <div className="h-px bg-white/8" />

      <div className="flex items-start gap-2.5">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="text-amber-400 shrink-0 mt-0.5">
          <path d="M8 2L1 14h14L8 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
          <path d="M8 6v4M8 11.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        <div>
          <p className="text-sm text-amber-300/80 leading-relaxed" style={{ fontFamily: 'var(--font-sans)' }}>
            Elke maand wachten kost u{' '}
            <span className="text-amber-400 font-bold">€{shock.maandelijksVerlies.toLocaleString('nl-NL')}</span> extra.{' '}
            Cumulatief verlies over 5 jaar:{' '}
            <span className="text-amber-400 font-bold">€{shock.cumulatiefVerlies5Jaar.toLocaleString('nl-NL')}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
