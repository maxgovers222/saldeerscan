import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Container } from './Container'

export function ContentSection({
  eyebrow,
  title,
  intro,
  children,
  className,
  ...props
}: ComponentProps<'section'> & {
  eyebrow?: string
  title?: string
  intro?: string
  children: ReactNode
}) {
  return (
    <section className={cn('py-14 sm:py-20', className)} {...props}>
      <Container>
        {(eyebrow || title || intro) && (
          <header className="mb-8 max-w-2xl">
            {eyebrow && <p className="mb-2 text-sm font-semibold text-trust-dark">{eyebrow}</p>}
            {title && <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h2>}
            {intro && <p className="mt-3 text-base leading-7 text-ink-muted">{intro}</p>}
          </header>
        )}
        {children}
      </Container>
    </section>
  )
}
