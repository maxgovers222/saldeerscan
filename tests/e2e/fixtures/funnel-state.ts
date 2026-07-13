import type { Page } from '@playwright/test'
import type { FunnelState, FunnelStep } from '@/components/funnel/types'
import { makeFunnelStateFixture } from '../../fixtures/funnel-state'

export async function seedFunnelAtInternalStep(
  page: Page,
  step: FunnelStep,
  overrides: Partial<FunnelState> = {},
): Promise<void> {
  const state = makeFunnelStateFixture({ step, ...overrides })
  await page.addInitScript(({ state }) => {
    localStorage.setItem('wep_funnel_state', JSON.stringify({
      version: 2,
      savedAt: Date.now(),
      state,
    }))
  }, { state })
}
