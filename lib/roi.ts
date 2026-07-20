// lib/roi.ts

// Actuele Nederlandse salderingsregeling:
// 100% salderen tot en met 31 december 2026, daarna stopt de regeling.
export const SALDERING_SCHEMA: Record<number, number> = {
  2025: 1.00,
  2026: 1.00,
  2027: 0.00,
}

export const REFERENCE_BATTERY_CAPACITY_KWH = 10

// Indicatieve tarieven. Werkelijke tarieven en terugleverkosten verschillen per leverancier.
export const LEVERINGSTARIEF = 0.40
export const TERUGLEVERTARIEF = 0.09
const KWH_PER_PANEEL = 350     // kWh/jaar per 400Wp paneel NL gemiddeld
const M2_PER_PANEEL = 4        // m² dakoppervlak per paneel (incl. tussenruimte)
const DAK_BENUTTING = 0.55     // 55% van dakoppervlak bruikbaar (realistisch: niet alle vlakken zijn zuidgericht)

const DAKRICHTING_FACTOR: Record<string, number> = {
  'Zuid': 1.23,
  'Oost/West': 0.80,
  'Noord': 0.43,
}

const EIGENGEBRUIK_BASIS: Record<number, number> = { 1: 0.22, 2: 0.30, 3: 0.45 }
const EIGENGEBRUIK_BATTERIJ: Record<number, number> = { 1: 0.55, 2: 0.70, 3: 0.80 }

export interface ROIInput {
  oppervlakte: number          // Woonoppervlak m²
  bouwjaar: number
  dakOppervlakte: number       // Geschat dakoppervlak m²
  huidigVerbruikKwh?: number   // Optioneel: overschrijft schatting
  budgetEur?: number           // Optioneel: max investering
  aantalPanelenOverride?: number // Optioneel: gebruiker overschrijft paneel berekening
  kwhPerPaneel?: number        // Optioneel: paneelefficiëntie (standaard 350)
  dakrichting?: 'Zuid' | 'Oost/West' | 'Noord' | null
  huishouden_grootte?: 1 | 2 | 3 | null
}

export interface ShockEffect2027 {
  jaarlijksVerlies: number          // €/jaar verlies na 1 jan 2027 zonder actie
  cumulatiefVerlies5Jaar: number    // × 5 jaar
  maandelijksVerlies: number        // jaarlijksVerlies / 12
  boodschap: string                 // Human-readable urgentieboodschap
}

export interface ROIScenario {
  naam: string
  beschrijving: string
  besparingJaarEur: number
  investeringEur: number
  terugverdientijdJaar: number
}

export interface ROIResult {
  // Kerngetallen
  geschatVerbruikKwh: number
  aantalPanelen: number
  productieKwh: number
  eigenGebruikPct: number         // % van productie dat direct gebruikt wordt

  // Scenario's
  scenarioNu: ROIScenario         // Panelen nu installeren (2026: 100% salderen)
  scenarioMetBatterij: ROIScenario // Panelen + batterij (hogere eigengebruik)
  scenarioWachten: ROIScenario    // Wachten tot 2027 (geen saldering meer)

  // 2027 urgentie
  shockEffect2027: ShockEffect2027

  // Aanbeveling
  aanbeveling: 'panelen' | 'beide'
  aanbevelingTekst: string

  // Subsidie pre-fill
  isdeSchatting: {
    bedragEur: number
    apparaatType: string
    vermogenKwp: number
  }
}

function berekenJaarwaarde(
  productieKwh: number,
  verbruikKwh: number,
  directEigenGebruikKwh: number,
  salderingspercentage: number,
): number {
  const terugleveringKwh = Math.max(productieKwh - directEigenGebruikKwh, 0)
  const afnameVanNetKwh = Math.max(verbruikKwh - directEigenGebruikKwh, 0)
  const gesaldeerdKwh = Math.min(terugleveringKwh, afnameVanNetKwh) * salderingspercentage
  const vergoedTeruggeleverdKwh = Math.max(terugleveringKwh - gesaldeerdKwh, 0)

  return (
    directEigenGebruikKwh * LEVERINGSTARIEF +
    gesaldeerdKwh * LEVERINGSTARIEF +
    vergoedTeruggeleverdKwh * TERUGLEVERTARIEF
  )
}

export function berekenBatterijJaarwaarde2027(input: {
  productieKwh: number
  verbruikKwh: number
  huishoudenGrootte?: 1 | 2 | 3 | null
}): number {
  const batterijFactor = input.huishoudenGrootte
    ? (EIGENGEBRUIK_BATTERIJ[input.huishoudenGrootte] ?? 0.70)
    : 0.70
  const eigenGebruikBatterijKwh = Math.min(
    input.productieKwh * batterijFactor,
    input.verbruikKwh,
  )

  return Math.round(berekenJaarwaarde(
    input.productieKwh,
    input.verbruikKwh,
    eigenGebruikBatterijKwh,
    SALDERING_SCHEMA[2027],
  ))
}

// Schat jaarverbruik op basis van woonoppervlak en bouwjaar
export function schatVerbruik(oppervlakte: number, bouwjaar: number): number {
  // Basisverbruik per m² daalt naarmate woning nieuwer is
  let kwh_per_m2: number
  if (bouwjaar < 1970) kwh_per_m2 = 18
  else if (bouwjaar < 1990) kwh_per_m2 = 14
  else if (bouwjaar < 2010) kwh_per_m2 = 11
  else kwh_per_m2 = 8

  // Basisverbruik (apparaten, verlichting) + verwarmingsdeel
  return Math.round(oppervlakte * kwh_per_m2 + 800)
}

export function berekenROI(input: ROIInput): ROIResult {
  const verbruikKwh = input.huidigVerbruikKwh ?? schatVerbruik(input.oppervlakte, input.bouwjaar)

  const aantalPanelen = input.aantalPanelenOverride
    ?? Math.floor((input.dakOppervlakte * DAK_BENUTTING) / M2_PER_PANEEL)
  const kwhPerPaneel = input.kwhPerPaneel ?? KWH_PER_PANEEL
  const richtingFactor = input.dakrichting ? (DAKRICHTING_FACTOR[input.dakrichting] ?? 1.0) : 1.0
  const productieKwh = Math.round(aantalPanelen * kwhPerPaneel * richtingFactor)
  const saldering2026 = SALDERING_SCHEMA[2026]

  // Eigengebruik factor op basis van huishoudenssamenstelling
  const basisFactor = input.huishouden_grootte ? (EIGENGEBRUIK_BASIS[input.huishouden_grootte] ?? 0.30) : 0.30

  const eigenGebruikBasisKwh = Math.min(productieKwh * basisFactor, verbruikKwh)

  // Scenario A: in 2026 mag teruglevering nog volledig worden gesaldeerd tegen
  // de jaarlijkse netafname. Een eventueel overschot krijgt een terugleververgoeding.
  const besparingNu = berekenJaarwaarde(
    productieKwh,
    verbruikKwh,
    eigenGebruikBasisKwh,
    saldering2026,
  )
  const investeringPanelen = aantalPanelen * 350  // ~€350 per paneel geïnstalleerd

  // Scenario B: vanaf 2027 met batterij (10 kWh, ~€4000). Het extra
  // batterijvoordeel moet worden vergeleken met scenario C: hetzelfde jaar
  // zonder batterij. In 2026 maakt 100% salderen extra eigen gebruik financieel
  // vrijwel waardeloos, wat ten onrechte een opslagvoordeel van €0 gaf.
  const besparingMetBatterij = berekenBatterijJaarwaarde2027({
    productieKwh,
    verbruikKwh,
    huishoudenGrootte: input.huishouden_grootte,
  })
  const investeringMetBatterij = investeringPanelen + 4000

  // Scenario C: vanaf 2027 stopt salderen. Teruglevering houdt wel een
  // leveranciersafhankelijke vergoeding; die is hier indicatief geraamd.
  const besparingWachten = berekenJaarwaarde(
    productieKwh,
    verbruikKwh,
    eigenGebruikBasisKwh,
    SALDERING_SCHEMA[2027],
  )

  // Verschil in geraamde jaarwaarde door het einde van salderen.
  const jaarlijksVerlies = besparingNu - besparingWachten
  const shockEffect2027: ShockEffect2027 = {
    jaarlijksVerlies: Math.round(jaarlijksVerlies),
    cumulatiefVerlies5Jaar: Math.round(jaarlijksVerlies * 5),
    maandelijksVerlies: Math.round(jaarlijksVerlies / 12),
    boodschap: `Door het einde van salderen daalt de geraamde jaarwaarde met €${Math.round(jaarlijksVerlies)} per jaar vanaf 1 januari 2027`,
  }

  // Vergelijk batterij en geen batterij binnen hetzelfde tariefjaar (2027).
  const aanbeveling = besparingMetBatterij > besparingWachten * 1.2 ? 'beide' : 'panelen'

  // Zonnepanelen en thuisbatterijen vallen niet onder de landelijke ISDE.
  const isdeSchatting = {
    bedragEur: 0,
    apparaatType: 'Geen ISDE voor zonnepanelen of thuisbatterij',
    vermogenKwp: Math.round(aantalPanelen * 0.4 * 10) / 10,  // kWp = panelen × 400Wp
  }

  return {
    geschatVerbruikKwh: verbruikKwh,
    aantalPanelen,
    productieKwh,
    eigenGebruikPct: productieKwh > 0 ? Math.round((eigenGebruikBasisKwh / productieKwh) * 100) : 0,

    scenarioNu: {
      naam: 'Nu installeren',
      beschrijving: 'Zonnepanelen in 2026 (100% salderen t/m 31 december)',
      besparingJaarEur: Math.round(besparingNu),
      investeringEur: investeringPanelen,
      terugverdientijdJaar: Math.round((investeringPanelen / besparingNu) * 10) / 10,
    },
    scenarioMetBatterij: {
      naam: 'Panelen + batterij',
      beschrijving: 'Vanaf 2027 met 10 kWh thuisbatterij',
      besparingJaarEur: Math.round(besparingMetBatterij),
      investeringEur: investeringMetBatterij,
      terugverdientijdJaar: Math.round((investeringMetBatterij / besparingMetBatterij) * 10) / 10,
    },
    scenarioWachten: {
      naam: 'Wachten tot 2027',
      beschrijving: 'Na einde salderen (terugleververgoeding blijft)',
      besparingJaarEur: Math.round(besparingWachten),
      investeringEur: investeringPanelen,
      terugverdientijdJaar: besparingWachten > 0
        ? Math.round((investeringPanelen / besparingWachten) * 10) / 10
        : 99,
    },

    shockEffect2027,
    aanbeveling,
    aanbevelingTekst: aanbeveling === 'beide'
      ? `Vanaf 2027 is de geraamde jaarwaarde met panelen en batterij €${Math.round(besparingMetBatterij)}/jaar. Het extra opslagvoordeel ten opzichte van alleen panelen is circa €${Math.round(besparingMetBatterij - besparingWachten)}/jaar. Laat rendement en dimensionering altijd toetsen met actuele tarieven en een offerte.`
      : `Zonnepanelen leveren in deze indicatie €${Math.round(besparingNu)}/jaar op. Tot en met 31 december 2026 kunt u jaarlijks salderen; vanaf 2027 tellen vooral direct eigen gebruik en de terugleververgoeding.`,
    isdeSchatting,
  }
}
