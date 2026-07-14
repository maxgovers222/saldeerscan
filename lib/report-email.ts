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
<body style="margin:0;background:#f3f7f5;color:#10231d;font-family:Arial,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr><td align="center" style="padding:24px 12px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fbfdfc;border:1px solid #d9e4df;border-radius:18px;overflow:hidden">
        <tr><td style="background:#06130f;padding:28px 32px;color:white">
          <strong style="font-size:20px">SaldeerScan.nl</strong>
          <p style="margin:8px 0 0;color:#a9bbb4;font-size:13px">Persoonlijk 2027-rapport</p>
        </td></tr>
        <tr><td style="padding:32px">
          <p style="margin:0 0 12px;font-size:18px;font-weight:700">Beste ${firstName},</p>
          <p style="margin:0 0 24px;color:#5a6d66;line-height:1.65">Uw rapport voor <strong>${address}</strong> is opgesteld.</p>
          <div style="background:#fff7e6;border:1px solid #ffcf78;border-radius:14px;padding:20px;margin-bottom:20px">
            <small style="color:#7a5510">Mogelijk verlies vanaf 2027</small>
            <div style="font-size:30px;font-weight:800;color:#9f2f2f;margin-top:6px">−${euro(report.impact.annualLossEur)}/jaar</div>
          </div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px">
            <tr>
              <td style="padding:12px;border-bottom:1px solid #e3ebe7">Mogelijke besparing</td>
              <td align="right" style="padding:12px;border-bottom:1px solid #e3ebe7;font-weight:700">${euro(report.summary.annualSavingEur)}/jaar</td>
            </tr>
            <tr>
              <td style="padding:12px;border-bottom:1px solid #e3ebe7">Advies</td>
              <td align="right" style="padding:12px;border-bottom:1px solid #e3ebe7;font-weight:700">${escapeHtml(report.recommendation.primarySolution)}</td>
            </tr>
            <tr>
              <td style="padding:12px">Configuratie</td>
              <td align="right" style="padding:12px;font-weight:700">${escapeHtml(configuration)}</td>
            </tr>
            ${upgradeSaving === null ? '' : `<tr>
              <td style="padding:12px;border-top:1px solid #e3ebe7">Extra besparing door opslag</td>
              <td align="right" style="padding:12px;border-top:1px solid #e3ebe7;font-weight:700">${euro(upgradeSaving)}/jaar</td>
            </tr>`}
          </table>
          <p style="text-align:center;margin:28px 0">
            <a href="${reportUrl}" style="display:inline-block;background:#ffb020;color:#06130f;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:12px">Bekijk en download uw rapport</a>
          </p>
          <p style="margin:0;color:#5a6d66;font-size:13px;line-height:1.65">Uw aanvraag is vrijblijvend. Gegevens worden alleen met een partner gedeeld op basis van uw expliciete toestemming.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
