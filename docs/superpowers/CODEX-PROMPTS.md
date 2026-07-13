# Codex Prompts — fases 1–4 (copy-paste)

**Repo:** `C:\Projects\saldeerscan`  
**Vóór elke prompt:** `git pull` → juiste branch → `npm run typecheck` → Codex `/status` (weekly >60% voor Sol).

**Legenda modellen:**
| Label | Model in Codex |
|-------|----------------|
| **Sol** | GPT 5.6 Sol |
| **Sol Max** | GPT 5.6 Sol + Max Mode (lange context) |
| **Terra** | GPT 5.6 Terra |

---

## Gedeelde prefix (plak boven elke fase-prompt)

```
Project: Saldeerscan.nl — Next.js 16 App Router, React 19, Tailwind v4, Supabase.
Werk in de repo-root.

Lees eerst:
- docs/superpowers/HANDOFF-2026-07-10-customer-first-ui-overhaul.md (server-trust + fase-status)

Regels (altijd):
- Voer ALLEEN de genoemde plan-tasks uit; stop daarna.
- Task voor task volgens het plan (checkboxes).
- Server-trust fase 0: roiInput in funnel + POST /api/leads; client roiResult/healthScore = display-only.
- Geen commit tenzij ik zeg "commit nu".
- Geen nieuwe docs behalve wat het plan expliciet vraagt.
- Minimale diff; match bestaande stijl.
- Sluit af met: welke tests ik moet draaien.
```

---

## FASE 1 — Design system + entry

**Plan:** `docs/superpowers/plans/2026-07-10-design-system-conversion-entry.md`  
**Branch:** `feat/phase-1-design-system`

### Sessie 1.1 — Tasks 1–3
**Model: Sol** (geen Max nodig)

```
[plak gedeelde prefix]

Plan: docs/superpowers/plans/2026-07-10-design-system-conversion-entry.md
Branch: feat/phase-1-design-system (maak aan als die nog niet bestaat)

Voer uit: Task 1, Task 2, Task 3.
- Task 1: visual contract tests
- Task 2: Customer-first Hybrid tokens in globals.css
- Task 3: design-system shells (Container, PageShell, DarkHeroShell, SiteHeader, SiteFooter, PrimaryAction, BrandMark)

Stop na Task 3.
```

**Jij na sessie:** `npm run typecheck && npm run test:unit`

---

### Sessie 1.2 — Tasks 4–6
**Model: Sol**

```
[plak gedeelde prefix]

Plan: docs/superpowers/plans/2026-07-10-design-system-conversion-entry.md
Branch: feat/phase-1-design-system

Voer uit: Task 4, Task 5, Task 6.
- Task 4: lib/conversion-context.ts + typed landing context naar /check
- Task 5: AddressAutocomplete / accessible client island
- Task 6: server-first homepage (ConversionHero, TrustSignals, etc.)

Stop na Task 6.
```

**Jij na sessie:** `npm run typecheck && npm run build`

---

### Sessie 1.3 — Tasks 7–8
**Model: Sol**

```
[plak gedeelde prefix]

Plan: docs/superpowers/plans/2026-07-10-design-system-conversion-entry.md
Branch: feat/phase-1-design-system

Voer uit: Task 7 en Task 8.
- Task 7: wijk-pagina local conversion entry
- Task 8: verify + CLAUDE.md voortgang bijwerken indien plan dat vraagt

Stop na Task 8. Fase 1 is klaar voor mijn review.
```

**Jij na fase 1:**
```bash
npm run typecheck && npm run test:unit && npm run build && npm run test:e2e:core
```
Visueel homepage 390px + 1440px → commit → PR → merge.

---

## FASE 2 — Funnel + analytics

**Plan:** `docs/superpowers/plans/2026-07-10-funnel-analytics.md`  
**Branch:** `feat/phase-2-funnel-analytics`  
**Depends on:** fase 1 gemerged op master.

### Sessie 2.1 — Tasks 1–2
**Model: Sol Max**

```
[plak gedeelde prefix]

Plan: docs/superpowers/plans/2026-07-10-funnel-analytics.md
Branch: feat/phase-2-funnel-analytics

Voer uit: Task 1 en Task 2.
- Task 1: funnel-state.ts + four-stage selectors + tests/unit/funnel-state.spec.ts
- Task 2: funnel-storage.ts + URL/localStorage precedence (fix restore conflicts)

KRITIEK: behoud ?leadId= zonder &token= fix in FunnelContainer (geen infinite fetch loop).
Behoud roiInput in state (fase 0).

Stop na Task 2.
```

**Jij:** `npm run test:unit -- tests/unit/funnel-state.spec.ts`

---

### Sessie 2.2 — Tasks 3–4
**Model: Sol Max**

```
[plak gedeelde prefix]

Plan: docs/superpowers/plans/2026-07-10-funnel-analytics.md
Branch: feat/phase-2-funnel-analytics

Voer uit: Task 3 en Task 4.
- Task 3: lib/funnel-analytics.ts + session ID + typed attribution
- Task 4: ProgressHeader + vier zichtbare customer stages

Stop na Task 4.
```

**Jij:** `npm run test:unit -- tests/unit/funnel-analytics.spec.ts`

---

### Sessie 2.3 — Tasks 5–6
**Model: Sol Max**

```
[plak gedeelde prefix]

Plan: docs/superpowers/plans/2026-07-10-funnel-analytics.md
Branch: feat/phase-2-funnel-analytics

Voer uit: Task 5 en Task 6.
- Task 5: TechnicalScanModule (meterkast/plaatsing/omvormer) + lazy imports
- Task 6: ChoiceCard, StickyActionBar, ValidationMessage, touch/keyboard

Stop na Task 6.
```

**Jij:** `npm run typecheck && npm run build`

---

### Sessie 2.4 — Tasks 7–8
**Model: Sol** (events + verify; Max optioneel)

```
[plak gedeelde prefix]

Plan: docs/superpowers/plans/2026-07-10-funnel-analytics.md
Branch: feat/phase-2-funnel-analytics

Voer uit: Task 7 en Task 8.
- Task 7: GA4 funnel events (geen PII in payloads)
- Task 8: funnel regression tests

Stop na Task 8. Fase 2 klaar voor review.
```

**Jij na fase 2:**
```bash
npm run test:unit
npx playwright test tests/e2e/funnel-deep.spec.ts --project=chromium
npm run test:e2e:core
```
→ PR → merge.

---

### Sessie 2.x — Alleen bij rode tests
**Model: Terra**

```
Fix ALLEEN deze testfout. Geen refactor, geen andere bestanden.

Fout:
[plak terminal output]

Bestand: [path]
Behoud server-trust fase 0 en ?leadId= loop-fix.
```

---

## FASE 3 — Rapportketen

**Plan:** `docs/superpowers/plans/2026-07-10-report-chain.md`  
**Branch:** `feat/phase-3-report-chain`

### Sessie 3.1 — Tasks 1–2
**Model: Sol Max**

```
[plak gedeelde prefix]

Plan: docs/superpowers/plans/2026-07-10-report-chain.md
Branch: feat/phase-3-report-chain

Voer uit: Task 1 en Task 2.
- Task 1: lib/report-model.ts + unit tests (normalized report, nieuwe installatie + bestaande panelen)
- Task 2: email delivery state (SubmissionStatus, API truth — nooit "verzonden" bij failure)

Stop na Task 2.
```

**Jij:** `npm run test:unit -- tests/unit/report-model.spec.ts` (of pad uit plan)

---

### Sessie 3.2 — Tasks 3–4
**Model: Sol Max**

```
[plak gedeelde prefix]

Plan: docs/superpowers/plans/2026-07-10-report-chain.md
Branch: feat/phase-3-report-chain

Voer uit: Task 3 en Task 4.
- Task 3: components/report/* — responsive web report (CSS, geen runtime viewport hook)
- Task 4: lib/report-email.ts — HTML uit zelfde model

Vervang/refactor ResultsDashboard richting report-model; behoud PDF-knop workflow.

Stop na Task 4.
```

**Jij:** `npm run typecheck && npm run build`

---

### Sessie 3.3 — Tasks 5–6
**Model: Sol Max**

```
[plak gedeelde prefix]

Plan: docs/superpowers/plans/2026-07-10-report-chain.md
Branch: feat/phase-3-report-chain

Voer uit: Task 5 en Task 6.
- Task 5: PDF uit report-model (@react-pdf/renderer, dynamic import)
- Task 6: B2B payload parity met report-model

Stop na Task 6.
```

---

### Sessie 3.4 — Task 7
**Model: Sol**

```
[plak gedeelde prefix]

Plan: docs/superpowers/plans/2026-07-10-report-chain.md
Branch: feat/phase-3-report-chain

Voer uit: Task 7 — volledige report chain verify tests.

Stop na Task 7. Fase 3 klaar voor review.
```

**Jij na fase 3:**
```bash
npm run test:unit && npm run build
npx playwright test tests/e2e/leadid-hydrate.spec.ts tests/e2e/step6-validatie.spec.ts --project=chromium
```
→ PR → merge.

---

## FASE 4a — Route rollout (minimaal; 4b later)

**Plan:** `docs/superpowers/plans/2026-07-10-route-rollout-stabilization.md`  
**Branch:** `feat/phase-4-route-rollout`  
**SKIP:** Tasks 6, 7, 8, 9 (a11y, visual, perf, release doc) — fase 4b later.

### Sessie 4.1 — Tasks 1–2
**Model: Sol Max**

```
[plak gedeelde prefix]

Plan: docs/superpowers/plans/2026-07-10-route-rollout-stabilization.md
Branch: feat/phase-4-route-rollout

Voer uit: Task 1 en Task 2.
- Task 1: route-family invariant tests
- Task 2: components/pseo/* primitives (PseoPageShell, breadcrumbs, hero, conversion card)

SKIP Tasks 6–9 in dit project (uitgesteld naar fase 4b).

Stop na Task 2.
```

---

### Sessie 4.2 — Tasks 3–4
**Model: Sol Max**

```
[plak gedeelde prefix]

Plan: docs/superpowers/plans/2026-07-10-route-rollout-stabilization.md
Branch: feat/phase-4-route-rollout

Voer uit: Task 3 en Task 4.
- Task 3: provincie + stad hubs
- Task 4: wijk, straat, postcode routes

Behoud JSON-LD, canonical URLs, breadcrumbs. Geen route-URL wijzigingen.

Stop na Task 4.
```

---

### Sessie 4.3 — Task 5
**Model: Sol**

```
[plak gedeelde prefix]

Plan: docs/superpowers/plans/2026-07-10-route-rollout-stabilization.md
Branch: feat/phase-4-route-rollout

Voer uit: Task 5.
- content/privacy/error shells
- CheckPageClient extract uit app/check/page.tsx

SKIP Tasks 6–9.

Stop na Task 5. Fase 4a klaar voor review.
```

**Jij na fase 4a:**
```bash
npm run build && npm run test:e2e:core
npx playwright test tests/e2e/wijk-validatie.spec.ts --project=chromium
```
→ PR → merge.

---

## FASE 4b — Later (onderhoud)

**Model: Sol Max** voor Task 6–7 setup; **Terra** voor snapshot tweaks.

| Task | Inhoud | Model |
|------|--------|-------|
| 6 | axe WCAG gate | Sol Max |
| 7 | visual regression baselines | Sol Max |
| 8 | performance budgets | Sol |
| 9 | analytics + docs + release gate | Sol |

Prompt 4b (wanneer je eraan toe bent):

```
[plak gedeelde prefix]

Plan: docs/superpowers/plans/2026-07-10-route-rollout-stabilization.md
Branch: feat/phase-4b-stabilization

Voer uit: Tasks 6, 7, 8, 9 (volledige stabilisatie).

Stop na Task 9.
```
**Model: Sol Max** voor Tasks 6–7; **Sol** voor 8–9.

---

## Productie rooktest (na elke merge)

**Model: geen** — jij handmatig:

- [ ] Homepage + countdown
- [ ] `/check?adres=...` auto-zoek
- [ ] Lead submit → `emailStatus` in response
- [ ] `/check?leadId=...&token=...` rapport + PDF
- [ ] 1 wijk-URL 200 + JSON-LD
- [ ] Geen horizontale scroll 390px

---

## Snelle model-tabel

| Sessie | Model |
|--------|-------|
| 1.1, 1.2, 1.3 | **Sol** |
| 2.1, 2.2, 2.3 | **Sol Max** |
| 2.4 | **Sol** |
| 2.x fixes | **Terra** |
| 3.1, 3.2, 3.3 | **Sol Max** |
| 3.4 | **Sol** |
| 4.1, 4.2 | **Sol Max** |
| 4.3 | **Sol** |
| 4b | **Sol Max** + **Sol** |
