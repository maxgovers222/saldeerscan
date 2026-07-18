'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'
import { LEVERINGSTARIEF, TERUGLEVERTARIEF } from '@/lib/roi'

interface WijkSaldeerChartProps {
  besparing: number
  wijk: string
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{value: number; name: string; color: string}>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-ink/10 bg-paper px-4 py-3 shadow-xl">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-muted">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm font-mono">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-xs text-ink-muted">{entry.name}</span>
          <span className="font-bold ml-auto" style={{ color: entry.color }}>
            {entry.value > 0 ? `€${entry.value}` : '€0'}
          </span>
        </div>
      ))}
    </div>
  )
}

export function WijkSaldeerChart({ besparing, wijk }: WijkSaldeerChartProps) {
  const terugleverWaarde = TERUGLEVERTARIEF / LEVERINGSTARIEF
  const zonderBatterijNa2027 = Math.round(besparing * (0.30 + 0.70 * terugleverWaarde))
  const metBatterijNa2027 = Math.round(besparing * (0.70 + 0.30 * terugleverWaarde))
  const data = [
    { jaar: '2024', zonderBatterij: besparing, metBatterij: besparing },
    { jaar: '2025', zonderBatterij: besparing, metBatterij: besparing },
    { jaar: '2026', zonderBatterij: besparing, metBatterij: besparing },
    { jaar: '2027', zonderBatterij: zonderBatterijNa2027, metBatterij: metBatterijNa2027 },
    { jaar: '2028', zonderBatterij: zonderBatterijNa2027, metBatterij: metBatterijNa2027 },
  ]

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="actionGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-action)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--color-action)" stopOpacity={0.0} />
          </linearGradient>
          <linearGradient id="trustGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-trust)" stopOpacity={0.15} />
            <stop offset="95%" stopColor="var(--color-trust)" stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ink)" strokeOpacity={0.08} />
        <XAxis dataKey="jaar" tick={{ fill: 'var(--color-ink-muted)', fontSize: 11, fontFamily: 'ui-monospace' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fill: 'var(--color-ink-muted)', fontSize: 10, fontFamily: 'ui-monospace' }}
          axisLine={false} tickLine={false}
          tickFormatter={(v: number) => `€${v}`}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine x="2027" stroke="var(--color-action)" strokeDasharray="4 4" label={{ value: '2027 →', fill: 'var(--color-action)', fontSize: 10, fontFamily: 'ui-monospace' }} />
        <Area
          type="monotone" dataKey="metBatterij" name="Met batterij"
          stroke="var(--color-trust)" strokeWidth={2} fill="url(#trustGrad)"
        />
        <Area
          type="monotone" dataKey="zonderBatterij" name={`Zonder batterij (${wijk})`}
          stroke="var(--color-action)" strokeWidth={2.5} fill="url(#actionGrad)"
        />
        <Legend
          wrapperStyle={{ fontSize: '10px', fontFamily: 'ui-monospace', color: 'var(--color-ink-muted)', paddingTop: '8px' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
