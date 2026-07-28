import Link from 'next/link'
import { PseoStatusBadge, type PseoStatus } from './PseoStatusBadge'

export interface PseoCardItem {
  href: string
  title: string
  meta?: string
  status?: PseoStatus
  analyticsLabel: string
}

export function PseoCardGrid({ items }: { items: PseoCardItem[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(item => (
        <Link
          key={`pseo-card-${item.analyticsLabel}`}
          href={item.href}
          data-analytics-event="pseo_second_click"
          data-analytics-label={item.analyticsLabel}
          className="group min-h-11 rounded-2xl border border-white/10 bg-evergreen-900/70 p-5 transition hover:border-trust/40 hover:bg-evergreen-900"
        >
          <span className="flex items-start justify-between gap-3">
            <span className="break-words font-heading text-lg font-bold text-white transition group-hover:text-trust">
              {item.title}
            </span>
            {item.status && <PseoStatusBadge status={item.status} />}
          </span>
          {item.meta && <span className="mt-2 block text-sm text-white/55">{item.meta}</span>}
        </Link>
      ))}
    </div>
  )
}
