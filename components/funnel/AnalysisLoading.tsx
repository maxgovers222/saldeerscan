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
    <div className="flex flex-col items-center justify-center gap-5 py-10">
      {/* Amber spinner */}
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
        <div className="absolute inset-0 rounded-full border-2 border-t-amber-500 animate-spin" />
      </div>

      {/* Rotating message */}
      <div className="h-6 flex items-center justify-center">
        <p
          className="text-sm font-mono text-slate-600 transition-opacity duration-200"
          style={{ opacity: visible ? 1 : 0 }}
        >
          {berichten[index]}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5">
        {berichten.map((_, i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full transition-colors duration-300"
            style={{ background: i === index ? '#f59e0b' : '#e2e8f0' }}
          />
        ))}
      </div>
    </div>
  )
}
