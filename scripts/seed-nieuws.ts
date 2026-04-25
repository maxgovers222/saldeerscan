// scripts/seed-nieuws.ts
// Run with: npx tsx scripts/seed-nieuws.ts [--skip-existing] [--dry-run]
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

const NIEUWS_ITEMS = [
  { slug: 'saldering-afgebouwd-2026-update', titel: 'Saldering naar 28% in 2026: wat betekent dit voor uw zonnepanelen?' },
  { slug: 'netcongestie-kaart-2025', titel: "Nieuwe netcongestiekaart: deze regio's zijn vol" },
  { slug: 'thuisbatterij-subsidie-2025', titel: 'Subsidie thuisbatterij 2025: overzicht en aanvragen' },
  { slug: 'zonnepanelen-prijsdaling-2025', titel: 'Zonnepanelen 30% goedkoper in 2025: beste moment om te kopen?' },
  { slug: 'saldering-afschaffing-2027-definitief', titel: 'Saldering definitief afgeschaft per 1 januari 2027' },
  { slug: 'energiebelasting-teruggave-vervalt', titel: 'Teruggave energiebelasting vervalt: wat zijn uw opties?' },
  { slug: 'postcoderoos-uitgebreid-2025', titel: 'Postcoderoos regeling uitgebreid: deelnemen aan energie-coöperatie' },
  { slug: 'warmtepomp-zonnepanelen-combinatie', titel: 'Warmtepomp + zonnepanelen: de ideale combinatie voor 2027' },
]

async function getExistingSlugs(): Promise<Set<string>> {
  const { data } = await supabase
    .from('nieuws_articles')
    .select('slug')
    .eq('status', 'published')
  return new Set((data ?? []).map((r: { slug: string }) => r.slug))
}

async function generateAndUpsert(item: typeof NIEUWS_ITEMS[0]): Promise<void> {
  const prompt = `Je bent een senior energie-journalist voor SaldeerScan.nl.
Schrijf een Nederlands nieuwsartikel van ~600 woorden over: "${item.titel}".

Context: SaldeerScan.nl helpt Nederlandse huiseigenaren de impact van het einde van de salderingsregeling op 1 januari 2027 te begrijpen.

Vereisten:
- Minimaal 3 ## H2-koppen (markdown)
- Actuele feiten, euro-bedragen en percentages
- Urgentie van de 2027-deadline waar relevant
- Geen emoji, geen algemeenheden

Return ALLEEN dit JSON formaat (geen markdown omheen):
{
  "titel": "max 70 tekens",
  "metaDescription": "max 155 tekens",
  "intro": "~100 woorden lead-tekst",
  "hoofdtekst": "~600 woorden met ## koppen in markdown"
}`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error(`Geen JSON in response voor ${item.slug}`)

  const content = JSON.parse(jsonMatch[0])
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('nieuws_articles')
    .upsert({
      slug: item.slug,
      titel: content.titel ?? item.titel,
      meta_description: content.metaDescription ?? '',
      intro: content.intro ?? '',
      hoofdtekst: content.hoofdtekst,
      faq_items: [],
      json_ld: {},
      topic_seed: item.slug,
      status: 'published',
      published_at: now,
      generated_at: now,
    }, { onConflict: 'slug' })

  if (error) throw new Error(`DB upsert mislukt voor ${item.slug}: ${error.message}`)
}

async function main() {
  const skipExisting = process.argv.includes('--skip-existing')
  const dryRun = process.argv.includes('--dry-run')

  console.log(`\nNieuws seed — ${NIEUWS_ITEMS.length} artikelen`)
  if (dryRun) console.log('DRY RUN — geen DB writes')

  const existing = await getExistingSlugs()
  const toProcess = skipExisting
    ? NIEUWS_ITEMS.filter(item => !existing.has(item.slug))
    : NIEUWS_ITEMS

  console.log(`Te genereren: ${toProcess.length} artikelen\n`)

  for (const item of toProcess) {
    if (existing.has(item.slug) && !skipExisting) {
      console.log(`  skip (al aanwezig): ${item.slug}`)
      continue
    }

    console.log(`  genereren: ${item.slug} ...`)

    if (!dryRun) {
      try {
        await generateAndUpsert(item)
        console.log(`  ✓ ${item.slug}`)
      } catch (err) {
        console.error(`  ✗ ${item.slug}:`, err)
      }
    } else {
      console.log(`  [dry-run] ${item.titel}`)
    }

    // Gemini rate limiting: ~1 req/sec voor free tier
    await new Promise(r => setTimeout(r, 1100))
  }

  console.log('\nKlaar!')
}

main().catch(console.error)
