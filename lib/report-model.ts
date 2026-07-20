import { parseStoredRoi } from '@/lib/roi-result-guard'
import {
  berekenBatterijJaarwaarde2027,
  REFERENCE_BATTERY_CAPACITY_KWH,
  SALDERING_SCHEMA,
  type ROIScenario,
} from '@/lib/roi'
import type {
  HealthScoreResult,
  MeterkastAnalyse,
  OmvormerAnalyse,
  PlaatsingsAnalyse,
} from '@/components/funnel/types'

export const REPORT_MODEL_VERSION = 1 as const
export type ReportEmailStatus = 'pending' | 'sent' | 'failed' | 'not_configured'

export interface ReportSource {
  leadId: string | null
  createdAt: string
  adres: string
  wijk: string | null
  stad: string | null
  bagData: {
    bouwjaar: number | null
    oppervlakte: number | null
    woningtype: string | null
    postcode: string | null
    huisnummer: number | null
    dakOppervlakte: number | null
    lat?: number
    lon?: number
  } | null
  netcongestie: {
    status: 'ROOD' | 'ORANJE' | 'GROEN'
    netbeheerder?: string
    uitleg?: string
    terugleveringBeperkt?: boolean
  } | null
  healthScore: HealthScoreResult | null
  roiResult: unknown
  qualification: {
    isEigenaar: boolean | null
    heeftPanelen: boolean | null
    huidigePanelenAantal: number | null
  }
  calculationContext?: {
    householdSize: 1 | 2 | 3 | null
  }
  technical: {
    meterkast: MeterkastAnalyse | null
    plaatsing: PlaatsingsAnalyse | null
    omvormer: OmvormerAnalyse | null
  }
  delivery: {
    emailStatus: ReportEmailStatus
  }
}

export interface NormalizedReport {
  version: typeof REPORT_MODEL_VERSION
  leadId: string | null
  generatedAt: string
  home: {
    address: string
    wijk: string | null
    stad: string | null
    postcode: string | null
    housingType: string | null
    buildYear: number | null
    surfaceM2: number | null
    roofSurfaceM2: number | null
  }
  summary: {
    healthScore: number | null
    healthLabel: string | null
    annualSavingEur: number
    paybackYears: number | null
  }
  impact: {
    annualLossEur: number
    monthlyLossEur: number
    fiveYearLossEur: number
    explanation: string
  }
  scenarios: {
    panelsNow: ROIScenario
    withBattery: ROIScenario
    waitUntil2027: ROIScenario
  }
  salderingTimeline: Array<{
    year: number
    compensationPct: number
  }>
  recommendation: {
    primarySolution:
      | 'Zonnepanelen'
      | 'Zonnepanelen en thuisbatterij'
      | 'Thuisbatterij en slim verbruik'
      | 'Slim verbruik met huidige zonnepanelen'
    panelCount: number
    existingPanelCount: number | null
    productionKwh: number
    consumptionKwh: number
    ownUsePct: number
    batteryCapacityKwh: number | null
    investmentEur: number
    extraAnnualSavingEur: number | null
    paybackYears: number | null
    explanation: string
    isdeAmountEur: number
  }
  grid: {
    status: 'ROOD' | 'ORANJE' | 'GROEN' | null
    operator: string | null
    explanation: string | null
  }
  qualification: ReportSource['qualification']
  technical: ReportSource['technical']
  recommendations: string[]
  delivery: {
    emailStatus: ReportEmailStatus
  }
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10
}

export function buildReportModel(
  source: ReportSource,
): NormalizedReport | null {
  const roi = parseStoredRoi(source.roiResult)
  if (!roi) return null

  const existing = source.qualification.heeftPanelen === true
  const batteryInvestment = Math.max(
    roi.scenarioMetBatterij.investeringEur - roi.scenarioNu.investeringEur,
    0,
  )
  const batteryScenarioUses2027 = roi.scenarioMetBatterij.beschrijving
    .toLowerCase()
    .includes('vanaf 2027')
  const normalizedBatteryScenario = batteryScenarioUses2027
    ? roi.scenarioMetBatterij
    : {
        ...roi.scenarioMetBatterij,
        beschrijving: 'Vanaf 2027 met 10 kWh thuisbatterij',
        besparingJaarEur: berekenBatterijJaarwaarde2027({
          productieKwh: roi.productieKwh,
          verbruikKwh: roi.geschatVerbruikKwh,
          huishoudenGrootte: source.calculationContext?.householdSize,
        }),
      }
  if (!batteryScenarioUses2027) {
    normalizedBatteryScenario.terugverdientijdJaar = normalizedBatteryScenario.besparingJaarEur > 0
      ? roundOne(normalizedBatteryScenario.investeringEur / normalizedBatteryScenario.besparingJaarEur)
      : 99
  }
  const batteryExtraSaving = Math.max(
    normalizedBatteryScenario.besparingJaarEur - roi.scenarioWachten.besparingJaarEur,
    0,
  )
  const batteryRecommended =
    normalizedBatteryScenario.besparingJaarEur > roi.scenarioWachten.besparingJaarEur * 1.2
    && batteryExtraSaving > 0
  const annualSaving = existing
    ? batteryExtraSaving
    : batteryRecommended
      ? normalizedBatteryScenario.besparingJaarEur
      : roi.scenarioNu.besparingJaarEur
  const investment = existing
    ? batteryRecommended ? batteryInvestment : 0
    : batteryRecommended
      ? normalizedBatteryScenario.investeringEur
      : roi.scenarioNu.investeringEur
  const payback = existing
    ? batteryRecommended
      ? roundOne(batteryInvestment / batteryExtraSaving)
      : null
    : Number.isFinite(
      batteryRecommended
        ? normalizedBatteryScenario.terugverdientijdJaar
        : roi.scenarioNu.terugverdientijdJaar,
    )
      ? batteryRecommended
        ? normalizedBatteryScenario.terugverdientijdJaar
        : roi.scenarioNu.terugverdientijdJaar
      : null

  return {
    version: REPORT_MODEL_VERSION,
    leadId: source.leadId,
    generatedAt: source.createdAt,
    home: {
      address: source.adres,
      wijk: source.wijk,
      stad: source.stad,
      postcode: source.bagData?.postcode ?? null,
      housingType: source.bagData?.woningtype ?? null,
      buildYear: source.bagData?.bouwjaar ?? null,
      surfaceM2: source.bagData?.oppervlakte ?? null,
      roofSurfaceM2: source.bagData?.dakOppervlakte ?? null,
    },
    summary: {
      healthScore: source.healthScore?.score ?? null,
      healthLabel: source.healthScore?.label ?? null,
      annualSavingEur: annualSaving,
      paybackYears: payback,
    },
    impact: {
      annualLossEur: roi.shockEffect2027.jaarlijksVerlies,
      monthlyLossEur: roi.shockEffect2027.maandelijksVerlies,
      fiveYearLossEur: roi.shockEffect2027.cumulatiefVerlies5Jaar,
      explanation: roi.shockEffect2027.boodschap,
    },
    scenarios: {
      panelsNow: { ...roi.scenarioNu },
      withBattery: { ...normalizedBatteryScenario },
      waitUntil2027: { ...roi.scenarioWachten },
    },
    salderingTimeline: [
      { year: 2024, compensationPct: 100 },
      ...Object.entries(SALDERING_SCHEMA)
        .map(([year, factor]) => ({
          year: Number(year),
          compensationPct: Math.round(factor * 100),
        }))
        .sort((a, b) => a.year - b.year),
    ],
    recommendation: {
      primarySolution: existing
        ? batteryRecommended
          ? 'Thuisbatterij en slim verbruik'
          : 'Slim verbruik met huidige zonnepanelen'
        : batteryRecommended
          ? 'Zonnepanelen en thuisbatterij'
          : 'Zonnepanelen',
      panelCount: roi.aantalPanelen,
      existingPanelCount: source.qualification.huidigePanelenAantal,
      productionKwh: roi.productieKwh,
      consumptionKwh: roi.geschatVerbruikKwh,
      ownUsePct: roi.eigenGebruikPct,
      batteryCapacityKwh:
        batteryRecommended
          ? REFERENCE_BATTERY_CAPACITY_KWH
          : null,
      investmentEur: investment,
      extraAnnualSavingEur: existing ? batteryExtraSaving : null,
      paybackYears: payback,
      explanation: existing
        ? batteryRecommended
          ? `Behoud uw huidige panelen. Vanaf 2027 kan opslag en slimmer verbruik in deze indicatie circa €${Math.round(batteryExtraSaving)} per jaar extra opleveren. Laat dit toetsen met uw kwartierdata en een offerte.`
          : 'Behoud uw huidige panelen en verhoog waar mogelijk het directe eigen gebruik. Een batterij is in deze indicatie niet rendabel genoeg om te adviseren.'
        : batteryRecommended
          ? `Vanaf 2027 is de geraamde jaarwaarde met panelen en batterij €${Math.round(normalizedBatteryScenario.besparingJaarEur)}/jaar. Het extra opslagvoordeel ten opzichte van alleen panelen is circa €${Math.round(batteryExtraSaving)}/jaar. Laat rendement en dimensionering altijd toetsen met actuele tarieven en een offerte.`
          : roi.aanbevelingTekst,
      // Zonnepanelen en thuisbatterijen vallen niet onder de landelijke ISDE.
      isdeAmountEur: 0,
    },
    grid: {
      status: source.netcongestie?.status ?? null,
      operator: source.netcongestie?.netbeheerder?.trim() || null,
      explanation: source.netcongestie?.uitleg ?? null,
    },
    qualification: source.qualification,
    technical: source.technical,
    recommendations: source.healthScore?.aanbevelingen ?? [],
    delivery: source.delivery,
  }
}

export function reportSourceFromStoredLead(
  lead: Record<string, unknown>,
): ReportSource {
  const score = typeof lead.health_score === 'number' ? lead.health_score : null
  const rawNetStatus = String(lead.netcongestie_status ?? '')
  const netStatus = (
    ['ROOD', 'ORANJE', 'GROEN'].includes(rawNetStatus)
      ? rawNetStatus
      : null
  ) as 'ROOD' | 'ORANJE' | 'GROEN' | null
  const healthLabel = score === null
    ? null
    : score >= 75 ? 'Uitstekend'
    : score >= 55 ? 'Goed'
    : score >= 35 ? 'Matig'
    : 'Slecht'
  return {
    leadId: typeof lead.id === 'string' ? lead.id : null,
    createdAt: typeof lead.created_at === 'string'
      ? lead.created_at
      : new Date(0).toISOString(),
    adres: typeof lead.adres === 'string' ? lead.adres : '',
    wijk: typeof lead.wijk === 'string' ? lead.wijk : null,
    stad: typeof lead.stad === 'string' ? lead.stad : null,
    bagData: (lead.bag_data ?? null) as ReportSource['bagData'],
    netcongestie: netStatus
      ? {
          status: netStatus,
          netbeheerder: typeof lead.netbeheerder === 'string' ? lead.netbeheerder : '',
          uitleg: '',
          terugleveringBeperkt: false,
        }
      : null,
    healthScore: score === null || healthLabel === null
      ? null
      : {
          score,
          label: healthLabel,
          kleur: score >= 75 ? 'groen' : score >= 55 ? 'geel' : score >= 35 ? 'oranje' : 'rood',
          breakdown: { bouwjaar: 0, energielabel: 0, dakpotentieel: 0, netcongestie: 0 },
          aanbevelingen: [],
        },
    roiResult: lead.roi_berekening,
    qualification: {
      isEigenaar: typeof lead.is_eigenaar === 'boolean' ? lead.is_eigenaar : null,
      heeftPanelen: typeof lead.heeft_panelen === 'boolean' ? lead.heeft_panelen : null,
      huidigePanelenAantal: typeof lead.huidige_panelen_aantal === 'number'
        ? lead.huidige_panelen_aantal
        : null,
    },
    calculationContext: {
      householdSize: (
        lead.huishouden_grootte === 1
        || lead.huishouden_grootte === 2
        || lead.huishouden_grootte === 3
      )
        ? lead.huishouden_grootte
        : null,
    },
    technical: {
      meterkast: (lead.meterkast_analyse ?? null) as ReportSource['technical']['meterkast'],
      plaatsing: (lead.plaatsing_analyse ?? null) as ReportSource['technical']['plaatsing'],
      omvormer: (lead.omvormer_analyse ?? null) as ReportSource['technical']['omvormer'],
    },
    delivery: {
      emailStatus: (
        ['pending', 'sent', 'failed', 'not_configured']
          .includes(String(lead.report_email_status))
          ? lead.report_email_status
          : 'pending'
      ) as ReportEmailStatus,
    },
  }
}
