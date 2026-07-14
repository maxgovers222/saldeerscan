import type { ReactNode } from 'react'
import { PageShell } from '@/components/design-system/PageShell'
import { SiteFooter } from '@/components/design-system/SiteFooter'
import { SiteHeader } from '@/components/design-system/SiteHeader'

export function PseoPageShell({
  children,
  headerContext,
  ctaHref = '/check',
}: {
  children: ReactNode
  headerContext?: string
  ctaHref?: string
}) {
  return (
    <PageShell surface="evergreen" className="flex flex-col">
      <SiteHeader tone="dark" contextLabel={headerContext} ctaHref={ctaHref} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </PageShell>
  )
}
