import { createHmac } from 'node:crypto'

export const RETRY_DELAYS_SECONDS = [
  24 * 60 * 60,
  48 * 60 * 60,
  96 * 60 * 60,
] as const

export interface StoredLeadForWebhook {
  id: string
  created_at?: string | null
  adres?: unknown
  postcode?: unknown
  stad?: unknown
  provincie?: unknown
  health_score?: unknown
  netcongestie_status?: unknown
  bag_data?: unknown
  roi_berekening?: unknown
  meterkast_analyse?: unknown
  plaatsing_analyse?: unknown
  omvormer_analyse?: unknown
  isde_pre_fill?: unknown
  naam?: unknown
  email?: unknown
  telefoon?: unknown
}

export interface PartnerEndpoint {
  id: string
  naam: string
  webhook_url: string
  api_key_hash: string
}

export interface DeliveryState {
  status: 'pending_retry' | 'failed'
  attempts: number
  last_error: string
  next_retry_at: string | null
}

export function buildPartnerPayload(lead: StoredLeadForWebhook): string {
  return JSON.stringify({
    event: 'lead.technisch_dossier',
    lead_id: lead.id,
    timestamp: lead.created_at ?? null,
    adres: lead.adres ?? null,
    postcode: lead.postcode ?? null,
    stad: lead.stad ?? null,
    provincie: lead.provincie ?? null,
    health_score: lead.health_score ?? null,
    netcongestie: lead.netcongestie_status ?? null,
    bag: lead.bag_data ?? {},
    roi: lead.roi_berekening ?? {},
    meterkast: lead.meterkast_analyse ?? {},
    plaatsing: lead.plaatsing_analyse ?? {},
    omvormer: lead.omvormer_analyse ?? {},
    isde: lead.isde_pre_fill ?? {},
    contact: {
      naam: lead.naam ?? null,
      email: lead.email ?? null,
      telefoon: lead.telefoon ?? null,
    },
  })
}

export function signPartnerPayload(payload: string, key: string): string {
  return createHmac('sha256', key).update(payload).digest('hex')
}

export async function deliverPartnerWebhook(input: {
  leadId: string
  payloadBody: string
  partner: PartnerEndpoint
  fetchImpl?: typeof fetch
}): Promise<{
  ok: boolean
  status: number | null
  error: string | null
  payloadBody: string
  signature: string
}> {
  const fetchImpl = input.fetchImpl ?? fetch
  const body = input.payloadBody
  const signature = signPartnerPayload(body, input.partner.api_key_hash)
  try {
    const response = await fetchImpl(input.partner.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-WEP-Signature': signature,
        'X-WEP-Version': '1.0',
        'X-WEP-Lead-ID': input.leadId,
      },
      body,
      signal: AbortSignal.timeout(10_000),
    })
    return {
      ok: response.ok,
      status: response.status,
      error: response.ok ? null : `HTTP ${response.status}`,
      payloadBody: body,
      signature,
    }
  } catch (error) {
    return {
      ok: false,
      status: null,
      error: error instanceof Error ? error.message : String(error),
      payloadBody: body,
      signature,
    }
  }
}

export function nextDeliveryState(
  attempts: number,
  error: string,
  nowMs = Date.now(),
): DeliveryState {
  const delay = RETRY_DELAYS_SECONDS[attempts - 1] ?? null
  return {
    status: delay === null ? 'failed' : 'pending_retry',
    attempts,
    last_error: error,
    next_retry_at: delay === null
      ? null
      : new Date(nowMs + delay * 1000).toISOString(),
  }
}
