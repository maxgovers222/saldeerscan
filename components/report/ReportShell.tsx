import type { ReactNode } from 'react'
import type { NormalizedReport } from '@/lib/report-model'

function formatReportDate(value: string): string {
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value))
}

export function ReportShell({
  report,
  children,
}: {
  report: NormalizedReport
  children: ReactNode
}) {
  return (
    <article
      data-testid="report-root"
      className="min-w-0 overflow-hidden bg-mist text-ink"
    >
      <header className="bg-evergreen-950 px-5 py-7 text-white sm:px-8 sm:py-9">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-action">
          Persoonlijk 2027-rapport
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Uw SaldeerScan rapport
        </h1>
        <p className="mt-2 break-words text-sm leading-6 text-white/65">
          {report.home.address || 'Adres niet beschikbaar'}
        </p>
        <p className="mt-1 text-xs text-white/45">
          Gegenereerd op {formatReportDate(report.generatedAt)} · model v{report.version}
        </p>
      </header>
      <div className="space-y-5 px-4 py-5 sm:px-8 sm:py-8">
        {children}
      </div>
    </article>
  )
}
