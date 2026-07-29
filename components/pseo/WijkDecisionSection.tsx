import Link from 'next/link'
import type { WijkCtrDecision } from '@/lib/pseo-ctr'

export function WijkDecisionSection({
  wijk,
  decision,
}: {
  wijk: string
  decision: WijkCtrDecision
}) {
  return (
    <section
      data-testid="wijk-ctr-decision"
      className="border-y border-ink/10 bg-paper px-6 py-10"
    >
      <div className="mx-auto max-w-4xl">
        <p className="font-heading text-xs font-semibold uppercase tracking-widest text-trust-dark">
          Lokale beslischeck · {wijk}
        </p>
        <h2 className="mt-2 font-heading text-2xl font-extrabold tracking-tight text-ink">
          {decision.heading}
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-muted">
          {decision.body}
        </p>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3">
          {decision.links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="min-h-11 content-center text-sm font-semibold text-trust-dark underline decoration-trust/30 underline-offset-4 transition hover:decoration-trust"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
