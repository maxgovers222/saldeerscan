'use client'

import type { ReactNode, CSSProperties } from 'react'
import { trackEvent } from '@/lib/analytics'

interface WijkCtaButtonProps {
  wijk: string
  stad: string
  provincie?: string
  children: ReactNode
  className?: string
  style?: CSSProperties
}

export function WijkCtaButton({ provincie, wijk, stad, children, className, style }: WijkCtaButtonProps) {
  const context = {
    landingPath: provincie
      ? `/${provincie}/${stad}/${wijk}`
      : `/${stad}/${wijk}`,
    pseoLevel: 'wijk' as const,
    provincie,
    stad,
    wijk,
  }

  return (
    <a
      href="#adrescheck"
      className={className}
      style={style}
      onClick={() => trackEvent('pseo_check_cta', {
        pseo_level: 'wijk',
        provincie: provincie ?? '',
        stad,
        wijk,
        landing_path: context.landingPath,
      })}
    >
      {children}
    </a>
  )
}
