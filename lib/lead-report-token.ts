import { createHmac, timingSafeEqual } from 'crypto'

const PAYLOAD_PREFIX = 'lead-report:v1:'

function hmacKey(): Buffer | null {
  const s =
    process.env.LEAD_REPORT_HMAC_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ''
  if (!s) return null
  return Buffer.from(s, 'utf8')
}

/** Ondertekent `leadId` voor gebruik in `?token=` op rapport-URL's (e-mail + hydration). */
export function signLeadReportAccessToken(leadId: string): string | null {
  const key = hmacKey()
  if (!key) return null
  return createHmac('sha256', key)
    .update(PAYLOAD_PREFIX + leadId)
    .digest('base64url')
}

export function verifyLeadReportAccessToken(
  leadId: string,
  token: string | null | undefined
): boolean {
  if (!token || !leadId) return false
  const expected = signLeadReportAccessToken(leadId)
  if (!expected) return false
  try {
    const a = Buffer.from(token, 'utf8')
    const b = Buffer.from(expected, 'utf8')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}
