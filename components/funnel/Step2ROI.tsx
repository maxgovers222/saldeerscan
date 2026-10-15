'use client'

import { useState, useEffect, useRef, type Dispatch } from 'react'
import type { FunnelState, FunnelAction, ROIResult } from './types'
import { Shock2027Banner } from './Shock2027Banner'
import { schatVerbruik } from '@/lib/roi'
import { buildFunnelEventParams, trackEvent } from '@/lib/analytics'
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
  { label: 'Rekenvoorbeeld (350 kWh/jaar)', kwhPerPaneel: 350 },
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
  const labelClass = variant === 'emerald' ? 'text-trust-dark' : 'text-ink'
  const valueClass = variant === 'emerald' ? 'text-trust-dark' : 'text-ink'
  const bgClass = variant === 'red' ? 'bg-danger/5' : 'bg-paper'

  return (
    <div className={`${bgClass} border ${borderClass} relative rounded-xl p-4`}>
      {recommended && (
        <span className="absolute -top-2.5 left-4 rounded-full bg-trust px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-evergreen-950">
          Aanbevolen
        </span>
      )}
      <div className={`text-[10px] font-mono uppercase tracking-widest mb-1 ${labelClass}`}>{scenario.naam}</div>
      <p className="mb-3 text-xs text-ink-muted">{scenario.beschrijving}</p>
      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-ink-muted">Besparing/jaar</span>
          <span className={`font-mono text-lg font-bold ${valueClass}`}>€{scenario.besparingJaarEur.toLocaleString('nl-NL')}</span>
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
          <span className="text-[10px] font-semibold uppercase tracking-widest text-ink">Saldering vervalt 1 jan 2027</span>
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
  const [kwhPerPaneel, setKwhPerPaneel] = useState(state.roiInput?.kwhPerPaneel ?? 350)
  const [ownFigures, setOwnFigures] = useState<Partial<NonNullable<FunnelState['roiInput']>>>(state.roiInput ?? {})
  const requestSequence = useRef(0)
  const [localRoi, setLocalRoi] = useState<ROIResult | null>(state.roiResult ?? null)
  const [loading, setLoading] = useState(false)
  const [roiError, setRoiError] = useState<string | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasLoadedOnce = useRef(false)
  const hasReceivedResult = useRef(false)
  const trackedResultSession = useRef<string | null>(null)

  const aanbevolenPanelen = Math.floor((dakOpp * 0.55) / 4) || 1

  useEffect(() => {
    if (state.heeft_panelen !== true || !state.huidige_panelen_aantal) return
    setPanelen(state.huidige_panelen_aantal)
  }, [state.heeft_panelen, state.huidige_panelen_aantal])

  useEffect(() => {
    if (!state.bagData?.oppervlakte || !state.bagData?.bouwjaar) return
    if (panelen === 0) return
    setLocalRoi(null)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    const delay = hasLoadedOnce.current ? 500 : 0
    hasLoadedOnce.current = true
    debounceTimer.current = setTimeout(async () => {
      const sequence = ++requestSequence.current
      setLoading(true)
      setRoiError(null)
      try {
        const bag = state.bagData!
        const roiInput = {
          ...ownFigures,
          oppervlakte: bag.oppervlakte!,
          bouwjaar: bag.bouwjaar!,
          dakOppervlakte: dakOpp,
          huidigVerbruikKwh: verbruik,
          verbruikBron: state.verbruik_bron,
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
          if (sequence !== requestSequence.current) return
          hasReceivedResult.current = true
          setLocalRoi(data.roi)
          dispatch({ type: 'SET_ROI_INPUT', roiInput })
          dispatch({ type: 'SET_ROI', roiResult: data.roi })
          if (data.health) dispatch({ type: 'SET_HEALTH_SCORE', healthScore: data.health })
        } else {
          if (sequence !== requestSequence.current) return
          setRoiError('Herberekening mislukt. Probeer opnieuw.')
        }
      } catch {
        if (sequence !== requestSequence.current) return
        setRoiError('Herberekening mislukt. Controleer uw verbinding.')
      } finally { if (sequence === requestSequence.current) setLoading(false) }
    }, delay)
    return () => { requestSequence.current++; if (debounceTimer.current) clearTimeout(debounceTimer.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verbruik, dakOpp, panelen, kwhPerPaneel, state.dakrichting, state.huishouden_grootte, state.verbruik_bron, ownFigures])

  const roi = localRoi

  useEffect(() => {
    const session = state.funnelSessionId
    if (!roi || !hasReceivedResult.current || !session || trackedResultSession.current === session) return
    trackedResultSession.current = session
    const marker = `saldeerscan:result-viewed:${session}`
    try {
      if (sessionStorage.getItem(marker)) return
      sessionStorage.setItem(marker, '1')
    } catch { /* In-memory ref still avoids repeats in this mounted step. */ }
    const hasOverrides = state.verbruik_bron === 'gebruiker' || [ownFigures.jaarProductieKwh, ownFigures.directEigenGebruikPct, ownFigures.leveringstarief, ownFigures.teruglevertarief, ownFigures.terugleverkosten2027Eur].some(value => value !== undefined)
    trackEvent('roi_result_viewed', buildFunnelEventParams({ sessionId: session, attribution: state.attribution,
      stage: 2, extra: { calculation_source: hasOverrides ? 'with_user_overrides' : 'model_defaults' } }))
  }, [roi, state.funnelSessionId, state.attribution, state.verbruik_bron, ownFigures])

  return (
    <FunnelStageShell
      eyebrow="Stadium 2 van 4 · Uw situatie"
      title="Uw besparingsanalyse"
      description="Bevestig uw huidige situatie. We gebruiken deze invoer om uw persoonlijke 2027-impact opnieuw te berekenen."
    >

      <FunnelCard surface="mist" className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-widest text-trust-dark">Huidige situatie</div>
        <p className="text-sm leading-6 text-ink-muted">
          Met bestaande panelen vergelijken we uw huidige situatie met meer eigen gebruik. Een batterij is alleen een optie als het extra voordeel de investering rechtvaardigt.
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
            <span className="mt-0.5 block text-xs font-normal text-ink-muted">Uw jaarcijfers, contracttarieven, terugleverkosten en batterijscenario</span>
          </span>
          <span className="text-trust-dark transition-transform group-open:rotate-180" aria-hidden="true">⌄</span>
        </summary>
        <div className="space-y-5 border-t border-ink/10 px-4 py-5 sm:px-5">
        <p className="text-sm leading-6 text-ink-muted">Gebruik totaal jaarverbruik (inclusief eigen zonnestroom), uw omvormerproductie en uw energiecontract. Lege velden gebruiken de rekenvoorbeelden hieronder. Vul een kostenstaffel in als jaarbedrag bij deze teruglevering; het model herberekent staffels niet automatisch.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="roi-verbruik" className="mb-1.5 block text-sm font-semibold text-ink">Totaal jaarverbruik (kWh, inclusief zonnestroom)</label>
            <input id="roi-verbruik" type="number" min={0} max={verbruikMax} step={1} value={verbruik}
              onChange={event => { setVerbruik(Number(event.target.value)); dispatch({ type: 'SET_VERBRUIK_BRON', bron: 'gebruiker' }) }}
              className="w-full min-w-0 rounded-xl border border-ink/15 bg-white px-4 py-3 font-mono text-base text-ink focus-visible:ring-3 focus-visible:ring-trust/35" />
          </div>
          {([
            ['jaarProductieKwh', 'Jaarproductie zonnepanelen (kWh)', 0, 100000, 1, 'Dakmodel'],
            ['directEigenGebruikPct', 'Direct eigen gebruik (% productie)', 0, 100, 1, 'Huishoudschatting'],
            ['leveringstarief', 'Levering inclusief belasting (€/kWh)', 0, 2, 0.001, '0.40'],
            ['kaalLeveringstarief', 'Kaal leveringstarief (€/kWh)', 0, 2, 0.001, '0.18'],
            ['teruglevertarief', 'Bruto terugleververgoeding (€/kWh)', 0, 2, 0.001, '0.09'],
            ['terugleverkosten2026Eur', 'Terugleverkosten 2026 (€/jaar)', 0, 10000, 1, '0'],
            ['terugleverkosten2027Eur', 'Terugleverkosten 2027 (€/jaar)', 0, 10000, 1, '0'],
            ['terugleverkostenPerKwh2026', 'Extra kosten 2026 (€/teruggeleverde kWh)', 0, 2, 0.001, '0'],
            ['terugleverkostenPerKwh2027', 'Extra kosten 2027 (€/teruggeleverde kWh)', 0, 2, 0.001, '0'],
            ['batterijInvesteringEur', 'Batterijofferte inclusief installatie (€)', 0, 100000, 1, '4000'],
            ['batterijCapaciteitKwh', 'Batterijcapaciteit (kWh)', 0, 100, 0.1, '10'],
            ['batterijRendementPct', 'Batterijrendement (%)', 1, 100, 1, '90'],
            ['eigenGebruikMetBatterijPct', 'Doel eigen gebruik met batterij (%)', 0, 100, 1, 'Huishoudschatting'],
          ] as const).map(([key, label, min, max, step, placeholder]) => (
            <div key={key}>
              <label htmlFor={`roi-${key}`} className="mb-1.5 block text-sm font-semibold text-ink">{label}</label>
              <input id={`roi-${key}`} type="number" inputMode="decimal" min={min} max={max} step={step}
                placeholder={placeholder} value={ownFigures[key] ?? ''}
                onChange={event => setOwnFigures(previous => ({ ...previous, [key]: event.target.value === '' ? undefined : Number(event.target.value) }))}
                className="w-full min-w-0 rounded-xl border border-ink/15 bg-white px-4 py-3 font-mono text-base text-ink focus-visible:ring-3 focus-visible:ring-trust/35" />
            </div>
          ))}
        </div>
        <SliderInput label="Huidig verbruik" value={verbruik} onChange={(v) => {
          setVerbruik(v)
          dispatch({ type: 'SET_VERBRUIK_BRON', bron: 'gebruiker' })
        }} min={0} max={verbruikMax} step={100} unit="kWh/jaar"
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
            <p className="text-xs text-warning">Het dakmodel schat bij noord minder productie. Uw gemeten jaarproductie gaat voor.</p>
          )}
          {state.dakrichting === 'Zuid' && (
            <p className="text-xs text-trust-dark">Het dakmodel schat bij zuid meer productie. Schaduw en helling zijn niet gemeten.</p>
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
                U heeft al panelen: onderzoek eerst hoeveel stroom u direct gebruikt. Vergelijk een batterij vervolgens met uw eigen tarieven en een offerte.
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
              <ScenarioCard scenario={roi.scenarioNu} variant="amber" recommended={roi.aanbeveling === 'panelen' && roi.scenarioWachten.besparingJaarEur > 0} />
              <ScenarioCard scenario={roi.scenarioMetBatterij} variant="emerald" recommended={roi.aanbeveling === 'beide'} />
              <ScenarioCard scenario={roi.scenarioWachten} variant="red" />
            </div>
            {roi.calculation && <div className="mt-4 space-y-2 text-sm text-ink-muted">
              <p>{roi.aanbevelingTekst}</p>
              <details><summary className="cursor-pointer font-semibold text-ink">Invoer en aannames</summary>
                <ul className="mt-2 list-disc space-y-2 pl-5">{roi.calculation.assumptions.map(line => <li key={line}>{line}</li>)}</ul>
              </details>
            </div>}
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
              || !roi || loading || !!roiError
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
