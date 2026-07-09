'use client'

import { useCallback, useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { SaldeerRapportPDF } from './SaldeerRapportPDF'
import type { FunnelState } from './types'

export default function PDFDownloadButtonInner({ state }: { state: FunnelState }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const filename = `SaldeerScan-2027-Rapport-${(state.bagData?.postcode ?? 'rapport').replace(/\s/g, '')}.pdf`

  const handleDownload = useCallback(async () => {
    setLoading(true)
    setError(false)
    // Open het tabblad synchroon binnen de click-handler — voorkomt dat mobiele
    // browsers (o.a. iOS Safari) de popup blokkeren omdat het PDF-genereren async is.
    const newTab = window.open('', '_blank')
    try {
      const blob = await pdf(<SaldeerRapportPDF state={state} />).toBlob()
      const url = URL.createObjectURL(blob)
      if (newTab) {
        // Nieuw tabblad met de PDF: werkt betrouwbaar op desktop én mobiel
        // (iOS Safari respecteert het download-attribuut op <a> niet consistent).
        newTab.location.href = url
      } else {
        // Popup geblokkeerd — val terug op een directe download-link in dit tabblad.
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = filename
        anchor.rel = 'noopener'
        document.body.appendChild(anchor)
        anchor.click()
        document.body.removeChild(anchor)
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch {
      setError(true)
      newTab?.close()
    } finally {
      setLoading(false)
    }
  }, [state, filename])

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-full font-bold text-base transition-all duration-200 bg-amber-500 text-slate-950 shadow-[0_0_35px_rgba(245,158,11,0.5)] hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait"
      style={{ fontFamily: 'var(--font-heading)' }}
    >
      {error ? (
        <span className="text-sm">Fout bij genereren — probeer opnieuw</span>
      ) : loading ? (
        <>
          <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
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
