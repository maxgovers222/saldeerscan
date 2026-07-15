'use client'

import { useState, useEffect, useRef, type Dispatch } from 'react'
import type { FunnelState, FunnelAction, ROIResult } from './types'
import { Shock2027Banner } from './Shock2027Banner'
import { schatVerbruik } from '@/lib/roi'
import { FunnelActions, funnelPrimaryButtonClass, funnelSecondaryButtonClass, funnelTextButtonClass } from './ui/FunnelActions'
import { FunnelCard } from './ui/FunnelCard'
import { FunnelChoiceCard } from './ui/FunnelChoiceCard'
import { FunnelNotice } from './ui/FunnelNotice'
import { FunnelStageShell } from './ui/FunnelStageShell'

interface Step2ROIProps {
  state: FunnelState
  dispatch: Dispatch<FunnelAction>
}

const PANEEL_TYPES = [
  { label: 'Standaard (330 kWh/jaar)', kwhPerPaneel: 330 },
  { label: 'Efficiënt (370 kWh/jaar)',  kwhPerPaneel: 370 },
  { label: 'Premium (410 kWh/jaar)',    kwhPerPaneel: 410 },
]

function ScenarioCard({ scenario, variant, recommended }: {
  scenario: { naam: string; beschrijving: string; besparingJaarEur: number; investeringEur: number; terugverdientijdJaar: number }
  variant: 'amber' | 'emerald' | 'red'
  recommended?: boolean
}) {
  const borderClass = recommended
    ? 'border-trust/45 ring-2 ring-trust/15'
    : variant === 'amber' ? 'border-action/35'
    : variant === 'emerald' ? 'border-trust/30'
    : 'border-danger/25'
  const labelClass = variant === 'amber' ? 'text-warning' : variant === 'emerald' ? 'text-trust-dark' : 'text-danger'
  const bgClass = variant === 'red' ? 'bg-danger/5' : 'bg-paper'

  return (
    <div className={`${bgClass} border ${borderClass} rounded-xl p-4 ${variant === 'red' ? 'opacity-70' : ''} relative`}>
      {recommended && (
        <span className="absolute -top-2.5 left-4 rounded-full bg-trust px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
          Aanbevolen
        </span>
      )}
      <div className={`text-[10px] font-mono uppercase tracking-widest mb-1 ${labelClass}`}>{scenario.naam}</div>
      <p className="mb-3 text-xs text-ink-muted">{scenario.beschrijving}</p>
      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-ink-muted">Besparing/jaar</span>
          <span className={`font-mono font-bold text-lg ${labelClass}`}>€{scenario.besparingJaarEur.toLocaleString('nl-NL')}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-ink-muted">Investering</span>
          <span className="font-mono text-sm text-ink">€{scenario.investeringEur.toLocaleString('nl-NL')}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-ink-muted">Terugverdientijd</span>
          <span className="font-mono text-sm text-ink">{scenario.terugverdientijdJaar >= 99 ? '—' : `${scenario.terugverdientijdJaar} jaar`}</span>
        </div>
      </div>
      {variant === 'red' && (
        <div className="mt-3 border-t border-danger/20 pt-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-danger">Saldering vervalt 1 jan 2027</span>
        </div>
      )}
    </div>
  )
}

function SliderInput({ label, value, onChange, min, max, step, unit, note }: {
  label: string; value: number; onChange: (v: number) => void
  min: number; max: number; step: number; unit: string; note?: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-xs font-semibold uppercase tracking-widest text-ink-muted">{label}</label>
        <span className="font-mono text-sm font-bold text-trust-dark">{value.toLocaleString('nl-NL')} {unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} aria-valuetext={`${value} ${unit}`}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink/10 accent-trust
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-trust
          [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2
          [&::-webkit-slider-thumb]:border-trust" />
      <div className="flex justify-between text-[10px] text-ink-muted">
        <span>{min.toLocaleString('nl-NL')} {unit}</span>
        {note && <span className="italic">{note}</span>}
        <span>{max.toLocaleString('nl-NL')} {unit}</span>
      </div>
    </div>
  )
}

export function Step2ROI({ state, dispatch }: Step2ROIProps) {
  const dakMax = Math.max(100, state.bagData?.dakOppervlakte ?? 100)

  const geschatVerbruik = state.bagData?.oppervlakte && state.bagData?.bouwjaar
    ? schatVerbruik(state.bagData.oppervlakte, state.bagData.bouwjaar)
    : 3500
  const verbruikMax = Math.max(25000, (state.bagData?.oppervlakte ?? 0) * 40)

  const [verbruik, setVerbruik] = useState<number>(state.roiResult?.geschatVerbruikKwh ?? geschatVerbruik)
  const [dakOpp, setDakOpp] = useState<number>(Math.min(state.bagData?.dakOppervlakte ?? 35, dakMax))
  const panelenMax = Math.max(40, Math.floor((dakMax * 0.70) / 4))
  const [panelen, setPanelen] = useState<number>(() => {
    if (state.huidige_panelen_aantal && state.huidige_panelen_aantal > 0) return state.huidige_panelen_aantal
    return state.roiResult?.aantalPanelen ?? (Math.floor((dakMax * 0.55) / 4) || 10)
  })
  const [kwhPerPaneel, setKwhPerPaneel] = useState(350)
  const [localRoi, setLocalRoi] = useState<ROIResult | null>(state.roiResult ?? null)
  const [loading, setLoading] = useState(false)
  const [roiError, setRoiError] = useState<string | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasLoadedOnce = useRef(false)

  const aanbevolenPanelen = Math.floor((dakOpp * 0.55) / 4) || 1

  useEffect(() => {
    if (state.heeft_panelen !== true || !state.huidige_panelen_aantal) return
    setPanelen(state.huidige_panelen_aantal)
  }, [state.heeft_panelen, state.huidige_panelen_aantal])

  useEffect(() => {
    if (!state.bagData?.oppervlakte || !state.bagData?.bouwjaar) return
    if (panelen === 0) return
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    const delay = hasLoadedOnce.current ? 500 : 0
    hasLoadedOnce.current = true
    debounceTimer.current = setTimeout(async () => {
      setLoading(true)
      setRoiError(null)
      try {
        const bag = state.bagData!
        const roiInput = {
          oppervlakte: bag.oppervlakte!,
          bouwjaar: bag.bouwjaar!,
          dakOppervlakte: dakOpp,
          huidigVerbruikKwh: verbruik,
          aantalPanelenOverride: panelen,
          kwhPerPaneel,
          dakrichting: state.dakrichting,
          huishouden_grootte: state.huishouden_grootte,
        } satisfies NonNullable<FunnelState['roiInput']>

        const res = await fetch('/api/roi', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...roiInput,
            netcongestieStatus: state.netcongestie?.status,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          setLocalRoi(data.roi)
          dispatch({ type: 'SET_ROI_INPUT', roiInput })
          dispatch({ type: 'SET_ROI', roiResult: data.roi })
          if (data.health) dispatch({ type: 'SET_HEALTH_SCORE', healthScore: data.health })
        } else {
          setRoiError('Herberekening mislukt. Probeer opnieuw.')
        }
      } catch {
        setRoiError('Herberekening mislukt. Controleer uw verbinding.')
      } finally { setLoading(false) }
    }, delay)
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verbruik, dakOpp, panelen, kwhPerPaneel, state.dakrichting, state.huishouden_grootte])

  const roi = localRoi

  return (
    <FunnelStageShell
      eyebrow="Stadium 2 van 4 · Uw situatie"
      title="Uw besparingsanalyse"
      description="Bevestig uw huidige situatie. We gebruiken deze invoer om uw persoonlijke 2027-impact opnieuw te berekenen."
    >

      <FunnelCard surface="mist" className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-widest text-trust-dark">Huidige situatie</div>
        <p className="text-sm leading-6 text-ink-muted">
          Dit is leidend voor het advies: met bestaande panelen verschuift de nadruk naar batterij en optimalisatie (niet naar nieuwe panelen als primaire stap).
        </p>
        <p id="st2-panelen-label" className="text-sm font-semibold text-ink">Heeft u nu al zonnepanelen?</p>
        <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby="st2-panelen-label">
          {([false, true] as const).map((val) => (
            <FunnelChoiceCard
              key={String(val)}
              selected={state.heeft_panelen === val}
              onClick={() => {
                dispatch({ type: 'SET_HEEFT_PANELEN', heeft_panelen: val })
                if (!val) {
                  dispatch({ type: 'SET_HUIDIGE_PANELEN_AANTAL', huidige_panelen_aantal: null })
                  setPanelen(Math.max(1, aanbevolenPanelen))
                }
              }}
            >
              {val ? 'Ja, ik heb panelen' : 'Nee, nog geen panelen'}
            </FunnelChoiceCard>
          ))}
        </div>
        {state.heeft_panelen === true && (
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-ink" htmlFor="st2-huidige-panelen">
              Hoeveel panelen liggen er nu op uw dak?
            </label>
            <input
              id="st2-huidige-panelen"
              type="number"
              min={1}
              max={200}
              inputMode="numeric"
              value={state.huidige_panelen_aantal ?? ''}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d]/g, '')
                const n = raw ? Number(raw) : null
                dispatch({
                  type: 'SET_HUIDIGE_PANELEN_AANTAL',
                  huidige_panelen_aantal: n && n > 0 && n <= 200 ? n : null,
                })
                if (n && n > 0 && n <= 200) setPanelen(n)
              }}
              placeholder="Bijv. 10"
              className="w-full min-w-0 rounded-xl border border-ink/15 bg-white px-4 py-3 font-mono text-base text-ink shadow-sm focus:border-trust focus:outline-none focus-visible:ring-3 focus-visible:ring-trust/35 sm:text-sm"
            />
          </div>
        )}
      </FunnelCard>

      <details className="group rounded-2xl border border-ink/10 bg-paper">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-sm font-semibold text-ink sm:px-5">
          <span>
            Berekening aanpassen
            <span className="mt-0.5 block text-xs font-normal text-ink-muted">Verbruik, dak, panelen en dakrichting</span>
          </span>
          <span className="text-trust-dark transition-transform group-open:rotate-180" aria-hidden="true">⌄</span>
        </summary>
        <div className="space-y-5 border-t border-ink/10 px-4 py-5 sm:px-5">
        <SliderInput label="Huidig verbruik" value={verbruik} onChange={(v) => {
          setVerbruik(v)
          dispatch({ type: 'SET_VERBRUIK_BRON', bron: 'gebruiker' })
        }} min={1000} max={verbruikMax} step={100} unit="kWh/jaar"
          note={state.bagData?.oppervlakte ? `Geschat o.b.v. ${state.bagData.oppervlakte}m²` : undefined} />
        <SliderInput label="Dakoppervlak" value={dakOpp} onChange={setDakOpp} min={10} max={dakMax} step={1} unit="m²"
          note={state.bagData?.dakOppervlakte ? `BAG: ${state.bagData.dakOppervlakte}m²` : undefined} />
        <SliderInput
          label={state.heeft_panelen === true ? 'Uw huidige panelen (scenario)' : 'Zonnepanelen (scenario)'}
          value={panelen}
          onChange={setPanelen}
          min={0}
          max={panelenMax}
          step={1}
          unit="stuks"
          note={state.heeft_panelen === true ? 'Gekoppeld aan stap 2 — pas eventueel aan voor uitbreiding' : '0 = toon advies'}
        />

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold uppercase tracking-widest text-ink-muted" htmlFor="st2-paneeltype">Paneeltype</label>
            <span className="font-mono text-sm text-trust-dark">{kwhPerPaneel} kWh/paneel</span>
          </div>
          <select
            id="st2-paneeltype"
            value={kwhPerPaneel}
            onChange={(e) => setKwhPerPaneel(Number(e.target.value))}
            className="w-full min-w-0 cursor-pointer rounded-xl border border-ink/15 bg-white px-4 py-3 font-mono text-base text-ink focus:border-trust focus:outline-none focus-visible:ring-3 focus-visible:ring-trust/35 sm:text-sm"
          >
            {PANEEL_TYPES.map((t) => (
              <option key={t.kwhPerPaneel} value={t.kwhPerPaneel}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Dakrichting */}
        <div className="space-y-2">
          <p id="st2-dakrichting-label" className="text-xs font-semibold uppercase tracking-widest text-ink-muted">
            Dakrichting <span className="normal-case">(optioneel)</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="group" aria-labelledby="st2-dakrichting-label">
            {(['Zuid', 'Oost/West', 'Noord'] as const).map(richting => (
              <FunnelChoiceCard
                key={richting}
                type="button"
                selected={state.dakrichting === richting}
                onClick={() => dispatch({ type: 'SET_DAKRICHTING', dakrichting: state.dakrichting === richting ? null : richting })}
                className="min-w-0 whitespace-nowrap px-1.5 text-center text-xs leading-tight"
              >
                {richting}
              </FunnelChoiceCard>
            ))}
            <FunnelChoiceCard
              selected={state.dakrichting === null}
              onClick={() => dispatch({ type: 'SET_DAKRICHTING', dakrichting: null })}
              className="min-w-0 whitespace-nowrap px-1.5 text-center text-xs leading-tight"
            >
              Onbekend
            </FunnelChoiceCard>
          </div>
          {state.dakrichting === 'Noord' && (
            <p className="text-xs text-warning">Noord-dak levert ~57% minder op. Batterij is extra waardevol.</p>
          )}
          {state.dakrichting === 'Zuid' && (
            <p className="text-xs text-trust-dark">Zuid-dak: optimale opbrengst (+23% t.o.v. gemiddeld).</p>
          )}
        </div>
        </div>
      </details>

      {roiError && (
        <FunnelNotice variant="danger">{roiError}</FunnelNotice>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-xs font-semibold text-trust-dark" role="status" aria-live="polite">
          <div className="h-3 w-3 animate-spin rounded-full border border-trust border-t-transparent" aria-hidden="true" />
          Herberekenen...
        </div>
      )}

      {panelen === 0 ? (
        <FunnelCard surface="trust" className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-widest text-trust-dark">Advies op basis van uw situatie</div>
          {state.heeft_panelen === true ? (
            <>
              <p className="text-sm leading-6 text-ink-muted">
                U heeft al panelen: de grootste hefboom richting 2027 is doorgaans <span className="font-bold text-ink">thuisbatterij + slim verbruik</span>.
                Optioneel kunt u uitbreiden met extra panelen tot ongeveer{' '}
                <span className="font-bold text-ink">{aanbevolenPanelen}</span> op dit dakmodel.
              </p>
              <button
                type="button"
                onClick={() => setPanelen(Math.max(1, state.huidige_panelen_aantal ?? aanbevolenPanelen))}
                className={funnelTextButtonClass}
              >
                Gebruik mijn huidige aantal / advies →
              </button>
            </>
          ) : (
            <>
              <p className="text-sm leading-6 text-ink-muted">
                Op basis van uw verbruik van{' '}
                <span className="font-bold text-ink">{verbruik.toLocaleString('nl-NL')} kWh/jaar</span>{' '}
                en <span className="font-bold text-ink">{dakOpp} m²</span> dakoppervlak
                adviseren wij{' '}
                <span className="font-bold text-ink">{aanbevolenPanelen} zonnepanelen</span> als instap-scenario.
              </p>
              <button
                type="button"
                onClick={() => setPanelen(aanbevolenPanelen)}
                className={funnelTextButtonClass}
              >
                Gebruik aanbevolen aantal →
              </button>
            </>
          )}
        </FunnelCard>
      ) : roi && (
        <>
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-muted">Scenariovergelijking</div>
            <div className="space-y-4">
              <ScenarioCard scenario={roi.scenarioNu} variant="amber" />
              <ScenarioCard scenario={roi.scenarioMetBatterij} variant="emerald" recommended />
              <ScenarioCard scenario={roi.scenarioWachten} variant="red" />
            </div>
          </div>
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-muted">2027 Urgentie</div>
            <Shock2027Banner shock={roi.shockEffect2027} besparingNu={roi.scenarioNu.besparingJaarEur} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Panelen', value: roi.aantalPanelen, unit: 'stuks' },
              { label: 'Productie', value: roi.productieKwh.toLocaleString('nl-NL'), unit: 'kWh/jaar' },
              { label: 'Eigengebruik', value: `${roi.eigenGebruikPct}%`, unit: 'van prod.' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-ink/10 bg-mist p-3 text-center">
                <div className="mb-1 text-xs font-semibold text-ink-muted">{s.label}</div>
                <div className="font-mono font-bold text-trust-dark">{s.value}</div>
                <div className="text-xs text-ink-muted">{s.unit}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {!state.bagData && (
        <FunnelNotice variant="warning">Ga terug naar stadium 1 om een adres op te zoeken.</FunnelNotice>
      )}

      <FunnelActions
        secondary={(
          <button onClick={() => dispatch({ type: 'SET_STEP', step: 1 })} className={funnelSecondaryButtonClass}>
            ← Terug
          </button>
        )}
        primary={(
          <button
            onClick={() => dispatch({ type: 'SET_STEP', step: 3 })}
            disabled={
              state.heeft_panelen === null
              || (state.heeft_panelen === true && (!state.huidige_panelen_aantal || state.huidige_panelen_aantal < 1))
              || !roi
              || panelen === 0
            }
            className={funnelPrimaryButtonClass}
          >
            Verfijn mijn advies
          </button>
        )}
      />
    </FunnelStageShell>
  )
}
