import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { seedFunnelAtInternalStep } from './fixtures/funnel-state'
import { expectedReportFixture } from '../fixtures/report'
import { REVIEWED_NEWS_COPY } from '../../lib/reviewed-news'
import { REVIEWED_KNOWLEDGE } from '../../lib/reviewed-energy-articles'
import { NETCONGESTIE_ARTICLE } from '../../lib/netcongestie-article'

for (const [kind, copies] of [
  ['nieuws', REVIEWED_NEWS_COPY],
  ['kennisbank', { ...REVIEWED_KNOWLEDGE, [NETCONGESTIE_ARTICLE.slug]: NETCONGESTIE_ARTICLE }],
] as const) {
  test(`the complete reviewed ${kind} corpus keeps titles, sources, publication history and discovery consistent`, async ({ page, request }, testInfo) => {
    test.setTimeout(90_000)
    const sitemap = await (await request.get(`/sitemap/${kind}.xml`)).text()
    for (const [slug, copy] of Object.entries(copies)) {
      const response = await page.goto(`/${kind}/${slug}`)
      expect(response?.status(), slug).toBe(200)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(copy.titel)
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', copy.metaDescription)
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://saldeerscan.nl/${kind}/${slug}`)
      await expect(page.locator('#article-sources')).toBeVisible()
      for (const source of copy.sources) expect(await page.locator(`a[href="${source.url}"]`).count(), `${slug}: ${source.label}`).toBeGreaterThan(0)
      const blocks = await page.locator('script[type="application/ld+json"]').allTextContents()
      const article = blocks.flatMap(block => JSON.parse(block)['@graph'] ?? []).find(node => node['@type'] === (kind === 'nieuws' ? 'NewsArticle' : 'Article'))
      expect(article?.headline, slug).toBe(copy.titel)
      expect(article.dateModified, slug).toBe(copy.reviewedAt)
      expect(Date.parse(article.datePublished), slug).toBeLessThan(Date.parse(copy.reviewedAt))
      const entry = sitemap.split('</url>').find(block => block.includes(`<loc>https://saldeerscan.nl/${kind}/${slug}</loc>`))
      expect(entry, slug).toContain(`<lastmod>${copy.reviewedAt}`)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    expect(accessibility.violations.map(({ id, help }) => ({ id, help }))).toEqual([])
    await page.screenshot({ path: `tmp/reach-recovery/reviewed-${kind}-${testInfo.project.name}.png`, fullPage: true })
    await page.goto(`/${kind}`)
    for (const heading of await page.locator('main h2, main h3').allTextContents()) {
      expect(heading).not.toMatch(/30% goedkoper|28% in 2026|label C verplicht|Dé Winningcombinatie/i)
    }
  })
}

async function captureEvents(page: Page) {
  const events: unknown[][] = []
  await page.exposeFunction('__reachEvent', (...args: unknown[]) => { events.push(args) })
  await page.addInitScript(() => {
    const target = window as unknown as { gtag: (...args: unknown[]) => void; __reachEvent: (...args: unknown[]) => void }
    target.gtag = (...args) => target.__reachEvent(...args)
  })
  return events
}

test('a displayed result is measured once per funnel session without financial or home details', async ({ page }) => {
  const events = await captureEvents(page)
  await seedFunnelAtInternalStep(page, 2)
  await page.goto('/check')
  await page.getByRole('button', { name: 'Doorgaan', exact: true }).click()
  const resultEvents = () => events.filter(event => event[1] === 'roi_result_viewed')
  await expect.poll(() => resultEvents().length).toBe(1)
  expect(resultEvents()[0][2]).toMatchObject({ funnel_stage: 2, calculation_source: 'model_defaults' })
  expect(JSON.stringify(resultEvents()[0])).not.toContain('Prinsengracht')
  expect(Object.keys(resultEvents()[0][2] as object)).not.toEqual(expect.arrayContaining(['jaarProductieKwh', 'leveringstarief', 'adres', 'leadId', 'token']))
  await page.locator('summary').filter({ hasText: 'Berekening aanpassen' }).click()
  await page.locator('#roi-jaarProductieKwh').fill('4000')
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('wep_funnel_state')!).state.roiInput.jaarProductieKwh)).toBe(4000)
  expect(resultEvents()).toHaveLength(1)
})

test('household figures reach the real calculator and persist for a resumed scan', async ({ page }, testInfo) => {
  await seedFunnelAtInternalStep(page, 2, { heeft_panelen: true, huidige_panelen_aantal: 10 })
  await page.goto('/check')
  await page.getByRole('button', { name: 'Doorgaan', exact: true }).click()
  await page.locator('summary').filter({ hasText: 'Berekening aanpassen' }).click()
  for (const [id, value] of Object.entries({ verbruik: '4000', jaarProductieKwh: '4000', directEigenGebruikPct: '25',
    leveringstarief: '0.30', kaalLeveringstarief: '0.20', teruglevertarief: '0.10',
    terugleverkosten2026Eur: '200', terugleverkosten2027Eur: '100',
    terugleverkostenPerKwh2026: '0.01', terugleverkostenPerKwh2027: '0.02',
    batterijInvesteringEur: '5000', batterijRendementPct: '90', eigenGebruikMetBatterijPct: '70' })) {
    await page.locator(`#roi-${id}`).fill(value)
  }
  await expect(page.getByText(/Een batterij wordt met deze invoer niet geadviseerd/)).toBeVisible()
  await expect(page.getByText('€970', { exact: true })).toBeVisible()
  await expect(page.getByText('€440', { exact: true })).toBeVisible()
  await expect(page.getByText('€820', { exact: true })).toBeVisible()
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('wep_funnel_state')!).state.roiInput.jaarProductieKwh)).toBe(4000)
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('wep_funnel_state')!).state)
  expect(saved.roiInput.jaarProductieKwh).toBe(4000)
  expect(saved.roiResult.calculation.batteryPaybackYears).toBe(13.2)
  await page.getByText('Invoer en aannames', { exact: true }).click()
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  expect(result.violations.map(({ id, help }) => ({ id, help }))).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: `tmp/reach-recovery/calculator-${testInfo.project.name}.png`, fullPage: true })
})

test('calculator API rejects malformed inputs and preserves explicit zero values', async ({ request }) => {
  const base = { oppervlakte: 120, bouwjaar: 1880, dakOppervlakte: 45, aantalPanelenOverride: 0, jaarProductieKwh: 0 }
  expect((await request.post('/api/roi', { data: { ...base, leveringstarief: true } })).status()).toBe(400)
  const result = await request.post('/api/roi', { data: base })
  expect(result.status()).toBe(200)
  expect((await result.json()).roi).toMatchObject({ aantalPanelen: 0, productieKwh: 0 })
})

test('legacy indexing endpoint is retired in the running application', async ({ request }) => {
  const response = await request.get('/api/indexing/cron')
  expect(response.status()).toBe(410)
  expect(await response.json()).toMatchObject({ status: 'retired' })
})

test('unverified postcode colors are unknown and cannot change the calculator model score', async ({ request }) => {
  const response = await request.get('/api/netcongestie?postcode=1012AB')
  expect(response.status()).toBe(200)
  expect(await response.json()).toMatchObject({ status: null, netbeheerder: 'Onbekend', terugleveringBeperkt: null, source: 'unavailable' })
  const data = { oppervlakte: 120, bouwjaar: 1980, dakOppervlakte: 45, energielabel: 'C' }
  const red = await (await request.post('/api/roi', { data: { ...data, netcongestieStatus: 'ROOD' } })).json()
  const green = await (await request.post('/api/roi', { data: { ...data, netcongestieStatus: 'GROEN' } })).json()
  expect(red.health).toEqual(green.health)
})

test('reviewed label article replaces the misleading headline, body, summaries and schema', async ({ page }, testInfo) => {
  const slug = 'energielabel-c-woningwaarde-zonnepanelen'
  await page.goto(`/nieuws/${slug}`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Energielabel bij uw woning: wat is verplicht en wat zegt het?')
  await expect(page.getByText('Er is geen wettelijk vastgelegd of gegarandeerd tarief meer.', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'RVO — energielabel C kantoren' })).toBeVisible()
  const schemaText = await page.locator('script[type="application/ld+json"]').allTextContents()
  const article = schemaText.flatMap(text => JSON.parse(text)['@graph'] ?? []).find(node => node['@type'] === 'NewsArticle')
  expect(article.headline).toBe('Energielabel bij uw woning: wat is verplicht en wat zegt het?')
  expect(article.datePublished).toBe('2026-08-01T00:00:00Z')
  expect(article.dateModified).toBe('2026-10-13')
  await page.screenshot({ path: `tmp/reach-recovery/label-article-${testInfo.project.name}.png`, fullPage: true })
  await page.goto('/nieuws')
  await expect(page.getByRole('link', { name: 'Energielabel bij uw woning: wat is verplicht en wat zegt het?' })).toBeVisible()
  await expect(page.getByText('Energielabel C Verplicht: Impact op Woningwaarde', { exact: true })).toHaveCount(0)
})

test('reviewed guarantee article no longer claims saldering already declined', async ({ page }) => {
  await page.goto('/nieuws/garantie-zonnepanelen-bescherm-investering-na-saldering')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Garantie op zonnepanelen: controleer uw eigen voorwaarden')
  await expect(page.getByText('De salderingsregeling is al aanzienlijk afgebouwd in 2026.', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Rijksoverheid — einde salderingsregeling' })).toBeVisible()
})

test('saldering, subsidy and cooperative-deadline corrections reach article copy, metadata and schema', async ({ page }) => {
  for (const [slug, title] of [
    ['saldering-afgebouwd-2026-update', 'Salderen in 2026: geen afbouw naar 28%'],
    ['thuisbatterij-subsidie-2025', 'Subsidie voor een thuisbatterij: controleer de regeling'],
    ['postcoderoos-regeling-2026-deadline-zonder-eigen-dak', 'Postcoderoos en SCE: controleer uw eigen projectregeling'],
  ]) {
    expect((await page.goto(`/nieuws/${slug}`))?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1, name: title, exact: true })).toBeVisible()
    expect(await page.title()).toContain(title)
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents()
    const article = blocks.flatMap(block => JSON.parse(block)['@graph'] ?? []).find(node => node['@type'] === 'NewsArticle')
    expect(article.headline).toBe(title)
    expect(article.dateModified).toBe('2026-10-15')
    expect(article.datePublished).not.toBe('2026-10-15')
    if (slug.startsWith('thuisbatterij')) await expect(page.locator('a[href="https://www.rvo.nl/subsidies-financiering/isde/woningeigenaren"]')).toBeVisible()
  }
})

test('maker and contact are visible without a fabricated registration', async ({ page }, testInfo) => {
  await page.goto('/over')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Waarom SaldeerScan bestaat')
  await expect(page.getByText('SaldeerScan is een persoonlijk project van Max Govers.', { exact: false })).toBeVisible()
  await expect(page.locator('main a[href="mailto:info@saldeerscan.nl"]')).toBeVisible()
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://saldeerscan.nl/over')
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  expect(result.violations.map(({ id, help }) => ({ id, help }))).toEqual([])
  await page.screenshot({ path: `tmp/reach-recovery/about-${testInfo.project.name}.png`, fullPage: true })
})

for (const wantsAdvice of [false, true]) {
  test(`report completion with advice=${wantsAdvice} keeps the choices separate`, async ({ page }, testInfo) => {
    const events = await captureEvents(page)
    let submitted: Record<string, unknown> | undefined
    await page.route('**/api/leads**', async route => {
      if (route.request().method() === 'POST') {
        submitted = route.request().postDataJSON() as Record<string, unknown>
      }
      await route.fulfill({
        status: route.request().method() === 'POST' ? 201 : 200,
        contentType: 'application/json',
        body: JSON.stringify({
          leadId: expectedReportFixture.leadId,
          reportToken: 'fixture-only-token',
          adviceRequested: submitted?.adviceConsent === true,
          report: expectedReportFixture,
        }),
      })
    })
    await seedFunnelAtInternalStep(page, 6)
    await page.goto('/check')
    await page.getByRole('button', { name: 'Doorgaan', exact: true }).click()
    await expect(page.locator('#lead-advice')).not.toBeChecked()
    await expect(page.locator('#lead-telefoon')).toHaveCount(0)
    await page.locator('#lead-naam').fill('Jan de Vries')
    await page.locator('#lead-email').fill('jan@example.nl')
    if (wantsAdvice) {
      await page.locator('#lead-advice').check()
      await page.getByRole('button', { name: /Stuur mij het gratis PDF-rapport/ }).click()
      await expect(page.getByText('Telefoonnummer is verplicht', { exact: true })).toBeVisible()
      expect(submitted).toBeUndefined()
      await page.locator('#lead-telefoon').fill('0612345678')
    }
    await page.locator('#lead-gdpr').check({ force: true })
    await page.screenshot({ path: `tmp/reach-recovery/report-form-${wantsAdvice}-${testInfo.project.name}.png`, fullPage: true })
    await page.getByRole('button', { name: /Stuur mij het gratis PDF-rapport/ }).click()
    await expect(page.getByText('Uw SaldeerScan rapport', { exact: true }).first()).toBeVisible()
    expect(submitted).toMatchObject({
      gdprConsent: true,
      adviceConsent: wantsAdvice,
      telefoon: wantsAdvice ? '+31612345678' : null,
    })
    await expect.poll(() => events.filter(event => event[1] === 'lead_submit_succeeded').length).toBe(1)
    expect(events.filter(event => event[1] === 'advice_request_succeeded')).toHaveLength(wantsAdvice ? 1 : 0)
  })
}
