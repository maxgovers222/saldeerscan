# Unified Report Chain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce one normalized, trustworthy report model and render it consistently on the web, in email, in the PDF, and in B2B payloads.

**Architecture:** Build the report from the server-derived lead record through a pure shared model. Return that model from lead submission and tokenized report reads, then pass it—not the mutable funnel state—to web/PDF components. Store and expose email delivery status so the UI never claims a message was sent when only the lead was saved. Use CSS-responsive server-stable markup instead of runtime viewport detection.

**Tech Stack:** TypeScript pure model, Next.js route handlers, React 19, `@react-pdf/renderer` v4 in a dynamic client chunk, Resend, Supabase, Playwright.

**Depends on:** Plans 1–3 completed and green.

---

## File map

Create:

- `lib/report-model.ts` — versioned normalized model, deterministic calculations, labels, and source adapter.
- `lib/report-email.ts` — escaped HTML renderer from the normalized model.
- `components/report/SubmissionStatus.tsx` — truthful request/email state.
- `components/report/ReportShell.tsx` — responsive report frame.
- `components/report/ReportSummary.tsx` — primary impact and two metrics.
- `components/report/ReportMetric.tsx` — numerical display primitive.
- `components/report/ReportSection.tsx` — desktop/full section.
- `components/report/ReportAccordion.tsx` — native mobile disclosure.
- `components/report/ReportAlert.tsx` — semantic owner/net alerts.
- `components/report/ReportImpact.tsx` — loss and saldering timeline from the model.
- `components/report/ReportRecommendation.tsx` — scenario-aware configuration and economics.
- `components/report/ReportHomeAndGrid.tsx` — woning and net context.
- `components/report/ReportTechnical.tsx` — available/skipped technical analyses.
- `tests/fixtures/report.ts` — complete deterministic source/model fixtures.
- `tests/unit/report-model.spec.ts` — existing/no-panels and corrupt-data calculations.
- `tests/unit/report-email.spec.ts` — parity and escaping.
- `tests/unit/report-pdf.spec.tsx` — real PDF buffer smoke test.
- `tests/e2e/report-responsive.spec.ts` — no hydration layout switch, mobile disclosures, desktop grid, PDF open/fallback.
- `tests/e2e/fixtures/report-state.ts` — complete v2 localStorage seeding helper for report E2E.
- `supabase/migrations/<generated>_report_email_delivery.sql` — persisted delivery outcome.

Modify:

- `components/funnel/types.ts` — `reportModel`; delivery status lives inside that model.
- `components/funnel/FunnelContainer.tsx` — hydrate/set the server report directly.
- `components/funnel/Step6LeadCapture.tsx` — consume API `report` and truthful email state.
- `components/funnel/ResultsDashboard.tsx` — render the normalized model; remove viewport hook and duplicate calculations.
- `components/funnel/SaldeerRapportPDF.tsx` — render the normalized model.
- `components/funnel/PDFDownloadButton.tsx` — accept `NormalizedReport`.
- `components/funnel/PDFDownloadButtonInner.tsx` — accept model, track success/failure.
- `app/api/leads/route.ts` — render email from the model, persist delivery status, return model.
- `app/api/leads/[id]/route.ts` — select email status and return model while preserving token security.
- `lib/roi.ts` — export the existing 10 kWh reference-battery capacity as a named constant without changing formulas.
- `lib/webhook-delivery.ts` — source commercial values from the normalized model.
- `tests/unit/webhook-delivery.spec.ts` — report payload parity.
- `tests/e2e/leadid-hydrate.spec.ts` — hydrate the `report` contract.
- `tests/e2e/funnel-deep.spec.ts` — scope assertions to responsive regions.
- `tests/fixtures/funnel-state.ts` — add the new `reportModel` state default.
- `CLAUDE.md` — document report version and delivery semantics.

Do not change:

- lead report HMAC algorithm or token requirement;
- GDPR consent gate;
- ROI/health formulas;
- URL `/check?leadId=...&token=...`;
- synchronous popup opening plus direct-download fallback.

---

### Task 1: Define the normalized report model

**Files:**

- Create: `lib/report-model.ts`
- Create: `tests/fixtures/report.ts`
- Create: `tests/unit/report-model.spec.ts`
- Modify: `lib/roi.ts`

- [ ] **Step 1: Create complete source fixtures**

`tests/fixtures/report.ts`:

```ts
import {
  buildReportModel,
  type ReportSource,
} from '@/lib/report-model'

export const reportSourceNoPanels = {
  leadId: '11111111-1111-4111-8111-111111111111',
  createdAt: '2026-07-10T10:00:00.000Z',
  adres: 'Prinsengracht 263, Amsterdam',
  wijk: 'Jordaan',
  stad: 'Amsterdam',
  bagData: {
    bouwjaar: 1940,
    oppervlakte: 110,
    woningtype: 'Woning',
    postcode: '1016GV',
    huisnummer: 263,
    dakOppervlakte: 55,
    lat: 52.3752,
    lon: 4.8839,
  },
  netcongestie: {
    status: 'ROOD',
    netbeheerder: 'Liander',
    uitleg: 'Het stroomnet is vol.',
    terugleveringBeperkt: true,
  },
  healthScore: {
    score: 63,
    label: 'Goed',
    kleur: 'geel',
    breakdown: {
      bouwjaar: 10,
      energielabel: 20,
      dakpotentieel: 20,
      netcongestie: 5,
    },
    aanbevelingen: ['Onderzoek een thuisbatterij'],
  },
  roiResult: {
    geschatVerbruikKwh: 3600,
    aantalPanelen: 10,
    productieKwh: 4550,
    eigenGebruikPct: 30,
    scenarioNu: {
      naam: 'Nu installeren',
      beschrijving: 'Zonnepanelen in 2026',
      besparingJaarEur: 820,
      investeringEur: 3500,
      terugverdientijdJaar: 4.3,
    },
    scenarioMetBatterij: {
      naam: 'Panelen + batterij',
      beschrijving: 'Zonnepanelen en thuisbatterij',
      besparingJaarEur: 1180,
      investeringEur: 7500,
      terugverdientijdJaar: 6.4,
    },
    scenarioWachten: {
      naam: 'Wachten',
      beschrijving: 'Na einde saldering',
      besparingJaarEur: 420,
      investeringEur: 3500,
      terugverdientijdJaar: 8.3,
    },
    shockEffect2027: {
      jaarlijksVerlies: 400,
      cumulatiefVerlies5Jaar: 2000,
      maandelijksVerlies: 33,
      boodschap: 'Zonder actie verliest u €400 per jaar.',
    },
    aanbeveling: 'beide',
    aanbevelingTekst: 'Panelen en een batterij verdienen nader onderzoek.',
    isdeSchatting: {
      bedragEur: 2500,
      apparaatType: 'Thuisbatterij',
      vermogenKwp: 4,
    },
  },
  qualification: {
    isEigenaar: true,
    heeftPanelen: false,
    huidigePanelenAantal: null,
  },
  technical: {
    meterkast: null,
    plaatsing: null,
    omvormer: null,
  },
  delivery: {
    emailStatus: 'sent',
  },
} satisfies ReportSource

export const reportSourceExistingPanels = {
  ...reportSourceNoPanels,
  leadId: '22222222-2222-4222-8222-222222222222',
  qualification: {
    isEigenaar: true,
    heeftPanelen: true,
    huidigePanelenAantal: 10,
  },
} satisfies ReportSource

export const expectedReportFixture = buildReportModel(reportSourceNoPanels)!
export const expectedExistingPanelsReportFixture =
  buildReportModel(reportSourceExistingPanels)!
```

- [ ] **Step 2: Write failing model tests**

```ts
import { expect, test } from '@playwright/test'
import { buildReportModel } from '@/lib/report-model'
import {
  reportSourceExistingPanels,
  reportSourceNoPanels,
} from '../fixtures/report'

test('builds the new-installation report once', () => {
  const report = buildReportModel(reportSourceNoPanels)!
  expect(report.version).toBe(1)
  expect(report.impact.annualLossEur).toBe(400)
  expect(report.summary.annualSavingEur).toBe(820)
  expect(report.recommendation.panelCount).toBe(10)
  expect(report.recommendation.batteryCapacityKwh).toBe(10)
  expect(report.scenarios.withBattery.besparingJaarEur).toBe(1180)
  expect(report.salderingTimeline).toEqual([
    { year: 2024, compensationPct: 100 },
    { year: 2025, compensationPct: 64 },
    { year: 2026, compensationPct: 28 },
    { year: 2027, compensationPct: 0 },
  ])
  expect(report.recommendation.primarySolution).toBe('Zonnepanelen en thuisbatterij')
  expect(report.delivery.emailStatus).toBe('sent')
})

test('uses battery delta for a home with existing panels', () => {
  const report = buildReportModel(reportSourceExistingPanels)!
  expect(report.summary.annualSavingEur).toBe(1180)
  expect(report.recommendation.investmentEur).toBe(4000)
  expect(report.recommendation.extraAnnualSavingEur).toBe(360)
  expect(report.recommendation.paybackYears).toBe(11.1)
  expect(report.recommendation.primarySolution).toBe('Thuisbatterij en slim verbruik')
})

test('returns null for corrupt or incomplete ROI data', () => {
  expect(buildReportModel({
    ...reportSourceNoPanels,
    roiResult: { forged: true },
  })).toBeNull()
})
```

- [ ] **Step 3: Run and confirm the missing-module failure**

```powershell
npm run test:unit -- tests/unit/report-model.spec.ts
```

Expected: FAIL because `lib/report-model.ts` is missing.

- [ ] **Step 4: Implement the complete public model**

```ts
import { parseStoredRoi } from '@/lib/roi-result-guard'
import {
  REFERENCE_BATTERY_CAPACITY_KWH,
  SALDERING_SCHEMA,
  type ROIScenario,
} from '@/lib/roi'
import type {
  HealthScoreResult,
  MeterkastAnalyse,
  OmvormerAnalyse,
  PlaatsingsAnalyse,
} from '@/components/funnel/types'

export const REPORT_MODEL_VERSION = 1 as const
export type ReportEmailStatus = 'pending' | 'sent' | 'failed' | 'not_configured'

export interface ReportSource {
  leadId: string | null
  createdAt: string
  adres: string
  wijk: string | null
  stad: string | null
  bagData: {
    bouwjaar: number | null
    oppervlakte: number | null
    woningtype: string | null
    postcode: string | null
    huisnummer: number | null
    dakOppervlakte: number | null
    lat?: number
    lon?: number
  } | null
  netcongestie: {
    status: 'ROOD' | 'ORANJE' | 'GROEN'
    netbeheerder?: string
    uitleg?: string
    terugleveringBeperkt?: boolean
  } | null
  healthScore: HealthScoreResult | null
  roiResult: unknown
  qualification: {
    isEigenaar: boolean | null
    heeftPanelen: boolean | null
    huidigePanelenAantal: number | null
  }
  technical: {
    meterkast: MeterkastAnalyse | null
    plaatsing: PlaatsingsAnalyse | null
    omvormer: OmvormerAnalyse | null
  }
  delivery: {
    emailStatus: ReportEmailStatus
  }
}

export interface NormalizedReport {
  version: typeof REPORT_MODEL_VERSION
  leadId: string | null
  generatedAt: string
  home: {
    address: string
    wijk: string | null
    stad: string | null
    postcode: string | null
    housingType: string | null
    buildYear: number | null
    surfaceM2: number | null
    roofSurfaceM2: number | null
  }
  summary: {
    healthScore: number | null
    healthLabel: string | null
    annualSavingEur: number
    paybackYears: number | null
  }
  impact: {
    annualLossEur: number
    monthlyLossEur: number
    fiveYearLossEur: number
    explanation: string
  }
  scenarios: {
    panelsNow: ROIScenario
    withBattery: ROIScenario
    waitUntil2027: ROIScenario
  }
  salderingTimeline: Array<{
    year: number
    compensationPct: number
  }>
  recommendation: {
    primarySolution: 'Zonnepanelen' | 'Zonnepanelen en thuisbatterij' | 'Thuisbatterij en slim verbruik'
    panelCount: number
    existingPanelCount: number | null
    productionKwh: number
    consumptionKwh: number
    ownUsePct: number
    batteryCapacityKwh: number | null
    investmentEur: number
    extraAnnualSavingEur: number | null
    paybackYears: number | null
    explanation: string
    isdeAmountEur: number
  }
  grid: {
    status: 'ROOD' | 'ORANJE' | 'GROEN' | null
    operator: string | null
    explanation: string | null
  }
  qualification: ReportSource['qualification']
  technical: ReportSource['technical']
  recommendations: string[]
  delivery: {
    emailStatus: ReportEmailStatus
  }
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10
}

export function buildReportModel(
  source: ReportSource,
): NormalizedReport | null {
  const roi = parseStoredRoi(source.roiResult)
  if (!roi) return null

  const existing = source.qualification.heeftPanelen === true
  const batteryInvestment = Math.max(
    roi.scenarioMetBatterij.investeringEur - roi.scenarioNu.investeringEur,
    0,
  )
  const batteryExtraSaving = Math.max(
    roi.scenarioMetBatterij.besparingJaarEur - roi.scenarioNu.besparingJaarEur,
    0,
  )
  const annualSaving = existing
    ? roi.scenarioMetBatterij.besparingJaarEur
    : roi.scenarioNu.besparingJaarEur
  const investment = existing
    ? batteryInvestment
    : roi.scenarioNu.investeringEur
  const payback = existing
    ? batteryExtraSaving > 0
      ? roundOne(batteryInvestment / batteryExtraSaving)
      : null
    : Number.isFinite(roi.scenarioNu.terugverdientijdJaar)
      ? roi.scenarioNu.terugverdientijdJaar
      : null

  return {
    version: REPORT_MODEL_VERSION,
    leadId: source.leadId,
    generatedAt: source.createdAt,
    home: {
      address: source.adres,
      wijk: source.wijk,
      stad: source.stad,
      postcode: source.bagData?.postcode ?? null,
      housingType: source.bagData?.woningtype ?? null,
      buildYear: source.bagData?.bouwjaar ?? null,
      surfaceM2: source.bagData?.oppervlakte ?? null,
      roofSurfaceM2: source.bagData?.dakOppervlakte ?? null,
    },
    summary: {
      healthScore: source.healthScore?.score ?? null,
      healthLabel: source.healthScore?.label ?? null,
      annualSavingEur: annualSaving,
      paybackYears: payback,
    },
    impact: {
      annualLossEur: roi.shockEffect2027.jaarlijksVerlies,
      monthlyLossEur: roi.shockEffect2027.maandelijksVerlies,
      fiveYearLossEur: roi.shockEffect2027.cumulatiefVerlies5Jaar,
      explanation: roi.shockEffect2027.boodschap,
    },
    scenarios: {
      panelsNow: { ...roi.scenarioNu },
      withBattery: { ...roi.scenarioMetBatterij },
      waitUntil2027: { ...roi.scenarioWachten },
    },
    salderingTimeline: [
      { year: 2024, compensationPct: 100 },
      ...Object.entries(SALDERING_SCHEMA)
        .map(([year, factor]) => ({
          year: Number(year),
          compensationPct: Math.round(factor * 100),
        }))
        .sort((a, b) => a.year - b.year),
    ],
    recommendation: {
      primarySolution: existing
        ? 'Thuisbatterij en slim verbruik'
        : roi.aanbeveling === 'beide'
          ? 'Zonnepanelen en thuisbatterij'
          : 'Zonnepanelen',
      panelCount: roi.aantalPanelen,
      existingPanelCount: source.qualification.huidigePanelenAantal,
      productionKwh: roi.productieKwh,
      consumptionKwh: roi.geschatVerbruikKwh,
      ownUsePct: roi.eigenGebruikPct,
      batteryCapacityKwh:
        existing || roi.aanbeveling === 'beide'
          ? REFERENCE_BATTERY_CAPACITY_KWH
          : null,
      investmentEur: investment,
      extraAnnualSavingEur: existing ? batteryExtraSaving : null,
      paybackYears: payback,
      explanation: existing
        ? 'Behoud uw huidige panelen en laat opslag en slim verbruik beoordelen.'
        : roi.aanbevelingTekst,
      isdeAmountEur: roi.isdeSchatting.bedragEur,
    },
    grid: {
      status: source.netcongestie?.status ?? null,
      operator: source.netcongestie?.netbeheerder ?? null,
      explanation: source.netcongestie?.uitleg ?? null,
    },
    qualification: source.qualification,
    technical: source.technical,
    recommendations: source.healthScore?.aanbevelingen ?? [],
    delivery: source.delivery,
  }
}
```

In `lib/roi.ts`, name the already hard-coded scenario assumption:

```ts
export const REFERENCE_BATTERY_CAPACITY_KWH = 10
```

Keep the ROI arithmetic and €4,000 battery investment unchanged; this extraction only prevents web/PDF copy from hard-coding a separate capacity.

- [ ] **Step 5: Run model tests**

```powershell
npm run test:unit -- tests/unit/report-model.spec.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Version-control checkpoint**

If commits are authorized:

```powershell
git add lib/report-model.ts lib/roi.ts tests/fixtures/report.ts tests/unit/report-model.spec.ts
git commit -m "feat: normalize report calculations"
```

---

### Task 2: Persist truthful email delivery state

**Files:**

- Create with Supabase CLI: `supabase/migrations/<generated>_report_email_delivery.sql`
- Modify: `app/api/leads/route.ts`
- Modify: `app/api/leads/[id]/route.ts`
- Modify: `lib/report-model.ts`
- Modify: `components/funnel/types.ts`
- Modify: `components/funnel/FunnelContainer.tsx`
- Test: `tests/e2e/leadid-hydrate.spec.ts`

- [ ] **Step 1: Add delivery columns**

Run `npx supabase migration new report_email_delivery` and put the following SQL in the generated file; do not hand-invent its timestamp.

```sql
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS report_email_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS report_email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS report_email_error TEXT;

ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_report_email_status_check;

ALTER TABLE leads
  ADD CONSTRAINT leads_report_email_status_check
  CHECK (
    report_email_status IN ('pending', 'sent', 'failed', 'not_configured')
  );

CREATE INDEX IF NOT EXISTS leads_report_email_failed_idx
  ON leads (created_at DESC)
  WHERE report_email_status = 'failed';
```

- [ ] **Step 2: Add a stored-lead adapter**

In `lib/report-model.ts`, add:

```ts
export function reportSourceFromStoredLead(
  lead: Record<string, unknown>,
): ReportSource {
  const score = typeof lead.health_score === 'number' ? lead.health_score : null
  const rawNetStatus = String(lead.netcongestie_status ?? '')
  const netStatus = (
    ['ROOD', 'ORANJE', 'GROEN'].includes(rawNetStatus)
      ? rawNetStatus
      : null
  ) as 'ROOD' | 'ORANJE' | 'GROEN' | null
  const healthLabel = score === null
    ? null
    : score >= 75 ? 'Uitstekend'
    : score >= 55 ? 'Goed'
    : score >= 35 ? 'Matig'
    : 'Slecht'
  return {
    leadId: typeof lead.id === 'string' ? lead.id : null,
    createdAt: typeof lead.created_at === 'string'
      ? lead.created_at
      : new Date(0).toISOString(),
    adres: typeof lead.adres === 'string' ? lead.adres : '',
    wijk: typeof lead.wijk === 'string' ? lead.wijk : null,
    stad: typeof lead.stad === 'string' ? lead.stad : null,
    bagData: (lead.bag_data ?? null) as ReportSource['bagData'],
    netcongestie: netStatus
      ? {
          status: netStatus,
          netbeheerder: typeof lead.netbeheerder === 'string' ? lead.netbeheerder : '',
          uitleg: '',
          terugleveringBeperkt: netStatus !== 'GROEN',
        }
      : null,
    healthScore: score === null || healthLabel === null
      ? null
      : {
          score,
          label: healthLabel,
          kleur: score >= 75 ? 'groen' : score >= 55 ? 'geel' : score >= 35 ? 'oranje' : 'rood',
          breakdown: { bouwjaar: 0, energielabel: 0, dakpotentieel: 0, netcongestie: 0 },
          aanbevelingen: [],
        },
    roiResult: lead.roi_berekening,
    qualification: {
      isEigenaar: typeof lead.is_eigenaar === 'boolean' ? lead.is_eigenaar : null,
      heeftPanelen: typeof lead.heeft_panelen === 'boolean' ? lead.heeft_panelen : null,
      huidigePanelenAantal: typeof lead.huidige_panelen_aantal === 'number'
        ? lead.huidige_panelen_aantal
        : null,
    },
    technical: {
      meterkast: (lead.meterkast_analyse ?? null) as ReportSource['technical']['meterkast'],
      plaatsing: (lead.plaatsing_analyse ?? null) as ReportSource['technical']['plaatsing'],
      omvormer: (lead.omvormer_analyse ?? null) as ReportSource['technical']['omvormer'],
    },
    delivery: {
      emailStatus: (
        ['pending', 'sent', 'failed', 'not_configured']
          .includes(String(lead.report_email_status))
          ? lead.report_email_status
          : 'pending'
      ) as ReportEmailStatus,
    },
  }
}
```

- [ ] **Step 3: Track actual Resend outcome**

In the lead route, set the inserted status:

```ts
report_email_status: resend ? 'pending' : 'not_configured',
```

After the send attempt, update:

```ts
const emailUpdate = emailStatus === 'sent'
  ? {
      report_email_status: 'sent',
      report_email_sent_at: new Date().toISOString(),
      report_email_error: null,
    }
  : {
      report_email_status: emailStatus,
      report_email_sent_at: null,
      report_email_error: emailError?.slice(0, 1000) ?? null,
    }

await supabaseAdmin.from('leads').update(emailUpdate).eq('id', lead.id)
```

Select the full inserted lead or reload it after the update, build:

```ts
const report = buildReportModel(reportSourceFromStoredLead(storedLead))
```

If this returns `null`, capture the lead ID in Sentry/logging and return `report_generation_failed` rather than sending inconsistent output. Otherwise return `report` with the compatibility `emailStatus` field set to `report.delivery.emailStatus`.

- [ ] **Step 4: Return the same model from tokenized GET**

Add the delivery columns and `created_at` to the current select. Return:

```ts
const reportSource = reportSourceFromStoredLead(lead)
const report = buildReportModel(reportSource)
if (!report) {
  return NextResponse.json(
    { error: 'Rapportgegevens zijn onvolledig' },
    { status: 422 },
  )
}
return NextResponse.json({
  report,
  leadId: lead.id,
  adres: lead.adres ?? '',
  wijk: lead.wijk ?? '',
  stad: lead.stad ?? '',
  bagData: lead.bag_data ?? null,
  netcongestie: report.grid.status
    ? {
        status: report.grid.status,
        netbeheerder: report.grid.operator ?? '',
        uitleg: report.grid.explanation ?? '',
        terugleveringBeperkt: report.grid.status !== 'GROEN',
      }
    : null,
  healthScore: report.summary.healthScore === null
    ? null
    : reportSource.healthScore,
  roiResult: parseStoredRoi(lead.roi_berekening),
  meterkastAnalyse: report.technical.meterkast,
  plaatsingsAnalyse: report.technical.plaatsing,
  omvormerAnalyse: report.technical.omvormer,
  isEigenaar: report.qualification.isEigenaar,
  heeftPanelen: report.qualification.heeftPanelen,
  huidigePanelenAantal: report.qualification.huidigePanelenAantal,
  dakrichting: lead.dakrichting ?? null,
  verbruik_bron: lead.verbruik_bron ?? 'schatting',
  huishouden_grootte: lead.huishouden_grootte ?? null,
})
```

Token verification and rate limiting stay before the database read.

- [ ] **Step 5: Store the model in funnel state**

Add this member to `FunnelState`:

```ts
reportModel: NormalizedReport | null
```

and this action:

```ts
| { type: 'SET_REPORT_MODEL'; report: NormalizedReport }
```

Initialize and legacy-migrate `reportModel` to `null`. On POST 201 and GET hydration, dispatch the model. Read delivery state only from `reportModel.delivery.emailStatus`. Keep the ROI legacy hydration fallback until all report links return `report`.

Add `reportModel: null` to `makeFunnelStateFixture()` in `tests/fixtures/funnel-state.ts` so every E2E seed remains complete after the state type changes.

After a tokenized GET successfully dispatches a valid model, emit:

```ts
trackEvent('report_reopened', {
  report_version: report.version,
  email_status: report.delivery.emailStatus,
})
```

Do not include the lead ID, token, address, or contact fields.

- [ ] **Step 6: Update lead hydration E2E**

Change the mock body to:

```ts
body: JSON.stringify({
  leadId: MOCK_LEAD_ID,
  report: expectedReportFixture,
})
```

Assert:

```ts
await expect(page.getByTestId('report-root')).toBeVisible()
await expect(page.getByTestId('report-annual-loss')).toContainText('400')
```

Install a test-only gtag capture before navigation and assert one `report_reopened` event with `report_version: 1`; assert that neither its keys nor serialized values contain the lead ID or token.

- [ ] **Step 7: Run migration/static/hydration verification**

```powershell
npx supabase db lint
npm run typecheck
npx playwright test tests/e2e/leadid-hydrate.spec.ts --project=chromium
```

Expected: PASS. If Supabase is not linked, report the DB lint limitation separately.

- [ ] **Step 8: Version-control checkpoint**

If commits are authorized:

```powershell
git add supabase/migrations/*_report_email_delivery.sql lib/report-model.ts app/api/leads/route.ts "app/api/leads/[id]/route.ts" components/funnel/types.ts components/funnel/FunnelContainer.tsx tests/fixtures/funnel-state.ts tests/e2e/leadid-hydrate.spec.ts
git commit -m "feat: expose truthful report delivery status"
```

---

### Task 3: Render one stable responsive web report

**Files:**

- Create: `components/report/SubmissionStatus.tsx`
- Create: `components/report/ReportShell.tsx`
- Create: `components/report/ReportSummary.tsx`
- Create: `components/report/ReportMetric.tsx`
- Create: `components/report/ReportSection.tsx`
- Create: `components/report/ReportAccordion.tsx`
- Create: `components/report/ReportAlert.tsx`
- Create: `components/report/ReportImpact.tsx`
- Create: `components/report/ReportRecommendation.tsx`
- Create: `components/report/ReportHomeAndGrid.tsx`
- Create: `components/report/ReportTechnical.tsx`
- Modify: `components/funnel/ResultsDashboard.tsx`
- Modify: `components/funnel/Step6LeadCapture.tsx`
- Create: `tests/e2e/report-responsive.spec.ts`

- [ ] **Step 1: Write failing responsive report tests**

```ts
import { expect, test } from '@playwright/test'
import {
  expectedExistingPanelsReportFixture,
  expectedReportFixture,
} from '../fixtures/report'
import { seedReportState } from './fixtures/report-state'

test('mobile shows the key result, metrics, disclosures and PDF action', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedReportState(page, expectedReportFixture)
  await page.goto('/check')
  await page.getByRole('button', { name: 'Doorgaan' }).click()

  await expect(page.getByTestId('report-annual-loss')).toBeVisible()
  await expect(page.getByTestId('report-supporting-metrics')).toBeVisible()
  await expect(page.getByRole('group', { name: 'Uw aanbevolen oplossing' })).toBeVisible()
  await expect(page.getByRole('button', { name: /PDF-rapport/ })).toBeVisible()
  await expect(page.getByTestId('report-desktop-grid')).toBeHidden()
})

test('desktop is full width without a mobile-to-desktop hydration switch', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await seedReportState(page, expectedReportFixture)
  await page.goto('/check')
  await page.getByRole('button', { name: 'Doorgaan' }).click()
  await expect(page.getByTestId('report-desktop-grid')).toBeVisible()
  await expect(page.getByTestId('report-mobile-details')).toBeHidden()
  const before = await page.getByTestId('report-root').boundingBox()
  await page.waitForTimeout(500)
  const after = await page.getByTestId('report-root').boundingBox()
  expect(after?.width).toBe(before?.width)
})

test('email failure never claims the report was sent', async ({ page }) => {
  await seedReportState(page, {
    ...expectedReportFixture,
    delivery: { emailStatus: 'failed' },
  })
  await page.goto('/check')
  await page.getByRole('button', { name: 'Doorgaan' }).click()
  await expect(page.getByText('Aanvraag ontvangen')).toBeVisible()
  await expect(page.getByText(/e-mail kon niet worden verstuurd/i)).toBeVisible()
  await expect(page.getByText(/verzonden naar uw e-mail/i)).toHaveCount(0)
})

test('existing panels show an upgrade recommendation on web', async ({ page }) => {
  await seedReportState(page, expectedExistingPanelsReportFixture)
  await page.goto('/check')
  await page.getByRole('button', { name: 'Doorgaan' }).click()
  await expect(page.getByText('Thuisbatterij en slim verbruik')).toBeVisible()
  await expect(page.getByText(/10 bestaande panelen/i)).toBeVisible()
  await expect(page.getByText(/€360.*extra/i)).toBeVisible()
})
```

Create `tests/e2e/fixtures/report-state.ts`:

```ts
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
```

Import `expectedReportFixture` from `tests/fixtures/report.ts`; do not duplicate incomplete ad-hoc report state per test.

- [ ] **Step 2: Implement truthful status**

```tsx
import type { ReportEmailStatus } from '@/lib/report-model'

export function SubmissionStatus({
  status,
}: {
  status: ReportEmailStatus
}) {
  const message = status === 'sent'
    ? {
        title: 'Aanvraag ontvangen',
        text: 'Uw rapport is verzonden naar uw e-mail.',
        tone: 'success',
      }
    : status === 'failed'
      ? {
          title: 'Aanvraag ontvangen',
          text: 'De e-mail kon niet worden verstuurd. U kunt het volledige rapport hieronder downloaden.',
          tone: 'warning',
        }
      : status === 'not_configured'
        ? {
            title: 'Aanvraag ontvangen',
            text: 'E-mail is in deze omgeving niet beschikbaar. Download het rapport hieronder.',
            tone: 'warning',
          }
        : {
            title: 'Aanvraag ontvangen',
            text: 'De e-mailstatus wordt gecontroleerd. Uw rapport staat hieronder klaar.',
            tone: 'neutral',
          }
  return (
    <div role="status" aria-live="polite" data-tone={message.tone}>
      <p className="font-semibold">{message.title}</p>
      <p className="mt-1 text-sm">{message.text}</p>
    </div>
  )
}
```

- [ ] **Step 3: Implement native mobile disclosures**

```tsx
import type { ReactNode } from 'react'

export function ReportAccordion({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <details className="group rounded-2xl border border-ink/10 bg-paper">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 font-semibold text-ink">
        {title}
        <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5 transition group-open:rotate-45">
          <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </summary>
      <div className="border-t border-ink/10 px-4 py-4 text-sm leading-6 text-ink-muted">
        {children}
      </div>
    </details>
  )
}
```

Use `role="group" aria-label={title}` on `<details>` so the E2E role query is stable.

- [ ] **Step 4: Replace runtime viewport detection**

Remove `useIsDesktopViewport`, `window.matchMedia`, and viewport state from `ResultsDashboard.tsx`. The component accepts:

```ts
export function ResultsDashboard({
  report,
}: {
  report: NormalizedReport
})
```

Render one shared summary followed by:

```tsx
<div id="report-mobile-details" data-testid="report-mobile-details" className="space-y-3 md:hidden">
  <ReportAccordion title="Uw aanbevolen oplossing">
    <ReportRecommendation report={report} />
  </ReportAccordion>
  <ReportAccordion title="Waarom dit advies?">
    <ReportImpact report={report} />
  </ReportAccordion>
  <ReportAccordion title="Technische details">
    <ReportHomeAndGrid report={report} />
    <ReportTechnical report={report} />
  </ReportAccordion>
</div>

<div data-testid="report-desktop-grid" className="hidden gap-5 md:grid md:grid-cols-2">
  <ReportSection title="Impact vanaf 2027">
    <ReportImpact report={report} />
  </ReportSection>
  <ReportSection title="Geadviseerde configuratie">
    <ReportRecommendation report={report} />
  </ReportSection>
  <ReportSection title="Woning en stroomnet">
    <ReportHomeAndGrid report={report} />
  </ReportSection>
  <ReportSection title="Technisch dossier">
    <ReportTechnical report={report} />
  </ReportSection>
</div>
```

Each of the four content components accepts exactly `{ report: NormalizedReport }`, is presentation-only, and is shared by mobile and desktop wrappers. `ReportTechnical` labels missing scans “Niet toegevoegd” rather than inventing a result. This duplicates only wrappers, not report content or calculations.

Replace the current hard-coded saldering percentages and “10 kWh” label with `report.salderingTimeline` and `report.recommendation.batteryCapacityKwh`. Render scenario comparisons from `report.scenarios`; never parse `roiResult` or recalculate battery deltas inside a report component. Branch existing-panel copy from `report.qualification.heeftPanelen` and use `extraAnnualSavingEur` for the incremental-upgrade explanation.

- [ ] **Step 5: Render the report after submit and hydration**

In `FunnelContainer` and `Step6LeadCapture`, render only when `state.reportModel` is valid:

```tsx
<ResultsDashboard report={state.reportModel} />
```

Use `SubmissionStatus status={state.reportModel.delivery.emailStatus}` once, not an unconditional “bevestiging verstuurd” message.

- [ ] **Step 6: Run responsive tests**

```powershell
npx playwright test tests/e2e/report-responsive.spec.ts tests/e2e/leadid-hydrate.spec.ts --project=chromium
npm run typecheck
```

Expected: PASS with no hydration warning in browser console.

- [ ] **Step 7: Version-control checkpoint**

If commits are authorized:

```powershell
git add components/report components/funnel/ResultsDashboard.tsx components/funnel/Step6LeadCapture.tsx components/funnel/FunnelContainer.tsx tests/e2e/report-responsive.spec.ts tests/e2e/fixtures/report-state.ts
git commit -m "feat: render one responsive report model"
```

---

### Task 4: Render email from the same report model

**Files:**

- Create: `lib/report-email.ts`
- Create: `tests/unit/report-email.spec.ts`
- Modify: `app/api/leads/route.ts`

- [ ] **Step 1: Write failing parity and escaping tests**

```ts
import { expect, test } from '@playwright/test'
import { renderReportEmail } from '@/lib/report-email'
import { buildReportModel } from '@/lib/report-model'
import {
  reportSourceExistingPanels,
  reportSourceNoPanels,
} from '../fixtures/report'

test('email contains normalized report values and report URL', () => {
  const report = buildReportModel(reportSourceNoPanels)!
  const html = renderReportEmail({
    report,
    firstName: 'Jan',
    reportUrl: 'https://saldeerscan.nl/check?leadId=1&token=abc',
  })
  expect(html).toContain('€400')
  expect(html).toContain('€820')
  expect(html).toContain('10 panelen')
  expect(html).toContain('10 kWh batterij')
  expect(html).toContain('https://saldeerscan.nl/check?leadId=1&amp;token=abc')
})

test('email describes existing panels as an upgrade, not a new installation', () => {
  const report = buildReportModel(reportSourceExistingPanels)!
  const html = renderReportEmail({
    report,
    firstName: 'Jan',
    reportUrl: 'https://saldeerscan.nl/check',
  })
  expect(html).toContain('10 bestaande panelen')
  expect(html).toContain('10 kWh batterij')
  expect(html).toContain('€360')
})

test('email escapes personal and report text', () => {
  const report = buildReportModel({
    ...reportSourceNoPanels,
    adres: '<img src=x onerror=alert(1)>',
  })!
  const html = renderReportEmail({
    report,
    firstName: '<script>',
    reportUrl: 'https://saldeerscan.nl/check',
  })
  expect(html).not.toContain('<script>')
  expect(html).not.toContain('<img')
  expect(html).toContain('&lt;script&gt;')
  expect(html).toContain('&lt;img')
})
```

- [ ] **Step 2: Implement an escaped renderer**

```ts
import type { NormalizedReport } from '@/lib/report-model'

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function euro(value: number): string {
  return `€${Math.round(value).toLocaleString('nl-NL')}`
}

export function renderReportEmail(input: {
  report: NormalizedReport
  firstName: string
  reportUrl: string
}): string {
  const { report } = input
  const firstName = escapeHtml(input.firstName)
  const address = escapeHtml(report.home.address)
  const reportUrl = escapeHtml(input.reportUrl)
  const battery = report.recommendation.batteryCapacityKwh
  const configuration = report.qualification.heeftPanelen
    ? `${report.recommendation.existingPanelCount ?? 'Onbekend aantal'} bestaande panelen`
      + (battery ? ` · ${battery} kWh batterij` : '')
    : `${report.recommendation.panelCount} panelen`
      + (battery ? ` · ${battery} kWh batterij` : '')
  const upgradeSaving = report.recommendation.extraAnnualSavingEur
  return `<!doctype html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Uw SaldeerScan rapport</title>
</head>
<body style="margin:0;background:#f3f7f5;color:#10231d;font-family:Arial,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr><td align="center" style="padding:24px 12px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fbfdfc;border:1px solid #d9e4df;border-radius:18px;overflow:hidden">
        <tr><td style="background:#06130f;padding:28px 32px;color:white">
          <strong style="font-size:20px">SaldeerScan.nl</strong>
          <p style="margin:8px 0 0;color:#a9bbb4;font-size:13px">Persoonlijk 2027-rapport</p>
        </td></tr>
        <tr><td style="padding:32px">
          <p style="margin:0 0 12px;font-size:18px;font-weight:700">Beste ${firstName},</p>
          <p style="margin:0 0 24px;color:#5a6d66;line-height:1.65">Uw rapport voor <strong>${address}</strong> is opgesteld.</p>
          <div style="background:#fff7e6;border:1px solid #ffcf78;border-radius:14px;padding:20px;margin-bottom:20px">
            <small style="color:#7a5510">Mogelijk verlies vanaf 2027</small>
            <div style="font-size:30px;font-weight:800;color:#9f2f2f;margin-top:6px">−${euro(report.impact.annualLossEur)}/jaar</div>
          </div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px">
            <tr>
              <td style="padding:12px;border-bottom:1px solid #e3ebe7">Mogelijke besparing</td>
              <td align="right" style="padding:12px;border-bottom:1px solid #e3ebe7;font-weight:700">${euro(report.summary.annualSavingEur)}/jaar</td>
            </tr>
            <tr>
              <td style="padding:12px;border-bottom:1px solid #e3ebe7">Advies</td>
              <td align="right" style="padding:12px;border-bottom:1px solid #e3ebe7;font-weight:700">${escapeHtml(report.recommendation.primarySolution)}</td>
            </tr>
            <tr>
              <td style="padding:12px">Configuratie</td>
              <td align="right" style="padding:12px;font-weight:700">${escapeHtml(configuration)}</td>
            </tr>
            ${upgradeSaving === null ? '' : `<tr>
              <td style="padding:12px;border-top:1px solid #e3ebe7">Extra besparing door opslag</td>
              <td align="right" style="padding:12px;border-top:1px solid #e3ebe7;font-weight:700">${euro(upgradeSaving)}/jaar</td>
            </tr>`}
          </table>
          <p style="text-align:center;margin:28px 0">
            <a href="${reportUrl}" style="display:inline-block;background:#ffb020;color:#06130f;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:12px">Bekijk en download uw rapport</a>
          </p>
          <p style="margin:0;color:#5a6d66;font-size:13px;line-height:1.65">Uw aanvraag is vrijblijvend. Gegevens worden alleen met een partner gedeeld op basis van uw expliciete toestemming.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
```

- [ ] **Step 3: Replace inline email calculations and HTML**

In `app/api/leads/route.ts`, build a pending-status model from the stored lead before sending, then:

```ts
const html = renderReportEmail({
  report,
  firstName: submission.naam.split(/\s+/)[0],
  reportUrl: reportCheckUrl,
})
```

Delete duplicated `batterijInvestering`, `besparing`, `terugverdien`, `dataRij`, and inline HTML calculations from the route.

- [ ] **Step 4: Run email/model tests**

```powershell
npm run test:unit -- tests/unit/report-model.spec.ts tests/unit/report-email.spec.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Version-control checkpoint**

If commits are authorized:

```powershell
git add lib/report-email.ts app/api/leads/route.ts tests/unit/report-email.spec.ts
git commit -m "refactor: render email from the report model"
```

---

### Task 5: Render and verify a real PDF from the model

**Files:**

- Modify: `components/funnel/SaldeerRapportPDF.tsx`
- Modify: `components/funnel/PDFDownloadButton.tsx`
- Modify: `components/funnel/PDFDownloadButtonInner.tsx`
- Create: `tests/unit/report-pdf.spec.tsx`
- Modify: `tests/e2e/report-responsive.spec.ts`

- [ ] **Step 1: Write a real PDF smoke test**

```tsx
import { expect, test } from '@playwright/test'
import { renderToBuffer } from '@react-pdf/renderer'
import { SaldeerRapportPDF } from '@/components/funnel/SaldeerRapportPDF'
import { buildReportModel } from '@/lib/report-model'
import {
  reportSourceExistingPanels,
  reportSourceNoPanels,
} from '../fixtures/report'

for (const source of [reportSourceNoPanels, reportSourceExistingPanels]) {
  test(`generates a non-empty A4 PDF for ${source.qualification.heeftPanelen ? 'existing' : 'new'} panels`, async () => {
    const report = buildReportModel(source)!
    const buffer = await renderToBuffer(<SaldeerRapportPDF report={report} />)
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF')
    expect(buffer.byteLength).toBeGreaterThan(10_000)
  })
}
```

- [ ] **Step 2: Change the PDF contract**

Keep the public signature `SaldeerRapportPDF({ report }: { report: NormalizedReport })`. Its implementation must return one `Document` with A4 `Page` children and may use PDF-only local presentation helpers, but every helper accepts either the complete `report` or an explicit field from it. Remove `parseStoredRoi`, `FunnelState`, and every in-component commercial calculation.

Map every section:

- address from `report.home`;
- score/saving/payback from `report.summary`;
- loss from `report.impact`;
- scenario comparison from `report.scenarios` and saldering percentages from `report.salderingTimeline`;
- configuration/consumption/battery capacity/investment/ISDE from `report.recommendation`;
- grid from `report.grid`;
- technical sections from `report.technical`;
- disclaimer and generated date from `report.generatedAt`.

Use Customer-first Hybrid dark evergreen/amber/mist colors, but keep a light A4 body for print readability. Keep semantic red only for financial loss and ROOD net status.

- [ ] **Step 3: Keep the renderer out of the initial bundle**

`PDFDownloadButton.tsx`:

```tsx
'use client'

import dynamic from 'next/dynamic'
import type { NormalizedReport } from '@/lib/report-model'

const Inner = dynamic(() => import('./PDFDownloadButtonInner'), {
  ssr: false,
  loading: () => (
    <button type="button" disabled className="min-h-12 w-full rounded-xl bg-action/60 px-6 font-bold text-evergreen-950">
      PDF-module laden…
    </button>
  ),
})

export function PDFDownloadButton({ report }: { report: NormalizedReport }) {
  return <Inner report={report} />
}
```

`PDFDownloadButtonInner` imports `@react-pdf/renderer` and accepts `report`. Keep `window.open('', '_blank')` before awaiting generation and the anchor fallback.

- [ ] **Step 4: Track PDF outcomes**

```ts
trackEvent('pdf_generation_started', { report_version: report.version })
// after object URL is assigned/clicked:
trackEvent('pdf_open_succeeded', { report_version: report.version })
// catch:
trackEvent('pdf_generation_failed', { report_version: report.version })
```

No address or lead ID is sent.

- [ ] **Step 5: Add popup and fallback E2E**

```ts
test('PDF opens from the synchronous user gesture', async ({ page }) => {
  await seedReportState(page, expectedReportFixture)
  await page.goto('/check')
  await page.getByRole('button', { name: 'Doorgaan' }).click()
  const popupPromise = page.waitForEvent('popup')
  await page.getByRole('button', { name: /PDF-rapport/ }).click()
  const popup = await popupPromise
  await expect.poll(() => popup.url()).toMatch(/^blob:/)
})
```

For fallback, use `page.addInitScript(() => { window.open = () => null })`, intercept a temporary anchor click with `HTMLElement.prototype.click`, and assert it receives a blob URL plus a `.pdf` download filename.

- [ ] **Step 6: Run PDF verification**

```powershell
npm run test:unit -- tests/unit/report-pdf.spec.tsx
npx playwright test tests/e2e/report-responsive.spec.ts --project=chromium
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Version-control checkpoint**

If commits are authorized:

```powershell
git add components/funnel/SaldeerRapportPDF.tsx components/funnel/PDFDownloadButton.tsx components/funnel/PDFDownloadButtonInner.tsx tests/unit/report-pdf.spec.tsx tests/e2e/report-responsive.spec.ts
git commit -m "feat: generate the PDF from normalized report data"
```

---

### Task 6: Put the same model in B2B payloads

**Files:**

- Modify: `lib/webhook-delivery.ts`
- Modify: `app/api/leads/route.ts`
- Modify: `tests/unit/webhook-delivery.spec.ts`

- [ ] **Step 1: Add a failing parity test**

```ts
const storedLeadFixture = {
  id: reportSourceNoPanels.leadId!,
  created_at: reportSourceNoPanels.createdAt,
  adres: reportSourceNoPanels.adres,
  wijk: reportSourceNoPanels.wijk,
  stad: reportSourceNoPanels.stad,
  bag_data: reportSourceNoPanels.bagData,
  health_score: reportSourceNoPanels.healthScore!.score,
  netcongestie_status: reportSourceNoPanels.netcongestie!.status,
  roi_berekening: reportSourceNoPanels.roiResult,
  meterkast_analyse: null,
  plaatsing_analyse: null,
  omvormer_analyse: null,
  is_eigenaar: true,
  heeft_panelen: false,
  huidige_panelen_aantal: null,
  report_email_status: 'sent',
  naam: 'Jan de Vries',
  email: 'jan@example.nl',
  telefoon: '+31612345678',
}

for (const lead of [
  storedLeadFixture,
  {
    ...storedLeadFixture,
    id: reportSourceExistingPanels.leadId!,
    heeft_panelen: true,
    huidige_panelen_aantal: 10,
  },
]) {
  test(`B2B payload matches the ${lead.heeft_panelen ? 'existing' : 'new'}-panels report`, () => {
    const payload = JSON.parse(buildPartnerPayload(lead))
    const report = buildReportModel(reportSourceFromStoredLead(lead))!
    expect(payload.report).toEqual(report)
    expect(payload.health_score).toBe(report.summary.healthScore)
    expect(payload.netcongestie).toBe(report.grid.status)
    expect(payload.roi).toEqual(reportSourceNoPanels.roiResult)
  })
}
```

- [ ] **Step 2: Build report once in the payload builder**

```ts
const report = buildReportModel(reportSourceFromStoredLead(
  lead as Record<string, unknown>,
))
if (!report) {
  throw new Error(`Lead ${lead.id} heeft geen geldig rapportmodel`)
}
```

Because the model now includes truthful delivery state, move the awaited `preparePartnerDeliveries(lead.id)` call in `app/api/leads/route.ts` to after the Resend outcome has been persisted and the final stored lead has been reloaded, but still before returning the HTTP response. Keep `dispatchPreparedPartnerDeliveries(...)` inside `after`. This makes the B2B snapshot match the web/API model while retaining a durable pre-response retry row.

Return:

```ts
return JSON.stringify({
  event: 'lead.technisch_dossier',
  lead_id: lead.id,
  timestamp: lead.created_at ?? null,
  report_version: report.version,
  report,
  // Keep legacy partner fields for compatibility, but derive them from report/source.
  adres: report.home.address,
  postcode: report.home.postcode,
  stad: report.home.stad,
  health_score: report.summary.healthScore,
  netcongestie: report.grid.status,
  bag: lead.bag_data ?? {},
  roi: lead.roi_berekening ?? {},
  meterkast: report.technical.meterkast,
  plaatsing: report.technical.plaatsing,
  omvormer: report.technical.omvormer,
  contact: {
    naam: lead.naam ?? null,
    email: lead.email ?? null,
    telefoon: lead.telefoon ?? null,
  },
})
```

- [ ] **Step 3: Run webhook and model tests**

```powershell
npm run test:unit -- tests/unit/webhook-delivery.spec.ts tests/unit/report-model.spec.ts
npm run typecheck
```

Expected: PASS and deterministic retry payload test remains green.

- [ ] **Step 4: Version-control checkpoint**

If commits are authorized:

```powershell
git add lib/webhook-delivery.ts app/api/leads/route.ts tests/unit/webhook-delivery.spec.ts
git commit -m "feat: synchronize partner dossiers with reports"
```

---

### Task 7: Verify the entire report chain

**Files:**

- Modify: `CLAUDE.md`
- Modify: existing report/funnel tests only to consume the normalized contract.

- [ ] **Step 1: Run all report-focused tests**

```powershell
npm run test:unit -- tests/unit/report-model.spec.ts tests/unit/report-email.spec.ts tests/unit/report-pdf.spec.tsx tests/unit/webhook-delivery.spec.ts
npx playwright test tests/e2e/report-responsive.spec.ts tests/e2e/leadid-hydrate.spec.ts tests/e2e/funnel-deep.spec.ts --project=chromium
```

Expected: PASS.

- [ ] **Step 2: Run mobile report tests**

```powershell
npx playwright test tests/e2e/report-responsive.spec.ts --project=mobile-chrome
```

Expected: PASS, including no horizontal overflow and visible PDF action.

- [ ] **Step 3: Verify bundle isolation**

Run:

```powershell
npm run build
```

Inspect the generated client chunk output. The initial `/` and initial `/check` route chunks must not include `@react-pdf/renderer`; it may appear only in the dynamically loaded PDF chunk. Record before/after route sizes in execution notes.

- [ ] **Step 4: Run the complete phase gate**

```powershell
git diff --check
npm run typecheck
npm run test:unit
npm run build
npm run test:e2e:core
```

Expected: PASS.

- [ ] **Step 5: Update `CLAUDE.md`**

Document:

- `NormalizedReport` version 1 and its builder;
- web/email/PDF/B2B all consume the same model;
- lead API and report GET return `report`;
- persisted `report_email_status` meanings;
- no runtime viewport switch in ResultsDashboard;
- PDF renderer remains dynamically isolated;
- report token behavior is unchanged.

- [ ] **Step 6: Request code review**

Use `superpowers:requesting-code-review`. Compare two fixtures across web/email/PDF/B2B, test an email failure, inspect mobile/desktop screenshots, and verify no HMAC/GDPR regression.

- [ ] **Step 7: Version-control checkpoint**

If commits are authorized:

```powershell
git add CLAUDE.md
git commit -m "docs: define the unified report contract"
```

---

## Phase acceptance

This plan is complete only when:

- one versioned model determines all commercial numbers and recommendation copy;
- web, email, PDF, and partner payload tests agree for both panel scenarios;
- an email failure still shows a saved request and available PDF, never a false sent claim;
- a tokenized report reload renders the same model;
- mobile uses summary plus disclosures and desktop uses the wider grid without hydration switching;
- a real PDF buffer is generated in tests and mobile popup fallback works;
- `@react-pdf/renderer` is absent from initial page chunks;
- report HMAC and GDPR behavior remain unchanged.

