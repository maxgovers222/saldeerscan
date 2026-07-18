/** @jsxImportSource react */

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'
import { PdfBrandMark } from '@/components/report/PdfBrandMark'
import { BRAND_COLORS, BRAND_WORDMARK } from '@/lib/brand-colors'
import type { NormalizedReport } from '@/lib/report-model'

const S = StyleSheet.create({
  page: {
    backgroundColor: BRAND_COLORS.paper,
    color: BRAND_COLORS.ink,
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingBottom: 48,
  },
  header: {
    backgroundColor: BRAND_COLORS.evergreen950,
    paddingHorizontal: 34,
    paddingVertical: 24,
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  brand: {
    color: BRAND_COLORS.onEvergreen,
    fontFamily: 'Helvetica-Bold',
    fontSize: 18,
  },
  brandSuffix: {
    color: BRAND_COLORS.trust,
  },
  eyebrow: {
    color: BRAND_COLORS.onEvergreenMuted,
    fontSize: 7,
    letterSpacing: 1.6,
    marginTop: 5,
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: BRAND_COLORS.onEvergreen,
    fontFamily: 'Helvetica-Bold',
    fontSize: 15,
    marginTop: 11,
  },
  headerMeta: {
    color: BRAND_COLORS.onEvergreenMuted,
    fontSize: 8,
    lineHeight: 1.45,
    marginTop: 4,
  },
  deadline: {
    backgroundColor: BRAND_COLORS.warningSurface,
    borderBottomColor: BRAND_COLORS.warningBorder,
    borderBottomWidth: 1,
    color: BRAND_COLORS.warningInk,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 34,
    paddingVertical: 9,
  },
  deadlineStrong: {
    fontFamily: 'Helvetica-Bold',
  },
  body: {
    paddingHorizontal: 34,
    paddingTop: 24,
  },
  section: {
    marginBottom: 18,
  },
  sectionEyebrow: {
    color: BRAND_COLORS.inkMuted,
    fontSize: 7,
    letterSpacing: 1.4,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: BRAND_COLORS.ink,
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
    marginBottom: 9,
  },
  addressCard: {
    backgroundColor: BRAND_COLORS.mist,
    borderColor: BRAND_COLORS.border,
    borderRadius: 7,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  address: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
  },
  muted: {
    color: BRAND_COLORS.inkMuted,
    fontSize: 8,
    lineHeight: 1.45,
    marginTop: 3,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 16,
  },
  metric: {
    backgroundColor: BRAND_COLORS.mist,
    borderColor: BRAND_COLORS.border,
    borderRadius: 7,
    borderWidth: 1,
    flex: 1,
    minHeight: 66,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  metricLabel: {
    color: BRAND_COLORS.inkMuted,
    fontSize: 6.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  metricValue: {
    color: BRAND_COLORS.ink,
    fontFamily: 'Helvetica-Bold',
    fontSize: 17,
    marginTop: 6,
  },
  metricValuePositive: {
    color: BRAND_COLORS.trustDark,
  },
  metricValueDanger: {
    color: BRAND_COLORS.danger,
  },
  metricDetail: {
    color: BRAND_COLORS.inkMuted,
    fontSize: 7,
    marginTop: 3,
  },
  impactBox: {
    backgroundColor: BRAND_COLORS.warningSurface,
    borderColor: BRAND_COLORS.warningBorder,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  impactLabel: {
    color: BRAND_COLORS.warning,
    fontSize: 7,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  impactValue: {
    color: BRAND_COLORS.warning,
    fontFamily: 'Helvetica-Bold',
    fontSize: 23,
    marginTop: 5,
  },
  impactText: {
    color: BRAND_COLORS.inkMuted,
    fontSize: 8,
    lineHeight: 1.45,
    marginTop: 5,
  },
  timeline: {
    flexDirection: 'row',
    gap: 7,
  },
  timelineItem: {
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.mist,
    borderColor: BRAND_COLORS.border,
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 9,
  },
  timelineItemFinal: {
    backgroundColor: BRAND_COLORS.dangerSurface,
    borderColor: BRAND_COLORS.dangerBorder,
  },
  timelineYear: {
    color: BRAND_COLORS.inkMuted,
    fontSize: 7,
  },
  timelinePct: {
    color: BRAND_COLORS.ink,
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
    marginTop: 3,
  },
  timelinePctFinal: {
    color: BRAND_COLORS.danger,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flex: 1,
  },
  card: {
    backgroundColor: BRAND_COLORS.mist,
    borderColor: BRAND_COLORS.border,
    borderRadius: 7,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  recommendationTitle: {
    color: BRAND_COLORS.trustDark,
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    marginBottom: 5,
  },
  paragraph: {
    color: BRAND_COLORS.inkMuted,
    fontSize: 8,
    lineHeight: 1.5,
  },
  row: {
    borderBottomColor: BRAND_COLORS.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    color: BRAND_COLORS.inkMuted,
    flex: 1,
    fontSize: 8,
    paddingRight: 10,
  },
  rowValue: {
    color: BRAND_COLORS.ink,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    maxWidth: '55%',
    textAlign: 'right',
  },
  rowValuePositive: {
    color: BRAND_COLORS.trustDark,
  },
  gridBadge: {
    alignSelf: 'flex-start',
    borderRadius: 5,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    marginBottom: 7,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  gridGreen: {
    backgroundColor: BRAND_COLORS.trustSurface,
    color: BRAND_COLORS.trustDark,
  },
  gridOrange: {
    backgroundColor: BRAND_COLORS.warningSurface,
    color: BRAND_COLORS.warning,
  },
  gridRed: {
    backgroundColor: BRAND_COLORS.dangerSurface,
    color: BRAND_COLORS.danger,
  },
  tableHeader: {
    backgroundColor: BRAND_COLORS.evergreen900,
    color: BRAND_COLORS.onEvergreen,
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  tableHeaderCell: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
  },
  tableRow: {
    borderBottomColor: BRAND_COLORS.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  scenarioName: {
    color: BRAND_COLORS.ink,
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    width: '28%',
  },
  scenarioValue: {
    color: BRAND_COLORS.ink,
    fontSize: 7.5,
    textAlign: 'right',
    width: '24%',
  },
  technicalCard: {
    backgroundColor: BRAND_COLORS.mist,
    borderColor: BRAND_COLORS.border,
    borderRadius: 7,
    borderWidth: 1,
    flex: 1,
    minHeight: 78,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  technicalTitle: {
    color: BRAND_COLORS.ink,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    marginBottom: 5,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  bullet: {
    color: BRAND_COLORS.trustDark,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
  },
  bulletText: {
    color: BRAND_COLORS.inkMuted,
    flex: 1,
    fontSize: 8,
    lineHeight: 1.4,
  },
  disclaimer: {
    backgroundColor: BRAND_COLORS.warningSurface,
    borderColor: BRAND_COLORS.warningBorder,
    borderRadius: 7,
    borderWidth: 1,
    color: BRAND_COLORS.warningInk,
    fontSize: 7.5,
    lineHeight: 1.45,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  footer: {
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.evergreen950,
    bottom: 0,
    color: BRAND_COLORS.onEvergreenMuted,
    flexDirection: 'row',
    fontSize: 7,
    justifyContent: 'space-between',
    left: 0,
    paddingHorizontal: 34,
    paddingVertical: 13,
    position: 'absolute',
    right: 0,
  },
  footerBrand: {
    color: BRAND_COLORS.trust,
    fontFamily: 'Helvetica-Bold',
  },
})

function money(value: number): string {
  return `€${Math.round(value).toLocaleString('nl-NL')}`
}

function number(value: number): string {
  return Math.round(value).toLocaleString('nl-NL')
}

function reportDate(value: string): string {
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value))
}

function Header({ report, subtitle }: { report: NormalizedReport; subtitle: string }) {
  return (
    <>
      <View style={S.header}>
        <View style={S.brandRow}>
          <PdfBrandMark />
          <Text style={S.brand}>
            {BRAND_WORDMARK.name}
            <Text style={S.brandSuffix}>{BRAND_WORDMARK.suffix}</Text>
          </Text>
        </View>
        <Text style={S.eyebrow}>Persoonlijk 2027-rapport</Text>
        <Text style={S.headerTitle}>{subtitle}</Text>
        <Text style={S.headerMeta}>{report.home.address || 'Adres niet beschikbaar'}</Text>
        <Text style={S.headerMeta}>Gegenereerd op {reportDate(report.generatedAt)} - model v{report.version}</Text>
      </View>
      <View style={S.deadline}>
        <Text style={S.deadlineStrong}>Deadline 1 januari 2027:</Text>
        <Text>de salderingsregeling stopt volledig.</Text>
      </View>
    </>
  )
}

function Footer({ page }: { page: number }) {
  return (
    <View style={S.footer} fixed>
      <Text>Indicatief rapport - laat de configuratie valideren door een gecertificeerde installateur.</Text>
      <Text style={S.footerBrand}>SaldeerScan.nl - {page}</Text>
    </View>
  )
}

function Metric({
  label,
  value,
  detail,
  tone = 'default',
}: {
  label: string
  value: string
  detail: string
  tone?: 'default' | 'positive' | 'danger'
}) {
  const toneStyle = tone === 'positive'
    ? S.metricValuePositive
    : tone === 'danger'
      ? S.metricValueDanger
      : undefined
  return (
    <View style={S.metric}>
      <Text style={S.metricLabel}>{label}</Text>
      <Text style={toneStyle ? [S.metricValue, toneStyle] : S.metricValue}>{value}</Text>
      <Text style={S.metricDetail}>{detail}</Text>
    </View>
  )
}

function DataRow({
  label,
  value,
  positive = false,
  last = false,
}: {
  label: string
  value: string
  positive?: boolean
  last?: boolean
}) {
  return (
    <View style={last ? [S.row, S.rowLast] : S.row}>
      <Text style={S.rowLabel}>{label}</Text>
      <Text style={positive ? [S.rowValue, S.rowValuePositive] : S.rowValue}>{value}</Text>
    </View>
  )
}

function TechnicalCards({ report }: { report: NormalizedReport }) {
  const { meterkast, plaatsing, omvormer } = report.technical
  const hasMeterkast = meterkast && typeof meterkast.geschikt === 'boolean'
  const hasPlaatsing = plaatsing && typeof plaatsing.geschiktheidScore === 'number'
  const hasOmvormer = omvormer && typeof omvormer.hybrideKlaar === 'boolean'
  return (
    <View style={S.twoColumn}>
      <View style={S.technicalCard}>
        <Text style={S.technicalTitle}>Meterkastscan</Text>
        <Text style={S.paragraph}>
          {hasMeterkast
            ? `${meterkast.merk ?? 'Merk onbekend'} - ${meterkast.drieFase ? '3-fasen' : '1-fase'} - ${meterkast.vrijeGroepen} vrije groepen - ${meterkast.geschikt ? 'geschikt' : 'aanpassing aanbevolen'}`
            : 'Niet toegevoegd'}
        </Text>
      </View>
      <View style={S.technicalCard}>
        <Text style={S.technicalTitle}>Plaatsingsscan</Text>
        <Text style={S.paragraph}>
          {hasPlaatsing
            ? `Geschiktheid ${plaatsing.geschiktheidScore}/100 - ${plaatsing.nenCompliant ? 'NEN-conform' : 'NEN-controle aanbevolen'}`
            : 'Niet toegevoegd'}
        </Text>
      </View>
      <View style={S.technicalCard}>
        <Text style={S.technicalTitle}>Omvormerscan</Text>
        <Text style={S.paragraph}>
          {hasOmvormer
            ? `${[omvormer.merk, omvormer.model].filter(Boolean).join(' ') || 'Model onbekend'} - ${omvormer.hybrideKlaar ? 'hybride-klaar' : 'niet hybride-klaar'}`
            : 'Niet toegevoegd'}
        </Text>
      </View>
    </View>
  )
}

export function SaldeerRapportPDF({ report }: { report: NormalizedReport }) {
  const recommendation = report.recommendation
  const existing = report.qualification.heeftPanelen === true
  const gridBadgeStyle = report.grid.status === 'ROOD'
    ? [S.gridBadge, S.gridRed]
    : report.grid.status === 'ORANJE'
      ? [S.gridBadge, S.gridOrange]
      : [S.gridBadge, S.gridGreen]
  const homeDetails = [
    report.home.housingType,
    report.home.buildYear === null ? null : `Bouwjaar ${report.home.buildYear}`,
    report.home.surfaceM2 === null ? null : `${report.home.surfaceM2} m²`,
    report.home.postcode,
  ].filter(Boolean).join(' - ')
  const scenarios = [
    ['Nu', report.scenarios.panelsNow],
    ['Met batterij', report.scenarios.withBattery],
    ['Wachten tot 2027', report.scenarios.waitUntil2027],
  ] as const

  return (
    <Document title="SaldeerScan - Persoonlijk 2027-rapport" author="SaldeerScan.nl">
      <Page size="A4" style={S.page}>
        <Header report={report} subtitle="Uw woning en financiële impact" />
        <View style={S.body}>
          <View style={S.section} wrap={false}>
            <Text style={S.sectionEyebrow}>Uw woning</Text>
            <View style={S.addressCard}>
              <Text style={S.address}>{report.home.address || 'Adres niet beschikbaar'}</Text>
              <Text style={S.muted}>{homeDetails || 'Woningdetails niet beschikbaar'}</Text>
            </View>
          </View>

          <View style={S.impactBox} wrap={false}>
            <Text style={S.impactLabel}>Mogelijk verlies vanaf 2027</Text>
            <Text style={S.impactValue}>-{money(report.impact.annualLossEur)} per jaar</Text>
            <Text style={S.impactText}>
              {report.impact.explanation} Per maand is dit {money(report.impact.monthlyLossEur)} en over vijf jaar {money(report.impact.fiveYearLossEur)}.
            </Text>
          </View>

          <View style={S.metricRow} wrap={false}>
            <Metric
              label="Woning-score"
              value={report.summary.healthScore === null ? 'Niet beschikbaar' : `${report.summary.healthScore}/100`}
              detail={report.summary.healthLabel ?? 'Geen scorelabel'}
            />
            <Metric
              label="Mogelijke besparing"
              value={`${money(report.summary.annualSavingEur)}/jaar`}
              detail="Volgens het servermodel"
              tone="positive"
            />
            <Metric
              label="Terugverdientijd"
              value={report.summary.paybackYears === null ? 'Nader te bepalen' : `${report.summary.paybackYears} jaar`}
              detail={existing ? 'Batterij-upgrade' : 'Nieuwe installatie'}
            />
          </View>

          <View style={S.section} wrap={false}>
            <Text style={S.sectionEyebrow}>Einde salderen</Text>
            <Text style={S.sectionTitle}>100% tot en met 2026, daarna stopt salderen</Text>
            <View style={S.timeline}>
              {report.salderingTimeline.map((item, index) => {
                const final = index === report.salderingTimeline.length - 1
                return (
                  <View key={item.year} style={final ? [S.timelineItem, S.timelineItemFinal] : S.timelineItem}>
                    <Text style={S.timelineYear}>{item.year}</Text>
                    <Text style={final ? [S.timelinePct, S.timelinePctFinal] : S.timelinePct}>{item.compensationPct}%</Text>
                  </View>
                )
              })}
            </View>
          </View>

          <View style={S.twoColumn}>
            <View style={[S.column, S.card]} wrap={false}>
              <Text style={S.sectionEyebrow}>Geadviseerde configuratie</Text>
              <Text style={S.recommendationTitle}>{recommendation.primarySolution}</Text>
              <Text style={S.paragraph}>{recommendation.explanation}</Text>
              <View style={{ marginTop: 7 }}>
                <DataRow
                  label={existing ? 'Huidige installatie' : 'Panelen'}
                  value={existing
                    ? `${recommendation.existingPanelCount ?? 'Onbekend'} panelen`
                    : `${recommendation.panelCount} panelen`}
                />
                <DataRow
                  label="Batterij"
                  value={recommendation.batteryCapacityKwh === null
                    ? 'Niet geadviseerd'
                    : `${recommendation.batteryCapacityKwh} kWh`}
                />
                <DataRow label="Investering" value={money(recommendation.investmentEur)} />
                {recommendation.extraAnnualSavingEur !== null && (
                  <DataRow label="Extra besparing opslag" value={`${money(recommendation.extraAnnualSavingEur)}/jaar`} positive />
                )}
                <DataRow
                  label="ISDE zonnepanelen/batterij"
                  value={recommendation.isdeAmountEur > 0
                    ? money(recommendation.isdeAmountEur)
                    : 'Niet van toepassing'}
                  last
                />
              </View>
            </View>

            <View style={[S.column, S.card]} wrap={false}>
              <Text style={S.sectionEyebrow}>Woning en stroomnet</Text>
              <Text style={gridBadgeStyle}>{report.grid.status ?? 'Status niet beschikbaar'}</Text>
              <DataRow label="Netbeheerder" value={report.grid.operator ?? 'Niet beschikbaar'} />
              <DataRow label="Dakoppervlak" value={report.home.roofSurfaceM2 === null ? 'Niet beschikbaar' : `${report.home.roofSurfaceM2} m²`} />
              <DataRow label="Verbruik" value={`${number(recommendation.consumptionKwh)} kWh/jaar`} />
              <DataRow label="Productie" value={`${number(recommendation.productionKwh)} kWh/jaar`} />
              <DataRow label="Eigen gebruik" value={`${recommendation.ownUsePct}%`} last />
              {report.grid.explanation && <Text style={S.muted}>{report.grid.explanation}</Text>}
            </View>
          </View>
        </View>
        <Footer page={1} />
      </Page>

      <Page size="A4" style={S.page}>
        <Header report={report} subtitle="Scenario's en technisch dossier" />
        <View style={S.body}>
          <View style={S.section} wrap={false}>
            <Text style={S.sectionEyebrow}>Scenariovergelijking</Text>
            <Text style={S.sectionTitle}>Dezelfde cijfers als uw web- en e-mailrapport</Text>
            <View style={S.tableHeader}>
              <Text style={[S.tableHeaderCell, { width: '28%' }]}>Scenario</Text>
              <Text style={[S.tableHeaderCell, { textAlign: 'right', width: '24%' }]}>Besparing/jaar</Text>
              <Text style={[S.tableHeaderCell, { textAlign: 'right', width: '24%' }]}>Investering</Text>
              <Text style={[S.tableHeaderCell, { textAlign: 'right', width: '24%' }]}>Terugverdientijd</Text>
            </View>
            {scenarios.map(([label, scenario]) => (
              <View key={label} style={S.tableRow}>
                <Text style={S.scenarioName}>{label}</Text>
                <Text style={S.scenarioValue}>{money(scenario.besparingJaarEur)}</Text>
                <Text style={S.scenarioValue}>{money(scenario.investeringEur)}</Text>
                <Text style={S.scenarioValue}>
                  {Number.isFinite(scenario.terugverdientijdJaar)
                    ? `${scenario.terugverdientijdJaar} jaar`
                    : 'Niet beschikbaar'}
                </Text>
              </View>
            ))}
          </View>

          <View style={S.section} wrap={false}>
            <Text style={S.sectionEyebrow}>Technisch dossier</Text>
            <Text style={S.sectionTitle}>Toegevoegde woningscans</Text>
            <TechnicalCards report={report} />
          </View>

          <View style={S.twoColumn}>
            <View style={[S.column, S.card]} wrap={false}>
              <Text style={S.sectionEyebrow}>Aanbevelingen</Text>
              <Text style={S.sectionTitle}>Aandachtspunten voor de installateur</Text>
              {report.recommendations.length > 0 ? report.recommendations.map((recommendation, index) => (
                <View key={`${recommendation}-${index}`} style={S.bulletRow}>
                  <Text style={S.bullet}>-</Text>
                  <Text style={S.bulletText}>{recommendation}</Text>
                </View>
              )) : <Text style={S.paragraph}>Geen aanvullende aandachtspunten opgeslagen.</Text>}
            </View>
            <View style={[S.column, S.card]} wrap={false}>
              <Text style={S.sectionEyebrow}>Kwalificatie</Text>
              <Text style={S.sectionTitle}>Uw opgegeven situatie</Text>
              <DataRow label="Woningeigenaar" value={report.qualification.isEigenaar === null ? 'Niet opgegeven' : report.qualification.isEigenaar ? 'Ja' : 'Nee'} />
              <DataRow label="Bestaande panelen" value={report.qualification.heeftPanelen === null ? 'Niet opgegeven' : report.qualification.heeftPanelen ? 'Ja' : 'Nee'} />
              <DataRow label="Aantal bestaande panelen" value={report.qualification.huidigePanelenAantal === null ? 'Niet van toepassing' : String(report.qualification.huidigePanelenAantal)} last />
            </View>
          </View>

          <View style={[S.section, { marginTop: 18 }]} wrap={false}>
            <Text style={S.disclaimer}>
              Dit rapport is indicatief en gebaseerd op de beschikbare woninggegevens en het servermodel van {reportDate(report.generatedAt)}. Werkelijke opbrengst, investering, subsidie en technische geschiktheid kunnen afwijken. Vraag altijd een gecertificeerde installateur om een locatiecontrole en definitieve offerte.
            </Text>
          </View>
        </View>
        <Footer page={2} />
      </Page>
    </Document>
  )
}
