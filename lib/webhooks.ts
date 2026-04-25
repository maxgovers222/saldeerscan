import 'server-only'
import { createHmac } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase/admin'

function signPayload(payload: string, apiKeyHash: string): string {
  return createHmac('sha256', apiKeyHash)
    .update(payload)
    .digest('hex')
}

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

async function getActivePartners(lead: Record<string, unknown>): Promise<B2BPartner[]> {
  const { data: partners, error } = await supabaseAdmin
    .from('b2b_partners')
    .select('id, naam, webhook_url, api_key_hash, lead_filter')
    .eq('actief', true)

  if (error || !partners) return []

  // Apply lead_filter to each partner
  return partners.filter((partner: B2BPartner) => {
    const filter = partner.lead_filter ?? {}

    if (filter.min_health_score && (lead.health_score as number) < filter.min_health_score) return false
    if (filter.netcongestie_exclude?.includes(lead.netcongestie_status as string)) return false
    if (filter.provincie && !(filter.provincie as string[]).includes(lead.provincie as string)) return false
    return true
  })
}

export async function dispatchToPartners(leadId: string): Promise<{ dispatched: number; reason?: string }> {
  // Fetch the full enriched lead
  const { data: lead, error } = await supabaseAdmin
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single()

  if (error || !lead) {
    console.error('[webhooks] lead niet gevonden:', leadId)
    return { dispatched: 0, reason: 'lead_not_found' }
  }

  // GDPR consent gate — never dispatch without consent
  if (!lead.gdpr_consent) {
    console.warn(`[webhooks] Lead ${leadId} heeft geen GDPR consent — webhook geblokkeerd`)
    return { dispatched: 0, reason: 'no_consent' }
  }

  const partners = await getActivePartners(lead as Record<string, unknown>)
  let dispatched = 0
  const RETRY_DELAYS_SECONDS = [5 * 60, 30 * 60, 4 * 3600] // 5m, 30m, 4h

  for (const partner of partners) {
    const payload = JSON.stringify({
      event: 'lead.technisch_dossier',
      lead_id: lead.id,
      timestamp: new Date().toISOString(),
      adres: lead.adres,
      postcode: lead.postcode,
      stad: lead.stad,
      provincie: lead.provincie,
      health_score: lead.health_score,
      netcongestie: lead.netcongestie_status,
      bag: lead.bag_data,
      roi: lead.roi_berekening,
      meterkast: lead.meterkast_analyse,
      plaatsing: lead.plaatsing_analyse,
      omvormer: lead.omvormer_analyse,
      isde: lead.isde_pre_fill,
      contact: {
        naam: lead.naam,
        email: lead.email,
        telefoon: lead.telefoon,
      },
    })

    const signature = signPayload(payload, partner.api_key_hash)
    let fetchRes: Response | null = null

    try {
      fetchRes = await fetch(partner.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WEP-Signature': signature,
          'X-WEP-Version': '1.0',
          'X-WEP-Lead-ID': lead.id,
        },
        body: payload,
        signal: AbortSignal.timeout(10_000),
      })

      if (fetchRes.ok) {
        dispatched++
        console.log(`[webhooks] Dispatched to ${partner.naam}`)
        await supabaseAdmin.from('webhook_deliveries').upsert({
          lead_id: leadId, partner_id: partner.id, partner_naam: partner.naam,
          webhook_url: partner.webhook_url, status: 'delivered', attempts: 1,
          delivered_at: new Date().toISOString(),
        }, { onConflict: 'lead_id,partner_id' })
      } else {
        console.error(`[webhooks] ${partner.naam} responded ${fetchRes.status}`)
        throw new Error(`HTTP ${fetchRes.status}`)
      }
    } catch (err) {
      const { data: existing } = await supabaseAdmin
        .from('webhook_deliveries').select('attempts').eq('lead_id', leadId).eq('partner_id', partner.id).maybeSingle()
      const attempts = (existing?.attempts ?? 0) + 1
      const delay = RETRY_DELAYS_SECONDS[attempts - 1] ?? null
      await supabaseAdmin.from('webhook_deliveries').upsert({
        lead_id: leadId, partner_id: partner.id, partner_naam: partner.naam,
        webhook_url: partner.webhook_url,
        status: delay ? 'pending_retry' : 'failed',
        attempts,
        last_error: fetchRes ? `HTTP ${fetchRes.status}` : String(err),
        next_retry_at: delay ? new Date(Date.now() + delay * 1000).toISOString() : null,
      }, { onConflict: 'lead_id,partner_id' })
    }
  }

  // Mark as exported
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

// Bulk buyer adapter — activeer door BULK_BUYER_URL + BULK_BUYER_API_KEY in te stellen
export async function dispatchToBulkBuyer(lead: Record<string, unknown>): Promise<void> {
  const url = process.env.BULK_BUYER_URL
  const apiKey = process.env.BULK_BUYER_API_KEY
  if (!url || !apiKey) return

  // GDPR consent gate
  if (!lead.gdpr_consent) {
    console.warn('[webhooks/bulk] Lead zonder GDPR consent — overgeslagen')
    return
  }

  const payload = JSON.stringify({
    event: 'lead.new',
    timestamp: new Date().toISOString(),
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
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: payload,
      signal: AbortSignal.timeout(10_000),
    })
    if (res.ok) {
      console.log('[webhooks/bulk] Lead verstuurd naar bulk inkoper')
    } else {
      console.error('[webhooks/bulk] Bulk inkoper responded', res.status)
    }
  } catch (err) {
    console.error('[webhooks/bulk] Error:', err)
  }
}
