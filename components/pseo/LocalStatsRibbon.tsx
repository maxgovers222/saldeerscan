import type { NetcongestieNarrative } from '@/lib/pseo-variation'

const G = '#00aa65'
const AMBER = '#f59e0b'

type Props = {
  /** Resultaat van netcongestieNarrative() of alleen status + label uit DB */
  net?: Pick<NetcongestieNarrative, 'status' | 'label' | 'dot'> | null
  gemBouwjaar: number | null
  score: number
  scoreLabelText: string
  scoreColor: string
  /** Optionele sr-only titels voor toegankelijkheid */
  ariaLabel?: string
  className?: string
}

/**
 * Drie kolommen: netstatus, gemiddeld bouwjaar, energy score — gelijk aan het hero-lint op de wijk-pagina.
 */
export function LocalStatsRibbon({
  net,
  gemBouwjaar,
  score,
  scoreLabelText,
  scoreColor,
  ariaLabel = 'Kernstatistieken voor deze wijk',
  className = '',
}: Props) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`mx-auto grid max-w-2xl grid-cols-3 gap-3 ${className}`}
    >
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-center backdrop-blur-md">
        <p
          className="mb-2 text-xs font-semibold uppercase tracking-widest"
          style={{ color: G, fontFamily: 'var(--font-heading)' }}
        >
          Grid Status
        </p>
        {net?.status ? (
          <>
            <div className="mb-1 flex items-center justify-center gap-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: net.dot }} />
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                  net.status === 'ROOD'
                    ? 'border-red-700 bg-red-950/50 text-red-400'
                    : net.status === 'ORANJE'
                      ? 'border-amber-700 bg-amber-950/50 text-amber-400'
                      : 'border-emerald-700 bg-emerald-950/50 text-emerald-400'
                }`}
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {net.status}
              </span>
            </div>
            <p className="text-xs text-white/40">{net.label}</p>
          </>
        ) : (
          <span className="text-sm text-white/20">—</span>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-center backdrop-blur-md">
        <p
          className="mb-2 text-xs font-semibold uppercase tracking-widest"
          style={{ color: G, fontFamily: 'var(--font-heading)' }}
        >
          Gem. Bouwjaar
        </p>
        <p
          className="text-2xl font-extrabold"
          style={{
            fontFamily: 'var(--font-heading)',
            color: AMBER,
            letterSpacing: '-0.02em',
          }}
        >
          {gemBouwjaar ?? '—'}
        </p>
        <p className="mt-1 text-xs text-white/30">BAG 2026</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-center backdrop-blur-md">
        <p
          className="mb-2 text-xs font-semibold uppercase tracking-widest"
          style={{ color: G, fontFamily: 'var(--font-heading)' }}
        >
          Energy Score
        </p>
        <p
          className="text-2xl font-extrabold"
          style={{
            fontFamily: 'var(--font-heading)',
            color: scoreColor,
            letterSpacing: '-0.02em',
          }}
        >
          {score}
          <span className="text-sm font-normal text-white/30">/100</span>
        </p>
        <p className="mt-1 text-xs" style={{ color: scoreColor }}>
          {scoreLabelText}
        </p>
      </div>
    </div>
  )
}
