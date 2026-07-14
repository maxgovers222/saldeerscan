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
  expect(report.summary.annualSavingEur).toBe(820)
  expect(report.recommendation.panelCount).toBe(10)
  expect(report.recommendation.batteryCapacityKwh).toBe(10)
  expect(report.scenarios.withBattery.besparingJaarEur).toBe(1180)
  expect(report.salderingTimeline).toEqual([
    { year: 2024, compensationPct: 100 },
    { year: 2025, compensationPct: 64 },
    { year: 2026, compensationPct: 28 },
    { year: 2027, compensationPct: 0 },
  ])
  expect(report.recommendation.primarySolution).toBe('Zonnepanelen en thuisbatterij')
  expect(report.delivery.emailStatus).toBe('sent')
})

test('uses battery delta for a home with existing panels', () => {
  const report = buildReportModel(reportSourceExistingPanels)!
  expect(report.summary.annualSavingEur).toBe(1180)
  expect(report.recommendation.investmentEur).toBe(4000)
  expect(report.recommendation.extraAnnualSavingEur).toBe(360)
  expect(report.recommendation.paybackYears).toBe(11.1)
  expect(report.recommendation.primarySolution).toBe('Thuisbatterij en slim verbruik')
})

test('returns null for corrupt or incomplete ROI data', () => {
  expect(buildReportModel({
    ...reportSourceNoPanels,
    roiResult: { forged: true },
  })).toBeNull()
})
