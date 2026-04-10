'use client'

import dynamic from 'next/dynamic'
import type { FunnelState } from './types'

const Inner = dynamic(() => import('./PDFDownloadButtonInner'), {
  ssr: false,
  loading: () => (
    <button disabled className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-full font-bold text-base bg-amber-500/60 text-slate-950 cursor-wait">
      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
      PDF laden...
    </button>
  ),
})

export function PDFDownloadButton({ state }: { state: FunnelState }) {
  return <Inner state={state} />
}
