import type { Page } from '@playwright/test'
import type { NormalizedReport } from '@/lib/report-model'
import { makeFunnelStateFixture } from '../../fixtures/funnel-state'

export async function seedReportState(
  page: Page,
  report: NormalizedReport,
): Promise<void> {
  const state = makeFunnelStateFixture({
    step: 6,
    adres: report.home.address,
    wijk: report.home.wijk ?? '',
    stad: report.home.stad ?? '',
    leadId: report.leadId,
    reportModel: report,
  })
  await page.addInitScript(({ state }) => {
    localStorage.setItem('wep_funnel_state', JSON.stringify({
      version: 2,
      savedAt: Date.now(),
      state,
    }))
  }, { state })
}
