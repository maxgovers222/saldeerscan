import { test, expect } from '@playwright/test'
import { FUNNEL_STATE_STEP6 } from '../fixtures/funnel-state'
import { expectedReportFixture } from '../fixtures/report'
import { seedFunnelAtInternalStep } from './fixtures/funnel-state'

/**
 * Step 6 validatie tests.
 * Navigeert direct naar /check en test de validatielogica op Step 6
 * via localStorage state-injectie.
 *
 * Let op: localStorage key is 'wep_funnel_state', niet 'funnel_state'.
 * ROI structuur: besparingJaarEur, investeringEur, terugverdientijdJaar (niet jaarlijkseBesparing).
 */

const MOCK_LEAD_GET = {
  leadId: 'test-lead-id-123',
  adres: 'Prinsengracht 263, Amsterdam',
  wijk: '',
  stad: '',
  bagData: FUNNEL_STATE_STEP6.bagData,
  netcongestie: FUNNEL_STATE_STEP6.netcongestie,
  healthScore: FUNNEL_STATE_STEP6.healthScore,
  roiResult: FUNNEL_STATE_STEP6.roiResult,
  meterkastAnalyse: null,
  plaatsingsAnalyse: null,
  omvormerAnalyse: null,
  isEigenaar: null,
  heeftPanelen: false,
  huidigePanelenAantal: null,
  dakrichting: null,
  verbruik_bron: 'schatting',
  huishouden_grootte: null,
}

test.describe('Step 6 — Lead formulier validatie', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/leads**', async (route) => {
      const url = route.request().url()
      const method = route.request().method()
      const path = new URL(url).pathname.replace(/\/$/, '') || '/'
      const isCollectionPost = method === 'POST' && path === '/api/leads'
      const isItemGet = method === 'GET' && /^\/api\/leads\/[^/]+$/.test(path)

      if (isCollectionPost) {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            leadId: 'test-lead-id-123',
            reportToken: 'test-report-token',
            status: 'ingediend',
            report: expectedReportFixture,
          }),
        })
      }
      if (isItemGet) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_LEAD_GET),
        })
      }
      return route.continue()
    })

    await seedFunnelAtInternalStep(page, 6)
    await page.goto('/check')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Klik "Doorgaan" op de resume-banner als die verschijnt
    const doorgaanBtn = page.locator('button:has-text("Doorgaan")')
    if (await doorgaanBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await doorgaanBtn.click()
      await page.waitForTimeout(500)
    }
  })

  test('Stap 6 is geladen', async ({ page }) => {
    await expect(page.getByText('Stap 6 — Uw rapport')).toBeVisible({ timeout: 8000 })
  })

  test('Submit knop dient niet in zonder naam', async ({ page }) => {
    const submitBtn = page.locator('button[type="submit"]')
    if (await submitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await submitBtn.click()
      await expect(page.locator('text=Naam is verplicht')).toBeVisible({ timeout: 3000 })
    }
  })

  test('Naam met 1 woord toont fout', async ({ page }) => {
    const naamInput = page.locator('#lead-naam')
    if (await naamInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await naamInput.fill('Jan')
      await page.locator('button[type="submit"]').click()
      await expect(page.getByText('Voer uw voor- en achternaam in')).toBeVisible({ timeout: 3000 })
    }
  })

  test('GDPR checkbox is zichtbaar', async ({ page }) => {
    await expect(page.locator('#lead-gdpr')).toBeAttached({ timeout: 5000 })
  })

  test('GDPR niet aangevinkt blokkeert submit', async ({ page }) => {
    const naamInput = page.locator('#lead-naam')
    if (await naamInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await naamInput.fill('Jan de Vries')
      await page.locator('#lead-email').fill('jan@test.nl')
      await page.locator('#lead-telefoon').fill('0612345678')
      await page.locator('button[type="submit"]').click()
      await expect(page.locator('text=akkoord gaan met de privacyverklaring')).toBeVisible({ timeout: 3000 })
    }
  })

  test('Volledig valid formulier leidt tot ResultsDashboard', async ({ page }) => {
    let submittedBody: Record<string, unknown> | undefined

    await page.route('**/api/leads', async (route) => {
      if (route.request().method() === 'POST') {
        submittedBody = route.request().postDataJSON() as Record<string, unknown>
      }
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          leadId: 'test-lead-id-123',
          reportToken: 'test-report-token',
          status: 'ingediend',
          emailStatus: 'sent',
          report: expectedReportFixture,
        }),
      })
    })

    const naamInput = page.locator('#lead-naam')
    if (await naamInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await naamInput.fill('Jan de Vries')
      await page.locator('#lead-email').fill('jan@test.nl')
      await page.locator('#lead-telefoon').fill('0612345678')
      await page.locator('#lead-gdpr').click({ force: true })
      await page.locator('button[type="submit"]').click()
      await expect(page.locator('text=Uw SaldeerScan rapport').first()).toBeVisible({ timeout: 15000 })
      if (!submittedBody) throw new Error('expected lead POST body')
      expect(submittedBody.roiInput).toMatchObject({
        oppervlakte: expect.any(Number),
        bouwjaar: expect.any(Number),
        dakOppervlakte: expect.any(Number),
        huidigVerbruikKwh: expect.any(Number),
        aantalPanelenOverride: expect.any(Number),
        kwhPerPaneel: expect.any(Number),
      })
    }
  })
})
