# Brand Unification + Funnel CRO Implementation Plan (Fase 5)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eén samenhangend Customer-first Hybrid merk over website, funnel, wijk/straat-routes, PDF, e-mail en OpenGraph — plus funnel-CRO rond vier klantstadia.

**Architecture:** Evergreen/trust dominant; action alleen voor primaire CTA’s en waarschuwingen; danger alleen semantisch. Interne `FunnelState.step` 1–6 blijft; zichtbare UX = vier stadia. Server-trust, NormalizedReport, tokenbeveiliging en pSEO-invarianten ongewijzigd.

**Tech Stack:** Next.js 16.2, React 19, Tailwind v4, `@react-pdf/renderer`, Resend HTML, Playwright visual + analytics contract.

**Depends on:** Fases 0–4b live op `master` (PR #7, jul 2026).

**Handoff:** `docs/superpowers/HANDOFF-2026-07-14-phase-5-brand-funnel-cro.md`

---

## Waarom fase 5

Alleen blauwe gloed verwijderen is onvoldoende. Funnel, wijk/straat, PDF en marketing-assets gebruiken nog verschillende visuele systemen.

### Huidige oorzaken

- `/check` heeft evergreen buitenkant; funnelkaarten zijn nog slate/navy met amber glow.
- Alle zes funnelstappen hebben eigen hardcoded kleuren en knopstijlen.
- Wijkheader = nieuw groen pSEO-systeem; rest wijkpagina nog `#020617`, `#0f172a`, slate-cards.
- Straatpagina: zelfde probleem.
- PDF: deels juiste kleuren, maar amber tekstlogo i.p.v. groene BrandMark-lockup.
- E-mail en OpenGraph: aparte hardcoded stijlen.
- Funnel toont zes stappen; analytics/UX-model kent al vier klantstadia.

---

## Uitvoering in vier delen (aanbevolen)

| Deel | Tasks | Branch | Geschatte tokens |
|------|-------|--------|------------------|
| **5a** Merk + PDF/e-mail/OG | 1, 2, 9 (deel) | `feat/phase-5a-brand-pdf` | 250k–500k |
| **5b** Funnel CRO | 3, 4, 5, 6, 7 | `feat/phase-5b-funnel-cro` | 500k–900k |
| **5c** Wijk/straat | 8, 9 (rest) | `feat/phase-5c-pseo-wijk-straat` | 350k–650k |
| **5d** Analytics + release | 10 + visual regression | `feat/phase-5d-analytics-release` | 200k–400k |

**Niet in één sessie.** Wacht op quota-reset (~11% resterend jul 2026 week volstaat alleen voor Task 1 + plan).

---

## File map

Create:

- `lib/brand-colors.ts` — gedeelde hex/tokens voor CSS-less renderers (PDF, e-mail, OG).
- `components/design-system/BrandLockup.tsx` — vaste BrandMark + woordmerk.
- `components/funnel/ui/FunnelStageShell.tsx`
- `components/funnel/ui/FunnelCard.tsx`
- `components/funnel/ui/FunnelField.tsx`
- `components/funnel/ui/FunnelChoiceCard.tsx`
- `components/funnel/ui/FunnelNotice.tsx`
- `components/funnel/ui/FunnelActions.tsx`
- `components/funnel/ui/FunnelTrustLine.tsx`
- `components/funnel/ui/PdfBrandMark.tsx` (of onder `components/report/`)
- `components/funnel/TechnicalCheckCard.tsx` (optioneel, Task 6)
- Uitbreiding visual regression snapshots (funnel 4 stadia, wijk, straat, PDF eerste pagina)

Modify:

- `app/globals.css`
- `components/design-system/BrandMark.tsx`
- `components/funnel/SaldeerRapportPDF.tsx`
- `components/report/ReportShell.tsx`
- `components/funnel/PDFDownloadButton.tsx` / `PDFDownloadButtonInner.tsx`
- `lib/report-email.ts`
- `components/funnel/FunnelProgress.tsx`
- `components/funnel/FunnelContainer.tsx`
- `components/funnel/Step1Adres.tsx` … `Step6LeadCapture.tsx`
- `components/funnel/PhotoUpload.tsx`
- `app/[provincie]/[stad]/[wijk]/page.tsx`
- `app/[provincie]/[stad]/[wijk]/[straat]/page.tsx`
- `components/pseo/WijkSaldeerChart.tsx`, `WijkComparisonTable.tsx`, `RenovatieInsightCard.tsx`, `RelatedWijken.tsx`
- `components/CountdownTimer.tsx`
- `app/opengraph-image.tsx`, wijk OG, `app/api/og/route.tsx`
- `lib/analytics.ts`
- `tests/e2e/analytics-contract.spec.ts`, `visual-regression.spec.ts`
- `CLAUDE.md` (bij stack/merk-wijzigingen)

---

## Niet wijzigen

- `roiInput` blijft serverleidend; client `roiResult` / `healthScore` display-only.
- `NormalizedReport` blijft bron voor web/e-mail/PDF/B2B.
- Tokenbeveiliging en `leadId`-zonder-token-loopfix intact.
- Geen runtime viewport-hook.
- Geen pSEO-slug-, metadata- of JSON-LD-wijzigingen.
- Geen juridische copy zonder aparte toestemming.
- Telefoon optioneel maken = **aparte commerciële beslissing** (B2B-leadkwaliteit); niet stilzwijgend in visuele redesign.

---

### Task 1 — Eén bindend merkcontract

**Bestanden:** `app/globals.css`, `lib/brand-colors.ts`, `BrandMark.tsx`, nieuwe `BrandLockup`

- [ ] Browserkleuren uit `globals.css` als visuele waarheid: evergreen-950/900, trust/trust-dark, action/action-hover, mist/paper, ink/ink-muted, success/warning/danger.
- [ ] Gedeelde constanten + logo-geometrie voor PDF, e-mail, OG.
- [ ] BrandMark + woordmerk als vaste lockup.
- [ ] Hardcoded `#020617`, `#0f172a`, oude amber, losse `#00aa65` uit nieuwe scope verwijderen.
- [ ] Contrastregels: paper→ink; evergreen→wit; trust focus/bevestiging; action alleen primaire actie; warning/danger semantisch.

**Acceptatie:**

- [ ] Website, PDF, e-mail, OG gebruiken dezelfde merkwaarden.
- [ ] Geen nieuwe lokale kleurconstanten in featurecomponenten.

---

### Task 2 — PDF-, rapport- en e-mailbranding gelijkmaken

**Bestanden:** `SaldeerRapportPDF.tsx`, `ReportShell.tsx`, PDF-knoppen, `lib/report-email.ts`, rapporttests

- [ ] `PdfBrandMark` metzelfde hexagon-geometrie als website.
- [ ] PDF-header = SiteHeader: evergreen, groene BrandMark, wit woordmerk, `.nl` trust-green.
- [ ] Webrapport + e-mailheader visueel gelijk.
- [ ] PDF-knop → gedeelde primaire actiestijl.
- [ ] Rapportkaarten/waarschuwingen/succes op semantic tokens.
- [ ] Geen rapportberekeningen wijzigen.

**Acceptatie:**

- [ ] PDF pagina 1 herkenbaar alszelfde website.
- [ ] Web/e-mail/PDF:zelfde rapportwaarden.
- [ ] PDF/e-mail/report-model unit tests groen.
- [ ] `@react-pdf/renderer` dynamisch geïsoleerd.

---

### Task 3 — Gedeelde funnel-primitives

**Nieuwe map:** `components/funnel/ui/`

- [ ] `FunnelStageShell`, `FunnelCard`, `FunnelField`, `FunnelChoiceCard`, `FunnelNotice`, `FunnelActions`, `FunnelTrustLine`.
- [ ] Vervang `amberBtnCls`, slate-kaarten, `amber-glow`.

**Visueel contract:**

- Paginaframe: evergreen.
- Actieve kaart: paper/mist + ink.
- Inputs: wit/paper, duidelijke labels.
- Focus: trust-green ring.
- Primaire CTA: action.
- Secundair: rustige border/tekstknop.
- Geselecteerde keuze: trust-tint, geen amber glow.
- Technische details: compacte disclosure.

---

### Task 4 — Zichtbaar vier klantstadia

Interne step 1–6 blijft. Zichtbare UX:

1. **Uw woning** — adres, BAG, netstatus.
2. **Uw situatie** — panelen, verbruik, besparingsindicatie.
3. **Verfijn uw advies** — meterkast/plaatsing/omvormer als optionele subchecks.
4. **Ontvang uw rapport** — samenvatting, contact, toestemming, serverrapport.

- [ ] `FunnelProgress` herbouwen (geen zes cirkels).
- [ ] Mobiel: compacte voortgang; desktop: voortgang + korte uitleg.
- [ ] Stappen 3–5 = subchecks binnen stadium 3.
- [ ] Analyticsmapping: `1→1`, `2→2`, `3–5→3`, `6→4` behouden.

---

### Task 5 — Stadium 1 en 2 vereenvoudigen

**Stadium 1 — Uw woning**

- [ ] Adresprefill naadloos van homepage.
- [ ] BAG als woningbevestiging; kerngegevens boven de vouw.
- [ ] Consumententaal i.p.v. technische scanlabels.
- [ ] CTA: “Bereken mijn 2027-impact”.

**Stadium 2 — Uw situatie**

- [ ] Eerst vragen die berekening beïnvloeden.
- [ ] Geavanceerde sliders onder “Berekening aanpassen”.
- [ ] Rustige besparingspreview.
- [ ] Geen dubbele panelenvraag later.
- [ ] CTA: “Verfijn mijn advies”.

---

### Task 6 — Technische checks als één optioneel stadium

**Bestanden:** Step3–5, `PhotoUpload`, optioneel `TechnicalCheckCard`

- [ ] Drie scans als checklist/cards.
- [ ] Per item: waarom, upload, handmatig, overslaan.
- [ ] Expliciet optioneel communiceren.
- [ ] Eén actie: “Doorgaan naar mijn rapport”.
- [ ] Afgerond = trust-groene status.
- [ ] Menselijke upload/screening-fouten.

---

### Task 7 — Leadcapture voor vertrouwen en conversie

**Bestand:** `Step6LeadCapture.tsx`

- [ ] Bovenaan: wat rapport bevat + berekende waarde.
- [ ] Formuliervolgorde: naam, e-mail, telefoon, toestemming.
- [ ] “Waarom vragen we dit?”-microcopy.
- [ ] Validatie naast veld.
- [ ] Eerder beantwoorde vragen als samenvatting + “Wijzigen”.
- [ ] Één dominante submit; loading/failure/success in paper-card.
- [ ] Geen “verzonden”-claim zonder `report_email_status`.

---

### Task 8 — Wijk- en straatpagina’s volledig migreren

- [ ] Verwijder hardcoded `N1`, `N2`, glassmorphism, slate-cards.
- [ ] Match gemeente/hub: evergreen hero, paper/mist secties, groene analysekaarten.
- [ ] Countdown compact of urgentiecopy.
- [ ] Wijkgrafiek op trust/action/status tokens.
- [ ] Quick Facts → `PseoMetricGrid`-achtig.
- [ ] Metadata, JSON-LD, ISR, slugs, FAQ-filtering, interne links byte-semantisch behouden.

---

### Task 9 — Overige merkoppervlakken

- [ ] `opengraph-image.tsx`, wijk OG, `api/og/route.tsx`
- [ ] `CountdownTimer`, `AnalysisLoading`, resume-banner, shock/warning-banner
- [ ] favicon/apple-icon, error/loading states
- [ ] Geen oude navy/blauwe campagne-uitstraling buiten semantische statuskleuren.

---

### Task 10 — Conversiemeting

Uitbreiding privacyveilige analytics:

- [ ] stadium viewed/completed
- [ ] tijd per stadium
- [ ] validatiefailure-type
- [ ] technische check completed/skipped
- [ ] lead submit started/succeeded/failed
- [ ] PDF open succeeded/failed

Geen adres, naam, e-mail, telefoon, lead-ID of token.

**Succesmetrics (vóór/na vergelijken):**

- meer 1→2 voltooiing
- minder uitval technische checks
- hogere stadium-4-submitratio
- minder validatiefouten
- kortere mediane doorlooptijd
- gelijkblijvende/betere leadkwaliteit

---

## Verificatie en release-gate

```bash
npm run typecheck
npm run test:unit
npm run build
npm run test:a11y
npm run test:performance
npm run test:e2e:core
npx playwright test tests/e2e/funnel-four-stages.spec.ts --project=chromium
npx playwright test tests/e2e/funnel-deep.spec.ts --project=chromium
npx playwright test tests/e2e/funnel-handshake.spec.ts --project=chromium
npx playwright test tests/e2e/leadid-hydrate.spec.ts --project=chromium
npx playwright test tests/e2e/report-responsive.spec.ts --project=mobile-chrome
npx playwright test tests/e2e/route-shells.spec.ts --project=chromium
npx playwright test tests/e2e/analytics-contract.spec.ts --project=chromium
npx playwright test tests/e2e/visual-regression.spec.ts --project=chromium
```

Visual regression uitbreiden:

- alle vier funnelstadia @ 390px en 1440px
- wijk- en straatpagina
- webrapport
- PDF eerste pagina
- error/loading/resume

Acceptatiebreedtes: 360, 390, 768, 1024, 1440 px.

---

## Final acceptance

Fase 5 is compleet wanneer:

- [ ] Evergreen/trust dominant op funnel, wijk, straat, PDF, e-mail, OG.
- [ ] Geen hardcoded legacy navy/amber buiten semantische rollen.
- [ ] Vier klantstadia zichtbaar; interne step 1–6 + analyticsmapping intact.
- [ ] Server-trust + NormalizedReport + token-gedrag ongewijzigd.
- [ ] pSEO metadata/JSON-LD/ISR/slugs ongewijzigd.
- [ ] Performance-budgets `/` ≤300 KB, `/check` ≤450 KB behouden.
- [ ] Analytics-contract + PII-denylist groen.
- [ ] Alle release-gates groen.
- [ ] `CLAUDE.md` actueel.
