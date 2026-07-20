'use client'

import { useState, type Dispatch } from 'react'
import type { FunnelTracker } from '@/lib/analytics'
import { PhotoUpload } from './PhotoUpload'
import { TechnicalStageChecklist } from './TechnicalStageChecklist'
import type { FunnelAction, FunnelState, OmvormerAnalyse } from './types'
import {
  FunnelActions,
  funnelPrimaryButtonClass,
  funnelSecondaryButtonClass,
  funnelTextButtonClass,
} from './ui/FunnelActions'
import { FunnelCard } from './ui/FunnelCard'
import { FunnelChoiceCard } from './ui/FunnelChoiceCard'
import { FunnelNotice } from './ui/FunnelNotice'
import { FunnelStageShell } from './ui/FunnelStageShell'

function FallbackOmvormer({ onComplete }: { onComplete: (data: OmvormerAnalyse) => void }) {
  return (
    <FunnelCard surface="mist" className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-ink">Heeft u al zonnepanelen of een omvormer?</p>
        <p className="mt-1 text-xs leading-5 text-ink-muted">
          Met dit antwoord houden we rekening met een bestaande installatie, ook zonder foto.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {[
          { label: 'Ja, ik heb al panelen', heeft: true },
          { label: 'Nee, nog niet', heeft: false },
        ].map(({ label, heeft }) => (
          <FunnelChoiceCard
            key={label}
            onClick={() => onComplete({
              merk: null,
              model: null,
              vermogenKw: null,
              hybrideKlaar: false,
              vervangenNodig: false,
              opmerkingen: heeft
                ? ['Handmatig ingevuld — installateur inspecteert omvormer']
                : ['Geen omvormer aanwezig — nieuwe installatie'],
            })}
          >
            {label}
          </FunnelChoiceCard>
        ))}
      </div>
    </FunnelCard>
  )
}

interface Step5OmvormerProps {
  state: FunnelState
  dispatch: Dispatch<FunnelAction>
  trackFunnel: FunnelTracker
}

function OmvormerResultaat({ analyse }: { analyse: OmvormerAnalyse }) {
  return (
    <FunnelCard className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-trust" />
        <span className="text-xs font-semibold text-trust-dark">Omvormercheck afgerond</span>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        {[
          ['Merk', analyse.merk ?? 'Onbekend'],
          ['Model', analyse.model ?? '—'],
          ['Vermogen', analyse.vermogenKw !== null ? `${analyse.vermogenKw} kW` : '—'],
          ['Hybride klaar', analyse.hybrideKlaar ? 'Ja' : 'Nee'],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0 rounded-xl border border-ink/10 bg-mist p-3">
            <dt className="text-xs text-ink-muted">{label}</dt>
            <dd className="mt-1 truncate text-sm font-semibold text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      {analyse.vervangenNodig && (
        <FunnelNotice variant="danger" title="Inspectie voor vervanging aanbevolen">
          De foto toont een mogelijk aandachtspunt. Laat het exacte model en de technische staat controleren.
        </FunnelNotice>
      )}

      {!analyse.hybrideKlaar && !analyse.vervangenNodig && (
        <FunnelNotice variant="warning" title="Extra omvormer of vervanging kan nodig zijn">
          Op de foto is geen batterijaansluiting bevestigd. Een installateur controleert de modelspecificaties.
        </FunnelNotice>
      )}

      {analyse.opmerkingen.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-ink">Opmerkingen</p>
          <ul className="mt-2 space-y-1.5">
            {analyse.opmerkingen.map((opmerking, index) => (
              <li key={index} className="flex items-start gap-2 text-xs leading-5 text-ink-muted">
                <span className="mt-0.5 text-trust-dark" aria-hidden="true">›</span>
                {opmerking}
              </li>
            ))}
          </ul>
        </div>
      )}
    </FunnelCard>
  )
}

export function Step5Omvormer({ state, dispatch, trackFunnel }: Step5OmvormerProps) {
  const analyse = state.omvormerAnalyse
  const [showFallback, setShowFallback] = useState(false)

  return (
    <FunnelStageShell
      eyebrow="Stadium 3 van 4 · Verfijn uw advies"
      title="Omvormer controleren"
      description="Optioneel: met merk, model en vermogen kunnen we beter inschatten of uw huidige installatie klaar is voor een thuisbatterij."
    >
      <TechnicalStageChecklist state={state} dispatch={dispatch} trackFunnel={trackFunnel} />

      {!analyse && (
        <FunnelNotice variant="info" title="Zo maakt u een bruikbare foto">
          Foto van het label of display op de omvormer. Zorg dat merk en model leesbaar zijn en gebruik zo nodig de zaklamp van uw telefoon.
        </FunnelNotice>
      )}

      {!analyse && !showFallback && (
        <PhotoUpload
          visionType="omvormer"
          onAnalysed={(result) => dispatch({ type: 'SET_OMVORMER', omvormerAnalyse: result as OmvormerAnalyse })}
          trackFunnel={trackFunnel}
          title="Foto van uw omvormer"
          description="Maak een foto van het label of de sticker waarop merk en model leesbaar zijn."
        />
      )}

      {!analyse && !showFallback && (
        <button type="button" onClick={() => setShowFallback(true)} className={`w-full ${funnelTextButtonClass}`}>
          Geen foto? Vul handmatig in
        </button>
      )}

      {!analyse && showFallback && (
        <FallbackOmvormer
          onComplete={(data) => {
            trackFunnel('technical_scan_completed', { scan_type: 'Omvormer', completion: 'manual' })
            dispatch({ type: 'SET_OMVORMER', omvormerAnalyse: data })
            dispatch({ type: 'SET_STEP', step: 6 })
          }}
        />
      )}

      {analyse && (
        <div className="space-y-3">
          <OmvormerResultaat analyse={analyse} />
          <button
            type="button"
            onClick={() => {
              dispatch({ type: 'SET_OMVORMER', omvormerAnalyse: null })
              setShowFallback(false)
            }}
            className={`w-full ${funnelTextButtonClass}`}
          >
            Andere foto uploaden
          </button>
        </div>
      )}

      <FunnelActions
        sticky
        secondary={(
          <button type="button" onClick={() => dispatch({ type: 'SET_STEP', step: 4 })} className={funnelSecondaryButtonClass}>
            ← Terug
          </button>
        )}
        primary={(
          <button
            type="button"
            onClick={() => {
              if (!analyse) {
                trackFunnel('technical_scan_skipped', { scan_type: 'Omvormer' })
                if (!state.meterkastAnalyse && !state.plaatsingsAnalyse) {
                  trackFunnel('technical_module_skipped')
                }
              }
              dispatch({ type: 'SET_STEP', step: 6 })
            }}
            className={funnelPrimaryButtonClass}
          >
            {analyse ? 'Doorgaan naar mijn rapport' : 'Overslaan en doorgaan naar mijn rapport'}
          </button>
        )}
      />
    </FunnelStageShell>
  )
}
