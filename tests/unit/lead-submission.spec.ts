import { expect, test } from '@playwright/test'
import {
  LeadSubmissionError,
  deriveLeadAnalysis,
  parseLeadSubmission,
  readBoundedJson,
} from '@/lib/lead-submission'

const validBody = {
  naam: 'Jan de Vries',
  email: ' JAN@Voorbeeld.NL ',
  telefoon: '+31612345678',
  adres: 'Prinsengracht 263, Amsterdam',
  postcode: '1016 GV',
  gdprConsent: true,
  bagData: {
    bouwjaar: 1940,
    oppervlakte: 110,
    woningtype: 'Woning',
    postcode: '1016 GV',
    huisnummer: 263,
    dakOppervlakte: 55,
    lat: 52.3752,
    lon: 4.8839,
  },
  roiInput: {
    oppervlakte: 110,
    bouwjaar: 1940,
    dakOppervlakte: 48,
    huidigVerbruikKwh: 3600,
    aantalPanelenOverride: 10,
    kwhPerPaneel: 370,
    dakrichting: 'Zuid',
    huishouden_grootte: 2,
  },
  energielabel: 'A++',
  healthScore: 100,
  roiResult: { forged: true },
}

test('normalizes contact and postcode values', () => {
  const parsed = parseLeadSubmission(validBody)
  expect(parsed.email).toBe('jan@voorbeeld.nl')
  expect(parsed.postcode).toBe('1016GV')
  expect(parsed.telefoon).toBe('+31612345678')
})

test('rejects one-part names and malformed contact fields', () => {
  expect(() => parseLeadSubmission({ ...validBody, naam: 'Jan' }))
    .toThrow(LeadSubmissionError)
  expect(() => parseLeadSubmission({ ...validBody, email: 'jan@invalid' }))
    .toThrow(LeadSubmissionError)
  expect(() => parseLeadSubmission({ ...validBody, telefoon: '123' }))
    .toThrow(LeadSubmissionError)
})

test('rejects unbounded or contradictory calculation input', () => {
  expect(() => parseLeadSubmission({
    ...validBody,
    roiInput: { ...validBody.roiInput, dakOppervlakte: 50_000 },
  })).toThrow(/dakOppervlakte/)
  expect(() => parseLeadSubmission({
    ...validBody,
    roiInput: { ...validBody.roiInput, bouwjaar: 2020 },
  })).toThrow(/bouwjaar.*BAG/i)
})

test('ignores forged client result and score', () => {
  const parsed = parseLeadSubmission(validBody)
  const analysis = deriveLeadAnalysis(parsed, 'ORANJE')
  expect(analysis.health.score).not.toBe(100)
  expect(analysis.roi).toMatchObject({
    geschatVerbruikKwh: 3600,
    aantalPanelen: 10,
  })
  const withoutForgedLabel = deriveLeadAnalysis(
    parseLeadSubmission({ ...validBody, energielabel: undefined }),
    'ORANJE',
  )
  expect(analysis.health.score).toBe(withoutForgedLabel.health.score)
})

test('bounds customer scenario controls to the actual UI contract', () => {
  expect(() => parseLeadSubmission({
    ...validBody,
    roiInput: { ...validBody.roiInput, dakOppervlakte: 56 },
  })).toThrow(/dakOppervlakte/i)
  expect(() => parseLeadSubmission({
    ...validBody,
    roiInput: { ...validBody.roiInput, aantalPanelenOverride: 41 },
  })).toThrow(/aantalPanelenOverride/i)
  expect(() => parseLeadSubmission({
    ...validBody,
    roiInput: { ...validBody.roiInput, kwhPerPaneel: 500 },
  })).toThrow(/kwhPerPaneel/i)
})

test('rejects oversized request bodies before parsing', async () => {
  const request = new Request('https://saldeerscan.nl/api/leads', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ value: 'x'.repeat(200_000) }),
  })
  await expect(readBoundedJson(request, 128_000)).rejects.toMatchObject({
    status: 413,
  })
})
