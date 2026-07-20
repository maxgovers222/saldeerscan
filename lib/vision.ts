import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { jsonSchemaOutputFormat } from '@anthropic-ai/sdk/helpers/json-schema'
import { screenImage } from '@/lib/gemini'
import {
  normalizeMeterkastAnalyse,
  normalizeOmvormerAnalyse,
  normalizePlaatsingsAnalyse,
  type MeterkastAnalyse,
  type OmvormerAnalyse,
  type PlaatsingsAnalyse,
} from '@/lib/vision-analysis'

export type {
  MeterkastAnalyse,
  OmvormerAnalyse,
  PlaatsingsAnalyse,
} from '@/lib/vision-analysis'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err: unknown) {
      const isOverloaded = err instanceof Anthropic.APIError && err.status === 529
      const isRateLimit = err instanceof Anthropic.APIError && err.status === 429
      if ((isOverloaded || isRateLimit) && attempt < maxAttempts) {
        await new Promise(r => setTimeout(r, 1000 * attempt))
        continue
      }
      throw err
    }
  }
  throw new Error('Max retries reached')
}

// --- Private: Deep analysis with Claude Sonnet ---

const SCREENING_THRESHOLD = 0.7  // Minimum confidence for Tier 1 pass

const nullableString = { anyOf: [{ type: 'string' }, { type: 'null' }] } as const
const nullableNumber = { anyOf: [{ type: 'number' }, { type: 'null' }] } as const
const stringArray = { type: 'array', items: { type: 'string' } } as const

const meterkastOutputSchema = {
  type: 'object',
  properties: {
    merk: nullableString,
    drie_fase: { type: 'boolean' },
    vrije_groepen: { type: 'integer', minimum: 0 },
    max_vermogen_kw: nullableNumber,
    lijkt_geschikt: { type: 'boolean' },
    opmerkingen: stringArray,
    confidence: { type: 'number', minimum: 0, maximum: 1 },
  },
  required: [
    'merk',
    'drie_fase',
    'vrije_groepen',
    'max_vermogen_kw',
    'lijkt_geschikt',
    'opmerkingen',
    'confidence',
  ],
  additionalProperties: false,
} as const

const plaatsingOutputSchema = {
  type: 'object',
  properties: {
    geen_zichtbare_blokkerende_risicos: { type: 'boolean' },
    risico_items: stringArray,
    aanbevelingen: stringArray,
    geschiktheid_score: { type: 'number', minimum: 0, maximum: 10 },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
  },
  required: [
    'geen_zichtbare_blokkerende_risicos',
    'risico_items',
    'aanbevelingen',
    'geschiktheid_score',
    'confidence',
  ],
  additionalProperties: false,
} as const

const omvormerOutputSchema = {
  type: 'object',
  properties: {
    merk: nullableString,
    model: nullableString,
    vermogen_kw: nullableNumber,
    hybride_klaar: { type: 'boolean' },
    vervanging_lijkt_nodig: { type: 'boolean' },
    opmerkingen: stringArray,
    confidence: { type: 'number', minimum: 0, maximum: 1 },
  },
  required: [
    'merk',
    'model',
    'vermogen_kw',
    'hybride_klaar',
    'vervanging_lijkt_nodig',
    'opmerkingen',
    'confidence',
  ],
  additionalProperties: false,
} as const

async function deepAnalyseMeterkast(imageBase64: string, mimeType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'): Promise<MeterkastAnalyse> {
  const response = await withRetry(() => anthropic.messages.parse({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    output_config: {
      format: jsonSchemaOutputFormat(meterkastOutputSchema),
    },
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mimeType, data: imageBase64 },
        },
        {
          type: 'text',
          text: `Analyseer wat op deze foto van een Nederlandse meterkast zichtbaar is.

Dit is uitsluitend een foto-indicatie en geen elektrische keuring. Raad niets dat niet
duidelijk zichtbaar of leesbaar is. Een installateur moet de aansluiting, beveiliging,
bekabeling en beschikbare ruimte altijd ter plaatse controleren.

Identificeer:
1. Merk (ABB, Hager, Schneider Electric, Gewiss, of Onbekend)
2. Is 3-fase aansluiting aanwezig? (zoek naar 3 hoofdzekeringen of 3-fase hoofdschakelaar)
3. Aantal vrije/ongebruikte groepen (lege railposities)
4. Alleen indien de relevante waarden leesbaar zijn: geschat maximaal aansluitvermogen in kW
5. Lijkt uitbreiding technisch mogelijk op basis van uitsluitend het zichtbare beeld?
6. Zichtbare aandachtspunten, onzekerheden of onleesbare onderdelen
7. Confidence van 0 tot 1 in de zichtbare identificatie`,
        },
      ],
    }],
  }))

  if (!response.parsed_output) throw new Error('Claude kon meterkast niet analyseren')
  return normalizeMeterkastAnalyse(response.parsed_output)
}

async function deepAnalysePlaatsing(imageBase64: string, mimeType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'): Promise<PlaatsingsAnalyse> {
  const response = await withRetry(() => anthropic.messages.parse({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    output_config: {
      format: jsonSchemaOutputFormat(plaatsingOutputSchema),
    },
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mimeType, data: imageBase64 },
        },
        {
          type: 'text',
          text: `Benoem zichtbare aandachtspunten voor mogelijke plaatsing van een thuisbatterij.

Controleer:
1. Zichtbare vrije ruimte en brandbare materialen in de directe omgeving
2. Mogelijkheden voor ventilatie
3. Toegankelijkheid voor onderhoud
4. Zichtbaar vocht, water- of gasleidingen en andere warmte- of ontstekingsbronnen
5. Zichtbare blootstelling aan direct zonlicht, weersinvloed of extreme temperatuur

Geef een geschiktheidsindicatie van 0-10 en een confidence van 0-1. Beoordeel geen
NEN-conformiteit en noem geen vaste minimumafstand zonder fabrikantvoorschrift. Een foto
kan verborgen leidingen, constructie, ventilatiecapaciteit en elektrische veiligheid niet
vaststellen; een erkend installateur moet de locatie altijd ter plaatse beoordelen.`,
        },
      ],
    }],
  }))

  if (!response.parsed_output) throw new Error('Claude kon plaatsingslocatie niet analyseren')
  return normalizePlaatsingsAnalyse(response.parsed_output)
}

async function deepAnalyseOmvormer(imageBase64: string, mimeType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'): Promise<OmvormerAnalyse> {
  const response = await withRetry(() => anthropic.messages.parse({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    output_config: {
      format: jsonSchemaOutputFormat(omvormerOutputSchema),
    },
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mimeType, data: imageBase64 },
        },
        {
          type: 'text',
          text: `Identificeer wat zichtbaar en leesbaar is op deze omvormer voor zonnepanelen.

Dit is een foto-indicatie. Raad geen merk, model, leeftijd, vermogen of aansluiting als
het label niet leesbaar is. Een installateur moet compatibiliteit en technische staat
controleren aan de hand van het exacte model en de bestaande installatie.

Bepaal:
1. Merk (SolarEdge, SMA, Fronius, Enphase, Growatt, Huawei, etc.)
2. Model (lees label/sticker)
3. Vermogen in kW
4. Is op basis van het exacte zichtbare model aantoonbaar dat een batterijaansluiting aanwezig is?
5. Lijkt inspectie voor vervanging nodig door zichtbare schade, een leesbaar oud bouwjaar
   of aantoonbare incompatibiliteit? Leeftijd alleen is geen automatische vervangingsreden.
6. Opmerkingen en onzekerheden
7. Confidence van 0 tot 1 in de zichtbare identificatie`,
        },
      ],
    }],
  }))

  if (!response.parsed_output) throw new Error('Claude kon omvormer niet analyseren')
  return normalizeOmvormerAnalyse(response.parsed_output)
}

// --- Public API: Two-tier (Gemini screen → Claude deep) ---

export class VisionScreeningError extends Error {
  constructor(
    public imageType: string,
    public confidence: number,
    public redenering: string
  ) {
    super(`Afbeelding niet herkend als ${imageType} (confidence: ${confidence})`)
    this.name = 'VisionScreeningError'
  }
}

export async function analyseMeterkast(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'
): Promise<MeterkastAnalyse> {
  const screening = await screenImage(imageBase64, 'meterkast', mimeType)
  if (!screening.isCorrectType || screening.confidence < SCREENING_THRESHOLD) {
    throw new VisionScreeningError('meterkast', screening.confidence, screening.redenering)
  }
  return deepAnalyseMeterkast(imageBase64, mimeType)
}

export async function analysePlaatsing(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'
): Promise<PlaatsingsAnalyse> {
  const screening = await screenImage(imageBase64, 'plaatsingslocatie', mimeType)
  if (!screening.isCorrectType || screening.confidence < SCREENING_THRESHOLD) {
    throw new VisionScreeningError('plaatsingslocatie', screening.confidence, screening.redenering)
  }
  return deepAnalysePlaatsing(imageBase64, mimeType)
}

export async function analyseOmvormer(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'
): Promise<OmvormerAnalyse> {
  const screening = await screenImage(imageBase64, 'omvormer', mimeType)
  if (!screening.isCorrectType || screening.confidence < SCREENING_THRESHOLD) {
    throw new VisionScreeningError('omvormer', screening.confidence, screening.redenering)
  }
  return deepAnalyseOmvormer(imageBase64, mimeType)
}
