'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CountdownTimer } from '@/components/CountdownTimer'
import { FunnelContainer } from '@/components/funnel/FunnelContainer'
import { LandingContextBanner } from '@/components/funnel/LandingContextBanner'
import { parseConversionContext } from '@/lib/conversion-context'

function StatsLine() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => setCount(d.count)).catch(() => {})
  }, [])

  if (!count) return null

  return (
    <p className="mb-4 text-center font-mono text-[10px] text-white/70">
      {count} Nederlanders analyseerden — jij bent op de goede weg
    </p>
  )
}

export function CheckPageClient() {
  const searchParams = useSearchParams()
  const funnelUrlContext = Object.fromEntries(searchParams.entries())
  const context = parseConversionContext(searchParams)

  return (
    <div className="min-w-0 overflow-x-hidden">
      <LandingContextBanner context={context} />
      <div className="mb-4">
        <CountdownTimer compact />
      </div>
      <StatsLine />
      <FunnelContainer urlParams={funnelUrlContext} />
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
