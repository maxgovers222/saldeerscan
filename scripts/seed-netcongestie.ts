// scripts/seed-netcongestie.ts
// Run with: npx tsx scripts/seed-netcongestie.ts
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Same logic as netcongestie.ts but duplicated for standalone script
const CONGESTION_SEED = [
  { van: 1000, tot: 1109, status: 'ROOD' },
  { van: 1110, tot: 1299, status: 'ORANJE' },
  { van: 2490, tot: 2599, status: 'ROOD' },
  { van: 3010, tot: 3099, status: 'ROOD' },
  { van: 3500, tot: 3599, status: 'ORANJE' },
  { van: 8200, tot: 8299, status: 'ROOD' },
  { van: 8700, tot: 8799, status: 'ROOD' },
  { van: 4600, tot: 4799, status: 'ROOD' },
] as const

function getSeedStatus(prefix: number): 'ROOD' | 'ORANJE' | 'GROEN' {
  const match = CONGESTION_SEED.find(r => prefix >= r.van && prefix <= r.tot)
  if (match) return match.status
  if ((prefix >= 1000 && prefix <= 1999) || (prefix >= 2000 && prefix <= 3999)) return 'ORANJE'
  return 'GROEN'
}

const NETBEHEERDER_MAP = [
  { van: 1000, tot: 1999, naam: 'Liander' },
  { van: 2000, tot: 3999, naam: 'Stedin' },
  { van: 4000, tot: 9999, naam: 'Enexis' },
]

function getNetbeheerder(prefix: number): string {
  return NETBEHEERDER_MAP.find(r => prefix >= r.van && prefix <= r.tot)?.naam ?? 'Onbekend'
}

async function seed() {
  console.log('Seeding netcongestie_cache for all Dutch postcode prefixes (1000-9999)...')
  const rows = []
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days

  for (let prefix = 1000; prefix <= 9999; prefix++) {
    rows.push({
      postcode_prefix: String(prefix),
      status: getSeedStatus(prefix),
      netbeheerder: getNetbeheerder(prefix),
      capaciteit_details: { bron: 'seed_v1' },
      expires_at: expires,
    })
  }

  // Batch upsert in chunks of 500
  const chunkSize = 500
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const { error } = await supabase
      .from('netcongestie_cache')
      .upsert(chunk, { onConflict: 'postcode_prefix' })
    if (error) { console.error('Error at chunk', i, error); process.exit(1) }
    console.log(`Seeded ${Math.min(i + chunkSize, rows.length)} / ${rows.length}`)
  }
  console.log('Done! 9000 postcode prefixes seeded.')
}

seed().catch(console.error)
