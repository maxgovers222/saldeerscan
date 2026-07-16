'use client'

import { useState, useEffect } from 'react'

interface AnalysisLoadingProps {
  wijk?: string
}

export function AnalysisLoading({ wijk }: AnalysisLoadingProps) {
  const berichten = [
    'BAG-data analyseren...',
    `Netcapaciteit ${wijk || 'wijk'} verifiëren...`,
    'ROI-prognose 2027 berekenen...',
  ]

  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex(i => (i + 1) % berichten.length)
        setVisible(true)
      }, 200)
    }, 1100)
    return () => clearInterval(interval)
  }, [berichten.length])

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-10" role="status">
      <div className="relative size-12" aria-hidden="true">
        <div className="absolute inset-0 rounded-full border-2 border-ink/10" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-trust" />
      </div>

      {/* Rotating message */}
      <div className="h-6 flex items-center justify-center" aria-live="polite" aria-atomic="true">
        <p
          className="font-mono text-sm text-ink-muted transition-opacity duration-200"
          style={{ opacity: visible ? 1 : 0 }}
        >
          {berichten[index]}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5" aria-hidden="true">
        {berichten.map((_, i) => (
          <span
            key={i}
            className={`size-1.5 rounded-full transition-colors duration-300 ${i === index ? 'bg-trust' : 'bg-ink/15'}`}
          />
        ))}
      </div>
    </div>
  )
}
