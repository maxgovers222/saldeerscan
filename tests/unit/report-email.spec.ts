import { expect, test } from '@playwright/test'
import {
  BRAND_COLORS,
  BRAND_EMAIL_LOGO_URL,
  BRAND_WORDMARK,
} from '@/lib/brand-colors'
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
  expect(html).toContain('€780')
  expect(html).toContain('10 panelen')
  expect(html).toContain('10 kWh batterij')
  expect(html).toContain('https://saldeerscan.nl/check?leadId=1&amp;token=abc')
  expect(html).toContain(`background:${BRAND_COLORS.evergreen950}`)
  expect(html).toContain(BRAND_EMAIL_LOGO_URL)
  expect(html).toContain(BRAND_WORDMARK.name)
  expect(html).toContain(BRAND_WORDMARK.suffix)
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
  expect(html).toContain('Extra opslagvoordeel vanaf 2027')
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
  expect(html).not.toContain('<img src=x onerror=alert(1)>')
  expect(html).toContain('&lt;script&gt;')
  expect(html).toContain('&lt;img')
  expect(html).toContain(BRAND_EMAIL_LOGO_URL)
})
