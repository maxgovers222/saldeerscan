import type { VisionType } from './vision-input'

export interface ScreeningResult {
  isCorrectType: boolean
  confidence: number
  redenering: string
}

export class VisionScreeningError extends Error {
  constructor(
    public imageType: string,
    public confidence: number,
    public redenering: string,
  ) {
    super(`Afbeelding niet herkend als ${imageType} (confidence: ${confidence})`)
    this.name = 'VisionScreeningError'
  }
}

export async function screenWithFallback(
  imageType: VisionType,
  primary: () => Promise<ScreeningResult>,
  fallback: () => Promise<ScreeningResult>,
): Promise<void> {
  let screening: ScreeningResult
  try {
    screening = await primary()
  } catch {
    // A provider failure says nothing about the photo. Keep screening with
    // the second provider rather than skipping image validation.
    screening = await fallback()
  }

  if (!screening.isCorrectType || !Number.isFinite(screening.confidence) || screening.confidence < 0.7) {
    throw new VisionScreeningError(imageType, screening.confidence, screening.redenering)
  }
}
