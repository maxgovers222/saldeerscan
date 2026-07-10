# Route Rollout and Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the Customer-first Hybrid system across every public route, then lock accessibility, responsive behavior, performance, analytics, and documentation.

**Architecture:** Keep route files responsible for data, metadata, schema, and route-specific copy; move repeated visual structure into server-rendered pSEO/content primitives. Roll out by route family and run metadata/JSON-LD tests after each family. Finish with automated accessibility, stable screenshot coverage, production bundle/resource budgets, and Web Vitals telemetry.

**Tech Stack:** Next.js 16.2 Server Components, Tailwind v4, React 19, Playwright, `@axe-core/playwright`, Next Turbopack analyzer, GA4.

**Depends on:** Plans 1–4 completed and green.

---

## File map

Create:

- `components/pseo/PseoPageShell.tsx` — shared dark/mist pSEO page shell.
- `components/pseo/PseoBreadcrumbs.tsx` — visible semantic breadcrumbs from existing items.
- `components/pseo/PseoHero.tsx` — local promise, summary, metrics, and status.
- `components/pseo/PseoMetricGrid.tsx` — responsive local data cards.
- `components/pseo/PseoConversionCard.tsx` — one contextual address entry.
- `components/pseo/PseoStatusBadge.tsx` — existing ROOD/ORANJE/GROEN semantics.
- `components/pseo/PseoCardGrid.tsx` — city/wijk/street link cards.
- `components/content/ContentIndexShell.tsx` — knowledge/news index layout.
- `components/content/ArticleShell.tsx` — readable article layout and one contextual conversion card.
- `components/content/ArticleBody.tsx` — existing safe line/inline renderer in one place.
- `components/funnel/CheckPageClient.tsx` — query-param and funnel client island extracted from the route shell.
- `app/error.tsx` — accessible recoverable route error.
- `app/global-error.tsx` — accessible root error fallback.
- `app/not-found.tsx` — branded 404 with safe navigation.
- `components/WebVitals.tsx` — tiny client telemetry island.
- `tests/e2e/route-shells.spec.ts` — route-family structure and SEO invariants.
- `tests/e2e/accessibility.spec.ts` — axe WCAG A/AA gate.
- `tests/e2e/visual-regression.spec.ts` — deterministic critical-screen screenshots.
- `tests/e2e/performance-budget.spec.ts` — production resource budgets.
- `tests/e2e/analytics-contract.spec.ts` — canonical event presence and PII-denylist assertions.
- `playwright.performance.config.ts` — production server for performance tests.

Modify:

- `app/[provincie]/page.tsx`
- `app/[provincie]/[stad]/page.tsx`
- `app/[provincie]/[stad]/[wijk]/page.tsx`
- `app/[provincie]/[stad]/[wijk]/[straat]/page.tsx`
- `app/postcode/[code]/page.tsx`
- `app/kennisbank/page.tsx`
- `app/kennisbank/[slug]/page.tsx`
- `app/nieuws/page.tsx`
- `app/nieuws/[slug]/page.tsx`
- `app/privacy/page.tsx`
- `app/check/page.tsx` — server-composed shared shell around the funnel client island.
- `app/layout.tsx` — Web Vitals island only.
- `components/design-system/SiteHeader.tsx` — optional primary action for the active `/check` route.
- `components/NavDark.tsx` — remove after all imports use `SiteHeader`/`SiteFooter`.
- `components/pseo/LocalStatsRibbon.tsx`
- `components/pseo/WijkComparisonTable.tsx`
- `components/pseo/WijkSaldeerChart.tsx`
- `components/pseo/RenovatieInsightCard.tsx`
- `components/pseo/RelatedWijken.tsx`
- `components/pseo/HomeDiscovery.tsx`
- `package.json` / `package-lock.json` — axe dependency, scripts, unused Mapbox packages.
- `.github/workflows/ci.yml` — accessibility and deterministic visual checks.
- `CLAUDE.md`

Do not change:

- route slugs or hierarchy;
- `generateStaticParams`, `generateMetadata`, canonical URLs, ISR intervals;
- JSON-LD builders or intentional street-level FAQ filtering;
- Supabase query semantics, ranking formulas, indexing priority, sitemap;
- funnel/report behavior established in prior plans.

---

### Task 1: Lock route-family invariants before restyling

**Files:**

- Create: `tests/e2e/route-shells.spec.ts`

- [ ] **Step 1: Write public-shell and SEO invariant tests**

```ts
import { expect, test } from '@playwright/test'

const pseoRoutes = [
  {
    path: '/noord-holland',
    h1: /Zonnepanelen Noord-Holland/i,
    schema: 'CollectionPage',
  },
  {
    path: '/noord-holland/amsterdam',
    h1: /Zonnepanelen Amsterdam/i,
    schema: 'CollectionPage',
  },
  {
    path: '/utrecht/utrecht/leidsche-rijn',
    h1: /Leidsche Rijn/i,
    schema: 'BreadcrumbList',
  },
  {
    path: '/postcode/1012',
    h1: /Zonnepanelen postcode 1012/i,
    schema: 'BreadcrumbList',
  },
] as const

for (const route of pseoRoutes) {
  test(`${route.path} behoudt shell, H1, canonical en schema`, async ({ page }) => {
    const response = await page.goto(route.path)
    test.skip(response?.status() === 404, `Fixture ontbreekt voor ${route.path}`)
    await expect(page.getByRole('navigation', { name: 'Hoofdnavigatie' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: route.h1 })).toBeVisible()
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      new RegExp(`https://saldeerscan\\.nl${route.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
    )
    const schema = (await page.locator('script[type="application/ld+json"]').allTextContents()).join('\n')
    expect(schema).toContain(route.schema)
    await expect(page.getByTestId('pseo-conversion-entry')).toBeVisible()
  })
}

for (const path of ['/check', '/kennisbank', '/nieuws', '/privacy']) {
  test(`${path} gebruikt de gedeelde site shell`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('navigation', { name: 'Hoofdnavigatie' })).toBeVisible()
    await expect(page.locator('main h1')).toBeVisible()
    await expect(page.getByRole('contentinfo')).toBeVisible()
  })
}
```

- [ ] **Step 2: Add a street test without hard-coding an unavailable slug**

Reuse the current candidate traversal from `wijk-validatie.spec.ts`: open a seeded wijk, obtain the first valid four-segment street URL, then assert:

```ts
await expect(page.getByTestId('pseo-conversion-entry')).toBeVisible()
await expect(page.locator('script[type="application/ld+json"]')).not.toContainText('"@type":"FAQPage"')
await expect(page.getByRole('navigation', { name: 'Kruimelpad' })).toBeVisible()
```

- [ ] **Step 3: Run and confirm the shared-shell failures**

```powershell
npx playwright test tests/e2e/route-shells.spec.ts --project=chromium
```

Expected: FAIL because route families still use local navigation and lack the shared conversion test ID.

---

### Task 2: Build pSEO presentation primitives

**Files:**

- Create: `components/pseo/PseoPageShell.tsx`
- Create: `components/pseo/PseoBreadcrumbs.tsx`
- Create: `components/pseo/PseoHero.tsx`
- Create: `components/pseo/PseoMetricGrid.tsx`
- Create: `components/pseo/PseoConversionCard.tsx`
- Create: `components/pseo/PseoStatusBadge.tsx`
- Create: `components/pseo/PseoCardGrid.tsx`

- [ ] **Step 1: Implement visible breadcrumbs**

```tsx
import Link from 'next/link'

export interface VisibleBreadcrumb {
  name: string
  href?: string
}

export function PseoBreadcrumbs({
  items,
}: {
  items: VisibleBreadcrumb[]
}) {
  return (
    <nav aria-label="Kruimelpad" className="text-sm text-white/55">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={`${item.name}-${index}`} className="flex items-center gap-2">
            {index > 0 && <span aria-hidden="true" className="text-white/25">/</span>}
            {item.href ? (
              <Link href={item.href} className="min-h-11 content-center hover:text-white">
                {item.name}
              </Link>
            ) : (
              <span aria-current="page" className="text-white/80">{item.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
```

- [ ] **Step 2: Implement status and metrics**

```tsx
import { cn } from '@/lib/utils'

const styles = {
  ROOD: 'border-red-700/50 bg-red-950/40 text-red-300',
  ORANJE: 'border-amber-700/50 bg-amber-950/40 text-amber-300',
  GROEN: 'border-emerald-700/50 bg-emerald-950/40 text-emerald-300',
} as const

export function PseoStatusBadge({
  status,
  label,
}: {
  status: keyof typeof styles
  label?: string
}) {
  return (
    <span className={cn('inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold', styles[status])}>
      {label ?? status}
    </span>
  )
}
```

`PseoMetricGrid` contract:

```tsx
export interface PseoMetric {
  label: string
  value: string
  note?: string
  tone?: 'default' | 'trust' | 'warning' | 'danger'
}

export function PseoMetricGrid({ metrics }: { metrics: PseoMetric[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {metrics.map(metric => (
        <div key={metric.label} className="rounded-2xl border border-white/10 bg-evergreen-900/70 p-4">
          <dt className="text-xs text-white/55">{metric.label}</dt>
          <dd className="mt-2 font-mono text-2xl font-bold text-action">{metric.value}</dd>
          {metric.note && <dd className="mt-1 text-xs text-white/45">{metric.note}</dd>}
        </div>
      ))}
    </dl>
  )
}
```

- [ ] **Step 3: Implement the local hero**

```tsx
import type { ReactNode } from 'react'
import { Container } from '@/components/design-system/Container'
import { DarkHeroShell } from '@/components/design-system/DarkHeroShell'
import type { VisibleBreadcrumb } from './PseoBreadcrumbs'
import { PseoBreadcrumbs } from './PseoBreadcrumbs'
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
        {metrics?.length ? <div className="mt-8 max-w-3xl"><PseoMetricGrid metrics={metrics} /></div> : null}
      </Container>
    </DarkHeroShell>
  )
}
```

- [ ] **Step 4: Implement one contextual conversion card**

```tsx
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
```

- [ ] **Step 5: Implement the page/card shells**

`PseoPageShell` composes `PageShell surface="evergreen"`, `SiteHeader tone="dark"`, route children, and `SiteFooter`.

`PseoCardGrid` accepts:

```ts
interface PseoCardItem {
  href: string
  title: string
  meta?: string
  status?: 'ROOD' | 'ORANJE' | 'GROEN'
  analyticsLabel: string
}
```

Render semantic links in a responsive `sm:grid-cols-2 lg:grid-cols-3` grid, preserve `data-analytics-event="pseo_second_click"`, and use `PseoStatusBadge` for status.

- [ ] **Step 6: Run typecheck**

```powershell
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Version-control checkpoint**

If commits are authorized:

```powershell
git add components/pseo/PseoPageShell.tsx components/pseo/PseoBreadcrumbs.tsx components/pseo/PseoHero.tsx components/pseo/PseoMetricGrid.tsx components/pseo/PseoConversionCard.tsx components/pseo/PseoStatusBadge.tsx components/pseo/PseoCardGrid.tsx
git commit -m "feat: add reusable pSEO presentation primitives"
```

---

### Task 3: Roll out province and city hubs

**Files:**

- Modify: `app/[provincie]/page.tsx`
- Modify: `app/[provincie]/[stad]/page.tsx`
- Test: `tests/e2e/route-shells.spec.ts`
- Test: `tests/e2e/wijk-validatie.spec.ts`

- [ ] **Step 1: Replace the province visual shell**

Keep all code through `breadcrumbLd` unchanged. Replace local nav/hero/CTA wrappers with:

```tsx
<PseoPageShell
  headerContext={provLabel}
  ctaHref={buildCheckHref({
    landingPath: `/${provincie}`,
    pseoLevel: 'provincie',
    provincie,
  })}
>
  <PseoHero
    breadcrumbs={[
      { name: 'Home', href: '/' },
      { name: provLabel },
    ]}
    eyebrow="Zonnepanelen per regio"
    title={`Zonnepanelen ${provLabel}`}
    summary={`${stads.length} steden en lokale wijkanalyses voor de impact van stoppen met salderen.`}
    metrics={[
      { label: 'Steden', value: String(stads.length) },
      { label: 'Woningen', value: totalWoningen > 0 ? `${Math.round(totalWoningen / 1000)}k+` : '—' },
      { label: 'Deadline', value: '1 jan 2027', tone: 'warning' },
    ]}
  />
  <PseoConversionCard
    context={{
      landingPath: `/${provincie}`,
      pseoLevel: 'provincie',
      provincie,
    }}
    title={`Wat betekent 2027 voor uw woning in ${provLabel}?`}
    description="Provinciecijfers zijn gemiddelden. Vul uw adres in voor woningdata, netstatus en uw persoonlijke financiële impact."
    placeholder={`Uw adres in ${provLabel}`}
  />
  {/* Existing urgent wijk and city sections, restyled with PseoCardGrid. */}
</PseoPageShell>
```

Retain both JSON-LD scripts as direct children inside the shell.

- [ ] **Step 2: Replace the city visual shell**

Keep data, summary, ranking, and JSON-LD unchanged. Use:

```tsx
<PseoHero
  breadcrumbs={[
    { name: 'Home', href: '/' },
    { name: provDisplay, href: `/${provincie}` },
    { name: stadDisplay },
  ]}
  eyebrow="Zonnepanelen per wijk"
  title={`Zonnepanelen ${stadDisplay}`}
  summary={`${wijken.length} wijken in ${provDisplay}, met lokale netdruk en woningfit.`}
  metrics={[
    { label: 'Wijken', value: String(wijken.length) },
    { label: 'Woningen', value: totalWoningen > 0 ? `${Math.round(totalWoningen / 1000)}k+` : '—' },
    { label: 'Vol stroomnet', value: String(roodCount), tone: roodCount > 0 ? 'danger' : 'default' },
  ]}
/>
<PseoConversionCard
  context={{
    landingPath: `/${provincie}/${stad}`,
    pseoLevel: 'stad',
    provincie,
    stad,
  }}
  title={`Uw woning in ${stadDisplay} persoonlijk controleren`}
  description="Krijg uw woningkenmerken, 2027-impact en beste vervolgstap in plaats van alleen het wijkgemiddelde."
  placeholder={`Uw adres in ${stadDisplay}`}
/>
```

- [ ] **Step 3: Preserve urgency semantics**

The deadline strip stays amber. Only actual `ROOD` grid status and negative financial amounts use red. Replace any decorative red deadline number with `text-action`.

- [ ] **Step 4: Run hub tests**

```powershell
npx playwright test tests/e2e/route-shells.spec.ts tests/e2e/wijk-validatie.spec.ts --project=chromium
npm run typecheck
```

Expected: province/city tests pass; wijk/postcode shell tests may still fail until Task 4.

- [ ] **Step 5: Version-control checkpoint**

If commits are authorized:

```powershell
git add "app/[provincie]/page.tsx" "app/[provincie]/[stad]/page.tsx"
git commit -m "feat: apply customer-first province and city hubs"
```

---

### Task 4: Roll out wijk, street, and postcode routes

**Files:**

- Modify: `app/[provincie]/[stad]/[wijk]/page.tsx`
- Modify: `app/[provincie]/[stad]/[wijk]/[straat]/page.tsx`
- Modify: `app/postcode/[code]/page.tsx`
- Modify: `components/pseo/LocalStatsRibbon.tsx`
- Modify: `components/pseo/WijkComparisonTable.tsx`
- Modify: `components/pseo/WijkSaldeerChart.tsx`
- Modify: `components/pseo/RenovatieInsightCard.tsx`
- Modify: `components/pseo/RelatedWijken.tsx`
- Test: `tests/e2e/route-shells.spec.ts`
- Test: `tests/e2e/wijk-validatie.spec.ts`

- [ ] **Step 1: Convert the wijk route without changing content order or data**

Use:

```tsx
<PseoHero
  breadcrumbs={[
    { name: 'Home', href: '/' },
    { name: toDisplay(provincie), href: `/${provincie}` },
    { name: stadDisplay, href: `/${provincie}/${stad}` },
    { name: wijkDisplay },
  ]}
  eyebrow={`${stadDisplay} · Wijkanalyse 2027`}
  title={wijkDisplay}
  summary={`Wat stoppen met salderen betekent voor woningen in ${wijkDisplay}, gebaseerd op lokale woningdata en netdruk.`}
  badge={net ? <PseoStatusBadge status={page.netcongestieStatus!} /> : undefined}
  metrics={[
    { label: 'Energiescore', value: `${score}/100`, note: scorelabel },
    { label: 'Gem. bouwjaar', value: page.gemBouwjaar ? String(page.gemBouwjaar) : '—' },
    { label: 'Mogelijke besparing', value: `€${besparing}/jaar`, tone: 'trust' },
  ]}
/>
```

Use one `PseoConversionCard` immediately after the hero. Keep the existing detailed content, chart, comparison, related wijk, popular street links, LocalSchema, Place schema, and BreadcrumbList schema.

- [ ] **Step 2: Convert the street route**

Preserve cached fetching, metadata, renovation intelligence, comparison data, and street FAQ schema filtering. Use:

```tsx
<PseoConversionCard
  context={{
    landingPath: `/${p.provincie}/${p.stad}/${p.wijk}/${p.straat}`,
    pseoLevel: 'straat',
    provincie: p.provincie,
    stad: p.stad,
    wijk: p.wijk,
    straat: p.straat,
  }}
  title={`Uw woning aan ${toDisplay(p.straat)} controleren`}
  description="Vul uw huisnummer en adres in voor uw eigen woningdata en 2027-impact."
  placeholder={`${toDisplay(p.straat)} en huisnummer`}
/>
```

Do not preselect an incomplete street address as if it were a BAG match.

- [ ] **Step 3: Convert the postcode route**

Preserve four-digit normalization and CollectionPage graph. Use:

```tsx
<PseoHero
  breadcrumbs={[
    { name: 'Home', href: '/' },
    { name: `Postcode ${prefix}` },
  ]}
  eyebrow="Lokale postcodeanalyse"
  title={`Zonnepanelen postcode ${prefix}`}
  summary={`Bekijk wijken, netdruk en woningfit rond postcode ${prefix}.`}
  metrics={[
    { label: 'Wijken', value: String(cluster.wijkCount) },
    { label: 'Steden', value: String(cluster.uniekeSteden) },
    { label: 'Postcode', value: prefix },
  ]}
/>
<PseoConversionCard
  context={{
    landingPath: `/postcode/${prefix}`,
    pseoLevel: 'postcode',
    postcode: prefix,
    provincie: topProv,
    stad: topStad,
  }}
  title={`Uw woning in postcode ${prefix} controleren`}
  description="Postcodecijfers zijn een startpunt. Vul uw volledige adres in voor uw persoonlijke rapport."
  placeholder={`Adres in postcode ${prefix}`}
/>
```

- [ ] **Step 4: Harmonize pSEO child components**

For each listed child component:

- use `paper` cards on `mist` content sections;
- reserve evergreen cards for technical/local data;
- replace decorative monospace body copy with DM Sans;
- keep amounts/scores/status data monospace;
- use 16px mobile body text and at least 44px links/buttons;
- add `min-w-0`, `break-words`, and responsive grids where long Dutch names can overflow;
- preserve all current props and calculations.

- [ ] **Step 5: Run all pSEO tests**

```powershell
npx playwright test tests/e2e/route-shells.spec.ts tests/e2e/wijk-validatie.spec.ts --project=chromium
npm run typecheck
npm run build
```

Expected: PASS, including no street FAQPage schema.

- [ ] **Step 6: Version-control checkpoint**

If commits are authorized:

```powershell
git add "app/[provincie]/[stad]/[wijk]/page.tsx" "app/[provincie]/[stad]/[wijk]/[straat]/page.tsx" "app/postcode/[code]/page.tsx" components/pseo
git commit -m "feat: unify local landing experiences"
```

---

### Task 5: Roll out content, privacy, and error states

**Files:**

- Create: `components/content/ContentIndexShell.tsx`
- Create: `components/content/ArticleShell.tsx`
- Create: `components/content/ArticleBody.tsx`
- Create: `app/error.tsx`
- Create: `app/global-error.tsx`
- Create: `app/not-found.tsx`
- Modify: `app/kennisbank/page.tsx`
- Modify: `app/kennisbank/[slug]/page.tsx`
- Modify: `app/nieuws/page.tsx`
- Modify: `app/nieuws/[slug]/page.tsx`
- Modify: `app/privacy/page.tsx`
- Create: `components/funnel/CheckPageClient.tsx`
- Modify: `app/check/page.tsx`
- Modify: `components/design-system/SiteHeader.tsx`
- Delete: `components/NavDark.tsx`
- Test: `tests/e2e/route-shells.spec.ts`

- [ ] **Step 1: Extract the safe article renderer**

```tsx
function renderInline(text: string) {
  return text.split('**').map((part, index) =>
    index % 2 === 1
      ? <strong key={index} className="font-semibold text-ink">{part}</strong>
      : part,
  )
}

export function ArticleBody({ text }: { text: string }) {
  return (
    <div className="space-y-4 text-base leading-8 text-ink-muted">
      {text.split('\n').map((line, index) => {
        if (line.startsWith('## ')) {
          return <h2 key={index} className="pt-6 text-2xl font-bold text-ink">{renderInline(line.slice(3))}</h2>
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="pt-4 text-xl font-bold text-ink">{renderInline(line.slice(4))}</h3>
        }
        if (!line.trim()) return null
        return <p key={index}>{renderInline(line)}</p>
      })}
    </div>
  )
}
```

Do not use `dangerouslySetInnerHTML` for article text.

- [ ] **Step 2: Implement index and article shells**

`ContentIndexShell` accepts `kind`, `title`, `intro`, and children, and composes `PageShell`, `SiteHeader`, `Container`, and `SiteFooter`.

`ArticleShell` accepts:

```ts
interface ArticleShellProps {
  kind: 'kennisbank' | 'nieuws'
  title: string
  intro?: string | null
  date?: string | null
  category?: string | null
  slug: string
  children: ReactNode
  aside?: ReactNode
}
```

It renders a mist background, paper article card, 65–75 character reading width, contextual `PseoConversionCard` with `pseoLevel: kind`, and the supplied related-content aside.

- [ ] **Step 3: Convert knowledge and news indexes**

Keep server fetching, metadata, empty states, dates, categories, and links. Replace `NavDark`/`FooterDark`, dark glass cards, and duplicate CTA wrappers with `ContentIndexShell` and one `PseoConversionCard`.

- [ ] **Step 4: Convert article pages**

Keep `LocalSchema`, metadata, `generateStaticParams`, FAQ content, related articles, and RelatedWijken. Use `ArticleBody` and native `<details>` FAQs with:

```tsx
<details className="group rounded-2xl border border-ink/10 bg-paper">
  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-ink">
    {faq.vraag}
    <span aria-hidden="true" className="text-trust-dark">+</span>
  </summary>
  <p className="border-t border-ink/10 px-5 py-4 leading-7 text-ink-muted">
    {faq.antwoord}
  </p>
</details>
```

- [ ] **Step 5: Convert privacy without changing legal text**

Use `PageShell`, `SiteHeader`, `Container`, a paper article surface, and `SiteFooter`. Keep all nine sections and all legal/contact wording byte-for-byte except the displayed “Laatste update” date if legal content itself is separately updated.

- [ ] **Step 6: Move `/check` into the shared server shell**

Add `showPrimaryAction?: boolean` to `SiteHeaderProps`, default it to `true`, and render `PrimaryAction` only when enabled.

Move the current `'use client'` query parsing, `StatsLine`, `LandingContextBanner`, `CountdownTimer`, and `FunnelContainer` composition into `components/funnel/CheckPageClient.tsx`. Keep the existing Suspense behavior and every query parameter passed by Plan 3.

Make `app/check/page.tsx` a Server Component:

```tsx
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
        <Suspense fallback={<CheckPageFallback />}>
          <CheckPageClient />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  )
}
```

Delete the local `Header` function from the old client page. Verify report URLs, pSEO context, explicit-address bootstrap, and resume conflict controls still work.

- [ ] **Step 7: Add accessible error routes**

`app/error.tsx`:

```tsx
'use client'

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="grid min-h-dvh place-items-center bg-mist px-4 text-ink">
      <div className="max-w-md rounded-3xl border border-ink/10 bg-paper p-8 text-center">
        <h1 className="text-3xl font-bold">Deze pagina kon niet worden geladen</h1>
        <p className="mt-3 leading-7 text-ink-muted">Uw gegevens zijn niet aangepast. Probeer de pagina opnieuw.</p>
        <button type="button" onClick={reset} className="mt-6 min-h-11 rounded-xl bg-action px-5 font-bold text-evergreen-950">
          Opnieuw proberen
        </button>
      </div>
    </main>
  )
}
```

`global-error.tsx` uses the same copy but includes `<html lang="nl"><body>`.

`not-found.tsx` offers links to `/`, `/check`, and `/kennisbank`, with no automatic redirect.

- [ ] **Step 8: Remove old navigation only after imports reach zero**

```powershell
rg "NavDark|FooterDark" app components
```

Expected before deletion: zero imports outside `components/NavDark.tsx`. Delete that file, then rerun and expect zero matches.

- [ ] **Step 9: Run content/static tests**

```powershell
npx playwright test tests/e2e/route-shells.spec.ts --project=chromium
npx playwright test tests/e2e/funnel-four-stages.spec.ts tests/e2e/leadid-hydrate.spec.ts --project=chromium
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 10: Version-control checkpoint**

If commits are authorized:

```powershell
git add components/content components/funnel/CheckPageClient.tsx components/design-system/SiteHeader.tsx app/check app/kennisbank app/nieuws app/privacy app/error.tsx app/global-error.tsx app/not-found.tsx components/NavDark.tsx
git commit -m "feat: unify content and recovery pages"
```

---

### Task 6: Add an automated WCAG A/AA gate

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `tests/e2e/accessibility.spec.ts`
- Modify: all files reported by axe.

- [ ] **Step 1: Install the current Playwright axe adapter**

```powershell
npm install --save-dev @axe-core/playwright
```

Do not invent or pin an unverified version; let npm record the compatible latest version.

- [ ] **Step 2: Add the accessibility suite**

```ts
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const routes = [
  '/',
  '/check',
  '/privacy',
  '/kennisbank',
  '/nieuws',
  '/noord-holland',
  '/noord-holland/amsterdam',
  '/utrecht/utrecht/leidsche-rijn',
  '/postcode/1012',
] as const

for (const path of routes) {
  test(`${path} heeft geen WCAG A/AA overtredingen`, async ({ page }) => {
    const response = await page.goto(path)
    test.skip(response?.status() === 404, `Fixture ontbreekt voor ${path}`)
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    expect(result.violations).toEqual([])
  })
}
```

- [ ] **Step 3: Add explicit non-axe interaction checks**

Add tests for:

- skip link or direct keyboard reachability of `<main>`;
- visible focus for header, address, choice cards, FAQ, and PDF;
- combobox ArrowDown/ArrowUp/Enter/Escape;
- upload button reachable and labelled;
- errors and loading announced;
- 200% zoom without clipped controls;
- reduced-motion media query disabling continuous animations.

- [ ] **Step 4: Fix violations, never suppress by selector**

Allowed fixes include semantic elements, labels, contrast, heading order, unique IDs, and ARIA state. Do not call `.exclude()` or disable rules unless the violation is proven to be a third-party false positive and the reason is documented next to the exclusion.

- [ ] **Step 5: Add the script**

```json
"test:a11y": "playwright test tests/e2e/accessibility.spec.ts --project=chromium"
```

- [ ] **Step 6: Run the gate**

```powershell
npm run test:a11y
```

Expected: PASS with zero violations.

- [ ] **Step 7: Version-control checkpoint**

If commits are authorized:

```powershell
git add package.json package-lock.json tests/e2e/accessibility.spec.ts app components
git commit -m "test: enforce accessible public routes"
```

---

### Task 7: Add deterministic visual regression

**Files:**

- Create: `tests/e2e/visual-regression.spec.ts`
- Modify: `playwright.config.ts`
- Modify: components requiring stable test IDs/masks.

- [ ] **Step 1: Configure screenshot tolerances and platform snapshots**

In `playwright.config.ts`:

```ts
expect: {
  toHaveScreenshot: {
    animations: 'disabled',
    maxDiffPixelRatio: 0.015,
  },
},
snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}-{projectName}-{platform}{ext}',
```

- [ ] **Step 2: Add critical screenshots**

```ts
import { expect, test } from '@playwright/test'
import { expectedReportFixture } from '../fixtures/report'
import { seedFunnelAtInternalStep } from './fixtures/funnel-state'
import { seedReportState } from './fixtures/report-state'

const sizes = [
  { name: '360', width: 360, height: 800 },
  { name: '390', width: 390, height: 844 },
  { name: '768', width: 768, height: 1024 },
  { name: '1024', width: 1024, height: 900 },
  { name: '1440', width: 1440, height: 1000 },
] as const

for (const size of sizes) {
  test(`homepage ${size.name}`, async ({ page }) => {
    await page.setViewportSize(size)
    await page.goto('/')
    await expect(page).toHaveScreenshot(`home-${size.name}.png`, {
      fullPage: true,
      mask: [page.getByTestId('social-proof-dynamic')],
    })
  })
}

test('mobile funnel situation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedFunnelAtInternalStep(page, 2)
  await page.goto('/check')
  await page.getByRole('button', { name: 'Doorgaan' }).click()
  await expect(page).toHaveScreenshot('funnel-stage-2-mobile.png', { fullPage: true })
})

test('desktop and mobile report', async ({ page }) => {
  for (const size of [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'desktop', width: 1440, height: 1000 },
  ]) {
    await seedReportState(page, expectedReportFixture)
    await page.setViewportSize(size)
    await page.goto('/check')
    await page.getByRole('button', { name: 'Doorgaan' }).click()
    await expect(page).toHaveScreenshot(`report-${size.name}.png`, { fullPage: true })
  }
})
```

Use the complete fixture helpers established in Plans 3–4. Add `data-testid="social-proof-dynamic"` to the ticker wrapper; if hidden, Playwright accepts an empty mask list through a count check before screenshot.

- [ ] **Step 3: Generate and inspect baselines**

```powershell
npx playwright test tests/e2e/visual-regression.spec.ts --project=chromium --update-snapshots
```

Open every baseline and compare it with the approved responsive mockup. Do not accept snapshots blindly.

- [ ] **Step 4: Verify stable rerun**

```powershell
npx playwright test tests/e2e/visual-regression.spec.ts --project=chromium
```

Expected: PASS without updating snapshots.

- [ ] **Step 5: Add Linux baselines before enabling CI**

Run the same update inside the project’s Linux CI/container environment so both `win32` and `linux` paths exist. Then add to CI:

```yaml
- run: npx playwright test tests/e2e/visual-regression.spec.ts --project=chromium
```

Do not enable a Linux screenshot gate with only Windows baselines.

- [ ] **Step 6: Version-control checkpoint**

If commits are authorized:

```powershell
git add playwright.config.ts tests/e2e/visual-regression.spec.ts tests/e2e/__screenshots__
git commit -m "test: lock critical responsive layouts"
```

---

### Task 8: Set production performance budgets

**Files:**

- Create: `components/WebVitals.tsx`
- Create: `tests/e2e/performance-budget.spec.ts`
- Create: `playwright.performance.config.ts`
- Modify: `app/layout.tsx`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `components/funnel/FunnelContainer.tsx` if report/chart code still enters the initial chunk.

- [ ] **Step 1: Remove confirmed unused Mapbox client packages**

The repository has no imports of `@mapbox/search-js-react` or `mapbox-gl`; geocoding uses server-side HTTP in `lib/bag.ts`. Reconfirm:

```powershell
rg "@mapbox/search-js-react|mapbox-gl" --glob "*.{ts,tsx,js,mjs}" .
```

Expected: no matches. Then:

```powershell
npm uninstall @mapbox/search-js-react mapbox-gl
```

- [ ] **Step 2: Capture a Turbopack analyzer baseline**

Per the installed Next.js 16.2 docs:

```powershell
npx next experimental-analyze --output
```

Inspect `.next/diagnostics/analyze` for `/` and `/check`. Confirm:

- homepage has no report, chart, PDF, or vision SDK client import chain;
- initial check has no `@react-pdf/renderer`;
- ResultsDashboard/Recharts are reachable only from the report dynamic boundary;
- technical scan panels are reachable only from the technical-module dynamic boundary.

If ResultsDashboard still enters the initial check graph, dynamically import it in `FunnelContainer`:

```ts
const ResultsDashboard = dynamic(
  () => import('./ResultsDashboard').then(module => module.ResultsDashboard),
  { loading: () => <StageSkeleton label="Rapport laden" /> },
)
```

- [ ] **Step 3: Add Web Vitals telemetry**

```tsx
'use client'

import { useReportWebVitals } from 'next/web-vitals'
import { trackEvent } from '@/lib/analytics'

export function WebVitals() {
  useReportWebVitals(metric => {
    trackEvent('web_vital', {
      metric_id: metric.id,
      metric_name: metric.name,
      metric_value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      metric_rating: metric.rating,
    })
  })
  return null
}
```

Render `<WebVitals />` next to `<Analytics />` in `app/layout.tsx`.

- [ ] **Step 4: Add the production Playwright config**

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'performance-budget.spec.ts',
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'npm run start',
    port: 3000,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
```

- [ ] **Step 5: Add explicit transfer budgets**

```ts
import { expect, test } from '@playwright/test'

async function clientJsBytes(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(() =>
    performance.getEntriesByType('resource')
      .filter(entry => entry.name.includes('/_next/static/') && entry.name.endsWith('.js'))
      .reduce((sum, entry) => {
        const resource = entry as PerformanceResourceTiming
        return sum + (resource.transferSize || resource.encodedBodySize || 0)
      }, 0),
  )
}

test('homepage client JavaScript stays under 300 KB transferred', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  expect(await clientJsBytes(page)).toBeLessThanOrEqual(300_000)
})

test('initial check client JavaScript stays under 450 KB transferred', async ({ page }) => {
  await page.goto('/check', { waitUntil: 'networkidle' })
  expect(await clientJsBytes(page)).toBeLessThanOrEqual(450_000)
})

test('initial routes do not contact Mapbox browser endpoints', async ({ page }) => {
  const requests: string[] = []
  page.on('request', request => requests.push(request.url()))
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.goto('/check', { waitUntil: 'networkidle' })
  expect(requests.some(url => /api\.mapbox\.com|events\.mapbox\.com/i.test(url)))
    .toBe(false)
})
```

Hashed chunk URLs cannot prove which npm modules they contain. Treat the Turbopack analyzer inspection in Step 2—not filename matching—as the evidence that PDF, report, chart, and vision modules remain outside initial route graphs.

- [ ] **Step 6: Add the script and run**

```json
"test:performance": "npm run build && playwright test --config=playwright.performance.config.ts"
```

Run:

```powershell
npm run test:performance
```

Expected: PASS. If a budget fails, inspect the analyzer import chain and fix the boundary; do not simply raise the budget.

- [ ] **Step 7: Version-control checkpoint**

If commits are authorized:

```powershell
git add package.json package-lock.json components/WebVitals.tsx app/layout.tsx components/funnel/FunnelContainer.tsx tests/e2e/performance-budget.spec.ts playwright.performance.config.ts
git commit -m "perf: enforce initial route budgets"
```

---

### Task 9: Final analytics, documentation, and release gate

**Files:**

- Modify: `.github/workflows/ci.yml`
- Modify: `CLAUDE.md`
- Create: `tests/e2e/analytics-contract.spec.ts`
- Modify: analytics attributes only where validation finds omissions.

- [ ] **Step 1: Validate event names, required context, and the PII denylist**

Create `tests/e2e/analytics-contract.spec.ts`. Install gtag before navigation by forwarding calls through `page.exposeFunction`, so captures survive page navigation:

```ts
type GtagCall = [command: string, name: string, params?: Record<string, unknown>]

async function captureGtag(page: import('@playwright/test').Page) {
  const calls: GtagCall[] = []
  await page.exposeFunction('__captureGtag', (...args: GtagCall) => {
    calls.push(args)
  })
  await page.addInitScript(() => {
    window.gtag = (...args: unknown[]) => {
      void window.__captureGtag(...args)
    }
  })
  return calls
}

const forbiddenKeys = /(^|_)(name|naam|email|telefoon|phone|address|adres|token|lead_id)($|_)/i

function expectNoPii(calls: GtagCall[], knownPii: string[]) {
  for (const [, , params = {}] of calls) {
    expect(Object.keys(params).some(key => forbiddenKeys.test(key))).toBe(false)
    const serialized = JSON.stringify(params).toLowerCase()
    for (const value of knownPii) {
      expect(serialized).not.toContain(value.toLowerCase())
    }
  }
}
```

Declare `window.__captureGtag` and `window.gtag` in a `declare global` block inside this test file only.

Add test cases using the deterministic route/state mocks from Plans 2–4. Across those cases, assert the canonical events:

```ts
const canonicalEvents = new Set([
  'address_entry_start',
  'address_suggestion_selected',
  'address_entry_submit',
  'funnel_session_started',
  'funnel_stage_viewed',
  'funnel_stage_completed',
  'bag_match_succeeded',
  'bag_match_failed',
  'technical_scan_completed',
  'technical_scan_skipped',
  'technical_module_skipped',
  'lead_submit_started',
  'lead_submit_succeeded',
  'lead_submit_failed',
  'funnel_abandoned',
  'report_reopened',
  'pdf_generation_started',
  'pdf_open_succeeded',
  'pdf_generation_failed',
  'web_vital',
])
```

For every funnel event, assert `funnel_session_id`, `landing_path`, and `pseo_level`; stage events also require `funnel_stage`. `lead_submit_succeeded` requires `lead_quality_segment` and `email_status`. `report_reopened` requires only `report_version` and `email_status`, never identifiers. Web Vitals require `metric_name`, `metric_value`, and `metric_rating`.

Exercise the success and failure branches with mocked BAG/lead APIs, the technical complete/individual-skip/module-skip paths, tokenized report hydration, successful and rejected PDF generation, and a navigation-away `pagehide`. Run `expectNoPii` with the fixture address, name, email, phone, report token, and lead UUID after each case.

- [ ] **Step 2: Add stable CI jobs**

Keep Plan 1 quality/core jobs. Add:

```yaml
  accessibility:
    needs: quality
    runs-on: ubuntu-latest
    timeout-minutes: 20
    env:
      CI: "true"
      NEXT_PUBLIC_SUPABASE_URL: https://example.supabase.co
      NEXT_PUBLIC_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.signature
      SUPABASE_SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.signature
      MAPBOX_ACCESS_TOKEN: pk.ci-placeholder
      LEAD_REPORT_HMAC_SECRET: ci-only-not-a-production-secret
      CRON_SECRET: ci-only-cron-secret
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:a11y
```

Enable visual CI only after Linux baselines from Task 7 are committed. Keep performance as a scheduled/manual job if runtime variance makes it unsuitable for every pull request, but run it before production release.

- [ ] **Step 3: Run the complete verification matrix**

```powershell
git diff --check
npm run typecheck
npm run test:unit
npm run build
npm run test:e2e:core
npm run test:a11y
npx playwright test tests/e2e/analytics-contract.spec.ts --project=chromium
npx playwright test --project=chromium
npx playwright test tests/e2e/funnel-four-stages.spec.ts tests/e2e/report-responsive.spec.ts --project=mobile-chrome
npx playwright test tests/e2e/visual-regression.spec.ts --project=chromium
npm run test:performance
```

Expected: all commands pass, with at most the existing documented pSEO fixture skip.

- [ ] **Step 4: Perform manual responsive acceptance**

At 360, 390, 768, 1024, and 1440px, verify:

- homepage;
- province, city, wijk, street, postcode;
- check stages 1–4;
- mobile and desktop report;
- knowledge/news index and one article;
- privacy;
- 404 and forced error fallback.

At each width confirm no horizontal scroll, one dominant action, 16px mobile inputs, 44px touch targets, readable long Dutch names, safe sticky actions, and no hydration shift.

- [ ] **Step 5: Update `CLAUDE.md`**

Replace stale navy/Plus-Jakarta/design descriptions with the implemented Customer-first Hybrid system. Record:

- route-shell component map;
- exact tokens and fonts;
- pSEO/content route invariants;
- accessibility/visual/performance commands;
- 300 KB homepage and 450 KB initial check transfer budgets;
- removed Mapbox client dependencies;
- Web Vitals event;
- full verification matrix and expected fixture skip;
- all migration filenames introduced by Plans 1–4.

- [ ] **Step 6: Request final reviews**

Use:

- `superpowers:requesting-code-review` for implementation/spec coverage;
- the security-review skill only if the user explicitly requests a security review;
- `superpowers:verification-before-completion` before any completion claim.

- [ ] **Step 7: Version-control checkpoint**

If commits are authorized:

```powershell
git add .github/workflows/ci.yml CLAUDE.md app components lib tests package.json package-lock.json playwright.config.ts playwright.performance.config.ts supabase/migrations
git commit -m "feat: complete customer-first UI overhaul"
```

---

## Final acceptance

The overhaul is complete only when:

- every public route uses the shared header/footer and approved visual roles;
- all pSEO routes preserve metadata, canonical URLs, JSON-LD, ISR, internal links, and street FAQ filtering;
- local context reaches the funnel from every conversion entry;
- all route families pass WCAG A/AA automation and keyboard checks;
- approved critical screens have reviewed, stable snapshots;
- homepage and initial check stay within explicit production JS budgets;
- PDF, Recharts, technical scans, and report code remain outside initial route chunks where applicable;
- Web Vitals and conversion events contain no PII;
- the complete Chromium, focused mobile, build, unit, accessibility, visual, and performance gates pass;
- `CLAUDE.md` matches actual implementation rather than the pre-overhaul design.

