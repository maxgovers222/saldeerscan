import {
  BRAND_COLORS,
  BRAND_MARK_GEOMETRY,
  BRAND_WORDMARK,
} from '@/lib/brand-colors'
import type { NormalizedReport } from '@/lib/report-model'

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function euro(value: number): string {
  return `€${Math.round(value).toLocaleString('nl-NL')}`
}

export function renderReportEmail(input: {
  report: NormalizedReport
  firstName: string
  reportUrl: string
}): string {
  const { report } = input
  const firstName = escapeHtml(input.firstName)
  const address = escapeHtml(report.home.address)
  const reportUrl = escapeHtml(input.reportUrl)
  const battery = report.recommendation.batteryCapacityKwh
  const configuration = report.qualification.heeftPanelen
    ? `${report.recommendation.existingPanelCount ?? 'Onbekend aantal'} bestaande panelen`
      + (battery ? ` · ${battery} kWh batterij` : '')
    : `${report.recommendation.panelCount} panelen`
      + (battery ? ` · ${battery} kWh batterij` : '')
  const upgradeSaving = report.recommendation.extraAnnualSavingEur

  return `<!doctype html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Uw SaldeerScan rapport</title>
</head>
<body style="margin:0;background:${BRAND_COLORS.mist};color:${BRAND_COLORS.ink};font-family:Arial,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr><td align="center" style="padding:24px 12px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:${BRAND_COLORS.paper};border:1px solid ${BRAND_COLORS.border};border-radius:18px;overflow:hidden">
        <tr><td style="background:${BRAND_COLORS.evergreen950};padding:28px 32px;color:${BRAND_COLORS.onEvergreen}">
          <table role="presentation" cellspacing="0" cellpadding="0">
            <tr>
              <td width="40" valign="middle">
                <div style="width:36px;height:36px;border-radius:10px;background:${BRAND_COLORS.trust};text-align:center;line-height:36px">
                  <svg aria-hidden="true" width="20" height="20" viewBox="${BRAND_MARK_GEOMETRY.viewBox}" fill="none" style="display:inline-block;vertical-align:middle">
                    <path d="${BRAND_MARK_GEOMETRY.outerPath}" fill="${BRAND_COLORS.onEvergreen}" fill-opacity="${BRAND_MARK_GEOMETRY.outerFillOpacity}" stroke="${BRAND_COLORS.onEvergreen}" stroke-width="${BRAND_MARK_GEOMETRY.outerStrokeWidth}" stroke-linejoin="round"></path>
                    <path d="${BRAND_MARK_GEOMETRY.innerPath}" fill="${BRAND_COLORS.onEvergreen}"></path>
                  </svg>
                </div>
              </td>
              <td valign="middle" style="padding-left:10px">
                <strong style="font-size:20px;color:${BRAND_COLORS.onEvergreen}">${BRAND_WORDMARK.name}<span style="color:${BRAND_COLORS.trust}">${BRAND_WORDMARK.suffix}</span></strong>
                <p style="margin:5px 0 0;color:${BRAND_COLORS.onEvergreenMuted};font-size:13px">Persoonlijk 2027-rapport</p>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:32px">
          <p style="margin:0 0 12px;font-size:18px;font-weight:700">Beste ${firstName},</p>
          <p style="margin:0 0 24px;color:${BRAND_COLORS.inkMuted};line-height:1.65">Uw rapport voor <strong>${address}</strong> is opgesteld.</p>
          <div style="background:${BRAND_COLORS.warningSurface};border:1px solid ${BRAND_COLORS.warningBorder};border-radius:14px;padding:20px;margin-bottom:20px">
            <small style="color:${BRAND_COLORS.warningInk}">Mogelijk verlies vanaf 2027</small>
            <div style="font-size:30px;font-weight:800;color:${BRAND_COLORS.warning};margin-top:6px">−${euro(report.impact.annualLossEur)}/jaar</div>
          </div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px">
            <tr>
              <td style="padding:12px;border-bottom:1px solid ${BRAND_COLORS.border}">Mogelijke besparing</td>
              <td align="right" style="padding:12px;border-bottom:1px solid ${BRAND_COLORS.border};font-weight:700">${euro(report.summary.annualSavingEur)}/jaar</td>
            </tr>
            <tr>
              <td style="padding:12px;border-bottom:1px solid ${BRAND_COLORS.border}">Advies</td>
              <td align="right" style="padding:12px;border-bottom:1px solid ${BRAND_COLORS.border};font-weight:700">${escapeHtml(report.recommendation.primarySolution)}</td>
            </tr>
            <tr>
              <td style="padding:12px">Configuratie</td>
              <td align="right" style="padding:12px;font-weight:700">${escapeHtml(configuration)}</td>
            </tr>
            ${upgradeSaving === null ? '' : `<tr>
              <td style="padding:12px;border-top:1px solid ${BRAND_COLORS.border}">Extra besparing door opslag</td>
              <td align="right" style="padding:12px;border-top:1px solid ${BRAND_COLORS.border};font-weight:700">${euro(upgradeSaving)}/jaar</td>
            </tr>`}
          </table>
          <p style="text-align:center;margin:28px 0">
            <a href="${reportUrl}" style="display:inline-block;background:${BRAND_COLORS.action};color:${BRAND_COLORS.evergreen950};text-decoration:none;font-weight:700;padding:14px 24px;border-radius:12px">Bekijk en download uw rapport</a>
          </p>
          <p style="margin:0;color:${BRAND_COLORS.inkMuted};font-size:13px;line-height:1.65">Uw aanvraag is vrijblijvend. Gegevens worden alleen met een partner gedeeld op basis van uw expliciete toestemming.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
