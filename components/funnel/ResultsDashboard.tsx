import type { NormalizedReport } from '@/lib/report-model'
import { ReportAccordion } from '@/components/report/ReportAccordion'
import { ReportHomeAndGrid } from '@/components/report/ReportHomeAndGrid'
import { ReportImpact } from '@/components/report/ReportImpact'
import { ReportRecommendation } from '@/components/report/ReportRecommendation'
import { ReportSection } from '@/components/report/ReportSection'
import { ReportShell } from '@/components/report/ReportShell'
import { ReportSummary } from '@/components/report/ReportSummary'
import { ReportTechnical } from '@/components/report/ReportTechnical'
import { SubmissionStatus } from '@/components/report/SubmissionStatus'

export function ResultsDashboard({
  report,
}: {
  report: NormalizedReport
}) {
  return (
    <ReportShell report={report}>
      <SubmissionStatus status={report.delivery.emailStatus} />
      <ReportSummary report={report} />

      <div
        id="report-mobile-details"
        data-testid="report-mobile-details"
        className="space-y-3 md:hidden"
      >
        <ReportAccordion title="Uw aanbevolen oplossing">
          <ReportRecommendation report={report} />
        </ReportAccordion>
        <ReportAccordion title="Waarom dit advies?">
          <ReportImpact report={report} />
        </ReportAccordion>
        <ReportAccordion title="Technische details">
          <div className="space-y-5">
            <ReportHomeAndGrid report={report} />
            <ReportTechnical report={report} />
          </div>
        </ReportAccordion>
      </div>

      <div data-testid="report-desktop-grid" className="hidden gap-5 md:grid md:grid-cols-2">
        <div className="md:col-span-2">
          <ReportSection title="Impact vanaf 2027">
            <ReportImpact report={report} />
          </ReportSection>
        </div>
        <ReportSection title="Geadviseerde configuratie">
          <ReportRecommendation report={report} />
        </ReportSection>
        <ReportSection title="Woning en stroomnet">
          <ReportHomeAndGrid report={report} />
        </ReportSection>
        <div className="md:col-span-2">
          <ReportSection title="Technisch dossier">
            <ReportTechnical report={report} />
          </ReportSection>
        </div>
      </div>
    </ReportShell>
  )
}
