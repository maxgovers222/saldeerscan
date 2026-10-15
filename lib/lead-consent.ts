// Shared customer-facing and stored wording; report permission is separate from referral permission.
export const REPORT_CONSENT_TEXT = 'Ja, stuur mij het gratis PDF-rapport. SaldeerScan mag mijn gegevens gebruiken om mijn rapport te maken en te bezorgen.'
export const ADVICE_CONSENT_TEXT = 'Ik wil ook een doorverwijzing voor advies. SaldeerScan mag mijn contactgegevens en scandata delen met een installateur die hierover contact met mij mag opnemen.'

export function buildLeadConsentRecord(adviceConsent: boolean) {
  return {
    // Existing dispatchers use this field specifically to permit sharing.
    gdpr_consent: adviceConsent,
    consent_tekst: adviceConsent
      ? `${REPORT_CONSENT_TEXT}\n${ADVICE_CONSENT_TEXT}`
      : REPORT_CONSENT_TEXT,
  }
}
