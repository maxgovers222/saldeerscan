import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  buildPartnerPayload,
  deliverPartnerWebhook,
  nextDeliveryState,
  type PartnerEndpoint,
  type StoredLeadForWebhook,
} from '@/lib/webhook-delivery'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: Request) {
  if (!process.env.CRON_SECRET ||
      req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { data: pending, error: pendingError } = await supabaseAdmin
    .from('webhook_deliveries')
    .select('id, lead_id, partner_id, attempts, payload_body')
    .eq('status', 'pending_retry')
    .lte('next_retry_at', new Date().toISOString())
    .order('next_retry_at', { ascending: true })
    .limit(50)

  if (pendingError) {
    console.error('[webhooks/retry] query failed:', pendingError.message)
    return NextResponse.json({ error: 'retry_query_failed' }, { status: 500 })
  }

  let delivered = 0
  let rescheduled = 0
  let failed = 0

  for (const delivery of pending ?? []) {
    const [{ data: lead }, { data: partner }] = await Promise.all([
      supabaseAdmin.from('leads').select('*').eq('id', delivery.lead_id).maybeSingle(),
      supabaseAdmin
        .from('b2b_partners')
        .select('id, naam, webhook_url, api_key_hash, actief')
        .eq('id', delivery.partner_id)
        .maybeSingle(),
    ])

    const attempts = delivery.attempts + 1
    if (!lead || !partner || !partner.actief) {
      await supabaseAdmin.from('webhook_deliveries').update({
        status: 'failed',
        attempts,
        last_error: !lead ? 'lead_not_found' : 'partner_inactive_or_not_found',
        next_retry_at: null,
      }).eq('id', delivery.id)
      failed++
      continue
    }

    const payloadBody = delivery.payload_body
      ?? buildPartnerPayload(lead as StoredLeadForWebhook)
    const result = await deliverPartnerWebhook({
      leadId: delivery.lead_id,
      payloadBody,
      partner: partner as PartnerEndpoint,
    })

    if (result.ok) {
      await supabaseAdmin.from('webhook_deliveries').update({
        status: 'delivered',
        attempts,
        last_error: null,
        delivered_at: new Date().toISOString(),
        next_retry_at: null,
        payload_body: result.payloadBody,
        payload_signature: result.signature,
      }).eq('id', delivery.id)
      delivered++
      continue
    }

    const next = nextDeliveryState(
      attempts,
      result.error ?? 'Onbekende webhookfout',
    )
    await supabaseAdmin.from('webhook_deliveries')
      .update({
        ...next,
        payload_body: result.payloadBody,
        payload_signature: result.signature,
      })
      .eq('id', delivery.id)
    if (next.status === 'failed') failed++
    else rescheduled++
  }

  console.info('[webhooks/retry] completed', {
    processed: pending?.length ?? 0,
    delivered,
    rescheduled,
    failed,
  })
  return NextResponse.json({
    processed: pending?.length ?? 0,
    delivered,
    rescheduled,
    failed,
  })
}
