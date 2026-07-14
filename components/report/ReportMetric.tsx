export function ReportMetric({
  label,
  value,
  detail,
  tone = 'default',
}: {
  label: string
  value: string
  detail?: string
  tone?: 'default' | 'positive' | 'warning'
}) {
  const valueClass = tone === 'positive'
    ? 'text-trust-dark'
    : tone === 'warning'
      ? 'text-warning'
      : 'text-ink'

  return (
    <div className="rounded-2xl border border-ink/10 bg-paper p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{label}</p>
      <p className={`mt-2 text-xl font-bold font-mono ${valueClass}`}>{value}</p>
      {detail && <p className="mt-1 text-xs leading-5 text-ink-muted">{detail}</p>}
    </div>
  )
}
