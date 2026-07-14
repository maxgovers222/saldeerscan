import type { NetcongestieNarrative } from '@/lib/pseo-variation'
import { PseoStatusBadge } from './PseoStatusBadge'

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
      className={`mx-auto grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3 ${className}`}
    >
      <div className="min-w-0 rounded-2xl border border-white/10 bg-evergreen-900/70 p-4 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-trust">
          Grid Status
        </p>
        {net?.status ? (
          <>
            <div className="mb-1 flex items-center justify-center gap-1.5">
              <span className="size-2 animate-pulse rounded-full" style={{ background: net.dot }} />
              <PseoStatusBadge status={net.status} />
            </div>
            <p className="break-words text-sm text-white/50">{net.label}</p>
          </>
        ) : (
          <span className="font-mono text-sm text-white/25">—</span>
        )}
      </div>

      <div className="min-w-0 rounded-2xl border border-white/10 bg-evergreen-900/70 p-4 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-trust">
          Gem. bouwjaar
        </p>
        <p className="font-mono text-2xl font-bold text-action">{gemBouwjaar ?? '—'}</p>
        <p className="mt-1 text-sm text-white/40">BAG 2026</p>
      </div>

      <div className="min-w-0 rounded-2xl border border-white/10 bg-evergreen-900/70 p-4 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-trust">
          Energiescore
        </p>
        <p className="font-mono text-2xl font-bold" style={{ color: scoreColor }}>
          {score}<span className="text-sm font-normal text-white/40">/100</span>
        </p>
        <p className="mt-1 break-words text-sm" style={{ color: scoreColor }}>
          {scoreLabelText}
        </p>
      </div>
    </div>
  )
}
