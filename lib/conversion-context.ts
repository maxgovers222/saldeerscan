export type PseoLevel =
  | 'home'
  | 'provincie'
  | 'stad'
  | 'wijk'
  | 'straat'
  | 'postcode'
  | 'kennisbank'
  | 'nieuws'

export interface ConversionContext {
  landingPath: string
  pseoLevel: PseoLevel
  provincie?: string
  stad?: string
  wijk?: string
  straat?: string
  postcode?: string
}

export function conversionParams(
  context: ConversionContext,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries({
      landing_path: context.landingPath,
      pseo_level: context.pseoLevel,
      provincie: context.provincie,
      stad: context.stad,
      wijk: context.wijk,
      straat: context.straat,
      postcode: context.postcode,
    }).filter((entry): entry is [string, string] => Boolean(entry[1])),
  )
}

export function buildCheckHref(context: ConversionContext): string {
  return `/check?${new URLSearchParams(conversionParams(context)).toString()}`
}

const PSEO_LEVELS = new Set<PseoLevel>([
  'home', 'provincie', 'stad', 'wijk', 'straat', 'postcode', 'kennisbank', 'nieuws',
])

export function parseConversionContext(
  params: Pick<URLSearchParams, 'get'>,
): ConversionContext | null {
  const pseoLevel = params.get('pseo_level')
  const landingPath = params.get('landing_path')
  if (!pseoLevel || !PSEO_LEVELS.has(pseoLevel as PseoLevel) || !landingPath) {
    return null
  }
  return {
    landingPath,
    pseoLevel: pseoLevel as PseoLevel,
    provincie: params.get('provincie') || undefined,
    stad: params.get('stad') || undefined,
    wijk: params.get('wijk') || undefined,
    straat: params.get('straat') || undefined,
    postcode: params.get('postcode') || undefined,
  }
}
