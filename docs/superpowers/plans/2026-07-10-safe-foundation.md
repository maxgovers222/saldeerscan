# Safe Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make lead data, B2B delivery, retry behavior, and the build pipeline trustworthy before changing the conversion UI.

**Architecture:** Parse and normalize lead submissions at one server boundary, preserve the exact ROI inputs used by the client, and reconstruct ROI/health data on the server before storage or partner filtering. Persist the exact serialized B2B payload with each delivery, then reuse that stored body with freshly derived HMAC headers for retries. Reuse Playwright as the repository’s unit/integration runner and add a GitHub Actions quality gate.

**Tech Stack:** Next.js 16.2 App Router route handlers, React 19, TypeScript, Supabase/Postgres, Node HMAC, Playwright 1.59, GitHub Actions.

**Depends on:** Approved design spec `docs/superpowers/specs/2026-07-10-customer-first-ui-overhaul-design.md`.

---

## File map

Create:

- `lib/lead-submission.ts` — bounded parsing, normalization, and server-side report calculation.
- `lib/bag-attestation.ts` — HMAC attestation for BAG values returned by the trusted API.
- `lib/webhook-delivery.ts` — deterministic payload construction, signing, headers, backoff, and HTTP delivery.
- `components/funnel/prepare-vision-image.ts` — resize/compress camera images below the server payload ceiling.
- `tests/unit/lead-submission.spec.ts` — pure lead parser and server-calculation tests.
- `tests/unit/bag-attestation.spec.ts` — canonical signing, tamper rejection, and lookup fallback.
- `tests/unit/webhook-delivery.spec.ts` — payload/signature/retry-state tests.
- `tests/unit/vision-input.spec.ts` — image data-URL boundary tests.
- `playwright.unit.config.ts` — Node-only Playwright test configuration without a web server.
- `.github/workflows/ci.yml` — typecheck, unit tests, build, and core Chromium E2E.
- `supabase/migrations/<generated>_webhook_retry_payload.sql` — persist the exact webhook body and initial signature for deterministic replay.

Modify:

- `package.json` — repeatable `typecheck`, `test:unit`, and `test:e2e:core` scripts.
- `playwright.config.ts` — never reuse an arbitrary server in CI.
- `components/funnel/types.ts` — retain the exact ROI calculation inputs in funnel state.
- `components/funnel/FunnelContainer.tsx` — initialize, persist, and restore ROI inputs.
- `components/funnel/Step2ROI.tsx` — write ROI inputs alongside every successful ROI result.
- `components/funnel/Step6LeadCapture.tsx` — submit ROI inputs; keep client-computed result display-only.
- `components/funnel/Step1Adres.tsx` — retain the signed BAG attestation returned by `/api/bag`.
- `app/api/bag/route.ts` — sign the BAG fields sent to the browser.
- `app/api/leads/route.ts` — bounded body read, normalized data, server-derived ROI/health/net status, truthful mail status.
- `lib/webhooks.ts` — share delivery code and make bulk-buyer delivery fetch the stored lead.
- `app/api/webhooks/retry/route.ts` — reload the active partner and resend the stored body with complete signed headers.
- `app/api/vision/route.ts` — reject unsupported MIME types, malformed base64, and decoded files over 3 MiB before AI calls.
- `components/funnel/PhotoUpload.tsx` — keep a practical 10 MB source-file limit, then compress before upload.
- `vercel.json` — retain the daily Hobby-compatible retry schedule and align backoff claims to that cadence.
- `CLAUDE.md` — record the server-trust boundary, retry behavior, CI commands, and any cron-plan limitation.

Do not change in this plan:

- funnel layout or visual step count;
- report presentation, PDF layout, or email visual design;
- pSEO metadata, JSON-LD, ISR, sitemap, or URL structure;
- partner consent rules.

---

### Task 1: Add a deterministic test harness

**Files:**

- Create: `playwright.unit.config.ts`
- Modify: `package.json:5-16`

- [ ] **Step 1: Add the unit-runner configuration**

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/unit',
  timeout: 10_000,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
})
```

- [ ] **Step 2: Add repository scripts**

Replace the scripts object entries with these additional commands, preserving all seed scripts:

```json
{
  "typecheck": "next typegen && tsc --noEmit",
  "test:unit": "playwright test --config=playwright.unit.config.ts",
  "test:e2e": "playwright test",
  "test:e2e:core": "playwright test tests/e2e/leadid-hydrate.spec.ts tests/e2e/step6-validatie.spec.ts --project=chromium",
  "test:e2e:ui": "playwright test --ui"
}
```

- [ ] **Step 3: Verify the empty test directory is not treated as success**

Run:

```powershell
npm run test:unit
```

Expected: non-zero exit with “No tests found”. This confirms the command is invoking the intended configuration.

- [ ] **Step 4: Run the existing baseline before refactoring**

Run:

```powershell
npm run typecheck
npm run test:e2e:core
```

Expected: both commands pass. If either fails before implementation, capture the exact failure in the execution notes and do not hide it with retries.

- [ ] **Step 5: Version-control checkpoint**

Only when the user has explicitly authorized commits:

```powershell
git add package.json playwright.unit.config.ts
git commit -m "test: add repeatable unit test harness"
```

Otherwise leave the changes uncommitted and continue.

---

### Task 2: Parse and normalize lead submissions at one boundary

**Files:**

- Create: `lib/lead-submission.ts`
- Create: `tests/unit/lead-submission.spec.ts`

- [ ] **Step 1: Write failing parser tests**

```ts
import { expect, test } from '@playwright/test'
import {
  LeadSubmissionError,
  deriveLeadAnalysis,
  parseLeadSubmission,
} from '@/lib/lead-submission'

const validBody = {
  naam: 'Jan de Vries',
  email: ' JAN@Voorbeeld.NL ',
  telefoon: '+31612345678',
  adres: 'Prinsengracht 263, Amsterdam',
  postcode: '1016 GV',
  gdprConsent: true,
  bagData: {
    bouwjaar: 1940,
    oppervlakte: 110,
    woningtype: 'Woning',
    postcode: '1016 GV',
    huisnummer: 263,
    dakOppervlakte: 55,
    lat: 52.3752,
    lon: 4.8839,
  },
  roiInput: {
    oppervlakte: 110,
    bouwjaar: 1940,
    dakOppervlakte: 48,
    huidigVerbruikKwh: 3600,
    aantalPanelenOverride: 10,
    kwhPerPaneel: 370,
    dakrichting: 'Zuid',
    huishouden_grootte: 2,
  },
  energielabel: 'A++',
  healthScore: 100,
  roiResult: { forged: true },
}

test('normalizes contact and postcode values', () => {
  const parsed = parseLeadSubmission(validBody)
  expect(parsed.email).toBe('jan@voorbeeld.nl')
  expect(parsed.postcode).toBe('1016GV')
  expect(parsed.telefoon).toBe('+31612345678')
})

test('rejects one-part names and malformed contact fields', () => {
  expect(() => parseLeadSubmission({ ...validBody, naam: 'Jan' }))
    .toThrow(LeadSubmissionError)
  expect(() => parseLeadSubmission({ ...validBody, email: 'jan@invalid' }))
    .toThrow(LeadSubmissionError)
  expect(() => parseLeadSubmission({ ...validBody, telefoon: '123' }))
    .toThrow(LeadSubmissionError)
})

test('rejects unbounded or contradictory calculation input', () => {
  expect(() => parseLeadSubmission({
    ...validBody,
    roiInput: { ...validBody.roiInput, dakOppervlakte: 50_000 },
  })).toThrow(/dakOppervlakte/)
  expect(() => parseLeadSubmission({
    ...validBody,
    roiInput: { ...validBody.roiInput, bouwjaar: 2020 },
  })).toThrow(/bouwjaar.*BAG/i)
})

test('ignores forged client result and score', () => {
  const parsed = parseLeadSubmission(validBody)
  const analysis = deriveLeadAnalysis(parsed, 'ORANJE')
  expect(analysis.health.score).not.toBe(100)
  expect(analysis.roi).toMatchObject({
    geschatVerbruikKwh: 3600,
    aantalPanelen: 10,
  })
  const withoutForgedLabel = deriveLeadAnalysis(
    parseLeadSubmission({ ...validBody, energielabel: undefined }),
    'ORANJE',
  )
  expect(analysis.health.score).toBe(withoutForgedLabel.health.score)
})

test('bounds customer scenario controls to the actual UI contract', () => {
  expect(() => parseLeadSubmission({
    ...validBody,
    roiInput: { ...validBody.roiInput, dakOppervlakte: 56 },
  })).toThrow(/dakOppervlakte.*BAG/i)
  expect(() => parseLeadSubmission({
    ...validBody,
    roiInput: { ...validBody.roiInput, aantalPanelenOverride: 41 },
  })).toThrow(/aantalPanelenOverride/i)
  expect(() => parseLeadSubmission({
    ...validBody,
    roiInput: { ...validBody.roiInput, kwhPerPaneel: 500 },
  })).toThrow(/kwhPerPaneel/i)
})
```

- [ ] **Step 2: Run the tests and confirm the missing-module failure**

Run:

```powershell
npm run test:unit -- tests/unit/lead-submission.spec.ts
```

Expected: FAIL because `lib/lead-submission.ts` does not exist.

- [ ] **Step 3: Implement bounded parsing and server derivation**

Create `lib/lead-submission.ts` with this public contract and complete validation:

```ts
import { berekenHealthScore, type HealthScoreResult } from '@/lib/health-score'
import { berekenROI, type ROIInput, type ROIResult } from '@/lib/roi'

export const MAX_LEAD_BODY_BYTES = 128_000

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^\+(31|32|49|352)[1-9]\d{7,11}$/
const POSTCODE_RE = /^\d{4}[A-Z]{2}$/
const DAKRICHTINGEN = new Set(['Zuid', 'Oost/West', 'Noord'])
const KWH_PER_PANEEL_OPTIONS = new Set([330, 350, 370, 410])

type JsonRecord = Record<string, unknown>
export type NetStatus = 'ROOD' | 'ORANJE' | 'GROEN'

export interface NormalizedBagData {
  bouwjaar: number
  oppervlakte: number
  woningtype: string | null
  postcode: string
  huisnummer: number | null
  dakOppervlakte: number
  lat: number
  lon: number
}

export interface NormalizedLeadSubmission {
  naam: string
  email: string
  telefoon: string
  adres: string
  postcode: string
  huisnummer: string | null
  wijk: string | null
  stad: string | null
  provincie: string | null
  bagData: NormalizedBagData
  roiInput: ROIInput
  energielabel: string | null
  meterkastAnalyse: JsonRecord | null
  plaatsingsAnalyse: JsonRecord | null
  omvormerAnalyse: JsonRecord | null
  isEigenaar: boolean | null
  heeftPanelen: boolean | null
  huidigePanelenAantal: number | null
  dakrichting: ROIInput['dakrichting']
  verbruikBron: 'schatting' | 'gebruiker'
  huishoudenGrootte: 1 | 2 | 3 | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  landingPage: string | null
}

export class LeadSubmissionError extends Error {
  constructor(
    message: string,
    readonly field?: string,
    readonly status = 400,
  ) {
    super(message)
    this.name = 'LeadSubmissionError'
  }
}

function record(value: unknown, field: string): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new LeadSubmissionError(`${field} is ongeldig`, field)
  }
  return value as JsonRecord
}

function text(
  value: unknown,
  field: string,
  options: { required?: boolean; max: number },
): string | null {
  if (value === null || value === undefined || value === '') {
    if (options.required) throw new LeadSubmissionError(`${field} is verplicht`, field)
    return null
  }
  if (typeof value !== 'string') throw new LeadSubmissionError(`${field} is ongeldig`, field)
  const normalized = value.trim()
  if (!normalized && options.required) throw new LeadSubmissionError(`${field} is verplicht`, field)
  if (normalized.length > options.max) throw new LeadSubmissionError(`${field} is te lang`, field)
  return normalized || null
}

function finiteNumber(
  value: unknown,
  field: string,
  min: number,
  max: number,
): number {
  const number = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new LeadSubmissionError(`${field} moet tussen ${min} en ${max} liggen`, field)
  }
  return number
}

function nullableObject(value: unknown, field: string): JsonRecord | null {
  if (value === null || value === undefined) return null
  const parsed = record(value, field)
  if (JSON.stringify(parsed).length > 32_000) {
    throw new LeadSubmissionError(`${field} is te groot`, field)
  }
  return parsed
}

export function parseLeadSubmission(raw: unknown): NormalizedLeadSubmission {
  const body = record(raw, 'body')
  const naam = text(body.naam, 'naam', { required: true, max: 120 })!
  if (naam.split(/\s+/).length < 2) {
    throw new LeadSubmissionError('Voer uw voor- en achternaam in', 'naam')
  }

  const email = text(body.email, 'email', { required: true, max: 254 })!.toLowerCase()
  if (!EMAIL_RE.test(email)) throw new LeadSubmissionError('Voer een geldig e-mailadres in', 'email')

  const telefoon = text(body.telefoon, 'telefoon', { required: true, max: 20 })!
    .replace(/[\s().-]/g, '')
  if (!PHONE_RE.test(telefoon)) {
    throw new LeadSubmissionError('Voer een geldig internationaal telefoonnummer in', 'telefoon')
  }
  if (body.gdprConsent !== true) {
    throw new LeadSubmissionError('GDPR consent is vereist', 'gdprConsent')
  }

  const bag = record(body.bagData, 'bagData')
  const bagPostcode = text(bag.postcode, 'bagData.postcode', { required: true, max: 8 })!
    .replace(/\s/g, '')
    .toUpperCase()
  if (!POSTCODE_RE.test(bagPostcode)) {
    throw new LeadSubmissionError('bagData.postcode is ongeldig', 'bagData.postcode')
  }
  const bagData: NormalizedBagData = {
    bouwjaar: Math.round(finiteNumber(bag.bouwjaar, 'bagData.bouwjaar', 1000, 2030)),
    oppervlakte: finiteNumber(bag.oppervlakte, 'bagData.oppervlakte', 1, 2000),
    woningtype: text(bag.woningtype, 'bagData.woningtype', { max: 80 }),
    postcode: bagPostcode,
    huisnummer: bag.huisnummer == null
      ? null
      : Math.round(finiteNumber(bag.huisnummer, 'bagData.huisnummer', 1, 99_999)),
    dakOppervlakte: finiteNumber(bag.dakOppervlakte, 'bagData.dakOppervlakte', 0, 5000),
    lat: finiteNumber(bag.lat, 'bagData.lat', 50, 54),
    lon: finiteNumber(bag.lon, 'bagData.lon', 3, 8),
  }

  const roiRaw = record(body.roiInput, 'roiInput')
  const roiBouwjaar = Math.round(finiteNumber(roiRaw.bouwjaar, 'roiInput.bouwjaar', 1000, 2030))
  const roiOppervlakte = finiteNumber(roiRaw.oppervlakte, 'roiInput.oppervlakte', 1, 2000)
  if (roiBouwjaar !== bagData.bouwjaar) {
    throw new LeadSubmissionError('roiInput.bouwjaar wijkt af van BAG', 'roiInput.bouwjaar')
  }
  if (Math.abs(roiOppervlakte - bagData.oppervlakte) > 1) {
    throw new LeadSubmissionError('roiInput.oppervlakte wijkt af van BAG', 'roiInput.oppervlakte')
  }

  const dakrichting = roiRaw.dakrichting == null
    ? null
    : String(roiRaw.dakrichting)
  if (dakrichting && !DAKRICHTINGEN.has(dakrichting)) {
    throw new LeadSubmissionError('roiInput.dakrichting is ongeldig', 'roiInput.dakrichting')
  }
  const huishouden = roiRaw.huishouden_grootte == null
    ? null
    : finiteNumber(roiRaw.huishouden_grootte, 'roiInput.huishouden_grootte', 1, 3)
  if (huishouden !== null && !Number.isInteger(huishouden)) {
    throw new LeadSubmissionError('roiInput.huishouden_grootte is ongeldig', 'roiInput.huishouden_grootte')
  }

  const roiInput: ROIInput = {
    oppervlakte: roiOppervlakte,
    bouwjaar: roiBouwjaar,
    dakOppervlakte: finiteNumber(
      roiRaw.dakOppervlakte,
      'roiInput.dakOppervlakte',
      0,
      bagData.dakOppervlakte,
    ),
    huidigVerbruikKwh: finiteNumber(
      roiRaw.huidigVerbruikKwh,
      'roiInput.huidigVerbruikKwh',
      100,
      Math.max(25_000, bagData.oppervlakte * 40),
    ),
    aantalPanelenOverride: Math.round(finiteNumber(
      roiRaw.aantalPanelenOverride,
      'roiInput.aantalPanelenOverride',
      1,
      Math.min(
        200,
        Math.max(40, Math.floor((bagData.dakOppervlakte * 0.70) / 4)),
      ),
    )),
    kwhPerPaneel: finiteNumber(roiRaw.kwhPerPaneel, 'roiInput.kwhPerPaneel', 200, 600),
    dakrichting: dakrichting as ROIInput['dakrichting'],
    huishouden_grootte: huishouden as 1 | 2 | 3 | null,
  }
  if (!KWH_PER_PANEEL_OPTIONS.has(roiInput.kwhPerPaneel!)) {
    throw new LeadSubmissionError(
      'roiInput.kwhPerPaneel is ongeldig',
      'roiInput.kwhPerPaneel',
    )
  }

  const postcode = text(body.postcode, 'postcode', { max: 8 })
    ?.replace(/\s/g, '')
    .toUpperCase() ?? bagPostcode
  if (postcode !== bagPostcode) {
    throw new LeadSubmissionError('postcode wijkt af van BAG', 'postcode')
  }

  const heeftPanelen = typeof body.heeftPanelen === 'boolean' ? body.heeftPanelen : null
  const huidigePanelenAantal = heeftPanelen === true
    ? Math.round(finiteNumber(body.huidigePanelenAantal, 'huidigePanelenAantal', 1, 200))
    : null

  return {
    naam,
    email,
    telefoon,
    adres: text(body.adres, 'adres', { required: true, max: 250 })!,
    postcode,
    huisnummer: bagData.huisnummer === null ? null : String(bagData.huisnummer),
    wijk: text(body.wijk, 'wijk', { max: 120 }),
    stad: text(body.stad, 'stad', { max: 120 }),
    provincie: text(body.provincie, 'provincie', { max: 80 }),
    bagData,
    roiInput,
    // Until a server-side EP-online lookup exists, never trust this client field.
    energielabel: null,
    meterkastAnalyse: nullableObject(body.meterkastAnalyse, 'meterkastAnalyse'),
    plaatsingsAnalyse: nullableObject(body.plaatsingsAnalyse, 'plaatsingsAnalyse'),
    omvormerAnalyse: nullableObject(body.omvormerAnalyse, 'omvormerAnalyse'),
    isEigenaar: typeof body.isEigenaar === 'boolean' ? body.isEigenaar : null,
    heeftPanelen,
    huidigePanelenAantal,
    dakrichting: roiInput.dakrichting ?? null,
    verbruikBron: body.verbruik_bron === 'gebruiker' ? 'gebruiker' : 'schatting',
    huishoudenGrootte: roiInput.huishouden_grootte ?? null,
    utmSource: text(body.utmSource, 'utmSource', { max: 120 }),
    utmMedium: text(body.utmMedium, 'utmMedium', { max: 120 }),
    utmCampaign: text(body.utmCampaign, 'utmCampaign', { max: 180 }),
    landingPage: text(body.landingPage, 'landingPage', { max: 500 }),
  }
}

export function deriveLeadAnalysis(
  lead: NormalizedLeadSubmission,
  netcongestieStatus: NetStatus,
): { roi: ROIResult; health: HealthScoreResult } {
  return {
    roi: berekenROI(lead.roiInput),
    health: berekenHealthScore({
      bouwjaar: lead.bagData.bouwjaar,
      energielabel: lead.energielabel,
      dakOppervlakte: lead.bagData.dakOppervlakte,
      netcongestieStatus,
    }),
  }
}

export async function readBoundedJson(
  request: Request,
  maxBytes = MAX_LEAD_BODY_BYTES,
): Promise<unknown> {
  const declared = Number(request.headers.get('content-length') ?? 0)
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new LeadSubmissionError('Aanvraag is te groot', 'body', 413)
  }
  const textBody = await request.text()
  if (Buffer.byteLength(textBody, 'utf8') > maxBytes) {
    throw new LeadSubmissionError('Aanvraag is te groot', 'body', 413)
  }
  try {
    return JSON.parse(textBody)
  } catch {
    throw new LeadSubmissionError('Ongeldig JSON body', 'body')
  }
}
```

- [ ] **Step 4: Run the parser tests**

Run:

```powershell
npm run test:unit -- tests/unit/lead-submission.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Version-control checkpoint**

If commits are authorized:

```powershell
git add lib/lead-submission.ts tests/unit/lead-submission.spec.ts
git commit -m "fix: validate lead data at the server boundary"
```

---

### Task 3: Preserve ROI provenance through the funnel

**Files:**

- Modify: `components/funnel/types.ts:20-36,76-143`
- Modify: `components/funnel/FunnelContainer.tsx:37-89,307-341`
- Modify: `components/funnel/Step2ROI.tsx:94-160`
- Modify: `components/funnel/Step6LeadCapture.tsx:185-213`
- Test: `tests/e2e/step6-validatie.spec.ts`

- [ ] **Step 1: Add a failing submit-payload assertion**

In the existing successful-submit route mock in `tests/e2e/step6-validatie.spec.ts`, capture and assert the posted body:

```ts
let submittedBody: Record<string, unknown> | null = null

await page.route('**/api/leads', async route => {
  submittedBody = route.request().postDataJSON() as Record<string, unknown>
  await route.fulfill({
    status: 201,
    contentType: 'application/json',
    body: JSON.stringify({
      leadId: '11111111-1111-4111-8111-111111111111',
      reportToken: 'test-token',
      emailStatus: 'sent',
    }),
  })
})

await page.locator('#lead-naam').fill('Jan de Vries')
await page.locator('#lead-email').fill('jan@test.nl')
await page.locator('#lead-telefoon').fill('0612345678')
await page.locator('#lead-gdpr').click({ force: true })
await page.locator('button[type="submit"]').click()
await expect(page.getByText('Uw SaldeerScan rapport').first()).toBeVisible()
expect(submittedBody).not.toBeNull()
expect(submittedBody?.roiInput).toMatchObject({
  oppervlakte: expect.any(Number),
  bouwjaar: expect.any(Number),
  dakOppervlakte: expect.any(Number),
  huidigVerbruikKwh: expect.any(Number),
  aantalPanelenOverride: expect.any(Number),
  kwhPerPaneel: expect.any(Number),
})
```

- [ ] **Step 2: Run the focused E2E and verify the assertion fails**

Run:

```powershell
npx playwright test tests/e2e/step6-validatie.spec.ts --project=chromium
```

Expected: FAIL because `roiInput` is absent.

- [ ] **Step 3: Add the serializable ROI input type and action**

In `components/funnel/types.ts`:

```ts
export interface RoiCalculationInput {
  oppervlakte: number
  bouwjaar: number
  dakOppervlakte: number
  huidigVerbruikKwh: number
  aantalPanelenOverride: number
  kwhPerPaneel: number
  dakrichting: 'Zuid' | 'Oost/West' | 'Noord' | null
  huishouden_grootte: 1 | 2 | 3 | null
}

// Add this member inside the existing FunnelState interface:
roiInput: RoiCalculationInput | null

// Append this variant to the existing FunnelAction union:
| { type: 'SET_ROI_INPUT'; roiInput: RoiCalculationInput }
```

- [ ] **Step 4: Initialize, reduce, and restore the field**

In `FunnelContainer.tsx`:

```ts
case 'SET_ROI_INPUT':
  return { ...state, roiInput: action.roiInput }
```

Add `roiInput: null` to `makeInitialState`, add `roiInput: savedState.roiInput` to the resume map, and ensure old localStorage data remains valid through:

```ts
return {
  ...parsed,
  leadReportToken: parsed.leadReportToken ?? null,
  roiInput: parsed.roiInput ?? null,
}
```

- [ ] **Step 5: Store the exact inputs after every successful ROI response**

In `Step2ROI.tsx`, construct once and use for both the API and reducer:

```ts
const roiInput = {
  oppervlakte: state.bagData!.oppervlakte,
  bouwjaar: state.bagData!.bouwjaar,
  dakOppervlakte: dakOpp,
  huidigVerbruikKwh: verbruik,
  aantalPanelenOverride: panelen,
  kwhPerPaneel,
  dakrichting: state.dakrichting,
  huishouden_grootte: state.huishouden_grootte,
} satisfies NonNullable<FunnelState['roiInput']>

const res = await fetch('/api/roi', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(roiInput),
})

if (res.ok) {
  const data = await res.json()
  dispatch({ type: 'SET_ROI_INPUT', roiInput })
  dispatch({ type: 'SET_ROI', roiResult: data.roi })
  if (data.health) dispatch({ type: 'SET_HEALTH_SCORE', healthScore: data.health })
}
```

Add `state.huishouden_grootte` to the effect dependencies so the stored input cannot drift from the result.

- [ ] **Step 6: Submit the provenance object**

In `Step6LeadCapture.tsx`, add:

```ts
roiInput: state.roiInput,
```

Keep `roiResult` and `healthScore` temporarily for backward-compatible UI/debugging, but the server must ignore them for persisted commercial calculations.

- [ ] **Step 7: Run typecheck and focused E2E**

Run:

```powershell
npm run typecheck
npx playwright test tests/e2e/step6-validatie.spec.ts --project=chromium
```

Expected: PASS.

- [ ] **Step 8: Version-control checkpoint**

If commits are authorized:

```powershell
git add components/funnel/types.ts components/funnel/FunnelContainer.tsx components/funnel/Step2ROI.tsx components/funnel/Step6LeadCapture.tsx tests/e2e/step6-validatie.spec.ts
git commit -m "fix: preserve trusted ROI calculation inputs"
```

---

### Task 4: Persist only server-derived commercial calculations

**Files:**

- Modify: `app/api/leads/route.ts:1-330`
- Modify: `tests/unit/lead-submission.spec.ts`

- [ ] **Step 1: Add a bounded-body test**

Append:

```ts
import { readBoundedJson } from '@/lib/lead-submission'

test('rejects oversized request bodies before parsing', async () => {
  const request = new Request('https://saldeerscan.nl/api/leads', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ value: 'x'.repeat(200_000) }),
  })
  await expect(readBoundedJson(request, 128_000)).rejects.toMatchObject({
    status: 413,
  })
})
```

- [ ] **Step 2: Replace ad-hoc body parsing**

At the top of `app/api/leads/route.ts`:

```ts
import {
  deriveLeadAnalysis,
  LeadSubmissionError,
  parseLeadSubmission,
  readBoundedJson,
} from '@/lib/lead-submission'
import { getNetcongestie } from '@/lib/netcongestie'
```

At the beginning of `POST`:

```ts
let submission
try {
  submission = parseLeadSubmission(await readBoundedJson(request))
} catch (error) {
  if (error instanceof LeadSubmissionError) {
    return Response.json(
      { error: error.message, field: error.field ?? null },
      { status: error.status },
    )
  }
  return Response.json({ error: 'Ongeldige aanvraag' }, { status: 400 })
}

const netcongestie = await getNetcongestie(submission.postcode)
const { roi, health } = deriveLeadAnalysis(submission, netcongestie.status)
```

- [ ] **Step 3: Replace all client-trusted persisted fields**

Use normalized fields in the insert:

```ts
const { data: lead, error } = await supabaseAdmin
  .from('leads')
  .insert({
    naam: submission.naam,
    email: submission.email,
    telefoon: submission.telefoon,
    adres: submission.adres,
    postcode: submission.postcode,
    huisnummer: submission.huisnummer,
    wijk: submission.wijk,
    stad: submission.stad,
    provincie: submission.provincie,
    lat: submission.bagData.lat,
    lon: submission.bagData.lon,
    bag_data: submission.bagData,
    ep_data: {},
    energielabel: submission.energielabel,
    health_score: health.score,
    netcongestie_status: netcongestie.status,
    roi_berekening: roi,
    meterkast_analyse: submission.meterkastAnalyse ?? {},
    plaatsing_analyse: submission.plaatsingsAnalyse ?? {},
    omvormer_analyse: submission.omvormerAnalyse ?? {},
    isde_pre_fill: roi.isdeSchatting,
    gdpr_consent: true,
    consent_timestamp: new Date().toISOString(),
    consent_ip: ip,
    consent_tekst: 'Ja, ik ontvang graag mijn Persoonlijke 2027-Rapport. Ik geef toestemming om mijn scandata te laten valideren door een gecertificeerde energie-expert van SaldeerScan.nl in mijn regio voor een definitief configuratie-advies.',
    is_eigenaar: submission.isEigenaar,
    heeft_panelen: submission.heeftPanelen,
    huidige_panelen_aantal: submission.huidigePanelenAantal,
    dakrichting: submission.dakrichting,
    verbruik_bron: submission.verbruikBron,
    huishouden_grootte: submission.huishoudenGrootte,
    funnel_step: 6,
    funnel_completed: true,
    utm_source: submission.utmSource,
    utm_medium: submission.utmMedium,
    utm_campaign: submission.utmCampaign,
    landing_page: submission.landingPage,
  })
  .select('id')
  .single()
```

Use `roi`, `health.score`, `netcongestie.status`, and normalized contact fields for the existing email calculations. Do not read `body.roiResult`, `body.healthScore`, or `body.netcongestieStatus` again.

- [ ] **Step 4: Return an explicit email status**

Initialize:

```ts
let emailStatus: 'sent' | 'failed' | 'not_configured' = resend
  ? 'failed'
  : 'not_configured'
```

Set `emailStatus = 'sent'` only when Resend returns no error. Keep it `failed` on exceptions. Return:

```ts
return Response.json(
  {
    leadId: lead.id,
    reportToken: reportAccessToken ?? null,
    status: 'ingediend',
    emailStatus,
  },
  { status: 201 },
)
```

The UI will consume this in the report-chain plan; adding it now establishes the reliable API contract.

- [ ] **Step 5: Run focused and static verification**

Run:

```powershell
npm run test:unit -- tests/unit/lead-submission.spec.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Version-control checkpoint**

If commits are authorized:

```powershell
git add app/api/leads/route.ts lib/lead-submission.ts tests/unit/lead-submission.spec.ts
git commit -m "fix: derive lead scores on the server"
```

---

### Task 5: Share webhook payload, signing, delivery, and retry state

**Files:**

- Create: `lib/webhook-delivery.ts`
- Create: `tests/unit/webhook-delivery.spec.ts`
- Modify: `lib/webhooks.ts:1-193`

- [ ] **Step 1: Write failing deterministic-delivery tests**

```ts
import { createHmac } from 'node:crypto'
import { expect, test } from '@playwright/test'
import {
  buildPartnerPayload,
  deliverPartnerWebhook,
  nextDeliveryState,
  signPartnerPayload,
} from '@/lib/webhook-delivery'

const lead = {
  id: 'lead-1',
  created_at: '2026-07-10T10:00:00.000Z',
  adres: 'Teststraat 1',
  postcode: '1234AB',
  stad: 'Teststad',
  provincie: 'Utrecht',
  health_score: 62,
  netcongestie_status: 'ORANJE',
  bag_data: {},
  roi_berekening: {},
  meterkast_analyse: {},
  plaatsing_analyse: {},
  omvormer_analyse: {},
  isde_pre_fill: {},
  naam: 'Jan de Vries',
  email: 'jan@example.nl',
  telefoon: '+31612345678',
}
const partner = {
  id: 'partner-1',
  naam: 'Partner',
  webhook_url: 'https://partner.example/webhook',
  api_key_hash: 'secret',
}

test('builds the same logical body for initial delivery and retry', () => {
  expect(buildPartnerPayload(lead)).toBe(buildPartnerPayload(lead))
  expect(JSON.parse(buildPartnerPayload(lead)).timestamp).toBe(lead.created_at)
})

test('posts signed body and required headers', async () => {
  let request: Request | null = null
  const payloadBody = buildPartnerPayload(lead)
  const result = await deliverPartnerWebhook({
    leadId: lead.id,
    payloadBody,
    partner,
    fetchImpl: async (input, init) => {
      request = new Request(input, init)
      return new Response(null, { status: 204 })
    },
  })
  const body = await request!.text()
  expect(request!.headers.get('x-wep-signature')).toBe(
    createHmac('sha256', partner.api_key_hash).update(body).digest('hex'),
  )
  expect(request!.headers.get('x-wep-version')).toBe('1.0')
  expect(request!.headers.get('x-wep-lead-id')).toBe(lead.id)
  expect(result.ok).toBe(true)
})

test('uses daily-compatible 1d, 2d, 4d delays and then fails permanently', () => {
  const now = Date.parse('2026-07-10T10:00:00Z')
  expect(nextDeliveryState(1, 'HTTP 500', now)).toMatchObject({
    status: 'pending_retry',
    attempts: 1,
    next_retry_at: '2026-07-11T10:00:00.000Z',
  })
  expect(nextDeliveryState(2, 'HTTP 500', now).next_retry_at)
    .toBe('2026-07-12T10:00:00.000Z')
  expect(nextDeliveryState(3, 'HTTP 500', now).next_retry_at)
    .toBe('2026-07-14T10:00:00.000Z')
  expect(nextDeliveryState(4, 'HTTP 500', now)).toMatchObject({
    status: 'failed',
    next_retry_at: null,
  })
})
```

- [ ] **Step 2: Run and confirm the missing-module failure**

Run:

```powershell
npm run test:unit -- tests/unit/webhook-delivery.spec.ts
```

Expected: FAIL because `lib/webhook-delivery.ts` is missing.

- [ ] **Step 3: Implement the shared delivery module**

```ts
import { createHmac } from 'node:crypto'

export const RETRY_DELAYS_SECONDS = [
  24 * 60 * 60,
  48 * 60 * 60,
  96 * 60 * 60,
] as const

export interface StoredLeadForWebhook {
  id: string
  created_at?: string | null
  adres?: unknown
  postcode?: unknown
  stad?: unknown
  provincie?: unknown
  health_score?: unknown
  netcongestie_status?: unknown
  bag_data?: unknown
  roi_berekening?: unknown
  meterkast_analyse?: unknown
  plaatsing_analyse?: unknown
  omvormer_analyse?: unknown
  isde_pre_fill?: unknown
  naam?: unknown
  email?: unknown
  telefoon?: unknown
}

export interface PartnerEndpoint {
  id: string
  naam: string
  webhook_url: string
  api_key_hash: string
}

export interface DeliveryState {
  status: 'pending_retry' | 'failed'
  attempts: number
  last_error: string
  next_retry_at: string | null
}

export function buildPartnerPayload(lead: StoredLeadForWebhook): string {
  return JSON.stringify({
    event: 'lead.technisch_dossier',
    lead_id: lead.id,
    timestamp: lead.created_at ?? null,
    adres: lead.adres ?? null,
    postcode: lead.postcode ?? null,
    stad: lead.stad ?? null,
    provincie: lead.provincie ?? null,
    health_score: lead.health_score ?? null,
    netcongestie: lead.netcongestie_status ?? null,
    bag: lead.bag_data ?? {},
    roi: lead.roi_berekening ?? {},
    meterkast: lead.meterkast_analyse ?? {},
    plaatsing: lead.plaatsing_analyse ?? {},
    omvormer: lead.omvormer_analyse ?? {},
    isde: lead.isde_pre_fill ?? {},
    contact: {
      naam: lead.naam ?? null,
      email: lead.email ?? null,
      telefoon: lead.telefoon ?? null,
    },
  })
}

export function signPartnerPayload(payload: string, key: string): string {
  return createHmac('sha256', key).update(payload).digest('hex')
}

export async function deliverPartnerWebhook(input: {
  leadId: string
  payloadBody: string
  partner: PartnerEndpoint
  fetchImpl?: typeof fetch
}): Promise<{
  ok: boolean
  status: number | null
  error: string | null
  payloadBody: string
  signature: string
}> {
  const fetchImpl = input.fetchImpl ?? fetch
  const body = input.payloadBody
  const signature = signPartnerPayload(body, input.partner.api_key_hash)
  try {
    const response = await fetchImpl(input.partner.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-WEP-Signature': signature,
        'X-WEP-Version': '1.0',
        'X-WEP-Lead-ID': input.leadId,
      },
      body,
      signal: AbortSignal.timeout(10_000),
    })
    return {
      ok: response.ok,
      status: response.status,
      error: response.ok ? null : `HTTP ${response.status}`,
      payloadBody: body,
      signature,
    }
  } catch (error) {
    return {
      ok: false,
      status: null,
      error: error instanceof Error ? error.message : String(error),
      payloadBody: body,
      signature,
    }
  }
}

export function nextDeliveryState(
  attempts: number,
  error: string,
  nowMs = Date.now(),
): DeliveryState {
  const delay = RETRY_DELAYS_SECONDS[attempts - 1] ?? null
  return {
    status: delay === null ? 'failed' : 'pending_retry',
    attempts,
    last_error: error,
    next_retry_at: delay === null
      ? null
      : new Date(nowMs + delay * 1000).toISOString(),
  }
}
```

- [ ] **Step 4: Prepare durable partner rows before asynchronous sending**

In `lib/webhooks.ts`, remove the local signer and payload builder. Split preparation from network sending so the lead route can await durable queue writes without waiting on partner HTTP:

```ts
import {
  buildPartnerPayload,
  deliverPartnerWebhook,
  nextDeliveryState,
  type PartnerEndpoint,
  type StoredLeadForWebhook,
} from '@/lib/webhook-delivery'

export interface PreparedPartnerDelivery {
  leadId: string
  partner: PartnerEndpoint
  payloadBody: string
}
```

`preparePartnerDeliveries(leadId)` fetches the stored lead, enforces the unchanged GDPR gate, filters active partners, and returns `PreparedPartnerDelivery[]`. For each eligible partner, it must perform the following upsert before adding the item to the returned array:

```ts
const payloadBody = buildPartnerPayload(lead as StoredLeadForWebhook)
const payloadSignature = signPartnerPayload(payloadBody, partner.api_key_hash)
const { error: queueError } = await supabaseAdmin
  .from('webhook_deliveries')
  .upsert({
    lead_id: leadId,
    partner_id: partner.id,
    partner_naam: partner.naam,
    webhook_url: partner.webhook_url,
    status: 'pending_retry',
    attempts: 0,
    last_error: null,
    next_retry_at: new Date().toISOString(),
    delivered_at: null,
    payload_body: payloadBody,
    payload_signature: payloadSignature,
  }, { onConflict: 'lead_id,partner_id' })

if (queueError) {
  console.error('[webhooks] delivery queue insert failed:', queueError.message)
  continue
}
prepared.push({
  leadId: lead.id,
  payloadBody,
  partner: partner as PartnerEndpoint,
})
```

`dispatchPreparedPartnerDeliveries(prepared)` performs the external HTTP calls and updates those existing rows. Its loop is:

```ts
for (const preparedDelivery of prepared) {
  const { leadId, payloadBody, partner } = preparedDelivery

const result = await deliverPartnerWebhook({
  leadId,
  payloadBody,
  partner,
})

if (result.ok) {
  dispatched++
  await supabaseAdmin.from('webhook_deliveries').upsert({
    lead_id: leadId,
    partner_id: partner.id,
    partner_naam: partner.naam,
    webhook_url: partner.webhook_url,
    status: 'delivered',
    attempts: 1,
    last_error: null,
    next_retry_at: null,
    delivered_at: new Date().toISOString(),
    payload_body: result.payloadBody,
    payload_signature: result.signature,
  }, { onConflict: 'lead_id,partner_id' })
} else {
  await supabaseAdmin.from('webhook_deliveries').upsert({
    lead_id: leadId,
    partner_id: partner.id,
    partner_naam: partner.naam,
    webhook_url: partner.webhook_url,
    payload_body: result.payloadBody,
    payload_signature: result.signature,
    ...nextDeliveryState(1, result.error ?? 'Onbekende webhookfout'),
  }, { onConflict: 'lead_id,partner_id' })
  }
}
```

After the loop, update `leads.b2b_export_status` using the delivered count, preserving the current semantics. Do not rebuild payload bytes in the send phase.

- [ ] **Step 5: Make bulk-buyer dispatch load the stored lead**

Change its signature:

```ts
export async function dispatchToBulkBuyer(leadId: string): Promise<void> {
  const { data: lead, error } = await supabaseAdmin
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single()
  if (error || !lead) {
    console.error('[webhooks/bulk] Lead niet gevonden:', leadId)
    return
  }

  const url = process.env.BULK_BUYER_URL
  const apiKey = process.env.BULK_BUYER_API_KEY
  if (!url || !apiKey) return
  if (!lead.gdpr_consent) {
    console.warn('[webhooks/bulk] Lead zonder GDPR consent — overgeslagen')
    return
  }

  const payload = JSON.stringify({
    event: 'lead.new',
    timestamp: lead.created_at ?? new Date().toISOString(),
    lead_id: lead.id,
    naam: lead.naam,
    email: lead.email,
    telefoon: lead.telefoon,
    adres: lead.adres,
    postcode: lead.postcode,
    stad: lead.stad,
    provincie: lead.provincie,
    health_score: lead.health_score,
    netcongestie: lead.netcongestie_status,
    roi: lead.roi_berekening,
    gdpr_consent: true,
  })

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: payload,
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) {
      console.error('[webhooks/bulk] Bulk inkoper responded', response.status)
    }
  } catch (dispatchError) {
    console.error('[webhooks/bulk] Error:', dispatchError)
  }
}
```

In `app/api/leads/route.ts`, await preparation before constructing the response, then replace both unawaited `.catch(...)` calls with Next.js 16 `after`. Configure enough duration for partner timeouts:

```ts
import { after } from 'next/server'
import {
  dispatchPreparedPartnerDeliveries,
  preparePartnerDeliveries,
} from '@/lib/webhooks'

export const maxDuration = 60

const preparedPartnerDeliveries = await preparePartnerDeliveries(lead.id)

after(async () => {
  const outcomes = await Promise.allSettled([
    dispatchPreparedPartnerDeliveries(preparedPartnerDeliveries),
    dispatchToBulkBuyer(lead.id),
  ])
  outcomes.forEach((outcome, index) => {
    if (outcome.status === 'rejected') {
      console.error(
        index === 0
          ? '[api/leads] partner dispatch error'
          : '[api/leads] bulk buyer dispatch error',
        outcome.reason,
      )
    }
  })
})
```

`after` is bounded by the route’s `maxDuration`; it is not a durable queue. Durability comes from awaiting every `pending_retry` insert, with exact payload bytes, before the response can finish. If the callback never starts or is cut off, the daily retry route can still process those due rows.

- [ ] **Step 6: Run unit tests and typecheck**

Run:

```powershell
npm run test:unit -- tests/unit/webhook-delivery.spec.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Version-control checkpoint**

If commits are authorized:

```powershell
git add lib/webhook-delivery.ts lib/webhooks.ts app/api/leads/route.ts tests/unit/webhook-delivery.spec.ts
git commit -m "fix: share signed webhook delivery logic"
```

---

### Task 6: Persist and replay exact retry payloads

**Files:**

- Modify: `app/api/webhooks/retry/route.ts:1-57`
- Modify: `vercel.json:1-16`
- Modify: `tests/unit/webhook-delivery.spec.ts`
- Create with Supabase CLI: `supabase/migrations/<generated>_webhook_retry_payload.sql`

- [ ] **Step 1: Add a regression test for retry inputs**

Extend the delivery test to serialize once, mutate the source lead, and prove the stored body still replays byte-for-byte:

```ts
test('a retry replays the persisted body and a valid signature', async () => {
  const captures: Array<{ body: string; signature: string | null }> = []
  const fetchImpl: typeof fetch = async (input, init) => {
    const request = new Request(input, init)
    captures.push({
      body: await request.text(),
      signature: request.headers.get('x-wep-signature'),
    })
    return new Response(null, { status: 204 })
  }
  const storedBody = buildPartnerPayload(lead)
  await deliverPartnerWebhook({
    leadId: lead.id,
    payloadBody: storedBody,
    partner,
    fetchImpl,
  })
  lead.roi_berekening = { changed_after_initial_send: true }
  await deliverPartnerWebhook({
    leadId: lead.id,
    payloadBody: storedBody,
    partner,
    fetchImpl,
  })
  expect(captures[1]).toEqual(captures[0])
  expect(captures[0].signature).toBe(
    signPartnerPayload(storedBody, partner.api_key_hash),
  )
})
```

- [ ] **Step 2: Add the backward-compatible payload migration**

```sql
ALTER TABLE webhook_deliveries
  ADD COLUMN IF NOT EXISTS payload_body TEXT,
  ADD COLUMN IF NOT EXISTS payload_signature TEXT;
```

First run `npx supabase migration new webhook_retry_payload` and put the SQL in the generated file; do not hand-invent its timestamp. The existing partial index `idx_webhook_deliveries_retry` already covers due retries, so do not add a duplicate. Apply this migration before deploying code that writes either column. Existing rows remain nullable and use the legacy rebuild path once; every newly created delivery stores the exact body. The existing `ON DELETE CASCADE` lead foreign key ensures stored contact payloads are erased by the GDPR delete flow.

- [ ] **Step 3: Replace the retry loop**

Use a relational reload rather than the stale stored URL:

```ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  buildPartnerPayload,
  deliverPartnerWebhook,
  nextDeliveryState,
  type PartnerEndpoint,
  type StoredLeadForWebhook,
} from '@/lib/webhook-delivery'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: Request) {
  if (!process.env.CRON_SECRET ||
      req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { data: pending, error: pendingError } = await supabaseAdmin
    .from('webhook_deliveries')
    .select('id, lead_id, partner_id, attempts, payload_body')
    .eq('status', 'pending_retry')
    .lte('next_retry_at', new Date().toISOString())
    .order('next_retry_at', { ascending: true })
    .limit(50)

  if (pendingError) {
    console.error('[webhooks/retry] query failed:', pendingError.message)
    return NextResponse.json({ error: 'retry_query_failed' }, { status: 500 })
  }

  let delivered = 0
  let rescheduled = 0
  let failed = 0

  for (const delivery of pending ?? []) {
    const [{ data: lead }, { data: partner }] = await Promise.all([
      supabaseAdmin.from('leads').select('*').eq('id', delivery.lead_id).maybeSingle(),
      supabaseAdmin
        .from('b2b_partners')
        .select('id, naam, webhook_url, api_key_hash, actief')
        .eq('id', delivery.partner_id)
        .maybeSingle(),
    ])

    const attempts = delivery.attempts + 1
    if (!lead || !partner || !partner.actief) {
      await supabaseAdmin.from('webhook_deliveries').update({
        status: 'failed',
        attempts,
        last_error: !lead ? 'lead_not_found' : 'partner_inactive_or_not_found',
        next_retry_at: null,
      }).eq('id', delivery.id)
      failed++
      continue
    }

    const payloadBody = delivery.payload_body
      ?? buildPartnerPayload(lead as StoredLeadForWebhook)
    const result = await deliverPartnerWebhook({
      leadId: delivery.lead_id,
      payloadBody,
      partner: partner as PartnerEndpoint,
    })

    if (result.ok) {
      await supabaseAdmin.from('webhook_deliveries').update({
        status: 'delivered',
        attempts,
        last_error: null,
        delivered_at: new Date().toISOString(),
        next_retry_at: null,
        payload_body: result.payloadBody,
        payload_signature: result.signature,
      }).eq('id', delivery.id)
      delivered++
      continue
    }

    const next = nextDeliveryState(
      attempts,
      result.error ?? 'Onbekende webhookfout',
    )
    await supabaseAdmin.from('webhook_deliveries')
      .update({
        ...next,
        payload_body: result.payloadBody,
        payload_signature: result.signature,
      })
      .eq('id', delivery.id)
    if (next.status === 'failed') failed++
    else rescheduled++
  }

  console.info('[webhooks/retry] completed', {
    processed: pending?.length ?? 0,
    delivered,
    rescheduled,
    failed,
  })
  return NextResponse.json({
    processed: pending?.length ?? 0,
    delivered,
    rescheduled,
    failed,
  })
}
```

- [ ] **Step 4: Align documentation with the Hobby cron**

Keep the existing once-daily `/api/webhooks/retry` entry in `vercel.json`. `RETRY_DELAYS_SECONDS` is deliberately `[24h, 48h, 96h]`, so operational behavior and documentation agree. Record this in `CLAUDE.md`; a future Vercel-plan upgrade may introduce a more frequent cron and shorter delays together.

- [ ] **Step 5: Verify authorization and shared delivery tests**

Run:

```powershell
npm run test:unit -- tests/unit/webhook-delivery.spec.ts
npm run typecheck
```

Expected: PASS.

With a local server and no bearer token:

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/webhooks/retry" -SkipHttpErrorCheck
```

Expected: HTTP 401.

- [ ] **Step 6: Version-control checkpoint**

If commits are authorized:

```powershell
git add app/api/webhooks/retry/route.ts lib/webhook-delivery.ts supabase/migrations/*_webhook_retry_payload.sql vercel.json tests/unit/webhook-delivery.spec.ts CLAUDE.md
git commit -m "fix: resend complete signed webhook retries"
```

---

### Task 7: Reject abusive vision payloads before AI usage

**Files:**

- Modify: `app/api/vision/route.ts:9-38`
- Modify: `components/funnel/PhotoUpload.tsx:48-50,120`
- Create: `tests/unit/vision-input.spec.ts`
- Create: `lib/vision-input.ts`

- [ ] **Step 1: Write failing validation tests**

```ts
import { expect, test } from '@playwright/test'
import { parseVisionInput, VisionInputError } from '@/lib/vision-input'

const jpeg = Buffer.from('valid-test-image'.repeat(20)).toString('base64')

test('accepts supported data URLs', () => {
  expect(parseVisionInput({
    type: 'meterkast',
    imageBase64: `data:image/jpeg;base64,${jpeg}`,
  })).toMatchObject({
    type: 'meterkast',
    mimeType: 'image/jpeg',
  })
})

test('rejects SVG and malformed base64', () => {
  expect(() => parseVisionInput({
    type: 'meterkast',
    imageBase64: `data:image/svg+xml;base64,${jpeg}`,
  })).toThrow(VisionInputError)
  expect(() => parseVisionInput({
    type: 'meterkast',
    imageBase64: 'data:image/jpeg;base64,%%%not-base64%%%',
  })).toThrow(VisionInputError)
})

test('rejects more than 3 MiB decoded', () => {
  const oversized = Buffer.alloc(3 * 1024 * 1024 + 1).toString('base64')
  expect(() => parseVisionInput({
    type: 'omvormer',
    imageBase64: `data:image/webp;base64,${oversized}`,
  })).toThrow(/3 MiB/)
})
```

- [ ] **Step 2: Implement the pure validator**

```ts
export type VisionType = 'meterkast' | 'plaatsingslocatie' | 'omvormer'
export type VisionMime = 'image/jpeg' | 'image/png' | 'image/webp'

const TYPES = new Set<VisionType>(['meterkast', 'plaatsingslocatie', 'omvormer'])
const MIMES = new Set<VisionMime>(['image/jpeg', 'image/png', 'image/webp'])
const MAX_BYTES = 3 * 1024 * 1024

export class VisionInputError extends Error {}

export function parseVisionInput(raw: unknown): {
  type: VisionType
  base64Data: string
  mimeType: VisionMime
} {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new VisionInputError('Ongeldige aanvraag')
  }
  const body = raw as Record<string, unknown>
  if (typeof body.type !== 'string' || !TYPES.has(body.type as VisionType)) {
    throw new VisionInputError('Ongeldig analysetype')
  }
  if (typeof body.imageBase64 !== 'string') {
    throw new VisionInputError('imageBase64 is vereist')
  }
  const match = /^data:([^;]+);base64,([A-Za-z0-9+/]+={0,2})$/.exec(body.imageBase64)
  if (!match || !MIMES.has(match[1] as VisionMime)) {
    throw new VisionInputError('Alleen JPEG, PNG en WebP zijn toegestaan')
  }
  const decoded = Buffer.from(match[2], 'base64')
  if (decoded.length < 100) throw new VisionInputError('Afbeelding is te klein')
  if (decoded.length > MAX_BYTES) throw new VisionInputError('Afbeelding is te groot (max 3 MiB)')
  if (decoded.toString('base64').replace(/=+$/, '') !== match[2].replace(/=+$/, '')) {
    throw new VisionInputError('Afbeelding bevat ongeldige base64')
  }
  return {
    type: body.type as VisionType,
    base64Data: match[2],
    mimeType: match[1] as VisionMime,
  }
}
```

- [ ] **Step 3: Use the validator before invoking AI**

In `app/api/vision/route.ts`:

```ts
import { parseVisionInput, VisionInputError } from '@/lib/vision-input'

let input
try {
  input = parseVisionInput(await request.json())
} catch (error) {
  if (error instanceof VisionInputError) {
    return Response.json({ error: error.message }, { status: 400 })
  }
  return Response.json({ error: 'Ongeldig JSON body' }, { status: 400 })
}

const { type, base64Data, mimeType } = input
```

Keep the existing `VisionScreeningError` 422 behavior and analysis dispatch.

- [ ] **Step 4: Compress practical camera files below the request ceiling**

Create `components/funnel/prepare-vision-image.ts` with:

```ts
export const MAX_VISION_SOURCE_BYTES = 10 * 1024 * 1024
export const MAX_VISION_UPLOAD_BYTES = 3 * 1024 * 1024

export async function prepareVisionImage(file: File): Promise<string>
```

Reject source MIME outside JPEG/PNG/WebP and source files over 10 MB. Decode with `createImageBitmap`, preserve aspect ratio, and draw to an in-memory canvas. Try maximum dimensions `1600`, `1280`, then `1024` pixels and JPEG qualities `0.85`, `0.72`, then `0.6`; return the first `data:image/jpeg;base64,...` whose blob is at most 3 MiB. Revoke/close decoded resources in `finally`. If no attempt fits, throw the Dutch error “Afbeelding kon niet klein genoeg worden gemaakt.”

In `PhotoUpload.tsx`, keep the visible source limit at `max 10 MB`, restrict the file picker and MIME check to JPEG/PNG/WebP, and call `prepareVisionImage(file)` instead of reading the original file directly. Show “Foto optimaliseren…” while this runs. Base64 expands bytes by roughly one third, so 3 MiB decoded stays below Vercel’s 4.5 MB function request-body limit after JSON overhead.

- [ ] **Step 5: Run unit tests and typecheck**

Run:

```powershell
npm run test:unit -- tests/unit/vision-input.spec.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Version-control checkpoint**

If commits are authorized:

```powershell
git add lib/vision-input.ts app/api/vision/route.ts components/funnel/prepare-vision-image.ts components/funnel/PhotoUpload.tsx tests/unit/vision-input.spec.ts
git commit -m "fix: bound vision requests before AI calls"
```

---

### Task 8: Add the CI quality gate

**Files:**

- Create: `.github/workflows/ci.yml`
- Modify: `playwright.config.ts:3-29`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Make Playwright CI-safe**

```ts
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 1,
  forbidOnly: Boolean(process.env.CI),
  workers: process.env.CI ? 2 : undefined,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
  },
  // Preserve current projects.
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
```

- [ ] **Step 2: Create the workflow**

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  quality:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    env:
      NEXT_PUBLIC_SUPABASE_URL: https://example.supabase.co
      NEXT_PUBLIC_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.signature
      SUPABASE_SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.signature
      MAPBOX_ACCESS_TOKEN: pk.ci-placeholder
      LEAD_REPORT_HMAC_SECRET: ci-only-not-a-production-secret
      CRON_SECRET: ci-only-cron-secret
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm run test:unit
      - run: npm run build

  core-e2e:
    needs: quality
    runs-on: ubuntu-latest
    timeout-minutes: 20
    env:
      CI: "true"
      NEXT_PUBLIC_SUPABASE_URL: https://example.supabase.co
      NEXT_PUBLIC_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.signature
      SUPABASE_SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.signature
      MAPBOX_ACCESS_TOKEN: pk.ci-placeholder
      LEAD_REPORT_HMAC_SECRET: ci-only-not-a-production-secret
      CRON_SECRET: ci-only-cron-secret
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e:core
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: |
            playwright-report/
            test-results/
          retention-days: 7
```

- [ ] **Step 3: Run the full local gate**

Run:

```powershell
npm run typecheck
npm run test:unit
npm run build
npm run test:e2e:core
```

Expected: all four commands exit 0. Do not claim CI readiness if the build only passes with real production secrets.

- [ ] **Step 4: Update project memory**

Add concise sections to `CLAUDE.md` documenting:

- client `healthScore` and `roiResult` are display data; persisted values come from `roiInput` and server calculation;
- initial partner work runs through Next.js `after`, but every delivery is durably inserted before HTTP because `after` remains bounded by route duration;
- webhook retry persists the exact serialized body, reloads the active partner, derives a fresh HMAC from that same body, and uses `lib/webhook-delivery.ts`;
- the once-daily retry cron and `[24h, 48h, 96h]` backoff compromise;
- `npm run typecheck`, `npm run test:unit`, and `npm run test:e2e:core`;
- CI intentionally uses non-secret placeholder credentials and does not contact production systems.

- [ ] **Step 5: Final verification checkpoint**

Run:

```powershell
git diff --check
npm run typecheck
npm run test:unit
npm run build
npm run test:e2e:core
```

Expected: no whitespace errors and all commands pass.

- [ ] **Step 6: Request code review**

Use `superpowers:requesting-code-review` and review this phase against:

- exact signed webhook body/headers on retry;
- no client-supplied score/result used for partner filters;
- truthful `emailStatus`;
- no production network writes in CI;
- no consent-gate regression.

- [ ] **Step 7: Version-control checkpoint**

If commits are authorized:

```powershell
git add .github/workflows/ci.yml playwright.config.ts package.json CLAUDE.md
git commit -m "ci: gate builds with core verification"
```

---

## Phase acceptance

This plan is complete only when:

- a failed partner delivery is recreated with an identical body, valid HMAC, and all WEP headers;
- every initial partner delivery is recorded as due before the first external HTTP call;
- retry failure advances attempts and next retry time in both HTTP-error and thrown-error paths;
- partner filtering reads the server-derived `health_score` stored in `leads`;
- forged `healthScore` or `roiResult` request properties do not affect stored calculations;
- malformed/oversized lead and vision payloads fail before expensive work;
- the lead API returns `emailStatus`;
- typecheck, unit tests, build, and core Chromium E2E are enforced in CI;
- `CLAUDE.md` matches deployed behavior.

