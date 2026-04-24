import { supabaseAdmin } from '@/lib/supabase/admin'

const BATCH_SIZE = 200
const BASE_URL = 'https://saldeerscan.nl'

// Vaste extra URLs (kennisbank, nieuws, provincies) die altijd meegenomen worden
const STATIC_URLS = [
  `${BASE_URL}/kennisbank`,
  `${BASE_URL}/nieuws`,
  `${BASE_URL}/noord-holland`,
  `${BASE_URL}/zuid-holland`,
  `${BASE_URL}/utrecht`,
  `${BASE_URL}/noord-brabant`,
  `${BASE_URL}/gelderland`,
  `${BASE_URL}/overijssel`,
  `${BASE_URL}/friesland`,
  `${BASE_URL}/groningen`,
  `${BASE_URL}/drenthe`,
  `${BASE_URL}/flevoland`,
  `${BASE_URL}/zeeland`,
  `${BASE_URL}/limburg`,
]

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const saJson = process.env.GOOGLE_INDEXING_SA_KEY
  if (!saJson) return Response.json({ error: 'GOOGLE_INDEXING_SA_KEY ontbreekt' }, { status: 500 })

  // Haal alle gepubliceerde slugs op
  const { data: pages, error } = await supabaseAdmin
    .from('pseo_pages')
    .select('slug')
    .eq('status', 'published')
    .order('aantal_woningen', { ascending: false, nullsFirst: false })

  if (error || !pages) {
    return Response.json({ error: 'DB query mislukt', detail: error?.message }, { status: 500 })
  }

  const allSlugs = pages.map(p => `${BASE_URL}${p.slug}`)

  // Gebruik dag van het jaar om te bepalen welke batch vandaag aan de beurt is
  // Zo roteert het automatisch door alle URLs zonder dat er state bijgehouden hoeft te worden
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  )
  const effectiveBatch = BATCH_SIZE - STATIC_URLS.length // ~186 wijk/straat URLs per dag
  const offset = (dayOfYear * effectiveBatch) % Math.max(allSlugs.length, 1)
  const batchSlugs = allSlugs.slice(offset, offset + effectiveBatch)

  // Combineer met statische URLs
  const urlsToPin = [...STATIC_URLS, ...batchSlugs]

  // Ping via Google Indexing API
  const sa = JSON.parse(saJson) as { client_email: string; private_key: string; token_uri: string }
  const token = await getAccessToken(sa)

  let ok = 0, fail = 0
  for (const url of urlsToPin) {
    const success = await pingUrl(url, token)
    if (success) ok++; else fail++
    await new Promise(r => setTimeout(r, 100))
  }

  return Response.json({
    ok,
    fail,
    batch: { offset, size: batchSlugs.length },
    total: allSlugs.length,
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
  } catch { return false }
}
