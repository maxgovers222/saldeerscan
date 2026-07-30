import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Locator, type Page } from '@playwright/test'
import { makeFunnelStateFixture } from '../fixtures/funnel-state'
import { expectedReportFixture } from '../fixtures/report'
import { seedReportState } from './fixtures/report-state'

const routes = [
  '/',
  '/check',
  '/methode',
  '/privacy',
  '/kennisbank',
  '/nieuws',
  '/noord-holland',
  '/noord-holland/amsterdam',
  '/utrecht/utrecht/leidsche-rijn',
  '/postcode/1012',
] as const

for (const path of routes) {
  test(`${path} heeft geen WCAG A/AA overtredingen`, async ({ page }) => {
    const response = await page.goto(path)
    test.skip(response?.status() === 404, `Fixture ontbreekt voor ${path}`)

    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    const violations = result.violations.map(({ help, id, nodes }) => ({
      help,
      id,
      nodes: nodes.map(node => node.html),
    }))
    expect(violations).toEqual([])
  })
}

async function expectVisibleFocus(page: Page, locator: Locator) {
  for (let index = 0; index < 80 && !(await locator.evaluate(element => document.activeElement === element)); index += 1) {
    await page.keyboard.press('Tab')
  }
  await expect(locator).toBeFocused()
  const hasIndicator = await locator.evaluate(element => {
    const style = getComputedStyle(element)
    const outlineVisible = style.outlineStyle !== 'none'
      && parseFloat(style.outlineWidth) > 0
      && style.outlineColor !== 'rgba(0, 0, 0, 0)'
    return outlineVisible || style.boxShadow !== 'none'
  })
  expect(hasIndicator).toBe(true)
}

async function seedFunnelStep(page: Page, step: 2 | 3) {
  const state = makeFunnelStateFixture({
    step,
    leadId: null,
    reportModel: null,
  })
  await page.addInitScript(({ state }) => {
    localStorage.setItem('wep_funnel_state', JSON.stringify({
      version: 2,
      savedAt: Date.now(),
      state,
    }))
  }, { state })
  await page.goto('/check')
  await page.getByRole('button', { name: 'Doorgaan', exact: true }).click()
}

test('skiplink bereikt de hoofdinhoud met het toetsenbord', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')

  const skipLink = page.getByRole('link', { name: 'Naar hoofdinhoud' })
  await expect(skipLink).toBeFocused()
  await expect(skipLink).toBeVisible()
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL(/#main-content$/)
  await expect(page.locator('main#main-content')).toBeInViewport()
})

test('header en adresveld tonen zichtbare toetsenbordfocus', async ({ page }) => {
  await page.goto('/')
  await expectVisibleFocus(page, page.getByRole('link', { name: 'SaldeerScan.nl' }))
  await expectVisibleFocus(page, page.getByRole('combobox', { name: 'Uw adres' }))
})

test('adrescombobox ondersteunt alle navigatietoetsen', async ({ page }) => {
  await page.route('**/api/bag/suggest**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([
      { id: 'a', label: 'Teststraat 1, Utrecht' },
      { id: 'b', label: 'Teststraat 2, Utrecht' },
    ]),
  }))
  await page.goto('/')

  const input = page.getByRole('combobox', { name: 'Uw adres' })
  const options = page.getByRole('option')
  await input.fill('Teststraat')
  await expect(options).toHaveCount(2)

  await input.press('ArrowDown')
  await expect(options.nth(0)).toHaveAttribute('aria-selected', 'true')
  await input.press('ArrowDown')
  await expect(options.nth(1)).toHaveAttribute('aria-selected', 'true')
  await input.press('ArrowUp')
  await expect(options.nth(0)).toHaveAttribute('aria-selected', 'true')
  await input.press('Escape')
  await expect(input).toHaveAttribute('aria-expanded', 'false')

  await page.getByRole('heading', { level: 1 }).click()
  await input.focus()
  await input.press('ArrowDown')
  await input.press('Enter')
  await expect(input).toHaveValue('Teststraat 1, Utrecht')
})

test('keuzekaarten hebben state-semantiek en zichtbare focus', async ({ page }) => {
  await seedFunnelStep(page, 2)
  const choice = page.getByRole('button', { name: 'Nee, nog geen panelen' })

  await expect(choice).toHaveAttribute('aria-pressed', 'true')
  await expectVisibleFocus(page, choice)
  await page.getByRole('button', { name: 'Ja, ik heb panelen' }).click()
  await expect(page.getByRole('button', { name: 'Ja, ik heb panelen' })).toHaveAttribute('aria-pressed', 'true')
})

test('shock- en resume-oppervlakken behouden WCAG A/AA-contrast', async ({ page }) => {
  const state = makeFunnelStateFixture({
    step: 2,
    leadId: null,
    reportModel: null,
  })
  await page.addInitScript(({ state }) => {
    localStorage.setItem('wep_funnel_state', JSON.stringify({
      version: 2,
      savedAt: Date.now(),
      state,
    }))
  }, { state })
  await page.goto('/check')

  await expect(page.getByRole('complementary', { name: 'Vorige sessie' })).toBeVisible()
  let result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  expect(result.violations.map(({ help, id, nodes }) => ({
    help,
    id,
    nodes: nodes.map(node => node.html),
  }))).toEqual([])

  await page.getByRole('button', { name: 'Doorgaan', exact: true }).click()
  await expect(page.getByRole('complementary', { name: 'Financiële impact vanaf 2027' })).toBeVisible()
  result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  expect(result.violations.map(({ help, id, nodes }) => ({
    help,
    id,
    nodes: nodes.map(node => node.html),
  }))).toEqual([])
})

test('uploadknop is bereikbaar en gelabeld', async ({ page }) => {
  await seedFunnelStep(page, 3)
  await page.getByText('Mijn advies verfijnen', { exact: true }).click()
  const upload = page.getByRole('button', { name: /Foto van uw meterkast/ })

  await expect(upload).toBeVisible()
  await expect(upload).toHaveAttribute('aria-describedby', /.+/)
  await expectVisibleFocus(page, upload)
})

test('FAQ en PDF-actie tonen zichtbare focus', async ({ page }) => {
  const response = await page.goto('/kennisbank/wat-is-salderen')
  test.skip(response?.status() === 404, 'Kennisbankfixture ontbreekt')
  await expectVisibleFocus(page, page.locator('summary').first())

  await seedReportState(page, expectedReportFixture)
  await page.goto('/check')
  await page.getByRole('button', { name: 'Doorgaan', exact: true }).click()
  const pdfButton = page.getByRole('button', { name: /PDF-rapport/ })
  await expect(pdfButton).toBeVisible()
  await expectVisibleFocus(page, pdfButton)
})

test('laden en fouten worden aangekondigd', async ({ page }) => {
  let releaseResponse: () => void = () => {}
  const pendingResponse = new Promise<void>(resolve => { releaseResponse = resolve })
  await page.route('**/api/leads/a11y-status**', async route => {
    await pendingResponse
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Rapport niet gevonden' }),
    })
  })

  await page.goto('/check?leadId=a11y-status')
  await expect(page.getByRole('status').filter({ hasText: 'Rapport laden' })).toBeVisible()
  releaseResponse()
  await expect(page.getByRole('alert').filter({ hasText: 'Rapport niet gevonden' })).toBeVisible()
})

test('200% zoom houdt adrescontrols binnen het viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/')
  await page.addStyleTag({ content: 'html { zoom: 200%; }' })

  const controls = [
    page.getByRole('combobox', { name: 'Uw adres' }),
    page.getByRole('button', { name: 'Bekijk mijn inzicht' }),
  ]
  for (const control of controls) {
    const rect = await control.evaluate(element => element.getBoundingClientRect())
    expect(rect.left).toBeGreaterThanOrEqual(0)
    expect(rect.right).toBeLessThanOrEqual(1280)
    expect(rect.width).toBeGreaterThan(0)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth))
})

test('reduced-motion stopt continue animaties', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  let releaseResponse: () => void = () => {}
  const pendingResponse = new Promise<void>(resolve => { releaseResponse = resolve })
  await page.route('**/api/bag/suggest**', async route => {
    await pendingResponse
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  })
  await page.goto('/')
  await page.getByRole('combobox', { name: 'Uw adres' }).fill('Teststraat')

  const animated = page.locator('[class*="animate-spin"]').first()
  await expect(animated).toBeVisible()
  const motion = await animated.evaluate(element => {
    const style = getComputedStyle(element)
    return {
      durations: style.animationDuration.split(',').map(value => parseFloat(value) || 0),
      iterations: style.animationIterationCount.split(',').map(value => value === 'infinite' ? Infinity : Number(value)),
    }
  })
  expect(motion.durations.every(duration => duration <= 0.001)).toBe(true)
  expect(motion.iterations.every(iterations => iterations <= 1)).toBe(true)
  releaseResponse()
})
