import { expect, test } from '@playwright/test'
import {
  normalizeMeterkastAnalyse,
  normalizeOmvormerAnalyse,
  normalizePlaatsingsAnalyse,
} from '@/lib/vision-analysis'

test.describe('vision analysis normalization', () => {
  test('preserves the meterkast indication and requires an installer review', () => {
    const result = normalizeMeterkastAnalyse({
      merk: 'Hager',
      drie_fase: true,
      vrije_groepen: 2,
      max_vermogen_kw: 17.25,
      lijkt_geschikt: true,
      opmerkingen: [],
      confidence: 0.86,
    })

    expect(result).toEqual({
      merk: 'Hager',
      drieFase: true,
      vrijeGroepen: 2,
      maxVermogenKw: 17.25,
      geschikt: true,
      opmerkingen: [],
      confidence: 0.86,
      needsHumanReview: true,
    })
  })

  test('maps a placement photo to the backwards-compatible field without claiming certification', () => {
    const result = normalizePlaatsingsAnalyse({
      geen_zichtbare_blokkerende_risicos: true,
      risico_items: [],
      aanbevelingen: ['Controleer het installatievoorschrift'],
      geschiktheid_score: 8,
      confidence: 0.72,
    })

    expect(result.nenCompliant).toBe(true)
    expect(result.needsHumanReview).toBe(true)
    expect(result.geschiktheidScore).toBe(8)
  })

  test('clamps model confidence and placement score defensively', () => {
    const result = normalizePlaatsingsAnalyse({
      geen_zichtbare_blokkerende_risicos: false,
      risico_items: ['Leiding zichtbaar'],
      aanbevelingen: [],
      geschiktheid_score: 12,
      confidence: -0.2,
    })

    expect(result.geschiktheidScore).toBe(10)
    expect(result.confidence).toBe(0)
  })

  test('keeps inverter replacement as an indication requiring review', () => {
    const result = normalizeOmvormerAnalyse({
      merk: 'SolarEdge',
      model: null,
      vermogen_kw: null,
      hybride_klaar: false,
      vervanging_lijkt_nodig: true,
      opmerkingen: ['Model niet leesbaar'],
      confidence: 0.4,
    })

    expect(result.vervangenNodig).toBe(true)
    expect(result.needsHumanReview).toBe(true)
    expect(result.confidence).toBe(0.4)
  })
})
