/** @jsxImportSource react */

import {
  Document,
  Font,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'
import { PdfBrandMark } from '@/components/report/PdfBrandMark'
import { BRAND_COLORS, BRAND_WORDMARK } from '@/lib/brand-colors'
import type { NormalizedReport } from '@/lib/report-model'

const fontSource = (filename: string) => typeof window === 'undefined'
  ? `${process.cwd().replace(/\\/g, '/')}/public/fonts/${filename}`
  : `/fonts/${filename}`

Font.register({
  family: 'Bricolage Grotesque',
  fonts: [
    { src: fontSource('BricolageGrotesque-Bold.ttf'), fontWeight: 700 },
  ],
})

Font.register({
  family: 'DM Sans',
  fonts: [
    { src: fontSource('DMSans-Regular.ttf'), fontWeight: 400 },
    { src: fontSource('DMSans-SemiBold.ttf'), fontWeight: 600 },
    { src: fontSource('DMSans-Bold.ttf'), fontWeight: 700 },
  ],
})

Font.registerHyphenationCallback(word => [word])

const S = StyleSheet.create({
  page: {
    backgroundColor: BRAND_COLORS.paper,
    color: BRAND_COLORS.ink,
    fontFamily: 'DM Sans',
    fontSize: 9,
    paddingBottom: 48,
  },
  header: {
    backgroundColor: BRAND_COLORS.evergreen950,
    paddingHorizontal: 34,
    paddingVertical: 21,
  },
  continuationHeader: {
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.evergreen950,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 34,
    paddingVertical: 15,
  },
  continuationMeta: {
    alignItems: 'flex-end',
    maxWidth: '55%',
  },
  continuationLabel: {
    color: BRAND_COLORS.onEvergreenMuted,
    fontSize: 6.5,
    fontWeight: 600,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  continuationAddress: {
    color: BRAND_COLORS.onEvergreen,
    fontSize: 8,
    marginTop: 3,
    textAlign: 'right',
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  brand: {
    color: BRAND_COLORS.onEvergreen,
    fontFamily: 'Bricolage Grotesque',
    fontWeight: 700,
    fontSize: 18,
  },
  brandSuffix: {
    color: BRAND_COLORS.trust,
  },
  eyebrow: {
    color: BRAND_COLORS.onEvergreenMuted,
    fontWeight: 600,
    fontSize: 7,
    letterSpacing: 1.6,
    marginTop: 5,
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: BRAND_COLORS.onEvergreen,
    fontFamily: 'Bricolage Grotesque',
    fontWeight: 700,
    fontSize: 18,
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
    fontWeight: 700,
  },
  body: {
    paddingHorizontal: 34,
    paddingTop: 20,
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
    fontFamily: 'Bricolage Grotesque',
    fontWeight: 700,
    fontSize: 13,
    marginBottom: 9,
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
    fontWeight: 600,
    fontSize: 6.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  metricValue: {
    color: BRAND_COLORS.ink,
    fontFamily: 'Courier-Bold',
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
    fontWeight: 600,
    fontSize: 7,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  impactValue: {
    color: BRAND_COLORS.warning,
    fontFamily: 'Courier-Bold',
    fontSize: 23,
    marginTop: 5,
  },
  impactText: {
    color: BRAND_COLORS.inkMuted,
    fontSize: 8,
    lineHeight: 1.45,
    marginTop: 5,
  },
  adviceBox: {
    backgroundColor: BRAND_COLORS.trustSurface,
    borderColor: BRAND_COLORS.trust,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  adviceText: {
    color: BRAND_COLORS.inkMuted,
    fontSize: 8,
    lineHeight: 1.45,
    marginTop: 4,
  },
  impactPanel: {
    backgroundColor: BRAND_COLORS.paper,
    borderColor: BRAND_COLORS.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  impactStats: {
    flexDirection: 'row',
    gap: 28,
    marginBottom: 12,
  },
  impactStatLabel: {
    color: BRAND_COLORS.inkMuted,
    fontSize: 6.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  impactStatValue: {
    color: BRAND_COLORS.ink,
    fontFamily: 'Courier-Bold',
    fontSize: 10,
    marginTop: 3,
  },
  subsectionTitle: {
    color: BRAND_COLORS.ink,
    fontWeight: 600,
    fontSize: 9,
    marginBottom: 7,
  },
  timeline: {
    gap: 6,
  },
  timelineItem: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  timelineYear: {
    color: BRAND_COLORS.inkMuted,
    fontFamily: 'Courier',
    fontSize: 7,
    width: 34,
  },
  timelineTrack: {
    backgroundColor: BRAND_COLORS.border,
    borderRadius: 4,
    flex: 1,
    height: 6,
    overflow: 'hidden',
  },
  timelineFill: {
    backgroundColor: BRAND_COLORS.action,
    borderRadius: 4,
    height: 6,
  },
  timelinePct: {
    color: BRAND_COLORS.ink,
    fontFamily: 'Courier-Bold',
    fontSize: 7,
    textAlign: 'right',
    width: 32,
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
    fontFamily: 'Bricolage Grotesque',
    fontWeight: 700,
    fontSize: 13,
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
    fontWeight: 700,
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
    fontWeight: 700,
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
    borderBottomColor: BRAND_COLORS.border,
    borderBottomWidth: 1,
    color: BRAND_COLORS.inkMuted,
    flexDirection: 'row',
    paddingHorizontal: 2,
    paddingVertical: 7,
  },
  tableHeaderCell: {
    fontWeight: 600,
    fontSize: 7,
  },
  tableRow: {
    borderBottomColor: BRAND_COLORS.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 2,
    paddingVertical: 8,
  },
  scenarioName: {
    color: BRAND_COLORS.ink,
    fontWeight: 600,
    fontSize: 7.5,
    width: '28%',
  },
  scenarioValue: {
    color: BRAND_COLORS.ink,
    fontFamily: 'Courier',
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
    fontWeight: 600,
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
    fontWeight: 700,
    fontSize: 8,
  },
  bulletText: {
    color: BRAND_COLORS.inkMuted,
    flex: 1,
    fontSize: 8,
    lineHeight: 1.4,
  },
  stepRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 7,
    marginBottom: 6,
  },
  stepNumber: {
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.trustSurface,
    borderRadius: 7,
    color: BRAND_COLORS.trustDark,
    fontFamily: 'Courier-Bold',
    fontSize: 7,
    height: 14,
    justifyContent: 'center',
    textAlign: 'center',
    width: 14,
  },
  methodLink: {
    color: BRAND_COLORS.trustDark,
    fontSize: 8,
    fontWeight: 600,
    marginTop: 7,
    textDecoration: 'none',
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
    fontFamily: 'Bricolage Grotesque',
    fontWeight: 700,
  },
  technicalEmpty: {
    backgroundColor: BRAND_COLORS.mist,
    borderColor: BRAND_COLORS.border,
    borderRadius: 7,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
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

function Header({ report, contextLabel }: { report: NormalizedReport; contextLabel: string }) {
  return (
    <View style={S.header} wrap={false}>
      <View style={S.brandRow}>
        <PdfBrandMark />
        <Text style={S.brand}>
          {BRAND_WORDMARK.name}
          <Text style={S.brandSuffix}>{BRAND_WORDMARK.suffix}</Text>
        </Text>
      </View>
      <Text style={S.eyebrow}>{contextLabel}</Text>
      <Text style={S.headerTitle}>Uw SaldeerScan rapport</Text>
      <Text style={S.headerMeta}>{report.home.address || 'Adres niet beschikbaar'}</Text>
      <Text style={S.headerMeta}>Gegenereerd op {reportDate(report.generatedAt)} - model v{report.version}</Text>
    </View>
  )
}

function ContinuationHeader({ report }: { report: NormalizedReport }) {
  return (
    <View style={S.continuationHeader} wrap={false}>
      <View style={S.brandRow}>
        <PdfBrandMark size={20} />
        <Text style={[S.brand, { fontSize: 14 }]}>
          {BRAND_WORDMARK.name}
          <Text style={S.brandSuffix}>{BRAND_WORDMARK.suffix}</Text>
        </Text>
      </View>
      <View style={S.continuationMeta}>
        <Text style={S.continuationLabel}>Advies en technisch dossier</Text>
        <Text style={S.continuationAddress}>{report.home.address || 'Persoonlijk rapport'}</Text>
      </View>
    </View>
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

  if (!hasMeterkast && !hasPlaatsing && !hasOmvormer) {
    return (
      <View style={S.technicalEmpty}>
        <Text style={S.technicalTitle}>Geen fotoscans toegevoegd</Text>
        <Text style={S.paragraph}>
          Dit rapport gebruikt de beschikbare woning-, stroomnet- en rekengegevens. Technische geschiktheid wordt altijd op locatie gevalideerd.
        </Text>
      </View>
    )
  }

  return (
    <View style={S.twoColumn}>
      {hasMeterkast && (
        <View style={S.technicalCard}>
          <Text style={S.technicalTitle}>Meterkastscan</Text>
          <Text style={S.paragraph}>
            {meterkast.merk ?? 'Merk onbekend'} - {meterkast.drieFase ? '3-fasen' : '1-fase'} - {meterkast.vrijeGroepen} vrije groepen - {meterkast.geschikt ? 'geschikt' : 'aanpassing aanbevolen'}
          </Text>
        </View>
      )}
      {hasPlaatsing && (
        <View style={S.technicalCard}>
          <Text style={S.technicalTitle}>Plaatsingsscan</Text>
          <Text style={S.paragraph}>
            Foto-indicatie {plaatsing.geschiktheidScore}/10 - {plaatsing.nenCompliant ? 'geen directe aandachtspunten zichtbaar' : 'controle op locatie aanbevolen'}
          </Text>
        </View>
      )}
      {hasOmvormer && (
        <View style={S.technicalCard}>
          <Text style={S.technicalTitle}>Omvormerscan</Text>
          <Text style={S.paragraph}>
            {[omvormer.merk, omvormer.model].filter(Boolean).join(' ') || 'Model onbekend'} - {omvormer.hybrideKlaar ? 'hybride-klaar' : 'niet hybride-klaar'}
          </Text>
        </View>
      )}
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
      : report.grid.status === 'GROEN'
        ? [S.gridBadge, S.gridGreen]
        : null
  const scenarios = existing
    ? [
        {
          label: 'Huidige installatie (2026)',
          saving: report.scenarios.panelsNow.besparingJaarEur,
          investment: 0,
          paybackYears: null,
        },
        {
          label: 'Vanaf 2027 met batterij',
          saving: report.scenarios.withBattery.besparingJaarEur,
          investment: recommendation.investmentEur,
          paybackYears: recommendation.paybackYears,
        },
        {
          label: 'Vanaf 2027 zonder batterij',
          saving: report.scenarios.waitUntil2027.besparingJaarEur,
          investment: 0,
          paybackYears: null,
        },
      ]
    : [
        {
          label: 'Nu',
          saving: report.scenarios.panelsNow.besparingJaarEur,
          investment: report.scenarios.panelsNow.investeringEur,
          paybackYears: report.scenarios.panelsNow.terugverdientijdJaar,
        },
        {
          label: 'Met batterij',
          saving: report.scenarios.withBattery.besparingJaarEur,
          investment: report.scenarios.withBattery.investeringEur,
          paybackYears: report.scenarios.withBattery.terugverdientijdJaar,
        },
        {
          label: 'Wachten tot 2027',
          saving: report.scenarios.waitUntil2027.besparingJaarEur,
          investment: report.scenarios.waitUntil2027.investeringEur,
          paybackYears: report.scenarios.waitUntil2027.terugverdientijdJaar,
        },
      ]
  const recommendationRows = [
    {
      label: existing ? 'Huidige installatie' : 'Configuratie',
      value: existing
        ? `${recommendation.existingPanelCount ?? 'Onbekend'} panelen`
        : `${recommendation.panelCount} zonnepanelen`,
    },
    {
      label: 'Batterij',
      value: recommendation.batteryCapacityKwh === null
        ? 'Niet geadviseerd'
        : `${recommendation.batteryCapacityKwh} kWh`,
    },
    { label: 'Investering', value: money(recommendation.investmentEur) },
    { label: 'Opbrengst', value: `${number(recommendation.productionKwh)} kWh/jaar` },
    { label: 'Verbruik', value: `${number(recommendation.consumptionKwh)} kWh/jaar` },
    { label: 'Eigen gebruik', value: `${recommendation.ownUsePct}%` },
    ...(recommendation.isdeAmountEur > 0
      ? [{ label: 'Indicatieve ISDE-bijdrage', value: money(recommendation.isdeAmountEur) }]
      : []),
  ]
  const homeRows = [
    report.home.housingType ? { label: 'Woningtype', value: report.home.housingType } : null,
    report.home.buildYear === null ? null : { label: 'Bouwjaar', value: String(report.home.buildYear) },
    report.home.surfaceM2 === null ? null : { label: 'Woonoppervlak', value: `${report.home.surfaceM2} m²` },
    report.home.roofSurfaceM2 === null ? null : { label: 'Dakoppervlak', value: `${report.home.roofSurfaceM2} m²` },
    report.grid.operator ? { label: 'Netbeheerder', value: report.grid.operator } : null,
  ].filter((row): row is { label: string; value: string } => row !== null)
  const qualificationRows = [
    report.qualification.isEigenaar === null
      ? null
      : { label: 'Woningeigenaar', value: report.qualification.isEigenaar ? 'Ja' : 'Nee' },
    report.qualification.heeftPanelen === null
      ? null
      : { label: 'Bestaande panelen', value: report.qualification.heeftPanelen ? 'Ja' : 'Nee' },
    report.qualification.huidigePanelenAantal === null
      ? null
      : { label: 'Aantal bestaande panelen', value: String(report.qualification.huidigePanelenAantal) },
  ].filter((row): row is { label: string; value: string } => row !== null)

  return (
    <Document title="SaldeerScan - Persoonlijk 2027-rapport" author="SaldeerScan.nl">
      <Page size="A4" style={S.page}>
        <Header report={report} contextLabel="Persoonlijk 2027-rapport" />
        <View style={S.deadline}>
          <Text style={S.deadlineStrong}>Deadline 1 januari 2027:</Text>
          <Text>de salderingsregeling stopt volledig.</Text>
        </View>
        <View style={S.body}>
          <View style={S.impactBox} wrap={false}>
            <Text style={S.impactLabel}>Mogelijk verlies vanaf 2027</Text>
            <Text style={S.impactValue}>-{money(report.impact.annualLossEur)} per jaar</Text>
            <Text style={S.impactText}>{report.impact.explanation}</Text>
          </View>

          <View style={S.metricRow} wrap={false}>
            <Metric
              label={existing ? 'Extra opslagvoordeel vanaf 2027' : 'Mogelijke besparing'}
              value={`${money(report.summary.annualSavingEur)}/jaar`}
              detail={existing ? 'Versus dezelfde installatie zonder batterij' : 'Volgens het servermodel'}
              tone="positive"
            />
            <Metric
              label="Terugverdientijd"
              value={report.summary.paybackYears === null ? 'Nader te bepalen' : `${report.summary.paybackYears} jaar`}
              detail={existing ? 'Batterij-upgrade' : 'Nieuwe installatie'}
            />
            <Metric
              label="Woning-score"
              value={report.summary.healthScore === null ? 'Niet beschikbaar' : `${report.summary.healthScore}/100`}
              detail={report.summary.healthLabel ?? 'Nog niet bepaald'}
            />
          </View>

          <View style={S.adviceBox} wrap={false}>
            <Text style={S.sectionEyebrow}>Ons advies</Text>
            <Text style={S.recommendationTitle}>{recommendation.primarySolution}</Text>
            <Text style={S.adviceText}>
              {existing
                ? `${recommendation.existingPanelCount ?? 'Uw'} bestaande panelen blijven onderdeel van uw installatie${recommendation.batteryCapacityKwh === null ? '.' : `, aangevuld met een ${recommendation.batteryCapacityKwh} kWh batterij.`}`
                : `Een configuratie met ${recommendation.panelCount} zonnepanelen${recommendation.batteryCapacityKwh === null ? '.' : ` en een ${recommendation.batteryCapacityKwh} kWh batterij.`}`}
            </Text>
          </View>

          <View style={S.impactPanel} wrap={false}>
            <Text style={S.sectionTitle}>Impact vanaf 2027</Text>
            <View style={S.impactStats}>
              <View>
                <Text style={S.impactStatLabel}>Per maand</Text>
                <Text style={S.impactStatValue}>{money(report.impact.monthlyLossEur)}</Text>
              </View>
              <View>
                <Text style={S.impactStatLabel}>Over vijf jaar</Text>
                <Text style={S.impactStatValue}>{money(report.impact.fiveYearLossEur)}</Text>
              </View>
            </View>
            <Text style={S.subsectionTitle}>Einde salderen</Text>
            <View style={S.timeline}>
              {report.salderingTimeline.map(item => (
                <View key={item.year} style={S.timelineItem}>
                  <Text style={S.timelineYear}>{item.year}</Text>
                  <View style={S.timelineTrack}>
                    <View style={[S.timelineFill, { width: `${Math.max(item.compensationPct, 2)}%` }]} />
                  </View>
                  <Text style={item.compensationPct === 0 ? [S.timelinePct, S.timelinePctFinal] : S.timelinePct}>
                    {item.compensationPct}%
                  </Text>
                </View>
              ))}
            </View>

            <Text style={[S.subsectionTitle, { marginTop: 13 }]}>Scenariovergelijking</Text>
            <View style={S.tableHeader}>
              <Text style={[S.tableHeaderCell, { width: '28%' }]}>Scenario</Text>
              <Text style={[S.tableHeaderCell, { textAlign: 'right', width: '24%' }]}>Besparing/jaar</Text>
              <Text style={[S.tableHeaderCell, { textAlign: 'right', width: '24%' }]}>Investering</Text>
              <Text style={[S.tableHeaderCell, { textAlign: 'right', width: '24%' }]}>Terugverdientijd</Text>
            </View>
            {scenarios.map(scenario => (
              <View key={scenario.label} style={S.tableRow}>
                <Text style={S.scenarioName}>{scenario.label}</Text>
                <Text style={S.scenarioValue}>{money(scenario.saving)}</Text>
                <Text style={S.scenarioValue}>{money(scenario.investment)}</Text>
                <Text style={S.scenarioValue}>
                  {scenario.paybackYears !== null && Number.isFinite(scenario.paybackYears)
                    ? `${scenario.paybackYears} jaar`
                    : '-'}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <Footer page={1} />
      </Page>

      <Page size="A4" style={S.page}>
        <ContinuationHeader report={report} />
        <View style={S.body}>
          <View style={[S.twoColumn, S.section]}>
            <View style={[S.column, S.card]} wrap={false}>
              <Text style={S.sectionEyebrow}>Geadviseerde configuratie</Text>
              <Text style={S.recommendationTitle}>{recommendation.primarySolution}</Text>
              <Text style={S.paragraph}>{recommendation.explanation}</Text>
              <View style={{ marginTop: 7 }}>
                {recommendationRows.map((row, index) => (
                  <DataRow
                    key={row.label}
                    label={row.label}
                    value={row.value}
                    last={index === recommendationRows.length - 1}
                  />
                ))}
              </View>
              {recommendation.batteryCapacityKwh !== null && recommendation.extraAnnualSavingEur !== null && (
                <Text style={[S.adviceText, { color: BRAND_COLORS.trustDark }]}>Opslagvoordeel: {money(recommendation.extraAnnualSavingEur)} per jaar.</Text>
              )}
            </View>

            <View style={[S.column, S.card]} wrap={false}>
              <Text style={S.sectionEyebrow}>Woning en stroomnet</Text>
              {gridBadgeStyle && report.grid.status && <Text style={gridBadgeStyle}>{report.grid.status}</Text>}
              {homeRows.map((row, index) => (
                <DataRow
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  last={index === homeRows.length - 1}
                />
              ))}
              {report.grid.explanation && <Text style={S.muted}>{report.grid.explanation}</Text>}
            </View>
          </View>

          <View style={S.section} wrap={false}>
            <Text style={S.sectionEyebrow}>Technisch dossier</Text>
            <Text style={S.sectionTitle}>Technische foto-indicaties</Text>
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
            {qualificationRows.length > 0 && (
              <View style={[S.column, S.card]} wrap={false}>
                <Text style={S.sectionEyebrow}>Uw situatie</Text>
                <Text style={S.sectionTitle}>Door u opgegeven</Text>
                {qualificationRows.map((row, index) => (
                  <DataRow
                    key={row.label}
                    label={row.label}
                    value={row.value}
                    last={index === qualificationRows.length - 1}
                  />
                ))}
              </View>
            )}
          </View>

          <View style={[S.twoColumn, { marginTop: 18 }]} wrap={false}>
            <View style={[S.column, S.card]}>
              <Text style={S.sectionEyebrow}>Uw actieplan</Text>
              <Text style={S.sectionTitle}>Gebruik dit rapport als startpunt</Text>
              {[
                'Vergelijk het advies met uw actuele verbruik en energietarieven.',
                'Laat installatie en dimensionering op locatie controleren.',
                "Toets de scenario's aan een gespecificeerde offerte.",
              ].map((step, index) => (
                <View key={step} style={S.stepRow}>
                  <Text style={S.stepNumber}>{index + 1}</Text>
                  <Text style={S.bulletText}>{step}</Text>
                </View>
              ))}
            </View>
            <View style={[S.column, S.card]}>
              <Text style={S.sectionEyebrow}>Rekenbasis</Text>
              <Text style={S.sectionTitle}>Transparant en indicatief</Text>
              <Text style={S.paragraph}>
                Gebaseerd op BAG-woningdata, uw antwoorden, regionale netinformatie en het servermodel. Actuele offerteprijzen, kwartierdata en leveranciersvoorwaarden zijn niet meegenomen.
                Uitkomsten blijven indicatief en kunnen afwijken.
              </Text>
              <Link src="https://saldeerscan.nl/methode" style={S.methodLink}>
                saldeerscan.nl/methode
              </Link>
            </View>
          </View>
        </View>
        <Footer page={2} />
      </Page>
    </Document>
  )
}
