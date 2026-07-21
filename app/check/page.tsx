import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SiteFooter } from '@/components/design-system/SiteFooter'
import { SiteHeader } from '@/components/design-system/SiteHeader'
import { CheckPageClient, CheckPageFallback } from '@/components/funnel/CheckPageClient'

const CHECK_CANONICAL = 'https://saldeerscan.nl/check'

type SearchParams = Record<string, string | string[] | undefined>

function hasPrivateReportParams(params: SearchParams): boolean {
  return typeof params.leadId === 'string' && params.leadId.length > 0
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}): Promise<Metadata> {
  const params = await searchParams
  const privateReport = hasPrivateReportParams(params)

  return {
    title: privateReport
      ? 'Uw SaldeerScan rapport'
      : 'Gratis 2027 saldeercheck — SaldeerScan.nl',
    description:
      'Ontdek wat het einde van salderen op 1 januari 2027 voor uw woning betekent. Gratis AI-scan, BAG-data en persoonlijk investeringsrapport.',
    alternates: { canonical: CHECK_CANONICAL },
    robots: privateReport ? { index: false, follow: false } : { index: true, follow: true },
  }
}

export default function CheckPage() {
  return (
    <div className="min-h-dvh bg-evergreen-950 text-white">
      <SiteHeader
        tone="dark"
        compact
        showPrimaryAction={false}
      />
      <main id="main-content" className="mx-auto min-w-0 max-w-4xl px-4 py-6">
        <Suspense fallback={<CheckPageFallback />}>
          <CheckPageClient />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  )
}
