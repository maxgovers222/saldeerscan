/**
 * Diepe funnel-test suite — alle 6 stappen + edge-cases.
 *
 * Alleen chromium — mobile-chrome heeft een cold-start race met Turbopack
 * die los staat van testlogica.
 *
 * Let op:
 *   - localStorage key: 'wep_funnel_state'
 *   - ROI API response: { roi: ROIResult, health: HealthScoreResult }
 *   - Suggest response: Array<{ label: string; id: string }>
 *   - StepHeader stap-prop = "Stap N — Naam"; gebruik step TITLE-tekst voor asserts
 */
import { test, expect, type Page } from '@playwright/test'

// Alleen chromium — mobile cold-start timing is infra-issue, geen testlogica
test.use({ ...require('@playwright/test').devices['Desktop Chrome'] })

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_SUGGEST = [
  { label: 'Prinsengracht 263, 1016 GV Amsterdam', id: 'mock-id-1' },
  { label: 'Prinsengracht 123, 1015 DX Amsterdam', id: 'mock-id-2' },
]

const MOCK_BAG = {
  adres: 'Prinsengracht 263, Amsterdam',
  postcode: '1016GV',
  huisnummer: 263,
  lat: 52.3676,
  lon: 4.8897,
  bouwjaar: 1975,
  oppervlakte: 110,
  woningtype: 'Tussenwoning',
  dakOppervlakte: 45,
  energielabel: 'D',
}

const MOCK_NETCONGESTIE_GROEN = {
  status: 'GROEN',
  netbeheerder: 'Liander',
  uitleg: 'Net heeft voldoende capaciteit',
  terugleveringBeperkt: false,
  postcodePrefix: '1016',
}

const MOCK_ROI_RESULT = {
  geschatVerbruikKwh: 3500,
  aantalPanelen: 8,
  productieKwh: 2800,
  eigenGebruikPct: 65,
  scenarioNu: {
    naam: 'Alleen panelen',
    beschrijving: 'Installeer alleen zonnepanelen nu',
    besparingJaarEur: 650,
    investeringEur: 6200,
    terugverdientijdJaar: 9.5,
  },
  scenarioMetBatterij: {
    naam: 'Panelen + Batterij',
    beschrijving: 'Optimale combo voor 2027',
    besparingJaarEur: 820,
    investeringEur: 10500,
    terugverdientijdJaar: 12.8,
  },
  scenarioWachten: {
    naam: 'Wachten tot 2027',
    beschrijving: 'Risico op verlies saldering',
    besparingJaarEur: 0,
    investeringEur: 0,
    terugverdientijdJaar: 99,
  },
  shockEffect2027: {
    jaarlijksVerlies: 580,
    cumulatiefVerlies5Jaar: 2900,
    maandelijksVerlies: 48,
    boodschap: 'Saldering vervalt volledig op 1 januari 2027',
  },
  aanbeveling: 'beide',
  aanbevelingTekst: 'Combinatie panelen + batterij geeft hoogste ROI',
  isdeSchatting: { bedragEur: 2400, apparaatType: 'Thuisbatterij', vermogenKwp: 3.2 },
}

const MOCK_HEALTH = {
  score: 74,
  label: 'Goed',
  kleur: 'geel',
  breakdown: { bouwjaar: 20, energielabel: 15, dakpotentieel: 25, netcongestie: 14 },
  aanbevelingen: ['Overweeg thuisbatterij voor optimale ROI'],
}

const LS_KEY = 'wep_funnel_state'

function makeState(overrides: Record<string, unknown> = {}) {
  return {
    step: 6 as const,
    adres: 'Prinsengracht 263, Amsterdam',
    wijk: '',
    stad: '',
    bagData: {
      bouwjaar: 1975,
      oppervlakte: 110,
      woningtype: 'Tussenwoning',
      postcode: '1016GV',
      huisnummer: 263,
      dakOppervlakte: 45,
      lat: 52.3676,
      lon: 4.8897,
    },
    netcongestie: MOCK_NETCONGESTIE_GROEN,
    healthScore: MOCK_HEALTH,
    roiResult: MOCK_ROI_RESULT,
    meterkastAnalyse: null,
    plaatsingsAnalyse: null,
    omvormerAnalyse: null,
    dakrichting: null,
    verbruik_bron: 'schatting',
    huishouden_grootte: null,
    is_eigenaar: null,
    heeft_panelen: false,
    huidige_panelen_aantal: null,
    leadId: null,
    leadReportToken: null,
    loading: false,
    error: null,
    utmParams: null,
    ...overrides,
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function setLS(page: Page, state: object) {
  await page.evaluate(
    ([k, v]) => localStorage.setItem(k as string, JSON.stringify(v)),
    [LS_KEY, state],
  )
}

async function setupMocks(page: Page) {
  // Volgorde belangrijk: LIFO — laatste registratie heeft hoogste prioriteit.
  // Suggestie-handler moet HOGERE prioriteit hebben dan de algemene bag-handler.
  await page.route('/api/bag**', (route) => {
    // Sla suggest over — wordt hieronder apart afgehandeld
    if (route.request().url().includes('/suggest')) return route.continue()
    return route.fulfill({ json: MOCK_BAG })
  })
  // Registreer suggest NA de algemene handler → hogere LIFO-prioriteit
  await page.route('/api/bag/suggest**', (route) =>
    route.fulfill({ json: MOCK_SUGGEST }),
  )
  await page.route('/api/netcongestie**', (route) =>
    route.fulfill({ json: MOCK_NETCONGESTIE_GROEN }),
  )
  await page.route('/api/roi**', (route) =>
    route.fulfill({ json: { roi: MOCK_ROI_RESULT, health: MOCK_HEALTH } }),
  )
  await page.route('/api/health-score**', (route) =>
    route.fulfill({ json: MOCK_HEALTH }),
  )
  await page.route('/api/leads**', async (route) => {
    if (route.request().method() !== 'GET') {
      return route.fulfill({ json: { leadId: 'test-lead-abc123', success: true } })
    }
    const u = route.request().url()
    const m = u.match(/\/api\/leads\/([^/?]+)/)
    const lid = m?.[1] ?? 'unknown'
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockLeadHydrateBody(lid, MOCK_NETCONGESTIE_GROEN)),
    })
  })
}

function mockLeadHydrateBody(
  leadId: string,
  netcongestie: typeof MOCK_NETCONGESTIE_GROEN,
) {
  return {
    leadId,
    adres: 'Prinsengracht 263, Amsterdam',
    wijk: '',
    stad: '',
    bagData: MOCK_BAG,
    netcongestie,
    healthScore: MOCK_HEALTH,
    roiResult: MOCK_ROI_RESULT,
    meterkastAnalyse: null,
    plaatsingsAnalyse: null,
    omvormerAnalyse: null,
    isEigenaar: null,
    heeftPanelen: null,
    huidigePanelenAantal: null,
    dakrichting: null,
    verbruik_bron: 'schatting',
    huishouden_grootte: null,
  }
}

/** Navigeer naar /check en wacht tot adresinput zichtbaar is */
async function gotoCheck(page: Page) {
  await page.goto('/check')
  await page.waitForSelector(
    'input[placeholder*="Prinsengracht"], input[placeholder*="Bijv"]',
    { timeout: 20000 },
  )
}

/**
 * Injecteer state, herlaad, herstel via resume-banner als die verschijnt.
 * Wacht daarna tot verwachte stap-indicator zichtbaar is.
 */
async function gotoStep(page: Page, step: number, stateOverrides: Record<string, unknown> = {}) {
  await setupMocks(page)
  await page.goto('/check')
  await page.waitForLoadState('domcontentloaded')
  await setLS(page, makeState({ step, ...stateOverrides }))
  await page.reload()
  await page.waitForLoadState('domcontentloaded')
  // Wacht tot de Doorgaan-knop verschijnt (React hydration + localStorage useEffect)
  // Gebruik waitForSelector met ruime timeout zodat ook trage cold-starts werken
  try {
    await page.waitForSelector('button:has-text("Doorgaan")', { state: 'visible', timeout: 12000 })
    await page.locator('button:has-text("Doorgaan")').first().click()
    await page.waitForTimeout(600)
  } catch {
    // Banner verscheen niet binnen 12s — state waarschijnlijk al actief via URL param
  }
}

// Unieke h2-titels per stap — robuuster dan 'text=Stap N'
const STEP_TITLE: Record<number, string> = {
  1: 'Voer uw adres in',
  2: 'Uw besparingsanalyse',
  3: 'Meterkast analyse',
  4: 'Locatie beoordeling',
  5: 'Omvormer compatibiliteit',
  6: 'gratis PDF-rapport',
}

async function expectStep(page: Page, step: number) {
  await expect(page.locator(`text=${STEP_TITLE[step]}`).first()).toBeVisible({ timeout: 6000 })
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. STAP 1 — Adresverificatie
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Stap 1 — Adresverificatie', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page)
    await gotoCheck(page)
  })

  test('toont stap-1 titel "Voer uw adres in"', async ({ page }) => {
    await expect(page.locator('text=Voer uw adres in')).toBeVisible({ timeout: 8000 })
  })

  test('adresinput is zichtbaar en interactief', async ({ page }) => {
    const input = page.locator('input[placeholder*="Prinsengracht"]').first()
    await expect(input).toBeVisible()
    await expect(input).toBeEditable()
  })

  test('Analyseren-knop is uitgeschakeld zonder geselecteerd adres', async ({ page }) => {
    const btn = page.locator('button:has-text("Adres Analyseren")').first()
    await expect(btn).toBeDisabled()
  })

  test('autocomplete dropdown verschijnt na 3+ tekens', async ({ page }) => {
    const input = page.locator('input[placeholder*="Prinsengracht"]').first()
    await input.fill('Pri')
    await page.waitForTimeout(400)
    await expect(page.locator('text=Prinsengracht 263').first()).toBeVisible({ timeout: 6000 })
  })

  test('dropdown toont maximaal 8 suggesties', async ({ page }) => {
    const input = page.locator('input[placeholder*="Prinsengracht"]').first()
    await input.fill('Pri')
    await page.waitForTimeout(400)
    // Dropdowncontainer verschijnt
    await page.locator('text=Prinsengracht 263').first().waitFor({ timeout: 5000 })
    // Aantal buttons in dropdown ≤ 8
    const items = page.locator('[class*="bg-slate-900"] [class*="border-b"] button, [class*="bg-slate-900"] button[type="button"]')
    const cnt = await items.count()
    expect(cnt).toBeLessThanOrEqual(8)
  })

  test('dropdown sluit door buiten te klikken', async ({ page }) => {
    const input = page.locator('input[placeholder*="Prinsengracht"]').first()
    await input.fill('Pri')
    await page.waitForTimeout(400)
    await page.locator('text=Prinsengracht 263').first().waitFor({ timeout: 5000 })
    // Klik op de paginatitel — ver buiten de dropdown-container
    await page.locator('h2').first().click()
    await page.waitForTimeout(400)
    await expect(page.locator('text=Prinsengracht 263').first()).not.toBeVisible({ timeout: 3000 })
  })

  test('selecteren van suggestie activeert de Analyseren-knop', async ({ page }) => {
    const input = page.locator('input[placeholder*="Prinsengracht"]').first()
    await input.fill('Pri')
    await page.waitForTimeout(400)
    await page.locator('text=Prinsengracht 263').first().click()
    await expect(page.locator('button:has-text("Adres Analyseren")').first()).toBeEnabled({ timeout: 3000 })
  })

  test('selecteren van suggestie toont emerald vinkje in input', async ({ page }) => {
    const input = page.locator('input[placeholder*="Prinsengracht"]').first()
    await input.fill('Pri')
    await page.waitForTimeout(400)
    await page.locator('text=Prinsengracht 263').first().click()
    // Groene vinkje-div verschijnt naast de input
    const checkmark = page.locator('.bg-emerald-500\\/80, [class*="emerald-500"]').first()
    await expect(checkmark).toBeVisible({ timeout: 3000 })
  })

  test('hint "Selecteer een adres" verschijnt bij 3+ tekens zonder selectie', async ({ page }) => {
    await page.locator('input[placeholder*="Prinsengracht"]').first().fill('Pri')
    await page.waitForTimeout(400)
    await expect(page.locator('text=Selecteer een adres')).toBeVisible({ timeout: 5000 })
  })

  test('na BAG-analyse: bouwjaar 1975 zichtbaar', async ({ page }) => {
    await page.locator('input[placeholder*="Prinsengracht"]').first().fill('Pri')
    await page.waitForTimeout(400)
    await page.locator('text=Prinsengracht 263').first().click()
    await page.locator('button:has-text("Adres Analyseren")').first().click()
    await expect(page.locator('text=1975')).toBeVisible({ timeout: 12000 })
  })

  test('na BAG-analyse: woningtype Tussenwoning zichtbaar', async ({ page }) => {
    await page.locator('input[placeholder*="Prinsengracht"]').first().fill('Pri')
    await page.waitForTimeout(400)
    await page.locator('text=Prinsengracht 263').first().click()
    await page.locator('button:has-text("Adres Analyseren")').first().click()
    await expect(page.locator('text=Tussenwoning')).toBeVisible({ timeout: 12000 })
  })

  test('na BAG-analyse: netcongestie GROEN badge zichtbaar', async ({ page }) => {
    await page.locator('input[placeholder*="Prinsengracht"]').first().fill('Pri')
    await page.waitForTimeout(400)
    await page.locator('text=Prinsengracht 263').first().click()
    await page.locator('button:has-text("Adres Analyseren")').first().click()
    await expect(page.locator('text=Vrij stroomnet')).toBeVisible({ timeout: 12000 })
    await expect(page.locator('text=Liander')).toBeVisible()
  })

  test('na BAG-analyse: health score 74/100 zichtbaar', async ({ page }) => {
    await page.locator('input[placeholder*="Prinsengracht"]').first().fill('Pri')
    await page.waitForTimeout(400)
    await page.locator('text=Prinsengracht 263').first().click()
    await page.locator('button:has-text("Adres Analyseren")').first().click()
    await expect(page.locator('text=74/100')).toBeVisible({ timeout: 12000 })
  })

  test('na BAG-analyse: "Bekijk besparingsanalyse" navigeert naar stap 2', async ({ page }) => {
    await page.locator('input[placeholder*="Prinsengracht"]').first().fill('Pri')
    await page.waitForTimeout(400)
    await page.locator('text=Prinsengracht 263').first().click()
    await page.locator('button:has-text("Adres Analyseren")').first().click()
    await expect(page.locator('text=Bekijk besparingsanalyse')).toBeVisible({ timeout: 12000 })
    await page.locator('text=Bekijk besparingsanalyse').click()
    await expectStep(page, 2)
  })

  test('AnalysisLoading-spinner toont tijdens vertraagde fetch', async ({ page }) => {
    // Registreer eerst de trage handler, dan suggest (LIFO: suggest heeft hogere prioriteit)
    await page.route('/api/bag**', async (route) => {
      if (route.request().url().includes('/suggest')) return route.continue()
      await new Promise((r) => setTimeout(r, 800))
      await route.fulfill({ json: MOCK_BAG })
    })
    await page.route('/api/bag/suggest**', (route) => route.fulfill({ json: MOCK_SUGGEST }))
    await page.locator('input[placeholder*="Prinsengracht"]').first().fill('Pri')
    await page.waitForTimeout(400)
    await page.locator('text=Prinsengracht 263').first().click()
    await page.locator('button:has-text("Adres Analyseren")').first().click()
    // .first() voorkomt strict mode violation (button + ancestors bevatten beide de tekst)
    await expect(page.locator('text=Analyseren...').first()).toBeVisible({ timeout: 4000 })
  })

  test('BAG 404 toont errorbericht', async ({ page }) => {
    // Registreer eerst de error-handler, dan suggest (LIFO: suggest heeft hogere prioriteit)
    await page.route('/api/bag**', async (route) => {
      if (route.request().url().includes('/suggest')) return route.continue()
      return route.fulfill({ status: 404, json: { error: 'Adres niet gevonden in BAG' } })
    })
    await page.route('/api/bag/suggest**', (route) => route.fulfill({ json: MOCK_SUGGEST }))
    await page.locator('input[placeholder*="Prinsengracht"]').first().fill('Pri')
    await page.waitForTimeout(400)
    await page.locator('text=Prinsengracht 263').first().click()
    await page.locator('button:has-text("Adres Analyseren")').first().click()
    await expect(page.locator('text=Adres niet gevonden')).toBeVisible({ timeout: 10000 })
  })

  test('netcongestie ROOD toont "Net vol" badge', async ({ page }) => {
    await page.route('/api/netcongestie**', (route) =>
      route.fulfill({ json: { ...MOCK_NETCONGESTIE_GROEN, status: 'ROOD', netbeheerder: 'Enexis' } }),
    )
    await page.locator('input[placeholder*="Prinsengracht"]').first().fill('Pri')
    await page.waitForTimeout(400)
    await page.locator('text=Prinsengracht 263').first().click()
    await page.locator('button:has-text("Adres Analyseren")').first().click()
    await expect(page.locator('text=Net vol')).toBeVisible({ timeout: 12000 })
    await expect(page.locator('text=Enexis')).toBeVisible()
  })

  test('netcongestie ORANJE toont "Druk stroomnet" badge', async ({ page }) => {
    await page.route('/api/netcongestie**', (route) =>
      route.fulfill({ json: { ...MOCK_NETCONGESTIE_GROEN, status: 'ORANJE', netbeheerder: 'Stedin' } }),
    )
    await page.locator('input[placeholder*="Prinsengracht"]').first().fill('Pri')
    await page.waitForTimeout(400)
    await page.locator('text=Prinsengracht 263').first().click()
    await page.locator('button:has-text("Adres Analyseren")').first().click()
    await expect(page.locator('text=Druk stroomnet')).toBeVisible({ timeout: 12000 })
  })

  test('invoer wijzigen na selectie reset de selectie', async ({ page }) => {
    const input = page.locator('input[placeholder*="Prinsengracht"]').first()
    await input.fill('Pri')
    await page.waitForTimeout(400)
    await page.locator('text=Prinsengracht 263').first().click()
    await expect(page.locator('button:has-text("Adres Analyseren")').first()).toBeEnabled()
    await input.fill('Keizersgracht')
    await expect(page.locator('button:has-text("Adres Analyseren")').first()).toBeDisabled()
  })

  test('debounce: niet meer dan 2 suggest-verzoeken bij snel typen', async ({ page }) => {
    let callCount = 0
    await page.route('/api/bag/suggest**', (route) => {
      callCount++
      return route.fulfill({ json: MOCK_SUGGEST })
    })
    const input = page.locator('input[placeholder*="Prinsengracht"]').first()
    await input.type('Prins', { delay: 40 })
    await page.waitForTimeout(500)
    expect(callCount).toBeLessThanOrEqual(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. STAP 2 — ROI Berekening
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Stap 2 — ROI Berekening', () => {
  test.beforeEach(async ({ page }) => {
    await gotoStep(page, 2)
  })

  test('toont stap-2 titel "Uw besparingsanalyse"', async ({ page }) => {
    await expectStep(page, 2)
  })

  test('drie sliders aanwezig (verbruik, dak, panelen)', async ({ page }) => {
    await expect(page.locator('input[type="range"][aria-label="Huidig verbruik"]')).toBeVisible({ timeout: 6000 })
    await expect(page.locator('input[type="range"][aria-label="Dakoppervlak"]')).toBeVisible()
    await expect(page.locator('input[type="range"][aria-label="Zonnepanelen (scenario)"]')).toBeVisible()
  })

  test('paneeltype select heeft 3 opties', async ({ page }) => {
    const select = page.locator('select').first()
    await expect(select).toBeVisible({ timeout: 6000 })
    await expect(select.locator('option')).toHaveCount(3)
  })

  test('dakrichting-pills aanwezig (Zuid, Oost/West, Noord, Onbekend)', async ({ page }) => {
    await expect(page.locator('button:has-text("Zuid")')).toBeVisible({ timeout: 6000 })
    await expect(page.locator('button:has-text("Oost/West")')).toBeVisible()
    await expect(page.locator('button:has-text("Noord")')).toBeVisible()
    await expect(page.locator('button:has-text("Onbekend")')).toBeVisible()
  })

  test('Noord-dak toont waarschuwing ~57%', async ({ page }) => {
    await page.locator('button:has-text("Noord")').click()
    await expect(page.locator('text=Noord-dak levert ~57%')).toBeVisible({ timeout: 4000 })
  })

  test('Zuid-dak toont positieve boodschap', async ({ page }) => {
    await page.locator('button:has-text("Zuid")').click()
    await expect(page.locator('text=Zuid-dak: optimale opbrengst')).toBeVisible({ timeout: 4000 })
  })

  test('dakrichting toggle: opnieuw klikken deselecteert', async ({ page }) => {
    await page.locator('button:has-text("Zuid")').click()
    await expect(page.locator('text=Zuid-dak: optimale opbrengst')).toBeVisible()
    await page.locator('button:has-text("Zuid")').click()
    await expect(page.locator('text=Zuid-dak: optimale opbrengst')).not.toBeVisible({ timeout: 3000 })
  })

  test('drie scenario-cards tonen (Nu, Batterij, Wachten)', async ({ page }) => {
    await expect(page.locator('text=Alleen panelen')).toBeVisible({ timeout: 6000 })
    await expect(page.locator('text=Panelen + Batterij')).toBeVisible()
    await expect(page.locator('text=Wachten tot 2027')).toBeVisible()
  })

  test('"Aanbevolen" badge aanwezig op batterij-scenario', async ({ page }) => {
    await expect(page.locator('text=Aanbevolen')).toBeVisible({ timeout: 6000 })
  })

  test('besparing/jaar getal aanwezig in scenario Nu', async ({ page }) => {
    // Drie scenario-cards bevatten elk "Besparing/jaar" — gebruik .first() voor strict mode
    await expect(page.locator('text=Besparing/jaar').first()).toBeVisible({ timeout: 6000 })
    // Controleer dat het getal 650 aanwezig is in de scenario-sectie
    await expect(page.locator('text=Alleen panelen').locator('..').locator('text=650')).toBeVisible({ timeout: 6000 })
  })

  test('terugverdientijd 99 toont streepje "—"', async ({ page }) => {
    await expect(page.locator('text=Alleen panelen')).toBeVisible({ timeout: 6000 })
    const wachtenCard = page.locator('text=Wachten tot 2027').locator('../..')
    await expect(wachtenCard.locator('text=—')).toBeVisible()
  })

  test('Shock2027Banner aanwezig', async ({ page }) => {
    await expect(page.locator('text=2027 Urgentie')).toBeVisible({ timeout: 6000 })
  })

  test('panelen=0 toont adviesblok', async ({ page }) => {
    const slider = page.locator('input[type="range"][aria-label="Zonnepanelen (scenario)"]')
    await expect(slider).toBeVisible({ timeout: 6000 })
    // Gebruik keyboard om slider naar 0 te zetten
    await slider.focus()
    await slider.press('Home') // springt naar minimum (0)
    await page.waitForTimeout(700)
    await expect(page.locator('text=adviseren wij')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Gebruik aanbevolen aantal')).toBeVisible()
  })

  test('"Gebruik aanbevolen aantal" brengt scenario-cards terug', async ({ page }) => {
    const slider = page.locator('input[type="range"][aria-label="Zonnepanelen (scenario)"]')
    await expect(slider).toBeVisible({ timeout: 6000 })
    await slider.focus()
    await slider.press('Home')
    await page.waitForTimeout(700)
    await page.locator('text=Gebruik aanbevolen aantal').click()
    await expect(page.locator('text=Alleen panelen')).toBeVisible({ timeout: 6000 })
  })

  test('Terug-knop navigeert naar stap 1', async ({ page }) => {
    await page.locator('button:has-text("← Terug")').first().click()
    await expectStep(page, 1)
  })

  test('Volgende-knop navigeert naar stap 3', async ({ page }) => {
    await expect(page.locator('text=Meterkast scannen →')).toBeVisible({ timeout: 6000 })
    await page.locator('text=Meterkast scannen →').click()
    await expectStep(page, 3)
  })

  test('"Geschat o.b.v." label aanwezig bij verbruik-slider', async ({ page }) => {
    await expect(page.locator('text=Geschat o.b.v.')).toBeVisible({ timeout: 6000 })
  })

  test('productie en eigengebruik stats aanwezig', async ({ page }) => {
    await expect(page.locator('text=Productie').first()).toBeVisible({ timeout: 6000 })
    await expect(page.locator('text=Eigengebruik').first()).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. STAP 3 — Meterkast
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Stap 3 — Meterkast handmatig pad', () => {
  test.beforeEach(async ({ page }) => {
    await gotoStep(page, 3)
  })

  test('toont stap-3 titel "Meterkast analyse"', async ({ page }) => {
    await expectStep(page, 3)
  })

  test('foto-tip aanwezig', async ({ page }) => {
    await expect(page.locator('text=Open de kast volledig')).toBeVisible({ timeout: 6000 })
  })

  test('"Geen foto? Vul handmatig in" zichtbaar', async ({ page }) => {
    await expect(page.locator('button:has-text("Geen foto? Vul handmatig in")')).toBeVisible({ timeout: 6000 })
  })

  test('klikken handmatig toont FallbackMeterkast', async ({ page }) => {
    await page.locator('button:has-text("Geen foto? Vul handmatig in")').click()
    await expect(page.locator('text=Wat voor aansluiting heeft u?')).toBeVisible({ timeout: 4000 })
    await expect(page.locator('button:has-text("1-fase")')).toBeVisible()
    await expect(page.locator('button:has-text("3-fase")')).toBeVisible()
  })

  test('FallbackMeterkast: Doorgaan uitgeschakeld zonder beide selecties', async ({ page }) => {
    await page.locator('button:has-text("Geen foto? Vul handmatig in")').click()
    // Doorgaan knop in de fallback (niet de resume-banner)
    const btn = page.locator('button:has-text("Doorgaan")').last()
    await expect(btn).toBeDisabled({ timeout: 4000 })
  })

  test('FallbackMeterkast: Doorgaan uitgeschakeld met alleen fase', async ({ page }) => {
    await page.locator('button:has-text("Geen foto? Vul handmatig in")').click()
    await page.locator('button:has-text("3-fase")').click()
    await expect(page.locator('button:has-text("Doorgaan")').last()).toBeDisabled()
  })

  test('FallbackMeterkast: Doorgaan ingeschakeld na beide selecties', async ({ page }) => {
    await page.locator('button:has-text("Geen foto? Vul handmatig in")').click()
    await page.locator('button:has-text("3-fase")').click()
    await page.locator('button:has-text("4+")').click()
    await expect(page.locator('button:has-text("Doorgaan")').last()).toBeEnabled({ timeout: 2000 })
  })

  test('FallbackMeterkast: 0 groepen → niet geschikt', async ({ page }) => {
    // Doorgaan in FallbackMeterkast dispatcht SET_STEP(4) → ga terug om resultaat te zien
    await page.locator('button:has-text("Geen foto? Vul handmatig in")').click()
    await page.locator('button:has-text("1-fase")').click()
    await page.locator('button').filter({ hasText: '0' }).first().click()
    await page.locator('button:has-text("Doorgaan")').last().click()
    // Stap 4 verschijnt, ga terug naar stap 3 om MeterkastResultaat te zien
    await expectStep(page, 4)
    await page.locator('button:has-text("← Terug")').first().click()
    await expect(page.locator('text=Niet direct geschikt').first()).toBeVisible({ timeout: 6000 })
  })

  test('FallbackMeterkast: 4+ groepen → geschikt voor installatie', async ({ page }) => {
    await page.locator('button:has-text("Geen foto? Vul handmatig in")').click()
    await page.locator('button:has-text("3-fase")').click()
    await page.locator('button:has-text("4+")').click()
    await page.locator('button:has-text("Doorgaan")').last().click()
    await expectStep(page, 4)
    await page.locator('button:has-text("← Terug")').first().click()
    await expect(page.locator('text=Geschikt voor installatie').first()).toBeVisible({ timeout: 6000 })
  })

  test('na analyse: resultaatkaart toont Merk, 3-fase, Vrije groepen', async ({ page }) => {
    await page.locator('button:has-text("Geen foto? Vul handmatig in")').click()
    await page.locator('button:has-text("3-fase")').click()
    await page.locator('button:has-text("4+")').click()
    await page.locator('button:has-text("Doorgaan")').last().click()
    await expectStep(page, 4)
    await page.locator('button:has-text("← Terug")').first().click()
    await expect(page.locator('text=Merk').first()).toBeVisible({ timeout: 6000 })
    await expect(page.locator('text=Vrije groepen').first()).toBeVisible()
  })

  test('na analyse: "Andere foto uploaden" knop aanwezig', async ({ page }) => {
    await page.locator('button:has-text("Geen foto? Vul handmatig in")').click()
    await page.locator('button:has-text("1-fase")').click()
    await page.locator('button:has-text("4+")').click()
    await page.locator('button:has-text("Doorgaan")').last().click()
    await expectStep(page, 4)
    await page.locator('button:has-text("← Terug")').first().click()
    await expect(page.locator('text=Andere foto uploaden').first()).toBeVisible({ timeout: 6000 })
  })

  test('Terug navigeert naar stap 2', async ({ page }) => {
    await page.locator('button:has-text("← Terug")').first().click()
    await expectStep(page, 2)
  })

  test('"Overslaan →" navigeert naar stap 4', async ({ page }) => {
    await page.locator('button:has-text("Overslaan →")').click()
    await expectStep(page, 4)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. STAP 4 — Plaatsingslocatie
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Stap 4 — Plaatsingslocatie', () => {
  test.beforeEach(async ({ page }) => {
    await gotoStep(page, 4)
  })

  test('toont stap-4 titel "Locatie beoordeling"', async ({ page }) => {
    await expectStep(page, 4)
  })

  test('NEN 2078:2023 vereisten lijst aanwezig', async ({ page }) => {
    // Twee elementen bevatten "NEN 2078:2023" — gebruik .first()
    await expect(page.locator('text=NEN 2078:2023').first()).toBeVisible({ timeout: 6000 })
    await expect(page.locator('text=Min. 50 cm afstand').first()).toBeVisible()
  })

  test('"Geen foto? Kies voorkeurlocatie" zichtbaar', async ({ page }) => {
    // Wacht op step 4 titel eerst — bevestigt dat de stap correct geladen is
    await expectStep(page, 4)
    await expect(page.locator('button:has-text("Geen foto? Kies voorkeurlocatie")')).toBeVisible({ timeout: 6000 })
  })

  test('FallbackPlaatsing toont 4 locatie-opties', async ({ page }) => {
    await page.locator('button:has-text("Geen foto? Kies voorkeurlocatie")').click()
    await expect(page.locator('button:has-text("Garage")')).toBeVisible({ timeout: 4000 })
    await expect(page.locator('button:has-text("Bijkeuken")')).toBeVisible()
    await expect(page.locator('button:has-text("Kelder")')).toBeVisible()
    await expect(page.locator('button:has-text("Anders")')).toBeVisible()
  })

  test('Garage selecteren navigeert naar stap 5', async ({ page }) => {
    await page.locator('button:has-text("Geen foto? Kies voorkeurlocatie")').click()
    await page.locator('button:has-text("Garage")').click()
    await expectStep(page, 5)
  })

  test('Bijkeuken selecteren navigeert naar stap 5', async ({ page }) => {
    await page.locator('button:has-text("Geen foto? Kies voorkeurlocatie")').click()
    await page.locator('button:has-text("Bijkeuken")').click()
    await expectStep(page, 5)
  })

  test('na Garage: resultaat toont NEN Compliant + score', async ({ page }) => {
    await page.locator('button:has-text("Geen foto? Kies voorkeurlocatie")').click()
    await page.locator('button:has-text("Garage")').click()
    // Terug om resultaat te zien
    await page.locator('button:has-text("← Terug")').first().click()
    await expect(page.locator('text=NEN Compliant')).toBeVisible({ timeout: 6000 })
    await expect(page.locator('text=Score')).toBeVisible()
  })

  test('Terug navigeert naar stap 3', async ({ page }) => {
    await page.locator('button:has-text("← Terug")').first().click()
    await expectStep(page, 3)
  })

  test('"Overslaan →" navigeert naar stap 5', async ({ page }) => {
    await page.locator('button:has-text("Overslaan →")').click()
    await expectStep(page, 5)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. STAP 5 — Omvormer
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Stap 5 — Omvormer', () => {
  test.beforeEach(async ({ page }) => {
    await gotoStep(page, 5)
  })

  test('toont stap-5 titel "Omvormer compatibiliteit"', async ({ page }) => {
    await expectStep(page, 5)
  })

  test('foto-tip aanwezig', async ({ page }) => {
    // Meerdere ancestors bevatten dezelfde text — gebruik .first()
    await expect(page.locator('text=Foto van het label').first()).toBeVisible({ timeout: 6000 })
  })

  test('"Geen foto? Vul handmatig in" zichtbaar', async ({ page }) => {
    await expect(page.locator('button:has-text("Geen foto? Vul handmatig in")')).toBeVisible({ timeout: 6000 })
  })

  test('FallbackOmvormer toont Ja/Nee knoppen', async ({ page }) => {
    await page.locator('button:has-text("Geen foto? Vul handmatig in")').click()
    await expect(page.locator('button:has-text("Ja, ik heb al panelen")')).toBeVisible({ timeout: 4000 })
    await expect(page.locator('button:has-text("Nee, nog niet")')).toBeVisible()
  })

  test('"Nee, nog niet" navigeert naar stap 6', async ({ page }) => {
    await page.locator('button:has-text("Geen foto? Vul handmatig in")').click()
    await page.locator('button:has-text("Nee, nog niet")').click()
    await expectStep(page, 6)
  })

  test('"Ja, ik heb al panelen" navigeert naar stap 6', async ({ page }) => {
    await page.locator('button:has-text("Geen foto? Vul handmatig in")').click()
    await page.locator('button:has-text("Ja, ik heb al panelen")').click()
    await expectStep(page, 6)
  })

  test('"Ja, ik heb al panelen" toont "Vervanging aanbevolen" na terugkeer', async ({ page }) => {
    await page.locator('button:has-text("Geen foto? Vul handmatig in")').click()
    await page.locator('button:has-text("Ja, ik heb al panelen")').click()
    await page.locator('button:has-text("← Terug")').first().click()
    await expect(page.locator('text=Vervanging aanbevolen')).toBeVisible({ timeout: 6000 })
  })

  test('Terug navigeert naar stap 4', async ({ page }) => {
    await page.locator('button:has-text("← Terug")').first().click()
    await expectStep(page, 4)
  })

  test('"Overslaan →" navigeert naar stap 6', async ({ page }) => {
    await page.locator('button:has-text("Overslaan →")').click()
    await expectStep(page, 6)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 6. STAP 6 — Lead Capture
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Stap 6 — Lead formulier', () => {
  test.beforeEach(async ({ page }) => {
    await gotoStep(page, 6)
  })

  test('toont stap-6 titel "gratis PDF-rapport"', async ({ page }) => {
    await expectStep(page, 6)
  })

  test('PDF-rapport preview card aanwezig', async ({ page }) => {
    await expect(page.locator('text=Dit staat in uw PDF-rapport')).toBeVisible({ timeout: 6000 })
    await expect(page.locator('text=ROI-berekening')).toBeVisible()
    await expect(page.locator('text=Netcongestie analyse')).toBeVisible()
  })

  test('ISDE subsidie card aanwezig', async ({ page }) => {
    await expect(page.locator('text=ISDE Subsidie').first()).toBeVisible({ timeout: 6000 })
    await expect(page.locator('text=Thuisbatterij').first()).toBeVisible()
  })

  test('trust signals aanwezig', async ({ page }) => {
    // Elk trust-signal span heeft ancestors met dezelfde text — gebruik .first()
    await expect(page.locator('text=Beveiligd').first()).toBeVisible({ timeout: 6000 })
    await expect(page.locator('text=Lokale installateurs').first()).toBeVisible()
    await expect(page.locator('text=Vrijblijvend').first()).toBeVisible()
  })

  test('kwalificatievraag eigenaar/huurder aanwezig', async ({ page }) => {
    await expect(page.locator('text=Bent u eigenaar van de woning?')).toBeVisible({ timeout: 6000 })
    await expect(page.locator('button:has-text("Ja, eigenaar")')).toBeVisible()
    await expect(page.locator('button:has-text("Nee, huurder")')).toBeVisible()
  })

  test('zonnepanelen-antwoord uit stap 2 wordt getoond', async ({ page }) => {
    // makeState zet heeft_panelen: false — stap 6 toont locked samenvatting i.p.v. opnieuw vragen
    await expect(page.locator('text=Zonnepanelen (stap 2)')).toBeVisible({ timeout: 6000 })
    await expect(page.locator('text=nog geen panelen')).toBeVisible()
    await expect(page.locator('button:has-text("Wijzigen (wordt ook opgeslagen in uw rapport)")')).toBeVisible()
  })

  test('huishoudensgrootte-knoppen aanwezig (1/2/3+)', async ({ page }) => {
    await expect(page.locator('text=Hoeveel personen')).toBeVisible({ timeout: 6000 })
    await expect(page.locator('button:has-text("1 persoon")')).toBeVisible()
    await expect(page.locator('button:has-text("2 personen")')).toBeVisible()
    await expect(page.locator('button:has-text("3+ personen")')).toBeVisible()
  })

  test('eigenaar-toggle markering bij klik op "Ja, eigenaar"', async ({ page }) => {
    const btn = page.locator('button:has-text("Ja, eigenaar")')
    await btn.click()
    await expect(btn).toHaveClass(/amber-500\/15/, { timeout: 2000 })
  })

  test('huishoudensgrootte toggle deselecteert bij tweede klik', async ({ page }) => {
    const btn = page.locator('button:has-text("2 personen")')
    // Wacht expliciet op visibility voor de klik — voorkomt timing-gerelateerde timeouts
    await expect(btn).toBeVisible({ timeout: 8000 })
    await btn.click()
    await expect(btn).toHaveClass(/amber-500\/15/, { timeout: 3000 })
    await btn.click()
    await expect(btn).not.toHaveClass(/amber-500\/15/, { timeout: 3000 })
  })

  test('accordion "Wat gebeurt er na uw aanvraag?" klapt open en dicht', async ({ page }) => {
    const accordionBtn = page.locator('button:has-text("Wat gebeurt er na uw aanvraag?")')
    await expect(accordionBtn).toBeVisible({ timeout: 6000 })
    await accordionBtn.click()
    await expect(page.locator('text=gecertificeerde installateurs in uw regio')).toBeVisible({ timeout: 3000 })
    await accordionBtn.click()
    await expect(page.locator('text=gecertificeerde installateurs in uw regio')).not.toBeVisible({ timeout: 3000 })
  })

  test('formulier naam-, email- en telefooninput aanwezig', async ({ page }) => {
    await expect(page.locator('#lead-naam')).toBeVisible({ timeout: 6000 })
    await expect(page.locator('#lead-email')).toBeVisible()
    await expect(page.locator('#lead-telefoon')).toBeVisible()
  })

  test('landselector heeft NL/BE/DE/LU opties', async ({ page }) => {
    const select = page.locator('select[aria-label="Landcode"]')
    await expect(select).toBeVisible({ timeout: 6000 })
    const opts = await select.locator('option').allTextContents()
    expect(opts.some(o => o.includes('NL'))).toBeTruthy()
    expect(opts.some(o => o.includes('BE'))).toBeTruthy()
    expect(opts.some(o => o.includes('DE'))).toBeTruthy()
    expect(opts.some(o => o.includes('LU'))).toBeTruthy()
  })

  test('GDPR checkbox aanwezig', async ({ page }) => {
    await expect(page.locator('#lead-gdpr')).toBeAttached({ timeout: 6000 })
  })

  test('link naar privacyverklaring aanwezig', async ({ page }) => {
    await expect(page.locator('a[href="/privacy"]')).toBeVisible({ timeout: 6000 })
  })

  // ── Validatie ──

  test('leeg submit toont "Naam is verplicht"', async ({ page }) => {
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('text=Naam is verplicht')).toBeVisible({ timeout: 4000 })
  })

  test('naam met 1 woord toont fout "voor- en achternaam"', async ({ page }) => {
    await page.locator('#lead-naam').fill('Jan')
    await page.locator('button[type="submit"]').click()
    // Exacte error tekst: "Voer uw voor- en achternaam in" (label bevat "Voor- en achternaam" — andere tekst)
    await expect(page.locator('text=Voer uw voor- en achternaam in')).toBeVisible({ timeout: 4000 })
  })

  test('naam met 2+ woorden passeert naam-validatie', async ({ page }) => {
    await page.locator('#lead-naam').fill('Jan de Vries')
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('text=Naam is verplicht')).not.toBeVisible({ timeout: 2000 })
    // Gebruik exacte error tekst zodat het label "Voor- en achternaam *" niet matcht
    await expect(page.locator('text=Voer uw voor- en achternaam in')).not.toBeVisible({ timeout: 2000 })
  })

  test('ongeldig email toont fout', async ({ page }) => {
    await page.locator('#lead-naam').fill('Jan de Vries')
    await page.locator('#lead-email').fill('geen-email')
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('text=geldig e-mailadres')).toBeVisible({ timeout: 4000 })
  })

  test('ongeldig telefoonnummer toont fout', async ({ page }) => {
    await page.locator('#lead-naam').fill('Jan de Vries')
    await page.locator('#lead-email').fill('jan@test.nl')
    await page.locator('#lead-telefoon').fill('123')
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('text=Ongeldig telefoonnummer')).toBeVisible({ timeout: 4000 })
  })

  test('geldig NL nummer toont groen preview', async ({ page }) => {
    // 0612345678 → strip leading 0 → +31612345678
    await page.locator('#lead-telefoon').fill('0612345678')
    await expect(page.locator('text=Geldig nummer').first()).toBeVisible({ timeout: 4000 })
    await expect(page.locator('text=+31612345678').first()).toBeVisible()
  })

  test('wisselen naar BE reset telefoonnummer-veld', async ({ page }) => {
    await page.locator('#lead-telefoon').fill('0612345678')
    await page.locator('select[aria-label="Landcode"]').selectOption('+32')
    expect(await page.locator('#lead-telefoon').inputValue()).toBe('')
  })

  test('geldig BE nummer (+32) geeft groen preview', async ({ page }) => {
    await page.locator('select[aria-label="Landcode"]').selectOption('+32')
    await page.locator('#lead-telefoon').fill('0478123456')
    // Toon groen preview — geen +32 check want die matcht ook hidden <option>
    await expect(page.locator('text=Geldig nummer').first()).toBeVisible({ timeout: 4000 })
    // Normalized: strip leading 0 van 0478123456 → +32478123456
    await expect(page.locator('p:has-text("+32")').first()).toBeVisible({ timeout: 3000 })
  })

  test('GDPR niet aangevinkt blokkeert submit', async ({ page }) => {
    await page.locator('#lead-naam').fill('Jan de Vries')
    await page.locator('#lead-email').fill('jan@test.nl')
    await page.locator('#lead-telefoon').fill('0612345678')
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('text=akkoord gaan met de privacyverklaring')).toBeVisible({ timeout: 4000 })
  })

  test('GDPR-fout verdwijnt na aanvinken', async ({ page }) => {
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('text=akkoord gaan met de privacyverklaring')).toBeVisible({ timeout: 3000 })
    await page.locator('#lead-gdpr').click({ force: true })
    await expect(page.locator('text=akkoord gaan met de privacyverklaring')).not.toBeVisible({ timeout: 2000 })
  })

  test('naam-fout verdwijnt zodra gebruiker typt', async ({ page }) => {
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('text=Naam is verplicht')).toBeVisible({ timeout: 3000 })
    await page.locator('#lead-naam').fill('J')
    await expect(page.locator('text=Naam is verplicht')).not.toBeVisible({ timeout: 2000 })
  })

  test('volledig geldig formulier leidt tot ResultsDashboard', async ({ page }) => {
    // In React 18: dispatch(SET_LEAD_ID) + setSubmitted batchen → FunnelContainer
    // rendert ResultsDashboard direct (SuccessState in Step6 wordt overgeslagen)
    await page.locator('#lead-naam').fill('Maria van der Berg')
    await page.locator('#lead-email').fill('maria@test.nl')
    await page.locator('#lead-telefoon').fill('0687654321')
    await page.locator('#lead-gdpr').click({ force: true })
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('text=Uw SaldeerScan rapport').first()).toBeVisible({ timeout: 12000 })
  })

  test('na submit: ResultsDashboard met ShockChart zichtbaar', async ({ page }) => {
    await page.locator('#lead-naam').fill('Maria van der Berg')
    await page.locator('#lead-email').fill('maria@test.nl')
    await page.locator('#lead-telefoon').fill('0687654321')
    await page.locator('#lead-gdpr').click({ force: true })
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('text=Jaarlijks saldeer-verlies').first()).toBeVisible({ timeout: 12000 })
    await expect(page.locator('text=2024').first()).toBeVisible()
  })

  test('loading-spinner zichtbaar tijdens vertraagde API', async ({ page }) => {
    await page.route('/api/leads**', async (route) => {
      await new Promise((r) => setTimeout(r, 1200))
      await route.fulfill({ json: { leadId: 'delayed-lead', success: true } })
    })
    await page.locator('#lead-naam').fill('Maria van der Berg')
    await page.locator('#lead-email').fill('maria@test.nl')
    await page.locator('#lead-telefoon').fill('0687654321')
    await page.locator('#lead-gdpr').click({ force: true })
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('text=Indienen...')).toBeVisible({ timeout: 4000 })
  })

  test('API 500 toont foutmelding in rood', async ({ page }) => {
    await page.route('/api/leads**', (route) =>
      route.fulfill({ status: 500, json: { error: 'Server tijdelijk niet beschikbaar' } }),
    )
    await page.locator('#lead-naam').fill('Maria van der Berg')
    await page.locator('#lead-email').fill('maria@test.nl')
    await page.locator('#lead-telefoon').fill('0687654321')
    await page.locator('#lead-gdpr').click({ force: true })
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('text=Server tijdelijk niet beschikbaar')).toBeVisible({ timeout: 10000 })
  })

  test('Terug-knop navigeert naar stap 5', async ({ page }) => {
    await page.locator('button:has-text("← Terug")').last().click()
    await expectStep(page, 5)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 7. localStorage persistentie & resume-banner
// ─────────────────────────────────────────────────────────────────────────────

test.describe('localStorage persistentie & resume-banner', () => {
  test('localStorage key is "wep_funnel_state"', async ({ page }) => {
    await setupMocks(page)
    await page.goto('/check')
    await page.waitForLoadState('domcontentloaded')
    await setLS(page, makeState({ step: 3 }))
    // Verkeerde key mag NIET opgepakt worden
    await page.evaluate(() => localStorage.setItem('funnel_state', JSON.stringify({ step: 99 })))
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1500)
    await expect(page.locator('text=Vorige sessie gevonden')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=stap 99/6')).not.toBeVisible()
  })

  test('resume-banner toont stap-nummer en adres', async ({ page }) => {
    await setupMocks(page)
    await page.goto('/check')
    await page.waitForLoadState('domcontentloaded')
    await setLS(page, makeState({ step: 3, adres: 'Keizersgracht 1, Amsterdam' }))
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1500)
    await expect(page.locator('text=stap 3/6')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Keizersgracht 1, Amsterdam')).toBeVisible()
  })

  test('"Doorgaan" herstelt state naar opgeslagen stap', async ({ page }) => {
    await gotoStep(page, 4)
    await expectStep(page, 4)
  })

  test('"Opnieuw" verbergt banner en wist localStorage', async ({ page }) => {
    await setupMocks(page)
    await page.goto('/check')
    await page.waitForLoadState('domcontentloaded')
    await setLS(page, makeState({ step: 3 }))
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1500)
    await page.locator('button:has-text("Opnieuw")').click()
    await expect(page.locator('text=Vorige sessie gevonden')).not.toBeVisible({ timeout: 3000 })
    const stored = await page.evaluate((k) => localStorage.getItem(k), LS_KEY)
    expect(stored).toBeNull()
  })

  test('state wordt opgeslagen na BAG-analyse', async ({ page }) => {
    await setupMocks(page)
    await gotoCheck(page)
    await page.locator('input[placeholder*="Prinsengracht"]').first().fill('Pri')
    await page.waitForTimeout(400)
    await page.locator('text=Prinsengracht 263').first().click()
    await page.locator('button:has-text("Adres Analyseren")').first().click()
    await expect(page.locator('text=1975')).toBeVisible({ timeout: 12000 })
    await page.waitForTimeout(800)
    const raw = await page.evaluate((k) => localStorage.getItem(k), LS_KEY)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.adres).toBeTruthy()
    expect(parsed.bagData).toBeTruthy()
  })

  test('stap ≤1 zonder bagData wordt niet hersteld', async ({ page }) => {
    await setupMocks(page)
    await page.goto('/check')
    await page.waitForLoadState('domcontentloaded')
    await setLS(page, { step: 1, adres: '', wijk: '', stad: '', bagData: null })
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1500)
    await expect(page.locator('text=Vorige sessie gevonden')).not.toBeVisible({ timeout: 3000 })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 8. ResultsDashboard
// ─────────────────────────────────────────────────────────────────────────────

test.describe('ResultsDashboard', () => {
  // resumeSavedState() herstelt leadId NIET — gebruik ?leadId= URL param.
  // De leadId-useEffect in FunnelContainer laadt ook localStorage state.
  async function gotoResults(page: Page, overrides: Record<string, unknown> = {}) {
    await setupMocks(page)
    await page.goto('/check')
    await page.waitForLoadState('domcontentloaded')
    // Sla state op ZONDER leadId — de URL param triggert de leadId dispatch
    await setLS(page, makeState(overrides))
    // Navigeer met ?leadId= — triggert useEffect die SET_LEAD_ID dispatcht + LS herstelt
    await page.goto('/check?leadId=test-result-lead')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1500)
    // Sluit resume-banner als die verschijnt (LS + URL param triggers beide)
    const opnieuw = page.locator('button:has-text("Opnieuw")')
    if (await opnieuw.isVisible({ timeout: 2000 }).catch(() => false)) {
      await opnieuw.click()
      await page.waitForTimeout(300)
    }
  }

  test('dashboard toont bij aanwezige leadId', async ({ page }) => {
    await gotoResults(page)
    await expect(page.locator('text=Uw SaldeerScan rapport')).toBeVisible({ timeout: 8000 })
  })

  test('adresblok aanwezig', async ({ page }) => {
    await gotoResults(page)
    // .last() want resume-banner kan ook adres bevatten — we willen de ResultsDashboard p-tag
    await expect(page.locator('text=Prinsengracht 263, Amsterdam').last()).toBeVisible({ timeout: 8000 })
  })

  test('ShockChart met 4 jaar-labels', async ({ page }) => {
    await gotoResults(page)
    for (const yr of ['2024', '2025', '2026', '2027']) {
      await expect(page.locator(`text=${yr}`).first()).toBeVisible({ timeout: 8000 })
    }
  })

  test('ROI tijdlijn aanwezig', async ({ page }) => {
    await gotoResults(page)
    await expect(page.locator('text=ROI tijdlijn').first()).toBeVisible({ timeout: 8000 })
    await expect(page.locator('text=Installatie').first()).toBeVisible()
    await expect(page.locator('text=Terugverdiend').first()).toBeVisible()
    await expect(page.locator('text=15 jaar winst').first()).toBeVisible()
  })

  test('"Gevalideerd 2027" stempel verschijnt', async ({ page }) => {
    await gotoResults(page)
    await expect(page.locator('text=Gevalideerd 2027').first()).toBeVisible({ timeout: 8000 })
  })

  test('"Wat gebeurt er nu?" sectie aanwezig', async ({ page }) => {
    await gotoResults(page)
    await expect(page.locator('text=Wat gebeurt er nu?').first()).toBeVisible({ timeout: 8000 })
  })

  test('referral sectie met WhatsApp + kopieer-knop', async ({ page }) => {
    await gotoResults(page)
    await expect(page.locator('text=Uw buur mist dit misschien ook').first()).toBeVisible({ timeout: 8000 })
    await expect(page.locator('text=Deel via WhatsApp').first()).toBeVisible()
    await expect(page.locator('text=Kopieer link').first()).toBeVisible()
  })

  test('Afdrukken-knop aanwezig', async ({ page }) => {
    await gotoResults(page)
    await expect(page.locator('button:has-text("Afdrukken")')).toBeVisible({ timeout: 8000 })
  })

  test('huurder-waarschuwing bij is_eigenaar=false', async ({ page }) => {
    test.setTimeout(60000)
    // is_eigenaar wordt niet hersteld door leadId-useEffect → submit via form
    await gotoStep(page, 6)
    await expect(page.locator('button:has-text("Nee, huurder")')).toBeVisible({ timeout: 8000 })
    await page.locator('button:has-text("Nee, huurder")').click()
    await page.locator('#lead-naam').fill('Huurder Test')
    await page.locator('#lead-email').fill('huurder@test.nl')
    await page.locator('#lead-telefoon').fill('0612345678')
    await page.locator('#lead-gdpr').click({ force: true })
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('text=u heeft aangegeven huurder te zijn').first()).toBeVisible({ timeout: 12000 })
  })

  test('netcongestie ROOD callout in dashboard', async ({ page }) => {
    const rood = { ...MOCK_NETCONGESTIE_GROEN, status: 'ROOD' as const }
    await setupMocks(page)
    await page.route('**/api/leads/**', async (route) => {
      if (route.request().method() !== 'GET') return route.continue()
      const path = new URL(route.request().url()).pathname.replace(/\/$/, '')
      const m = path.match(/^\/api\/leads\/([^/]+)$/)
      if (!m) return route.continue()
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockLeadHydrateBody(m[1], rood)),
      })
    })
    await page.goto('/check')
    await page.waitForLoadState('domcontentloaded')
    await setLS(page, makeState({ netcongestie: rood }))
    await page.goto('/check?leadId=test-result-lead')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1500)
    const opnieuw = page.locator('button:has-text("Opnieuw")')
    if (await opnieuw.isVisible({ timeout: 2000 }).catch(() => false)) {
      await opnieuw.click()
      await page.waitForTimeout(300)
    }
    await expect(page.locator('text=Netcongestie in uw wijk').first()).toBeVisible({ timeout: 8000 })
  })

  test('?leadId= URL param toont ResultsDashboard', async ({ page }) => {
    await setupMocks(page)
    await page.goto('/check')
    await page.waitForLoadState('domcontentloaded')
    await setLS(page, makeState())
    await page.goto('/check?leadId=vanuit-email-555')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1500)
    await expect(page.locator('text=Uw SaldeerScan rapport')).toBeVisible({ timeout: 10000 })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 9. URL params
// ─────────────────────────────────────────────────────────────────────────────

test.describe('URL params handshake', () => {
  test.beforeEach(async ({ page }) => { await setupMocks(page) })

  test('?adres= triggert auto-search (BAG resultaat verschijnt)', async ({ page }) => {
    await page.goto('/check?adres=Prinsengracht+263+Amsterdam')
    await page.waitForLoadState('domcontentloaded')
    // Na auto-search verschijnt het BAG bouwjaar — gebruik .first() tegen strict mode
    await expect(page.locator('text=1975').first()).toBeVisible({ timeout: 15000 })
  })

  test('?wijk= en ?stad= laadt zonder crash', async ({ page }) => {
    await page.goto('/check?wijk=leidsche-rijn&stad=utrecht')
    await page.waitForLoadState('domcontentloaded')
    await expect(page).not.toHaveURL(/\/_error|\/500/)
    await expect(page.locator('text=SaldeerScan').first()).toBeVisible({ timeout: 10000 })
  })

  test('?leadId= toont ResultsDashboard na localStorage-herstel', async ({ page }) => {
    await page.goto('/check')
    await page.waitForLoadState('domcontentloaded')
    await setLS(page, makeState())
    await page.goto('/check?leadId=vanuit-email-888')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1500)
    await expect(page.locator('text=Uw SaldeerScan rapport')).toBeVisible({ timeout: 10000 })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 10. Countdown timer
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Countdown timer', () => {
  test('homepage: timer-labels aanwezig', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Salderingsregeling eindigt over')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Dagen')).toBeVisible()
    await expect(page.locator('text=Uren')).toBeVisible()
  })

  test('homepage: timer toont cijfers na hydration (niet "--")', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
    const dagenEl = page.locator('text=Dagen').first().locator('..')
    const text = await dagenEl.innerText()
    expect(text).toMatch(/\d/)
  })

  test('/check: timer aanwezig (compact modus)', async ({ page }) => {
    // /check gebruikt <CountdownTimer compact /> — geen "Salderingsregeling eindigt over"
    // maar de compacte variant: "Nog X dagen — saldering eindigt 1 jan 2027"
    await setupMocks(page)
    await page.goto('/check')
    await expect(page.locator('text=saldering eindigt 1 jan 2027').first()).toBeVisible({ timeout: 15000 })
  })

  test('countdown staat in de toekomst (> 100 dagen)', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
    const text = await page.locator('text=Dagen').first().locator('..').innerText()
    const match = text.match(/(\d+)/)
    if (match) expect(parseInt(match[1])).toBeGreaterThan(100)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 11. Navigatie & scroll
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Navigatie & scroll', () => {
  test('homepage laadt op scrollY=0', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
  })

  test('/check laadt op scrollY=0', async ({ page }) => {
    await page.goto('/check')
    await page.waitForLoadState('domcontentloaded')
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
  })

  test('homepage CTA navigeert naar /check', async ({ page }) => {
    await page.goto('/')
    await page.locator('a[href="/check"]:has-text("Gratis analyseren")').first().click()
    await expect(page).toHaveURL(/\/check/, { timeout: 8000 })
  })

  test('/check geeft geen 500-URL', async ({ page }) => {
    await page.goto('/check')
    await page.waitForLoadState('domcontentloaded')
    await expect(page).not.toHaveURL(/\/_error|\/500/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 12. Edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge cases', () => {
  test('kapotte JSON in localStorage crasht de funnel niet', async ({ page }) => {
    await setupMocks(page)
    await page.goto('/check')
    await page.waitForLoadState('domcontentloaded')
    await page.evaluate((k) => localStorage.setItem(k, '{corrupt]}'), LS_KEY)
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    await expect(page).not.toHaveURL(/\/_error/)
    await expect(page.locator('input[placeholder*="Prinsengracht"]').first()).toBeVisible({ timeout: 15000 })
  })

  test('lege localStorage crasht de funnel niet', async ({ page }) => {
    await setupMocks(page)
    await page.goto('/check')
    await page.waitForLoadState('domcontentloaded')
    await page.evaluate((k) => localStorage.removeItem(k), LS_KEY)
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    await expect(page).not.toHaveURL(/\/_error/)
    await expect(page.locator('input[placeholder*="Prinsengracht"]').first()).toBeVisible({ timeout: 15000 })
  })

  test('stap 2 zonder bagData toont waarschuwing "Ga terug naar stap 1"', async ({ page }) => {
    await gotoStep(page, 2, { bagData: null, roiResult: null })
    await expect(page.locator('text=Ga terug naar stap 1')).toBeVisible({ timeout: 6000 })
  })

  test('stap 6 zonder roiResult laadt zonder crash', async ({ page }) => {
    await gotoStep(page, 6, { roiResult: null, healthScore: null })
    await expect(page).not.toHaveURL(/\/_error/)
    await expect(page.locator('text=gratis PDF-rapport').first()).toBeVisible({ timeout: 6000 })
  })

  test('stap 6 toont adres uit state', async ({ page }) => {
    await gotoStep(page, 6, { adres: 'Herengracht 500, Amsterdam' })
    // .first() voor strict mode — meerdere ancestors kunnen adres bevatten
    await expect(page.locator('text=Herengracht 500, Amsterdam').first()).toBeVisible({ timeout: 6000 })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 13. Volledige E2E flow stap 1 → 6
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Volledige E2E funnel', () => {
  test.setTimeout(90000)

  test('doorloopt stap 1→2→3→4→5→6 en dient lead in', async ({ page }) => {
    await setupMocks(page)
    await gotoCheck(page)

    // Stap 1
    await page.locator('input[placeholder*="Prinsengracht"]').first().fill('Pri')
    await page.waitForTimeout(400)
    await page.locator('text=Prinsengracht 263').first().click()
    await page.locator('button:has-text("Adres Analyseren")').first().click()
    await expect(page.locator('text=Bekijk besparingsanalyse')).toBeVisible({ timeout: 15000 })
    await page.locator('text=Bekijk besparingsanalyse').click()

    // Stap 2 — panelen-vraag verplicht vóór "Volgende"
    await expectStep(page, 2)
    await page.locator('button:has-text("Nee, nog geen panelen")').click()
    await expect(page.locator('text=Meterkast scannen →')).toBeVisible({ timeout: 10000 })
    await page.locator('text=Meterkast scannen →').click()

    // Stap 3 — handmatig
    await expectStep(page, 3)
    await page.locator('button:has-text("Geen foto? Vul handmatig in")').click()
    await page.locator('button:has-text("1-fase")').click()
    await page.locator('button:has-text("4+")').click()
    await page.locator('button:has-text("Doorgaan")').last().click()

    // Stap 4 — overslaan
    await expectStep(page, 4)
    await page.locator('button:has-text("Overslaan →")').click()

    // Stap 5 — handmatig
    await expectStep(page, 5)
    await page.locator('button:has-text("Geen foto? Vul handmatig in")').click()
    await page.locator('button:has-text("Nee, nog niet")').click()

    // Stap 6 — submit
    await expectStep(page, 6)
    await page.locator('#lead-naam').fill('Piet Janssen')
    await page.locator('#lead-email').fill('piet@test.nl')
    await page.locator('#lead-telefoon').fill('0612345678')
    await page.locator('#lead-gdpr').click({ force: true })
    await page.locator('button[type="submit"]').click()

    // React 18 batch: FunnelContainer toont ResultsDashboard direct
    await expect(page.locator('text=Uw SaldeerScan rapport').first()).toBeVisible({ timeout: 15000 })
  })
})
