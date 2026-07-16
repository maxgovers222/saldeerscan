'use client'

import { useCallback, useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { primaryActionClassName } from '@/components/design-system/PrimaryAction'
import { trackEvent } from '@/lib/analytics'
import type { NormalizedReport } from '@/lib/report-model'
import { cn } from '@/lib/utils'
import { SaldeerRapportPDF } from './SaldeerRapportPDF'

export default function PDFDownloadButtonInner({ report }: { report: NormalizedReport }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const filename = `SaldeerScan-2027-Rapport-${(report.home.postcode ?? 'rapport').replace(/\s/g, '')}.pdf`

  const handleDownload = useCallback(async () => {
    setLoading(true)
    setError(false)
    trackEvent('pdf_generation_started', { report_version: report.version })
    // Open het tabblad synchroon binnen de click-handler - voorkomt dat mobiele
    // browsers (o.a. iOS Safari) de popup blokkeren omdat het PDF-genereren async is.
    const newTab = window.open('', '_blank')
    try {
      const blob = await pdf(<SaldeerRapportPDF report={report} />).toBlob()
      const url = URL.createObjectURL(blob)
      if (newTab) {
        // Nieuw tabblad met de PDF: werkt betrouwbaar op desktop en mobiel
        // (iOS Safari respecteert het download-attribuut op <a> niet consistent).
        newTab.location.href = url
      } else {
        // Popup geblokkeerd - val terug op een directe download-link in dit tabblad.
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = filename
        anchor.rel = 'noopener'
        document.body.appendChild(anchor)
        anchor.click()
        document.body.removeChild(anchor)
      }
      trackEvent('pdf_open_succeeded', { report_version: report.version })
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch {
      setError(true)
      newTab?.close()
      trackEvent('pdf_open_failed', { report_version: report.version })
    } finally {
      setLoading(false)
    }
  }, [report, filename])

  return (
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
  )
}
