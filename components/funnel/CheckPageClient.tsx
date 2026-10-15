'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CountdownTimer } from '@/components/CountdownTimer'
import { FunnelContainer } from '@/components/funnel/FunnelContainer'
import { LandingContextBanner } from '@/components/funnel/LandingContextBanner'
import { parseConversionContext } from '@/lib/conversion-context'

export function CheckPageClient() {
  const searchParams = useSearchParams()
  const funnelUrlContext = Object.fromEntries(searchParams.entries())
  const context = parseConversionContext(searchParams)
  const [reportReady, setReportReady] = useState(false)
  const reportMode = Boolean(searchParams.get('leadId')) || reportReady

  return (
    <div className="min-w-0 overflow-x-hidden">
      {!reportMode && (
        <>
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-extrabold text-white">
              Uw gratis 2027 Saldeercheck
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/70">Wat verandert er voor uw zonnepanelen als salderen stopt? Vergelijk 2026 en 2027 met uw eigen jaarcijfers en contractkosten. Het gratis rapport vraagt geen telefoonnummer; advies kiest u apart.</p>
            <a href="/methode#examples-heading" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-action underline underline-offset-4">Bekijk eerst een controleerbaar rekenvoorbeeld</a>
          </div>
          <LandingContextBanner context={context} />
          <div className="mb-4">
            <CountdownTimer compact />
          </div>
        </>
      )}
      <FunnelContainer
        urlParams={funnelUrlContext}
        onReportModeChange={setReportReady}
      />
    </div>
  )
}

export function CheckPageFallback() {
  return (
    <div className="min-w-0 py-2 text-center text-sm text-white/70" role="status">
      Check laden…
    </div>
  )
}
