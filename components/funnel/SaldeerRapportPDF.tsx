import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { FunnelState } from './types'

const S = StyleSheet.create({
  page: { backgroundColor: '#ffffff', fontFamily: 'Helvetica', padding: 0 },

  // Header
  header: { backgroundColor: '#020617', padding: '28 32 24 32' },
  headerLogo: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#f59e0b', marginBottom: 4 },
  headerSub: { fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase' },
  headerDate: { fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 8 },

  // Urgency bar
  urgencyBar: { backgroundColor: '#7c2d12', padding: '10 32', flexDirection: 'row', alignItems: 'center', gap: 8 },
  urgencyText: { fontSize: 9, color: '#fca5a5', letterSpacing: 1 },
  urgencyBold: { fontSize: 9, color: '#f87171', fontFamily: 'Helvetica-Bold' },

  // Body
  body: { padding: '28 32' },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 7, color: '#94a3b8', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  sectionTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginBottom: 10 },

  // Address block
  addressBox: { backgroundColor: '#f8fafc', borderRadius: 6, padding: '12 16', marginBottom: 4 },
  addressText: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  addressSub: { fontSize: 9, color: '#64748b', marginTop: 2 },

  // Stat row
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 6, padding: '12 14', borderLeft: '3 solid #f59e0b' },
  statLabel: { fontSize: 7, color: '#94a3b8', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
  statValue: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#f59e0b' },
  statUnit: { fontSize: 9, color: '#94a3b8', marginTop: 2 },

  // Table
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, borderBottom: '1 solid #f1f5f9' },
  tableLabel: { fontSize: 9, color: '#64748b' },
  tableValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  tableValueAmber: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#f59e0b' },
  tableValueRed: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#ef4444' },
  tableValueGreen: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#10b981' },

  // Timeline
  timelineRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  timelineItem: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 6, padding: '10 12', alignItems: 'center' },
  timelineYear: { fontSize: 8, color: '#94a3b8', marginBottom: 3 },
  timelinePct: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  timelineItemRed: { flex: 1, backgroundColor: '#fef2f2', borderRadius: 6, padding: '10 12', alignItems: 'center' },
  timelinePctRed: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#ef4444' },

  // Net badge
  netBadgeRood: { backgroundColor: '#fef2f2', borderRadius: 4, padding: '4 10', alignSelf: 'flex-start' },
  netBadgeOranje: { backgroundColor: '#fffbeb', borderRadius: 4, padding: '4 10', alignSelf: 'flex-start' },
  netBadgeGroen: { backgroundColor: '#f0fdf4', borderRadius: 4, padding: '4 10', alignSelf: 'flex-start' },
  netBadgeTextRood: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#dc2626' },
  netBadgeTextOranje: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#d97706' },
  netBadgeTextGroen: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#16a34a' },

  // Aanbevelingen
  bulletRow: { flexDirection: 'row', gap: 8, marginBottom: 5 },
  bullet: { fontSize: 9, color: '#f59e0b', marginTop: 1 },
  bulletText: { fontSize: 9, color: '#475569', flex: 1, lineHeight: 1.5 },

  // Footer
  footer: { backgroundColor: '#020617', padding: '14 32', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' },
  footerText: { fontSize: 7, color: 'rgba(255,255,255,0.3)' },
  footerBrand: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#f59e0b' },

  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 16 },
})

export function SaldeerRapportPDF({ state }: { state: FunnelState }) {
  const roi = state.roiResult
  const health = state.healthScore
  const bag = state.bagData
  const net = state.netcongestie
  const isde = roi?.isdeSchatting

  const datum = new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })

  const netBadgeStyle = net?.status === 'ROOD' ? S.netBadgeRood : net?.status === 'ORANJE' ? S.netBadgeOranje : S.netBadgeGroen
  const netTextStyle = net?.status === 'ROOD' ? S.netBadgeTextRood : net?.status === 'ORANJE' ? S.netBadgeTextOranje : S.netBadgeTextGroen
  const netLabel = net?.status === 'ROOD' ? 'VOL STROOMNET' : net?.status === 'ORANJE' ? 'DRUK STROOMNET' : 'VRIJ STROOMNET'

  return (
    <Document title="SaldeerScan — Persoonlijk 2027-Rapport" author="SaldeerScan.nl">
      <Page size="A4" style={S.page}>

        {/* Header */}
        <View style={S.header}>
          <Text style={S.headerLogo}>SaldeerScan.nl</Text>
          <Text style={S.headerSub}>Persoonlijk 2027-Investeringsrapport</Text>
          <Text style={S.headerDate}>Gegenereerd op {datum}</Text>
        </View>

        {/* Urgency bar */}
        <View style={S.urgencyBar}>
          <Text style={S.urgencyBold}>⚠ DEADLINE:</Text>
          <Text style={S.urgencyText}>Salderingsregeling stopt volledig per 1 januari 2027 — 2026 nog 28% voordeel</Text>
        </View>

        <View style={S.body}>

          {/* Adres */}
          <View style={S.section}>
            <Text style={S.sectionLabel}>Uw woning</Text>
            <View style={S.addressBox}>
              <Text style={S.addressText}>{state.adres || '—'}</Text>
              <Text style={S.addressSub}>
                {[bag?.woningtype, bag?.bouwjaar ? `Bouwjaar ${bag.bouwjaar}` : null, bag?.oppervlakte ? `${bag.oppervlakte} m²` : null].filter(Boolean).join(' · ')}
              </Text>
            </View>
          </View>

          {/* Stat cards */}
          <View style={S.statsRow}>
            <View style={S.statCard}>
              <Text style={S.statLabel}>Energie Score</Text>
              <Text style={S.statValue}>{health?.score ?? '—'}<Text style={{ fontSize: 11, color: '#94a3b8' }}>/100</Text></Text>
              <Text style={S.statUnit}>{health?.label ?? ''}</Text>
            </View>
            <View style={S.statCard}>
              <Text style={S.statLabel}>Besparing per jaar</Text>
              <Text style={S.statValue}>€{roi?.scenarioNu.besparingJaarEur.toLocaleString('nl-NL') ?? '—'}</Text>
              <Text style={S.statUnit}>zonder saldering</Text>
            </View>
            <View style={S.statCard}>
              <Text style={S.statLabel}>Terugverdientijd</Text>
              <Text style={S.statValue}>{roi?.scenarioNu.terugverdientijdJaar ?? '—'}<Text style={{ fontSize: 11, color: '#94a3b8' }}> jr</Text></Text>
              <Text style={S.statUnit}>bij huidig tarief</Text>
            </View>
          </View>

          {/* 2027 Tijdlijn */}
          <View style={S.section}>
            <Text style={S.sectionLabel}>2027 Salderingsafbouw</Text>
            <View style={S.timelineRow}>
              {[{ jaar: '2024', pct: '100%' }, { jaar: '2025', pct: '64%' }, { jaar: '2026', pct: '28%' }].map(({ jaar, pct }) => (
                <View key={jaar} style={S.timelineItem}>
                  <Text style={S.timelineYear}>{jaar}</Text>
                  <Text style={S.timelinePct}>{pct}</Text>
                </View>
              ))}
              <View style={S.timelineItemRed}>
                <Text style={S.timelineYear}>2027 →</Text>
                <Text style={S.timelinePctRed}>0%</Text>
              </View>
            </View>
            {roi?.shockEffect2027 && (
              <View style={[S.tableRow, { marginTop: 8, borderBottom: 'none' }]}>
                <Text style={S.tableLabel}>Verwacht jaarlijks verlies vanaf 2027</Text>
                <Text style={S.tableValueRed}>−€{roi.shockEffect2027.jaarlijksVerlies.toLocaleString('nl-NL')}/jaar</Text>
              </View>
            )}
          </View>

          <View style={S.divider} />

          {/* ROI details */}
          {roi && (
            <View style={S.section}>
              <Text style={S.sectionLabel}>ROI Analyse</Text>
              {[
                { label: 'Geschat verbruik', value: `${roi.geschatVerbruikKwh.toLocaleString('nl-NL')} kWh/jaar` },
                { label: 'Aantal panelen (advies)', value: `${roi.aantalPanelen} panelen` },
                { label: 'Geschatte productie', value: `${roi.productieKwh.toLocaleString('nl-NL')} kWh/jaar` },
                { label: 'Eigen gebruik', value: `${roi.eigenGebruikPct}%` },
                { label: 'Investering (schatting)', value: `€${roi.scenarioNu.investeringEur.toLocaleString('nl-NL')}` },
              ].map(({ label, value }) => (
                <View key={label} style={S.tableRow}>
                  <Text style={S.tableLabel}>{label}</Text>
                  <Text style={S.tableValue}>{value}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Netcongestie + ISDE naast elkaar */}
          <View style={[S.statsRow, { marginBottom: 0 }]}>
            {net && (
              <View style={{ flex: 1 }}>
                <Text style={S.sectionLabel}>Netcongestie</Text>
                <View style={netBadgeStyle}>
                  <Text style={netTextStyle}>{net.status} — {netLabel}</Text>
                </View>
                {net.netbeheerder && <Text style={[S.addressSub, { marginTop: 6 }]}>{net.netbeheerder}</Text>}
              </View>
            )}
            {isde && isde.bedragEur > 0 && (
              <View style={{ flex: 1 }}>
                <Text style={S.sectionLabel}>ISDE Subsidie</Text>
                <Text style={[S.statValue, { fontSize: 16 }]}>€{isde.bedragEur.toLocaleString('nl-NL')}</Text>
                <Text style={S.addressSub}>{isde.apparaatType} · {isde.vermogenKwp} kWp</Text>
              </View>
            )}
          </View>

          {/* Aanbevelingen */}
          {health?.aanbevelingen?.length ? (
            <View style={[S.section, { marginTop: 20 }]}>
              <Text style={S.sectionLabel}>Aanbevelingen</Text>
              {health.aanbevelingen.slice(0, 4).map((a, i) => (
                <View key={i} style={S.bulletRow}>
                  <Text style={S.bullet}>›</Text>
                  <Text style={S.bulletText}>{a}</Text>
                </View>
              ))}
            </View>
          ) : null}

        </View>

        {/* Footer */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>Dit rapport is indicatief. Vraag een gecertificeerde installateur om een exacte offerte.</Text>
          <Text style={S.footerBrand}>SaldeerScan.nl</Text>
        </View>

      </Page>
    </Document>
  )
}
