'use client'

import type { Dispatch } from 'react'
import type { FunnelTracker } from '@/lib/analytics'
import type { FunnelAction, FunnelState } from './types'
import { funnelTextButtonClass } from './ui/FunnelActions'
import { FunnelCard } from './ui/FunnelCard'

interface TechnicalStageChecklistProps {
  dispatch: Dispatch<FunnelAction>
  state: FunnelState
  trackFunnel: FunnelTracker
}

const CHECKS = [
  { step: 3, label: 'Meterkast', scanType: 'Meterkast' },
  { step: 4, label: 'Plaatsingsplek', scanType: 'Plaatsingslocatie' },
  { step: 5, label: 'Omvormer', scanType: 'Omvormer' },
] as const

export function TechnicalStageChecklist({
  dispatch,
  state,
  trackFunnel,
}: TechnicalStageChecklistProps) {
  const completed = {
    3: Boolean(state.meterkastAnalyse),
    4: Boolean(state.plaatsingsAnalyse),
    5: Boolean(state.omvormerAnalyse),
  } as const

  function continueToReport() {
    CHECKS.filter(check => check.step >= state.step && !completed[check.step])
      .forEach(check => {
        trackFunnel('technical_scan_skipped', { scan_type: check.scanType })
      })
    if (!state.meterkastAnalyse && !state.plaatsingsAnalyse && !state.omvormerAnalyse) {
      trackFunnel('technical_module_skipped')
    }
    dispatch({ type: 'SET_STEP', step: 6 })
  }

  return (
    <FunnelCard surface="mist" data-testid="technical-checklist" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">Verfijn uw advies</p>
          <p className="mt-1 text-xs leading-5 text-ink-muted">
            Deze checks zijn optioneel. Elke extra check maakt het advies concreter.
          </p>
        </div>
        <button type="button" onClick={continueToReport} className={funnelTextButtonClass}>
          Doorgaan naar mijn rapport
        </button>
      </div>

      <ol className="grid gap-2 sm:grid-cols-3">
        {CHECKS.map((check, index) => {
          const isComplete = completed[check.step]
          const isActive = state.step === check.step
          return (
            <li
              key={check.step}
              className={[
                'rounded-xl border px-3 py-3',
                isComplete
                  ? 'border-trust/30 bg-trust/10'
                  : isActive
                    ? 'border-trust bg-paper'
                    : 'border-ink/10 bg-paper/65',
              ].join(' ')}
            >
              <div className="flex items-center gap-2">
                <span
                  className={[
                    'grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold',
                    isComplete || isActive ? 'bg-trust text-white' : 'bg-ink/8 text-ink-muted',
                  ].join(' ')}
                  aria-hidden="true"
                >
                  {isComplete ? '✓' : index + 1}
                </span>
                <span className={isActive ? 'text-sm font-semibold text-ink' : 'text-sm text-ink-muted'}>
                  {check.label}
                </span>
              </div>
              <p className="mt-2 text-xs text-ink-muted">
                {isComplete ? 'Afgerond' : isActive ? 'Nu geopend' : 'Optioneel'}
              </p>
            </li>
          )
        })}
      </ol>
    </FunnelCard>
  )
}
