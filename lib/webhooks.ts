import 'server-only'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  buildPartnerPayload,
  deliverPartnerWebhook,
  nextDeliveryState,
  signPartnerPayload,
  type PartnerEndpoint,
  type StoredLeadForWebhook,
} from '@/lib/webhook-delivery'

interface B2BPartner {
  id: string
  naam: string
  webhook_url: string
  api_key_hash: string
  lead_filter: {
    min_health_score?: number
    netcongestie_exclude?: string[]
    provincie?: string[]
  }
}

export interface PreparedPartnerDelivery {
  leadId: string
  partner: PartnerEndpoint
  payloadBody: string
}

async function getActivePartners(lead: Record<string, unknown>): Promise<B2BPartner[]> {
  const { data: partners, error } = await supabaseAdmin
    .from('b2b_partners')
    .select('id, naam, webhook_url, api_key_hash, lead_filter')
    .eq('actief', true)

  if (error || !partners) return []

  return partners.filter((partner: B2BPartner) => {
    const filter = partner.lead_filter ?? {}

    if (filter.min_health_score && (lead.health_score as number) < filter.min_health_score) return false
    if (filter.netcongestie_exclude?.includes(lead.netcongestie_status as string)) return false
    if (filter.provincie && !(filter.provincie as string[]).includes(lead.provincie as string)) return false
    return true
  })
}

export async function preparePartnerDeliveries(leadId: string): Promise<PreparedPartnerDelivery[]> {
  const { data: lead, error } = await supabaseAdmin
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single()

  if (error || !lead) {
    console.error('[webhooks] lead niet gevonden:', leadId)
    return []
  }

  if (!lead.gdpr_consent) {
    console.warn(`[webhooks] Lead ${leadId} heeft geen GDPR consent — webhook geblokkeerd`)
    return []
  }

  const partners = await getActivePartners(lead as Record<string, unknown>)
  const prepared: PreparedPartnerDelivery[] = []

  for (const partner of partners) {
    const payloadBody = buildPartnerPayload(lead as StoredLeadForWebhook)
    const payloadSignature = signPartnerPayload(payloadBody, partner.api_key_hash)
    const { error: queueError } = await supabaseAdmin
      .from('webhook_deliveries')
      .upsert({
        lead_id: leadId,
        partner_id: partner.id,
        partner_naam: partner.naam,
        webhook_url: partner.webhook_url,
        status: 'pending_retry',
        attempts: 0,
        last_error: null,
        next_retry_at: new Date().toISOString(),
        delivered_at: null,
        payload_body: payloadBody,
        payload_signature: payloadSignature,
      }, { onConflict: 'lead_id,partner_id' })

    if (queueError) {
      console.error('[webhooks] delivery queue insert failed:', queueError.message)
      continue
    }

    prepared.push({
      leadId: lead.id,
      payloadBody,
      partner: partner as PartnerEndpoint,
    })
  }

  return prepared
}

export async function dispatchPreparedPartnerDeliveries(
  prepared: PreparedPartnerDelivery[],
): Promise<{ dispatched: number }> {
  if (prepared.length === 0) return { dispatched: 0 }

  const leadId = prepared[0].leadId
  let dispatched = 0

  for (const preparedDelivery of prepared) {
    const { leadId: deliveryLeadId, payloadBody, partner } = preparedDelivery

    const result = await deliverPartnerWebhook({
      leadId: deliveryLeadId,
      payloadBody,
      partner,
    })

    if (result.ok) {
      dispatched++
      console.log(`[webhooks] Dispatched to ${partner.naam}`)
      await supabaseAdmin.from('webhook_deliveries').upsert({
        lead_id: deliveryLeadId,
        partner_id: partner.id,
        partner_naam: partner.naam,
        webhook_url: partner.webhook_url,
        status: 'delivered',
        attempts: 1,
        last_error: null,
        next_retry_at: null,
        delivered_at: new Date().toISOString(),
        payload_body: result.payloadBody,
        payload_signature: result.signature,
      }, { onConflict: 'lead_id,partner_id' })
    } else {
      console.error(`[webhooks] ${partner.naam} failed:`, result.error)
      await supabaseAdmin.from('webhook_deliveries').upsert({
        lead_id: deliveryLeadId,
        partner_id: partner.id,
        partner_naam: partner.naam,
        webhook_url: partner.webhook_url,
        payload_body: result.payloadBody,
        payload_signature: result.signature,
        ...nextDeliveryState(1, result.error ?? 'Onbekende webhookfout'),
      }, { onConflict: 'lead_id,partner_id' })
    }
  }

  const { error: updateError } = await supabaseAdmin
    .from('leads')
    .update({
      b2b_export_status: dispatched > 0 ? 'exported' : 'failed',
      b2b_exported_at: new Date().toISOString(),
    })
    .eq('id', leadId)
  if (updateError) console.error('[webhooks] export status update failed:', updateError.message)

  return { dispatched }
}

/** @deprecated Use preparePartnerDeliveries + dispatchPreparedPartnerDeliveries */
export async function dispatchToPartners(leadId: string): Promise<{ dispatched: number; reason?: string }> {
  const prepared = await preparePartnerDeliveries(leadId)
  if (prepared.length === 0) {
    const { data: lead } = await supabaseAdmin.from('leads').select('gdpr_consent').eq('id', leadId).maybeSingle()
    if (lead && !lead.gdpr_consent) return { dispatched: 0, reason: 'no_consent' }
    return { dispatched: 0, reason: 'no_partners' }
  }
  const { dispatched } = await dispatchPreparedPartnerDeliveries(prepared)
  return { dispatched }
}

export async function dispatchToBulkBuyer(leadId: string): Promise<void> {
  const { data: lead, error } = await supabaseAdmin
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single()
  if (error || !lead) {
    console.error('[webhooks/bulk] Lead niet gevonden:', leadId)
    return
  }

  const url = process.env.BULK_BUYER_URL
  const apiKey = process.env.BULK_BUYER_API_KEY
  if (!url || !apiKey) return
  if (!lead.gdpr_consent) {
    console.warn('[webhooks/bulk] Lead zonder GDPR consent — overgeslagen')
    return
  }

  const payload = JSON.stringify({
    event: 'lead.new',
    timestamp: lead.created_at ?? new Date().toISOString(),
    lead_id: lead.id,
    naam: lead.naam,
    email: lead.email,
    telefoon: lead.telefoon,
    adres: lead.adres,
    postcode: lead.postcode,
    stad: lead.stad,
    provincie: lead.provincie,
    health_score: lead.health_score,
    netcongestie: lead.netcongestie_status,
    roi: lead.roi_berekening,
    gdpr_consent: true,
  })

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: payload,
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) {
      console.error('[webhooks/bulk] Bulk inkoper responded', response.status)
    } else {
      console.log('[webhooks/bulk] Lead verstuurd naar bulk inkoper')
    }
  } catch (dispatchError) {
    console.error('[webhooks/bulk] Error:', dispatchError)
  }
}
