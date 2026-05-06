import { test, expect } from '@playwright/test'

// Alleen desktop — mobile-chrome project vereist volledige `playwright install` op sommige Windows-setup
test.use({ ...require('@playwright/test').devices['Desktop Chrome'] })

/** Vaste UUID voor route-mock; hoeft niet in Supabase te bestaan. */
const MOCK_LEAD_ID = '11111111-1111-4111-8111-111111111111'
const MOCK_LEAD_API_PATH = `/api/leads/${MOCK_LEAD_ID}`
/** Token in URL triggert dezelfde fetch als productie (`?token=`); waarde wordt door de mock genegeerd. */
const MOCK_URL_TOKEN = 'e2e-mock-token'

/** Minimaal geldige `roiResult` volgens `parseStoredRoi` (client + server). */
const validRoiResult = {
  geschatVerbruikKwh: 3500,
  aantalPanelen: 12,
  productieKwh: 4200,
  eigenGebruikPct: 45,
  scenarioNu: {
    naam: 'Huidige situatie',
    beschrijving: 'Test',
    besparingJaarEur: 850,
    investeringEur: 11000,
    terugverdientijdJaar: 12,
  },
  scenarioMetBatterij: {
    naam: 'Met batterij',
    beschrijving: 'Test',
    besparingJaarEur: 1200,
    investeringEur: 22000,
    terugverdientijdJaar: 18,
  },
  scenarioWachten: {
    naam: 'Wachten',
    beschrijving: 'Test',
    besparingJaarEur: 200,
    investeringEur: 0,
    terugverdientijdJaar: 99,
  },
  shockEffect2027: {
    jaarlijksVerlies: 240,
    cumulatiefVerlies5Jaar: 1200,
    maandelijksVerlies: 20,
    boodschap: 'Einde saldering treft uw opbrengst.',
  },
  aanbeveling: 'panelen' as const,
  aanbevelingTekst: 'Testadvies voor Playwright.',
  isdeSchatting: { bedragEur: 0, apparaatType: '—', vermogenKwp: 0 },
}

test.describe('Email leadId rapport-hydratie', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.removeItem('wep_funnel_state')
      } catch {
        /* ignore */
      }
    })
  })

  test('?leadId= laadt mock-API en toont volledig rapport (non-zero)', async ({ page }) => {
    test.setTimeout(60_000)
    await page.route(
      (url: URL) => url.pathname === MOCK_LEAD_API_PATH,
      async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            leadId: MOCK_LEAD_ID,
            adres: 'Speelstraat 99, 1234 AB Mockstad',
            wijk: '',
            stad: '',
            bagData: null,
            netcongestie: null,
            healthScore: null,
            roiResult: validRoiResult,
            meterkastAnalyse: null,
            plaatsingsAnalyse: null,
            omvormerAnalyse: null,
            isEigenaar: true,
            heeftPanelen: false,
            huidigePanelenAantal: null,
            dakrichting: null,
            verbruik_bron: 'schatting',
            huishouden_grootte: null,
          }),
        })
      },
    )

    await page.goto(
      `/check?leadId=${MOCK_LEAD_ID}&token=${encodeURIComponent(MOCK_URL_TOKEN)}`,
      { waitUntil: 'domcontentloaded', timeout: 45_000 },
    )

    await expect(page.locator('text=Uw SaldeerScan rapport')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('text=Speelstraat 99')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('text=Jaarlijks saldeer-verlies na 1 januari 2027')).toBeVisible()
    await expect(page.locator('div.text-5xl.font-mono').first()).toContainText('240', { timeout: 12_000 })
    await expect(page.locator('text=Vorige sessie gevonden')).toHaveCount(0)
  })

  test('?leadId= bij 404 toont fouttekst, geen dashboard', async ({ page }) => {
    await page.route(
      (url: URL) => url.pathname === MOCK_LEAD_API_PATH,
      async route => {
        await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' })
      },
    )

    await page.goto(
      `/check?leadId=${MOCK_LEAD_ID}&token=${encodeURIComponent(MOCK_URL_TOKEN)}`,
      { waitUntil: 'domcontentloaded', timeout: 45_000 },
    )

    await expect(page.locator('text=Rapport niet gevonden')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('text=Uw SaldeerScan rapport')).toHaveCount(0)
  })
})
