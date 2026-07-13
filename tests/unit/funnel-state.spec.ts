import { expect, test } from '@playwright/test'
import {
  funnelReducer,
  makeInitialState,
  mergeSavedState,
  parseFunnelUrlContext,
  visualStageForStep,
} from '@/components/funnel/funnel-state'
import {
  decodeStoredFunnel,
  STORAGE_VERSION,
} from '@/components/funnel/funnel-storage'

test('maps six internal steps to four customer stages', () => {
  expect([1, 2, 3, 4, 5, 6].map(step =>
    visualStageForStep(step as 1 | 2 | 3 | 4 | 5 | 6),
  )).toEqual([1, 2, 3, 3, 3, 4])
})

test('keeps technical data when moving between visual stages', () => {
  const initial = makeInitialState()
  const withScan = funnelReducer(initial, {
    type: 'SET_METERKAST',
    meterkastAnalyse: {
      merk: 'ABB',
      drieFase: true,
      vrijeGroepen: 2,
      maxVermogenKw: 17,
      geschikt: true,
      opmerkingen: [],
    },
  })
  const report = funnelReducer(withScan, { type: 'SET_STEP', step: 6 })
  expect(report.meterkastAnalyse?.merk).toBe('ABB')
  expect(visualStageForStep(report.step)).toBe(4)
})

test('resets dependent analysis when a different address is selected', () => {
  const state = {
    ...makeInitialState(),
    adres: 'Oud adres',
    roiResult: {} as never,
    healthScore: {} as never,
    roiInput: {} as never,
  }
  const next = funnelReducer(state, {
    type: 'START_NEW_ADDRESS',
    adres: 'Nieuw adres',
  })
  expect(next.adres).toBe('Nieuw adres')
  expect(next.roiResult).toBeNull()
  expect(next.healthScore).toBeNull()
  expect(next.roiInput).toBeNull()
  expect(next.step).toBe(1)
})

test('report URL always wins and suppresses progress restore', () => {
  const url = parseFunnelUrlContext(new URLSearchParams({
    leadId: 'report-id',
    token: 'report-token',
  }))
  expect(url.mode).toBe('report')
  expect(url.allowResume).toBe(false)
})

test('explicit address remains active until the user explicitly restores saved progress', () => {
  const saved = { ...makeInitialState(), adres: 'Oud 1', step: 4 as const }
  const url = parseFunnelUrlContext(new URLSearchParams({
    adres: 'Nieuw 2',
  }))
  const current = makeInitialState({ adres: 'Nieuw 2' })
  expect(url.allowResume).toBe(true)
  expect(mergeSavedState(current, saved, url, 'keep-current').adres).toBe('Nieuw 2')
  expect(mergeSavedState(current, saved, url, 'resume-saved').adres).toBe('Oud 1')
})

test('pSEO context wins over saved regional context on explicit resume', () => {
  const saved = {
    ...makeInitialState({ wijk: 'oud', stad: 'oude-stad' }),
    step: 2 as const,
  }
  const url = parseFunnelUrlContext(new URLSearchParams({
    pseo_level: 'wijk',
    landing_path: '/utrecht/utrecht/leidsche-rijn',
    provincie: 'utrecht',
    stad: 'utrecht',
    wijk: 'leidsche-rijn',
  }))
  const merged = mergeSavedState(
    makeInitialState(),
    saved,
    url,
    'resume-saved',
  )
  expect(merged.step).toBe(2)
  expect(merged.wijk).toBe('leidsche-rijn')
  expect(merged.stad).toBe('utrecht')
  expect(merged.attribution.landingPath).toBe('/utrecht/utrecht/leidsche-rijn')
})

test('generic resume preserves saved regional attribution', () => {
  const saved = makeInitialState({
    wijk: 'leidsche-rijn',
    stad: 'utrecht',
    attribution: {
      landingPath: '/utrecht/utrecht/leidsche-rijn',
      pseoLevel: 'wijk',
    },
  })
  const url = parseFunnelUrlContext(new URLSearchParams())
  const merged = mergeSavedState(
    makeInitialState(),
    { ...saved, step: 2 },
    url,
    'resume-saved',
  )
  expect(merged.attribution.landingPath).toBe('/utrecht/utrecht/leidsche-rijn')
  expect(merged.attribution.pseoLevel).toBe('wijk')
})

test('drops old versions and sessions older than 30 days', () => {
  const now = Date.parse('2026-07-10T10:00:00Z')
  expect(decodeStoredFunnel(JSON.stringify({
    version: STORAGE_VERSION - 1,
    savedAt: now,
    state: makeInitialState(),
  }), now)).toBeNull()
  expect(decodeStoredFunnel(JSON.stringify({
    version: STORAGE_VERSION,
    savedAt: now - 31 * 24 * 60 * 60 * 1000,
    state: makeInitialState(),
  }), now)).toBeNull()
})

test('migrates the unversioned wep_funnel_state shape without losing progress', () => {
  const legacy = {
    ...makeInitialState(),
    step: 4 as const,
    adres: 'Oud 1',
    attribution: undefined,
    funnelSessionId: undefined,
    utmParams: {
      source: 'google',
      medium: 'organic',
      campaign: null,
      landingPage: '/utrecht/utrecht/leidsche-rijn',
    },
  }
  const restored = decodeStoredFunnel(JSON.stringify(legacy))
  expect(restored?.step).toBe(4)
  expect(restored?.adres).toBe('Oud 1')
  expect(restored?.attribution.utmSource).toBe('google')
})
