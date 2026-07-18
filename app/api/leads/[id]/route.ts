import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { parseStoredRoi } from '@/lib/roi-result-guard'
import { verifyLeadReportAccessToken } from '@/lib/lead-report-token'
import { applyRateLimit } from '@/lib/rate-limit'
import { buildReportModel, reportSourceFromStoredLead } from '@/lib/report-model'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const rl = await applyRateLimit(req, 120, 3_600_000, '/api/leads/report-read')
  if (rl.response) return rl.response

  const legacyOpen =
    process.env.LEAD_REPORT_LEGACY_OPEN_READ === '1' ||
    process.env.LEAD_REPORT_LEGACY_OPEN_READ === 'true'
  const token = new URL(req.url).searchParams.get('token')
  if (!legacyOpen && !verifyLeadReportAccessToken(id, token)) {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureMessage('lead_report_get_unauthorized', {
        level: 'info',
        tags: { route: 'GET /api/leads/[id]' },
        extra: {
          hasToken: Boolean(token),
          leadIdLen: id.length,
        },
      })
    }
    return NextResponse.json(
      {
        error:
          'Ongeldige of verlopen rapportlink. Gebruik de knop in uw bevestigingsmail, of start een nieuwe check op saldeerscan.nl.',
      },
      { status: 401 }
    )
  }

  const { data: lead, error } = await supabaseAdmin
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
      dakrichting,
      verbruik_bron,
      huishouden_grootte,
      report_email_status,
      report_email_sent_at,
      report_email_error
    `)
    .eq('id', id)
    .maybeSingle()

  if (error || !lead) {
    return NextResponse.json({ error: 'Lead niet gevonden' }, { status: 404 })
  }

  const reportSource = reportSourceFromStoredLead(lead)
  const report = buildReportModel(reportSource)
  if (!report) {
    return NextResponse.json(
      { error: 'Rapportgegevens zijn onvolledig' },
      { status: 422 },
    )
  }

  return NextResponse.json({
    report,
    leadId: lead.id,
    adres: lead.adres ?? '',
    wijk: lead.wijk ?? '',
    stad: lead.stad ?? '',
    bagData: lead.bag_data ?? null,
    netcongestie: report.grid.status
      ? {
          status: report.grid.status,
          netbeheerder: report.grid.operator ?? '',
          uitleg: report.grid.explanation ?? '',
          terugleveringBeperkt: false,
        }
      : null,
    healthScore: report.summary.healthScore === null
      ? null
      : reportSource.healthScore,
    roiResult: parseStoredRoi(lead.roi_berekening),
    meterkastAnalyse: report.technical.meterkast,
    plaatsingsAnalyse: report.technical.plaatsing,
    omvormerAnalyse: report.technical.omvormer,
    isEigenaar: report.qualification.isEigenaar,
    heeftPanelen: report.qualification.heeftPanelen,
    huidigePanelenAantal: report.qualification.huidigePanelenAantal,
    dakrichting: lead.dakrichting ?? null,
    verbruik_bron: lead.verbruik_bron ?? 'schatting',
    huishouden_grootte: lead.huishouden_grootte ?? null,
  })
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  const email = searchParams.get('email')?.toLowerCase().trim()

  if (!token || !email) {
    return NextResponse.json({ error: 'token en email verplicht' }, { status: 400 })
  }

  const { data: lead } = await supabaseAdmin
    .from('leads')
    .select('id, email, naam')
    .eq('id', id)
    .eq('email', email)
    .maybeSingle()

  if (!lead) {
    return NextResponse.json({ error: 'Lead niet gevonden' }, { status: 404 })
  }

  // Token: base64url van "leadId:email:key_prefix" — eenvoudig maar voldoende voor AVG-flow
  const expected = Buffer.from(
    `${id}:${email}:${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 16) ?? ''}`
  ).toString('base64url').slice(0, 32)

  if (token !== expected) {
    return NextResponse.json({ error: 'Ongeldig token' }, { status: 403 })
  }

  const { error } = await supabaseAdmin.from('leads').delete().eq('id', id)
  if (error) {
    console.error('[GDPR delete]', error)
    return NextResponse.json({ error: 'Verwijdering mislukt' }, { status: 500 })
  }

  if (resend) {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: 'Uw gegevens zijn verwijderd — SaldeerScan',
      html: `<p style="font-family:sans-serif">Beste ${lead.naam},</p>
<p style="font-family:sans-serif">Uw aanvraag en alle bijbehorende gegevens zijn permanent verwijderd uit ons systeem conform de AVG (Algemene Verordening Gegevensbescherming).</p>
<p style="font-family:sans-serif">Met vriendelijke groet,<br>SaldeerScan.nl<br><a href="mailto:privacy@saldeerscan.nl">privacy@saldeerscan.nl</a></p>`,
    }).catch(err => console.error('[GDPR delete] bevestigingsmail mislukt:', err))
  }

  return NextResponse.json({ deleted: true })
}
