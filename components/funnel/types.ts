'use client'

import type { PseoLevel } from '@/lib/conversion-context'
import type { NormalizedReport } from '@/lib/report-model'

// Local type mirrors — do NOT import from lib/roi or lib/health-score (server-only)

export type FunnelStep = 1 | 2 | 3 | 4 | 5 | 6
export type VisualFunnelStage = 1 | 2 | 3 | 4

export interface FunnelAttribution {
  landingPath: string
  pseoLevel: PseoLevel
  provincie: string | null
  stad: string | null
  wijk: string | null
  straat: string | null
  postcode: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
}

export interface ShockEffect2027 {
  jaarlijksVerlies: number
  cumulatiefVerlies5Jaar: number
  maandelijksVerlies: number
  boodschap: string
}

export interface ROIScenario {
  naam: string
  beschrijving: string
  besparingJaarEur: number
  investeringEur: number
  terugverdientijdJaar: number
}

export interface ROIResult {
  geschatVerbruikKwh: number
  aantalPanelen: number
  productieKwh: number
  eigenGebruikPct: number
  scenarioNu: ROIScenario
  scenarioMetBatterij: ROIScenario
  scenarioWachten: ROIScenario
  shockEffect2027: ShockEffect2027
  aanbeveling: 'panelen' | 'beide'
  aanbevelingTekst: string
  isdeSchatting: {
    bedragEur: number
    apparaatType: string
    vermogenKwp: number
  }
}

export interface HealthScoreResult {
  score: number
  label: 'Uitstekend' | 'Goed' | 'Matig' | 'Slecht'
  kleur: 'groen' | 'geel' | 'oranje' | 'rood'
  breakdown: {
    bouwjaar: number
    energielabel: number
    dakpotentieel: number
    netcongestie: number
  }
  aanbevelingen: string[]
}

export interface MeterkastAnalyse {
  merk: string | null
  drieFase: boolean
  vrijeGroepen: number
  maxVermogenKw: number | null
  geschikt: boolean
  opmerkingen: string[]
  confidence?: number
  needsHumanReview?: boolean
}

export interface PlaatsingsAnalyse {
  nenCompliant: boolean
  risicoItems: string[]
  aanbevelingen: string[]
  geschiktheidScore: number
  confidence?: number
  needsHumanReview?: boolean
}

export interface OmvormerAnalyse {
  merk: string | null
  model: string | null
  vermogenKw: number | null
  hybrideKlaar: boolean
  vervangenNodig: boolean
  opmerkingen: string[]
  confidence?: number
  needsHumanReview?: boolean
}

export interface RoiCalculationInput {
  oppervlakte: number
  bouwjaar: number
  dakOppervlakte: number
  huidigVerbruikKwh: number
  aantalPanelenOverride: number
  kwhPerPaneel: number
  dakrichting: 'Zuid' | 'Oost/West' | 'Noord' | null
  huishouden_grootte: 1 | 2 | 3 | null
}

export interface FunnelState {
  step: FunnelStep
  adres: string
  wijk: string
  stad: string
  bagData: {
    bouwjaar: number | null
    oppervlakte: number | null
    woningtype: string | null
    postcode: string | null
    huisnummer: number | null
    dakOppervlakte: number | null
    lat: number
    lon: number
  } | null
  netcongestie: {
    status: 'ROOD' | 'ORANJE' | 'GROEN'
    netbeheerder: string
    uitleg: string
    terugleveringBeperkt: boolean
    postcodePrefix?: string
  } | null
  healthScore: HealthScoreResult | null
  roiResult: ROIResult | null
  roiInput: RoiCalculationInput | null
  reportModel: NormalizedReport | null
  meterkastAnalyse: MeterkastAnalyse | null
  plaatsingsAnalyse: PlaatsingsAnalyse | null
  omvormerAnalyse: OmvormerAnalyse | null
  dakrichting: 'Zuid' | 'Oost/West' | 'Noord' | null
  verbruik_bron: 'schatting' | 'gebruiker'
  huishouden_grootte: 1 | 2 | 3 | null
  is_eigenaar: boolean | null
  heeft_panelen: boolean | null
  huidige_panelen_aantal: number | null
  leadId: string | null
  /** HMAC-token voor GET /api/leads/:id (zelfde als e-maillink); bewaard na submit + hydratie. */
  leadReportToken: string | null
  loading: boolean
  error: string | null
  funnelSessionId: string | null
  attribution: FunnelAttribution
}

export type FunnelAction =
  | { type: 'SET_STEP'; step: FunnelStep }
  | { type: 'SET_WIJK'; wijk: string; stad: string }
  | { type: 'SET_BAG_DATA'; bagData: FunnelState['bagData'] }
  | { type: 'SET_NETCONGESTIE'; netcongestie: FunnelState['netcongestie'] }
  | { type: 'SET_HEALTH_SCORE'; healthScore: HealthScoreResult }
  | { type: 'SET_ROI'; roiResult: ROIResult }
  | { type: 'SET_ROI_INPUT'; roiInput: RoiCalculationInput }
  | { type: 'SET_REPORT_MODEL'; report: NormalizedReport }
  | { type: 'SET_METERKAST'; meterkastAnalyse: MeterkastAnalyse | null }
  | { type: 'SET_PLAATSING'; plaatsingsAnalyse: PlaatsingsAnalyse | null }
  | { type: 'SET_OMVORMER'; omvormerAnalyse: OmvormerAnalyse | null }
  | { type: 'SET_LEAD_ID'; leadId: string }
  | { type: 'SET_LEAD_REPORT_TOKEN'; token: string | null }
  | { type: 'SET_ADRES'; adres: string }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_DAKRICHTING'; dakrichting: FunnelState['dakrichting'] }
  | { type: 'SET_VERBRUIK_BRON'; bron: FunnelState['verbruik_bron'] }
  | { type: 'SET_HUISHOUDEN'; grootte: FunnelState['huishouden_grootte'] }
  | { type: 'SET_IS_EIGENAAR'; is_eigenaar: boolean | null }
  | { type: 'SET_HEEFT_PANELEN'; heeft_panelen: boolean | null }
  | { type: 'SET_HUIDIGE_PANELEN_AANTAL'; huidige_panelen_aantal: number | null }
  | { type: 'SET_FUNNEL_SESSION'; id: string }
  | { type: 'SET_ATTRIBUTION'; attribution: FunnelAttribution }
  | { type: 'START_NEW_ADDRESS'; adres: string }
  | { type: 'RESTORE_STATE'; state: FunnelState }
