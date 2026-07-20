'use client'

import { useState, type Dispatch } from 'react'
import type { FunnelTracker } from '@/lib/analytics'
import { PhotoUpload } from './PhotoUpload'
import { TechnicalStageChecklist } from './TechnicalStageChecklist'
import type { FunnelAction, FunnelState, MeterkastAnalyse } from './types'
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

function FallbackMeterkast({ onComplete }: { onComplete: (data: MeterkastAnalyse) => void }) {
  const [fase, setFase] = useState<'1-fase' | '3-fase' | null>(null)
  const [groepen, setGroepen] = useState<number | null>(null)

  return (
    <FunnelCard surface="mist" className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-ink">Snel handmatig invullen</p>
        <p className="mt-1 text-xs leading-5 text-ink-muted">
          Geen foto bij de hand? Met deze twee antwoorden kunnen we uw advies toch verfijnen.
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-ink">Wat voor aansluiting heeft u?</legend>
        <div className="grid grid-cols-2 gap-2">
          {(['1-fase', '3-fase'] as const).map(f => (
            <FunnelChoiceCard key={f} selected={fase === f} onClick={() => setFase(f)}>
              {f}
            </FunnelChoiceCard>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-ink">Hoeveel vrije groepen heeft uw meterkast?</legend>
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 4].map(n => (
            <FunnelChoiceCard key={n} selected={groepen === n} onClick={() => setGroepen(n)}>
              {n === 4 ? '4+' : n}
            </FunnelChoiceCard>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        disabled={!fase || groepen === null}
        onClick={() => {
          if (!fase || groepen === null) return
          onComplete({
            merk: null,
            drieFase: fase === '3-fase',
            vrijeGroepen: groepen,
            maxVermogenKw: null,
            geschikt: groepen > 0,
            opmerkingen: ['Handmatig ingevuld — geen foto-analyse uitgevoerd'],
          })
        }}
        className={`w-full ${funnelPrimaryButtonClass}`}
      >
        Doorgaan
      </button>
    </FunnelCard>
  )
}

interface Step3MeterkastProps {
  state: FunnelState
  dispatch: Dispatch<FunnelAction>
  trackFunnel: FunnelTracker
}

function MeterkastResultaat({ analyse }: { analyse: MeterkastAnalyse }) {
  return (
    <FunnelCard className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-trust" />
        <span className="text-xs font-semibold text-trust-dark">Meterkastcheck afgerond</span>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        {[
          ['Merk', analyse.merk ?? 'Onbekend'],
          ['3-fase', analyse.drieFase ? 'Ja' : 'Nee'],
          ['Vrije groepen', String(analyse.vrijeGroepen)],
          ['Max. vermogen', analyse.maxVermogenKw !== null ? `${analyse.maxVermogenKw} kW` : '—'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-ink/10 bg-mist p-3">
            <dt className="text-xs text-ink-muted">{label}</dt>
            <dd className="mt-1 text-sm font-semibold text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <FunnelNotice
        variant={analyse.geschikt ? 'success' : 'danger'}
        title={analyse.geschikt ? 'Lijkt geschikt voor uitbreiding' : 'Aanpassing lijkt nodig'}
      >
        {analyse.geschikt
          ? 'Dit is een foto-indicatie. Een installateur controleert de aansluiting en beveiliging ter plaatse.'
          : 'Een installateur kan ter plaatse beoordelen welke aanpassing nodig is.'}
      </FunnelNotice>

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

export function Step3Meterkast({ state, dispatch, trackFunnel }: Step3MeterkastProps) {
  const analyse = state.meterkastAnalyse
  const [showFallback, setShowFallback] = useState(false)

  return (
    <FunnelStageShell
      eyebrow="Stadium 3 van 4 · Verfijn uw advies"
      title="Meterkast analyseren"
      description="Optioneel: hiermee zien we of uw aansluiting direct geschikt lijkt voor zonnepanelen en een thuisbatterij."
    >
      <TechnicalStageChecklist state={state} dispatch={dispatch} trackFunnel={trackFunnel} />

      {!analyse && (
        <FunnelNotice variant="info" title="Zo maakt u een bruikbare foto">
          Open de kast volledig, sta ongeveer één meter ervoor en zorg dat alle groepen goed verlicht en zichtbaar zijn.
        </FunnelNotice>
      )}

      {!analyse && !showFallback && (
        <PhotoUpload
          visionType="meterkast"
          onAnalysed={(result) => dispatch({ type: 'SET_METERKAST', meterkastAnalyse: result as MeterkastAnalyse })}
          trackFunnel={trackFunnel}
          title="Foto van uw meterkast"
          description="Maak een foto van uw open meterkast waarop alle groepen zichtbaar zijn."
        />
      )}

      {!analyse && !showFallback && (
        <button type="button" onClick={() => setShowFallback(true)} className={`w-full ${funnelTextButtonClass}`}>
          Geen foto? Vul handmatig in
        </button>
      )}

      {!analyse && showFallback && (
        <FallbackMeterkast
          onComplete={(data) => {
            trackFunnel('technical_scan_completed', { scan_type: 'Meterkast', completion: 'manual' })
            dispatch({ type: 'SET_METERKAST', meterkastAnalyse: data })
            dispatch({ type: 'SET_STEP', step: 4 })
          }}
        />
      )}

      {analyse && (
        <div className="space-y-3">
          <MeterkastResultaat analyse={analyse} />
          <button
            type="button"
            onClick={() => {
              dispatch({ type: 'SET_METERKAST', meterkastAnalyse: null })
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
          <button type="button" onClick={() => dispatch({ type: 'SET_STEP', step: 2 })} className={funnelSecondaryButtonClass}>
            ← Terug
          </button>
        )}
        primary={(
          <button
            type="button"
            onClick={() => {
              if (!analyse) trackFunnel('technical_scan_skipped', { scan_type: 'Meterkast' })
              dispatch({ type: 'SET_STEP', step: 4 })
            }}
            className={funnelPrimaryButtonClass}
          >
            {analyse ? 'Volgende check: plaatsing' : 'Overslaan →'}
          </button>
        )}
      />
    </FunnelStageShell>
  )
}
