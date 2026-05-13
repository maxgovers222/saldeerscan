/**
 * SaldeerScan.nl — Google Indexing API batch pinger voor pSEO-URL's
 *
 * Haalt alle gepubliceerde wijk- én straat-slugs op uit Supabase en pingt
 * de Google Indexing API. Volgorde: vaste hubs → INDEXING_PRIORITY_PATHS →
 * wijken (urgentie) → straten (volume), zie lib/indexing-priority.ts.
 *
 * Gebruik:
 *   npx tsx scripts/ping-wijk-indexing.ts               # Dagelijkse batch (hubs + quota)
 *   npx tsx scripts/ping-wijk-indexing.ts --dry-run     # Log URLs, ping niet
 *   npx tsx scripts/ping-wijk-indexing.ts --batch=0,50  # Subset op gesorteerde lijst (index range)
 *
 * Let op: Google Indexing API limiet is ~200 URL's per dag.
 */

import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createSign } from 'crypto'

const __dir = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dir, '..', '.env.local') })

import { createClient } from '@supabase/supabase-js'
import { buildPrioritizedIndexingUrls, orderedIndexingUrls } from '../lib/indexing-priority'

// ─── Config ─────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const BASE_URL     = 'https://saldeerscan.nl'
const DELAY_MS     = 200

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('\nFout: ontbrekende env vars in .env.local:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY\n')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ─── Google Indexing API (inlined: lib/google-indexing.ts gebruikt server-only) ──

interface ServiceAccount {
  client_email: string
  private_key:  string
  token_uri:    string
}

function base64url(input: string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now     = Math.floor(Date.now() / 1000)
  const header  = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64url(JSON.stringify({
    iss:   sa.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud:   sa.token_uri,
    exp:   now + 3600,
    iat:   now,
  }))

  const sign = createSign('RSA-SHA256')
  sign.update(`${header}.${payload}`)
  const signature = sign.sign(sa.private_key, 'base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  const jwt = `${header}.${payload}.${signature}`

  const res  = await fetch(sa.token_uri, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:  jwt,
    }),
  })

  const data = await res.json() as { access_token?: string }
  if (!data.access_token) throw new Error('Google OAuth2 token mislukt')
  return data.access_token
}

async function pingUrl(url: string, token: string): Promise<void> {
  const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${token}`,
    },
    body: JSON.stringify({ url, type: 'URL_UPDATED' }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`HTTP ${res.status}: ${body}`)
  }
}

// ─── CLI flags ───────────────────────────────────────────────────────────────

const args    = process.argv.slice(2)
const dryRun  = args.includes('--dry-run')
const batchArg = args.find(a => a.startsWith('--batch='))

let batchStart: number | null = null
let batchEnd:   number | null = null

if (batchArg) {
  const parts = batchArg.replace('--batch=', '').split(',')
  if (parts.length !== 2 || isNaN(Number(parts[0])) || isNaN(Number(parts[1]))) {
    console.error('Fout: --batch verwacht formaat START,END (bijv. --batch=0,50)')
    process.exit(1)
  }
  batchStart = Number(parts[0])
  batchEnd   = Number(parts[1])
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main(): Promise<void> {
  if (dryRun) console.log('[DRY-RUN] Modus actief — geen echte API calls')

  let token = ''
  if (!dryRun) {
    const saJson = process.env.GOOGLE_INDEXING_SA_KEY
    if (!saJson) {
      console.error('Fout: GOOGLE_INDEXING_SA_KEY niet ingesteld in .env.local')
      process.exit(1)
    }
    let sa: ServiceAccount
    try {
      sa = JSON.parse(saJson) as ServiceAccount
    } catch {
      console.error('Fout: GOOGLE_INDEXING_SA_KEY bevat geen geldig JSON')
      process.exit(1)
    }
    token = await getAccessToken(sa)
  }

  const { data, error } = await supabase
    .from('pseo_pages')
    .select('slug, straat, aantal_woningen, netcongestie_status, gem_bouwjaar, gem_health_score, generated_at')
    .eq('status', 'published')
    .order('aantal_woningen', { ascending: false, nullsFirst: false })

  if (error) {
    console.error('Supabase fout:', error.message)
    process.exit(1)
  }

  if (!data || data.length === 0) {
    console.log('Geen gepubliceerde pSEO-paginas gevonden.')
    return
  }

  let urlsToPing: string[]

  if (batchStart !== null && batchEnd !== null) {
    const ordered = orderedIndexingUrls(data)
    urlsToPing = ordered.slice(batchStart, batchEnd)
    console.log(`Batch ${batchStart}–${batchEnd - 1}: ${urlsToPing.length} URLs (gesorteerde volgorde)`)
  } else {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    )
    urlsToPing = buildPrioritizedIndexingUrls(data, { batchSize: 200, dayOfYear }).urls
    console.log(`Totaal in deze run: ${urlsToPing.length} URLs (hubs + prioriteit + window)`)
  }

  let successCount = 0
  const total = urlsToPing.length

  for (const url of urlsToPing) {
    if (!url.startsWith(BASE_URL)) {
      console.warn(`Sla over (verwacht ${BASE_URL}-prefix): ${url}`)
      continue
    }

    if (dryRun) {
      console.log(`[DRY-RUN] ✓ gepinged: ${url}`)
      successCount++
      continue
    }

    try {
      await pingUrl(url, token)
      console.log(`✓ gepinged: ${url}`)
      successCount++
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`✗ fout: ${url} — ${message}`)
    }

    await delay(DELAY_MS)
  }

  console.log(`\n${successCount} van ${total} URLs succesvol gepinged`)
}

main().catch(err => {
  console.error('Onverwachte fout:', err)
  process.exit(1)
})
