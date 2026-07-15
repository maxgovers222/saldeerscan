'use client'

import { useState, type Dispatch } from 'react'
import type { FunnelTracker } from '@/lib/analytics'
import { PhotoUpload } from './PhotoUpload'
import { TechnicalStageChecklist } from './TechnicalStageChecklist'
import type { FunnelAction, FunnelState, PlaatsingsAnalyse } from './types'
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

function FallbackPlaatsing({ onComplete }: { onComplete: (data: PlaatsingsAnalyse) => void }) {
  return (
    <FunnelCard surface="mist" className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-ink">Kies uw voorkeurlocatie</p>
        <p className="mt-1 text-xs leading-5 text-ink-muted">
          We gebruiken uw keuze als eerste indicatie. Een installateur controleert de plek altijd definitief.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Garage', score: 9 },
          { label: 'Bijkeuken', score: 8 },
          { label: 'Kelder', score: 7 },
          { label: 'Anders', score: 6 },
        ].map(({ label, score }) => (
          <FunnelChoiceCard
            key={label}
            onClick={() => onComplete({
              nenCompliant: score >= 8,
              risicoItems: [],
              aanbevelingen: ['Handmatig ingevuld — installateur verifieert locatie'],
              geschiktheidScore: score,
            })}
          >
            {label}
          </FunnelChoiceCard>
        ))}
      </div>
    </FunnelCard>
  )
}

interface Step4PlaatsingProps {
  state: FunnelState
  dispatch: Dispatch<FunnelAction>
  trackFunnel: FunnelTracker
}

function PlaatsingResultaat({ analyse }: { analyse: PlaatsingsAnalyse }) {
  return (
    <FunnelCard className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-trust" />
        <span className="text-xs font-semibold text-trust-dark">Plaatsingscheck afgerond</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <FunnelNotice
          variant={analyse.nenCompliant ? 'success' : 'danger'}
          title={analyse.nenCompliant ? 'Voldoet aan de belangrijkste aandachtspunten' : 'Extra beoordeling nodig'}
        >
          {analyse.nenCompliant
            ? 'De gekozen plek lijkt op basis van deze check passend.'
            : 'Een installateur moet de locatie nader beoordelen.'}
        </FunnelNotice>
        <div className="rounded-xl border border-ink/10 bg-mist px-5 py-3 text-center">
          <p className="text-xs text-ink-muted">Score</p>
          <p className="mt-1 text-xl font-bold text-ink">{analyse.geschiktheidScore}/10</p>
        </div>
      </div>

      {analyse.risicoItems.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-danger">Aandachtspunten</p>
          <ul className="mt-2 space-y-1.5">
            {analyse.risicoItems.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-xs leading-5 text-danger">
                <span aria-hidden="true">!</span>{item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analyse.aanbevelingen.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-ink">Aanbevelingen</p>
          <ul className="mt-2 space-y-1.5">
            {analyse.aanbevelingen.map((aanbeveling, index) => (
              <li key={index} className="flex items-start gap-2 text-xs leading-5 text-ink-muted">
                <span className="mt-0.5 text-trust-dark" aria-hidden="true">›</span>
                {aanbeveling}
              </li>
            ))}
          </ul>
        </div>
      )}
    </FunnelCard>
  )
}

export function Step4Plaatsing({ state, dispatch, trackFunnel }: Step4PlaatsingProps) {
  const analyse = state.plaatsingsAnalyse
  const [showFallback, setShowFallback] = useState(false)

  return (
    <FunnelStageShell
      eyebrow="Stadium 3 van 4 · Verfijn uw advies"
      title="Plaatsingsplek beoordelen"
      description="Optioneel: een foto helpt om de aandachtspunten uit NEN 2078:2023 rond een batterij of omvormer eerder te herkennen."
    >
      <TechnicalStageChecklist state={state} dispatch={dispatch} trackFunnel={trackFunnel} />

      <FunnelCard surface="mist" className="space-y-2">
        <p className="text-sm font-semibold text-ink">NEN 2078:2023 vereisten</p>
        <ul className="grid gap-1.5 text-xs leading-5 text-ink-muted sm:grid-cols-2">
          {[
            'Min. 50 cm afstand tot brandbare materialen',
            'Adequate ventilatie aanwezig',
            'Geen waterleiding of gas in nabijheid',
            'Stabiele temperatuur (geen directe zon)',
          ].map((requirement) => (
            <li key={requirement} className="flex items-start gap-2">
              <span className="text-trust-dark" aria-hidden="true">○</span>{requirement}
            </li>
          ))}
        </ul>
      </FunnelCard>

      {!analyse && (
        <FunnelNotice variant="info" title="Zo maakt u een bruikbare foto">
          Maak een overzichtsfoto van de ruimte en zorg dat ventilatie en nabijgelegen leidingen zichtbaar zijn.
        </FunnelNotice>
      )}

      {!analyse && !showFallback && (
        <PhotoUpload
          visionType="plaatsingslocatie"
          onAnalysed={(result) => dispatch({ type: 'SET_PLAATSING', plaatsingsAnalyse: result as PlaatsingsAnalyse })}
          trackFunnel={trackFunnel}
          title="Foto van de plaatsingsplek"
          description="Maak een overzichtsfoto van de ruimte waar de batterij of omvormer geplaatst wordt."
        />
      )}

      {!analyse && !showFallback && (
        <button type="button" onClick={() => setShowFallback(true)} className={`w-full ${funnelTextButtonClass}`}>
          Geen foto? Kies voorkeurlocatie
        </button>
      )}

      {!analyse && showFallback && (
        <FallbackPlaatsing
          onComplete={(data) => {
            trackFunnel('technical_scan_completed', { scan_type: 'Plaatsingslocatie', completion: 'manual' })
            dispatch({ type: 'SET_PLAATSING', plaatsingsAnalyse: data })
            dispatch({ type: 'SET_STEP', step: 5 })
          }}
        />
      )}

      {analyse && (
        <div className="space-y-3">
          <PlaatsingResultaat analyse={analyse} />
          <button
            type="button"
            onClick={() => {
              dispatch({ type: 'SET_PLAATSING', plaatsingsAnalyse: null })
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
          <button type="button" onClick={() => dispatch({ type: 'SET_STEP', step: 3 })} className={funnelSecondaryButtonClass}>
            ← Terug
          </button>
        )}
        primary={(
          <button
            type="button"
            onClick={() => {
              if (!analyse) trackFunnel('technical_scan_skipped', { scan_type: 'Plaatsingslocatie' })
              dispatch({ type: 'SET_STEP', step: 5 })
            }}
            className={funnelPrimaryButtonClass}
          >
            {analyse ? 'Volgende check: omvormer' : 'Overslaan →'}
          </button>
        )}
      />
    </FunnelStageShell>
  )
}
