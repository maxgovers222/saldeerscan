# Design System and Conversion Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the approved Customer-first Hybrid visual system and use it on the homepage and every pSEO-to-funnel entry without changing indexed content or route semantics.

**Architecture:** Keep content-heavy pages as Server Components and isolate only address search, social proof, and analytics as Client Components. Define Tailwind v4 semantic tokens once, then compose small server-rendered shells and conversion components. Carry local landing context through a typed query-string helper so the later funnel plan can apply deterministic attribution and state precedence.

**Tech Stack:** Next.js 16.2 Server/Client Components, React 19, Tailwind CSS v4 CSS-first tokens, next/font, shadcn/Base UI primitives, Playwright.

**Depends on:** Plan 1 (`2026-07-10-safe-foundation.md`) completed and green.

---

## File map

Create:

- `components/design-system/BrandMark.tsx` — existing logo geometry as a reusable SVG mark.
- `components/design-system/Container.tsx` — device-safe width and horizontal padding.
- `components/design-system/PageShell.tsx` — evergreen/mist page backgrounds.
- `components/design-system/DarkHeroShell.tsx` — restrained dark hero treatment.
- `components/design-system/ContentSection.tsx` — consistent section spacing and heading.
- `components/design-system/SiteHeader.tsx` — shared responsive header.
- `components/design-system/SiteFooter.tsx` — shared footer.
- `components/design-system/PrimaryAction.tsx` — one dominant amber link CTA.
- `components/home/ConversionHero.tsx` — customer question, address entry, and insight preview.
- `components/home/TrustSignals.tsx` — factual trust proof.
- `components/home/InsightPreview.tsx` — clearly labelled example output.
- `components/home/SocialProofTicker.tsx` — isolated client fetch, hidden below 25.
- `components/home/HomePage.tsx` — server-composed homepage.
- `components/funnel/LandingContextBanner.tsx` — visible local continuity when `/check` opens from pSEO.
- `lib/conversion-context.ts` — typed local/organic context and `/check` URL builder.
- `tests/e2e/conversion-entry.spec.ts` — homepage/pSEO entry, context, keyboard, and overflow checks.

Modify:

- `app/globals.css` — semantic Customer-first Hybrid tokens and global device-safe/focus/reduced-motion rules.
- `app/layout.tsx` — Bricolage Grotesque and DM Sans variables.
- `app/page.tsx` — render the server-composed homepage.
- `components/AddressAutocomplete.tsx` — accessible combobox and typed context.
- `app/check/page.tsx` — display the parsed local landing context above the funnel.
- `components/pseo/WijkCtaButton.tsx` — build a context-preserving check link.
- `app/[provincie]/page.tsx` — replace primary `/check` links with context links only.
- `app/[provincie]/[stad]/page.tsx` — same for city context.
- `app/[provincie]/[stad]/[wijk]/page.tsx` — use shared header and conversion-entry components where safe.
- `app/[provincie]/[stad]/[wijk]/[straat]/page.tsx` — preserve street landing context in the primary CTA.
- `app/postcode/[code]/page.tsx` — preserve postcode context in the primary CTA.
- `components/pseo/HomeDiscovery.tsx` — align tokens and CTA hierarchy.
- `CLAUDE.md` — record tokens, component boundaries, and context parameters.

Delete after the replacement is verified:

- `components/HomePageClient.tsx` — monolithic client homepage.

Do not change:

- metadata builders, canonical URLs, JSON-LD, sitemap, route slugs, ISR values;
- pSEO database queries or generated copy;
- funnel reducer behavior (handled in Plan 3);
- report/email/PDF code (handled in Plan 4).

---

### Task 1: Lock the visual contract in tests

**Files:**

- Create: `tests/e2e/conversion-entry.spec.ts`

- [ ] **Step 1: Write failing homepage hierarchy and overflow tests**

```ts
import { expect, test } from '@playwright/test'

const viewports = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 900 },
  { width: 1440, height: 1000 },
]

test.describe('Customer-first conversion entry', () => {
  test('homepage leads with the customer question and one primary action', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', {
      level: 1,
      name: 'Wat kost stoppen met salderen u?',
    })).toBeVisible()
    await expect(page.getByText('Officiële woningdata')).toBeVisible()
    await expect(page.getByText('U houdt controle')).toBeVisible()
    await expect(page.getByText('Begrijpelijk advies')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Bekijk mijn inzicht' })).toBeVisible()
  })

  for (const viewport of viewports) {
    test(`homepage heeft geen horizontale overflow op ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto('/')
      const sizes = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
      }))
      expect(sizes.documentWidth).toBeLessThanOrEqual(sizes.viewportWidth)
    })
  }
})
```

- [ ] **Step 2: Write failing context and combobox tests**

```ts
test('wijkadres bewaart organische landingscontext', async ({ page }) => {
  await page.route('**/api/bag/suggest**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'adres-1', label: 'Teststraat 1, 3543 AB Utrecht' },
      ]),
    })
  })

  await page.goto('/utrecht/utrecht/leidsche-rijn')
  const input = page.getByRole('combobox', { name: 'Uw adres' })
  await input.fill('Teststraat')
  await page.getByRole('option', { name: 'Teststraat 1, 3543 AB Utrecht' }).click()
  await page.getByRole('button', { name: 'Bekijk mijn inzicht' }).click()

  await expect(page).toHaveURL(/\/check\?/)
  const url = new URL(page.url())
  expect(url.searchParams.get('wijk')).toBe('leidsche-rijn')
  expect(url.searchParams.get('stad')).toBe('utrecht')
  expect(url.searchParams.get('provincie')).toBe('utrecht')
  expect(url.searchParams.get('pseo_level')).toBe('wijk')
  expect(url.searchParams.get('landing_path')).toBe('/utrecht/utrecht/leidsche-rijn')
})

test('adrescombobox werkt met toetsenbord', async ({ page }) => {
  await page.route('**/api/bag/suggest**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([
      { id: 'a', label: 'Teststraat 1, Utrecht' },
      { id: 'b', label: 'Teststraat 2, Utrecht' },
    ]),
  }))
  await page.goto('/')
  const input = page.getByRole('combobox', { name: 'Uw adres' })
  await input.fill('Teststraat')
  await expect(page.getByRole('option')).toHaveCount(2)
  await input.press('ArrowDown')
  await input.press('Enter')
  await expect(input).toHaveValue('Teststraat 1, Utrecht')
})
```

- [ ] **Step 3: Run the file and confirm it fails on the old design**

Run:

```powershell
npx playwright test tests/e2e/conversion-entry.spec.ts --project=chromium
```

Expected: FAIL on the new heading, button label, combobox name, and context query.

---

### Task 2: Centralize Customer-first Hybrid tokens and fonts

**Files:**

- Modify: `app/globals.css:7-159`
- Modify: `app/layout.tsx:1-16,91-94`

- [ ] **Step 1: Replace the conflicting font variables**

```ts
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google'

const bricolage = Bricolage_Grotesque({
  variable: '--font-bricolage',
  subsets: ['latin'],
  display: 'swap',
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})
```

Use:

```tsx
<html
  lang="nl"
  className={`${bricolage.variable} ${dmSans.variable} h-full antialiased`}
>
```

This removes the current `--font-heading` recursion and makes the approved heading font real.

- [ ] **Step 2: Replace ad-hoc palette tokens with semantic Tailwind v4 roles**

In the first `@theme` block:

```css
@theme {
  --color-evergreen-950: #06130f;
  --color-evergreen-900: #0b211a;
  --color-trust: #00b875;
  --color-trust-dark: #008f5b;
  --color-action: #ffb020;
  --color-action-hover: #ffc04d;
  --color-mist: #f3f7f5;
  --color-paper: #fbfdfc;
  --color-ink: #10231d;
  --color-ink-muted: #5a6d66;
  --color-success: #00b875;
  --color-warning: #d97706;
  --color-danger: #dc2626;
  --font-family-sans: var(--font-dm-sans), ui-sans-serif, system-ui, sans-serif;
  --font-family-heading: var(--font-bricolage), ui-sans-serif, system-ui, sans-serif;
  --font-family-mono: ui-monospace, "Cascadia Code", monospace;
}
```

In `@theme inline`:

```css
--font-sans: var(--font-dm-sans);
--font-heading: var(--font-bricolage);
```

Set the shadcn semantic defaults:

```css
:root {
  --background: #f3f7f5;
  --foreground: #10231d;
  --card: #fbfdfc;
  --card-foreground: #10231d;
  --popover: #fbfdfc;
  --popover-foreground: #10231d;
  --primary: #ffb020;
  --primary-foreground: #06130f;
  --secondary: #e6efeb;
  --secondary-foreground: #10231d;
  --muted: #eaf1ee;
  --muted-foreground: #5a6d66;
  --accent: #dff6ec;
  --accent-foreground: #075c3e;
  --destructive: #dc2626;
  --border: #d9e4df;
  --input: #cfded7;
  --ring: #00b875;
  --radius: 0.875rem;
}
```

- [ ] **Step 3: Add global device-safe, focus, and motion rules**

```css
@layer base {
  *, *::before, *::after {
    box-sizing: border-box;
    min-width: 0;
  }

  html, body {
    width: 100%;
    max-width: 100%;
    overflow-x: clip;
  }

  body {
    min-height: 100dvh;
    background: var(--background);
    color: var(--foreground);
    font-family: var(--font-family-sans);
  }

  :focus-visible {
    outline: 3px solid color-mix(in srgb, #00b875 45%, transparent);
    outline-offset: 3px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 4: Verify typography and static correctness**

Run:

```powershell
npm run typecheck
npm run build
```

Expected: PASS; build output must not report an unavailable font export.

- [ ] **Step 5: Version-control checkpoint**

If commits are explicitly authorized:

```powershell
git add app/globals.css app/layout.tsx
git commit -m "style: establish customer-first design tokens"
```

---

### Task 3: Build server-first shells and shared brand chrome

**Files:**

- Create: `components/design-system/BrandMark.tsx`
- Create: `components/design-system/Container.tsx`
- Create: `components/design-system/PageShell.tsx`
- Create: `components/design-system/DarkHeroShell.tsx`
- Create: `components/design-system/ContentSection.tsx`
- Create: `components/design-system/SiteHeader.tsx`
- Create: `components/design-system/SiteFooter.tsx`
- Create: `components/design-system/PrimaryAction.tsx`
- Test: `tests/e2e/conversion-entry.spec.ts`

- [ ] **Step 1: Implement the reusable mark**

```tsx
import { cn } from '@/lib/utils'

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-xl bg-trust text-white',
        className,
      )}
    >
      <svg viewBox="0 0 18 18" fill="none" className="size-5">
        <path
          d="M9 2 15.5 6v7L9 17l-6.5-4V6L9 2Z"
          fill="currentColor"
          fillOpacity=".25"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <path d="m9 6.5 3 2V12l-3 2-3-2V8.5l3-2Z" fill="currentColor" />
      </svg>
    </span>
  )
}
```

- [ ] **Step 2: Implement the device-safe container and shells**

`components/design-system/Container.tsx`:

```tsx
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Container({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8', className)}
      {...props}
    />
  )
}
```

`components/design-system/PageShell.tsx`:

```tsx
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function PageShell({
  surface = 'mist',
  className,
  ...props
}: ComponentProps<'div'> & { surface?: 'mist' | 'evergreen' }) {
  return (
    <div
      className={cn(
        'min-h-dvh w-full overflow-x-clip',
        surface === 'mist'
          ? 'bg-mist text-ink'
          : 'bg-evergreen-950 text-white',
        className,
      )}
      {...props}
    />
  )
}
```

`components/design-system/DarkHeroShell.tsx`:

```tsx
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function DarkHeroShell({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        'relative isolate overflow-hidden bg-evergreen-950 text-white',
        'before:pointer-events-none before:absolute before:inset-0',
        'before:bg-[radial-gradient(circle_at_50%_0%,rgba(0,184,117,.16),transparent_58%)]',
        className,
      )}
      {...props}
    />
  )
}
```

`components/design-system/ContentSection.tsx`:

```tsx
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Container } from './Container'

export function ContentSection({
  eyebrow,
  title,
  intro,
  children,
  className,
}: ComponentProps<'section'> & {
  eyebrow?: string
  title?: string
  intro?: string
  children: ReactNode
}) {
  return (
    <section className={cn('py-14 sm:py-20', className)}>
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
```

- [ ] **Step 3: Implement the primary action**

```tsx
import type { ComponentProps } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function PrimaryAction({
  className,
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        'inline-flex min-h-11 items-center justify-center rounded-xl',
        'bg-action px-5 py-3 font-heading text-sm font-bold text-evergreen-950',
        'shadow-[0_12px_32px_rgba(255,176,32,.22)]',
        'transition hover:bg-action-hover active:translate-y-px',
        className,
      )}
      {...props}
    />
  )
}
```

- [ ] **Step 4: Implement the shared header and footer**

`SiteHeader` props:

```tsx
export interface SiteHeaderProps {
  tone?: 'dark' | 'light'
  compact?: boolean
  contextLabel?: string
  ctaHref?: string
  ctaLabel?: string
}
```

Render a semantic `<header><nav aria-label="Hoofdnavigatie">`, `BrandMark`, a `Link` brand, optional desktop links to `/kennisbank` and `/nieuws`, and exactly one `PrimaryAction`. Use `Container`, a minimum 56px mobile height, and no client state.

`SiteFooter` renders the existing factual navigation and email address with `Container`; it must not add claims, live counts, partner logos, or response-time promises.

- [ ] **Step 5: Add shell semantics tests**

Append:

```ts
test('shared header has one labelled primary navigation', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('navigation', { name: 'Hoofdnavigatie' })).toHaveCount(1)
  await expect(page.getByRole('link', { name: 'SaldeerScan.nl' })).toBeVisible()
})
```

- [ ] **Step 6: Run typecheck**

Run:

```powershell
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Version-control checkpoint**

If commits are authorized:

```powershell
git add components/design-system tests/e2e/conversion-entry.spec.ts
git commit -m "feat: add responsive site shells"
```

---

### Task 4: Carry explicit landing context into `/check`

**Files:**

- Create: `lib/conversion-context.ts`
- Create: `components/funnel/LandingContextBanner.tsx`
- Modify: `app/check/page.tsx`
- Modify: `components/pseo/WijkCtaButton.tsx`
- Modify: `app/[provincie]/page.tsx`
- Modify: `app/[provincie]/[stad]/page.tsx`
- Modify: `app/[provincie]/[stad]/[wijk]/[straat]/page.tsx`
- Modify: `app/postcode/[code]/page.tsx`
- Test: `tests/e2e/conversion-entry.spec.ts`

- [ ] **Step 1: Add pure URL-builder tests**

Create `tests/unit/conversion-context.spec.ts`:

```ts
import { expect, test } from '@playwright/test'
import { buildCheckHref } from '@/lib/conversion-context'

test('builds stable wijk context', () => {
  expect(buildCheckHref({
    landingPath: '/utrecht/utrecht/leidsche-rijn',
    pseoLevel: 'wijk',
    provincie: 'utrecht',
    stad: 'utrecht',
    wijk: 'leidsche-rijn',
  })).toBe(
    '/check?landing_path=%2Futrecht%2Futrecht%2Fleidsche-rijn&pseo_level=wijk&provincie=utrecht&stad=utrecht&wijk=leidsche-rijn',
  )
})

test('omits empty context values', () => {
  expect(buildCheckHref({
    landingPath: '/',
    pseoLevel: 'home',
  })).toBe('/check?landing_path=%2F&pseo_level=home')
})
```

- [ ] **Step 2: Implement the typed helper**

```ts
export type PseoLevel =
  | 'home'
  | 'provincie'
  | 'stad'
  | 'wijk'
  | 'straat'
  | 'postcode'
  | 'kennisbank'
  | 'nieuws'

export interface ConversionContext {
  landingPath: string
  pseoLevel: PseoLevel
  provincie?: string
  stad?: string
  wijk?: string
  straat?: string
  postcode?: string
}

export function conversionParams(
  context: ConversionContext,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries({
      landing_path: context.landingPath,
      pseo_level: context.pseoLevel,
      provincie: context.provincie,
      stad: context.stad,
      wijk: context.wijk,
      straat: context.straat,
      postcode: context.postcode,
    }).filter((entry): entry is [string, string] => Boolean(entry[1])),
  )
}

export function buildCheckHref(context: ConversionContext): string {
  return `/check?${new URLSearchParams(conversionParams(context)).toString()}`
}

const PSEO_LEVELS = new Set<PseoLevel>([
  'home', 'provincie', 'stad', 'wijk', 'straat', 'postcode', 'kennisbank', 'nieuws',
])

export function parseConversionContext(
  params: Pick<URLSearchParams, 'get'>,
): ConversionContext | null {
  const pseoLevel = params.get('pseo_level')
  const landingPath = params.get('landing_path')
  if (!pseoLevel || !PSEO_LEVELS.has(pseoLevel as PseoLevel) || !landingPath) {
    return null
  }
  return {
    landingPath,
    pseoLevel: pseoLevel as PseoLevel,
    provincie: params.get('provincie') || undefined,
    stad: params.get('stad') || undefined,
    wijk: params.get('wijk') || undefined,
    straat: params.get('straat') || undefined,
    postcode: params.get('postcode') || undefined,
  }
}
```

- [ ] **Step 3: Upgrade `WijkCtaButton` without changing its client analytics**

Add `provincie?: string` and default the landing path from the supplied slugs:

```tsx
const context = {
  landingPath: provincie
    ? `/${provincie}/${stad}/${wijk}`
    : `/${stad}/${wijk}`,
  pseoLevel: 'wijk' as const,
  provincie,
  stad,
  wijk,
}

<a
  href={buildCheckHref(context)}
  onClick={() => trackEvent('pseo_check_cta', {
    pseo_level: 'wijk',
    provincie: provincie ?? '',
    stad,
    wijk,
    landing_path: context.landingPath,
  })}
>
```

Pass `provincie` from the wijk page.

- [ ] **Step 4: Replace only primary conversion links on other pSEO levels**

For each route, use `buildCheckHref` with its exact path and slugs. Example city:

```ts
const checkHref = buildCheckHref({
  landingPath: `/${provincie}/${stad}`,
  pseoLevel: 'stad',
  provincie,
  stad,
})
```

Do not change internal hub links, breadcrumbs, canonical URLs, or JSON-LD.

- [ ] **Step 5: Add a failing continuity test on `/check`**

```ts
test('checkpagina bevestigt de lokale landingscontext', async ({ page }) => {
  await page.goto(
    '/check?landing_path=%2Futrecht%2Futrecht%2Fleidsche-rijn'
      + '&pseo_level=wijk&provincie=utrecht&stad=utrecht&wijk=leidsche-rijn',
  )
  await expect(page.getByTestId('landing-context')).toContainText(
    'Leidsche Rijn, Utrecht',
  )
  await expect(page.getByText('We nemen deze regio mee in uw check.')).toBeVisible()
})
```

Run only this test and confirm it fails because the banner does not exist.

- [ ] **Step 6: Render a compact local-context banner**

Create `components/funnel/LandingContextBanner.tsx`:

```tsx
import type { ConversionContext } from '@/lib/conversion-context'

function humanizeSlug(value: string): string {
  return value
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function LandingContextBanner({
  context,
}: {
  context: ConversionContext | null
}) {
  if (!context || context.pseoLevel === 'home') return null
  const place = context.postcode
    ? `Postcode ${context.postcode}`
    : [context.straat, context.wijk, context.stad, context.provincie]
        .filter((value): value is string => Boolean(value))
        .map(humanizeSlug)
        .filter((value, index, values) => values.indexOf(value) === index)
        .slice(0, 2)
        .join(', ')
  if (!place) return null
  return (
    <aside
      data-testid="landing-context"
      className="mb-4 rounded-xl border border-trust/25 bg-trust/10 px-4 py-3 text-sm text-white/75"
    >
      <p className="font-semibold text-white">{place}</p>
      <p className="mt-1">We nemen deze regio mee in uw check.</p>
    </aside>
  )
}
```

In `app/check/page.tsx`, parse and render the context before `CountdownTimer`:

```tsx
const context = parseConversionContext(searchParams)

<LandingContextBanner context={context} />
```

This is presentation-only in this phase; Plan 3 consumes the same URL fields in reducer bootstrap and analytics.

- [ ] **Step 7: Run URL and continuity tests**

Run:

```powershell
npm run test:unit -- tests/unit/conversion-context.spec.ts
npm run typecheck
npx playwright test tests/e2e/conversion-entry.spec.ts --project=chromium
```

Expected: PASS.

- [ ] **Step 8: Version-control checkpoint**

If commits are authorized:

```powershell
git add lib/conversion-context.ts components/funnel/LandingContextBanner.tsx tests/unit/conversion-context.spec.ts tests/e2e/conversion-entry.spec.ts components/pseo/WijkCtaButton.tsx app
git commit -m "feat: preserve local conversion context"
```

---

### Task 5: Rebuild the address entry as an accessible client island

**Files:**

- Modify: `components/AddressAutocomplete.tsx:1-145`
- Test: `tests/e2e/conversion-entry.spec.ts`

- [ ] **Step 1: Extend the public API**

```ts
import type { ConversionContext } from '@/lib/conversion-context'

interface Props {
  context?: ConversionContext
  extraParams?: Record<string, string>
  placeholder?: string
  buttonLabel?: string
  className?: string
}
```

- [ ] **Step 2: Add stable combobox IDs and request cancellation**

Use `useId`, an `AbortController` ref, and cleanup:

```ts
const id = useId()
const inputId = `${id}-input`
const listboxId = `${id}-listbox`
const requestRef = useRef<AbortController | null>(null)

const fetchSuggestions = useCallback(async (q: string) => {
  requestRef.current?.abort()
  if (q.trim().length < 3) {
    setSuggestions([])
    setOpen(false)
    return
  }
  const controller = new AbortController()
  requestRef.current = controller
  setLoading(true)
  try {
    const response = await fetch(
      `/api/bag/suggest?q=${encodeURIComponent(q.trim())}`,
      { signal: controller.signal },
    )
    if (!response.ok) throw new Error('suggest_failed')
    const data = await response.json() as Suggestion[]
    setSuggestions(data)
    setOpen(data.length > 0)
    setActiveIdx(-1)
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      setSuggestions([])
      setOpen(false)
    }
  } finally {
    if (!controller.signal.aborted) setLoading(false)
  }
}, [])

useEffect(() => () => {
  if (debounceRef.current) clearTimeout(debounceRef.current)
  requestRef.current?.abort()
}, [])
```

- [ ] **Step 3: Use the complete combobox/listbox pattern**

The input must include:

```tsx
<label htmlFor={inputId} className="sr-only">Uw adres</label>
<input
  id={inputId}
  role="combobox"
  aria-label="Uw adres"
  aria-autocomplete="list"
  aria-expanded={open}
  aria-controls={listboxId}
  aria-activedescendant={
    activeIdx >= 0 ? `${listboxId}-option-${activeIdx}` : undefined
  }
  className="min-h-14 w-full rounded-xl border border-white/15 bg-white px-4 text-base text-ink shadow-sm placeholder:text-ink-muted/70 focus:border-trust"
/>
```

The list and options must include:

```tsx
<ul id={listboxId} role="listbox">
  {suggestions.map((suggestion, index) => (
    <li
      id={`${listboxId}-option-${index}`}
      role="option"
      aria-selected={index === activeIdx}
      key={suggestion.id}
    >
      {suggestion.label}
    </li>
  ))}
</ul>
```

Add a visually-hidden `aria-live="polite"` status that announces loading and result count.

- [ ] **Step 4: Merge context into navigation and analytics**

```ts
const params = new URLSearchParams({
  adres: selected.label,
  ...(context ? conversionParams(context) : {}),
  ...extraParams,
})

trackEvent('address_entry_submit', {
  landing_path: context?.landingPath ?? '/',
  pseo_level: context?.pseoLevel ?? 'home',
})
router.push(`/check?${params.toString()}`)
```

Track `address_entry_start` only once on first non-empty change and `address_suggestion_selected` on selection.

- [ ] **Step 5: Apply the approved form visual language**

Use one column below `sm`, a minimum 56px input/button height, `text-base` on mobile, a rectangular 12–16px radius rather than a pill, and one amber button labelled `buttonLabel ?? 'Bekijk mijn inzicht'`.

- [ ] **Step 6: Run combobox and context E2E**

Run:

```powershell
npx playwright test tests/e2e/conversion-entry.spec.ts --project=chromium
```

Expected: keyboard and context tests pass; homepage heading tests still fail until Task 6.

- [ ] **Step 7: Version-control checkpoint**

If commits are authorized:

```powershell
git add components/AddressAutocomplete.tsx tests/e2e/conversion-entry.spec.ts
git commit -m "feat: make address entry accessible and contextual"
```

---

### Task 6: Compose the server-first homepage

**Files:**

- Create: `components/home/ConversionHero.tsx`
- Create: `components/home/TrustSignals.tsx`
- Create: `components/home/InsightPreview.tsx`
- Create: `components/home/SocialProofTicker.tsx`
- Create: `components/home/HomePage.tsx`
- Modify: `app/page.tsx`
- Modify: `components/pseo/HomeDiscovery.tsx`
- Delete: `components/HomePageClient.tsx`
- Test: `tests/e2e/conversion-entry.spec.ts`

- [ ] **Step 1: Isolate factual social proof**

```tsx
'use client'

import { useEffect, useState } from 'react'

export function SocialProofTicker() {
  const [count, setCount] = useState<number | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/stats', { signal: controller.signal })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then((data: { count?: number }) => setCount(
        typeof data.count === 'number' ? data.count : null,
      ))
      .catch(() => {})
    return () => controller.abort()
  }, [])
  if (count === null || count < 25) return null
  const rounded = Math.floor(count / 10) * 10
  return (
    <p className="text-sm text-white/60" aria-label={`${rounded} of meer analyses uitgevoerd`}>
      <strong className="font-mono text-trust">{rounded}+</strong> analyses uitgevoerd
    </p>
  )
}
```

- [ ] **Step 2: Build the insight preview and trust signals**

`InsightPreview` must be labelled “Voorbeeld van uw inzicht”, use example values only, and render:

- possible loss from 2027;
- possible annual saving;
- example score;
- “Persoonlijke waarden volgen na uw adrescheck”.

`TrustSignals` renders exactly:

```ts
const signals = [
  {
    title: 'Officiële woningdata',
    text: 'Bouwjaar en woningkenmerken uit het BAG-register.',
  },
  {
    title: 'U houdt controle',
    text: 'Geen gegevensdeling zonder expliciete toestemming.',
  },
  {
    title: 'Begrijpelijk advies',
    text: 'Eerst uw uitkomst, daarna de technische onderbouwing.',
  },
]
```

Use inline SVG icons with `aria-hidden="true"` and no emoji.

- [ ] **Step 3: Build the conversion hero**

```tsx
import { AddressAutocomplete } from '@/components/AddressAutocomplete'
import { Container } from '@/components/design-system/Container'
import { DarkHeroShell } from '@/components/design-system/DarkHeroShell'
import { InsightPreview } from './InsightPreview'
import { SocialProofTicker } from './SocialProofTicker'

export function ConversionHero() {
  return (
    <DarkHeroShell>
      <Container className="relative grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:py-24">
        <div>
          <p className="mb-4 text-sm font-semibold text-trust">
            Persoonlijk energieadvies voor 2027
          </p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-[-.035em] sm:text-5xl lg:text-6xl">
            Wat kost stoppen met salderen u?
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-white/70">
            Vul uw adres in. U ziet direct uw verwachte verlies,
            woningfit en beste vervolgstap.
          </p>
          <div className="mt-8 max-w-xl">
            <AddressAutocomplete
              context={{ landingPath: '/', pseoLevel: 'home' }}
              placeholder="Uw postcode en huisnummer"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/60">
            <span>Gratis</span>
            <span>Geen account</span>
            <span>Alleen delen met toestemming</span>
          </div>
          <div className="mt-5"><SocialProofTicker /></div>
        </div>
        <InsightPreview />
      </Container>
    </DarkHeroShell>
  )
}
```

- [ ] **Step 4: Compose the homepage on the server**

```tsx
import type { ReactNode } from 'react'
import { PageShell } from '@/components/design-system/PageShell'
import { SiteFooter } from '@/components/design-system/SiteFooter'
import { SiteHeader } from '@/components/design-system/SiteHeader'
import { ContentSection } from '@/components/design-system/ContentSection'
import { ConversionHero } from './ConversionHero'
import { TrustSignals } from './TrustSignals'

export function HomePage({ discovery }: { discovery: ReactNode }) {
  return (
    <PageShell>
      <SiteHeader tone="dark" />
      <ConversionHero />
      <ContentSection className="bg-paper">
        <TrustSignals />
      </ContentSection>
      {discovery}
      <ContentSection
        eyebrow="Zo werkt het"
        title="Van adres naar een begrijpelijke vervolgstap"
        intro="We controleren uw woning, berekenen de 2027-impact en laten zien welke informatie het advies nauwkeuriger maakt."
      >
        <ol className="grid gap-4 md:grid-cols-3">
          {[
            ['1', 'Woning controleren', 'BAG, postcode en lokaal stroomnet.'],
            ['2', 'Impact berekenen', 'Verlies, besparing en woningfit.'],
            ['3', 'Rapport ontvangen', 'Websamenvatting, e-mail en volledige PDF.'],
          ].map(([number, title, text]) => (
            <li key={number} className="rounded-2xl border border-ink/10 bg-paper p-6">
              <span className="font-mono text-sm text-trust-dark">{number}</span>
              <h3 className="mt-4 text-xl font-bold">{title}</h3>
              <p className="mt-2 leading-7 text-ink-muted">{text}</p>
            </li>
          ))}
        </ol>
      </ContentSection>
      <SiteFooter />
    </PageShell>
  )
}
```

- [ ] **Step 5: Switch `app/page.tsx` and remove the monolith**

```tsx
import { HomePage } from '@/components/home/HomePage'
import { HomeDiscovery } from '@/components/pseo/HomeDiscovery'

export default function Home() {
  return <HomePage discovery={<HomeDiscovery />} />
}
```

Delete `components/HomePageClient.tsx` only after no imports remain:

```powershell
rg "HomePageClient" .
```

Expected before deletion: only its own file; expected after deletion: no matches.

- [ ] **Step 6: Harmonize `HomeDiscovery`**

Keep all server queries and links. Change only surfaces, typography, radii, and the secondary “Zoek op postcode” action so it cannot visually compete with the hero address action.

- [ ] **Step 7: Run homepage E2E and build**

Run:

```powershell
npx playwright test tests/e2e/conversion-entry.spec.ts --project=chromium
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 8: Version-control checkpoint**

If commits are authorized:

```powershell
git add app/page.tsx components/home components/pseo/HomeDiscovery.tsx components/HomePageClient.tsx
git commit -m "feat: rebuild homepage around customer insight"
```

---

### Task 7: Add the local conversion entry to the wijk page

**Files:**

- Modify: `app/[provincie]/[stad]/[wijk]/page.tsx`
- Modify: `tests/e2e/conversion-entry.spec.ts`

- [ ] **Step 1: Place local value before technical detail**

Without removing indexed body copy or schema, add directly below the local hero:

```tsx
<section className="bg-mist py-10 sm:py-14">
  <Container>
    <div className="grid gap-6 rounded-3xl border border-ink/10 bg-paper p-5 shadow-sm sm:p-8 lg:grid-cols-[1fr_.9fr] lg:items-center">
      <div>
        <p className="text-sm font-semibold text-trust-dark">
          Persoonlijke check voor {wijkDisplay}
        </p>
        <h2 className="mt-2 text-3xl font-bold text-ink">
          Wat betekent 2027 voor uw adres?
        </h2>
        <p className="mt-3 max-w-xl leading-7 text-ink-muted">
          De wijkcijfers zijn een gemiddelde. Vul uw adres in voor uw
          woningkenmerken, verwachte impact en beste vervolgstap.
        </p>
      </div>
      <AddressAutocomplete
        context={{
          landingPath: `/${provincie}/${stad}/${wijk}`,
          pseoLevel: 'wijk',
          provincie,
          stad,
          wijk,
        }}
        placeholder={`Uw adres in ${wijkDisplay}`}
      />
    </div>
  </Container>
</section>
```

This becomes the dominant conversion action. Existing lower CTAs become quiet text links or are removed if duplicate.

- [ ] **Step 2: Use the shared header**

Replace the local white navbar with:

```tsx
<SiteHeader
  tone="dark"
  contextLabel={`${wijkDisplay}, ${stadDisplay}`}
  ctaHref={buildCheckHref({
    landingPath: `/${provincie}/${stad}/${wijk}`,
    pseoLevel: 'wijk',
    provincie,
    stad,
    wijk,
  })}
/>
```

Keep breadcrumb markup and JSON-LD untouched.

- [ ] **Step 3: Verify local context and pSEO invariants**

Run:

```powershell
npx playwright test tests/e2e/conversion-entry.spec.ts tests/e2e/wijk-validatie.spec.ts --project=chromium
```

Expected: conversion context, H1, JSON-LD, net badge, data ribbon, and street-link tests pass.

- [ ] **Step 4: Version-control checkpoint**

If commits are authorized:

```powershell
git add "app/[provincie]/[stad]/[wijk]/page.tsx" tests/e2e/conversion-entry.spec.ts
git commit -m "feat: connect local pages to address insight"
```

---

### Task 8: Verify the phase and update project memory

**Files:**

- Modify: `CLAUDE.md`

- [ ] **Step 1: Run the phase gate**

```powershell
git diff --check
npm run typecheck
npm run test:unit
npm run build
npx playwright test tests/e2e/conversion-entry.spec.ts tests/e2e/wijk-validatie.spec.ts --project=chromium
```

Expected: all commands pass.

- [ ] **Step 2: Perform browser verification**

Check `/`, one wijk route, one province route, one city route, one street route, and `/postcode/1012` at 360, 390, 768, 1024, and 1440px. For each:

- no horizontal scrollbar;
- text remains readable at 200% zoom;
- one dominant amber action in the initial viewport;
- header action remains reachable without covering content;
- keyboard focus is visible;
- reduced-motion disables pulsing/continuous decorative movement;
- address dropdown remains within the viewport.

- [ ] **Step 3: Update `CLAUDE.md`**

Document:

- semantic token names and exact hex values;
- `--font-bricolage` / `--font-dm-sans`;
- shared components under `components/design-system`;
- conversion query parameters: `landing_path`, `pseo_level`, `provincie`, `stad`, `wijk`, `straat`, `postcode`;
- homepage is server-composed; only address and social proof are client islands;
- indexed metadata/JSON-LD were intentionally preserved.

- [ ] **Step 4: Request code review**

Use `superpowers:requesting-code-review`. Review against the approved mockup and explicitly check Server/Client boundaries, CTA competition, truthful proof, accessibility, and pSEO invariants.

- [ ] **Step 5: Version-control checkpoint**

If commits are authorized:

```powershell
git add CLAUDE.md
git commit -m "docs: record customer-first design system"
```

---

## Phase acceptance

This plan is complete only when:

- approved evergreen/trust/action/mist/paper/ink roles are centralized;
- Bricolage Grotesque and DM Sans are actually applied;
- the homepage initial viewport asks the customer question and offers one address action;
- all trust signals are factual;
- address entry is keyboard-operable and has combobox/listbox semantics;
- local pSEO context survives into `/check` and is visibly confirmed there;
- no changed page has horizontal overflow at the five target widths;
- content routes remain Server Components except for explicit client islands;
- canonical metadata, JSON-LD, ISR, route slugs, and internal links still pass existing tests.

