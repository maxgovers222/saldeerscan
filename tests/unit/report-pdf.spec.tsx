import { expect, test } from '@playwright/test'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { SaldeerRapportPDF } from '@/components/funnel/SaldeerRapportPDF'
import { buildReportModel } from '@/lib/report-model'
import { berekenROI } from '@/lib/roi'
import {
  reportSourceExistingPanels,
  reportSourceNoPanels,
} from '../fixtures/report'

for (const source of [reportSourceNoPanels, reportSourceExistingPanels]) {
  test(`generates a non-empty A4 PDF for ${source.qualification.heeftPanelen ? 'existing' : 'new'} panels`, async () => {
    const report = buildReportModel(source)!
    const document = createElement(SaldeerRapportPDF, { report }) as Parameters<
      typeof renderToBuffer
    >[0]
    const buffer = await renderToBuffer(document)
    const pdfSource = buffer.toString('latin1')
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF')
    expect(buffer.byteLength).toBeGreaterThan(10_000)
    expect(pdfSource.match(/\/Type \/Page\b/g)).toHaveLength(2)
    expect(pdfSource).toContain('BricolageGrotesque')
    expect(pdfSource).toContain('DMSans')
  })
}

test('new household reports include an A4 assumptions page without losing their input', async () => {
  const report = buildReportModel({ ...reportSourceExistingPanels, roiResult: berekenROI({
    oppervlakte: 100, bouwjaar: 1995, dakOppervlakte: 40, huidigVerbruikKwh: 4000,
    aantalPanelenOverride: 10, jaarProductieKwh: 4000, directEigenGebruikPct: 25,
    leveringstarief: 0.3, kaalLeveringstarief: 0.2, teruglevertarief: 0.1,
  }) })!
  const buffer = await renderToBuffer(createElement(SaldeerRapportPDF, { report }) as Parameters<typeof renderToBuffer>[0])
  expect(buffer.toString('latin1').match(/\/Type \/Page\b/g)).toHaveLength(3)
  expect(report.calculation?.input.jaarProductieKwh).toBe(4000)
  expect(report.calculation?.assumptions.join('\n')).toContain('Levering: €0.3/kWh')
})
