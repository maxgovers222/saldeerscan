'use client'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'
import { primaryActionClassName } from '@/components/design-system/PrimaryAction'
import type { NormalizedReport } from '@/lib/report-model'
import { cn } from '@/lib/utils'

const Inner = dynamic(() => import('./PDFDownloadButtonInner'), {
  ssr: false,
  loading: () => (
    <button
      disabled
      className={cn(primaryActionClassName, 'w-full gap-3 px-6 py-4 text-base opacity-60 cursor-wait')}
    >
      <div className="size-4 animate-spin rounded-full border-2 border-evergreen-950 border-t-transparent" />
      PDF laden...
    </button>
  ),
})

export function PDFDownloadButton({ report }: { report: NormalizedReport }) {
  useEffect(() => {
    void import('./PDFDownloadButtonInner')
  }, [])

  return <Inner report={report} />
}
