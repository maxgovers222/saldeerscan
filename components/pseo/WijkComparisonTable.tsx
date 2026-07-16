import { rankUrgentWijken, type RankedUrgentWijk, type WijkStadRow } from '@/lib/pseo-variation'

export type WijkComparisonRow = {
  wijkSlug: string
  wijkDisplay: string
  href: string
  score: number
  gemBouwjaar: number | null
  verlies: number
  netLabel: string
}

type Props = {
  /** Optioneel: voorgerekende rijen; anders worden ze uit ranked urgent-berekening gederiveerd */
  rows?: WijkComparisonRow[]
  /** Als rows ontbreekt: neem ranked output (bijv. rankUrgentWijken) + URL-builder */
  ranked?: RankedUrgentWijk[]
  buildHref?: (wijkSlug: string) => string
  toDisplay?: (slug: string) => string
  stadContextLabel?: string
  title?: string
  className?: string
}

function defaultToDisplay(slug: string) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function rowFromRanked(r: RankedUrgentWijk, href: string, display: string, netLabel: string): WijkComparisonRow {
  return {
    wijkSlug: r.wijk,
    wijkDisplay: display,
    href,
    score: r.score,
    gemBouwjaar: r.gem_bouwjaar,
    verlies: r.verlies,
    netLabel,
  }
}

function netShort(status: string | null): string {
  if (status === 'ROOD') return 'Vol net'
  if (status === 'ORANJE') return 'Druk net'
  if (status === 'GROEN') return 'Vrij net'
  return '—'
}

/** Server-safe compacte vergelijkingstabel voor interne wijk-lijsten. */
export function WijkComparisonTable({
  rows: rowsProp,
  ranked,
  buildHref,
  toDisplay = defaultToDisplay,
  stadContextLabel,
  title = 'Wijkvergelijking',
  className = '',
}: Props) {
  const rows: WijkComparisonRow[] =
    rowsProp ??
    (ranked && buildHref
      ? ranked.map((r) =>
          rowFromRanked(r, buildHref(r.wijk), toDisplay(r.wijk), netShort(r.netcongestie_status))
        )
      : [])

  if (rows.length === 0) return null

  return (
    <div className={className}>
      <div className="mb-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-trust-dark">
          {title}
        </p>
        {stadContextLabel && (
          <p className="text-base text-ink-muted">
            {stadContextLabel}
          </p>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-paper shadow-sm">
        <table className="w-full min-w-[320px] border-collapse text-left text-base sm:text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-mist text-xs uppercase tracking-wider text-ink-muted">
              <th className="px-4 py-3 font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                Wijk
              </th>
              <th className="px-4 py-3 font-mono font-semibold">Score</th>
              <th className="px-4 py-3 font-mono font-semibold">Bouwjaar</th>
              <th className="px-4 py-3 font-mono font-semibold text-ink">Verlies ’27</th>
              <th className="hidden px-4 py-3 font-semibold sm:table-cell" style={{ fontFamily: 'var(--font-heading)' }}>
                Net
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.wijkSlug} className="border-b border-ink/10 last:border-0">
                <td className="px-4 py-3">
                  <a
                    href={row.href}
                    className="inline-flex min-h-11 items-center break-words font-heading font-bold text-ink transition-colors hover:text-trust-dark"
                  >
                    {row.wijkDisplay}
                  </a>
                </td>
                <td className="px-4 py-3 font-mono text-trust-dark">
                  {row.score}
                  <span className="text-ink-muted">/100</span>
                </td>
                <td className="px-4 py-3 font-mono text-ink-muted">{row.gemBouwjaar ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-danger">−€{row.verlies}</td>
                <td className="hidden px-4 py-3 text-xs text-ink-muted sm:table-cell">{row.netLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** Helper: bouw rijen voor de tabel vanuit kale stad-wijken + URL-prefix */
export function buildWijkComparisonRows(
  wijken: WijkStadRow[],
  buildHref: (wijkSlug: string) => string,
  toDisplay = defaultToDisplay
): WijkComparisonRow[] {
  const ranked = rankUrgentWijken(wijken)
  return ranked.map((r) =>
    rowFromRanked(r, buildHref(r.wijk), toDisplay(r.wijk), netShort(r.netcongestie_status))
  )
}
