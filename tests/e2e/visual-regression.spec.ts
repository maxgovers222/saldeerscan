import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { renderToBuffer } from '@react-pdf/renderer'
import { expect, test, type Page, type TestInfo } from '@playwright/test'
import { createElement } from 'react'
import { SaldeerRapportPDF } from '@/components/funnel/SaldeerRapportPDF'
import { expectedReportFixture } from '../fixtures/report'
import { seedFunnelAtInternalStep } from './fixtures/funnel-state'
import { seedReportState } from './fixtures/report-state'

const fixedVisualTime = new Date('2026-07-14T12:00:00.000Z')

const homepageSizes = [
  { name: '360', width: 360, height: 800 },
  { name: '390', width: 390, height: 844 },
  { name: '768', width: 768, height: 1024 },
  { name: '1024', width: 1024, height: 900 },
  { name: '1440', width: 1440, height: 1000 },
]

const comparisonViewports = [
  { name: '390', width: 390, height: 844 },
  { name: '1440', width: 1440, height: 1000 },
] as const

const funnelStages = [
  { stage: 1, internalStep: 1, heading: 'Voer uw adres in' },
  { stage: 2, internalStep: 2, heading: 'Uw besparingsanalyse' },
  { stage: 3, internalStep: 3, heading: 'Meterkast analyseren' },
  { stage: 4, internalStep: 6, heading: 'Ontvang uw gratis PDF-rapport' },
] as const

async function mockDynamicStats(page: Page) {
  await page.route('**/api/stats', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ count: 120, minGeleden: null }),
  }))
}

async function waitForVisualReady(page: Page) {
  await page.evaluate(() => document.fonts.ready)
}

async function prepareVisualPage(
  page: Page,
  viewport: { width: number; height: number },
) {
  await page.setViewportSize(viewport)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.clock.setFixedTime(fixedVisualTime)
  await mockDynamicStats(page)
}

async function resumeSavedFunnel(page: Page) {
  await page
    .locator('aside[aria-label="Vorige sessie"]')
    .getByRole('button', { name: 'Doorgaan', exact: true })
    .click()
}

async function renderPdfFirstPage(testInfo: TestInfo): Promise<Buffer> {
  const document = createElement(SaldeerRapportPDF, {
    report: expectedReportFixture,
  }) as Parameters<typeof renderToBuffer>[0]
  const pdfBuffer = await renderToBuffer(document)
  const pdfPath = testInfo.outputPath('report.pdf')
  const pagePrefix = testInfo.outputPath('report-page-1')
  writeFileSync(pdfPath, pdfBuffer)
  let command = 'pdftoppm'
  let shell = false
  if (process.platform === 'win32') {
    const commandPath = execFileSync('where.exe', ['pdftoppm'], { encoding: 'utf8' })
      .split(/\r?\n/)
      .find(Boolean)
    if (commandPath?.endsWith('.cmd')) {
      const bundledExecutable = resolve(
        dirname(commandPath),
        '..',
        '..',
        'native',
        'poppler',
        'Library',
        'bin',
        'pdftoppm.exe',
      )
      if (existsSync(bundledExecutable)) {
        command = bundledExecutable
      } else {
        command = commandPath
        shell = true
      }
    } else if (commandPath) {
      command = commandPath
    }
  }
  execFileSync(command, [
    '-f', '1',
    '-l', '1',
    '-singlefile',
    '-png',
    '-r', '144',
    pdfPath,
    pagePrefix,
  ], { shell, stdio: 'pipe' })
  return readFileSync(`${pagePrefix}.png`)
}

for (const size of homepageSizes) {
  test(`homepage ${size.name}`, async ({ page }) => {
    await prepareVisualPage(page, size)
    await page.goto('/')
    await waitForVisualReady(page)

    const socialProof = page.getByTestId('social-proof-dynamic')
    await expect(socialProof).toBeVisible()
    const mask = await socialProof.count() > 0 ? [socialProof] : []
    await expect(page).toHaveScreenshot(`home-${size.name}.png`, {
      fullPage: true,
      mask,
    })
  })
}

for (const stage of funnelStages) {
  for (const viewport of comparisonViewports) {
    test(`funnel stadium ${stage.stage} ${viewport.name}`, async ({ page }) => {
      await prepareVisualPage(page, viewport)
      if (stage.internalStep > 1) {
        await seedFunnelAtInternalStep(page, stage.internalStep)
      }
      await page.goto('/check')
      if (stage.internalStep > 1) await resumeSavedFunnel(page)
      await expect(page.getByRole('heading', { name: stage.heading })).toBeVisible()
      await expect(page.getByText('Herberekenen...')).toHaveCount(0)
      await waitForVisualReady(page)

      await expect(page).toHaveScreenshot(
        `funnel-stage-${stage.stage}-${viewport.name}.png`,
        { fullPage: true },
      )
    })
  }
}

for (const route of [
  {
    name: 'wijk',
    path: '/utrecht/utrecht/leidsche-rijn',
    heading: /Leidsche Rijn/,
  },
  {
    name: 'straat',
    path: '/utrecht/utrecht/oost/biltstraat',
    heading: /Biltstraat/,
  },
] as const) {
  for (const viewport of comparisonViewports) {
    test(`${route.name} ${viewport.name}`, async ({ page }) => {
      await prepareVisualPage(page, viewport)
      const response = await page.goto(route.path)
      expect(response?.status()).toBe(200)
      await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible()
      if (route.name === 'wijk') {
        await expect(page.getByRole('application')).toBeVisible()
      }
      await waitForVisualReady(page)

      await expect(page).toHaveScreenshot(`${route.name}-${viewport.name}.png`, {
        fullPage: true,
      })
    })
  }
}

test('funnel loading state mobile', async ({ page }) => {
  await prepareVisualPage(page, comparisonViewports[0])
  await page.route('**/api/bag?**', () => new Promise(() => undefined))
  await page.goto('/check?adres=Teststraat+1%2C+Utrecht')
  await expect(page.getByRole('status').filter({ hasText: 'BAG-data analyseren' })).toBeVisible()
  await waitForVisualReady(page)

  await expect(page).toHaveScreenshot('funnel-loading-390.png', {
    fullPage: true,
  })
})

test('funnel error state mobile', async ({ page }) => {
  await prepareVisualPage(page, comparisonViewports[0])
  await page.route('**/api/bag?**', route => route.fulfill({
    status: 404,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'Adres niet gevonden in BAG' }),
  }))
  await page.goto('/check?adres=Teststraat+1%2C+Utrecht')
  await expect(page.getByRole('alert').filter({ hasText: 'Adres niet gevonden in BAG' }))
    .toContainText('Adres niet gevonden in BAG')
  await waitForVisualReady(page)

  await expect(page).toHaveScreenshot('funnel-error-390.png', {
    fullPage: true,
  })
})

test('funnel resume state mobile', async ({ page }) => {
  await prepareVisualPage(page, comparisonViewports[0])
  await seedFunnelAtInternalStep(page, 3)
  await page.goto('/check')
  await expect(page.locator('aside[aria-label="Vorige sessie"]')).toBeVisible()
  await waitForVisualReady(page)

  await expect(page).toHaveScreenshot('funnel-resume-390.png', {
    fullPage: true,
  })
})

for (const viewport of [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 1000 },
]) {
  test(`report ${viewport.name}`, async ({ page }) => {
    await prepareVisualPage(page, viewport)
    await seedReportState(page, expectedReportFixture)
    await page.goto('/check')
    await resumeSavedFunnel(page)
    await expect(page.getByTestId('report-root')).toBeVisible()
    await expect(page.getByRole('button', { name: /PDF-rapport/ })).toBeVisible()
    await waitForVisualReady(page)

    await expect(page).toHaveScreenshot(`report-${viewport.name}.png`, {
      fullPage: true,
    })
  })
}

test('PDF first page', async ({}, testInfo) => {
  const firstPage = await renderPdfFirstPage(testInfo)
  expect(firstPage).toMatchSnapshot('pdf-first-page.png', {
    maxDiffPixelRatio: 0.015,
  })
})
