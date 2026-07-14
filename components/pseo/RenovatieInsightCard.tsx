import type { ReactNode } from 'react'

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
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <strong key={index} className="font-semibold text-white">
        {part}
      </strong>
    ) : (
      part
    ),
  )
}

/** Server-safe renovatieblok met action-accent en leesbare klantcopy. */
export function RenovatieInsightCard({ titel, tekst, footerHint, className = '' }: Props) {
  return (
    <div className={`min-w-0 rounded-2xl border border-action/25 bg-action/10 p-6 sm:p-7 ${className}`}>
      <div className="mb-3 flex items-center gap-2 text-action">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M9 1.5L4 9h5L6 14.5l7-8.5H8z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
        <p className="text-xs font-semibold uppercase tracking-widest">Renovatie-inzicht</p>
      </div>
      <h3 className="mb-4 break-words text-lg font-bold text-white">{titel}</h3>
      <p className="break-words text-base leading-7 text-white/65">{renderBold(tekst)}</p>
      <div className="mt-4 flex items-start gap-2 border-t border-action/15 pt-4 text-action">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="mt-0.5 shrink-0">
          <path
            d="M8 1l1.5 4.5H14l-3.7 2.7 1.4 4.3L8 10l-3.7 2.5 1.4-4.3L2 5.5h4.5z"
            fill="currentColor"
            fillOpacity="0.35"
            stroke="currentColor"
            strokeWidth="0.8"
          />
        </svg>
        <p className="break-words text-sm">
          {footerHint ??
            'Wilt u weten wat uw specifieke woning doet? Start de gratis analyse — inclusief renovatie-correctie op basis van uw feitelijke situatie.'}
        </p>
      </div>
    </div>
  )
}
