import { applyRateLimit } from '@/lib/rate-limit'
import {
  analyseMeterkast, analysePlaatsing, analyseOmvormer,
  VisionScreeningError
} from '@/lib/vision'
import { parseVisionInput, VisionInputError } from '@/lib/vision-input'

export async function POST(request: Request) {
  const limitResult = await applyRateLimit(request, 10, 3_600_000)
  if (limitResult.response) return limitResult.response

  let input
  try {
    input = parseVisionInput(await request.json())
  } catch (error) {
    if (error instanceof VisionInputError) {
      return Response.json({ error: error.message }, { status: 400 })
    }
    return Response.json({ error: 'Ongeldig JSON body' }, { status: 400 })
  }

  const { type, base64Data, mimeType } = input

  try {
    let result
    if (type === 'meterkast') result = await analyseMeterkast(base64Data, mimeType)
    else if (type === 'plaatsingslocatie') result = await analysePlaatsing(base64Data, mimeType)
    else result = await analyseOmvormer(base64Data, mimeType)

    return Response.json({ type, analyse: result })
  } catch (err) {
    if (err instanceof VisionScreeningError) {
      return Response.json({
        error: 'Afbeelding niet herkend',
        detail: err.redenering,
        confidence: err.confidence,
        tip: `Upload een duidelijke foto van een ${err.imageType}`,
      }, { status: 422 })
    }
    console.error('[api/vision] error:', err)
    return Response.json({ error: 'Vision analyse tijdelijk niet beschikbaar' }, { status: 500 })
  }
}
