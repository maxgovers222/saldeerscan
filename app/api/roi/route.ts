import { applyRateLimit } from '@/lib/rate-limit'
import { berekenROI } from '@/lib/roi'
import { parseRoiInput, RoiInputError } from '@/lib/roi-input'
import { berekenHealthScore } from '@/lib/health-score'

export async function POST(request: Request) {
  const limitResult = await applyRateLimit(request, 120, 3_600_000)
  if (limitResult.response) return limitResult.response

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Ongeldig JSON body' }, { status: 400 })
  }
  let roiInput
  try {
    roiInput = parseRoiInput(body)
  } catch (error) {
    return Response.json({ error: error instanceof RoiInputError ? error.message : 'Ongeldige invoer' }, { status: 400 })
  }
  const energielabel = typeof body.energielabel === 'string' ? body.energielabel : null
  const netcongestieStatus = null // Client-supplied colors are not verified capacity evidence.
  const roi = berekenROI(roiInput)
  const health = berekenHealthScore({ bouwjaar: roiInput.bouwjaar, energielabel, dakOppervlakte: roiInput.dakOppervlakte, netcongestieStatus })

  return Response.json({ roi, health }, {
    headers: { 'X-RateLimit-Remaining': String(limitResult.rl!.remaining) }
  })
}
