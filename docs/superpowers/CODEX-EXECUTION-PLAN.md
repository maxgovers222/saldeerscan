# Codex Execution Plan — Customer-first UI Overhaul (fases 1–4)

**Datum:** 13 juli 2026  
**Context:** Cursor Pro API-pool leeg tot ~8 augustus. Bouwen via **Codex**; Cursor alleen IDE + Auto.  
**Promo (tijdelijk):** 5u Codex-limiet weg (12 jul 2026) — weeklimiet blijft. Check `/status` vóór elke sessie.  
**Kwaliteitsregel:** **Sol** voor implementatie; **nooit** alles in één prompt; merge tussen fases.

**Lees eerst:** `HANDOFF-2026-07-10-customer-first-ui-overhaul.md`

---

## 1. Modelkeuze (geen kwaliteitsverlies)

| Model | Wanneer | Niet gebruiken voor |
|-------|---------|---------------------|
| **GPT 5.6 Sol** | Nieuwe code, multi-file refactors, fase-implementatie, architectuurkeuzes | Triviale renames, copy tweaks |
| **GPT 5.6 Sol + Max** (lange context) | Fase 2 (`FunnelContainer` extract), fase 3 (report chain), grote diffs | Kleine fixes; verbruikt sneller |
| **GPT 5.6 Terra** | TypeScript errors, 1-bestand fixes, test assertions, lint na merge | Hele fase opnieuw |
| **GPT 5.6 Luna** | Copy, comments, regex, package.json scripts | Funnel/report/pSEO implementatie |

**Vuistregel:** ~**85% Sol**, ~**12% Terra**, ~**3% Luna**.  
**Nooit Luna/Terra** voor een hele fase — meer retries = slechter én duurder.

**Cursor (parallel):** alleen **Auto** — geen API-modellen tot 8 aug.

---

## 2. Wat je níet doet (kwaliteit + tokens)

- Eén prompt: “implementeer fase 1 t/m 4”
- Sol opnieuw voor hele fase als 1 test faalt → **Terra**, 1 specifieke fix
- Merge zonder `typecheck` + `test:unit` + `build`
- Fase 4 volledig (a11y + visual + perf) in dezelfde week als 1–3 — **4b uitstellen**
- `roiInput` / server-trust breken (fase 0)
- Nieuwe docs schrijven tenzij plan het vraagt

---

## 3. Weekplan (promo-venster)

| Dag | Fase | Branch | Sol Max? | Jij na sessie |
|-----|------|--------|----------|---------------|
| **Ma** | 1 Design system | `feat/phase-1-design-system` | Optioneel | merge + visueel homepage |
| **Di** | 2 Funnel | `feat/phase-2-funnel-analytics` | **Ja** | `funnel-deep` subset + merge |
| **Wo** | 3 Rapportketen | `feat/phase-3-report-chain` | **Ja** | report E2E + merge |
| **Do** | 4a Route shells | `feat/phase-4-route-rollout` | Ja | build + core E2E + merge |
| **Vr** | Buffer / 4b minimaal | zelfde of nieuw | Terra | productie rooktest |

**4b later (onderhoud):** axe, visual regression, performance budgets — Terra + handmatig.

---

## 4. Vóór elke Codex-sessie (5 min)

```bash
cd C:\Projects\saldeerscan
git checkout master && git pull
git checkout -b feat/phase-N-...   # of verder op bestaande branch
npm run typecheck                  # baseline groen
```

**Codex CLI:** `/status` — noteer **weekly %**.

| Weekly | Actie |
|--------|-------|
| >60% | Sol (+ Max bij fase 2/3/4) |
| 30–60% | Sol, kortere sessie (minder tasks) |
| <30% | Stop Sol; Terra fixes only; morgen verder |

---

## 5. Startprompts (copy-paste per fase)

### Algemene prefix (elke sessie)

```
Project: Saldeerscan.nl (Next.js 16, React 19, Tailwind v4).
Werkmap: repo root.

Lees eerst:
1. docs/superpowers/HANDOFF-2026-07-10-customer-first-ui-overhaul.md (sectie server-trust + huidige fase)
2. Het implementatieplan voor deze fase (onder)

Regels:
- Voer ALLEEN de genoemde plan-tasks uit deze sessie uit (task-nummers in plan).
- Task voor task; stop aan het einde van die tasks — geen volgende fase.
- Behoud server-trust fase 0: roiInput in funnel + POST /api/leads; client roiResult is display-only.
- Geen commit tenzij ik expliciet vraag.
- Geen nieuwe markdown/docs tenzij plan het voorschrijft.
- Match bestaande code-stijl; minimale diff.
- Na code: noem welke tests ik moet draaien.
```

### Maandag — Fase 1

```
[prefix hierboven]

Plan: docs/superpowers/plans/2026-07-10-design-system-conversion-entry.md
Branch: feat/phase-1-design-system
Deze sessie: Tasks 1 t/m 6 (of tot eerste natuurlijke breakpoint in plan).
Model: GPT 5.6 Sol

Doel: design tokens + basis components (design-system/*) + conversion-context helper.
```

**Sessie 2 (zelfde dag indien weekly ok):** Tasks 7–12 — homepage server-split + entry components.

**Sessie 3:** rest fase 1 + afronden.

**Jij na fase 1:**
```bash
npm run typecheck && npm run test:unit && npm run build && npm run test:e2e:core
```
Visueel: homepage 390px + 1440px → PR → merge.

---

### Dinsdag — Fase 2

```
[prefix]

Plan: docs/superpowers/plans/2026-07-10-funnel-analytics.md
Branch: feat/phase-2-funnel-analytics
Deze sessie: Tasks 1–4 (funnel-state extract + unit tests).
Model: GPT 5.6 Sol — Max Mode AAN (grote refactor).
```

**Sessie 2:** Tasks 5–8 — storage, precedence, analytics types.  
**Sessie 3:** Tasks 9+ — 4-staps UI, TechnicalScanModule, lazy imports.  
**Sessie 4 (Terra ok):** gefaalde E2E fixes.

**Jij na fase 2:**
```bash
npm run test:unit
npx playwright test tests/e2e/funnel-deep.spec.ts --project=chromium
npm run test:e2e:core
```
Let op: `?leadId=` zonder `&token=` loop in FunnelContainer niet breken.

---

### Woensdag — Fase 3

```
[prefix]

Plan: docs/superpowers/plans/2026-07-10-report-chain.md
Branch: feat/phase-3-report-chain
Deze sessie: lib/report-model.ts + unit tests (plan tasks rond report-model).
Model: GPT 5.6 Sol — Max Mode AAN.
```

**Sessie 2:** email + web components (`components/report/*`).  
**Sessie 3:** PDF + leads route integratie + SubmissionStatus.

**Jij na fase 3:**
```bash
npm run test:unit
npx playwright test tests/e2e/leadid-hydrate.spec.ts tests/e2e/step6-validatie.spec.ts --project=chromium
```
Check: email failure claimt geen “verzonden”; PDF opent in nieuw tabblad.

---

### Donderdag — Fase 4a (minimaal, kwaliteit behouden)

```
[prefix]

Plan: docs/superpowers/plans/2026-07-10-route-rollout-stabilization.md
Branch: feat/phase-4-route-rollout
Deze sessie: pSEO primitives (PseoPageShell, breadcrumbs, conversion card) + 1 route family (provincie/stad).
STOP vóór axe/visual/performance tasks.
Model: GPT 5.6 Sol — Max Mode.
```

**Sessie 2:** wijk/straat/postcode + CheckPageClient extract.

**4b NIET deze week:** `@axe-core/playwright`, visual snapshots, `test:performance` — plan tasks expliciet overslaan tot later.

**Jij na fase 4a:**
```bash
npm run build && npm run test:e2e:core
npx playwright test tests/e2e/wijk-validatie.spec.ts --project=chromium
```

---

### Vrijdag — Buffer

| Weekly | Actie |
|--------|-------|
| Nog ruimte | 4b deels (1–2 axe tests) op **Terra** |
| Krap | Alleen Terra fixes, rooktest productie |
| Leeg | Rooktest alleen; 4b volgende week |

**Productie rooktest:**
- `/check` lead submit → `emailStatus`
- `/check?leadId=&token=` rapport
- 1 wijk-URL + homepage
- Geen horizontale scroll 390px

---

## 6. Fix-loop (test faalt)

```
1. Kopieer exacte fout + bestand + regel
2. Codex Terra (NIET Sol):

   Fix alleen deze testfout. Geen refactor.
   Fout: [plak output]
   Bestand: [path]
   Server-trust fase 0 mag niet breken.

3. Opnieuw draaien alleen die test
4. Na 2 mislukte Terra-pogingen → gerichte Sol-sessie (1 bestand)
```

---

## 7. Merge-protocol (elke fase)

```bash
npm run typecheck
npm run test:unit
npm run build
npm run test:e2e:core
git add -p                    # geen .env, geen .next
git commit -m "feat(phase-N): <korte beschrijving>"
git push -u origin HEAD
gh pr create --base master --title "feat(phase-N): ..." --body "..."
# CI groen → merge
```

Update na merge: `HANDOFF` changelog + `CLAUDE.md` voortgangstabel (status LIVE).

---

## 8. Codex vs Cursor rolverdeling

| Taak | Tool |
|------|------|
| Implementatie fases 1–4 | **Codex Sol** |
| IDE, diff review, handmatig edit | **Cursor** |
| “Wat doet dit bestand?” | Cursor **Auto** |
| Playwright lokaal | **Jij** (terminal in Cursor) |
| Visueel responsive check | **Jij** (browser) |
| PR / merge | **Jij** |

---

## 9. Kwaliteitsankers (niet onderhandelbaar)

Uit fase 0 + design spec — Codex mag dit **niet** breken:

1. `roiInput` → server `berekenROI()` op lead submit
2. `gdpr_consent` gate voor B2B webhooks
3. Webhook retry gebruikt `payload_body` uit DB
4. Vision max 3 MiB (`lib/vision-input.ts`)
5. Geen fake SLA/social proof copy
6. Amber urgentie, geen rode banners (behalve netcongestie ROOD)
7. `playwright.config` baseURL = `http://localhost:3000`

---

## 10. Als weeklimiet halverwege op is

| Prioriteit | Fase | Reden |
|------------|------|-------|
| 1 | 2 Funnel | Meeste conversiewinst |
| 2 | 1 Design system | Entry + tokens |
| 3 | 3 Rapport | Trust na submit |
| 4 | 4a pSEO shells | Kan later |

Merge wat af is; ga **niet** door op Sol met <20% weekly.

---

## 11. Kosten (verwacht)

| Item | Bedrag |
|------|--------|
| Cursor Pro (al betaald) | $20/mo — Auto only |
| Codex Plus | $20/mo |
| Overage | $0 als weekly gerespecteerd |
| **Totaal extra** | **$20/mo** |

---

## 12. Snelle referentie

```
/status                          → weekly check
Sol + Max                        → fase 2, 3, 4a implementatie
Sol zonder Max                   → fase 1, kleine Sol-fixes
Terra                            → test failures, 1-file fixes
Luna                             → copy only
1 fase / dag max                 → kwaliteit
4b uitstellen                    → week haalbaar
HANDOFF + plan per sessie        → context
```

---

*Promo 5u-cap kan terugkomen — dit plan blijft geldig: korte sessies per task-blok, weeklimiet is leidend.*
