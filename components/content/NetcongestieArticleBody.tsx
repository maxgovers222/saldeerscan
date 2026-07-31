import Link from 'next/link'
import {
  NETCONGESTIE_ARTICLE_SECTIONS,
  NETCONGESTIE_DECISION_STEPS,
  NETCONGESTIE_LOCAL_ANALYSES,
  NETCONGESTIE_SOURCES,
} from '@/lib/netcongestie-article'

export function NetcongestieArticleBody() {
  return (
    <div data-testid="netcongestie-article" className="space-y-10 text-base leading-8 text-ink-muted">
      {NETCONGESTIE_ARTICLE_SECTIONS.map(section => (
        <section key={section.title}>
          <h2 className="text-2xl font-bold text-ink">{section.title}</h2>
          <div className="mt-4 space-y-4">
            {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </section>
      ))}

      <section aria-labelledby="netcongestie-beslisboom">
        <h2 id="netcongestie-beslisboom" className="text-2xl font-bold text-ink">
          Beslisboom voor uw woning
        </h2>
        <ol className="mt-5 space-y-4">
          {NETCONGESTIE_DECISION_STEPS.map((step, index) => (
            <li key={step.question} className="rounded-2xl border border-ink/10 bg-mist p-5">
              <h3 className="font-semibold text-ink">
                {index + 1}. {step.question}
              </h3>
              <p className="mt-3"><strong className="text-ink">Ja:</strong> {step.yes}</p>
              <p className="mt-2"><strong className="text-ink">Nee:</strong> {step.no}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="netcongestie-lokaal">
        <h2 id="netcongestie-lokaal" className="text-2xl font-bold text-ink">
          Vergelijk zes lokale analyses
        </h2>
        <p className="mt-3">
          De regionale situatie verschilt. Gebruik deze bestaande analyses om woningdata en
          netindicaties tussen verschillende typen wijken te vergelijken.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {NETCONGESTIE_LOCAL_ANALYSES.map(analysis => (
            <Link
              key={analysis.href}
              href={analysis.href}
              data-testid="netcongestie-local-analysis"
              className="rounded-2xl border border-ink/10 bg-paper p-4 transition hover:border-trust/40"
            >
              <span className="font-semibold text-trust-dark">{analysis.label}</span>
              <span className="mt-1 block text-sm leading-6 text-ink-muted">
                {analysis.description}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="netcongestie-bronnen">
        <h2 id="netcongestie-bronnen" className="text-2xl font-bold text-ink">
          Bronnen en actualiteit
        </h2>
        <p className="mt-3">
          Laatst inhoudelijk gecontroleerd op 31 juli 2026. Capaciteit en wachttijden kunnen
          per gebied veranderen; controleer voor een besluit altijd de actuele informatie
          van uw eigen regionale netbeheerder.
        </p>
        <ul className="mt-4 space-y-2">
          {NETCONGESTIE_SOURCES.map(source => (
            <li key={source.href}>
              <a
                href={source.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-trust-dark underline underline-offset-2"
              >
                {source.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
