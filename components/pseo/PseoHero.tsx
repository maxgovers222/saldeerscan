import type { ReactNode } from 'react'
import { Container } from '@/components/design-system/Container'
import { DarkHeroShell } from '@/components/design-system/DarkHeroShell'
import { PseoBreadcrumbs, type VisibleBreadcrumb } from './PseoBreadcrumbs'
import { PseoMetricGrid, type PseoMetric } from './PseoMetricGrid'

export function PseoHero({
  breadcrumbs,
  eyebrow,
  title,
  summary,
  badge,
  metrics,
}: {
  breadcrumbs: VisibleBreadcrumb[]
  eyebrow: string
  title: string
  summary: string
  badge?: ReactNode
  metrics?: PseoMetric[]
}) {
  return (
    <DarkHeroShell>
      <Container className="relative py-8 sm:py-12 lg:py-16">
        <PseoBreadcrumbs items={breadcrumbs} />
        <div className="mt-8 max-w-3xl">
          <p className="text-sm font-semibold text-trust">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-5 text-lg leading-8 text-white/70">{summary}</p>
          {badge && <div className="mt-5">{badge}</div>}
        </div>
        {metrics?.length ? (
          <div className="mt-8 max-w-3xl">
            <PseoMetricGrid metrics={metrics} />
          </div>
        ) : null}
      </Container>
    </DarkHeroShell>
  )
}
