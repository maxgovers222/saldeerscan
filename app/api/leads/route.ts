import { after } from 'next/server'
import { applyRateLimit } from '@/lib/rate-limit'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { signLeadReportAccessToken } from '@/lib/lead-report-token'
import {
  dispatchPreparedPartnerDeliveries,
  dispatchToBulkBuyer,
  preparePartnerDeliveries,
} from '@/lib/webhooks'
import {
  deriveLeadAnalysis,
  LeadSubmissionError,
  parseLeadSubmission,
  readBoundedJson,
} from '@/lib/lead-submission'
import { getNetcongestie } from '@/lib/netcongestie'
import {
  buildReportModel,
  reportSourceFromStoredLead,
  type ReportEmailStatus,
} from '@/lib/report-model'
import { renderReportEmail } from '@/lib/report-email'
import { Resend } from 'resend'

export const maxDuration = 60

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
if (!resend) console.warn('[api/leads] RESEND_API_KEY niet ingesteld — bevestigingsmail wordt overgeslagen')

const REPORT_LEAD_SELECT = `
  id,
  created_at,
  adres,
  wijk,
  stad,
  bag_data,
  netcongestie_status,
  health_score,
  roi_berekening,
  meterkast_analyse,
  plaatsing_analyse,
  omvormer_analyse,
  is_eigenaar,
  heeft_panelen,
  huidige_panelen_aantal,
  report_email_status
`

export async function POST(request: Request) {
  const limitResult = await applyRateLimit(request, 10, 3_600_000)
  if (limitResult.response) return limitResult.response

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

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? '127.0.0.1'

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
      report_email_status: resend ? 'pending' : 'not_configured',
    })
    .select('id')
    .single()

  if (error || !lead) {
    console.error('[api/leads] insert error:', error?.message, 'code:', error?.code)
    if (error?.code === '23505') {
      return Response.json(
        { error: 'U heeft al een rapport aangevraagd met dit e-mailadres. Controleer uw inbox (ook de spammap).' },
        { status: 409 }
      )
    }
    return Response.json({ error: 'Lead kon niet worden opgeslagen' }, { status: 500 })
  }

  const reportAccessToken = signLeadReportAccessToken(lead.id)
  if (!reportAccessToken) {
    console.warn(
      '[api/leads] signLeadReportAccessToken: geen LEAD_REPORT_HMAC_SECRET of SUPABASE_SERVICE_ROLE_KEY — rapport-URL mist token'
    )
  }

  const { data: pendingStoredLead, error: pendingStoredLeadError } = await supabaseAdmin
    .from('leads')
    .select(REPORT_LEAD_SELECT)
    .eq('id', lead.id)
    .single()
  if (pendingStoredLeadError || !pendingStoredLead) {
    console.error('[api/leads] pending report lead reload error:', lead.id, pendingStoredLeadError?.message)
    return Response.json({ error: 'report_generation_failed' }, { status: 500 })
  }

  const pendingReport = buildReportModel(reportSourceFromStoredLead(pendingStoredLead))
  if (!pendingReport) {
    console.error('[api/leads] pending report generation failed:', lead.id)
    return Response.json({ error: 'report_generation_failed' }, { status: 500 })
  }

  let emailStatus: ReportEmailStatus = resend
    ? 'pending'
    : 'not_configured'
  let emailError: string | null = null

  if (resend) {
    const firstName = submission.naam.split(/\s+/)[0]
    const reportCheckUrl = reportAccessToken
      ? `https://saldeerscan.nl/check?leadId=${encodeURIComponent(lead.id)}&token=${encodeURIComponent(reportAccessToken)}`
      : `https://saldeerscan.nl/check?leadId=${encodeURIComponent(lead.id)}`
    try {
      const emailResult = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: submission.email,
        subject: `Uw persoonlijk 2027-rapport is klaar, ${firstName}`,
        html: renderReportEmail({
          report: pendingReport,
          firstName,
          reportUrl: reportCheckUrl,
        }),
      })
      if ('error' in emailResult && emailResult.error) {
        emailStatus = 'failed'
        emailError = emailResult.error.message
        console.error('[api/leads] email error:', emailResult.error)
      } else {
        emailStatus = 'sent'
      }
    } catch (err) {
      emailStatus = 'failed'
      emailError = err instanceof Error ? err.message : String(err)
      console.error('[api/leads] email exception:', err)
    }
  }

  const emailUpdate = emailStatus === 'sent'
    ? {
        report_email_status: 'sent',
        report_email_sent_at: new Date().toISOString(),
        report_email_error: null,
      }
    : {
        report_email_status: emailStatus,
        report_email_sent_at: null,
        report_email_error: emailError?.slice(0, 1000) ?? null,
      }
  const { error: emailUpdateError } = await supabaseAdmin
    .from('leads')
    .update(emailUpdate)
    .eq('id', lead.id)
  if (emailUpdateError) {
    console.error('[api/leads] email status update error:', emailUpdateError.message)
  }

  const { data: storedLead, error: storedLeadError } = await supabaseAdmin
    .from('leads')
    .select(REPORT_LEAD_SELECT)
    .eq('id', lead.id)
    .single()
  if (storedLeadError || !storedLead) {
    console.error('[api/leads] report lead reload error:', lead.id, storedLeadError?.message)
    return Response.json({ error: 'report_generation_failed' }, { status: 500 })
  }

  const report = buildReportModel(reportSourceFromStoredLead(storedLead))
  if (!report) {
    console.error('[api/leads] report generation failed:', lead.id)
    return Response.json({ error: 'report_generation_failed' }, { status: 500 })
  }

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

  return Response.json(
    {
      leadId: lead.id,
      reportToken: reportAccessToken ?? null,
      status: 'ingediend',
      report,
      emailStatus: report.delivery.emailStatus,
    },
    { status: 201 },
  )
}
