import { expect, test } from '@playwright/test'
import { buildLeadConsentRecord, REPORT_CONSENT_TEXT, ADVICE_CONSENT_TEXT } from '../../lib/lead-consent'

test('report permission cannot trigger existing partner dispatchers', () => {
  expect(buildLeadConsentRecord(false)).toEqual({ gdpr_consent: false, consent_tekst: REPORT_CONSENT_TEXT })
})

test('sharing permission preserves exactly what the visitor accepted', () => {
  expect(buildLeadConsentRecord(true)).toEqual({
    gdpr_consent: true,
    consent_tekst: `${REPORT_CONSENT_TEXT}\n${ADVICE_CONSENT_TEXT}`,
  })
})
