'use client'

import { useReducer, useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import type { FunnelState, FunnelAction, HealthScoreResult, ROIResult, MeterkastAnalyse, PlaatsingsAnalyse, OmvormerAnalyse } from './types'
import { trackEvent } from '@/lib/analytics'

const STORAGE_KEY = 'wep_funnel_state'

function saveState(state: FunnelState) {
  try {
    // Exclude nothing serializable — no File objects in state
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch { /* quota exceeded or SSR */ }
}

function loadState(): FunnelState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as FunnelState
    // Only restore if there's real progress (past step 1 or has data)
    if (parsed.step <= 1 && !parsed.bagData) return null
    return parsed
  } catch { return null }
}
import { FunnelProgress } from './FunnelProgress'
import { Step1Adres } from './Step1Adres'
import { Step2ROI } from './Step2ROI'
import { Step3Meterkast } from './Step3Meterkast'
import { Step4Plaatsing } from './Step4Plaatsing'
import { Step5Omvormer } from './Step5Omvormer'
import { Step6LeadCapture } from './Step6LeadCapture'
import { ResultsDashboard } from './ResultsDashboard'

function funnelReducer(state: FunnelState, action: FunnelAction): FunnelState {
  switch (action.type) {
    case 'SET_STEP': return { ...state, step: action.step, error: null }
    case 'SET_WIJK': return { ...state, wijk: action.wijk, stad: action.stad }
    case 'SET_BAG_DATA': return { ...state, bagData: action.bagData }
    case 'SET_NETCONGESTIE': return { ...state, netcongestie: action.netcongestie }
    case 'SET_HEALTH_SCORE': return { ...state, healthScore: action.healthScore }
    case 'SET_ROI': return { ...state, roiResult: action.roiResult }
    case 'SET_METERKAST': return { ...state, meterkastAnalyse: action.meterkastAnalyse }
    case 'SET_PLAATSING': return { ...state, plaatsingsAnalyse: action.plaatsingsAnalyse }
    case 'SET_OMVORMER': return { ...state, omvormerAnalyse: action.omvormerAnalyse }
    case 'SET_LEAD_ID': return { ...state, leadId: action.leadId }
    case 'SET_ADRES': return { ...state, adres: action.adres }
    case 'SET_LOADING': return { ...state, loading: action.loading }
    case 'SET_ERROR': return { ...state, error: action.error }
    case 'SET_UTM_PARAMS': return { ...state, utmParams: action.utmParams }
    case 'SET_DAKRICHTING': return { ...state, dakrichting: action.dakrichting }
    case 'SET_VERBRUIK_BRON': return { ...state, verbruik_bron: action.bron }
    case 'SET_HUISHOUDEN': return { ...state, huishouden_grootte: action.grootte }
    case 'SET_IS_EIGENAAR': return { ...state, is_eigenaar: action.is_eigenaar }
    case 'SET_HEEFT_PANELEN': return { ...state, heeft_panelen: action.heeft_panelen }
    case 'SET_HUIDIGE_PANELEN_AANTAL': return { ...state, huidige_panelen_aantal: action.huidige_panelen_aantal }
    default: return state
  }
}

function makeInitialState(initialAdres = '', initialWijk = '', initialStad = ''): FunnelState {
  return {
    step: 1,
    adres: initialAdres,
    wijk: initialWijk,
    stad: initialStad,
    bagData: null,
    netcongestie: null,
    healthScore: null,
    roiResult: null,
    meterkastAnalyse: null,
    plaatsingsAnalyse: null,
    omvormerAnalyse: null,
    dakrichting: null,
    verbruik_bron: 'schatting',
    huishouden_grootte: null,
    is_eigenaar: null,
    heeft_panelen: null,
    huidige_panelen_aantal: null,
    leadId: null,
    loading: false,
    error: null,
    utmParams: null,
  }
}

export function useFunnelState() {
  return useReducer(funnelReducer, makeInitialState())
}

export function FunnelContainer({ initialAdres = '', initialWijk = '', initialStad = '' }: {
  initialAdres?: string
  initialWijk?: string
  initialStad?: string
}) {
  const [state, dispatch] = useReducer(funnelReducer, makeInitialState(initialAdres, initialWijk, initialStad))
  const [savedState, setSavedState] = useState<FunnelState | null>(null)
  const [resumeBannerDismissed, setResumeBannerDismissed] = useState(false)
  const searchParams = useSearchParams()

  function trackingDispatch(action: FunnelAction) {
    // Only track forward navigation — backward steps are not completions
    if (action.type === 'SET_STEP' && action.step > state.step) {
      trackEvent('funnel_step_complete', { step: state.step, next_step: action.step })
    }
    dispatch(action)
  }

  // Capture UTM params at mount — eenmalig. landingPage zonder UTM query zodat grouping in GA4 klopt.
  useEffect(() => {
    const source = searchParams.get('utm_source')
    const medium = searchParams.get('utm_medium')
    const campaign = searchParams.get('utm_campaign')
    const landingPage = typeof window !== 'undefined'
      ? window.location.origin + window.location.pathname
      : null

    if (source || medium || campaign) {
      dispatch({ type: 'SET_UTM_PARAMS', utmParams: { source, medium, campaign, landingPage } })
    }
  // searchParams is stable per Next.js App Router — intentioneel lege deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load saved state on mount (client only) — always, even with URL params
  useEffect(() => {
    const loaded = loadState()
    if (loaded) setSavedState(loaded)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Detect ?leadId= URL param — direct link vanuit bevestigingsmail naar ResultsDashboard
  useEffect(() => {
    const leadIdParam = searchParams.get('leadId')
    if (leadIdParam) {
      dispatch({ type: 'SET_LEAD_ID', leadId: leadIdParam })
      // Herstel ook localStorage-state als die er is (voor ROI/adres context)
      const loaded = loadState()
      if (loaded) {
        if (loaded.bagData) dispatch({ type: 'SET_BAG_DATA', bagData: loaded.bagData })
        if (loaded.roiResult) dispatch({ type: 'SET_ROI', roiResult: loaded.roiResult })
        if (loaded.netcongestie) dispatch({ type: 'SET_NETCONGESTIE', netcongestie: loaded.netcongestie })
        if (loaded.healthScore) dispatch({ type: 'SET_HEALTH_SCORE', healthScore: loaded.healthScore })
        if (loaded.adres) dispatch({ type: 'SET_ADRES', adres: loaded.adres })
        if (loaded.wijk || loaded.stad) dispatch({ type: 'SET_WIJK', wijk: loaded.wijk, stad: loaded.stad })
        dispatch({ type: 'SET_IS_EIGENAAR', is_eigenaar: loaded.is_eigenaar ?? null })
        dispatch({ type: 'SET_HEEFT_PANELEN', heeft_panelen: loaded.heeft_panelen ?? null })
        dispatch({ type: 'SET_HUIDIGE_PANELEN_AANTAL', huidige_panelen_aantal: loaded.huidige_panelen_aantal ?? null })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Save state on every change — debounced to avoid excessive I/O
  useEffect(() => {
    const t = setTimeout(() => saveState(state), 500)
    return () => clearTimeout(t)
  }, [state])

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
    if (savedState.wijk || savedState.stad) {
      dispatch({ type: 'SET_WIJK', wijk: savedState.wijk, stad: savedState.stad })
    }
    Object.entries({
      adres: savedState.adres,
      bagData: savedState.bagData,
      netcongestie: savedState.netcongestie,
      healthScore: savedState.healthScore,
      roiResult: savedState.roiResult,
      meterkastAnalyse: savedState.meterkastAnalyse,
      plaatsingsAnalyse: savedState.plaatsingsAnalyse,
      omvormerAnalyse: savedState.omvormerAnalyse,
      is_eigenaar: savedState.is_eigenaar,
      heeft_panelen: savedState.heeft_panelen,
      huidige_panelen_aantal: savedState.huidige_panelen_aantal,
    }).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        const actionMap: Record<string, FunnelAction['type']> = {
          adres: 'SET_ADRES', bagData: 'SET_BAG_DATA', netcongestie: 'SET_NETCONGESTIE',
          healthScore: 'SET_HEALTH_SCORE', roiResult: 'SET_ROI', meterkastAnalyse: 'SET_METERKAST',
          plaatsingsAnalyse: 'SET_PLAATSING', omvormerAnalyse: 'SET_OMVORMER',
          is_eigenaar: 'SET_IS_EIGENAAR', heeft_panelen: 'SET_HEEFT_PANELEN', huidige_panelen_aantal: 'SET_HUIDIGE_PANELEN_AANTAL',
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dispatch({ type: actionMap[key]!, [key]: value } as any)
      }
    })
    dispatch({ type: 'SET_STEP', step: savedState.step })
    setSavedState(null)
  }

  const showResumeBanner = savedState && !resumeBannerDismissed

  return (
    <div className="space-y-6">
      {showResumeBanner && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 px-4 py-3 flex items-center justify-between gap-3">
          <div className="text-sm font-mono text-amber-300">
            <span className="font-bold">Vorige sessie gevonden</span> — stap {savedState.step}/6 ({savedState.adres || 'adres opgeslagen'})
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={resumeSavedState}
              className="text-xs bg-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:opacity-90">
              Doorgaan
            </button>
            <button onClick={() => { setResumeBannerDismissed(true); localStorage.removeItem(STORAGE_KEY) }}
              className="text-xs font-mono text-amber-400/70 hover:text-amber-300 px-2 py-1.5 transition-colors">
              Opnieuw
            </button>
          </div>
        </div>
      )}
      {/* ResultsDashboard — toon als lead ingediend is (ook via ?leadId= email-link) */}
      {state.leadId ? (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-2xl overflow-hidden">
          <ResultsDashboard state={state} />
        </div>
      ) : (
        <>
          <FunnelProgress currentStep={state.step} />
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-2xl overflow-hidden">
            {state.step === 1 && <Step1Adres state={state} dispatch={trackingDispatch} />}
            {state.step === 2 && <Step2ROI state={state} dispatch={trackingDispatch} />}
            {state.step === 3 && <Step3Meterkast state={state} dispatch={trackingDispatch} />}
            {state.step === 4 && <Step4Plaatsing state={state} dispatch={trackingDispatch} />}
            {state.step === 5 && <Step5Omvormer state={state} dispatch={trackingDispatch} />}
            {state.step === 6 && <Step6LeadCapture state={state} dispatch={trackingDispatch} />}
          </div>
        </>
      )}
    </div>
  )
}
