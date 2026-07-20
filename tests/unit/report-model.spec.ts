import { expect, test } from '@playwright/test'
import { buildReportModel } from '@/lib/report-model'
import {
  reportSourceExistingPanels,
  reportSourceNoPanels,
} from '../fixtures/report'

test('builds the new-installation report once', () => {
  const report = buildReportModel(reportSourceNoPanels)!
  expect(report.version).toBe(1)
  expect(report.impact.annualLossEur).toBe(400)
  expect(report.summary.annualSavingEur).toBe(780)
  expect(report.summary.paybackYears).toBe(9.6)
  expect(report.recommendation.panelCount).toBe(10)
  expect(report.recommendation.batteryCapacityKwh).toBe(10)
  expect(report.recommendation.investmentEur).toBe(7500)
  expect(report.scenarios.withBattery.besparingJaarEur).toBe(780)
  expect(report.salderingTimeline).toEqual([
    { year: 2024, compensationPct: 100 },
    { year: 2025, compensationPct: 100 },
    { year: 2026, compensationPct: 100 },
    { year: 2027, compensationPct: 0 },
  ])
  expect(report.recommendation.primarySolution).toBe('Zonnepanelen en thuisbatterij')
  expect(report.delivery.emailStatus).toBe('sent')
})

test('uses battery delta for a home with existing panels', () => {
  const report = buildReportModel(reportSourceExistingPanels)!
  expect(report.summary.annualSavingEur).toBe(360)
  expect(report.recommendation.investmentEur).toBe(4000)
  expect(report.recommendation.extraAnnualSavingEur).toBe(360)
  expect(report.recommendation.paybackYears).toBe(11.1)
  expect(report.recommendation.primarySolution).toBe('Thuisbatterij en slim verbruik')
})

test('recalculates a legacy 2026 battery result for the 2027 comparison', () => {
  const report = buildReportModel({
    ...reportSourceExistingPanels,
    calculationContext: { householdSize: 2 },
    roiResult: {
      ...reportSourceExistingPanels.roiResult,
      geschatVerbruikKwh: 4314,
      aantalPanelen: 14,
      productieKwh: 4900,
      scenarioNu: {
        naam: 'Nu installeren',
        beschrijving: 'Zonnepanelen in 2026',
        besparingJaarEur: 1778,
        investeringEur: 4900,
        terugverdientijdJaar: 2.8,
      },
      scenarioMetBatterij: {
        ...reportSourceExistingPanels.roiResult.scenarioMetBatterij,
        beschrijving: 'Zonnepanelen + 10 kWh thuisbatterij',
        besparingJaarEur: 1778,
        investeringEur: 8900,
      },
      scenarioWachten: {
        naam: 'Wachten',
        beschrijving: 'Na einde salderen',
        besparingJaarEur: 897,
        investeringEur: 4900,
        terugverdientijdJaar: 5.5,
      },
      aanbeveling: 'panelen',
    },
  })!

  expect(report.scenarios.withBattery.besparingJaarEur).toBe(1504)
  expect(report.summary.annualSavingEur).toBe(607)
  expect(report.recommendation.extraAnnualSavingEur).toBe(607)
  expect(report.recommendation.paybackYears).toBe(6.6)
  expect(report.recommendation.primarySolution).toBe('Thuisbatterij en slim verbruik')
})

test('normalizes an empty grid operator to unavailable', () => {
  const report = buildReportModel({
    ...reportSourceNoPanels,
    netcongestie: {
      ...reportSourceNoPanels.netcongestie,
      netbeheerder: '   ',
    },
  })!

  expect(report.grid.operator).toBeNull()
})

test('does not recommend a battery when the calculated storage benefit is zero', () => {
  const report = buildReportModel({
    ...reportSourceExistingPanels,
    roiResult: {
      ...reportSourceExistingPanels.roiResult,
      aanbeveling: 'panelen',
      scenarioMetBatterij: {
        ...reportSourceExistingPanels.roiResult.scenarioMetBatterij,
        besparingJaarEur: reportSourceExistingPanels.roiResult.scenarioWachten.besparingJaarEur,
      },
    },
  })!

  expect(report.summary.annualSavingEur).toBe(0)
  expect(report.summary.paybackYears).toBeNull()
  expect(report.recommendation.primarySolution).toBe('Slim verbruik met huidige zonnepanelen')
  expect(report.recommendation.batteryCapacityKwh).toBeNull()
  expect(report.recommendation.investmentEur).toBe(0)
})

test('returns null for corrupt or incomplete ROI data', () => {
  expect(buildReportModel({
    ...reportSourceNoPanels,
    roiResult: { forged: true },
  })).toBeNull()
})
