'use client'

import { useEffect, useState } from 'react'

export function SocialProofTicker() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/stats', { signal: controller.signal })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then((data: { count?: number }) => setCount(
        typeof data.count === 'number' ? data.count : null,
      ))
      .catch(() => {})
    return () => controller.abort()
  }, [])

  if (count === null || count < 25) return null
  const rounded = Math.floor(count / 10) * 10

  return (
    <p className="text-sm text-white/60" aria-label={`${rounded} of meer analyses uitgevoerd`}>
      <strong className="font-mono text-trust">{rounded}+</strong> analyses uitgevoerd
    </p>
  )
}
