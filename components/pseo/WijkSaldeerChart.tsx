'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'

interface WijkSaldeerChartProps {
  besparing: number
  wijk: string
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{value: number; name: string; color: string}>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm font-mono">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-white/60 text-xs">{entry.name}</span>
          <span className="font-bold ml-auto" style={{ color: entry.color }}>
            {entry.value > 0 ? `€${entry.value}` : '€0'}
          </span>
        </div>
      ))}
    </div>
  )
}

export function WijkSaldeerChart({ besparing, wijk }: WijkSaldeerChartProps) {
  const data = [
    { jaar: '2024', zonderBatterij: besparing, metBatterij: besparing },
    { jaar: '2025', zonderBatterij: Math.round(besparing * 0.64), metBatterij: Math.round(besparing * 0.85) },
    { jaar: '2026', zonderBatterij: Math.round(besparing * 0.28), metBatterij: Math.round(besparing * 0.80) },
    { jaar: '2027', zonderBatterij: 0, metBatterij: Math.round(besparing * 0.72) },
    { jaar: '2028', zonderBatterij: 0, metBatterij: Math.round(besparing * 0.70) },
  ]

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
          </linearGradient>
          <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="jaar" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'ui-monospace' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'ui-monospace' }}
          axisLine={false} tickLine={false}
          tickFormatter={(v: number) => `€${v}`}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine x="2027" stroke="rgba(239,68,68,0.4)" strokeDasharray="4 4" label={{ value: '2027 →', fill: 'rgba(239,68,68,0.6)', fontSize: 10, fontFamily: 'ui-monospace' }} />
        <Area
          type="monotone" dataKey="metBatterij" name="Met batterij"
          stroke="#10b981" strokeWidth={2} fill="url(#emeraldGrad)"
        />
        <Area
          type="monotone" dataKey="zonderBatterij" name={`Zonder batterij (${wijk})`}
          stroke="#f59e0b" strokeWidth={2.5} fill="url(#amberGrad)"
        />
        <Legend
          wrapperStyle={{ fontSize: '10px', fontFamily: 'ui-monospace', color: 'rgba(255,255,255,0.4)', paddingTop: '8px' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
