import { supabaseAdmin } from '@/lib/supabase/admin'
import { buildPrioritizedIndexingUrls } from '@/lib/indexing-priority'

const BATCH_SIZE = 200

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const saJson = process.env.GOOGLE_INDEXING_SA_KEY
  if (!saJson) return Response.json({ error: 'GOOGLE_INDEXING_SA_KEY ontbreekt' }, { status: 500 })

  const { data: pages, error } = await supabaseAdmin
    .from('pseo_pages')
    .select('slug, straat, aantal_woningen, netcongestie_status, gem_bouwjaar, gem_health_score, generated_at, last_pinged_at')
    .eq('status', 'published')
    .order('aantal_woningen', { ascending: false, nullsFirst: false })

  if (error || !pages) {
    return Response.json({ error: 'DB query mislukt', detail: error?.message }, { status: 500 })
  }

  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  )
  const { urls: urlsToPin, offset, dynamicCount } = buildPrioritizedIndexingUrls(pages, {
    batchSize: BATCH_SIZE,
    dayOfYear,
  })

  const sa = JSON.parse(saJson) as { client_email: string; private_key: string; token_uri: string }
  const token = await getAccessToken(sa)

  const nowIso = new Date().toISOString()
  let ok = 0
  let fail = 0
  for (const url of urlsToPin) {
    const success = await pingUrl(url, token)
    if (success) {
      ok++
      // Bijhouden wanneer deze URL voor het laatst gepingt is
      const path = url.replace('https://saldeerscan.nl', '')
      await supabaseAdmin
        .from('pseo_pages')
        .update({ last_pinged_at: nowIso })
        .eq('slug', path)
    } else {
      fail++
    }
    await new Promise(r => setTimeout(r, 100))
  }

  return Response.json({
    ok,
    fail,
    batch: { offset, size: dynamicCount },
    total: pages.length,
    day: dayOfYear,
  })
}

async function getAccessToken(sa: { client_email: string; private_key: string; token_uri: string }) {
  const { createSign } = await import('crypto')
  const now = Math.floor(Date.now() / 1000)
  const b64 = (s: string) => Buffer.from(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  const header = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = b64(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/indexing', aud: sa.token_uri, iat: now, exp: now + 3600 }))
  const sign = createSign('RSA-SHA256')
  sign.update(`${header}.${payload}`)
  const sig = sign.sign(sa.private_key, 'base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  const jwt = `${header}.${payload}.${sig}`
  const res = await fetch(sa.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })
  const data = await res.json() as { access_token?: string }
  if (!data.access_token) throw new Error('OAuth token mislukt')
  return data.access_token
}

async function pingUrl(url: string, token: string): Promise<boolean> {
  try {
    const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ url, type: 'URL_UPDATED' }),
    })
    return res.ok
  } catch {
    return false
  }
}
