import { expect, test } from '@playwright/test'
import {
  berekenROI,
  LEVERINGSTARIEF,
  SALDERING_SCHEMA,
  TERUGLEVERTARIEF,
} from '@/lib/roi'

const input = {
  oppervlakte: 100,
  bouwjaar: 1995,
  dakOppervlakte: 40,
  huidigVerbruikKwh: 3000,
  aantalPanelenOverride: 10,
  kwhPerPaneel: 350,
}

test('uses the enacted 100%-to-0% saldering timeline', () => {
  expect(SALDERING_SCHEMA).toEqual({
    2025: 1,
    2026: 1,
    2027: 0,
  })
})

test('caps annual saldering at remaining grid consumption', () => {
  const result = berekenROI(input)
  const directUseKwh = 1050
  const remainingGridConsumptionKwh = 1950
  const excessExportKwh = 500
  const expected2026Value = Math.round(
    (directUseKwh + remainingGridConsumptionKwh) * LEVERINGSTARIEF +
    excessExportKwh * TERUGLEVERTARIEF,
  )

  expect(result.scenarioNu.besparingJaarEur).toBe(expected2026Value)
  expect(result.scenarioNu.beschrijving).toContain('100% salderen')
})

test('keeps a return-delivery payment in the 2027 estimate', () => {
  const result = berekenROI(input)
  const directUseKwh = 1050
  const exportKwh = 2450
  const expected2027Value = Math.round(
    directUseKwh * LEVERINGSTARIEF +
    exportKwh * TERUGLEVERTARIEF,
  )

  expect(result.scenarioWachten.besparingJaarEur).toBe(expected2027Value)
  expect(result.scenarioWachten.beschrijving).toContain('terugleververgoeding blijft')
  expect(result.shockEffect2027.boodschap).toContain('Door het einde van salderen')
  expect(result.isdeSchatting).toMatchObject({
    bedragEur: 0,
    apparaatType: 'Geen ISDE voor zonnepanelen of thuisbatterij',
  })
})
