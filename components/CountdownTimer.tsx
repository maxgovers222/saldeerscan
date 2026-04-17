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
      <p className="text-center text-xs font-mono text-white/40">
        Nog{' '}
        <span className="text-amber-400 font-bold">
          {typeof days === 'number' ? days : days}
        </span>
        {' '}dagen — saldering eindigt 1 jan 2027
      </p>
    )
  }

  return (
    <div className="text-center">
      <p className="text-xs font-mono text-white/40 uppercase tracking-widest mb-3">
        Salderingsregeling eindigt over
      </p>
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        {UNITS.map(({ key, label }) => {
          const val = mounted && time ? time[key] : '--'
          const display = typeof val === 'number' ? String(val).padStart(2, '0') : val
          return (
            <div
              key={key}
              className="flex flex-col items-center bg-slate-900/60 border border-white/10 rounded-xl px-3 py-3 min-w-[58px] sm:min-w-[68px]"
            >
              <span className="font-mono text-2xl sm:text-3xl font-black text-amber-400 tabular-nums leading-none">
                {display}
              </span>
              <span className="text-[10px] text-white/40 tracking-widest uppercase mt-1.5 font-mono">
                {label}
              </span>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-white/30 mt-3 font-mono">
        Per 1 januari 2027 daalt uw opbrengst van 28% naar 0%
      </p>
    </div>
  )
}
