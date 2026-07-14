import { createHmac } from 'node:crypto'
import { expect, test } from '@playwright/test'
import {
  buildPartnerPayload,
  deliverPartnerWebhook,
  nextDeliveryState,
  signPartnerPayload,
} from '@/lib/webhook-delivery'
import {
  buildReportModel,
  reportSourceFromStoredLead,
} from '@/lib/report-model'
import {
  reportSourceExistingPanels,
  reportSourceNoPanels,
} from '../fixtures/report'

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
const lead = storedLeadFixture
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

for (const storedLead of [
  storedLeadFixture,
  {
    ...storedLeadFixture,
    id: reportSourceExistingPanels.leadId!,
    heeft_panelen: true,
    huidige_panelen_aantal: 10,
  },
]) {
  test(`B2B payload matches the ${storedLead.heeft_panelen ? 'existing' : 'new'}-panels report`, () => {
    const payload = JSON.parse(buildPartnerPayload(storedLead))
    const report = buildReportModel(reportSourceFromStoredLead(storedLead))!
    expect(payload.report).toEqual(report)
    expect(payload.health_score).toBe(report.summary.healthScore)
    expect(payload.netcongestie).toBe(report.grid.status)
    expect(payload.roi).toEqual(reportSourceNoPanels.roiResult)
  })
}

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
  expect(buildPartnerPayload({ ...lead, adres: 'Gewijzigde straat 2' }))
    .not.toBe(storedBody)
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
