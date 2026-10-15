import { expect, test } from '@playwright/test'
import { getNetcongestie, UNKNOWN_GRID_EXPLANATION } from '../../lib/netcongestie'
import { buildReportModel } from '../../lib/report-model'
import { reportSourceNoPanels } from '../fixtures/report'

test('network checks make no database or provider requests and never invent a postcode color', async () => {
  const previousFetch = globalThis.fetch
  const calls: unknown[] = []
  globalThis.fetch = async (...args) => { calls.push(args); throw new Error('No verified feed is connected') }
  try {
    for (const postcode of ['1012AB', '3011 AA', '9999ZZ', 'invalid']) {
      const result = await getNetcongestie(postcode)
      expect(result).toMatchObject({ status: null, netbeheerder: 'Onbekend', terugleveringBeperkt: null, source: 'unavailable' })
      expect(result.uitleg).toBe(UNKNOWN_GRID_EXPLANATION)
    }
    expect(calls).toEqual([])
  } finally { globalThis.fetch = previousFetch }
})

test('legacy stored colors and guessed operators cannot become current report facts', () => {
  for (const status of ['ROOD', 'ORANJE', 'GROEN'] as const) {
    const report = buildReportModel({ ...reportSourceNoPanels, netcongestie: { status, netbeheerder: 'Guessed operator', uitleg: 'Claimed available capacity', terugleveringBeperkt: false } })!
    expect(report.grid).toEqual({ status: null, operator: null, explanation: UNKNOWN_GRID_EXPLANATION })
  }
})

test('a report without underlying home inputs does not present a stored score or contradictory battery tip', () => {
  const report = buildReportModel({ ...reportSourceNoPanels, bagData: null, healthScore: { ...reportSourceNoPanels.healthScore!, aanbevelingen: ['Een thuisbatterij is essentieel', 'Controleer uw dak op locatie'] } })!
  expect(report.summary.healthScore).toBeNull()
  expect(report.summary.healthLabel).toBeNull()
  expect(report.recommendations).toEqual(['Controleer uw dak op locatie'])
})
