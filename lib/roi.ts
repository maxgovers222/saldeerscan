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
  verbruikBron?: 'schatting' | 'gebruiker'
  budgetEur?: number           // Optioneel: max investering
  aantalPanelenOverride?: number // Optioneel: gebruiker overschrijft paneel berekening
  kwhPerPaneel?: number        // Optioneel: paneelefficiëntie (standaard 350)
  dakrichting?: 'Zuid' | 'Oost/West' | 'Noord' | null
  huishouden_grootte?: 1 | 2 | 3 | null
  jaarProductieKwh?: number
  directEigenGebruikPct?: number
  leveringstarief?: number
  kaalLeveringstarief?: number
  teruglevertarief?: number
  terugleverkosten2026Eur?: number
  terugleverkosten2027Eur?: number
  terugleverkostenPerKwh2026?: number
  terugleverkostenPerKwh2027?: number
  batterijInvesteringEur?: number
  batterijCapaciteitKwh?: number
  batterijRendementPct?: number
  eigenGebruikMetBatterijPct?: number
}

export interface CalculationSnapshot {
  input: ROIInput
  assumptions: string[]
  batteryExtraAnnualEur: number
  batteryInvestmentEur: number
  batteryPaybackYears: number | null
  batteryCapacityKwh: number
  directUseKwh: number
  exportKwh: number
  batteryDeliveredKwh: number
  batteryLossKwh: number
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
  calculation?: CalculationSnapshot // Absent on reports saved before this model.
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
  const verbruik = input.huidigVerbruikKwh ?? schatVerbruik(input.oppervlakte, input.bouwjaar)
  const panelen = input.aantalPanelenOverride ?? Math.floor(input.dakOppervlakte * DAK_BENUTTING / M2_PER_PANEEL)
  const productie = input.jaarProductieKwh ?? Math.round(panelen * (input.kwhPerPaneel ?? KWH_PER_PANEEL) * (input.dakrichting ? DAKRICHTING_FACTOR[input.dakrichting] : 1))
  const basisPct = input.directEigenGebruikPct ?? (EIGENGEBRUIK_BASIS[input.huishouden_grootte ?? 2] * 100)
  const direct = Math.min(productie * basisPct / 100, verbruik)
  const exportKwh = Math.max(productie - direct, 0)
  const supply = input.leveringstarief ?? LEVERINGSTARIEF
  const bare = input.kaalLeveringstarief ?? 0.18
  const compensation = input.teruglevertarief ?? TERUGLEVERTARIEF
  const fixed26 = input.terugleverkosten2026Eur ?? 0
  const fixed27 = input.terugleverkosten2027Eur ?? 0
  const cost26 = input.terugleverkostenPerKwh2026 ?? 0
  const cost27 = input.terugleverkostenPerKwh2027 ?? 0
  const batteryCost = input.batterijInvesteringEur ?? 4000
  const capacity = input.batterijCapaciteitKwh ?? REFERENCE_BATTERY_CAPACITY_KWH
  const efficiency = (input.batterijRendementPct ?? 90) / 100
  const targetPct = input.eigenGebruikMetBatterijPct ?? EIGENGEBRUIK_BATTERIJ[input.huishouden_grootte ?? 2] * 100
  // Annual upper-bound approximation: one capacity cycle per day, subject to surplus and demand.
  // The desired total own-use percentage is a scenario, not a measured dispatch schedule.
  const delivered = Math.max(0, Math.min(
    productie * targetPct / 100 - direct,
    verbruik - direct,
    exportKwh * efficiency,
    capacity * 365 * efficiency,
  ))
  const charged = delivered / efficiency
  const loss = charged - delivered
  function value(own: number, exported: number, saldering: boolean, fixed: number, perKwh: number) {
    const netted = saldering ? Math.min(exported, Math.max(verbruik - own, 0)) : 0
    return own * supply + netted * supply + (exported - netted) * compensation
      - (exported > 0 ? fixed + exported * perKwh : 0)
  }
  const value26 = value(direct, exportKwh, true, fixed26, cost26)
  const value27 = value(direct, exportKwh, false, fixed27, cost27)
  const batteryValue = value(direct + delivered, Math.max(exportKwh - charged, 0), false, fixed27, cost27)
  const extra = batteryValue - value27
  const rounded = (n: number) => Math.round(n)
  const payback = (investment: number, benefit: number) => benefit > 0 ? Math.round(investment / benefit * 10) / 10 : null
  const batteryPayback = payback(batteryCost, extra)
  // Positive total and incremental annual value plus <=10 years are screening
  // conditions, not battery-life or profitability guarantees.
  const recommendBattery = delivered > 0 && extra > 0 && batteryValue > 0 && batteryPayback !== null && batteryPayback <= 10
  const panelCost = panelen * 350
  const assumptions = [
    `Jaarverbruik: ${verbruik} kWh (${input.huidigVerbruikKwh === undefined || input.verbruikBron === 'schatting' ? 'woningmodel' : 'ingevoerd'}). Productie: ${productie} kWh (${input.jaarProductieKwh === undefined ? 'dak- en paneelmodel' : 'ingevoerd'}).`,
    `Direct eigen gebruik: ${Math.round(direct)} kWh, ${productie > 0 ? Math.round(direct / productie * 100) : 0}% van de productie (${input.directEigenGebruikPct === undefined ? 'huishoudschatting' : 'ingevoerd; begrensd op totaalverbruik'}).`,
    `Levering: €${supply}/kWh inclusief belasting. Kaal leveringstarief: €${bare}/kWh. Bruto terugleververgoeding: €${compensation}/kWh. Dezelfde tarieven in 2026 en 2027; vervang ze met uw contract.`,
    `Terugleverkosten 2026: €${fixed26}/jaar + €${cost26}/teruggeleverde kWh. 2027: €${fixed27}/jaar + €${cost27}/teruggeleverde kWh. Alleen bij teruglevering. Een staffel voert u in als het totale jaarbedrag; tel dezelfde kosten niet dubbel.`,
    `Batterijscenario: ${capacity} kWh, €${batteryCost}, ${Math.round(efficiency * 100)}% rendement, doel ${targetPct}% eigen gebruik. Model: maximaal één cyclus per dag; ${Math.round(delivered)} kWh extra gebruik, ${Math.round(loss)} kWh verlies per jaar. Geen simulatie met kwartierdata.`,
    `Zonder ingevulde contractwaarden gebruiken we rekenvoorbeelden: €0,40 levering, €0,18 kaal, €0,09 vergoeding en €0 terugleverkosten. Dit zijn geen actuele leverancierstarieven.`,
    `Tot 2030 is de wettelijke minimumvergoeding 50% van het kale leveringstarief; terugleverkosten staan daar los van. De berekening gebruikt de ingevulde bruto vergoeding, zonder gegarandeerd netto bedrag.`,
    ...(compensation < bare * 0.5 ? ['De ingevulde vergoeding ligt onder 50% van het kale tarief. Controleer uw 2027-contract; het model corrigeert uw invoer niet automatisch.'] : []),
    'Dit is een jaarlijkse vergelijking bij vaste tarieven, geen volledige investeringsanalyse. Rente, onderhoud, degradatie, vervanging en dynamische handel ontbreken. Een batterij komt alleen als optie naar voren bij een eenvoudige extra terugverdientijd van maximaal 10 jaar; toets dit met een offerte en kwartierdata.',
    'Het 2026-scenario toont een volledig referentiejaar, niet de opbrengst van de resterende maanden in 2026. Zonnepanelen: rekenprijs €350 per paneel, geen persoonlijke offerte.',
  ]
  function scenario(naam: string, beschrijving: string, annual: number, investment: number): ROIScenario {
    return { naam, beschrijving, besparingJaarEur: rounded(annual), investeringEur: investment, terugverdientijdJaar: payback(investment, annual) ?? 99 }
  }
  return {
    geschatVerbruikKwh: verbruik, aantalPanelen: panelen, productieKwh: productie,
    eigenGebruikPct: productie > 0 ? rounded(direct / productie * 100) : 0,
    scenarioNu: scenario('Panelen in 2026', 'Referentiejaar met 100% salderen; kosten volgens invoer', value26, panelCost),
    scenarioWachten: scenario('Panelen in 2027', 'Zonder salderen; bruto terugleververgoeding blijft, kosten apart', value27, panelCost),
    scenarioMetBatterij: scenario('Panelen + batterij in 2027', `Vanaf 2027 met ${capacity} kWh thuisbatterij; inclusief opslagverlies`, batteryValue, panelCost + batteryCost),
    shockEffect2027: {
      jaarlijksVerlies: rounded(value26 - value27), cumulatiefVerlies5Jaar: rounded((value26 - value27) * 5),
      maandelijksVerlies: rounded((value26 - value27) / 12),
      boodschap: `Door het einde van salderen en de ingevulde kosten verandert de geraamde jaarwaarde van €${rounded(value26)} in 2026 naar €${rounded(value27)} in 2027.`,
    },
    aanbeveling: recommendBattery ? 'beide' : 'panelen',
    aanbevelingTekst: `${value27 <= 0 && !recommendBattery ? 'Met deze invoer is de geraamde jaarwaarde nul of negatief. Controleer uw gegevens en contract voordat u een investering overweegt. ' : ''}Alleen panelen leveren in het 2027-scenario €${rounded(value27)}/jaar aan geraamde energiewaarde. De batterij verandert dit met €${rounded(extra)}/jaar bij €${batteryCost} investering. ${recommendBattery ? `De eenvoudige extra terugverdientijd is ${batteryPayback} jaar; laat de haalbaarheid toetsen.` : 'Een batterij wordt met deze invoer niet geadviseerd: de totale jaarwaarde, het extra voordeel of de extra terugverdientijd voldoet niet aan de beoordelingsgrenzen.'}`,
    isdeSchatting: { bedragEur: 0, apparaatType: 'Geen ISDE voor zonnepanelen of thuisbatterij', vermogenKwp: Math.round(panelen * 4) / 10 },
    calculation: {
      input: { ...input }, assumptions, batteryExtraAnnualEur: rounded(extra), batteryInvestmentEur: batteryCost,
      batteryPaybackYears: batteryPayback, batteryCapacityKwh: capacity, directUseKwh: direct, exportKwh,
      batteryDeliveredKwh: delivered, batteryLossKwh: loss,
    },
  }
}
