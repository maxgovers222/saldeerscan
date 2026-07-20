export interface VisionAssessmentMeta {
  /** Model confidence in what is visibly identifiable in the photo, from 0 to 1. */
  confidence?: number
  /** A photo analysis never replaces an on-site inspection by an installer. */
  needsHumanReview?: boolean
}

export interface MeterkastAnalyse extends VisionAssessmentMeta {
  merk: string | null
  drieFase: boolean
  vrijeGroepen: number
  maxVermogenKw: number | null
  geschikt: boolean
  opmerkingen: string[]
}

export interface PlaatsingsAnalyse extends VisionAssessmentMeta {
  /**
   * Backwards-compatible report field. This only means that no blocking risk
   * indicators were visible in the photo; it is not a standards certification.
   */
  nenCompliant: boolean
  risicoItems: string[]
  aanbevelingen: string[]
  geschiktheidScore: number
}

export interface OmvormerAnalyse extends VisionAssessmentMeta {
  merk: string | null
  model: string | null
  vermogenKw: number | null
  hybrideKlaar: boolean
  vervangenNodig: boolean
  opmerkingen: string[]
}

export interface RawMeterkastAnalyse {
  merk: string | null
  drie_fase: boolean
  vrije_groepen: number
  max_vermogen_kw: number | null
  lijkt_geschikt: boolean
  opmerkingen: string[]
  confidence: number
}

export interface RawPlaatsingsAnalyse {
  geen_zichtbare_blokkerende_risicos: boolean
  risico_items: string[]
  aanbevelingen: string[]
  geschiktheid_score: number
  confidence: number
}

export interface RawOmvormerAnalyse {
  merk: string | null
  model: string | null
  vermogen_kw: number | null
  hybride_klaar: boolean
  vervanging_lijkt_nodig: boolean
  opmerkingen: string[]
  confidence: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function normalizeMeterkastAnalyse(raw: RawMeterkastAnalyse): MeterkastAnalyse {
  return {
    merk: raw.merk,
    drieFase: raw.drie_fase,
    vrijeGroepen: Math.max(0, raw.vrije_groepen),
    maxVermogenKw: raw.max_vermogen_kw,
    geschikt: raw.lijkt_geschikt,
    opmerkingen: raw.opmerkingen,
    confidence: clamp(raw.confidence, 0, 1),
    needsHumanReview: true,
  }
}

export function normalizePlaatsingsAnalyse(raw: RawPlaatsingsAnalyse): PlaatsingsAnalyse {
  return {
    nenCompliant: raw.geen_zichtbare_blokkerende_risicos,
    risicoItems: raw.risico_items,
    aanbevelingen: raw.aanbevelingen,
    geschiktheidScore: clamp(raw.geschiktheid_score, 0, 10),
    confidence: clamp(raw.confidence, 0, 1),
    needsHumanReview: true,
  }
}

export function normalizeOmvormerAnalyse(raw: RawOmvormerAnalyse): OmvormerAnalyse {
  return {
    merk: raw.merk,
    model: raw.model,
    vermogenKw: raw.vermogen_kw,
    hybrideKlaar: raw.hybride_klaar,
    vervangenNodig: raw.vervanging_lijkt_nodig,
    opmerkingen: raw.opmerkingen,
    confidence: clamp(raw.confidence, 0, 1),
    needsHumanReview: true,
  }
}
