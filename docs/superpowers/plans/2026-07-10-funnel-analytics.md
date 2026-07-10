# Funnel and Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Present the existing six-step data collection as four understandable customer stages, make technical scans one optional module, restore state deterministically, and measure the complete conversion path.

**Architecture:** Keep the proven reducer data and technical step numbers as an internal state machine, then derive a four-stage visual model through pure selectors. Extract reducer/storage/context precedence from the large container so it can be unit-tested. Add typed analytics metadata and one stable funnel session ID, while lazy-loading optional scan and lead-capture code.

**Tech Stack:** React 19 reducer/effects, Next.js 16 Client Components and dynamic imports, Tailwind v4, GA4 `gtag`, Supabase migration, Playwright unit/E2E.

**Depends on:** Plans 1 and 2 completed and green.

---

## File map

Create:

- `components/funnel/funnel-state.ts` — initial state, reducer, visual-stage selectors, and merge rules.
- `components/funnel/funnel-storage.ts` — versioned envelope, TTL, safe load/save/remove.
- `components/funnel/TechnicalScanModule.tsx` — one optional stage wrapping meterkast/plaatsing/omvormer.
- `components/funnel/primitives/ProgressHeader.tsx` — four-stage progress and remaining-time copy.
- `components/funnel/primitives/StepIntro.tsx` — consistent question hierarchy.
- `components/funnel/primitives/ChoiceCard.tsx` — accessible radio/toggle card.
- `components/funnel/primitives/StickyActionBar.tsx` — mobile safe-area action shell.
- `components/funnel/primitives/ValidationMessage.tsx` — field/status announcement.
- `lib/funnel-analytics.ts` — typed event payloads and source context.
- `tests/unit/funnel-state.spec.ts` — reducer/stage/URL precedence/storage tests.
- `tests/unit/funnel-analytics.spec.ts` — attribution and lead-segment tests.
- `tests/fixtures/funnel-state.ts` — complete serializable funnel fixture shared by E2E tests.
- `tests/e2e/fixtures/funnel-state.ts` — browser localStorage seeding helper.
- `tests/e2e/funnel-four-stages.spec.ts` — visible four-stage flow, technical skip, state restore, accessibility, overflow.
- `supabase/migrations/<generated>_funnel_attribution.sql` — session and pSEO attribution columns.

Modify:

- `components/funnel/types.ts` — stage-independent attribution/session/storage fields.
- `components/funnel/FunnelContainer.tsx` — orchestrator only; use extracted state/storage/selectors and dynamic steps.
- `components/funnel/FunnelProgress.tsx` — replace six-dot UI with `ProgressHeader` or remove after migration.
- `components/funnel/Step1Adres.tsx` — stage copy, BAG success/error events, retry/fallback semantics.
- `components/funnel/Step2ROI.tsx` — customer-language choices and stage completion.
- `components/funnel/Step3Meterkast.tsx` — embeddable scan panel and completion callback.
- `components/funnel/Step4Plaatsing.tsx` — embeddable scan panel and completion callback.
- `components/funnel/Step5Omvormer.tsx` — embeddable scan panel and completion callback.
- `components/funnel/Step6LeadCapture.tsx` — accessible fields/choices, first-error focus, submit analytics, sticky action.
- `components/funnel/PhotoUpload.tsx` — keyboard-operable upload control, scan events.
- `app/check/page.tsx` — pass all source context from the URL.
- `lib/analytics.ts` — type-safe base event parameter values.
- `lib/lead-submission.ts` — parse attribution/session fields.
- `app/api/leads/route.ts` — persist attribution/session.
- Existing funnel E2E files — update visible step wording while preserving behavioral coverage.
- `CLAUDE.md` — record visual/internal step distinction and analytics contract.

Do not change:

- ROI formulas, health-score formulas, BAG lookup, vision model prompts;
- report data model or output surfaces;
- pSEO route metadata and content;
- report token authorization.

---

### Task 1: Specify the four-stage model with pure tests

**Files:**

- Create: `tests/unit/funnel-state.spec.ts`
- Create: `components/funnel/funnel-state.ts`
- Modify: `components/funnel/types.ts`

- [ ] **Step 1: Write failing stage and reducer tests**

```ts
import { expect, test } from '@playwright/test'
import {
  funnelReducer,
  makeInitialState,
  visualStageForStep,
} from '@/components/funnel/funnel-state'

test('maps six internal steps to four customer stages', () => {
  expect([1, 2, 3, 4, 5, 6].map(step =>
    visualStageForStep(step as 1 | 2 | 3 | 4 | 5 | 6),
  )).toEqual([1, 2, 3, 3, 3, 4])
})

test('keeps technical data when moving between visual stages', () => {
  const initial = makeInitialState()
  const withScan = funnelReducer(initial, {
    type: 'SET_METERKAST',
    meterkastAnalyse: {
      merk: 'ABB',
      drieFase: true,
      vrijeGroepen: 2,
      maxVermogenKw: 17,
      geschikt: true,
      opmerkingen: [],
    },
  })
  const report = funnelReducer(withScan, { type: 'SET_STEP', step: 6 })
  expect(report.meterkastAnalyse?.merk).toBe('ABB')
  expect(visualStageForStep(report.step)).toBe(4)
})

test('resets dependent analysis when a different address is selected', () => {
  const state = {
    ...makeInitialState(),
    adres: 'Oud adres',
    roiResult: {} as never,
    healthScore: {} as never,
    roiInput: {} as never,
  }
  const next = funnelReducer(state, {
    type: 'START_NEW_ADDRESS',
    adres: 'Nieuw adres',
  })
  expect(next.adres).toBe('Nieuw adres')
  expect(next.roiResult).toBeNull()
  expect(next.healthScore).toBeNull()
  expect(next.roiInput).toBeNull()
  expect(next.step).toBe(1)
})
```

- [ ] **Step 2: Run and confirm the missing-module failure**

```powershell
npm run test:unit -- tests/unit/funnel-state.spec.ts
```

Expected: FAIL because `funnel-state.ts` does not exist.

- [ ] **Step 3: Add visual-stage and attribution types**

In `components/funnel/types.ts`:

```ts
import type { PseoLevel } from '@/lib/conversion-context'

export type FunnelStep = 1 | 2 | 3 | 4 | 5 | 6
export type VisualFunnelStage = 1 | 2 | 3 | 4

export interface FunnelAttribution {
  landingPath: string
  pseoLevel: PseoLevel
  provincie: string | null
  stad: string | null
  wijk: string | null
  straat: string | null
  postcode: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
}
```

In `FunnelState`, replace `step: 1 | ... | 6` with `step: FunnelStep`, replace the old `utmParams` object with:

```ts
funnelSessionId: string | null
attribution: FunnelAttribution
```

Add actions:

```ts
| { type: 'SET_FUNNEL_SESSION'; id: string }
| { type: 'SET_ATTRIBUTION'; attribution: FunnelAttribution }
| { type: 'START_NEW_ADDRESS'; adres: string }
| { type: 'RESTORE_STATE'; state: FunnelState }
```

- [ ] **Step 4: Move reducer and initial state into the pure module**

```ts
import type {
  FunnelAction,
  FunnelState,
  FunnelStep,
  VisualFunnelStage,
} from './types'

export function visualStageForStep(step: FunnelStep): VisualFunnelStage {
  if (step === 1) return 1
  if (step === 2) return 2
  if (step <= 5) return 3
  return 4
}

export function makeInitialState(input: {
  adres?: string
  wijk?: string
  stad?: string
  attribution?: Partial<FunnelState['attribution']>
} = {}): FunnelState {
  return {
    step: 1,
    adres: input.adres ?? '',
    wijk: input.wijk ?? '',
    stad: input.stad ?? '',
    bagData: null,
    netcongestie: null,
    healthScore: null,
    roiResult: null,
    roiInput: null,
    meterkastAnalyse: null,
    plaatsingsAnalyse: null,
    omvormerAnalyse: null,
    dakrichting: null,
    verbruik_bron: 'schatting',
    huishouden_grootte: null,
    is_eigenaar: null,
    heeft_panelen: null,
    huidige_panelen_aantal: null,
    leadId: null,
    leadReportToken: null,
    loading: false,
    error: null,
    funnelSessionId: null,
    attribution: {
      landingPath: input.attribution?.landingPath ?? '/check',
      pseoLevel: input.attribution?.pseoLevel ?? 'home',
      provincie: input.attribution?.provincie ?? null,
      stad: input.attribution?.stad ?? input.stad ?? null,
      wijk: input.attribution?.wijk ?? input.wijk ?? null,
      straat: input.attribution?.straat ?? null,
      postcode: input.attribution?.postcode ?? null,
      utmSource: input.attribution?.utmSource ?? null,
      utmMedium: input.attribution?.utmMedium ?? null,
      utmCampaign: input.attribution?.utmCampaign ?? null,
    },
  }
}

function clearAddressDerivedState(state: FunnelState): FunnelState {
  return {
    ...state,
    step: 1,
    bagData: null,
    netcongestie: null,
    healthScore: null,
    roiResult: null,
    roiInput: null,
    meterkastAnalyse: null,
    plaatsingsAnalyse: null,
    omvormerAnalyse: null,
    leadId: null,
    leadReportToken: null,
    error: null,
  }
}

export function funnelReducer(
  state: FunnelState,
  action: FunnelAction,
): FunnelState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step, error: null }
    case 'SET_WIJK':
      return { ...state, wijk: action.wijk, stad: action.stad }
    case 'SET_BAG_DATA':
      return { ...state, bagData: action.bagData }
    case 'SET_NETCONGESTIE':
      return { ...state, netcongestie: action.netcongestie }
    case 'SET_HEALTH_SCORE':
      return { ...state, healthScore: action.healthScore }
    case 'SET_ROI':
      return { ...state, roiResult: action.roiResult }
    case 'SET_ROI_INPUT':
      return { ...state, roiInput: action.roiInput }
    case 'SET_METERKAST':
      return { ...state, meterkastAnalyse: action.meterkastAnalyse }
    case 'SET_PLAATSING':
      return { ...state, plaatsingsAnalyse: action.plaatsingsAnalyse }
    case 'SET_OMVORMER':
      return { ...state, omvormerAnalyse: action.omvormerAnalyse }
    case 'SET_LEAD_ID':
      return { ...state, leadId: action.leadId }
    case 'SET_LEAD_REPORT_TOKEN':
      return { ...state, leadReportToken: action.token }
    case 'SET_ADRES':
      return { ...state, adres: action.adres }
    case 'SET_LOADING':
      return { ...state, loading: action.loading }
    case 'SET_ERROR':
      return { ...state, error: action.error }
    case 'SET_DAKRICHTING':
      return { ...state, dakrichting: action.dakrichting }
    case 'SET_VERBRUIK_BRON':
      return { ...state, verbruik_bron: action.bron }
    case 'SET_HUISHOUDEN':
      return { ...state, huishouden_grootte: action.grootte }
    case 'SET_IS_EIGENAAR':
      return { ...state, is_eigenaar: action.is_eigenaar }
    case 'SET_HEEFT_PANELEN':
      return { ...state, heeft_panelen: action.heeft_panelen }
    case 'SET_HUIDIGE_PANELEN_AANTAL':
      return {
        ...state,
        huidige_panelen_aantal: action.huidige_panelen_aantal,
      }
    case 'RESTORE_STATE': return action.state
    case 'START_NEW_ADDRESS':
      return { ...clearAddressDerivedState(state), adres: action.adres }
    case 'SET_FUNNEL_SESSION':
      return { ...state, funnelSessionId: action.id }
    case 'SET_ATTRIBUTION':
      return { ...state, attribution: action.attribution }
    default:
      return state
  }
}
```

Do not duplicate reducer definitions; remove the old local reducer and `makeInitialState` from `FunnelContainer.tsx`.

- [ ] **Step 5: Run unit tests and typecheck**

```powershell
npm run test:unit -- tests/unit/funnel-state.spec.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Version-control checkpoint**

If commits are authorized:

```powershell
git add components/funnel/types.ts components/funnel/funnel-state.ts components/funnel/FunnelContainer.tsx tests/unit/funnel-state.spec.ts
git commit -m "refactor: separate funnel state from presentation"
```

---

### Task 2: Make URL and localStorage precedence deterministic

**Files:**

- Create: `components/funnel/funnel-storage.ts`
- Modify: `components/funnel/funnel-state.ts`
- Modify: `components/funnel/FunnelContainer.tsx`
- Modify: `app/check/page.tsx`
- Create: `tests/fixtures/funnel-state.ts`
- Create: `tests/e2e/fixtures/funnel-state.ts`
- Modify: `tests/e2e/step6-validatie.spec.ts`
- Test: `tests/unit/funnel-state.spec.ts`
- Test: `tests/e2e/funnel-four-stages.spec.ts`

- [ ] **Step 1: Add failing precedence and TTL tests**

```ts
import {
  mergeSavedState,
  parseFunnelUrlContext,
} from '@/components/funnel/funnel-state'
import {
  decodeStoredFunnel,
  STORAGE_VERSION,
} from '@/components/funnel/funnel-storage'

test('report URL always wins and suppresses progress restore', () => {
  const url = parseFunnelUrlContext(new URLSearchParams({
    leadId: 'report-id',
    token: 'report-token',
  }))
  expect(url.mode).toBe('report')
  expect(url.allowResume).toBe(false)
})

test('explicit address remains active until the user explicitly restores saved progress', () => {
  const saved = { ...makeInitialState(), adres: 'Oud 1', step: 4 as const }
  const url = parseFunnelUrlContext(new URLSearchParams({
    adres: 'Nieuw 2',
  }))
  const current = makeInitialState({ adres: 'Nieuw 2' })
  expect(url.allowResume).toBe(true)
  expect(mergeSavedState(current, saved, url, 'keep-current').adres).toBe('Nieuw 2')
  expect(mergeSavedState(current, saved, url, 'resume-saved').adres).toBe('Oud 1')
})

test('pSEO context wins over saved regional context on explicit resume', () => {
  const saved = {
    ...makeInitialState({ wijk: 'oud', stad: 'oude-stad' }),
    step: 2 as const,
  }
  const url = parseFunnelUrlContext(new URLSearchParams({
    pseo_level: 'wijk',
    landing_path: '/utrecht/utrecht/leidsche-rijn',
    provincie: 'utrecht',
    stad: 'utrecht',
    wijk: 'leidsche-rijn',
  }))
  const merged = mergeSavedState(
    makeInitialState(),
    saved,
    url,
    'resume-saved',
  )
  expect(merged.step).toBe(2)
  expect(merged.wijk).toBe('leidsche-rijn')
  expect(merged.stad).toBe('utrecht')
  expect(merged.attribution.landingPath).toBe('/utrecht/utrecht/leidsche-rijn')
})

test('drops old versions and sessions older than 30 days', () => {
  const now = Date.parse('2026-07-10T10:00:00Z')
  expect(decodeStoredFunnel(JSON.stringify({
    version: STORAGE_VERSION - 1,
    savedAt: now,
    state: makeInitialState(),
  }), now)).toBeNull()
  expect(decodeStoredFunnel(JSON.stringify({
    version: STORAGE_VERSION,
    savedAt: now - 31 * 24 * 60 * 60 * 1000,
    state: makeInitialState(),
  }), now)).toBeNull()
})

test('migrates the unversioned wep_funnel_state shape without losing progress', () => {
  const legacy = {
    ...makeInitialState(),
    step: 4 as const,
    adres: 'Oud 1',
    attribution: undefined,
    funnelSessionId: undefined,
    utmParams: {
      source: 'google',
      medium: 'organic',
      campaign: null,
      landingPage: '/utrecht/utrecht/leidsche-rijn',
    },
  }
  const restored = decodeStoredFunnel(JSON.stringify(legacy))
  expect(restored?.step).toBe(4)
  expect(restored?.adres).toBe('Oud 1')
  expect(restored?.attribution.utmSource).toBe('google')
})
```

- [ ] **Step 2: Implement the versioned storage envelope**

```ts
import type { FunnelState } from './types'
import { makeInitialState } from './funnel-state'

export const STORAGE_KEY = 'wep_funnel_state'
export const STORAGE_VERSION = 2
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

interface StoredFunnel {
  version: number
  savedAt: number
  state: FunnelState
}

export function encodeStoredFunnel(
  state: FunnelState,
  now = Date.now(),
): string {
  return JSON.stringify({
    version: STORAGE_VERSION,
    savedAt: now,
    state,
  } satisfies StoredFunnel)
}

export function decodeStoredFunnel(
  raw: string | null,
  now = Date.now(),
): FunnelState | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const candidate = 'version' in parsed
      ? (() => {
          const envelope = parsed as Partial<StoredFunnel>
          if (
            envelope.version !== STORAGE_VERSION ||
            typeof envelope.savedAt !== 'number' ||
            now - envelope.savedAt > MAX_AGE_MS ||
            !envelope.state ||
            typeof envelope.state !== 'object'
          ) return null
          return envelope.state
        })()
      : parsed as Partial<FunnelState> & {
          utmParams?: {
            source?: string | null
            medium?: string | null
            campaign?: string | null
            landingPage?: string | null
          } | null
        }
    if (!candidate || ![1, 2, 3, 4, 5, 6].includes(candidate.step ?? 0)) {
      return null
    }
    const candidateState = candidate as Partial<FunnelState> & {
      step: FunnelState['step']
      utmParams?: {
        source?: string | null
        medium?: string | null
        campaign?: string | null
        landingPage?: string | null
      } | null
    }
    const legacyUtm = candidateState.utmParams ?? null
    const base = makeInitialState({
      adres: candidateState.adres,
      wijk: candidateState.wijk,
      stad: candidateState.stad,
    })
    const state: FunnelState = {
      ...base,
      ...candidateState,
      roiInput: candidateState.roiInput ?? null,
      leadReportToken: candidateState.leadReportToken ?? null,
      funnelSessionId: candidateState.funnelSessionId ?? null,
      attribution: candidateState.attribution ?? {
        ...base.attribution,
        landingPath: legacyUtm?.landingPage ?? '/check',
        utmSource: legacyUtm?.source ?? null,
        utmMedium: legacyUtm?.medium ?? null,
        utmCampaign: legacyUtm?.campaign ?? null,
      },
    }
    return state.step === 1 && !state.bagData ? null : state
  } catch {
    return null
  }
}

export function loadStoredFunnel(): FunnelState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const state = decodeStoredFunnel(raw)
    if (state && raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      if (!('version' in parsed)) saveStoredFunnel(state)
    }
    return state
  } catch {
    return null
  }
}

export function saveStoredFunnel(state: FunnelState): void {
  try {
    localStorage.setItem(STORAGE_KEY, encodeStoredFunnel(state))
  } catch {}
}

export function clearStoredFunnel(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}
```

- [ ] **Step 3: Implement URL parsing and merge rules**

In `funnel-state.ts`:

```ts
export interface FunnelUrlContext {
  mode: 'report' | 'address' | 'pseo' | 'generic'
  allowResume: boolean
  leadId: string | null
  token: string | null
  adres: string
  attribution: FunnelState['attribution']
}

export function parseFunnelUrlContext(params: URLSearchParams): FunnelUrlContext {
  const leadId = params.get('leadId')
  const token = params.get('token')
  const adres = params.get('adres')?.trim() ?? ''
  const pseoLevel = params.get('pseo_level')
  const hasPseo = Boolean(pseoLevel || params.get('wijk') || params.get('stad'))
  const mode = leadId ? 'report' : adres ? 'address' : hasPseo ? 'pseo' : 'generic'
  return {
    mode,
    allowResume: mode !== 'report',
    leadId,
    token,
    adres,
    attribution: {
      landingPath: params.get('landing_path') ?? '/check',
      pseoLevel: (
        ['home', 'provincie', 'stad', 'wijk', 'straat', 'postcode', 'kennisbank', 'nieuws']
          .includes(pseoLevel ?? '')
          ? pseoLevel
          : 'home'
      ) as FunnelState['attribution']['pseoLevel'],
      provincie: params.get('provincie'),
      stad: params.get('stad'),
      wijk: params.get('wijk'),
      straat: params.get('straat'),
      postcode: params.get('postcode'),
      utmSource: params.get('utm_source'),
      utmMedium: params.get('utm_medium'),
      utmCampaign: params.get('utm_campaign'),
    },
  }
}

export function mergeSavedState(
  current: FunnelState,
  saved: FunnelState,
  url: FunnelUrlContext,
  choice: 'keep-current' | 'resume-saved',
): FunnelState {
  if (!url.allowResume || choice === 'keep-current') return current
  if (url.mode === 'address') {
    return {
      ...saved,
      leadId: null,
      leadReportToken: null,
      attribution: {
        ...saved.attribution,
        ...url.attribution,
        utmSource: url.attribution.utmSource ?? saved.attribution.utmSource,
        utmMedium: url.attribution.utmMedium ?? saved.attribution.utmMedium,
        utmCampaign: url.attribution.utmCampaign ?? saved.attribution.utmCampaign,
      },
    }
  }
  return {
    ...saved,
    leadId: null,
    leadReportToken: null,
    attribution: {
      ...saved.attribution,
      ...url.attribution,
      utmSource: url.attribution.utmSource ?? saved.attribution.utmSource,
      utmMedium: url.attribution.utmMedium ?? saved.attribution.utmMedium,
      utmCampaign: url.attribution.utmCampaign ?? saved.attribution.utmCampaign,
    },
    wijk: url.attribution.wijk ?? saved.wijk,
    stad: url.attribution.stad ?? saved.stad,
  }
}
```

- [ ] **Step 4: Pass all query context from `app/check/page.tsx`**

Keep `useSearchParams` inside the current Suspense boundary. Build one object and pass it:

```tsx
const funnelUrlContext = Object.fromEntries(searchParams.entries())
return <FunnelContainer urlParams={funnelUrlContext} />
```

Change the container prop to:

```ts
export function FunnelContainer({
  urlParams,
}: {
  urlParams: Record<string, string>
})
```

Inside, use `useMemo(() => parseFunnelUrlContext(new URLSearchParams(urlParams)), [urlParams])`.

- [ ] **Step 5: Replace field-by-field unsafe restoration**

On “Doorgaan met vorige sessie”:

```ts
dispatch({
  type: 'RESTORE_STATE',
  state: mergeSavedState(state, savedState, urlContext, 'resume-saved'),
})
setSavedState(null)
```

For an explicit `?adres=` conflict, render both “Deze link gebruiken” and “Doorgaan met vorige sessie”. The current URL address is already on screen and remains untouched until the user chooses. “Deze link gebruiken” calls `mergeSavedState(..., 'keep-current')`, clears the stored state, and dismisses the banner. Suppress the resume banner only for report URLs. For a generic fresh start, retain the existing “Opnieuw” action and call `clearStoredFunnel()`.

- [ ] **Step 6: Add the E2E precedence cases**

Move the complete `FUNNEL_STATE_STEP6` literal currently at `tests/e2e/step6-validatie.spec.ts:14-93` into `tests/fixtures/funnel-state.ts` and type it as `FunnelState`. Do not shorten its BAG, net, health, ROI, or qualification values. Replace its legacy `utmParams` member with the Plan 3 fields and add the Plan 1 ROI provenance:

```ts
import type { FunnelState } from '@/components/funnel/types'

export function makeFunnelStateFixture(
  overrides: Partial<FunnelState> = {},
): FunnelState {
  return {
    ...FUNNEL_STATE_STEP6,
    ...overrides,
  }
}
```

In the relocated `FUNNEL_STATE_STEP6` object, insert the following exact members before its closing brace:

```ts
roiInput: {
  oppervlakte: 120,
  bouwjaar: 1880,
  dakOppervlakte: 45,
  huidigVerbruikKwh: 3500,
  aantalPanelenOverride: 8,
  kwhPerPaneel: 350,
  dakrichting: null,
  huishouden_grootte: null,
},
funnelSessionId: '11111111-1111-4111-8111-111111111111',
attribution: {
  landingPath: '/check',
  pseoLevel: 'home',
  provincie: null,
  stad: null,
  wijk: null,
  straat: null,
  postcode: null,
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
},
```

Update `step6-validatie.spec.ts` to import `FUNNEL_STATE_STEP6`; keep its current mock response derived from the same fixture.

Create `tests/e2e/fixtures/funnel-state.ts`:

```ts
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
```

Then create `tests/e2e/funnel-four-stages.spec.ts` with:

```ts
test('explicit adres is not overwritten by saved state', async ({ page }) => {
  const state = makeFunnelStateFixture({ adres: 'Oud adres', step: 4 })
  await page.addInitScript(({ state }) => {
    localStorage.setItem('wep_funnel_state', JSON.stringify({
      version: 2,
      savedAt: Date.now(),
      state,
    }))
  }, { state })
  await page.goto('/check?adres=Nieuw%20adres')
  await expect(page.getByText('Vorige sessie gevonden')).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Uw adres' })).toHaveValue('Nieuw adres')
  await page.getByRole('button', { name: 'Deze link gebruiken' }).click()
  await expect(page.getByText('Vorige sessie gevonden')).toHaveCount(0)
  await expect(page.getByRole('combobox', { name: 'Uw adres' })).toHaveValue('Nieuw adres')
})
```

Pass fixtures through the serializable `addInitScript` argument. Expose no production globals.

- [ ] **Step 7: Run focused tests**

```powershell
npm run test:unit -- tests/unit/funnel-state.spec.ts
npx playwright test tests/e2e/funnel-four-stages.spec.ts --project=chromium
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Version-control checkpoint**

If commits are authorized:

```powershell
git add components/funnel/funnel-storage.ts components/funnel/funnel-state.ts components/funnel/FunnelContainer.tsx app/check/page.tsx tests/fixtures/funnel-state.ts tests/e2e/fixtures/funnel-state.ts tests/e2e/step6-validatie.spec.ts tests/unit/funnel-state.spec.ts tests/e2e/funnel-four-stages.spec.ts
git commit -m "fix: make funnel restore precedence explicit"
```

---

### Task 3: Add a stable session and typed attribution

**Files:**

- Create: `lib/funnel-analytics.ts`
- Create: `tests/unit/funnel-analytics.spec.ts`
- Create with Supabase CLI: `supabase/migrations/<generated>_funnel_attribution.sql`
- Modify: `lib/analytics.ts`
- Modify: `components/funnel/FunnelContainer.tsx`
- Modify: `lib/lead-submission.ts`
- Modify: `app/api/leads/route.ts`

- [ ] **Step 1: Write failing analytics helper tests**

```ts
import { expect, test } from '@playwright/test'
import {
  buildFunnelEventParams,
  leadQualitySegment,
} from '@/lib/funnel-analytics'

const attribution = {
  landingPath: '/utrecht/utrecht/leidsche-rijn',
  pseoLevel: 'wijk' as const,
  provincie: 'utrecht',
  stad: 'utrecht',
  wijk: 'leidsche-rijn',
  straat: null,
  postcode: null,
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
}

test('includes organic context without UTM values', () => {
  expect(buildFunnelEventParams({
    sessionId: 'session-1',
    attribution,
    stage: 2,
  })).toMatchObject({
    funnel_session_id: 'session-1',
    landing_path: '/utrecht/utrecht/leidsche-rijn',
    pseo_level: 'wijk',
    provincie: 'utrecht',
    stad: 'utrecht',
    wijk: 'leidsche-rijn',
    funnel_stage: 2,
  })
})

test('derives transparent lead quality segments', () => {
  expect(leadQualitySegment({ isEigenaar: true, heeftPanelen: true }))
    .toBe('owner_existing_solar')
  expect(leadQualitySegment({ isEigenaar: false, heeftPanelen: false }))
    .toBe('tenant_no_solar')
  expect(leadQualitySegment({ isEigenaar: null, heeftPanelen: null }))
    .toBe('unknown')
})
```

- [ ] **Step 2: Implement the typed helper**

```ts
import type {
  FunnelAttribution,
  VisualFunnelStage,
} from '@/components/funnel/types'

export type FunnelEventName =
  | 'funnel_session_started'
  | 'funnel_stage_viewed'
  | 'funnel_stage_completed'
  | 'bag_match_succeeded'
  | 'bag_match_failed'
  | 'technical_scan_completed'
  | 'technical_scan_skipped'
  | 'technical_module_skipped'
  | 'lead_submit_started'
  | 'lead_submit_succeeded'
  | 'lead_submit_failed'
  | 'funnel_abandoned'

export interface FunnelEventExtra {
  completed_stage?: VisualFunnelStage
  reason?: 'not_found' | 'api_error'
  postcode_prefix?: string
  scan_type?: 'Meterkast' | 'Plaatsingslocatie' | 'Omvormer'
  completion?: 'photo' | 'manual'
  from_scan?: 'Meterkast' | 'Plaatsingslocatie' | 'Omvormer'
  lead_quality_segment?: string
  email_status?: 'sent' | 'failed' | 'skipped'
  failure_type?: `http_${number}` | 'network'
}

export function buildFunnelEventParams(input: {
  sessionId: string
  attribution: FunnelAttribution
  stage?: VisualFunnelStage
  extra?: FunnelEventExtra
}): Record<string, string | number | boolean> {
  const a = input.attribution
  return {
    funnel_session_id: input.sessionId,
    landing_path: a.landingPath,
    pseo_level: a.pseoLevel,
    ...(a.provincie ? { provincie: a.provincie } : {}),
    ...(a.stad ? { stad: a.stad } : {}),
    ...(a.wijk ? { wijk: a.wijk } : {}),
    ...(a.straat ? { straat: a.straat } : {}),
    ...(a.postcode ? { postcode: a.postcode } : {}),
    ...(a.utmSource ? { utm_source: a.utmSource } : {}),
    ...(a.utmMedium ? { utm_medium: a.utmMedium } : {}),
    ...(a.utmCampaign ? { utm_campaign: a.utmCampaign } : {}),
    ...(input.stage ? { funnel_stage: input.stage } : {}),
    ...input.extra,
  }
}

export function leadQualitySegment(input: {
  isEigenaar: boolean | null
  heeftPanelen: boolean | null
}): string {
  if (input.isEigenaar === null || input.heeftPanelen === null) return 'unknown'
  return `${input.isEigenaar ? 'owner' : 'tenant'}_${input.heeftPanelen ? 'existing_solar' : 'no_solar'}`
}
```

- [ ] **Step 3: Generate one session ID per funnel**

In `FunnelContainer`, after mount:

```ts
const sessionStartedRef = useRef(false)

useEffect(() => {
  if (state.funnelSessionId || sessionStartedRef.current) return
  sessionStartedRef.current = true
  const id = crypto.randomUUID()
  dispatch({ type: 'SET_FUNNEL_SESSION', id })
  trackEvent('funnel_session_started', buildFunnelEventParams({
    sessionId: id,
    attribution: state.attribution,
    stage: visualStageForStep(state.step),
  }))
}, [state.funnelSessionId, state.attribution, state.step])
```

The ref is required: React Strict Mode may invoke the effect twice before the reducer update is visible.

- [ ] **Step 4: Add database columns**

Run `npx supabase migration new funnel_attribution` and put the following SQL in the generated file; do not hand-invent its timestamp.

```sql
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS funnel_session_id UUID,
  ADD COLUMN IF NOT EXISTS pseo_level TEXT,
  ADD COLUMN IF NOT EXISTS landing_provincie TEXT,
  ADD COLUMN IF NOT EXISTS landing_stad TEXT,
  ADD COLUMN IF NOT EXISTS landing_wijk TEXT,
  ADD COLUMN IF NOT EXISTS landing_straat TEXT,
  ADD COLUMN IF NOT EXISTS landing_postcode TEXT;

CREATE INDEX IF NOT EXISTS leads_funnel_session_idx
  ON leads (funnel_session_id)
  WHERE funnel_completed = TRUE;

CREATE INDEX IF NOT EXISTS leads_landing_attribution_idx
  ON leads (pseo_level, created_at)
  WHERE funnel_completed = TRUE;
```

No RLS policy changes are needed because `leads` remains service-role-only.

- [ ] **Step 5: Parse and persist the fields**

Extend `NormalizedLeadSubmission` and parser with:

```ts
funnelSessionId: text(body.funnelSessionId, 'funnelSessionId', { required: true, max: 36 })!,
pseoLevel: text(body.pseoLevel, 'pseoLevel', { required: true, max: 20 })!,
landingPath: text(body.landingPath, 'landingPath', { required: true, max: 500 })!,
landingProvincie: text(body.landingProvincie, 'landingProvincie', { max: 80 }),
landingStad: text(body.landingStad, 'landingStad', { max: 120 }),
landingWijk: text(body.landingWijk, 'landingWijk', { max: 120 }),
landingStraat: text(body.landingStraat, 'landingStraat', { max: 160 }),
landingPostcode: text(body.landingPostcode, 'landingPostcode', { max: 8 }),
```

Validate `funnelSessionId` with:

```ts
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(funnelSessionId)) {
  throw new LeadSubmissionError('funnelSessionId is ongeldig', 'funnelSessionId')
}
if (!['home', 'provincie', 'stad', 'wijk', 'straat', 'postcode', 'kennisbank', 'nieuws'].includes(pseoLevel)) {
  throw new LeadSubmissionError('pseoLevel is ongeldig', 'pseoLevel')
}
if (!landingPath.startsWith('/') || landingPath.startsWith('//')) {
  throw new LeadSubmissionError('landingPath is ongeldig', 'landingPath')
}
```

Persist to matching columns in `app/api/leads/route.ts`.

- [ ] **Step 6: Run tests and migration validation**

```powershell
npm run test:unit -- tests/unit/funnel-analytics.spec.ts tests/unit/lead-submission.spec.ts
npm run typecheck
npx supabase db lint
```

Expected: tests/typecheck pass and migration has no SQL lint errors. If Supabase is not linked locally, report that tool limitation and manually review the migration; do not mark database validation complete.

- [ ] **Step 7: Version-control checkpoint**

If commits are authorized:

```powershell
git add lib/funnel-analytics.ts lib/analytics.ts components/funnel/FunnelContainer.tsx lib/lead-submission.ts app/api/leads/route.ts tests/unit/funnel-analytics.spec.ts supabase/migrations/*_funnel_attribution.sql
git commit -m "feat: attribute qualified funnel sessions"
```

---

### Task 4: Render four understandable progress stages

**Files:**

- Create: `components/funnel/primitives/ProgressHeader.tsx`
- Create: `components/funnel/primitives/StepIntro.tsx`
- Modify: `components/funnel/FunnelContainer.tsx`
- Modify/Delete: `components/funnel/FunnelProgress.tsx`
- Test: `tests/e2e/funnel-four-stages.spec.ts`

- [ ] **Step 1: Add failing progress tests**

```ts
test('shows four customer stages rather than six technical steps', async ({ page }) => {
  await page.goto('/check')
  const progress = page.getByRole('progressbar', { name: 'Voortgang rapport' })
  await expect(progress).toHaveAttribute('aria-valuemin', '1')
  await expect(progress).toHaveAttribute('aria-valuemax', '4')
  await expect(page.getByText('Stap 1 van 4')).toBeVisible()
  await expect(page.getByText('± 3 min resterend')).toBeVisible()
})
```

- [ ] **Step 2: Implement the progress header**

```tsx
import type { VisualFunnelStage } from '../types'

const STAGES = [
  { title: 'Adres & woning', minutes: 3 },
  { title: 'Uw situatie', minutes: 2 },
  { title: 'Dossier nauwkeuriger maken', minutes: 1 },
  { title: 'Rapport ontvangen', minutes: 1 },
] as const

export function ProgressHeader({ stage }: { stage: VisualFunnelStage }) {
  const current = STAGES[stage - 1]
  return (
    <header className="border-b border-ink/10 bg-paper px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between gap-4 text-sm">
        <div>
          <p className="font-semibold text-ink">{current.title}</p>
          <p className="text-ink-muted">Stap {stage} van 4</p>
        </div>
        <p className="shrink-0 text-ink-muted">± {current.minutes} min resterend</p>
      </div>
      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/10"
        role="progressbar"
        aria-label="Voortgang rapport"
        aria-valuemin={1}
        aria-valuemax={4}
        aria-valuenow={stage}
      >
        <div
          className="h-full rounded-full bg-trust transition-[width]"
          style={{ width: `${stage * 25}%` }}
        />
      </div>
    </header>
  )
}
```

- [ ] **Step 3: Implement the step intro**

```tsx
export function StepIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string
  title: string
  description: string
}) {
  return (
    <header>
      {eyebrow && <p className="mb-2 text-sm font-semibold text-trust-dark">{eyebrow}</p>}
      <h1 className="text-3xl font-bold tracking-tight text-ink">{title}</h1>
      <p className="mt-3 text-base leading-7 text-ink-muted">{description}</p>
    </header>
  )
}
```

- [ ] **Step 4: Integrate it once in the container**

```tsx
const visualStage = visualStageForStep(state.step)

<div className="overflow-hidden rounded-3xl border border-ink/10 bg-paper shadow-sm">
  <ProgressHeader stage={visualStage} />
  {/* current stage content */}
</div>
```

Remove the six-circle visual progress. Internal Step3/4/5 can still use substep copy inside the technical module.

- [ ] **Step 5: Track stage views exactly once**

Use a `lastTrackedStageRef` and emit `funnel_stage_viewed` only when `visualStage` changes and `funnelSessionId` exists.

- [ ] **Step 6: Run focused tests**

```powershell
npx playwright test tests/e2e/funnel-four-stages.spec.ts --project=chromium
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Version-control checkpoint**

If commits are authorized:

```powershell
git add components/funnel/primitives/ProgressHeader.tsx components/funnel/primitives/StepIntro.tsx components/funnel/FunnelContainer.tsx components/funnel/FunnelProgress.tsx tests/e2e/funnel-four-stages.spec.ts
git commit -m "feat: present a four-stage customer funnel"
```

---

### Task 5: Make technical scans one optional module

**Files:**

- Create: `components/funnel/TechnicalScanModule.tsx`
- Modify: `components/funnel/Step3Meterkast.tsx`
- Modify: `components/funnel/Step4Plaatsing.tsx`
- Modify: `components/funnel/Step5Omvormer.tsx`
- Modify: `components/funnel/FunnelContainer.tsx`
- Test: `tests/e2e/funnel-four-stages.spec.ts`

- [ ] **Step 1: Write failing module and skip tests**

```ts
test('technical scans are one optional stage and can be skipped', async ({ page }) => {
  await seedFunnelAtInternalStep(page, 3)
  await page.goto('/check')
  await page.getByRole('button', { name: 'Doorgaan' }).click()

  await expect(page.getByRole('heading', {
    name: 'Maak uw dossier nauwkeuriger',
  })).toBeVisible()
  await expect(page.getByText('Onderdeel 1 van 3')).toBeVisible()
  await page.getByRole('button', { name: 'Technische scans overslaan' }).click()
  await expect(page.getByText('Stap 4 van 4')).toBeVisible()
  await expect(page.getByRole('heading', {
    name: 'Ontvang uw persoonlijke rapport',
  })).toBeVisible()
})
```

- [ ] **Step 2: Give scan components an embedded contract**

Each scan component receives:

```ts
interface TechnicalPanelProps {
  state: FunnelState
  dispatch: Dispatch<FunnelAction>
  embedded?: boolean
  onComplete?: (mode: 'photo' | 'manual') => void
  onSkip?: () => void
}
```

When `embedded`, omit the old `StepHeader` and old back/next footer. Call `onComplete` after a photo/manual result and `onSkip` from its skip action. Keep current analysis cards and fallback forms.

- [ ] **Step 3: Implement the module**

```tsx
import { Step3Meterkast } from './Step3Meterkast'
import { Step4Plaatsing } from './Step4Plaatsing'
import { Step5Omvormer } from './Step5Omvormer'
import { StepIntro } from './primitives/StepIntro'
import type { FunnelEventExtra } from '@/lib/funnel-analytics'

const PANELS = {
  3: { label: 'Meterkast', Component: Step3Meterkast, next: 4 as const },
  4: { label: 'Plaatsingslocatie', Component: Step4Plaatsing, next: 5 as const },
  5: { label: 'Omvormer', Component: Step5Omvormer, next: 6 as const },
} as const

export function TechnicalScanModule({
  state,
  dispatch,
  trackScan,
}: {
  state: FunnelState
  dispatch: Dispatch<FunnelAction>
  trackScan: (
    event: 'technical_scan_completed' | 'technical_scan_skipped' | 'technical_module_skipped',
    details: FunnelEventExtra,
  ) => void
}) {
  const panel = PANELS[state.step as 3 | 4 | 5]
  const index = state.step - 2
  const Panel = panel.Component
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <StepIntro
        eyebrow={`Onderdeel ${index} van 3 · Optioneel`}
        title="Maak uw dossier nauwkeuriger"
        description="Elke scan voegt technische onderbouwing toe. U kunt doorgaan zonder foto; een installateur controleert dit later."
      />
      <nav aria-label="Technische scanvoortgang" className="grid grid-cols-3 gap-2">
        {Object.values(PANELS).map((item, itemIndex) => (
          <span
            key={item.label}
            aria-current={itemIndex + 1 === index ? 'step' : undefined}
            className={itemIndex + 1 <= index ? 'h-1 rounded bg-trust' : 'h-1 rounded bg-ink/10'}
          />
        ))}
      </nav>
      <Panel
        state={state}
        dispatch={dispatch}
        embedded
        onComplete={mode => {
          trackScan('technical_scan_completed', { scan_type: panel.label, completion: mode })
          dispatch({ type: 'SET_STEP', step: panel.next })
        }}
        onSkip={() => {
          trackScan('technical_scan_skipped', { scan_type: panel.label })
          dispatch({ type: 'SET_STEP', step: panel.next })
        }}
      />
      <button
        type="button"
        data-testid="technical-module-skip"
        className="min-h-11 w-full text-sm font-semibold text-ink-muted underline-offset-4 hover:underline"
        onClick={() => {
          trackScan('technical_module_skipped', { from_scan: panel.label })
          dispatch({ type: 'SET_STEP', step: 6 })
        }}
      >
        Technische scans overslaan
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Lazy-load the module and lead capture**

In `FunnelContainer.tsx`:

```ts
import dynamic from 'next/dynamic'

const TechnicalScanModule = dynamic(
  () => import('./TechnicalScanModule').then(module => module.TechnicalScanModule),
  { loading: () => <StageSkeleton label="Technische module laden" /> },
)
const Step6LeadCapture = dynamic(
  () => import('./Step6LeadCapture').then(module => module.Step6LeadCapture),
  { loading: () => <StageSkeleton label="Rapportformulier laden" /> },
)
```

Keep Step1 eager. Step2 may remain eager because it is the immediate next stage; measure before deciding to lazy-load it.

- [ ] **Step 5: Run technical module tests**

```powershell
npx playwright test tests/e2e/funnel-four-stages.spec.ts --project=chromium
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Version-control checkpoint**

If commits are authorized:

```powershell
git add components/funnel/TechnicalScanModule.tsx components/funnel/Step3Meterkast.tsx components/funnel/Step4Plaatsing.tsx components/funnel/Step5Omvormer.tsx components/funnel/FunnelContainer.tsx tests/e2e/funnel-four-stages.spec.ts
git commit -m "feat: group optional technical scans"
```

---

### Task 6: Standardize choices, validation, and sticky actions

**Files:**

- Create: `components/funnel/primitives/ChoiceCard.tsx`
- Create: `components/funnel/primitives/StickyActionBar.tsx`
- Create: `components/funnel/primitives/ValidationMessage.tsx`
- Modify: `components/funnel/Step1Adres.tsx`
- Modify: `components/funnel/Step2ROI.tsx`
- Modify: `components/funnel/Step6LeadCapture.tsx`
- Modify: `components/funnel/PhotoUpload.tsx`
- Test: `tests/e2e/funnel-four-stages.spec.ts`
- Test: `tests/e2e/step6-validatie.spec.ts`

- [ ] **Step 1: Implement accessible choice cards**

```tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function ChoiceCard({
  selected,
  title,
  description,
  icon,
  className,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  selected: boolean
  title: string
  description?: string
  icon?: ReactNode
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={cn(
        'flex min-h-14 w-full items-start gap-3 rounded-2xl border p-4 text-left',
        'transition focus-visible:ring-2 focus-visible:ring-trust',
        selected
          ? 'border-trust bg-trust/10 text-ink'
          : 'border-ink/10 bg-paper text-ink hover:border-trust/40',
        className,
      )}
      {...props}
    >
      {icon}
      <span>
        <span className="block font-semibold">{title}</span>
        {description && (
          <span className="mt-1 block text-sm leading-6 text-ink-muted">
            {description}
          </span>
        )}
      </span>
    </button>
  )
}
```

Wrap mutually exclusive groups in `role="radiogroup"` with a visible or `aria-label` question.

- [ ] **Step 2: Implement mobile safe-area actions**

```tsx
import type { ReactNode } from 'react'

export function StickyActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 border-t border-ink/10 bg-paper/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:pb-0">
      {children}
    </div>
  )
}
```

Every primary next/submit button must be at least 44px and use amber. Back/skip actions are quiet.

- [ ] **Step 3: Implement announced validation**

```tsx
export function ValidationMessage({
  id,
  children,
}: {
  id: string
  children: string
}) {
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm text-danger">
      {children}
    </p>
  )
}
```

In Step6, store refs for fields and focus the first invalid field after validation:

```ts
const fieldRefs = {
  naam: useRef<HTMLInputElement>(null),
  email: useRef<HTMLInputElement>(null),
  telefoon: useRef<HTMLInputElement>(null),
  gdprConsent: useRef<HTMLInputElement>(null),
}

const orderedFields = ['naam', 'email', 'telefoon', 'gdprConsent'] as const
const first = orderedFields.find(field => e[field])
if (first) requestAnimationFrame(() => fieldRefs[first].current?.focus())
```

Use `aria-invalid`, `aria-describedby`, and preserve all valid values.

- [ ] **Step 4: Make photo upload keyboard-operable**

Replace the click-only `<div>` with a `<label htmlFor={inputId}>` and a real visually-hidden file input. The label gets `tabIndex={0}` only if needed; prefer a visible `<button type="button">Foto kiezen</button>` that calls `fileInputRef.current?.click()`. Accept only:

```tsx
accept="image/jpeg,image/png,image/webp"
```

Announce loading with:

```tsx
<p role="status" aria-live="polite">Foto analyseren…</p>
```

- [ ] **Step 5: Replace choice buttons in Steps 2 and 6**

Use `ChoiceCard` for:

- existing panels yes/no;
- owner/tenant;
- household size;
- roof orientation where space allows.

Keep slider semantics and numerical data in monospace. Customer questions and explanations use DM Sans.

Add `data-testid="stage-2-continue"` to the Stage 2 primary action. This and `technical-module-skip` are stable transition hooks for analytics E2E; accessible names remain the user-facing source of truth for interaction and accessibility tests.

- [ ] **Step 6: Add overflow and keyboard tests**

```ts
test('all funnel stages remain vertical after input on 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/check')
  const input = page.getByRole('combobox', { name: 'Uw adres' })
  await input.fill('Lange invoer die nooit de viewport mag verbreden')
  const widths = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }))
  expect(widths.scroll).toBeLessThanOrEqual(widths.client)
})

test('invalid lead form focuses the first error', async ({ page }) => {
  await seedFunnelAtInternalStep(page, 6)
  await page.goto('/check')
  await page.getByRole('button', { name: 'Rapport aanvragen' }).click()
  await expect(page.locator('#lead-naam')).toBeFocused()
  await expect(page.locator('#lead-naam')).toHaveAttribute('aria-invalid', 'true')
})
```

- [ ] **Step 7: Run focused validation**

```powershell
npx playwright test tests/e2e/funnel-four-stages.spec.ts tests/e2e/step6-validatie.spec.ts --project=chromium
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Version-control checkpoint**

If commits are authorized:

```powershell
git add components/funnel/primitives components/funnel/Step1Adres.tsx components/funnel/Step2ROI.tsx components/funnel/Step6LeadCapture.tsx components/funnel/PhotoUpload.tsx tests/e2e
git commit -m "feat: make funnel controls touch and keyboard safe"
```

---

### Task 7: Emit stage, scan, submit, and abandonment events

**Files:**

- Modify: `components/funnel/FunnelContainer.tsx`
- Modify: `components/funnel/Step1Adres.tsx`
- Modify: `components/funnel/TechnicalScanModule.tsx`
- Modify: `components/funnel/Step6LeadCapture.tsx`
- Modify: `tests/e2e/funnel-four-stages.spec.ts`

- [ ] **Step 1: Add an E2E gtag capture**

```ts
test('emits one typed event per stage transition', async ({ page }) => {
  const captured: unknown[][] = []
  await page.exposeFunction('__captureGtag', (...args: unknown[]) => {
    captured.push(args)
  })
  await page.addInitScript(() => {
    window.gtag = (...args: unknown[]) => {
      void window.__captureGtag(...args)
    }
  })
  await seedFunnelAtInternalStep(page, 2)
  await page.goto('/check?pseo_level=wijk&landing_path=%2Futrecht%2Futrecht%2Ftest&wijk=test&stad=utrecht')
  await page.getByRole('button', { name: /Doorgaan/ }).click()
  await page.getByTestId('stage-2-continue').click()
  await page.getByTestId('technical-module-skip').click()
  await expect(page.getByText('Stap 4 van 4')).toBeVisible()

  const stageViews = captured
    .filter(event => event[0] === 'event' && event[1] === 'funnel_stage_viewed')
    .map(event => (event[2] as { funnel_stage: number }).funnel_stage)
  expect(stageViews).toEqual([2, 3, 4])
})
```

Add test-only global declarations in the test file, not production code.

In `FunnelContainer`, create the single typed emitter used by child stages:

```ts
const trackFunnel = useCallback((
  event: FunnelEventName,
  extra: FunnelEventExtra = {},
) => {
  if (!state.funnelSessionId) return
  trackEvent(event, buildFunnelEventParams({
    sessionId: state.funnelSessionId,
    attribution: state.attribution,
    stage: visualStageForStep(state.step),
    extra,
  }))
}, [
  state.funnelSessionId,
  state.attribution,
  state.step,
])
```

Import `FunnelEventExtra` and `FunnelEventName` from `lib/funnel-analytics.ts`. Pass this callback through explicit props; child components must not independently reconstruct attribution.

- [ ] **Step 2: Emit one completion when the customer stage advances**

Replace the old `funnel_step_complete` logic in `trackingDispatch`. Before dispatching a forward `SET_STEP`, compare visual stages:

```ts
const currentStage = visualStageForStep(state.step)
const nextStage = action.type === 'SET_STEP'
  ? visualStageForStep(action.step)
  : currentStage

if (
  action.type === 'SET_STEP' &&
  action.step > state.step &&
  nextStage > currentStage
) {
  trackFunnel('funnel_stage_completed', {
    completed_stage: currentStage,
  })
}
dispatch(action)
```

Add `completed_stage?: VisualFunnelStage` to `FunnelEventExtra`. Pass `trackingDispatch`, not raw `dispatch`, into Step 1, Step 2, `TechnicalScanModule`, and Step 6. Internal transitions 3→4→5 must not emit extra customer-stage completions.

- [ ] **Step 3: Emit BAG events in Step1**

On success:

```ts
trackFunnel('bag_match_succeeded', {
  postcode_prefix: bagData.postcode?.replace(/\s/g, '').slice(0, 4) ?? '',
})
```

On API/not-found failure:

```ts
trackFunnel('bag_match_failed', {
  reason: response.status === 404 ? 'not_found' : 'api_error',
})
```

Do not send full addresses to GA4.

- [ ] **Step 4: Emit submit events**

In Step6:

```ts
trackFunnel('lead_submit_started', {
  lead_quality_segment: leadQualitySegment({
    isEigenaar: form.isEigenaar,
    heeftPanelen: heeftPayload,
  }),
})
```

On 201:

```ts
trackFunnel('lead_submit_succeeded', {
  lead_quality_segment: segment,
  email_status: data.emailStatus,
})
```

On HTTP/network error:

```ts
trackFunnel('lead_submit_failed', {
  failure_type: res ? `http_${res.status}` : 'network',
})
```

- [ ] **Step 5: Replace `beforeunload` with guarded `pagehide`**

```ts
const abandonmentSentRef = useRef(false)

useEffect(() => {
  const handlePageHide = (event: PageTransitionEvent) => {
    if (
      !event.persisted &&
      !abandonmentSentRef.current &&
      !state.leadId &&
      state.funnelSessionId
    ) {
      abandonmentSentRef.current = true
      trackEvent('funnel_abandoned', buildFunnelEventParams({
        sessionId: state.funnelSessionId,
        attribution: state.attribution,
        stage: visualStageForStep(state.step),
      }))
    }
  }
  window.addEventListener('pagehide', handlePageHide)
  return () => window.removeEventListener('pagehide', handlePageHide)
}, [
  state.leadId,
  state.funnelSessionId,
  state.attribution,
  state.step,
])
```

- [ ] **Step 6: Run analytics E2E**

```powershell
npx playwright test tests/e2e/funnel-four-stages.spec.ts --project=chromium
```

Expected: PASS without duplicate stage events.

- [ ] **Step 7: Version-control checkpoint**

If commits are authorized:

```powershell
git add components/funnel/FunnelContainer.tsx components/funnel/Step1Adres.tsx components/funnel/TechnicalScanModule.tsx components/funnel/Step6LeadCapture.tsx tests/e2e/funnel-four-stages.spec.ts
git commit -m "feat: measure funnel stages and lead quality"
```

---

### Task 8: Verify the full funnel regression set

**Files:**

- Modify: `CLAUDE.md`
- Modify: existing `tests/e2e/funnel-*.spec.ts` only where old visible six-step wording changed.

- [ ] **Step 1: Update old selectors without weakening assertions**

Replace assertions that depend on “Stap X van 6” with customer-stage labels. Keep assertions for:

- all underlying ROI controls;
- all three scan result shapes;
- skip/manual/photo paths;
- Step6 contact and consent validation;
- lead URL/report token;
- mobile overflow and PDF availability.

Do not delete tests merely because the UI hierarchy changed.

- [ ] **Step 2: Run the entire Chromium funnel suite**

```powershell
npx playwright test tests/e2e/funnel-deep.spec.ts tests/e2e/funnel-compleet.spec.ts tests/e2e/funnel-handshake.spec.ts tests/e2e/funnel-validatie.spec.ts tests/e2e/step6-validatie.spec.ts tests/e2e/funnel-four-stages.spec.ts --project=chromium
```

Expected: all pass.

- [ ] **Step 3: Run mobile regression**

```powershell
npx playwright test tests/e2e/funnel-four-stages.spec.ts tests/e2e/funnel-compleet.spec.ts --project=mobile-chrome
```

Expected: all pass with no horizontal overflow or covered sticky action.

- [ ] **Step 4: Run static and unit gates**

```powershell
git diff --check
npm run typecheck
npm run test:unit
npm run build
```

Expected: PASS.

- [ ] **Step 5: Update `CLAUDE.md`**

Document:

- internal steps 1–6 remain, visual stages map to `1,2,3,3,3,4`;
- storage key/version/TTL and URL priority;
- technical scans are optional and analytically distinct;
- funnel session and attribution columns;
- canonical GA4 event names and prohibited PII;
- dynamic boundaries for technical module and lead capture.

- [ ] **Step 6: Request code review**

Use `superpowers:requesting-code-review`. Check state loss, duplicate events under Strict Mode, URL precedence, keyboard focus, mobile safe area, and unchanged calculation semantics.

- [ ] **Step 7: Version-control checkpoint**

If commits are authorized:

```powershell
git add CLAUDE.md tests/e2e
git commit -m "test: cover the four-stage funnel"
```

---

## Phase acceptance

This plan is complete only when:

- customers see four stages while all existing technical data remains available;
- meterkast, placement, and inverter scans appear as one optional stage;
- every skip/completion path is measurable;
- explicit report/address URL context cannot be overwritten by localStorage;
- pSEO context overrides stale regional context on resume;
- a stable session ID is persisted with the lead;
- no full address, email, name, or phone is sent to analytics;
- first invalid field receives focus and errors are announced;
- all target controls meet 44×44px and mobile inputs remain 16px;
- no funnel stage has horizontal overflow at 360px;
- full Chromium and focused mobile suites pass.

