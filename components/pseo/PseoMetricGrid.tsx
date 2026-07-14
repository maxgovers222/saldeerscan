import { cn } from '@/lib/utils'

export interface PseoMetric {
  label: string
  value: string
  note?: string
  tone?: 'default' | 'trust' | 'warning' | 'danger'
}

const valueStyles: Record<NonNullable<PseoMetric['tone']>, string> = {
  default: 'text-action',
  trust: 'text-trust',
  warning: 'text-action',
  danger: 'text-red-300',
}

export function PseoMetricGrid({ metrics }: { metrics: PseoMetric[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {metrics.map(metric => (
        <div
          key={metric.label}
          className="rounded-2xl border border-white/10 bg-evergreen-900/70 p-4"
        >
          <dt className="text-xs text-white/55">{metric.label}</dt>
          <dd
            className={cn(
              'mt-2 font-mono text-2xl font-bold',
              valueStyles[metric.tone ?? 'default'],
            )}
          >
            {metric.value}
          </dd>
          {metric.note && <dd className="mt-1 text-xs text-white/45">{metric.note}</dd>}
        </div>
      ))}
    </dl>
  )
}
