export type VisionType = 'meterkast' | 'plaatsingslocatie' | 'omvormer'
export type VisionMime = 'image/jpeg' | 'image/png' | 'image/webp'

const TYPES = new Set<VisionType>(['meterkast', 'plaatsingslocatie', 'omvormer'])
const MIMES = new Set<VisionMime>(['image/jpeg', 'image/png', 'image/webp'])
const MAX_BYTES = 3 * 1024 * 1024

export class VisionInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'VisionInputError'
  }
}

export function parseVisionInput(raw: unknown): {
  type: VisionType
  base64Data: string
  mimeType: VisionMime
} {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new VisionInputError('Ongeldige aanvraag')
  }
  const body = raw as Record<string, unknown>
  if (typeof body.type !== 'string' || !TYPES.has(body.type as VisionType)) {
    throw new VisionInputError('Ongeldig analysetype')
  }
  if (typeof body.imageBase64 !== 'string') {
    throw new VisionInputError('imageBase64 is vereist')
  }
  const match = /^data:([^;]+);base64,([A-Za-z0-9+/]+={0,2})$/.exec(body.imageBase64)
  if (!match || !MIMES.has(match[1] as VisionMime)) {
    throw new VisionInputError('Alleen JPEG, PNG en WebP zijn toegestaan')
  }
  const decoded = Buffer.from(match[2], 'base64')
  if (decoded.length < 100) throw new VisionInputError('Afbeelding is te klein')
  if (decoded.length > MAX_BYTES) {
    throw new VisionInputError('Afbeelding is te groot (max 3 MiB)')
  }
  if (decoded.toString('base64').replace(/=+$/, '') !== match[2].replace(/=+$/, '')) {
    throw new VisionInputError('Afbeelding bevat ongeldige base64')
  }
  return {
    type: body.type as VisionType,
    base64Data: match[2],
    mimeType: match[1] as VisionMime,
  }
}
