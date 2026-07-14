'use client'

import { useReducer, useEffect, useMemo, useState, useRef, type Dispatch } from 'react'
import type {
  FunnelState,
  FunnelAction,
  HealthScoreResult,
  ROIResult,
} from './types'
import {
  funnelReducer,
  makeInitialState,
  mergeSavedState,
  parseFunnelUrlContext,
} from './funnel-state'
import {
  clearStoredFunnel,
  loadStoredFunnel,
  saveStoredFunnel,
} from './funnel-storage'
import { trackEvent } from '@/lib/analytics'
import { parseStoredRoi } from '@/lib/roi-result-guard'
import {
  REPORT_MODEL_VERSION,
  type NormalizedReport,
} from '@/lib/report-model'
import { FunnelProgress } from './FunnelProgress'
import { Step1Adres } from './Step1Adres'
import { Step2ROI } from './Step2ROI'
import { Step3Meterkast } from './Step3Meterkast'
import { Step4Plaatsing } from './Step4Plaatsing'
import { Step5Omvormer } from './Step5Omvormer'
import { Step6LeadCapture } from './Step6LeadCapture'
import { PDFDownloadButton } from './PDFDownloadButton'
import { ResultsDashboard } from './ResultsDashboard'

function hydrateLegacyReportDisplay(
  report: NormalizedReport,
  dispatch: Dispatch<FunnelAction>,
) {
  const hasBattery = report.recommendation.batteryCapacityKwh !== null
  const roiResult: ROIResult = {
    geschatVerbruikKwh: report.recommendation.consumptionKwh,
    aantalPanelen: report.recommendation.panelCount,
    productieKwh: report.recommendation.productionKwh,
    eigenGebruikPct: report.recommendation.ownUsePct,
    scenarioNu: report.scenarios.panelsNow,
    scenarioMetBatterij: report.scenarios.withBattery,
    scenarioWachten: report.scenarios.waitUntil2027,
    shockEffect2027: {
      jaarlijksVerlies: report.impact.annualLossEur,
      cumulatiefVerlies5Jaar: report.impact.fiveYearLossEur,
      maandelijksVerlies: report.impact.monthlyLossEur,
      boodschap: report.impact.explanation,
    },
    aanbeveling: hasBattery ? 'beide' : 'panelen',
    aanbevelingTekst: report.recommendation.explanation,
    isdeSchatting: {
      bedragEur: report.recommendation.isdeAmountEur,
      apparaatType: hasBattery ? 'Thuisbatterij' : 'Zonnepanelen',
      vermogenKwp: Math.round(report.recommendation.panelCount * 4) / 10,
    },
  }
  dispatch({ type: 'SET_ADRES', adres: report.home.address })
  dispatch({
    type: 'SET_WIJK',
    wijk: report.home.wijk ?? '',
    stad: report.home.stad ?? '',
  })
  dispatch({ type: 'SET_ROI', roiResult })
  if (report.grid.status) {
    dispatch({
      type: 'SET_NETCONGESTIE',
      netcongestie: {
        status: report.grid.status,
        netbeheerder: report.grid.operator ?? '',
        uitleg: report.grid.explanation ?? '',
        terugleveringBeperkt: report.grid.status !== 'GROEN',
      },
    })
  }
  if (report.summary.healthScore !== null) {
    const score = report.summary.healthScore
    const healthScore: HealthScoreResult = {
      score,
      label: score >= 75 ? 'Uitstekend' : score >= 55 ? 'Goed' : score >= 35 ? 'Matig' : 'Slecht',
      kleur: score >= 75 ? 'groen' : score >= 55 ? 'geel' : score >= 35 ? 'oranje' : 'rood',
      breakdown: { bouwjaar: 0, energielabel: 0, dakpotentieel: 0, netcongestie: 0 },
      aanbevelingen: report.recommendations,
    }
    dispatch({ type: 'SET_HEALTH_SCORE', healthScore })
  }
  dispatch({ type: 'SET_METERKAST', meterkastAnalyse: report.technical.meterkast })
  dispatch({ type: 'SET_PLAATSING', plaatsingsAnalyse: report.technical.plaatsing })
  dispatch({ type: 'SET_OMVORMER', omvormerAnalyse: report.technical.omvormer })
  dispatch({ type: 'SET_IS_EIGENAAR', is_eigenaar: report.qualification.isEigenaar })
  dispatch({ type: 'SET_HEEFT_PANELEN', heeft_panelen: report.qualification.heeftPanelen })
  dispatch({
    type: 'SET_HUIDIGE_PANELEN_AANTAL',
    huidige_panelen_aantal: report.qualification.huidigePanelenAantal,
  })
}

export function useFunnelState() {
  return useReducer(funnelReducer, makeInitialState())
}

export function FunnelContainer({ urlParams }: {
  urlParams: Record<string, string>
}) {
  const urlContext = useMemo(
    () => parseFunnelUrlContext(new URLSearchParams(urlParams)),
    [urlParams],
  )
  const [state, dispatch] = useReducer(funnelReducer, urlContext, context =>
    makeInitialState({
      adres: context.adres,
      wijk: context.attribution.wijk ?? '',
      stad: context.attribution.stad ?? '',
      attribution: context.attribution,
    }))
  const [savedState, setSavedState] = useState<FunnelState | null>(null)
  const [resumeBannerDismissed, setResumeBannerDismissed] = useState(false)
  const leadIdParam = urlContext.leadId
  const leadReportTokenParam = urlContext.token

  function trackingDispatch(action: FunnelAction) {
    // Only track forward navigation — backward steps are not completions
    if (action.type === 'SET_STEP' && action.step > state.step) {
      trackEvent('funnel_step_complete', { step: state.step, next_step: action.step })
    }
    dispatch(action)
  }

  // Load saved state on mount (client only) — always, even with URL params
  useEffect(() => {
    const loaded = loadStoredFunnel()
    if (loaded && urlContext.allowResume) setSavedState(loaded)
  }, [urlContext.allowResume])

  // Detect ?leadId= URL param — direct link vanuit bevestigingsmail naar ResultsDashboard
  useEffect(() => {
    if (!leadIdParam) return
    const leadId = leadIdParam

    // Zonder token-param (bv. gehardcode ?leadId= zonder &token=) hoeft de token niet te
    // matchen — anders herlaadt dit effect eindeloos: elke succesvolle fetch dispatcht een
    // NIEUWE roiResult-referentie (dependency), waardoor alreadySynced anders altijd false
    // bleef en de server-fetch bij elke render opnieuw afging.
    const alreadySynced =
      state.leadId === leadId
      && (
        state.reportModel?.version === REPORT_MODEL_VERSION
        || parseStoredRoi(state.roiResult) !== null
      )
      && (leadReportTokenParam ? state.leadReportToken === leadReportTokenParam : true)
    if (alreadySynced) return

    let cancelled = false
    dispatch({ type: 'SET_LEAD_ID', leadId })
    dispatch({ type: 'SET_LOADING', loading: true })
    dispatch({ type: 'SET_ERROR', error: null })

    async function hydrateFromServer() {
      try {
        const tokenQs = leadReportTokenParam
          ? `?token=${encodeURIComponent(leadReportTokenParam)}`
          : ''
        const response = await fetch(`/api/leads/${encodeURIComponent(leadId)}${tokenQs}`)
        if (!response.ok) {
          if (!cancelled) {
            let msg = 'Rapport kon niet worden geladen. Probeer het later opnieuw.'
            if (response.status === 404) {
              msg = 'Rapport niet gevonden. Controleer de link in uw e-mail.'
            } else if (response.status === 401) {
              try {
                const errBody = (await response.json()) as { error?: string }
                msg = errBody.error ?? msg
              } catch {
                msg =
                  'Deze rapportlink is ongeldig of verlopen. Open de link uit uw bevestigingsmail, of start een nieuwe check.'
              }
            }
            dispatch({ type: 'SET_ERROR', error: msg })
          }
          return
        }
        const data = await response.json() as {
          adres?: string
          wijk?: string
          stad?: string
          bagData?: FunnelState['bagData']
          roiResult?: unknown
          netcongestie?: FunnelState['netcongestie']
          healthScore?: FunnelState['healthScore']
          meterkastAnalyse?: FunnelState['meterkastAnalyse']
          plaatsingsAnalyse?: FunnelState['plaatsingsAnalyse']
          omvormerAnalyse?: FunnelState['omvormerAnalyse']
          isEigenaar?: boolean | null
          heeftPanelen?: boolean | null
          huidigePanelenAantal?: number | null
          dakrichting?: FunnelState['dakrichting']
          verbruik_bron?: FunnelState['verbruik_bron']
          huishouden_grootte?: FunnelState['huishouden_grootte']
          report?: NormalizedReport
        }
        if (cancelled) return

        const serverReport = data.report?.version === REPORT_MODEL_VERSION
          ? data.report
          : null
        if (serverReport) {
          dispatch({ type: 'SET_REPORT_MODEL', report: serverReport })
          hydrateLegacyReportDisplay(serverReport, dispatch)
          trackEvent('report_reopened', {
            report_version: serverReport.version,
            email_status: serverReport.delivery.emailStatus,
          })
        }

        if (data.adres) dispatch({ type: 'SET_ADRES', adres: data.adres })
        if (data.wijk || data.stad) dispatch({ type: 'SET_WIJK', wijk: data.wijk ?? '', stad: data.stad ?? '' })
        if (data.bagData) dispatch({ type: 'SET_BAG_DATA', bagData: data.bagData })
        if (data.netcongestie) dispatch({ type: 'SET_NETCONGESTIE', netcongestie: data.netcongestie })
        if (data.healthScore) dispatch({ type: 'SET_HEALTH_SCORE', healthScore: data.healthScore })
        if (data.meterkastAnalyse) dispatch({ type: 'SET_METERKAST', meterkastAnalyse: data.meterkastAnalyse })
        if (data.plaatsingsAnalyse) dispatch({ type: 'SET_PLAATSING', plaatsingsAnalyse: data.plaatsingsAnalyse })
        if (data.omvormerAnalyse) dispatch({ type: 'SET_OMVORMER', omvormerAnalyse: data.omvormerAnalyse })
        if ('isEigenaar' in data) {
          dispatch({ type: 'SET_IS_EIGENAAR', is_eigenaar: data.isEigenaar ?? null })
        }
        if ('heeftPanelen' in data) {
          dispatch({ type: 'SET_HEEFT_PANELEN', heeft_panelen: data.heeftPanelen ?? null })
        }
        if ('huidigePanelenAantal' in data) {
          dispatch({
            type: 'SET_HUIDIGE_PANELEN_AANTAL',
            huidige_panelen_aantal: typeof data.huidigePanelenAantal === 'number' ? data.huidigePanelenAantal : null,
          })
        }
        if ('dakrichting' in data) {
          dispatch({ type: 'SET_DAKRICHTING', dakrichting: data.dakrichting ?? null })
        }
        if ('verbruik_bron' in data) {
          dispatch({ type: 'SET_VERBRUIK_BRON', bron: data.verbruik_bron ?? 'schatting' })
        }
        if ('huishouden_grootte' in data) {
          dispatch({ type: 'SET_HUISHOUDEN', grootte: data.huishouden_grootte ?? null })
        }

        const roiParsed = parseStoredRoi(data.roiResult)
        if (roiParsed) {
          dispatch({ type: 'SET_ROI', roiResult: roiParsed as NonNullable<FunnelState['roiResult']> })
        }
        if (serverReport || roiParsed) {
          dispatch({ type: 'SET_ERROR', error: null })
          if (leadReportTokenParam) {
            dispatch({ type: 'SET_LEAD_REPORT_TOKEN', token: leadReportTokenParam })
          }
        } else {
          dispatch({
            type: 'SET_ERROR',
            error: 'Rapportdata is onvolledig of verlopen (geen geldige ROI opgeslagen). Start opnieuw via de check of neem contact op via info@saldeerscan.nl.',
          })
        }
      } catch {
        const loaded = loadStoredFunnel()
        if (cancelled || !loaded) {
          if (!cancelled) {
            dispatch({
              type: 'SET_ERROR',
              error: 'Rapport kon niet worden geladen. Controleer uw verbinding en probeer opnieuw.',
            })
          }
          return
        }
        const roiParsed = parseStoredRoi(loaded.roiResult)
        if (!roiParsed) {
          if (!cancelled) {
            dispatch({
              type: 'SET_ERROR',
              error: 'Geen geldig rapport in deze browser gevonden. Open de link op hetzelfde apparaat waar u de check afrondde, of start opnieuw.',
            })
          }
          return
        }
        if (loaded.bagData) dispatch({ type: 'SET_BAG_DATA', bagData: loaded.bagData })
        dispatch({ type: 'SET_ROI', roiResult: roiParsed as NonNullable<FunnelState['roiResult']> })
        if (loaded.netcongestie) dispatch({ type: 'SET_NETCONGESTIE', netcongestie: loaded.netcongestie })
        if (loaded.healthScore) dispatch({ type: 'SET_HEALTH_SCORE', healthScore: loaded.healthScore })
        if (loaded.adres) dispatch({ type: 'SET_ADRES', adres: loaded.adres })
        if (loaded.wijk || loaded.stad) dispatch({ type: 'SET_WIJK', wijk: loaded.wijk, stad: loaded.stad })
        dispatch({ type: 'SET_IS_EIGENAAR', is_eigenaar: loaded.is_eigenaar ?? null })
        dispatch({ type: 'SET_HEEFT_PANELEN', heeft_panelen: loaded.heeft_panelen ?? null })
        dispatch({ type: 'SET_HUIDIGE_PANELEN_AANTAL', huidige_panelen_aantal: loaded.huidige_panelen_aantal ?? null })
        dispatch({ type: 'SET_ERROR', error: null })
      } finally {
        if (!cancelled) dispatch({ type: 'SET_LOADING', loading: false })
      }
    }

    hydrateFromServer()
    return () => { cancelled = true }
  }, [
    leadIdParam,
    leadReportTokenParam,
    state.leadId,
    state.leadReportToken,
    state.reportModel,
    state.roiResult,
  ])

  // Save state on every change — debounced to avoid excessive I/O
  useEffect(() => {
    if (savedState && !resumeBannerDismissed) return
    const t = setTimeout(() => saveStoredFunnel(state), 500)
    return () => clearTimeout(t)
  }, [state, savedState, resumeBannerDismissed])

  // Track funnel abandonment on page unload (only if no lead submitted yet)
  useEffect(() => {
    const handleUnload = () => {
      if (!state.leadId) {
        trackEvent('funnel_abandoned', {
          step: state.step,
          max_step_reached: state.step,
        })
      }
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [state.step, state.leadId])

  // Track lead submission
  useEffect(() => {
    if (state.leadId) trackEvent('lead_submitted', { lead_id: state.leadId })
  }, [state.leadId])

  // Scroll to top on forward navigation only
  const prevStepRef = useRef(state.step)
  useEffect(() => {
    if (state.step > prevStepRef.current && typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    prevStepRef.current = state.step
  }, [state.step])

  function resumeSavedState() {
    if (!savedState) return
    dispatch({
      type: 'RESTORE_STATE',
      state: mergeSavedState(state, savedState, urlContext, 'resume-saved'),
    })
    setSavedState(null)
  }

  function keepCurrentUrlState() {
    if (!savedState) return
    dispatch({
      type: 'RESTORE_STATE',
      state: mergeSavedState(state, savedState, urlContext, 'keep-current'),
    })
    clearStoredFunnel()
    setSavedState(null)
    setResumeBannerDismissed(true)
  }

  function startOver() {
    clearStoredFunnel()
    setSavedState(null)
    setResumeBannerDismissed(true)
  }

  const showResumeBanner = urlContext.allowResume
    && !state.leadId
    && savedState
    && !resumeBannerDismissed
  const reportReady = state.reportModel?.version === REPORT_MODEL_VERSION

  return (
    <div className="space-y-6 min-w-0 w-full">
      {showResumeBanner && (
        <div className="md:max-w-xl md:mx-auto rounded-xl border border-amber-500/30 bg-amber-950/30 px-4 py-3 flex flex-wrap items-center justify-between gap-3 min-w-0">
          <div className="text-sm font-mono text-amber-300 min-w-0 break-words">
            <span className="font-bold">Vorige sessie gevonden</span> — stap {savedState.step}/6 ({savedState.adres || 'adres opgeslagen'})
          </div>
          <div className="flex gap-2 shrink-0">
            {urlContext.mode === 'address' ? (
              <>
                <button onClick={keepCurrentUrlState}
                  className="text-xs bg-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:opacity-90">
                  Deze link gebruiken
                </button>
                <button onClick={resumeSavedState}
                  className="text-xs font-mono text-amber-400/70 hover:text-amber-300 px-2 py-1.5 transition-colors">
                  Doorgaan met vorige sessie
                </button>
              </>
            ) : (
              <>
                <button onClick={resumeSavedState}
                  className="text-xs bg-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:opacity-90">
                  Doorgaan
                </button>
                <button onClick={startOver}
                  className="text-xs font-mono text-amber-400/70 hover:text-amber-300 px-2 py-1.5 transition-colors">
                  Opnieuw
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {/* ResultsDashboard — een geldig servermodel is leidend, ook na localStorage-herstel. */}
      {state.leadId || reportReady ? (
        <div className="overflow-hidden rounded-2xl border border-ink/10 bg-paper shadow-[0_8px_32px_rgba(0,0,0,0.18)] min-w-0">
          {state.loading ? (
            <div className="p-10 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-10 h-10 border-2 border-action border-t-transparent rounded-full animate-spin" aria-hidden />
              <p className="text-sm font-mono text-ink-muted">Rapport laden…</p>
            </div>
          ) : !reportReady ? (
            <div className="p-8 space-y-4 text-center">
              <p className="text-sm font-sans text-ink-muted leading-relaxed">
                {state.error ?? 'Onvoldoende data om het rapport te tonen. Het opgeslagen rapport ontbreekt of is ongeldig.'}
              </p>
              <a
                href="/check"
                className="inline-flex items-center justify-center gap-2 text-sm font-bold bg-action text-evergreen-950 px-5 py-2.5 rounded-full"
              >
                Nieuwe check starten
              </a>
            </div>
          ) : (
            <>
              <ResultsDashboard report={state.reportModel!} />
              <div className="border-t border-ink/10 bg-paper px-4 pb-8 pt-3 sm:px-8">
                <div className="mx-auto max-w-md">
                  <PDFDownloadButton report={state.reportModel!} />
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="md:max-w-xl md:mx-auto min-w-0">
          <FunnelProgress currentStep={state.step} />
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-2xl overflow-hidden min-w-0">
            {state.step === 1 && <Step1Adres state={state} dispatch={trackingDispatch} />}
            {state.step === 2 && <Step2ROI state={state} dispatch={trackingDispatch} />}
            {state.step === 3 && <Step3Meterkast state={state} dispatch={trackingDispatch} />}
            {state.step === 4 && <Step4Plaatsing state={state} dispatch={trackingDispatch} />}
            {state.step === 5 && <Step5Omvormer state={state} dispatch={trackingDispatch} />}
            {state.step === 6 && <Step6LeadCapture state={state} dispatch={trackingDispatch} />}
          </div>
        </div>
      )}
    </div>
  )
}
