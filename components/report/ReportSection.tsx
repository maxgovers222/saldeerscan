import type { ReactNode } from 'react'

export function ReportSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-ink/10 bg-paper p-5 sm:p-6">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      <div className="mt-4 text-sm leading-6 text-ink-muted">{children}</div>
    </section>
  )
}
