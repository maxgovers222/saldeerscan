// scripts/seed-kennisbank.ts
// Run with: npx tsx scripts/seed-kennisbank.ts
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import * as dotenv from 'dotenv'
import { buildArticleSchema } from '../lib/json-ld'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

const KENNISBANK_SLUGS = [
  'wat-is-salderen',
  'einde-salderen-2027-uitleg',
  'zonnepanelen-terugverdientijd-berekenen',
  'netcongestie-problemen-nederland',
  'energiebelasting-2027-veranderingen',
  'beste-zonnepanelen-2025',
  'zonnepanelen-subsidie-nederland',
  'salderingsregeling-afbouw-2026-2027',
  'omvormer-kiezen-zonnepanelen',
  'thuisbatterij-saldering-alternatief',
  'zonnepanelen-huurhuis-toegestaan',
  'energielabel-woning-verbeteren',
]

const KENNISBANK_TOPICS: Record<string, string> = {
  'wat-is-salderen': 'Wat is salderen? Uitleg van de salderingsregeling voor zonnepanelen',
  'einde-salderen-2027-uitleg': 'Einde salderen 2027: wat verandert er en wat kunt u doen?',
  'zonnepanelen-terugverdientijd-berekenen': 'Zonnepanelen terugverdientijd berekenen in 2025-2027',
  'netcongestie-problemen-nederland': 'Netcongestie in Nederland: oorzaken, gevolgen en oplossingen',
  'energiebelasting-2027-veranderingen': 'Energiebelasting 2027: wat verandert er voor zonnepaneelbezitters?',
  'beste-zonnepanelen-2025': 'Beste zonnepanelen 2025: welk merk en type past bij uw woning?',
  'zonnepanelen-subsidie-nederland': 'Zonnepanelen subsidie Nederland: alle regelingen op een rij',
  'salderingsregeling-afbouw-2026-2027': 'Salderingsregeling afbouw 2026-2027: stap voor stap uitgelegd',
  'omvormer-kiezen-zonnepanelen': 'Omvormer kiezen voor zonnepanelen: string vs micro vs optimizer',
  'thuisbatterij-saldering-alternatief': 'Thuisbatterij als alternatief voor saldering: rendement en kosten',
  'zonnepanelen-huurhuis-toegestaan': 'Zonnepanelen in een huurhuis: rechten, regels en mogelijkheden',
  'energielabel-woning-verbeteren': 'Energielabel woning verbeteren: van G naar A in stappen',
}

async function getExistingSlugs(): Promise<Set<string>> {
  const { data } = await supabase
    .from('kennisbank_articles')
    .select('slug')
    .eq('status', 'published')
  return new Set((data ?? []).map((r: { slug: string }) => r.slug))
}

async function generateAndUpsert(slug: string): Promise<void> {
  const topicTitle = KENNISBANK_TOPICS[slug] ?? slug.replace(/-/g, ' ')
  const allTopics = KENNISBANK_SLUGS.map(s => `${s}: ${KENNISBANK_TOPICS[s] ?? s}`).join('\n')

  const prompt = `Je bent een senior energie-adviseur en SEO-specialist voor SaldeerScan.nl.
Schrijf een uitgebreid kennisbank-artikel van precies 1200 woorden over: "${topicTitle}".

Context: SaldeerScan.nl helpt Nederlandse huiseigenaren de impact van het einde van de salderingsregeling op 1 januari 2027 te begrijpen. Doelgroep: Nederlandse woningbezitters met zonnepanelen of interesse daarin.

Vereisten:
- Minimaal 6 ## H2-koppen (markdown, geen #, geen ###)
- Concrete euro-bedragen en percentages
- Urgentie van de 2027-deadline
- Geen algemeenheden — elke alinea moet actionable zijn
- Geen emoji

Kies ook 3 gerelateerde onderwerpen voor interne links uit:
${allTopics}

Return ALLEEN dit JSON formaat (geen markdown omheen):
{
  "titel": "...",
  "metaDescription": "...",
  "intro": "...",
  "hoofdtekst": "...",
  "faqItems": [
    { "vraag": "...", "antwoord": "..." },
    { "vraag": "...", "antwoord": "..." },
    { "vraag": "...", "antwoord": "..." },
    { "vraag": "...", "antwoord": "..." },
    { "vraag": "...", "antwoord": "..." }
  ],
  "category": "saldering|zonnepanelen|netcongestie|subsidie|algemeen",
  "relatedSlugs": ["slug1", "slug2", "slug3"]
}

Veldlengtes: titel max 65 tekens, metaDescription max 155 tekens, intro ~150 woorden, hoofdtekst ~1200 woorden met ## koppen.`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error(`Geen JSON in response voor ${slug}`)

  const content = JSON.parse(jsonMatch[0])
  const now = new Date().toISOString()
  const jsonLd = buildArticleSchema({
    slug,
    titel: content.titel,
    metaDescription: content.metaDescription ?? '',
    publishedAt: now,
    type: 'kennisbank',
    faqItems: content.faqItems,
  })

  const { error } = await supabase
    .from('kennisbank_articles')
    .upsert({
      slug,
      titel: content.titel,
      meta_description: content.metaDescription ?? '',
      intro: content.intro ?? '',
      hoofdtekst: content.hoofdtekst,
      faq_items: content.faqItems ?? [],
      json_ld: jsonLd,
      category: content.category ?? 'algemeen',
      related_slugs: content.relatedSlugs ?? [],
      status: 'published',
      generated_at: now,
    }, { onConflict: 'slug' })

  if (error) throw new Error(`DB upsert mislukt voor ${slug}: ${error.message}`)
}

async function main() {
  const skipExisting = process.argv.includes('--skip-existing')
  const dryRun = process.argv.includes('--dry-run')

  console.log(`\nKennisbank seed — ${KENNISBANK_SLUGS.length} artikelen`)
  if (dryRun) console.log('DRY RUN — geen DB writes')

  const existing = await getExistingSlugs()
  const toProcess = skipExisting
    ? KENNISBANK_SLUGS.filter(s => !existing.has(s))
    : KENNISBANK_SLUGS

  console.log(`Te genereren: ${toProcess.length} artikelen\n`)

  for (const slug of toProcess) {
    if (existing.has(slug) && !skipExisting) {
      console.log(`  skip (al aanwezig): ${slug}`)
      continue
    }

    console.log(`  genereren: ${slug} ...`)
    if (dryRun) { console.log('  [dry-run skip]'); continue }

    try {
      await generateAndUpsert(slug)
      console.log(`  ✓ ${slug}`)
    } catch (err) {
      console.error(`  ✗ ${slug}: ${err}`)
    }

    // 2s delay — Gemini rate limit
    await new Promise(r => setTimeout(r, 2000))
  }

  console.log('\nKlaar.')
}

main().catch(console.error)
