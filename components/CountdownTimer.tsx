'use client'

import { useEffect, useState } from 'react'

const TARGET = new Date('2027-01-01T00:00:00+01:00').getTime()

function calc() {
  const diff = TARGET - Date.now()
  if (diff <= 0) return null
  const d = Math.floor(diff / 86_400_000)
  const h = Math.floor((diff % 86_400_000) / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const s = Math.floor((diff % 60_000) / 1_000)
  return { d, h, m, s }
}

const UNITS = [
  { key: 'd', label: 'Dagen' },
  { key: 'h', label: 'Uren' },
  { key: 'm', label: 'Min' },
  { key: 's', label: 'Sec' },
] as const

export function CountdownTimer({ compact = false }: { compact?: boolean }) {
  const [time, setTime] = useState<{ d: number; h: number; m: number; s: number } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTime(calc())
    const id = setInterval(() => setTime(calc()), 1_000)
    return () => clearInterval(id)
  }, [])

  if (compact) {
    const days = mounted && time ? time.d : '--'
    return (
      <p className="text-center font-mono text-xs text-white/70">
        Nog{' '}
        <span className="font-bold text-action">
          {typeof days === 'number' ? days : days}
        </span>
        {' '}dagen — saldering eindigt 1 jan 2027
      </p>
    )
  }

  return (
    <div className="text-center">
      <p className="mb-3 font-mono text-xs uppercase tracking-widest text-white/70">
        Salderingsregeling eindigt over
      </p>
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        {UNITS.map(({ key, label }) => {
          const val = mounted && time ? time[key] : '--'
          const display = typeof val === 'number' ? String(val).padStart(2, '0') : val
          return (
            <div
              key={key}
              className="flex min-w-[58px] flex-col items-center rounded-xl border border-white/10 bg-evergreen-950 px-3 py-3 sm:min-w-[68px]"
            >
              <span className="font-mono text-2xl font-black leading-none tabular-nums text-action sm:text-3xl">
                {display}
              </span>
              <span className="mt-1.5 font-mono text-[10px] uppercase tracking-widest text-white/70">
                {label}
              </span>
            </div>
          )
        })}
      </div>
      <p className="mt-3 font-mono text-xs text-white/70">
        Per 1 januari 2027 daalt uw opbrengst van 28% naar 0%
      </p>
    </div>
  )
}
