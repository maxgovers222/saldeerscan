/**
 * Approximate NL postcode (4 digits) → provincie.
 * Ranges follow Wikipedia "Lijst van postcodes in Nederland" (not 100% edge-case perfect;
 * postcodes are not a clean province key, but good enough for lead attribution).
 */

type ProvincieRange = { van: number; tot: number; provincie: string }

/** Ordered ranges; first match wins. Keep non-overlapping and sorted. */
const PROVINCIE_RANGES: ProvincieRange[] = [
  { van: 1000, tot: 1299, provincie: 'Noord-Holland' },
  { van: 1300, tot: 1379, provincie: 'Flevoland' },
  { van: 1380, tot: 2158, provincie: 'Noord-Holland' },
  { van: 2159, tot: 3381, provincie: 'Zuid-Holland' },
  { van: 3382, tot: 3464, provincie: 'Utrecht' },
  { van: 3465, tot: 3466, provincie: 'Zuid-Holland' },
  { van: 3467, tot: 3769, provincie: 'Utrecht' },
  { van: 3770, tot: 3794, provincie: 'Gelderland' },
  { van: 3795, tot: 3836, provincie: 'Utrecht' },
  { van: 3837, tot: 3888, provincie: 'Gelderland' },
  { van: 3890, tot: 3899, provincie: 'Flevoland' },
  { van: 3900, tot: 3924, provincie: 'Utrecht' },
  { van: 3925, tot: 3925, provincie: 'Gelderland' },
  { van: 3926, tot: 3999, provincie: 'Utrecht' },
  { van: 4000, tot: 4299, provincie: 'Zeeland' },
  { van: 4300, tot: 4599, provincie: 'Zeeland' },
  { van: 4600, tot: 4699, provincie: 'Noord-Brabant' },
  { van: 4700, tot: 4799, provincie: 'Noord-Brabant' },
  { van: 4800, tot: 4899, provincie: 'Noord-Brabant' },
  { van: 4900, tot: 4999, provincie: 'Zeeland' },
  { van: 5000, tot: 5299, provincie: 'Noord-Brabant' },
  { van: 5300, tot: 5335, provincie: 'Gelderland' },
  { van: 5340, tot: 5765, provincie: 'Noord-Brabant' },
  { van: 5766, tot: 5817, provincie: 'Limburg' },
  { van: 5820, tot: 5846, provincie: 'Noord-Brabant' },
  { van: 5850, tot: 5995, provincie: 'Limburg' },
  { van: 6000, tot: 6019, provincie: 'Limburg' },
  { van: 6020, tot: 6029, provincie: 'Noord-Brabant' },
  { van: 6030, tot: 6499, provincie: 'Limburg' },
  { van: 6500, tot: 6583, provincie: 'Gelderland' },
  { van: 6584, tot: 6599, provincie: 'Limburg' },
  { van: 6600, tot: 6999, provincie: 'Gelderland' },
  { van: 7000, tot: 7999, provincie: 'Overijssel' },
  { van: 8000, tot: 8049, provincie: 'Overijssel' },
  { van: 8050, tot: 8054, provincie: 'Gelderland' },
  { van: 8055, tot: 8069, provincie: 'Overijssel' },
  { van: 8070, tot: 8099, provincie: 'Gelderland' },
  { van: 8100, tot: 8159, provincie: 'Overijssel' },
  { van: 8160, tot: 8195, provincie: 'Gelderland' },
  { van: 8196, tot: 8199, provincie: 'Overijssel' },
  { van: 8200, tot: 8259, provincie: 'Flevoland' },
  { van: 8260, tot: 8299, provincie: 'Overijssel' },
  { van: 8300, tot: 8322, provincie: 'Flevoland' },
  { van: 8323, tot: 8349, provincie: 'Overijssel' },
  { van: 8350, tot: 8354, provincie: 'Drenthe' },
  { van: 8355, tot: 8379, provincie: 'Overijssel' },
  { van: 8380, tot: 8387, provincie: 'Drenthe' },
  { van: 8388, tot: 9299, provincie: 'Friesland' },
  { van: 9300, tot: 9349, provincie: 'Drenthe' },
  { van: 9350, tot: 9999, provincie: 'Groningen' },
]

/** Accepts "3077", "3077PL", or "3077 PL". */
export function extractProvincie(postcodePrefix: string): string | null {
  const digits = postcodePrefix.replace(/\s/g, '').slice(0, 4)
  if (!/^\d{4}$/.test(digits)) return null
  const num = Number.parseInt(digits, 10)
  return PROVINCIE_RANGES.find(r => num >= r.van && num <= r.tot)?.provincie ?? null
}
