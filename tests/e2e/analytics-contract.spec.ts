import { expect, test, type Page } from '@playwright/test'
import { expectedReportFixture } from '../fixtures/report'
import { FUNNEL_STATE_STEP6 } from '../fixtures/funnel-state'
import { seedFunnelAtInternalStep } from './fixtures/funnel-state'

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
    __captureGtag: (...args: unknown[]) => void
  }
}

type GtagCall = [command: string, name: string, params?: Record<string, unknown>]

const canonicalEvents = new Set([
  'address_entry_start',
  'address_suggestion_selected',
  'address_entry_submit',
  'funnel_session_started',
  'funnel_stage_viewed',
  'funnel_stage_completed',
  'bag_match_succeeded',
  'bag_match_failed',
  'technical_scan_completed',
  'technical_scan_skipped',
  'technical_module_skipped',
  'lead_submit_started',
  'lead_submit_succeeded',
  'lead_submit_failed',
  'funnel_abandoned',
  'report_reopened',
  'pdf_generation_started',
  'pdf_open_succeeded',
  'pdf_generation_failed',
  'web_vital',
])

const funnelEvents = new Set([
  'funnel_session_started',
  'funnel_stage_viewed',
  'funnel_stage_completed',
  'bag_match_succeeded',
  'bag_match_failed',
  'technical_scan_completed',
  'technical_scan_skipped',
  'technical_module_skipped',
  'lead_submit_started',
  'lead_submit_succeeded',
  'lead_submit_failed',
  'funnel_abandoned',
])

const stageEvents = new Set([
  'funnel_session_started',
  'funnel_stage_viewed',
  'funnel_stage_completed',
  'funnel_abandoned',
])

const forbiddenKeys = /(^|_)(name|naam|email|telefoon|phone|address|adres|token|lead_id)($|_)/i
const safeContractKeys = new Set(['email_status', 'metric_name'])
const knownAddress = 'Prinsengracht 263, Amsterdam'
const knownName = 'Jan de Vries'
const knownEmail = 'jan.contract@example.nl'
const knownPhone = '0612345678'
const knownLeadId = '22222222-2222-4222-8222-222222222222'
const knownReportToken = 'analytics-contract-report-token'
const knownPii = [knownAddress, knownName, knownEmail, knownPhone, knownLeadId, knownReportToken]

async function captureGtag(page: Page) {
  const calls: GtagCall[] = []
  await page.exposeFunction('__captureGtag', (...args: unknown[]) => {
    calls.push(args as GtagCall)
  })
  await page.addInitScript(() => {
    window.gtag = (...args: unknown[]) => {
      void window.__captureGtag(...args)
    }
  })
  return calls
}

function trackedEvents(calls: GtagCall[]): GtagCall[] {
  return calls.filter(([command]) => command === 'event')
}

function eventCalls(calls: GtagCall[], name: string): GtagCall[] {
  return trackedEvents(calls).filter(([, eventName]) => eventName === name)
}

function expectCanonicalEvents(calls: GtagCall[]) {
  for (const [, name] of trackedEvents(calls)) {
    expect(canonicalEvents, `onbekende analytics-eventnaam: ${name}`).toContain(name)
  }
}

function expectFunnelContext(calls: GtagCall[]) {
  for (const [, name, params = {}] of trackedEvents(calls)) {
    if (!funnelEvents.has(name)) continue
    expect(params.funnel_session_id, `${name}: funnel_session_id`).toEqual(expect.any(String))
    expect(params.landing_path, `${name}: landing_path`).toEqual(expect.any(String))
    expect(params.pseo_level, `${name}: pseo_level`).toEqual(expect.any(String))
    if (stageEvents.has(name)) {
      expect(params.funnel_stage, `${name}: funnel_stage`).toEqual(expect.any(Number))
    }
  }
}

function expectNoPii(calls: GtagCall[]) {
  for (const [, , params = {}] of trackedEvents(calls)) {
    expect(
      Object.keys(params).some(key => !safeContractKeys.has(key) && forbiddenKeys.test(key)),
    ).toBe(false)
    const serialized = JSON.stringify(params).toLowerCase()
    for (const value of knownPii) {
      expect(serialized).not.toContain(value.toLowerCase())
    }
  }
}

async function resumeSavedFunnel(page: Page) {
  await page.getByRole('button', { name: 'Doorgaan', exact: true }).click()
}

async function fillLeadForm(page: Page) {
  await page.locator('#lead-naam').fill(knownName)
  await page.locator('#lead-email').fill(knownEmail)
  await page.locator('#lead-telefoon').fill(knownPhone)
  await page.locator('#lead-gdpr').click({ force: true })
}

test('address entry uses canonical names without exposing the selected address', async ({ page }) => {
  const calls = await captureGtag(page)
  await page.route('**/api/bag/suggest**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{ id: 'bag-contract-address', label: knownAddress }]),
  }))
  await page.route('**/api/bag?**', route => route.fulfill({
    status: 404,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'Niet gevonden' }),
  }))

  await page.goto('/')
  await page.getByRole('combobox', { name: 'Uw adres' }).fill(knownAddress)
  await page.getByRole('option', { name: knownAddress }).click()
  await page.getByRole('button', { name: 'Bekijk mijn inzicht' }).click()

  await expect(page).toHaveURL(/\/check\?/)
  await expect.poll(() => eventCalls(calls, 'address_entry_submit').length).toBe(1)
  expect(eventCalls(calls, 'address_entry_start')).toHaveLength(1)
  expect(eventCalls(calls, 'address_suggestion_selected')).toHaveLength(1)
  expectCanonicalEvents(calls)
  expectFunnelContext(calls)
  expectNoPii(calls)
})

test('BAG success and failure include only coarse location context', async ({ page }) => {
  const calls = await captureGtag(page)
  let shouldSucceed = false
  await page.route('**/api/bag/suggest**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{ id: 'bag-contract-address', label: knownAddress }]),
  }))
  await page.route('**/api/bag?**', route => route.fulfill({
    status: shouldSucceed ? 200 : 404,
    contentType: 'application/json',
    body: JSON.stringify(shouldSucceed ? {
      bouwjaar: 1880,
      oppervlakte: 120,
      woningtype: 'Appartement',
      postcode: '1016GV',
      huisnummer: 263,
      dakOppervlakte: 45,
      lat: 52.3676,
      lon: 4.8897,
    } : { error: 'Niet gevonden' }),
  }))
  await page.route('**/api/netcongestie**', route => route.fulfill({ status: 503, body: '{}' }))

  await page.goto('/check?landing_path=%2Fanalytics-contract&pseo_level=wijk&wijk=Centrum&stad=Amsterdam')
  const input = page.getByRole('combobox', { name: 'Uw adres' })
  await input.fill(knownAddress)
  await page.getByRole('button', { name: knownAddress }).click()
  await page.getByRole('button', { name: 'Adres Analyseren' }).click()
  await expect.poll(() => eventCalls(calls, 'bag_match_failed').length).toBe(1)

  shouldSucceed = true
  await page.getByRole('button', { name: 'Adres Analyseren' }).click()
  await expect(page.getByText('Uw woning is gevonden')).toBeVisible()
  await expect.poll(() => eventCalls(calls, 'bag_match_succeeded').length).toBe(1)

  const successParams = eventCalls(calls, 'bag_match_succeeded')[0][2]
  expect(successParams?.postcode_prefix).toBe('1016')
  expect(eventCalls(calls, 'bag_match_failed')[0][2]?.reason).toBe('not_found')
  expectCanonicalEvents(calls)
  expectFunnelContext(calls)
  expectNoPii(calls)
})

test('technical complete and individual skip events preserve the four-stage context', async ({ page }) => {
  const calls = await captureGtag(page)
  await seedFunnelAtInternalStep(page, 3, {
    funnelSessionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    attribution: {
      ...FUNNEL_STATE_STEP6.attribution,
      landingPath: '/analytics-contract',
      pseoLevel: 'wijk',
      wijk: 'Centrum',
      stad: 'Amsterdam',
    },
  })
  await page.goto('/check')
  await resumeSavedFunnel(page)

  await page.getByRole('button', { name: 'Geen foto? Vul handmatig in' }).click()
  await page.getByRole('button', { name: '3-fase' }).click()
  await page.getByRole('button', { name: '4+' }).click()
  await page.getByRole('button', { name: 'Doorgaan', exact: true }).click()
  await page.getByRole('button', { name: /Overslaan/ }).click()
  await page.getByRole('button', { name: /Overslaan/ }).click()

  await expect(page.getByRole('progressbar', { name: /Stadium 4 van 4: Ontvang uw rapport/ })).toBeVisible()
  expect(eventCalls(calls, 'technical_scan_completed')[0][2]).toMatchObject({
    scan_type: 'Meterkast',
    completion: 'manual',
  })
  expect(eventCalls(calls, 'technical_scan_skipped')).toHaveLength(2)
  expect(eventCalls(calls, 'funnel_stage_completed').at(-1)?.[2]?.completed_stage).toBe(3)
  expectCanonicalEvents(calls)
  expectFunnelContext(calls)
  expectNoPii(calls)
})

test('skipping every technical scan emits the module skip and one abandonment', async ({ page }) => {
  const calls = await captureGtag(page)
  await seedFunnelAtInternalStep(page, 3, {
    funnelSessionId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    meterkastAnalyse: null,
    plaatsingsAnalyse: null,
  })
  await page.goto('/check')
  await resumeSavedFunnel(page)

  for (let index = 0; index < 3; index += 1) {
    await page.getByRole('button', { name: /Overslaan/ }).click()
  }
  await page.evaluate(() => {
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false }))
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false }))
  })

  expect(eventCalls(calls, 'technical_scan_skipped')).toHaveLength(3)
  expect(eventCalls(calls, 'technical_module_skipped')).toHaveLength(1)
  expect(eventCalls(calls, 'funnel_abandoned')).toHaveLength(1)
  expectCanonicalEvents(calls)
  expectFunnelContext(calls)
  expectNoPii(calls)
})

test('lead submission reports failure and success without lead contact data', async ({ page }) => {
  const calls = await captureGtag(page)
  let attempt = 0
  await page.route('**/api/leads', async route => {
    if (route.request().method() !== 'POST') return route.continue()
    attempt += 1
    if (attempt === 1) {
      return route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Tijdelijk niet beschikbaar' }),
      })
    }
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        leadId: knownLeadId,
        reportToken: knownReportToken,
        emailStatus: 'sent',
        report: { ...expectedReportFixture, leadId: knownLeadId },
      }),
    })
  })
  await seedFunnelAtInternalStep(page, 6, {
    funnelSessionId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  })
  await page.goto('/check')
  await resumeSavedFunnel(page)
  await fillLeadForm(page)

  await page.getByRole('button', { name: /Stuur mij het gratis PDF-rapport/ }).click()
  await expect.poll(() => eventCalls(calls, 'lead_submit_failed').length).toBe(1)
  expect(eventCalls(calls, 'lead_submit_failed')[0][2]?.failure_type).toBe('http_503')

  await page.getByRole('button', { name: /Stuur mij het gratis PDF-rapport/ }).click()
  await expect(page.getByTestId('report-root')).toBeVisible()
  await expect.poll(() => eventCalls(calls, 'lead_submit_succeeded').length).toBe(1)
  expect(eventCalls(calls, 'lead_submit_succeeded')[0][2]).toMatchObject({
    lead_quality_segment: 'unknown',
    email_status: 'sent',
  })
  expect(eventCalls(calls, 'lead_submit_started')).toHaveLength(2)
  expectCanonicalEvents(calls)
  expectFunnelContext(calls)
  expectNoPii(calls)
})

test('tokenized report hydration and PDF success/failure keep identifiers out of analytics', async ({ page }) => {
  test.setTimeout(60_000)
  const calls = await captureGtag(page)
  await page.addInitScript(() => {
    window.open = () => ({
      location: { href: '' },
      close: () => undefined,
    }) as unknown as Window
    URL.createObjectURL = () => 'blob:analytics-contract-pdf'
    URL.revokeObjectURL = () => undefined
  })
  await page.route(`**/api/leads/${knownLeadId}**`, route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      leadId: knownLeadId,
      report: { ...expectedReportFixture, leadId: knownLeadId },
    }),
  }))

  await page.goto(`/check?leadId=${knownLeadId}&token=${knownReportToken}`)
  await expect(page.getByTestId('report-root')).toBeVisible()
  await expect.poll(() => eventCalls(calls, 'report_reopened').length).toBe(1)
  expect(Object.keys(eventCalls(calls, 'report_reopened')[0][2] ?? {}).sort())
    .toEqual(['email_status', 'report_version'])

  const pdfButton = page.getByRole('button', { name: /PDF-rapport/ })
  await pdfButton.click()
  await expect.poll(() => eventCalls(calls, 'pdf_open_succeeded').length).toBe(1)
  await page.evaluate(() => {
    URL.createObjectURL = () => { throw new Error('PDF URL rejected') }
  })
  await pdfButton.click()
  await expect.poll(() => eventCalls(calls, 'pdf_generation_failed').length).toBe(1)

  expect(eventCalls(calls, 'pdf_generation_started')).toHaveLength(2)
  expectCanonicalEvents(calls)
  expectFunnelContext(calls)
  expectNoPii(calls)
})

test('Web Vitals expose only metric fields required by the contract', async ({ page }) => {
  const calls = await captureGtag(page)
  await page.goto('/')
  await expect.poll(() => eventCalls(calls, 'web_vital').length, { timeout: 15_000 })
    .toBeGreaterThan(0)

  const payload = eventCalls(calls, 'web_vital')[0][2]
  expect(payload?.metric_name).toEqual(expect.any(String))
  expect(payload?.metric_value).toEqual(expect.any(Number))
  expect(payload?.metric_rating).toMatch(/good|needs-improvement|poor/)
  expectCanonicalEvents(calls)
  expectNoPii(calls)
})
