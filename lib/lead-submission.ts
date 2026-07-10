import { berekenHealthScore, type HealthScoreResult } from '@/lib/health-score'
import { berekenROI, type ROIInput, type ROIResult } from '@/lib/roi'

export const MAX_LEAD_BODY_BYTES = 128_000

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^\+(31|32|49|352)[1-9]\d{7,11}$/
const POSTCODE_RE = /^\d{4}[A-Z]{2}$/
const DAKRICHTINGEN = new Set(['Zuid', 'Oost/West', 'Noord'])
const KWH_PER_PANEEL_OPTIONS = new Set([330, 350, 370, 410])

type JsonRecord = Record<string, unknown>
export type NetStatus = 'ROOD' | 'ORANJE' | 'GROEN'

export interface NormalizedBagData {
  bouwjaar: number
  oppervlakte: number
  woningtype: string | null
  postcode: string
  huisnummer: number | null
  dakOppervlakte: number
  lat: number
  lon: number
}

export interface NormalizedLeadSubmission {
  naam: string
  email: string
  telefoon: string
  adres: string
  postcode: string
  huisnummer: string | null
  wijk: string | null
  stad: string | null
  provincie: string | null
  bagData: NormalizedBagData
  roiInput: ROIInput
  energielabel: string | null
  meterkastAnalyse: JsonRecord | null
  plaatsingsAnalyse: JsonRecord | null
  omvormerAnalyse: JsonRecord | null
  isEigenaar: boolean | null
  heeftPanelen: boolean | null
  huidigePanelenAantal: number | null
  dakrichting: ROIInput['dakrichting']
  verbruikBron: 'schatting' | 'gebruiker'
  huishoudenGrootte: 1 | 2 | 3 | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  landingPage: string | null
}

export class LeadSubmissionError extends Error {
  constructor(
    message: string,
    readonly field?: string,
    readonly status = 400,
  ) {
    super(message)
    this.name = 'LeadSubmissionError'
  }
}

function record(value: unknown, field: string): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new LeadSubmissionError(`${field} is ongeldig`, field)
  }
  return value as JsonRecord
}

function text(
  value: unknown,
  field: string,
  options: { required?: boolean; max: number },
): string | null {
  if (value === null || value === undefined || value === '') {
    if (options.required) throw new LeadSubmissionError(`${field} is verplicht`, field)
    return null
  }
  if (typeof value !== 'string') throw new LeadSubmissionError(`${field} is ongeldig`, field)
  const normalized = value.trim()
  if (!normalized && options.required) throw new LeadSubmissionError(`${field} is verplicht`, field)
  if (normalized.length > options.max) throw new LeadSubmissionError(`${field} is te lang`, field)
  return normalized || null
}

function finiteNumber(
  value: unknown,
  field: string,
  min: number,
  max: number,
): number {
  const number = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new LeadSubmissionError(`${field} moet tussen ${min} en ${max} liggen`, field)
  }
  return number
}

function nullableObject(value: unknown, field: string): JsonRecord | null {
  if (value === null || value === undefined) return null
  const parsed = record(value, field)
  if (JSON.stringify(parsed).length > 32_000) {
    throw new LeadSubmissionError(`${field} is te groot`, field)
  }
  return parsed
}

export function parseLeadSubmission(raw: unknown): NormalizedLeadSubmission {
  const body = record(raw, 'body')
  const naam = text(body.naam, 'naam', { required: true, max: 120 })!
  if (naam.split(/\s+/).length < 2) {
    throw new LeadSubmissionError('Voer uw voor- en achternaam in', 'naam')
  }

  const email = text(body.email, 'email', { required: true, max: 254 })!.toLowerCase()
  if (!EMAIL_RE.test(email)) throw new LeadSubmissionError('Voer een geldig e-mailadres in', 'email')

  const telefoon = text(body.telefoon, 'telefoon', { required: true, max: 20 })!
    .replace(/[\s().-]/g, '')
  if (!PHONE_RE.test(telefoon)) {
    throw new LeadSubmissionError('Voer een geldig internationaal telefoonnummer in', 'telefoon')
  }
  if (body.gdprConsent !== true) {
    throw new LeadSubmissionError('GDPR consent is vereist', 'gdprConsent')
  }

  const bag = record(body.bagData, 'bagData')
  const bagPostcode = text(bag.postcode, 'bagData.postcode', { required: true, max: 8 })!
    .replace(/\s/g, '')
    .toUpperCase()
  if (!POSTCODE_RE.test(bagPostcode)) {
    throw new LeadSubmissionError('bagData.postcode is ongeldig', 'bagData.postcode')
  }
  const bagData: NormalizedBagData = {
    bouwjaar: Math.round(finiteNumber(bag.bouwjaar, 'bagData.bouwjaar', 1000, 2030)),
    oppervlakte: finiteNumber(bag.oppervlakte, 'bagData.oppervlakte', 1, 2000),
    woningtype: text(bag.woningtype, 'bagData.woningtype', { max: 80 }),
    postcode: bagPostcode,
    huisnummer: bag.huisnummer == null
      ? null
      : Math.round(finiteNumber(bag.huisnummer, 'bagData.huisnummer', 1, 99_999)),
    dakOppervlakte: finiteNumber(bag.dakOppervlakte, 'bagData.dakOppervlakte', 0, 5000),
    lat: finiteNumber(bag.lat, 'bagData.lat', 50, 54),
    lon: finiteNumber(bag.lon, 'bagData.lon', 3, 8),
  }

  const roiRaw = record(body.roiInput, 'roiInput')
  const roiBouwjaar = Math.round(finiteNumber(roiRaw.bouwjaar, 'roiInput.bouwjaar', 1000, 2030))
  const roiOppervlakte = finiteNumber(roiRaw.oppervlakte, 'roiInput.oppervlakte', 1, 2000)
  if (roiBouwjaar !== bagData.bouwjaar) {
    throw new LeadSubmissionError('roiInput.bouwjaar wijkt af van BAG', 'roiInput.bouwjaar')
  }
  if (Math.abs(roiOppervlakte - bagData.oppervlakte) > 1) {
    throw new LeadSubmissionError('roiInput.oppervlakte wijkt af van BAG', 'roiInput.oppervlakte')
  }

  const dakrichting = roiRaw.dakrichting == null
    ? null
    : String(roiRaw.dakrichting)
  if (dakrichting && !DAKRICHTINGEN.has(dakrichting)) {
    throw new LeadSubmissionError('roiInput.dakrichting is ongeldig', 'roiInput.dakrichting')
  }
  const huishouden = roiRaw.huishouden_grootte == null
    ? null
    : finiteNumber(roiRaw.huishouden_grootte, 'roiInput.huishouden_grootte', 1, 3)
  if (huishouden !== null && !Number.isInteger(huishouden)) {
    throw new LeadSubmissionError('roiInput.huishouden_grootte is ongeldig', 'roiInput.huishouden_grootte')
  }

  const roiInput: ROIInput = {
    oppervlakte: roiOppervlakte,
    bouwjaar: roiBouwjaar,
    dakOppervlakte: finiteNumber(
      roiRaw.dakOppervlakte,
      'roiInput.dakOppervlakte',
      0,
      bagData.dakOppervlakte,
    ),
    huidigVerbruikKwh: finiteNumber(
      roiRaw.huidigVerbruikKwh,
      'roiInput.huidigVerbruikKwh',
      100,
      Math.max(25_000, bagData.oppervlakte * 40),
    ),
    aantalPanelenOverride: Math.round(finiteNumber(
      roiRaw.aantalPanelenOverride,
      'roiInput.aantalPanelenOverride',
      1,
      Math.min(
        200,
        Math.max(40, Math.floor((bagData.dakOppervlakte * 0.70) / 4)),
      ),
    )),
    kwhPerPaneel: finiteNumber(roiRaw.kwhPerPaneel, 'roiInput.kwhPerPaneel', 200, 600),
    dakrichting: dakrichting as ROIInput['dakrichting'],
    huishouden_grootte: huishouden as 1 | 2 | 3 | null,
  }
  if (!KWH_PER_PANEEL_OPTIONS.has(roiInput.kwhPerPaneel!)) {
    throw new LeadSubmissionError(
      'roiInput.kwhPerPaneel is ongeldig',
      'roiInput.kwhPerPaneel',
    )
  }

  const postcode = text(body.postcode, 'postcode', { max: 8 })
    ?.replace(/\s/g, '')
    .toUpperCase() ?? bagPostcode
  if (postcode !== bagPostcode) {
    throw new LeadSubmissionError('postcode wijkt af van BAG', 'postcode')
  }

  const heeftPanelen = typeof body.heeftPanelen === 'boolean' ? body.heeftPanelen : null
  const huidigePanelenAantal = heeftPanelen === true
    ? Math.round(finiteNumber(body.huidigePanelenAantal, 'huidigePanelenAantal', 1, 200))
    : null

  return {
    naam,
    email,
    telefoon,
    adres: text(body.adres, 'adres', { required: true, max: 250 })!,
    postcode,
    huisnummer: bagData.huisnummer === null ? null : String(bagData.huisnummer),
    wijk: text(body.wijk, 'wijk', { max: 120 }),
    stad: text(body.stad, 'stad', { max: 120 }),
    provincie: text(body.provincie, 'provincie', { max: 80 }),
    bagData,
    roiInput,
    energielabel: null,
    meterkastAnalyse: nullableObject(body.meterkastAnalyse, 'meterkastAnalyse'),
    plaatsingsAnalyse: nullableObject(body.plaatsingsAnalyse, 'plaatsingsAnalyse'),
    omvormerAnalyse: nullableObject(body.omvormerAnalyse, 'omvormerAnalyse'),
    isEigenaar: typeof body.isEigenaar === 'boolean' ? body.isEigenaar : null,
    heeftPanelen,
    huidigePanelenAantal,
    dakrichting: roiInput.dakrichting ?? null,
    verbruikBron: body.verbruik_bron === 'gebruiker' ? 'gebruiker' : 'schatting',
    huishoudenGrootte: roiInput.huishouden_grootte ?? null,
    utmSource: text(body.utmSource, 'utmSource', { max: 120 }),
    utmMedium: text(body.utmMedium, 'utmMedium', { max: 120 }),
    utmCampaign: text(body.utmCampaign, 'utmCampaign', { max: 180 }),
    landingPage: text(body.landingPage, 'landingPage', { max: 500 }),
  }
}

export function deriveLeadAnalysis(
  lead: NormalizedLeadSubmission,
  netcongestieStatus: NetStatus,
): { roi: ROIResult; health: HealthScoreResult } {
  return {
    roi: berekenROI(lead.roiInput),
    health: berekenHealthScore({
      bouwjaar: lead.bagData.bouwjaar,
      energielabel: lead.energielabel,
      dakOppervlakte: lead.bagData.dakOppervlakte,
      netcongestieStatus,
    }),
  }
}

export async function readBoundedJson(
  request: Request,
  maxBytes = MAX_LEAD_BODY_BYTES,
): Promise<unknown> {
  const declared = Number(request.headers.get('content-length') ?? 0)
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new LeadSubmissionError('Aanvraag is te groot', 'body', 413)
  }
  const textBody = await request.text()
  if (Buffer.byteLength(textBody, 'utf8') > maxBytes) {
    throw new LeadSubmissionError('Aanvraag is te groot', 'body', 413)
  }
  try {
    return JSON.parse(textBody)
  } catch {
    throw new LeadSubmissionError('Ongeldig JSON body', 'body')
  }
}
