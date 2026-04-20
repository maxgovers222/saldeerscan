import 'server-only'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

// Model instances (lazy — initialized on first use via closure)
function getFlashModel() {
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
}

export interface FAQ {
  vraag: string
  antwoord: string
}

export interface PseoContent {
  titel: string
  metaDescription: string
  hoofdtekst: string   // ~600 woorden, plain text (no HTML)
  faqItems: FAQ[]
}

export interface PseoContentParams {
  straat: string
  stad: string
  provincie: string
  bouwjaar: number
  netcongestie: 'ROOD' | 'ORANJE' | 'GROEN'
  healthScore: number
}

export async function generatePseoContent(params: PseoContentParams): Promise<PseoContent> {
  const model = getFlashModel()

  const prompt = `Je bent een SEO-expert voor de Nederlandse energiemarkt. Schrijf een SEO-artikel van precies 600 woorden voor SaldeerScan.nl.

Onderwerp: Energiebesparing voor woningen op ${params.straat} in ${params.stad}, ${params.provincie}.

Context:
- Gemiddeld bouwjaar in deze straat: ${params.bouwjaar}
- Netcongestie status: ${params.netcongestie}
- Energie score: ${params.healthScore}/100

Focus op: de specifieke uitdagingen voor ${params.bouwjaar} woningen bij het einde van salderen op 1 januari 2027. Bespreek: isolatie-uitdagingen, zonnepaneel-potentieel, batterijopslag als oplossing voor netcongestie.

Schrijf direct voor de huiseigenaar. Gebruik concrete euro-bedragen. Vermijd jargon.

Geef ook:
- Een pakkende SEO-titel (max 60 tekens)
- Een meta-description (max 155 tekens)
- 3 FAQ-vragen met antwoord (elk antwoord 2-3 zinnen)

Antwoord uitsluitend in dit JSON formaat:
{
  "titel": "...",
  "metaDescription": "...",
  "hoofdtekst": "...",
  "faqItems": [
    { "vraag": "...", "antwoord": "..." },
    { "vraag": "...", "antwoord": "..." },
    { "vraag": "...", "antwoord": "..." }
  ]
}`

  const result = await model.generateContent(prompt)
  const text = result.response.text()

  // Extract JSON from response (Gemini sometimes wraps in markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Gemini response bevat geen geldig JSON')

  const parsed = JSON.parse(jsonMatch[0]) as PseoContent
  if (
    !parsed.titel ||
    !parsed.metaDescription ||
    !parsed.hoofdtekst ||
    !Array.isArray(parsed.faqItems) ||
    parsed.faqItems.length === 0
  ) {
    throw new Error('Gemini response mist vereiste velden')
  }

  return parsed
}

// Wijk-niveau pSEO content — autoritair, hyperlocaal, 2027-focused
export async function generateWijkContent(params: {
  wijk: string
  stad: string
  provincie: string
  bouwjaar: number
  netcongestie: 'ROOD' | 'ORANJE' | 'GROEN'
  aantalWoningen?: number | null
}): Promise<string> {
  const model = getFlashModel()

  const woningenTekst = params.aantalWoningen
    ? `${params.aantalWoningen.toLocaleString('nl-NL')} woningen`
    : 'een aanzienlijke woningpopulatie'

  const netTekst = {
    ROOD:   `Vol stroomnet (ROOD) — thuisbatterij essentieel`,
    ORANJE: `Toenemende netdruk (ORANJE) — batterijopslag sterk aanbevolen`,
    GROEN:  `Ruime netcapaciteit (GROEN) — ideaal voor directe teruglevering`,
  }[params.netcongestie]

  const prompt = `Je bent een senior energie-adviseur. Schrijf een technisch-autoritaire analyse van precies 800 woorden voor de wijk ${params.wijk} in ${params.stad} (${params.provincie}).

Verwerk ALLE van deze lokale feiten:
- ${woningenTekst} (CBS 2023)
- Gemiddeld bouwjaar: ${params.bouwjaar}
- Netstatus: ${netTekst}

Focus op: financiële urgentie 1 januari 2027 (einde salderingsregeling), concrete euro-bedragen voor ${params.wijk}, bouwjaar-specifieke dakgeschiktheid, netcongestie impact. Schrijf direct voor de huiseigenaar in ${params.wijk}. Geen algemeenheden — elke zin moet specifiek voor ${params.wijk} aanvoelen. Gebruik **dikgedrukte** kernbegrippen via markdown.`

  const result = await model.generateContent(prompt)
  return result.response.text().trim()
}

// Kennisbank artikel generator — lang, evergreen, 1200 woorden
export interface KennisbankContent {
  titel: string
  metaDescription: string
  intro: string
  hoofdtekst: string
  faqItems: FAQ[]
  category: 'saldering' | 'zonnepanelen' | 'netcongestie' | 'subsidie' | 'algemeen'
  relatedSlugs: string[]
}

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

export async function generateKennisbankContent(params: {
  slug: string
  allSlugs: string[]
}): Promise<KennisbankContent> {
  const model = getFlashModel()
  const topicTitle = KENNISBANK_TOPICS[params.slug] ?? params.slug.replace(/-/g, ' ')
  const allTopics = params.allSlugs.map(s => `${s}: ${KENNISBANK_TOPICS[s] ?? s}`).join('\n')

  const prompt = `Je bent een senior energie-adviseur en SEO-specialist voor SaldeerScan.nl.
Schrijf een uitgebreid kennisbank-artikel van precies 1200 woorden over: "${topicTitle}".

Context: SaldeerScan.nl helpt Nederlandse huiseigenaren de impact van het einde van de salderingsregeling op 1 januari 2027 te begrijpen. Doelgroep: Nederlandse woningbezitters met zonnepanelen of interesse daarin.

Vereisten:
- Minimaal 6 ## H2-koppen (markdown, geen #, geen ###)
- Concrete euro-bedragen en percentages
- Urgentie van de 2027-deadline
- Geen algemeenheden — elke alinea moet actionable zijn
- Verwerk naturlijk: "saldering 2027", "zonnepanelen terugverdientijd", "netcongestie"
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
  if (!jsonMatch) throw new Error('Gemini kennisbank response bevat geen geldig JSON')

  const parsed = JSON.parse(jsonMatch[0]) as KennisbankContent
  if (!parsed.titel || !parsed.hoofdtekst || !Array.isArray(parsed.faqItems)) {
    throw new Error('Gemini kennisbank response mist vereiste velden')
  }

  return parsed
}

// Nieuws artikel generator — actueel, ~900 woorden
export interface NieuwsContent {
  titel: string
  metaDescription: string
  intro: string
  hoofdtekst: string
  faqItems: FAQ[]
  slug: string
}

export async function generateNieuwsContent(params: {
  topicSeed: string
  recentPublishedTitles: string[]
}): Promise<NieuwsContent> {
  const model = getFlashModel()
  const now = new Date()
  const maand = now.toLocaleString('nl-NL', { month: 'long' })
  const jaar = now.getFullYear()
  const recentStr = params.recentPublishedTitles.length > 0
    ? `Reeds gepubliceerde titels (vermijd herhaling):\n${params.recentPublishedTitles.join('\n')}`
    : ''

  const prompt = `Je bent een energie-journalist voor SaldeerScan.nl.
Schrijf een actueel nieuwsartikel (${maand} ${jaar}) over: "${params.topicSeed}".

${recentStr}

Vereisten:
- 900 woorden, korte alinea's (max 4 zinnen per alinea)
- Nieuwswaarde: waarom is dit nu relevant voor de 2027-deadline?
- Gebruik ## H2-koppen (markdown)
- 3 concrete feiten of tips per artikel
- Eindig met een alinea die verwijst naar /check op SaldeerScan.nl voor persoonlijk advies
- Geen emoji

Return ALLEEN dit JSON formaat (geen markdown omheen):
{
  "titel": "...",
  "metaDescription": "...",
  "intro": "...",
  "hoofdtekst": "...",
  "faqItems": [
    { "vraag": "...", "antwoord": "..." },
    { "vraag": "...", "antwoord": "..." },
    { "vraag": "...", "antwoord": "..." }
  ],
  "slug": "..."
}

Veldlengtes: titel max 70 tekens, metaDescription max 155 tekens, intro 2 zinnen, hoofdtekst ~900 woorden, slug URL-safe max 60 tekens zonder datum erin.`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Gemini nieuws response bevat geen geldig JSON')

  const parsed = JSON.parse(jsonMatch[0]) as NieuwsContent
  if (!parsed.titel || !parsed.hoofdtekst || !parsed.slug) {
    throw new Error('Gemini nieuws response mist vereiste velden')
  }

  return parsed
}

// Tier 1 image screening — cheap, fast
export interface ScreeningResult {
  isCorrectType: boolean
  confidence: number  // 0.0 - 1.0
  redenering: string  // Short explanation
}

type ImageType = 'meterkast' | 'plaatsingslocatie' | 'omvormer'

const TYPE_LABELS: Record<ImageType, string> = {
  meterkast: 'een meterkast (elektrisch verdeelkast met groepen/zekeringen)',
  plaatsingslocatie: 'een locatie voor een thuisbatterij (muur/vloer in garage, schuur of technische ruimte)',
  omvormer: 'een omvormer/inverter voor zonnepanelen (elektronisch apparaat met display of LED)',
}

export async function screenImage(
  imageBase64: string,
  imageType: ImageType,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'
): Promise<ScreeningResult> {
  const model = getFlashModel()

  const prompt = `Is dit een foto van ${TYPE_LABELS[imageType]}?

Antwoord uitsluitend in dit JSON formaat:
{
  "is_correct": true/false,
  "confidence": 0.0-1.0,
  "redenering": "Korte uitleg in 1 zin"
}`

  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType,
    },
  }

  const result = await model.generateContent([prompt, imagePart])
  const text = result.response.text()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return { isCorrectType: false, confidence: 0, redenering: 'Kon afbeelding niet analyseren' }

  const parsed = JSON.parse(jsonMatch[0])
  return {
    isCorrectType: Boolean(parsed.is_correct),
    confidence: Number(parsed.confidence) || 0,
    redenering: String(parsed.redenering || ''),
  }
}
