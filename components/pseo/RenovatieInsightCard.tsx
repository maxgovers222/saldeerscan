import type { ReactNode } from 'react'

const AMBER = '#f59e0b'

type Props = {
  titel: string
  /** Gebruik **dubbele sterren** rond woorden voor nadruk (zelfde patroon als wijk-pagina). */
  tekst: string
  /** Footerregel onder de card; default CTA-hint */
  footerHint?: ReactNode
  className?: string
}

function renderBold(text: string) {
  const parts = text.split('**')
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-white">
        {part}
      </strong>
    ) : (
      part
    )
  )
}

/**
 * Server-safe renovatie-blok — zelfde visuele taal als de wijk-pagina (amber rand, donkere fill).
 */
export function RenovatieInsightCard({ titel, tekst, footerHint, className = '' }: Props) {
  return (
    <div
      className={`rounded-2xl p-6 sm:p-7 border ${className}`}
      style={{
        background: 'rgba(28,18,8,0.55)',
        borderColor: 'rgba(245,158,11,0.25)',
      }}
    >
      <div className="mb-3 flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M9 1.5L4 9h5L6 14.5l7-8.5H8z"
            stroke={AMBER}
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: AMBER, fontFamily: 'var(--font-heading)' }}
        >
          Renovatie-Inzicht
        </p>
      </div>
      <h3
        className="mb-4 text-base font-extrabold text-white"
        style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}
      >
        {titel}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
        {renderBold(tekst)}
      </p>
      <div
        className="mt-4 flex items-start gap-2 border-t pt-4"
        style={{ borderColor: 'rgba(245,158,11,0.15)' }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="mt-0.5 shrink-0">
          <path
            d="M8 1l1.5 4.5H14l-3.7 2.7 1.4 4.3L8 10l-3.7 2.5 1.4-4.3L2 5.5h4.5z"
            fill="rgba(245,158,11,0.4)"
            stroke={AMBER}
            strokeWidth="0.8"
          />
        </svg>
        <p className="text-xs" style={{ color: 'rgba(245,158,11,0.7)' }}>
          {footerHint ??
            'Wilt u weten wat uw specifieke woning doet? Start de gratis analyse — inclusief renovatie-correctie op basis van uw feitelijke situatie.'}
        </p>
      </div>
    </div>
  )
}
