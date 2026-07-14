import { expect, test } from '@playwright/test'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { SaldeerRapportPDF } from '@/components/funnel/SaldeerRapportPDF'
import { buildReportModel } from '@/lib/report-model'
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
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF')
    expect(buffer.byteLength).toBeGreaterThan(10_000)
  })
}
