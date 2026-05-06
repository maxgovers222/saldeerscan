import { applyRateLimit } from '@/lib/rate-limit'
import { berekenROI, ROIInput } from '@/lib/roi'
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
  const oppervlakte = Number(body.oppervlakte)
  const bouwjaar = Number(body.bouwjaar)
  const dakOppervlakte = Number(body.dakOppervlakte)
  const huidigVerbruikKwh = body.huidigVerbruikKwh !== undefined && body.huidigVerbruikKwh !== null ? Number(body.huidigVerbruikKwh) : undefined
  const budgetEur = body.budgetEur !== undefined && body.budgetEur !== null ? Number(body.budgetEur) : undefined
  const energielabel = typeof body.energielabel === 'string' ? body.energielabel : null
  const netcongestieStatus =
    body.netcongestieStatus === 'ROOD' || body.netcongestieStatus === 'ORANJE' || body.netcongestieStatus === 'GROEN'
      ? body.netcongestieStatus
      : null
  const aantalPanelenOverride = body.aantalPanelenOverride
  const kwhPerPaneel = body.kwhPerPaneel
  const dakrichting =
    body.dakrichting === 'Zuid' || body.dakrichting === 'Oost/West' || body.dakrichting === 'Noord'
      ? body.dakrichting
      : null
  const huishouden_grootte =
    body.huishouden_grootte === 1 || body.huishouden_grootte === 2 || body.huishouden_grootte === 3
      ? body.huishouden_grootte
      : null

  if (!Number.isFinite(oppervlakte) || !Number.isFinite(bouwjaar) || !Number.isFinite(dakOppervlakte)) {
    return Response.json({ error: 'oppervlakte, bouwjaar en dakOppervlakte zijn verplicht' }, { status: 400 })
  }
  if (bouwjaar < 1000 || bouwjaar > 2030) {
    return Response.json({ error: 'Bouwjaar moet tussen 1000 en 2030 liggen' }, { status: 400 })
  }
  if (oppervlakte <= 0 || oppervlakte > 2000) {
    return Response.json({ error: 'Oppervlakte moet tussen 1 en 2000 m² liggen' }, { status: 400 })
  }
  if (dakOppervlakte < 0 || dakOppervlakte > 5000) {
    return Response.json({ error: 'DakOppervlakte moet tussen 0 en 5000 m² liggen' }, { status: 400 })
  }

  const roiInput: ROIInput = {
    oppervlakte, bouwjaar, dakOppervlakte, huidigVerbruikKwh, budgetEur,
    aantalPanelenOverride: aantalPanelenOverride ? Number(aantalPanelenOverride) : undefined,
    kwhPerPaneel: kwhPerPaneel ? Number(kwhPerPaneel) : undefined,
    dakrichting: dakrichting ?? null,
    huishouden_grootte: huishouden_grootte ?? null,
  }
  const roi = berekenROI(roiInput)
  const health = berekenHealthScore({ bouwjaar, energielabel, dakOppervlakte, netcongestieStatus })

  return Response.json({ roi, health }, {
    headers: { 'X-RateLimit-Remaining': String(limitResult.rl!.remaining) }
  })
}
