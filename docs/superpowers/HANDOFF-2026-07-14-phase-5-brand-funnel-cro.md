# HANDOFF — Fase 5: Brand Unification + Funnel CRO

**Datum:** 14 juli 2026  
**Status:** Gepland, niet gestart. Fases 0–4b **LIVE** op `master`.  
**Vorige chat:** [Customer-first UI overhaul](827f96be-974a-4a0c-9d2a-8e76dc979a14) (Cursor agent transcript)

---

## 1. Lees dit eerst (30 seconden)

De **customer-first UI overhaul (fases 0–4b)** is af en gemerged (PR #7, 14 jul 2026).

**Fase 5** is de **volgende** grote stap: één merk over website + funnel + wijk/straat + PDF/e-mail/OG, plus funnel-CRO rond **vier klantstadia**.

**Plan:** `docs/superpowers/plans/2026-07-14-brand-unification-funnel-cro.md`  
**Codex prompts:** `docs/superpowers/CODEX-PROMPTS.md` → sectie FASE 5  
**Design spec (basis):** `docs/superpowers/specs/2026-07-10-customer-first-ui-overhaul-design.md`

**Start niet met 11% quota resterend** — volledige fase kost ~1,3M–2,5M tokens geschat. Maximaal Task 1 deze week.

**Startprompt nieuwe sessie:**
```
Lees docs/superpowers/HANDOFF-2026-07-14-phase-5-brand-funnel-cro.md en
voer fase 5a uit volgens docs/superpowers/plans/2026-07-14-brand-unification-funnel-cro.md
(superpowers:executing-plans). Branch: feat/phase-5a-brand-pdf
```

---

## 2. Waarom fase 5

Homepage en gemeente/hub-pagina’s gebruiken Customer-first Hybrid (evergreen/trust). De funnel, wijk/straat-body, PDF, e-mail en OG gebruiken nog **verschillende** visuele systemen (slate/navy, amber glow, hardcoded hex).

**Doel:** evergreen/trust dominant; action alleen primaire CTA + waarschuwingen; danger alleen negatieve status. Funnel visueel en UX-matig alignen met vier klantstadia (analytics kent die mapping al).

**Niet-doel:** server-trust wijzigen, pSEO SEO-invarianten breken, telefoon optioneel maken zonder commerciële beslissing.

---

## 3. Productiestatus (jul 2026)

| Item | Status |
|------|--------|
| PR #7 (4b stabilisatie) | **MERGED** → `master` |
| Supabase `20260710143000_webhook_retry_payload.sql` | live |
| Supabase `20260713194917_report_email_delivery.sql` | live (bevestigd door MAX) |
| Release gates 4b | typecheck, unit, a11y, visual, perf, analytics, chromium 250/250 (+1 seed-skip) |
| Prod-smoke 4b | **MAX** — na merge uitvoeren indien nog niet gedaan |

---

## 4. Fase-overzicht (0–5)

| Fase | Naam | Status | PR | Plan |
|------|------|--------|-----|------|
| 0 | Veilige fundering | LIVE | #1 | `2026-07-10-safe-foundation.md` |
| 1 | Design system + entry | LIVE | #2 | `2026-07-10-design-system-conversion-entry.md` |
| 2 | Funnel + analytics | LIVE | #3 | `2026-07-10-funnel-analytics.md` |
| 3 | Rapportketen | LIVE | #4 | `2026-07-10-report-chain.md` |
| 4a | Route-uitrol | LIVE | #5 | `2026-07-10-route-rollout-stabilization.md` |
| 4b | Stabilisatie | LIVE | #7 | idem (Tasks 6–9) |
| **5a** | Merk + PDF/e-mail/OG | **Gepland** | — | `2026-07-14-brand-unification-funnel-cro.md` (Tasks 1, 2, 9 deel) |
| **5b** | Funnel CRO | **Gepland** | — | idem (Tasks 3–7) |
| **5c** | Wijk/straat | **Gepland** | — | idem (Task 8, 9 rest) |
| **5d** | Analytics + release | **Gepland** | — | idem (Task 10 + gates) |

```
Fase 0–4b (LIVE) ──► 5a ──► 5b ──► 5c ──► 5d
```

---

## 5. Token- en sessie-advies (jul 2026)

| Situatie | Advies |
|----------|--------|
| ~11% quota resterend | Alleen plan + optioneel Task 1; **geen** volledige fase 5 |
| Na quota-reset | 5a → PR → merge → 5b → … (4 PR’s) |
| Model | **Sol Max** voor 5b (funnel); **Sol** voor 5a verify / 5d |
| Fixes | **Terra** |

**Tokenschatting fase 5 totaal:** ~1,3M–2,5M (vergelijkbaar met ~40–60% van fases 1–4 samen).

---

## 6. Bindende invarianten (niet breken)

- `roiInput` serverleidend; client ROI/score display-only.
- `NormalizedReport` voor web/e-mail/PDF/B2B.
- HMAC `?leadId=&token=`; geen fetch-loop zonder token.
- Geen runtime viewport-hook in rapport.
- pSEO: metadata, canonical, JSON-LD, ISR, slugs, FAQ-filtering ongewijzigd.
- Performance: `/` ≤300 KB, `/check` ≤450 KB JS transfer.
- Analytics: PII-denylist; geen adres/contact/token/leadId in events.
- `@react-pdf/renderer` dynamisch geïsoleerd.

---

## 7. Bekende visuele schuld (startpunt fase 5)

- `/check` buitenkant evergreen; funnelkaarten slate/navy + amber glow.
- Step1–6: eigen hardcoded kleuren/knoppen.
- Wijk: header groen; body nog `#020617` / slate-cards.
- Straat: zelfde.
- PDF: amber tekstlogo i.p.v. BrandMark-lockup.
- E-mail/OG: aparte hardcoded stijlen.
- UI toont 6 stappen; UX-model = 4 stadia.

---

## 8. Uitvoering per deel

### 5a — Merk + PDF/e-mail/OG (Tasks 1, 2, 9 deel)

Branch: `feat/phase-5a-brand-pdf`

- Task 1: `lib/brand-colors.ts`, `BrandLockup`, globals cleanup
- Task 2: PDF/e-mail/webrapport branding
- Task 9 (deel): OG + favicon check

Verify: unit PDF/e-mail tests, `npm run build`, visuele PDF spot-check.

### 5b — Funnel CRO (Tasks 3–7)

Branch: `feat/phase-5b-funnel-cro`

- Primitives under `components/funnel/ui/`
- Vier stadia UX; Step1–6 refactor
- **Hoog risico** — uitgebreide funnel E2E

Verify: `funnel-four-stages`, `funnel-deep`, `step6-validatie`, `funnel-handshake`.

### 5c — Wijk/straat (Tasks 8, 9 rest)

Branch: `feat/phase-5c-pseo-wijk-straat`

- Wijk/straat pages + charts/tables
- `route-shells.spec.ts` + wijk-validatie groen

### 5d — Analytics + release (Task 10)

Branch: `feat/phase-5d-analytics-release`

- Analytics uitbreiding + contract tests
- Visual regression uitbreiden
- Volledige release gate

---

## 9. Open beslissingen (MAX)

| Onderwerp | Notitie |
|-----------|---------|
| Telefoon optioneel | **Niet** in visuele redesign beslissen — B2B-impact |
| CountdownTimer wijk | Compact herontwerp vs. statische urgentiecopy |
| Prod-smoke 4b | Checklist §10 indien nog niet gedaan |

---

## 10. Productie rooktest (na elke fase-5 PR)

- [ ] Homepage + wijkroute — evergreen, geen legacy navy
- [ ] `/check` — vier stadia zichtbaar, geen amber glow op kaarten
- [ ] Lead submit → `report_email_status` correct
- [ ] PDF eerste pagina = website BrandLockup
- [ ] OG-preview in Slack/LinkedIn spot-check
- [ ] 390px / 1440px — geen horizontale scroll
- [ ] Performance budgets nog groen

---

## 11. Documentindex

| Bestand | Doel |
|---------|------|
| `HANDOFF-2026-07-10-customer-first-ui-overhaul.md` | Overhaul 0–4b (historisch) |
| **Dit bestand** | Fase 5 hervatten |
| `plans/2026-07-14-brand-unification-funnel-cro.md` | Volledig taskplan |
| `CODEX-PROMPTS.md` | Copy-paste prompts per sessie |
| `specs/2026-07-10-customer-first-ui-overhaul-design.md` | Oorspronkelijke design intent |

---

## 12. Changelog

| Versie | Datum | Wijziging |
|--------|-------|-----------|
| 1.0 | 2026-07-14 | Fase 5 plan + handoff na merge PR #7; token-advies 11% quota |

---

*Einde handoff. Bij hervatten: open dit bestand + plan + CODEX-PROMPTS FASE 5.*
