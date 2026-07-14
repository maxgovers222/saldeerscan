import type { ReactNode } from 'react'

export function ReportAlert({
  title,
  children,
  tone = 'warning',
}: {
  title: string
  children: ReactNode
  tone?: 'warning' | 'danger' | 'neutral'
}) {
  const toneClass = tone === 'danger'
    ? 'border-danger/25 bg-danger/5'
    : tone === 'warning'
      ? 'border-action/45 bg-action/10'
      : 'border-ink/10 bg-mist'
  const titleClass = tone === 'danger' ? 'text-danger' : 'text-ink'

  return (
    <div className={`rounded-xl border px-4 py-3 ${toneClass}`}>
      <p className={`font-semibold ${titleClass}`}>{title}</p>
      <div className="mt-1 text-sm leading-6 text-ink-muted">{children}</div>
    </div>
  )
}
