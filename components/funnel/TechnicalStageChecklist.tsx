'use client'

import type { Dispatch } from 'react'
import type { FunnelTracker } from '@/lib/analytics'
import type { FunnelAction, FunnelState } from './types'
import { funnelPrimaryButtonClass } from './ui/FunnelActions'
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
      <div>
        <p className="text-sm font-semibold text-ink">Uw basisrapport is klaar</p>
        <p className="mt-1 text-xs leading-5 text-ink-muted">
          U kunt het rapport direct openen. De technische checks zijn optioneel.
        </p>
      </div>
      <button
        type="button"
        onClick={continueToReport}
        className={`w-full ${funnelPrimaryButtonClass}`}
      >
        Direct naar mijn rapport <span aria-hidden="true">→</span>
      </button>
    </FunnelCard>
  )
}
