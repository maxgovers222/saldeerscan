/** No verified capacity feed is connected. Never infer network facts from a postcode. */
export type NetcongestieStatus = 'ROOD' | 'ORANJE' | 'GROEN' | null
export const UNKNOWN_GRID_EXPLANATION = 'Actuele netsituatie niet geverifieerd. Een postcode bewijst geen beschikbare capaciteit of terugleverbeperking op uw aansluiting. Controleer dit bij uw netbeheerder.'
export interface NetcongestieResult {
  status: NetcongestieStatus
  netbeheerder: string
  uitleg: string
  terugleveringBeperkt: boolean | null
  postcodePrefix: string
  source: 'unavailable'
}
export async function getNetcongestie(postcode: string): Promise<NetcongestieResult> {
  return { status: null, netbeheerder: 'Onbekend', uitleg: UNKNOWN_GRID_EXPLANATION,
    terugleveringBeperkt: null, postcodePrefix: postcode.replace(/\s/g, '').slice(0, 4), source: 'unavailable' }
}
