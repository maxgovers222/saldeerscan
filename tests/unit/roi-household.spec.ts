import { expect, test } from '@playwright/test'
import { berekenROI } from '@/lib/roi'
import { parseRoiInput } from '@/lib/roi-input'
import { buildReportModel, reportSourceFromStoredLead } from '@/lib/report-model'
import { parseStoredRoi } from '@/lib/roi-result-guard'
import { renderReportEmail } from '@/lib/report-email'
import { deriveLeadAnalysis, parseLeadSubmission } from '@/lib/lead-submission'
import { reportSourceExistingPanels } from '../fixtures/report'

const base = { oppervlakte: 100, bouwjaar: 1995, dakOppervlakte: 40, aantalPanelenOverride: 10, kwhPerPaneel: 350,
  huidigVerbruikKwh: 4000, jaarProductieKwh: 4000, directEigenGebruikPct: 25,
  leveringstarief: 0.30, kaalLeveringstarief: 0.20, teruglevertarief: 0.10 }

test('uses measured production once, separates fees and accounts for storage losses', () => {
  const roi = berekenROI({ ...base, dakrichting: 'Zuid', terugleverkosten2026Eur: 200, terugleverkosten2027Eur: 100,
    terugleverkostenPerKwh2026: 0.01, terugleverkostenPerKwh2027: 0.02,
    eigenGebruikMetBatterijPct: 70, batterijRendementPct: 90, batterijInvesteringEur: 5000 })
  // 2026: 4,000 * .30 - 200 - 3,000 * .01 = 970.
  // 2027: 1,000 * .30 + 3,000 * .10 - 100 - 3,000 * .02 = 440.
  // Battery: 2,800 own-use, 1,000 export, 200 losses; 840 + 100 - 100 - 20 = 820.
  expect(roi.productieKwh).toBe(4000)
  expect(roi.scenarioNu.besparingJaarEur).toBe(970)
  expect(roi.scenarioWachten.besparingJaarEur).toBe(440)
  expect(roi.scenarioMetBatterij.besparingJaarEur).toBe(820)
  expect(roi.calculation).toMatchObject({ batteryDeliveredKwh: 1800, batteryLossKwh: 200, batteryExtraAnnualEur: 380, batteryPaybackYears: 13.2 })
  expect(roi.aanbeveling).toBe('panelen')
})

test('zero export incurs no return costs and creates no imaginary battery savings', () => {
  const roi = berekenROI({ ...base, directEigenGebruikPct: 100, terugleverkosten2027Eur: 500 })
  expect(roi.scenarioWachten.besparingJaarEur).toBe(1200)
  expect(roi.scenarioMetBatterij.besparingJaarEur).toBe(1200)
  expect(roi.calculation?.batteryPaybackYears).toBeNull()
  expect(roi.calculation?.exportKwh).toBe(0)
  expect(roi.aanbeveling).toBe('panelen')
})

test('zero or negative total value never produces a finite sentinel payback or a positive investment recommendation', () => {
  const zero = berekenROI({ ...base, aantalPanelenOverride: 0, jaarProductieKwh: 0 })
  const zeroReport = buildReportModel({ ...reportSourceExistingPanels, qualification: { isEigenaar: true, heeftPanelen: false, huidigePanelenAantal: null }, roiResult: zero })!
  expect(zeroReport.summary.paybackYears).toBeNull()
  expect(zeroReport.recommendation.primarySolution).toBe('Controleer uw invoer en contract')
  const negative = berekenROI({ ...base, terugleverkosten2027Eur: 5000, batterijInvesteringEur: 1000 })
  expect(negative.calculation!.batteryExtraAnnualEur).toBeGreaterThan(0)
  expect(negative.scenarioMetBatterij.besparingJaarEur).toBeLessThan(0)
  expect(negative.aanbeveling).toBe('panelen')
  const negativeReport = buildReportModel({ ...reportSourceExistingPanels, qualification: { isEigenaar: true, heeftPanelen: false, huidigePanelenAantal: null }, roiResult: negative })!
  expect(negativeReport.summary.paybackYears).toBeNull()
  expect(negativeReport.recommendation.batteryCapacityKwh).toBeNull()
  expect(negativeReport.recommendation.primarySolution).toBe('Controleer uw invoer en contract')
})

test('production above consumption cannot create more own use than demand', () => {
  const roi = berekenROI({ ...base, jaarProductieKwh: 10000, directEigenGebruikPct: 80 })
  expect(roi.eigenGebruikPct).toBe(40)
  expect(roi.scenarioNu.besparingJaarEur).toBe(1800)
  expect(roi.scenarioWachten.besparingJaarEur).toBe(1800)
  expect(roi.calculation?.batteryDeliveredKwh).toBe(0)
})

test('small storage is capped by capacity; expensive compensation can make storage harmful', () => {
  const capped = berekenROI({ ...base, batterijCapaciteitKwh: 1, batterijRendementPct: 90 })
  expect(capped.calculation?.batteryDeliveredKwh).toBe(328.5)
  const negative = berekenROI({ ...base, teruglevertarief: 0.50 })
  expect(negative.calculation!.batteryExtraAnnualEur).toBeLessThan(0)
  expect(negative.calculation?.batteryPaybackYears).toBeNull()
  expect(negative.aanbeveling).toBe('panelen')
})

test('explicit zero production/consumption/panels survives parsing and produces finite output', () => {
  const roi = berekenROI(parseRoiInput({ ...base, aantalPanelenOverride: 0, jaarProductieKwh: 0, huidigVerbruikKwh: 0 }))
  expect(roi.productieKwh).toBe(0)
  expect(roi.scenarioNu.besparingJaarEur).toBe(0)
  expect(roi.scenarioNu.terugverdientijdJaar).toBe(99)
  expect(parseStoredRoi(JSON.parse(JSON.stringify(roi)))).not.toBeNull()
})

test('rejects coercible or unbounded financial inputs instead of quietly producing NaN', () => {
  for (const change of [{ jaarProductieKwh: null }, { leveringstarief: true }, { directEigenGebruikPct: 101 }, { teruglevertarief: -1 }, { batterijRendementPct: 0 }, { aantalPanelenOverride: 1.5 }, { huidigVerbruikKwh: Infinity }]) {
    expect(() => parseRoiInput({ ...base, ...change })).toThrow()
  }
})

test('the saved/reopened report and email preserve the reviewed input, battery delta and assumptions', () => {
  const roi = berekenROI({ ...base, batterijInvesteringEur: 1000 })
  const reopened = buildReportModel(reportSourceFromStoredLead({
    id: 'fixture', created_at: '2026-10-13', roi_berekening: JSON.parse(JSON.stringify(roi)), heeft_panelen: true,
  }))!
  const fresh = buildReportModel({ ...reportSourceExistingPanels, roiResult: roi })!
  expect(reopened.calculation).toEqual(fresh.calculation)
  expect(reopened.summary).toMatchObject({ annualSavingEur: 340, paybackYears: 2.9 })
  expect(reopened.recommendation.batteryCapacityKwh).toBe(10)
  const email = renderReportEmail({ report: reopened, firstName: 'Test', reportUrl: 'https://example.test' })
  expect(email).toContain('€340')
  expect(email).toContain('Levering: €0.3/kWh')
  expect(email).toContain('200 kWh verlies per jaar')
})

test('contract input is server-authoritative in the lead path', () => {
  const lead = parseLeadSubmission({ naam: 'Test Gebruiker', email: 'test@example.nl', telefoon: null, gdprConsent: true,
    adres: 'Synthetisch testadres', bagData: { ...base, postcode: '1011AA', lat: 52, lon: 5 },
    roiInput: base, roiResult: { scenarioWachten: { besparingJaarEur: 999999 } }, adviceConsent: false })
  const actual = deriveLeadAnalysis(lead, 'GROEN').roi
  expect(actual.scenarioWachten.besparingJaarEur).toBe(600)
  expect(actual.calculation?.input.leveringstarief).toBe(0.30)
})
