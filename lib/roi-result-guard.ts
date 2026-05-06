import type { ROIResult, ROIScenario, ShockEffect2027 } from './roi'

function finiteNum(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n)
}

function okScenario(x: unknown): x is ROIScenario {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return false
  const o = x as Record<string, unknown>
  return (
    finiteNum(o.besparingJaarEur)
    && finiteNum(o.investeringEur)
    && finiteNum(o.terugverdientijdJaar)
  )
}

function okShock(x: unknown): x is ShockEffect2027 {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return false
  const o = x as Record<string, unknown>
  return (
    finiteNum(o.jaarlijksVerlies)
    && finiteNum(o.cumulatiefVerlies5Jaar)
    && finiteNum(o.maandelijksVerlies)
    && typeof o.boodschap === 'string'
  )
}

function okIsde(x: unknown): x is ROIResult['isdeSchatting'] {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return false
  const o = x as Record<string, unknown>
  return finiteNum(o.bedragEur) && typeof o.apparaatType === 'string' && finiteNum(o.vermogenKwp)
}

/**
 * Normaliseert `roi_berekening` uit de database naar een geldig ROIResult,
 * of `null` wanneer het record leeg/corrupt/incompleet is (geen misleidende UI).
 */
export function parseStoredRoi(raw: unknown): ROIResult | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  const keys = Object.keys(o)
  if (keys.length === 0) return null

  if (!finiteNum(o.geschatVerbruikKwh)) return null
  if (!finiteNum(o.aantalPanelen) || o.aantalPanelen < 0 || o.aantalPanelen > 500) return null
  if (!finiteNum(o.productieKwh)) return null
  if (!finiteNum(o.eigenGebruikPct)) return null
  if (!okScenario(o.scenarioNu)) return null
  if (!okScenario(o.scenarioMetBatterij)) return null
  if (!okScenario(o.scenarioWachten)) return null
  if (!okShock(o.shockEffect2027)) return null

  const aanbeveling = o.aanbeveling === 'beide' || o.aanbeveling === 'panelen' ? o.aanbeveling : null
  if (!aanbeveling || typeof o.aanbevelingTekst !== 'string') return null

  const isdeSchatting: ROIResult['isdeSchatting'] = okIsde(o.isdeSchatting)
    ? o.isdeSchatting
    : { bedragEur: 0, apparaatType: '', vermogenKwp: 0 }

  return {
    geschatVerbruikKwh: o.geschatVerbruikKwh,
    aantalPanelen: Math.round(o.aantalPanelen),
    productieKwh: Math.round(o.productieKwh),
    eigenGebruikPct: Math.round(o.eigenGebruikPct),
    scenarioNu: o.scenarioNu,
    scenarioMetBatterij: o.scenarioMetBatterij,
    scenarioWachten: o.scenarioWachten,
    shockEffect2027: o.shockEffect2027,
    aanbeveling,
    aanbevelingTekst: o.aanbevelingTekst,
    isdeSchatting,
  }
}

export function isReportDataIncomplete(raw: unknown): boolean {
  return parseStoredRoi(raw) === null
}
