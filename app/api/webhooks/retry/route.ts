import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { data: pending } = await supabaseAdmin
    .from('webhook_deliveries')
    .select('*')
    .eq('status', 'pending_retry')
    .lte('next_retry_at', new Date().toISOString())
    .limit(50)

  const RETRY_DELAYS_SECONDS = [5 * 60, 30 * 60, 4 * 3600]
  let retried = 0

  for (const delivery of pending ?? []) {
    try {
      const res = await fetch(delivery.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10_000),
      })

      if (res.ok) {
        await supabaseAdmin.from('webhook_deliveries').update({
          status: 'delivered',
          attempts: delivery.attempts + 1,
          delivered_at: new Date().toISOString(),
          next_retry_at: null,
        }).eq('id', delivery.id)
        retried++
      } else {
        const attempts = delivery.attempts + 1
        const delay = RETRY_DELAYS_SECONDS[attempts - 1] ?? null
        await supabaseAdmin.from('webhook_deliveries').update({
          status: delay ? 'pending_retry' : 'failed',
          attempts,
          last_error: `HTTP ${res.status}`,
          next_retry_at: delay ? new Date(Date.now() + delay * 1000).toISOString() : null,
        }).eq('id', delivery.id)
      }
    } catch (err) {
      await supabaseAdmin.from('webhook_deliveries').update({
        attempts: delivery.attempts + 1,
        last_error: String(err),
      }).eq('id', delivery.id)
    }
  }

  return NextResponse.json({ retried, processed: pending?.length ?? 0 })
}
