'use client'

import { trackEvent } from '@/lib/analytics'

interface WijkCtaButtonProps {
  wijk: string
  stad: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function WijkCtaButton({ wijk, stad, children, className, style }: WijkCtaButtonProps) {
  return (
    <a
      href={`/check?wijk=${encodeURIComponent(wijk)}&stad=${encodeURIComponent(stad)}`}
      className={className}
      style={style}
      onClick={() => trackEvent('wijk_cta_click', { wijk, stad })}
    >
      {children}
    </a>
  )
}
