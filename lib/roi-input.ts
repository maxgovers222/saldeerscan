import type { ROIInput } from './roi'

export class RoiInputError extends Error {}

/** Shared by the preview and authoritative report calculation. No coercion of null/booleans. */
export function parseRoiInput(raw: unknown): ROIInput {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new RoiInputError('Ongeldige berekening')
  const body = raw as Record<string, unknown>
  function number(key: string, min: number, max: number, required = false, integer = false): number | undefined {
    const value = body[key]
    if (value === undefined && !required) return undefined
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) {
      throw new RoiInputError(`${key} moet tussen ${min} en ${max} liggen${integer ? ' (heel getal)' : ''}`)
    }
    return value
  }
  const direction = body.dakrichting ?? null
  if (direction !== null && !['Zuid', 'Oost/West', 'Noord'].includes(String(direction))) throw new RoiInputError('Ongeldige dakrichting')
  const household = body.huishouden_grootte ?? null
  if (body.verbruikBron !== undefined && body.verbruikBron !== 'schatting' && body.verbruikBron !== 'gebruiker') throw new RoiInputError('Ongeldige verbruiksbron')
  if (household !== null && ![1, 2, 3].includes(household as number)) throw new RoiInputError('Ongeldige huishoudgrootte')
  return {
    oppervlakte: number('oppervlakte', 1, 2000, true)!,
    bouwjaar: number('bouwjaar', 1000, 2030, true, true)!,
    dakOppervlakte: number('dakOppervlakte', 0, 5000, true)!,
    huidigVerbruikKwh: number('huidigVerbruikKwh', 0, 100_000),
    verbruikBron: body.verbruikBron as ROIInput['verbruikBron'],
    budgetEur: number('budgetEur', 0, 100_000),
    aantalPanelenOverride: number('aantalPanelenOverride', 0, 200, false, true),
    kwhPerPaneel: number('kwhPerPaneel', 200, 600),
    jaarProductieKwh: number('jaarProductieKwh', 0, 100_000),
    directEigenGebruikPct: number('directEigenGebruikPct', 0, 100),
    leveringstarief: number('leveringstarief', 0, 2),
    kaalLeveringstarief: number('kaalLeveringstarief', 0, 2),
    teruglevertarief: number('teruglevertarief', 0, 2),
    terugleverkosten2026Eur: number('terugleverkosten2026Eur', 0, 10_000),
    terugleverkosten2027Eur: number('terugleverkosten2027Eur', 0, 10_000),
    terugleverkostenPerKwh2026: number('terugleverkostenPerKwh2026', 0, 2),
    terugleverkostenPerKwh2027: number('terugleverkostenPerKwh2027', 0, 2),
    batterijInvesteringEur: number('batterijInvesteringEur', 0, 100_000),
    batterijCapaciteitKwh: number('batterijCapaciteitKwh', 0, 100),
    batterijRendementPct: number('batterijRendementPct', 1, 100),
    eigenGebruikMetBatterijPct: number('eigenGebruikMetBatterijPct', 0, 100),
    dakrichting: direction as ROIInput['dakrichting'],
    huishouden_grootte: household as ROIInput['huishouden_grootte'],
  }
}
