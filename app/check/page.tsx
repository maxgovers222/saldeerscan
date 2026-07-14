import { Suspense } from 'react'
import { SiteFooter } from '@/components/design-system/SiteFooter'
import { SiteHeader } from '@/components/design-system/SiteHeader'
import { CheckPageClient, CheckPageFallback } from '@/components/funnel/CheckPageClient'

export default function CheckPage() {
  return (
    <div className="min-h-dvh bg-evergreen-950 text-white">
      <SiteHeader
        tone="dark"
        compact
        contextLabel="Gratis 2027 saldeercheck"
        showPrimaryAction={false}
      />
      <main id="main-content" className="mx-auto min-w-0 max-w-4xl px-4 py-6">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-extrabold text-white">
            Uw gratis 2027 Saldeercheck
          </h1>
        </div>
        <Suspense fallback={<CheckPageFallback />}>
          <CheckPageClient />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  )
}
