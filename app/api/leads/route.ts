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
import { Resend } from 'resend'

export const maxDuration = 60

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
if (!resend) console.warn('[api/leads] RESEND_API_KEY niet ingesteld — bevestigingsmail wordt overgeslagen')

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

  const preparedPartnerDeliveries = await preparePartnerDeliveries(lead.id)

  const reportAccessToken = signLeadReportAccessToken(lead.id)
  if (!reportAccessToken) {
    console.warn(
      '[api/leads] signLeadReportAccessToken: geen LEAD_REPORT_HMAC_SECRET of SUPABASE_SERVICE_ROLE_KEY — rapport-URL mist token'
    )
  }

  let emailStatus: ReportEmailStatus = resend
    ? 'pending'
    : 'not_configured'
  let emailError: string | null = null

  if (resend) {
    const score = health.score
    const energielabel = submission.energielabel
    const netStatus = netcongestie.status
    const heeftPanelen = submission.heeftPanelen
    const bestaandePanelen = submission.huidigePanelenAantal
    const batterijInvestering = Math.max(
      roi.scenarioMetBatterij.investeringEur - roi.scenarioNu.investeringEur, 0)
    const batterijMeerBesparing = Math.max(
      roi.scenarioMetBatterij.besparingJaarEur - roi.scenarioNu.besparingJaarEur, 0)
    const besparing = heeftPanelen
      ? roi.scenarioMetBatterij.besparingJaarEur
      : roi.scenarioNu.besparingJaarEur
    const terugverdien = heeftPanelen
      ? (batterijMeerBesparing > 0 ? Math.round((batterijInvestering / batterijMeerBesparing) * 10) / 10 : null)
      : roi.scenarioNu.terugverdientijdJaar
    const aantalPanelenAdvies = roi.aantalPanelen
    const verliesNa2027 = roi.shockEffect2027.jaarlijksVerlies
    const isdeSubsidie = roi.isdeSchatting && roi.isdeSchatting.bedragEur > 0
      ? roi.isdeSchatting.bedragEur : null

    const voornaam = submission.naam.split(' ')[0]
    const reportCheckUrl = reportAccessToken
      ? `https://saldeerscan.nl/check?leadId=${encodeURIComponent(lead.id)}&token=${encodeURIComponent(reportAccessToken)}`
      : `https://saldeerscan.nl/check?leadId=${encodeURIComponent(lead.id)}`

    const netKleur: Record<string, string> = {
      GROEN: '#10b981', ORANJE: '#f59e0b', ROOD: '#ef4444',
    }
    const netDot = netStatus
      ? `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${netKleur[netStatus] ?? '#94a3b8'};margin-right:6px;vertical-align:middle"></span>`
      : ''

    const dataRij = (label: string, waarde: string) =>
      `<tr>
        <td style="padding:7px 0;font-size:13px;color:#64748b;border-bottom:1px solid #e2e8f0">${label}</td>
        <td style="padding:7px 0;font-size:13px;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #e2e8f0">${waarde}</td>
      </tr>`

    const dataRijen = [
      score !== null ? dataRij('Energie Score', `<span style="color:#f59e0b">${score}/100</span>`) : '',
      energielabel ? dataRij('Energielabel', energielabel) : '',
      netStatus ? dataRij('Netcongestie', `${netDot}${netStatus}`) : '',
      !heeftPanelen && aantalPanelenAdvies !== null
        ? dataRij('Adviesmodel (max. dak)', `${aantalPanelenAdvies} stuks`)
        : '',
      heeftPanelen === true && bestaandePanelen
        ? dataRij('Huidige installatie', `${bestaandePanelen} panelen`)
        : '',
      besparing !== null ? dataRij(
        heeftPanelen ? 'Geschatte besparing (incl. batterij-scenario)' : 'Geschatte besparing',
        `<span style="color:#10b981">€${besparing.toLocaleString('nl-NL')}/jaar</span>`
      ) : '',
      isdeSubsidie !== null ? dataRij('ISDE subsidie', `<span style="color:#10b981">€${isdeSubsidie.toLocaleString('nl-NL')}</span>`) : '',
      terugverdien !== null ? dataRij('Terugverdientijd', `${terugverdien} jaar`) : '',
    ].filter(Boolean).join('')

    try {
      const emailResult = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: submission.email,
        subject: `Uw persoonlijk 2027-rapport is klaar, ${voornaam}`,
        html: `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <div style="max-width:580px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
    <div style="background:#ffffff;padding:24px 32px 18px;border-bottom:1px solid #e2e8f0">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <span style="font-size:18px;font-weight:700;color:#0f172a;vertical-align:middle;letter-spacing:-0.3px">SaldeerScan.nl</span>
          </td>
          <td style="text-align:right;vertical-align:middle">
            <span style="font-size:10px;color:#64748b;letter-spacing:1.5px;text-transform:uppercase">Persoonlijk Rapport</span>
          </td>
        </tr>
      </table>
    </div>
    <div style="background:#fff7ed;border-top:1px solid #fdba74;border-bottom:1px solid #fed7aa;padding:9px 32px">
      <span style="font-size:11px;color:#9a3412;letter-spacing:0.3px">Salderingsregeling stopt volledig per 1 januari 2027</span>
    </div>
    <div style="padding:32px">
      <p style="margin:0 0 4px;font-size:16px;font-weight:600;color:#0f172a">Geachte ${voornaam},</p>
      <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.75">
        Uw persoonlijk 2027-rapport voor <strong style="color:#0f172a">${submission.adres}</strong> is opgesteld.
        Een energieadviseur in uw regio neemt naar aanleiding van uw aanvraag contact met u op.
      </p>
      <div style="background:#fff1f2;border-radius:10px;border-left:4px solid #dc2626;padding:18px 20px;margin-bottom:24px">
        <div style="font-size:10px;color:#b91c1c;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;font-weight:600;opacity:0.8">Uw 2027-impact</div>
        <div style="font-size:28px;font-weight:800;color:#b91c1c;letter-spacing:-0.5px;margin-bottom:4px">
          &minus;€${(verliesNa2027 ?? 0).toLocaleString('nl-NL')}<span style="font-size:14px;font-weight:500">/jaar</span>
        </div>
      </div>
      ${dataRijen ? `
      <div style="margin-bottom:24px">
        <div style="font-size:10px;color:#64748b;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;font-weight:600">Uw scanresultaten</div>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          ${dataRijen}
        </table>
      </div>
      ` : ''}
      <div style="text-align:center;margin-bottom:28px">
        <a href="${reportCheckUrl}" style="display:inline-block;background:#f59e0b;color:#020617;font-size:14px;font-weight:700;text-decoration:none;padding:13px 32px;border-radius:8px;letter-spacing:0.2px">
          Bekijk uw rapport op SaldeerScan.nl
        </a>
      </div>
    </div>
    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px">
      <span style="font-size:11px;color:#64748b">© ${new Date().getFullYear()} SaldeerScan.nl</span>
    </div>
  </div>
</body>
</html>`,
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
    .select(`
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
    `)
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
