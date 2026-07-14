import type {
  FunnelAction,
  FunnelState,
  FunnelStep,
  VisualFunnelStage,
} from './types'

export function visualStageForStep(step: FunnelStep): VisualFunnelStage {
  if (step === 1) return 1
  if (step === 2) return 2
  if (step <= 5) return 3
  return 4
}

export function makeInitialState(input: {
  adres?: string
  wijk?: string
  stad?: string
  attribution?: Partial<FunnelState['attribution']>
} = {}): FunnelState {
  return {
    step: 1,
    adres: input.adres ?? '',
    wijk: input.wijk ?? '',
    stad: input.stad ?? '',
    bagData: null,
    netcongestie: null,
    healthScore: null,
    roiResult: null,
    roiInput: null,
    reportModel: null,
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
    leadReportToken: null,
    loading: false,
    error: null,
    funnelSessionId: null,
    attribution: {
      landingPath: input.attribution?.landingPath ?? '/check',
      pseoLevel: input.attribution?.pseoLevel ?? 'home',
      provincie: input.attribution?.provincie ?? null,
      stad: input.attribution?.stad ?? input.stad ?? null,
      wijk: input.attribution?.wijk ?? input.wijk ?? null,
      straat: input.attribution?.straat ?? null,
      postcode: input.attribution?.postcode ?? null,
      utmSource: input.attribution?.utmSource ?? null,
      utmMedium: input.attribution?.utmMedium ?? null,
      utmCampaign: input.attribution?.utmCampaign ?? null,
    },
  }
}

export interface FunnelUrlContext {
  mode: 'report' | 'address' | 'pseo' | 'generic'
  allowResume: boolean
  leadId: string | null
  token: string | null
  adres: string
  attribution: FunnelState['attribution']
}

export function parseFunnelUrlContext(params: URLSearchParams): FunnelUrlContext {
  const leadId = params.get('leadId')
  const token = params.get('token')
  const adres = params.get('adres')?.trim() ?? ''
  const pseoLevel = params.get('pseo_level')
  const hasPseo = Boolean(pseoLevel || params.get('wijk') || params.get('stad'))
  const mode = leadId ? 'report' : adres ? 'address' : hasPseo ? 'pseo' : 'generic'
  return {
    mode,
    allowResume: mode !== 'report',
    leadId,
    token,
    adres,
    attribution: {
      landingPath: params.get('landing_path') ?? '/check',
      pseoLevel: (
        ['home', 'provincie', 'stad', 'wijk', 'straat', 'postcode', 'kennisbank', 'nieuws']
          .includes(pseoLevel ?? '')
          ? pseoLevel
          : 'home'
      ) as FunnelState['attribution']['pseoLevel'],
      provincie: params.get('provincie'),
      stad: params.get('stad'),
      wijk: params.get('wijk'),
      straat: params.get('straat'),
      postcode: params.get('postcode'),
      utmSource: params.get('utm_source'),
      utmMedium: params.get('utm_medium'),
      utmCampaign: params.get('utm_campaign'),
    },
  }
}

function mergeAttribution(
  saved: FunnelState['attribution'],
  url: FunnelUrlContext,
): FunnelState['attribution'] {
  if (url.mode === 'generic') {
    return {
      ...saved,
      utmSource: url.attribution.utmSource ?? saved.utmSource,
      utmMedium: url.attribution.utmMedium ?? saved.utmMedium,
      utmCampaign: url.attribution.utmCampaign ?? saved.utmCampaign,
    }
  }
  return {
    ...saved,
    ...url.attribution,
    utmSource: url.attribution.utmSource ?? saved.utmSource,
    utmMedium: url.attribution.utmMedium ?? saved.utmMedium,
    utmCampaign: url.attribution.utmCampaign ?? saved.utmCampaign,
  }
}

export function mergeSavedState(
  current: FunnelState,
  saved: FunnelState,
  url: FunnelUrlContext,
  choice: 'keep-current' | 'resume-saved',
): FunnelState {
  if (!url.allowResume || choice === 'keep-current') return current
  if (url.mode === 'address') {
    return {
      ...saved,
      leadId: null,
      leadReportToken: null,
      attribution: mergeAttribution(saved.attribution, url),
    }
  }
  return {
    ...saved,
    leadId: null,
    leadReportToken: null,
    attribution: mergeAttribution(saved.attribution, url),
    wijk: url.attribution.wijk ?? saved.wijk,
    stad: url.attribution.stad ?? saved.stad,
  }
}

function clearAddressDerivedState(state: FunnelState): FunnelState {
  return {
    ...state,
    step: 1,
    bagData: null,
    netcongestie: null,
    healthScore: null,
    roiResult: null,
    roiInput: null,
    reportModel: null,
    meterkastAnalyse: null,
    plaatsingsAnalyse: null,
    omvormerAnalyse: null,
    leadId: null,
    leadReportToken: null,
    error: null,
  }
}

export function funnelReducer(
  state: FunnelState,
  action: FunnelAction,
): FunnelState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step, error: null }
    case 'SET_WIJK':
      return { ...state, wijk: action.wijk, stad: action.stad }
    case 'SET_BAG_DATA':
      return { ...state, bagData: action.bagData }
    case 'SET_NETCONGESTIE':
      return { ...state, netcongestie: action.netcongestie }
    case 'SET_HEALTH_SCORE':
      return { ...state, healthScore: action.healthScore }
    case 'SET_ROI':
      return { ...state, roiResult: action.roiResult }
    case 'SET_ROI_INPUT':
      return { ...state, roiInput: action.roiInput }
    case 'SET_REPORT_MODEL':
      return { ...state, reportModel: action.report }
    case 'SET_METERKAST':
      return { ...state, meterkastAnalyse: action.meterkastAnalyse }
    case 'SET_PLAATSING':
      return { ...state, plaatsingsAnalyse: action.plaatsingsAnalyse }
    case 'SET_OMVORMER':
      return { ...state, omvormerAnalyse: action.omvormerAnalyse }
    case 'SET_LEAD_ID':
      return { ...state, leadId: action.leadId }
    case 'SET_LEAD_REPORT_TOKEN':
      return { ...state, leadReportToken: action.token }
    case 'SET_ADRES':
      return { ...state, adres: action.adres }
    case 'SET_LOADING':
      return { ...state, loading: action.loading }
    case 'SET_ERROR':
      return { ...state, error: action.error }
    case 'SET_DAKRICHTING':
      return { ...state, dakrichting: action.dakrichting }
    case 'SET_VERBRUIK_BRON':
      return { ...state, verbruik_bron: action.bron }
    case 'SET_HUISHOUDEN':
      return { ...state, huishouden_grootte: action.grootte }
    case 'SET_IS_EIGENAAR':
      return { ...state, is_eigenaar: action.is_eigenaar }
    case 'SET_HEEFT_PANELEN':
      return { ...state, heeft_panelen: action.heeft_panelen }
    case 'SET_HUIDIGE_PANELEN_AANTAL':
      return {
        ...state,
        huidige_panelen_aantal: action.huidige_panelen_aantal,
      }
    case 'RESTORE_STATE':
      return action.state
    case 'START_NEW_ADDRESS':
      return { ...clearAddressDerivedState(state), adres: action.adres }
    case 'SET_FUNNEL_SESSION':
      return { ...state, funnelSessionId: action.id }
    case 'SET_ATTRIBUTION':
      return { ...state, attribution: action.attribution }
    default:
      return state
  }
}
