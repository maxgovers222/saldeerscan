'use client'

import { useEffect } from 'react'
import Script from 'next/script'
import { trackEvent } from '@/lib/analytics'

export function Analytics() {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const el = target?.closest<HTMLElement>('[data-analytics-event]')
      if (!el) return
      trackEvent(el.dataset.analyticsEvent ?? 'pseo_click', {
        label: el.dataset.analyticsLabel ?? el.getAttribute('href') ?? 'unknown',
      })
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  if (!id) return null
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${id}');`}
      </Script>
    </>
  )
}
