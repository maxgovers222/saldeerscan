'use client'

import { useCallback, useEffect, useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { primaryActionClassName } from '@/components/design-system/PrimaryAction'
import { trackEvent } from '@/lib/analytics'
import {
  isMobilePdfClient,
  openPdfBlobInNewTab,
  openPdfBlobWithAnchor,
  sharePdfBlob,
  writePdfLoadingTab,
} from '@/lib/open-pdf-blob'
import type { NormalizedReport } from '@/lib/report-model'
import { cn } from '@/lib/utils'
import { SaldeerRapportPDF } from './SaldeerRapportPDF'

export default function PDFDownloadButtonInner({ report }: { report: NormalizedReport }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [shareHint, setShareHint] = useState(false)
  const filename = `SaldeerScan-2027-Rapport-${(report.home.postcode ?? 'rapport').replace(/\s/g, '')}.pdf`
  const mobile = isMobilePdfClient()

  useEffect(() => {
    setShareHint(false)
    setError(false)
  }, [report])

  const handleDownload = useCallback(async () => {
    setLoading(true)
    setError(false)
    setShareHint(false)
    trackEvent('pdf_generation_started', { report_version: report.version })

    const preOpenedTab = mobile ? null : window.open('about:blank', '_blank')
    writePdfLoadingTab(preOpenedTab)

    try {
      const blob = await pdf(<SaldeerRapportPDF report={report} />).toBlob()
      const url = URL.createObjectURL(blob)
      let opened = false

      if (mobile) {
        try {
          opened = await sharePdfBlob(blob, filename)
          if (opened) setShareHint(true)
        } catch (shareError) {
          if (shareError instanceof Error && shareError.name === 'AbortError') {
            preOpenedTab?.close()
            return
          }
        }
      }

      if (!opened) {
        opened = openPdfBlobInNewTab(url, preOpenedTab)
      }

      if (!opened) {
        openPdfBlobWithAnchor(url, filename, mobile)
        opened = true
      }

      trackEvent('pdf_open_succeeded', { report_version: report.version })
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch {
      setError(true)
      preOpenedTab?.close()
      trackEvent('pdf_open_failed', { report_version: report.version })
    } finally {
      setLoading(false)
    }
  }, [report, filename, mobile])

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className={cn(
          primaryActionClassName,
          'w-full gap-3 px-6 py-4 text-base disabled:cursor-wait disabled:opacity-60',
        )}
      >
        {error ? (
          <span className="text-sm" aria-live="polite">Fout bij genereren - probeer opnieuw</span>
        ) : loading ? (
          <>
            <div className="size-4 animate-spin rounded-full border-2 border-evergreen-950 border-t-transparent" />
            PDF wordt opgebouwd...
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2v6h6M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Download uw gratis PDF-rapport
          </>
        )}
      </button>
      {shareHint && (
        <p className="text-center text-xs leading-5 text-ink-muted" role="status">
          Kies in het menu &quot;Opslaan&quot; of &quot;Openen&quot; om uw PDF te bekijken.
        </p>
      )}
    </div>
  )
}
