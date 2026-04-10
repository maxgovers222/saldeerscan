/**
 * SaldeerScan.nl — pSEO Wijk Seeder v2
 *
 * Strategie: ALTIJD Gemini 2.5 Flash voor alle wijken — geen templates.
 * Elke pagina krijgt hyperlocale context via CBS PDOK WFS + unieke Gemini prompt.
 *
 * Data-bronnen:
 *   1. Hardcoded wijk-lijst (provincie/stad/bouwjaar/netcongestie)
 *   2. CBS PDOK WFS — aantal woningen per wijk (live fetch per wijk)
 *   3. Gemini 2.5 Flash — 800w unieke tekst + 5 FAQs + JSON-LD
 *
 * Gebruik:
 *   npx tsx scripts/seed-wijken.ts                  # Alle wijken (published)
 *   npx tsx scripts/seed-wijken.ts --dry-run        # Simuleer zonder DB/AI
 *   npx tsx scripts/seed-wijken.ts --skip-existing  # Sla reeds aanwezige over
 *   npx tsx scripts/seed-wijken.ts --batch=0,50     # Subset (index range)
 *
 * Kosten: ~€0.0002/wijk bij Gemini 2.5 Flash. 2000 wijken ≈ €0.40 totaal.
 */

import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dir, '..', '.env.local') })

import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY      = process.env.SUPABASE_SERVICE_ROLE_KEY!
const GOOGLE_KEY        = process.env.GOOGLE_AI_API_KEY!

if (!SUPABASE_URL || !SUPABASE_KEY || !GOOGLE_KEY) {
  console.error('\nFout: ontbrekende env vars in .env.local:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_AI_API_KEY\n')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const genAI    = new GoogleGenerativeAI(GOOGLE_KEY)

// ─── Types ──────────────────────────────────────────────────────────────────

type Netcongestie = 'ROOD' | 'ORANJE' | 'GROEN'

interface WijkEntry {
  wijk:         string
  stad:         string
  provincie:    string
  bouwjaar:     number
  netcongestie: Netcongestie
  /** Optioneel: handmatig opgeven als CBS-fetch mislukt */
  aantalWoningen?: number
}

interface RichContent {
  titel:          string
  metaDescription: string
  hoofdtekst:     string
  faqItems:       { vraag: string; antwoord: string }[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toSlug(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

function deriveHealthScore(bouwjaar: number, netcongestie: Netcongestie): number {
  let score = 70
  if      (bouwjaar >= 2005) score += 12
  else if (bouwjaar >= 2000) score += 8
  else if (bouwjaar >= 1990) score += 3
  else if (bouwjaar < 1970)  score -= 8
  if (netcongestie === 'ROOD')  score -= 5
  if (netcongestie === 'GROEN') score += 5
  return Math.min(95, Math.max(45, score))
}

// ─── CBS PDOK — aantal woningen per wijk ────────────────────────────────────

async function fetchAantalWoningen(wijk: string, stad: string): Promise<number | null> {
  try {
    const wijkEncoded = encodeURIComponent(wijk)
    const stadEncoded = encodeURIComponent(stad)
    const url = `https://service.pdok.nl/cbs/gebiedsindelingen/2023/wfs/v1_0`
      + `?service=WFS&version=2.0.0&request=GetFeature`
      + `&typeName=cbs_wijk_2023&outputFormat=application/json`
      + `&CQL_FILTER=wijknaam='${wijkEncoded}' AND gemeentenaam='${stadEncoded}'`
      + `&propertyName=wijknaam,gemeentenaam,aantalwoningen`
      + `&count=1`

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null

    const json = await res.json() as { features?: { properties?: { aantalwoningen?: number } }[] }
    const val = json.features?.[0]?.properties?.aantalwoningen
    return typeof val === 'number' && val > 0 ? val : null
  } catch {
    return null
  }
}

// ─── Gemini — unieke SEO-content per wijk ────────────────────────────────────

function buildPrompt(e: WijkEntry, aantalWoningen: number | null, score: number): string {
  const woningenTekst = aantalWoningen
    ? `${aantalWoningen.toLocaleString('nl-NL')} woningen (CBS 2023)`
    : 'een significante woningpopulatie'

  const netProfielTekst = {
    ROOD:   `Het elektriciteitsnet in ${e.wijk} staat onder maximale druk (status ROOD bij Netbeheer NL). Teruglevering van zonne-energie wordt hier al gereguleerd. Een thuisbatterij is voor woningbezitters in deze wijk géén luxe maar een noodzaak om zelf opgewekte stroom maximaal te benutten.`,
    ORANJE: `Het stroomnet in ${e.wijk} raakt toenemend vol (status ORANJE). Liander/Enexis verwacht hier in de komende jaren beperkingen op teruglevering. Thuisbatterijen worden daardoor steeds relevanter als buffer.`,
    GROEN:  `De netcapaciteit in ${e.wijk} is momenteel ruim beschikbaar (status GROEN). Dit biedt woningbezitters ideale omstandigheden voor maximale teruglevering — maar ook hier is het zaak vóór 2027 te handelen.`,
  }[e.netcongestie]

  const bouwjaarProfielTekst =
    e.bouwjaar >= 2010
      ? `Woningen in ${e.wijk} zijn overwegend nieuwbouw (${e.bouwjaar}). Ze hebben standaard een moderne groepenkast (3-fase), uitstekende dakisolatie en zijn direct klaar voor zonnepanelen zonder aanpassingen.`
      : e.bouwjaar >= 1995
      ? `Woningen uit de periode ${e.bouwjaar} in ${e.wijk} hebben doorgaans een goede dakconditie. De groepenkast is meestal al geschikt voor een omvormer, al kan een kleine upgrade wenselijk zijn.`
      : e.bouwjaar >= 1980
      ? `Woningen uit ${e.bouwjaar} in ${e.wijk} vereisen soms een groepenkast-upgrade (€300–€600). Het dak is in de meeste gevallen geschikt voor minimaal 10 zonnepanelen.`
      : `Woningen uit ${e.bouwjaar} in ${e.wijk} zijn wat ouder. Dakcheck en groepenkast-inspectie zijn standaard aanbevolen. Renovatiesubsidie (ISDE) kan hier een deel van de extra kosten dekken.`

  const besparingRange = e.bouwjaar >= 2000
    ? '€700–€1.100'
    : e.bouwjaar >= 1985
    ? '€500–€900'
    : '€350–€700'

  const terugverdien = e.netcongestie === 'ROOD'
    ? '6–8 jaar (met batterij: 8–11 jaar)'
    : '7–10 jaar'

  return `Je bent een senior energie-adviseur en SEO-specialist voor de Nederlandse markt. Schrijf een technisch-autoritair SEO-artikel van precies 800 woorden voor SaldeerScan.nl over de wijk ${e.wijk} in ${e.stad}.

HYPERLOCALE DATA (verwerk ALLE van deze specifieke feiten in de tekst):
- Wijk: ${e.wijk}, ${e.stad} (${e.provincie.replace(/-/g, ' ')})
- Aantal woningen: ${woningenTekst}
- Gemiddeld bouwjaar: ${e.bouwjaar}
- Netcongestie (Netbeheer NL): ${e.netcongestie}
- Energie-rendementsscore: ${score}/100
- Geschatte jaarlijkse besparing zonnepanelen: ${besparingRange}
- Terugverdientijd: ${terugverdien}

WIJK-SPECIFIEKE CONTEXT:
${bouwjaarProfielTekst}

NETPROFIEL:
${netProfielTekst}

SCHRIJFINSTRUCTIES:
1. Begin met een krachtige openingszin die ${e.wijk} en 2027 noemt — geen generieke inleiding
2. Verwerk concrete euro-bedragen, het specifieke bouwjaar ${e.bouwjaar} en de netcongestiestatus ${e.netcongestie} in elke sectie
3. Gebruik de term "salderingsregeling" minimaal 3x en "1 januari 2027" minimaal 2x
4. Schrijf in de tweede persoon ("u", "uw woning") — direct tegen de huiseigenaar in ${e.wijk}
5. Geen jargon, geen algemeenheden — iedere alinea moet specifiek voor ${e.wijk} voelen
6. Sluit af met een urgente maar niet agressieve oproep tot actie richting de gratis SaldeerScan

SEO-EISEN:
- Titel: max 60 tekens, bevat "${e.wijk}", "${e.stad}" en "2027"
- Meta-description: max 155 tekens, bevat "${e.wijk}" en "saldering"
- Gebruik H2-achtige tussenkoppen als alinea-openers (vetgedrukte lead-zinnen, geen HTML-tags)
- Voeg **dikgedrukte** kernbegrippen toe via **markdown** (maximaal 8 per tekst)

FAQ (5 stuks — hyperlocaal, niet generiek):
- Vraag 1: specifiek over netcongestie ${e.netcongestie} in ${e.wijk}
- Vraag 2: specifiek over bouwjaar ${e.bouwjaar} en dakgeschiktheid
- Vraag 3: over de financiële impact van 2027 voor woningen in ${e.stad}
- Vraag 4: over ISDE-subsidie en de specifieke situatie in ${e.provincie.replace(/-/g, ' ')}
- Vraag 5: over thuisbatterijen en de lokale netcongestie

Antwoord UITSLUITEND in dit JSON-formaat (geen tekst buiten de JSON):
{
  "titel": "...",
  "metaDescription": "...",
  "hoofdtekst": "...",
  "faqItems": [
    { "vraag": "...", "antwoord": "..." },
    { "vraag": "...", "antwoord": "..." },
    { "vraag": "...", "antwoord": "..." },
    { "vraag": "...", "antwoord": "..." },
    { "vraag": "...", "antwoord": "..." }
  ]
}`
}

async function generateContent(e: WijkEntry, aantalWoningen: number | null): Promise<RichContent> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
      // @ts-ignore — thinkingConfig supported in gemini-2.5-flash, kills thinking-token overhead
      thinkingConfig: { thinkingBudget: 0 },
    },
  })

  const score = deriveHealthScore(e.bouwjaar, e.netcongestie)
  const prompt = buildPrompt(e, aantalWoningen, score)

  // Retry tot 3x bij Gemini-fouten
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await model.generateContent(prompt)
      const text   = result.response.text()

      // Native JSON mode geeft schone JSON; als fallback: extraheer eerste {...}
      let parsed: RichContent
      try {
        parsed = JSON.parse(text) as RichContent
      } catch {
        const match = text.match(/\{[\s\S]*\}/)
        if (!match) throw new Error('Geen JSON in Gemini-respons')
        parsed = JSON.parse(match[0]) as RichContent
      }

      if (!parsed.titel || !parsed.hoofdtekst || !Array.isArray(parsed.faqItems)) {
        throw new Error('Onvolledige JSON-respons')
      }
      if (parsed.faqItems.length < 3) throw new Error('Te weinig FAQ items')
      return parsed
    } catch (err) {
      if (attempt < 3) {
        process.stdout.write(`    ↺ retry ${attempt}/3 voor ${e.wijk}...\n`)
        await sleep(2000 * attempt)
      } else {
        throw err
      }
    }
  }
  throw new Error('Gemini: max retries bereikt')
}

// ─── JSON-LD builder ────────────────────────────────────────────────────────

function buildJsonLd(e: WijkEntry, content: RichContent, aantalWoningen: number | null) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `https://saldeerscan.nl/${e.provincie}/${toSlug(e.stad)}/${toSlug(e.wijk)}#webpage`,
        name: content.titel,
        description: content.metaDescription,
        url: `https://saldeerscan.nl/${e.provincie}/${toSlug(e.stad)}/${toSlug(e.wijk)}`,
        inLanguage: 'nl-NL',
        about: {
          '@type': 'Place',
          name: `${e.wijk}, ${e.stad}`,
          addressLocality: e.stad,
          addressRegion: e.provincie.replace(/-/g, ' '),
          addressCountry: 'NL',
        },
        publisher: {
          '@type': 'Organization',
          name: 'SaldeerScan.nl',
          url: 'https://saldeerscan.nl',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: content.faqItems.map(faq => ({
          '@type': 'Question',
          name: faq.vraag,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.antwoord,
          },
        })),
      },
    ],
  }
}

// ─── Database upsert ─────────────────────────────────────────────────────────

async function seedWijk(e: WijkEntry, opts: { dryRun: boolean; skipExisting: boolean }) {
  const slug    = `/${e.provincie}/${toSlug(e.stad)}/${toSlug(e.wijk)}`
  const score   = deriveHealthScore(e.bouwjaar, e.netcongestie)

  if (opts.skipExisting) {
    const { data } = await supabase.from('pseo_pages').select('slug').eq('slug', slug).maybeSingle()
    if (data) {
      process.stdout.write(`    SKIP  ${slug}\n`)
      return 'skipped' as const
    }
  }

  // Haal CBS woningcount op
  const aantalWoningen = e.aantalWoningen ?? await fetchAantalWoningen(e.wijk, e.stad)

  if (opts.dryRun) {
    process.stdout.write(`    DRY   ${slug} (${aantalWoningen ?? '?'} woningen)\n`)
    return 'ok' as const
  }

  // Genereer Gemini content
  const content = await generateContent(e, aantalWoningen)
  const jsonLd  = buildJsonLd(e, content, aantalWoningen)

  const { error } = await supabase.from('pseo_pages').upsert(
    {
      slug,
      provincie:           e.provincie,
      stad:                toSlug(e.stad),
      wijk:                toSlug(e.wijk),
      straat:              null,
      titel:               content.titel,
      meta_description:    content.metaDescription,
      hoofdtekst:          content.hoofdtekst,
      faq_items:           content.faqItems,
      json_ld:             jsonLd,
      gem_bouwjaar:        e.bouwjaar,
      gem_health_score:    score,
      netcongestie_status: e.netcongestie,
      aantal_woningen:     aantalWoningen,
      status:              'published',
      generated_at:        new Date().toISOString(),
      revalidate_at:       new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    { onConflict: 'slug' }
  )

  if (error) {
    process.stdout.write(`  FOUT  ${slug}: ${error.message}\n`)
    return 'error' as const
  }

  const wCount = aantalWoningen ? ` (${aantalWoningen.toLocaleString('nl-NL')} won.)` : ''
  process.stdout.write(`  ✓ ${slug}${wCount}\n`)
  return 'ok' as const
}

// ─── Wijk-lijst ─────────────────────────────────────────────────────────────
// Volgorde: hoog zoekvolume / grote bevolking eerst.
// Uitbreiden: voeg entries toe aan het einde van WIJKEN.
// CBS WFS haalt aantalWoningen automatisch op — geen handmatige invulling nodig.

const WIJKEN: WijkEntry[] = [
  // ── Utrecht ──────────────────────────────────────────────────────────────
  { wijk: 'Leidsche Rijn',       stad: 'Utrecht',              provincie: 'utrecht',        bouwjaar: 2001, netcongestie: 'ORANJE' },
  { wijk: 'Vathorst',            stad: 'Amersfoort',           provincie: 'utrecht',        bouwjaar: 2002, netcongestie: 'ORANJE' },
  { wijk: 'Overvecht',           stad: 'Utrecht',              provincie: 'utrecht',        bouwjaar: 1966, netcongestie: 'ORANJE' },
  { wijk: 'Kanaleneiland',       stad: 'Utrecht',              provincie: 'utrecht',        bouwjaar: 1962, netcongestie: 'ORANJE' },
  { wijk: 'Lunetten',            stad: 'Utrecht',              provincie: 'utrecht',        bouwjaar: 1980, netcongestie: 'ORANJE' },
  { wijk: 'Vleuten-De Meern',    stad: 'Utrecht',              provincie: 'utrecht',        bouwjaar: 2000, netcongestie: 'ORANJE' },
  { wijk: 'Nieuwland',           stad: 'Amersfoort',           provincie: 'utrecht',        bouwjaar: 1990, netcongestie: 'ORANJE' },
  { wijk: 'Kattenbroek',         stad: 'Amersfoort',           provincie: 'utrecht',        bouwjaar: 1993, netcongestie: 'ORANJE' },
  { wijk: 'Hoogland-West',       stad: 'Amersfoort',           provincie: 'utrecht',        bouwjaar: 2002, netcongestie: 'ORANJE' },
  { wijk: 'Castellum',           stad: 'Houten',               provincie: 'utrecht',        bouwjaar: 2005, netcongestie: 'ORANJE' },
  { wijk: 'Jutphaas-Wijkersloot',stad: 'Nieuwegein',           provincie: 'utrecht',        bouwjaar: 1974, netcongestie: 'ORANJE' },
  { wijk: 'Batau-Noord',         stad: 'Nieuwegein',           provincie: 'utrecht',        bouwjaar: 1976, netcongestie: 'ORANJE' },
  { wijk: 'De Dragonder',        stad: 'Veenendaal',           provincie: 'utrecht',        bouwjaar: 1985, netcongestie: 'GROEN'  },
  { wijk: 'Schrijverswijk',      stad: 'Veenendaal',           provincie: 'utrecht',        bouwjaar: 2000, netcongestie: 'GROEN'  },

  // ── Noord-Holland ─────────────────────────────────────────────────────────
  { wijk: 'IJburg',              stad: 'Amsterdam',            provincie: 'noord-holland',  bouwjaar: 2004, netcongestie: 'ROOD'   },
  { wijk: 'Bijlmer-Centrum',     stad: 'Amsterdam',            provincie: 'noord-holland',  bouwjaar: 2000, netcongestie: 'ROOD'   },
  { wijk: 'Bijlmer-Oost',        stad: 'Amsterdam',            provincie: 'noord-holland',  bouwjaar: 2001, netcongestie: 'ROOD'   },
  { wijk: 'Gaasperdam',          stad: 'Amsterdam',            provincie: 'noord-holland',  bouwjaar: 1985, netcongestie: 'ROOD'   },
  { wijk: 'De Aker',             stad: 'Amsterdam',            provincie: 'noord-holland',  bouwjaar: 1997, netcongestie: 'ROOD'   },
  { wijk: 'Osdorp',              stad: 'Amsterdam',            provincie: 'noord-holland',  bouwjaar: 1965, netcongestie: 'ROOD'   },
  { wijk: 'Geuzenveld',          stad: 'Amsterdam',            provincie: 'noord-holland',  bouwjaar: 1960, netcongestie: 'ROOD'   },
  { wijk: 'Getsewoud',           stad: 'Haarlemmermeer',       provincie: 'noord-holland',  bouwjaar: 2002, netcongestie: 'ORANJE' },
  { wijk: 'Schalkwijk',          stad: 'Haarlem',              provincie: 'noord-holland',  bouwjaar: 1968, netcongestie: 'ORANJE' },
  { wijk: 'Meerwijk',            stad: 'Haarlem',              provincie: 'noord-holland',  bouwjaar: 1967, netcongestie: 'ORANJE' },
  { wijk: 'Poelenburg',          stad: 'Zaandam',              provincie: 'noord-holland',  bouwjaar: 1965, netcongestie: 'ORANJE' },
  { wijk: 'Kogerveld',           stad: 'Zaandam',              provincie: 'noord-holland',  bouwjaar: 1970, netcongestie: 'ORANJE' },
  { wijk: 'Overdie',             stad: 'Alkmaar',              provincie: 'noord-holland',  bouwjaar: 1958, netcongestie: 'GROEN'  },
  { wijk: 'Vroonermeer',         stad: 'Alkmaar',              provincie: 'noord-holland',  bouwjaar: 1986, netcongestie: 'GROEN'  },
  { wijk: 'De Mare',             stad: 'Alkmaar',              provincie: 'noord-holland',  bouwjaar: 1997, netcongestie: 'GROEN'  },
  { wijk: 'Kersenboogerd',       stad: 'Hoorn',                provincie: 'noord-holland',  bouwjaar: 1988, netcongestie: 'GROEN'  },
  { wijk: 'Bangert-Oosterpolder',stad: 'Hoorn',                provincie: 'noord-holland',  bouwjaar: 2005, netcongestie: 'GROEN'  },
  { wijk: 'Wheermolen',          stad: 'Purmerend',            provincie: 'noord-holland',  bouwjaar: 1978, netcongestie: 'ORANJE' },
  { wijk: 'Weidevenne',          stad: 'Purmerend',            provincie: 'noord-holland',  bouwjaar: 2001, netcongestie: 'ORANJE' },

  // ── Zuid-Holland ──────────────────────────────────────────────────────────
  { wijk: 'Ypenburg',            stad: 'Den Haag',             provincie: 'zuid-holland',   bouwjaar: 1999, netcongestie: 'ORANJE' },
  { wijk: 'Leidschenveen',       stad: 'Den Haag',             provincie: 'zuid-holland',   bouwjaar: 2003, netcongestie: 'ORANJE' },
  { wijk: 'Escamp',              stad: 'Den Haag',             provincie: 'zuid-holland',   bouwjaar: 1960, netcongestie: 'ORANJE' },
  { wijk: 'Morgenstond',         stad: 'Den Haag',             provincie: 'zuid-holland',   bouwjaar: 1955, netcongestie: 'ORANJE' },
  { wijk: 'Moerwijk',            stad: 'Den Haag',             provincie: 'zuid-holland',   bouwjaar: 1952, netcongestie: 'ORANJE' },
  { wijk: 'Wateringse Veld',     stad: 'Den Haag',             provincie: 'zuid-holland',   bouwjaar: 1998, netcongestie: 'ORANJE' },
  { wijk: 'Prins Alexander',     stad: 'Rotterdam',            provincie: 'zuid-holland',   bouwjaar: 1975, netcongestie: 'ROOD'   },
  { wijk: 'Ommoord',             stad: 'Rotterdam',            provincie: 'zuid-holland',   bouwjaar: 1972, netcongestie: 'ORANJE' },
  { wijk: 'Nesselande',          stad: 'Rotterdam',            provincie: 'zuid-holland',   bouwjaar: 2001, netcongestie: 'ORANJE' },
  { wijk: 'Beverwaard',          stad: 'Rotterdam',            provincie: 'zuid-holland',   bouwjaar: 1980, netcongestie: 'ORANJE' },
  { wijk: 'Pendrecht',           stad: 'Rotterdam',            provincie: 'zuid-holland',   bouwjaar: 1953, netcongestie: 'GROEN'  },
  { wijk: 'Lombardijen',         stad: 'Rotterdam',            provincie: 'zuid-holland',   bouwjaar: 1968, netcongestie: 'GROEN'  },
  { wijk: 'Wilderszijde',        stad: 'Lansingerland',        provincie: 'zuid-holland',   bouwjaar: 2008, netcongestie: 'ORANJE' },
  { wijk: 'Stevenshof',          stad: 'Leiden',               provincie: 'zuid-holland',   bouwjaar: 1985, netcongestie: 'ORANJE' },
  { wijk: 'Merenwijk',           stad: 'Leiden',               provincie: 'zuid-holland',   bouwjaar: 1975, netcongestie: 'ORANJE' },
  { wijk: 'Meerburg',            stad: 'Leiden',               provincie: 'zuid-holland',   bouwjaar: 2006, netcongestie: 'ORANJE' },
  { wijk: 'Roomburg',            stad: 'Leiden',               provincie: 'zuid-holland',   bouwjaar: 2001, netcongestie: 'ORANJE' },
  { wijk: 'Oosterheem',          stad: 'Zoetermeer',           provincie: 'zuid-holland',   bouwjaar: 2004, netcongestie: 'ORANJE' },
  { wijk: 'Seghwaert',           stad: 'Zoetermeer',           provincie: 'zuid-holland',   bouwjaar: 1982, netcongestie: 'ORANJE' },
  { wijk: 'Meerzicht',           stad: 'Zoetermeer',           provincie: 'zuid-holland',   bouwjaar: 1984, netcongestie: 'ORANJE' },
  { wijk: 'Rokkeveen',           stad: 'Zoetermeer',           provincie: 'zuid-holland',   bouwjaar: 1990, netcongestie: 'ORANJE' },
  { wijk: 'Stadswerven',         stad: 'Dordrecht',            provincie: 'zuid-holland',   bouwjaar: 2015, netcongestie: 'ROOD'   },
  { wijk: 'Krispijn',            stad: 'Dordrecht',            provincie: 'zuid-holland',   bouwjaar: 1945, netcongestie: 'ORANJE' },
  { wijk: 'Wielwijk',            stad: 'Dordrecht',            provincie: 'zuid-holland',   bouwjaar: 1960, netcongestie: 'ORANJE' },
  { wijk: 'Sterrenburg',         stad: 'Dordrecht',            provincie: 'zuid-holland',   bouwjaar: 1973, netcongestie: 'ORANJE' },
  { wijk: 'Tanthof',             stad: 'Delft',                provincie: 'zuid-holland',   bouwjaar: 1981, netcongestie: 'ORANJE' },
  { wijk: 'Voorhof',             stad: 'Delft',                provincie: 'zuid-holland',   bouwjaar: 1970, netcongestie: 'ORANJE' },
  { wijk: 'Hof van Delft',       stad: 'Delft',                provincie: 'zuid-holland',   bouwjaar: 2004, netcongestie: 'ORANJE' },
  { wijk: 'Groenoord',           stad: 'Schiedam',             provincie: 'zuid-holland',   bouwjaar: 1969, netcongestie: 'ORANJE' },
  { wijk: 'Woudhoek',            stad: 'Schiedam',             provincie: 'zuid-holland',   bouwjaar: 1978, netcongestie: 'ORANJE' },
  { wijk: 'Holy-Noord',          stad: 'Vlaardingen',          provincie: 'zuid-holland',   bouwjaar: 1967, netcongestie: 'ORANJE' },
  { wijk: 'Westwijk',            stad: 'Vlaardingen',          provincie: 'zuid-holland',   bouwjaar: 1972, netcongestie: 'ORANJE' },
  { wijk: 'Middelwatering',      stad: 'Capelle aan den IJssel',provincie: 'zuid-holland',  bouwjaar: 1972, netcongestie: 'ORANJE' },
  { wijk: 'Oostgaarde',          stad: 'Capelle aan den IJssel',provincie: 'zuid-holland',  bouwjaar: 1975, netcongestie: 'ORANJE' },
  { wijk: 'Waterland',           stad: 'Nissewaard',           provincie: 'zuid-holland',   bouwjaar: 1985, netcongestie: 'GROEN'  },
  { wijk: 'Maaswijk',            stad: 'Nissewaard',           provincie: 'zuid-holland',   bouwjaar: 1978, netcongestie: 'GROEN'  },
  { wijk: 'Goverwelle',          stad: 'Gouda',                provincie: 'zuid-holland',   bouwjaar: 1995, netcongestie: 'GROEN'  },
  { wijk: 'Bloemendaal',         stad: 'Gouda',                provincie: 'zuid-holland',   bouwjaar: 1972, netcongestie: 'GROEN'  },
  { wijk: 'Ridderveld',          stad: 'Alphen aan den Rijn',  provincie: 'zuid-holland',   bouwjaar: 1980, netcongestie: 'GROEN'  },
  { wijk: 'Zwammerdam',          stad: 'Alphen aan den Rijn',  provincie: 'zuid-holland',   bouwjaar: 2001, netcongestie: 'GROEN'  },

  // ── Noord-Brabant ─────────────────────────────────────────────────────────
  { wijk: 'Reeshof',             stad: 'Tilburg',              provincie: 'noord-brabant',  bouwjaar: 1990, netcongestie: 'GROEN'  },
  { wijk: 'Groenewoud',          stad: 'Tilburg',              provincie: 'noord-brabant',  bouwjaar: 1975, netcongestie: 'GROEN'  },
  { wijk: 'Stokhasselt',         stad: 'Tilburg',              provincie: 'noord-brabant',  bouwjaar: 1980, netcongestie: 'GROEN'  },
  { wijk: 'Berkel-Enschot',      stad: 'Tilburg',              provincie: 'noord-brabant',  bouwjaar: 1985, netcongestie: 'GROEN'  },
  { wijk: 'Haagse Beemden',      stad: 'Breda',                provincie: 'noord-brabant',  bouwjaar: 1988, netcongestie: 'GROEN'  },
  { wijk: 'Hoge Vugt',           stad: 'Breda',                provincie: 'noord-brabant',  bouwjaar: 1960, netcongestie: 'GROEN'  },
  { wijk: 'Tuinzigt',            stad: 'Breda',                provincie: 'noord-brabant',  bouwjaar: 1975, netcongestie: 'GROEN'  },
  { wijk: 'Bavel',               stad: 'Breda',                provincie: 'noord-brabant',  bouwjaar: 1980, netcongestie: 'GROEN'  },
  { wijk: 'Brandevoort',         stad: 'Helmond',              provincie: 'noord-brabant',  bouwjaar: 2003, netcongestie: 'ORANJE' },
  { wijk: 'Rijpelberg',          stad: 'Helmond',              provincie: 'noord-brabant',  bouwjaar: 1978, netcongestie: 'ORANJE' },
  { wijk: 'Mierlo-Hout',         stad: 'Helmond',              provincie: 'noord-brabant',  bouwjaar: 1972, netcongestie: 'GROEN'  },
  { wijk: 'Meerhoven',           stad: 'Eindhoven',            provincie: 'noord-brabant',  bouwjaar: 2004, netcongestie: 'ORANJE' },
  { wijk: 'Woensel-Noord',       stad: 'Eindhoven',            provincie: 'noord-brabant',  bouwjaar: 1955, netcongestie: 'ORANJE' },
  { wijk: 'Woensel-West',        stad: 'Eindhoven',            provincie: 'noord-brabant',  bouwjaar: 1970, netcongestie: 'ORANJE' },
  { wijk: 'Tongelre',            stad: 'Eindhoven',            provincie: 'noord-brabant',  bouwjaar: 1960, netcongestie: 'GROEN'  },
  { wijk: 'Gestel',              stad: 'Eindhoven',            provincie: 'noord-brabant',  bouwjaar: 1948, netcongestie: 'GROEN'  },
  { wijk: 'De Markiezaten',      stad: 'Bergen op Zoom',       provincie: 'noord-brabant',  bouwjaar: 2005, netcongestie: 'GROEN'  },
  { wijk: 'Gageldonk-West',      stad: 'Bergen op Zoom',       provincie: 'noord-brabant',  bouwjaar: 2002, netcongestie: 'GROEN'  },
  { wijk: 'Maaspoort',           stad: 's-Hertogenbosch',      provincie: 'noord-brabant',  bouwjaar: 1970, netcongestie: 'ORANJE' },
  { wijk: 'De Vliert',           stad: 's-Hertogenbosch',      provincie: 'noord-brabant',  bouwjaar: 1980, netcongestie: 'ORANJE' },
  { wijk: 'Rosmalen-Noord',      stad: 's-Hertogenbosch',      provincie: 'noord-brabant',  bouwjaar: 1985, netcongestie: 'GROEN'  },
  { wijk: 'Empel',               stad: 's-Hertogenbosch',      provincie: 'noord-brabant',  bouwjaar: 2002, netcongestie: 'ORANJE' },
  { wijk: 'Kortendijk',          stad: 'Roosendaal',           provincie: 'noord-brabant',  bouwjaar: 1978, netcongestie: 'GROEN'  },
  { wijk: 'Westrand',            stad: 'Roosendaal',           provincie: 'noord-brabant',  bouwjaar: 1985, netcongestie: 'GROEN'  },

  // ── Gelderland ───────────────────────────────────────────────────────────
  { wijk: 'Waalsprong',          stad: 'Nijmegen',             provincie: 'gelderland',     bouwjaar: 2004, netcongestie: 'ORANJE' },
  { wijk: 'Dukenburg',           stad: 'Nijmegen',             provincie: 'gelderland',     bouwjaar: 1970, netcongestie: 'ORANJE' },
  { wijk: 'Lindenholt',          stad: 'Nijmegen',             provincie: 'gelderland',     bouwjaar: 1979, netcongestie: 'ORANJE' },
  { wijk: 'Hatert',              stad: 'Nijmegen',             provincie: 'gelderland',     bouwjaar: 1968, netcongestie: 'ORANJE' },
  { wijk: 'Neerbosch-Oost',      stad: 'Nijmegen',             provincie: 'gelderland',     bouwjaar: 1965, netcongestie: 'ORANJE' },
  { wijk: 'Schuytgraaf',         stad: 'Arnhem',               provincie: 'gelderland',     bouwjaar: 2005, netcongestie: 'ORANJE' },
  { wijk: 'Presikhaaf',          stad: 'Arnhem',               provincie: 'gelderland',     bouwjaar: 1958, netcongestie: 'ORANJE' },
  { wijk: 'Kronenburg',          stad: 'Arnhem',               provincie: 'gelderland',     bouwjaar: 1970, netcongestie: 'ORANJE' },
  { wijk: 'Malburgen',           stad: 'Arnhem',               provincie: 'gelderland',     bouwjaar: 1951, netcongestie: 'ORANJE' },
  { wijk: 'Zuidbroek',           stad: 'Apeldoorn',            provincie: 'gelderland',     bouwjaar: 2006, netcongestie: 'GROEN'  },
  { wijk: 'Matenbuurt',          stad: 'Apeldoorn',            provincie: 'gelderland',     bouwjaar: 1973, netcongestie: 'GROEN'  },
  { wijk: 'Zevenhuizen',         stad: 'Apeldoorn',            provincie: 'gelderland',     bouwjaar: 1977, netcongestie: 'GROEN'  },
  { wijk: 'Osseveld',            stad: 'Apeldoorn',            provincie: 'gelderland',     bouwjaar: 1988, netcongestie: 'GROEN'  },
  { wijk: 'Doornsteeg',          stad: 'Nijkerk',              provincie: 'gelderland',     bouwjaar: 2001, netcongestie: 'GROEN'  },
  { wijk: 'Groenenstein',        stad: 'Barneveld',            provincie: 'gelderland',     bouwjaar: 2000, netcongestie: 'GROEN'  },
  { wijk: 'De Valk',             stad: 'Ede',                  provincie: 'gelderland',     bouwjaar: 1995, netcongestie: 'GROEN'  },
  { wijk: 'Veldhuizen',          stad: 'Ede',                  provincie: 'gelderland',     bouwjaar: 1975, netcongestie: 'GROEN'  },
  { wijk: 'Tarthorst',           stad: 'Wageningen',           provincie: 'gelderland',     bouwjaar: 1970, netcongestie: 'GROEN'  },
  { wijk: 'Passewaaij',          stad: 'Tiel',                 provincie: 'gelderland',     bouwjaar: 1997, netcongestie: 'GROEN'  },
  { wijk: 'De Hoven',            stad: 'Zutphen',              provincie: 'gelderland',     bouwjaar: 1969, netcongestie: 'GROEN'  },
  { wijk: 'De Huet',             stad: 'Doetinchem',           provincie: 'gelderland',     bouwjaar: 1975, netcongestie: 'GROEN'  },

  // ── Overijssel ───────────────────────────────────────────────────────────
  { wijk: 'Stadshagen',          stad: 'Zwolle',               provincie: 'overijssel',     bouwjaar: 1998, netcongestie: 'ORANJE' },
  { wijk: 'Berkum',              stad: 'Zwolle',               provincie: 'overijssel',     bouwjaar: 2004, netcongestie: 'ORANJE' },
  { wijk: 'Holtenbroek',         stad: 'Zwolle',               provincie: 'overijssel',     bouwjaar: 1960, netcongestie: 'ORANJE' },
  { wijk: 'Aa-landen',           stad: 'Zwolle',               provincie: 'overijssel',     bouwjaar: 1978, netcongestie: 'ORANJE' },
  { wijk: 'Westenholte',         stad: 'Zwolle',               provincie: 'overijssel',     bouwjaar: 2005, netcongestie: 'ORANJE' },
  { wijk: 'Wesselerbrink',       stad: 'Enschede',             provincie: 'overijssel',     bouwjaar: 1970, netcongestie: 'GROEN'  },
  { wijk: 'Stroinkslanden',      stad: 'Enschede',             provincie: 'overijssel',     bouwjaar: 1980, netcongestie: 'GROEN'  },
  { wijk: 'Velve-Lindenhof',     stad: 'Enschede',             provincie: 'overijssel',     bouwjaar: 1960, netcongestie: 'GROEN'  },
  { wijk: 'Deppenbroek',         stad: 'Enschede',             provincie: 'overijssel',     bouwjaar: 1975, netcongestie: 'GROEN'  },
  { wijk: 'Pathmos',             stad: 'Enschede',             provincie: 'overijssel',     bouwjaar: 1958, netcongestie: 'GROEN'  },
  { wijk: 'Colmschate',          stad: 'Deventer',             provincie: 'overijssel',     bouwjaar: 1980, netcongestie: 'GROEN'  },
  { wijk: 'Keizerslanden',       stad: 'Deventer',             provincie: 'overijssel',     bouwjaar: 1965, netcongestie: 'GROEN'  },
  { wijk: 'Schalkhaar',          stad: 'Deventer',             provincie: 'overijssel',     bouwjaar: 1990, netcongestie: 'GROEN'  },

  // ── Flevoland ─────────────────────────────────────────────────────────────
  { wijk: 'Nobelhorst',          stad: 'Almere',               provincie: 'flevoland',      bouwjaar: 2009, netcongestie: 'GROEN'  },
  { wijk: 'Poort',               stad: 'Almere',               provincie: 'flevoland',      bouwjaar: 2005, netcongestie: 'GROEN'  },
  { wijk: 'Almere Buiten-Centrum',stad: 'Almere',              provincie: 'flevoland',      bouwjaar: 1987, netcongestie: 'GROEN'  },
  { wijk: 'Filmwijk',            stad: 'Almere',               provincie: 'flevoland',      bouwjaar: 1988, netcongestie: 'GROEN'  },
  { wijk: 'Literatuurwijk',      stad: 'Almere',               provincie: 'flevoland',      bouwjaar: 1990, netcongestie: 'GROEN'  },
  { wijk: 'De Wierden',          stad: 'Almere',               provincie: 'flevoland',      bouwjaar: 1998, netcongestie: 'GROEN'  },
  { wijk: 'Boswijk',             stad: 'Lelystad',             provincie: 'flevoland',      bouwjaar: 1996, netcongestie: 'GROEN'  },
  { wijk: 'Warande',             stad: 'Lelystad',             provincie: 'flevoland',      bouwjaar: 2000, netcongestie: 'GROEN'  },
  { wijk: 'Zuiderzeewijk',       stad: 'Lelystad',             provincie: 'flevoland',      bouwjaar: 2003, netcongestie: 'GROEN'  },

  // ── Groningen ─────────────────────────────────────────────────────────────
  { wijk: 'Meerstad',            stad: 'Groningen',            provincie: 'groningen',      bouwjaar: 2010, netcongestie: 'GROEN'  },
  { wijk: 'Selwerd',             stad: 'Groningen',            provincie: 'groningen',      bouwjaar: 1960, netcongestie: 'GROEN'  },
  { wijk: 'Paddepoel',           stad: 'Groningen',            provincie: 'groningen',      bouwjaar: 1965, netcongestie: 'GROEN'  },
  { wijk: 'Lewenborg',           stad: 'Groningen',            provincie: 'groningen',      bouwjaar: 1978, netcongestie: 'GROEN'  },
  { wijk: 'Vinkhuizen',          stad: 'Groningen',            provincie: 'groningen',      bouwjaar: 1968, netcongestie: 'GROEN'  },
  { wijk: 'Corpus den Hoorn',    stad: 'Groningen',            provincie: 'groningen',      bouwjaar: 1975, netcongestie: 'GROEN'  },
  { wijk: 'Gravenburg',          stad: 'Groningen',            provincie: 'groningen',      bouwjaar: 1980, netcongestie: 'GROEN'  },
  { wijk: 'Hoogkerk',            stad: 'Groningen',            provincie: 'groningen',      bouwjaar: 1975, netcongestie: 'GROEN'  },

  // ── Friesland ─────────────────────────────────────────────────────────────
  { wijk: 'Skoatterwâld',        stad: 'Heerenveen',           provincie: 'friesland',      bouwjaar: 2005, netcongestie: 'GROEN'  },
  { wijk: 'Zuiderburen',         stad: 'Leeuwarden',           provincie: 'friesland',      bouwjaar: 2008, netcongestie: 'GROEN'  },
  { wijk: 'Camminghaburen',      stad: 'Leeuwarden',           provincie: 'friesland',      bouwjaar: 1990, netcongestie: 'GROEN'  },
  { wijk: 'De Vlietlanden',      stad: 'Leeuwarden',           provincie: 'friesland',      bouwjaar: 1985, netcongestie: 'GROEN'  },
  { wijk: 'Wielenpoel',          stad: 'Leeuwarden',           provincie: 'friesland',      bouwjaar: 1968, netcongestie: 'GROEN'  },
  { wijk: 'Heechterp',           stad: 'Leeuwarden',           provincie: 'friesland',      bouwjaar: 1969, netcongestie: 'GROEN'  },

  // ── Drenthe ───────────────────────────────────────────────────────────────
  { wijk: 'Kloosterveen',        stad: 'Assen',                provincie: 'drenthe',        bouwjaar: 2002, netcongestie: 'GROEN'  },
  { wijk: 'Pittelo',             stad: 'Assen',                provincie: 'drenthe',        bouwjaar: 1972, netcongestie: 'GROEN'  },
  { wijk: 'Peelo',               stad: 'Assen',                provincie: 'drenthe',        bouwjaar: 1975, netcongestie: 'GROEN'  },
  { wijk: 'Marsdijk',            stad: 'Assen',                provincie: 'drenthe',        bouwjaar: 1980, netcongestie: 'GROEN'  },
  { wijk: 'Emmerhout',           stad: 'Emmen',                provincie: 'drenthe',        bouwjaar: 1966, netcongestie: 'GROEN'  },
  { wijk: 'Bargeres',            stad: 'Emmen',                provincie: 'drenthe',        bouwjaar: 1970, netcongestie: 'GROEN'  },
  { wijk: 'Angelslo',            stad: 'Emmen',                provincie: 'drenthe',        bouwjaar: 1968, netcongestie: 'GROEN'  },
  { wijk: 'Rietlanden',          stad: 'Meppel',               provincie: 'drenthe',        bouwjaar: 1998, netcongestie: 'GROEN'  },

  // ── Limburg ───────────────────────────────────────────────────────────────
  { wijk: 'Nazareth',            stad: 'Maastricht',           provincie: 'limburg',        bouwjaar: 1963, netcongestie: 'ORANJE' },
  { wijk: 'Malberg',             stad: 'Maastricht',           provincie: 'limburg',        bouwjaar: 1969, netcongestie: 'ORANJE' },
  { wijk: 'Wittevrouwenveld',    stad: 'Maastricht',           provincie: 'limburg',        bouwjaar: 1975, netcongestie: 'ORANJE' },
  { wijk: 'Meezenbroek',         stad: 'Heerlen',              provincie: 'limburg',        bouwjaar: 1960, netcongestie: 'ORANJE' },
  { wijk: 'Heerlerbaan',         stad: 'Heerlen',              provincie: 'limburg',        bouwjaar: 1965, netcongestie: 'ORANJE' },
  { wijk: 'Born',                stad: 'Sittard-Geleen',       provincie: 'limburg',        bouwjaar: 1975, netcongestie: 'GROEN'  },

  // ── Zeeland ───────────────────────────────────────────────────────────────
  { wijk: 'Dauwendaele',         stad: 'Middelburg',           provincie: 'zeeland',        bouwjaar: 1985, netcongestie: 'GROEN'  },
  { wijk: 'Stromenwijk',         stad: 'Middelburg',           provincie: 'zeeland',        bouwjaar: 1995, netcongestie: 'GROEN'  },
  { wijk: 'Dauwendaele-Noord',   stad: 'Middelburg',           provincie: 'zeeland',        bouwjaar: 1990, netcongestie: 'GROEN'  },
  { wijk: 'De Goese Meer',       stad: 'Goes',                 provincie: 'zeeland',        bouwjaar: 2005, netcongestie: 'GROEN'  },
]

// ─── Main ────────────────────────────────────────────────────────────────────

async function run() {
  const dryRun       = process.argv.includes('--dry-run')
  const skipExisting = process.argv.includes('--skip-existing')
  const batchArg     = process.argv.find(a => a.startsWith('--batch='))
  const [batchFrom, batchTo] = batchArg
    ? batchArg.replace('--batch=', '').split(',').map(Number)
    : [0, WIJKEN.length]

  const subset = WIJKEN.slice(batchFrom, batchTo)

  console.log('\n══════════════════════════════════════════════════════')
  console.log('SaldeerScan.nl — pSEO Wijk Seeder v2 (Gemini voor elk)')
  console.log('══════════════════════════════════════════════════════')
  console.log(`Wijken:        ${subset.length} (index ${batchFrom}–${Math.min(batchTo, WIJKEN.length) - 1})`)
  console.log(`Modus:         ${dryRun ? 'DRY RUN (geen DB/AI writes)' : 'LIVE'}`)
  console.log(`Skip existing: ${skipExisting ? 'ja' : 'nee'}`)
  console.log(`AI:            Gemini 2.5 Flash — 800w + 5 FAQs + JSON-LD per wijk`)
  console.log(`CBS PDOK:      aantalWoningen live ophalen per wijk`)
  console.log(`Geschatte tijd: ~${Math.ceil(subset.length * 4 / 60)} minuten`)
  console.log('──────────────────────────────────────────────────────\n')

  let stats = { ok: 0, skip: 0, fail: 0 }

  for (let i = 0; i < subset.length; i++) {
    const entry = subset[i]
    const nr    = `[${String(i + 1).padStart(3, '0')}/${subset.length}]`
    process.stdout.write(`${nr} ${entry.wijk}, ${entry.stad} ... `)

    try {
      const result = await seedWijk(entry, { dryRun, skipExisting })
      if      (result === 'ok')      stats.ok++
      else if (result === 'skipped') stats.skip++
      else                           stats.fail++
    } catch (err) {
      process.stdout.write(`FOUT: ${err instanceof Error ? err.message : String(err)}\n`)
      stats.fail++
    }

    // Gemini rate limiting: 2s tussen calls, elke 10 wijken extra rust
    if (!dryRun) {
      await sleep(i > 0 && i % 10 === 0 ? 5000 : 2000)
    }
  }

  console.log('\n══════════════════════════════════════════════════════')
  console.log(`Gereed: ${stats.ok} gegenereerd, ${stats.skip} overgeslagen, ${stats.fail} fouten`)
  if (stats.fail > 0) {
    console.log('\n⚠ Herstart met --skip-existing om alleen mislukte wijken opnieuw te proberen.')
  }
  console.log('══════════════════════════════════════════════════════\n')
}

run().catch(err => {
  console.error('\nFatale fout:', err)
  process.exit(1)
})
