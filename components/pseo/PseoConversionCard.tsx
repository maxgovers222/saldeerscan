import { AddressAutocomplete } from '@/components/AddressAutocomplete'
import { Container } from '@/components/design-system/Container'
import type { ConversionContext } from '@/lib/conversion-context'

export function PseoConversionCard({
  context,
  title,
  description,
  placeholder,
}: {
  context: ConversionContext
  title: string
  description: string
  placeholder: string
}) {
  return (
    <section data-testid="pseo-conversion-entry" className="bg-mist py-10 sm:py-14">
      <Container>
        <div className="grid gap-6 rounded-3xl border border-ink/10 bg-paper p-5 shadow-sm sm:p-8 lg:grid-cols-[1fr_.9fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-trust-dark">Persoonlijk inzicht</p>
            <h2 className="mt-2 text-3xl font-bold text-ink">{title}</h2>
            <p className="mt-3 max-w-xl leading-7 text-ink-muted">{description}</p>
          </div>
          <AddressAutocomplete
            context={context}
            placeholder={placeholder}
            buttonLabel="Bekijk mijn inzicht"
          />
        </div>
      </Container>
    </section>
  )
}
