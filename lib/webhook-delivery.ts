import { createHmac } from 'node:crypto'
import {
  buildReportModel,
  reportSourceFromStoredLead,
} from '@/lib/report-model'

export const RETRY_DELAYS_SECONDS = [
  24 * 60 * 60,
  48 * 60 * 60,
  96 * 60 * 60,
] as const

export interface StoredLeadForWebhook extends Record<string, unknown> {
  id: string
  created_at?: string | null
  adres?: unknown
  wijk?: unknown
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
  is_eigenaar?: unknown
  heeft_panelen?: unknown
  huidige_panelen_aantal?: unknown
  report_email_status?: unknown
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
  const report = buildReportModel(reportSourceFromStoredLead(lead))
  if (!report) {
    throw new Error(`Lead ${lead.id} heeft geen geldig rapportmodel`)
  }

  return JSON.stringify({
    event: 'lead.technisch_dossier',
    lead_id: lead.id,
    timestamp: lead.created_at ?? null,
    report_version: report.version,
    report,
    adres: report.home.address,
    postcode: report.home.postcode,
    stad: report.home.stad,
    health_score: report.summary.healthScore,
    netcongestie: report.grid.status,
    bag: lead.bag_data ?? {},
    roi: lead.roi_berekening ?? {},
    meterkast: report.technical.meterkast,
    plaatsing: report.technical.plaatsing,
    omvormer: report.technical.omvormer,
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
