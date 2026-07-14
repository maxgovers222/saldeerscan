import type { ReactNode } from 'react'

export function ReportAccordion({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <details
      role="group"
      aria-label={title}
      className="group rounded-2xl border border-ink/10 bg-paper"
    >
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 font-semibold text-ink">
        {title}
        <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5 shrink-0 transition group-open:rotate-45">
          <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </summary>
      <div className="border-t border-ink/10 px-4 py-4 text-sm leading-6 text-ink-muted">
        {children}
      </div>
    </details>
  )
}
