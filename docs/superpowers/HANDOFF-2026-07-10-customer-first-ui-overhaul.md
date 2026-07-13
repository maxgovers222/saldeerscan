# HANDOFF — Customer-first UI Overhaul (Saldeerscan.nl)

**Datum handoff:** 10 juli 2026  
**Status:** Fase 0 live op productie. Fases 1–4 gepland, niet gestart.  
**Hervatten vanaf:** ~8 augustus 2026 (Cursor API-quota reset)  
**Vorige chat:** [Customer-first UI fase 0](827f96be-974a-4a0c-9d2a-8e76dc979a14) (Cursor agent transcript)

---

## 1. Lees dit eerst (30 seconden)

Dit project is een **conversion-first UI-overhaul** van Saldeerscan.nl: meer vertrouwen, lagere drempel naar `/check`, minder funnel-uitval, synchrone rapport/PDF/email/B2B-keten. **Niet** primair SEO/indexatie (GSC is al op orde).

**Wat is af:**
- Ontwerp-spec + 5 gedetailleerde implementatieplannen (~6.400 regels)
- **Fase 0** (server-trust, webhooks, vision-limiet, CI) — gemerged naar `master`, PR #1, productie-deploy, Supabase-migratie uitgevoerd door gebruiker

**Wat moet nog:**
- Fase 1 → 4, **één fase per sessie**, model **GPT 5.6 Sol** (Max Mode alleen waar nodig)
- **Niet** op Auto/Cursor Composer voor de zware UI-werkzaamheden

**Codex (nu, Cursor API leeg):** volg `docs/superpowers/CODEX-EXECUTION-PLAN.md` — weekplan, modellen, prompts per fase.

**Startprompt voor nieuwe sessie (augustus / Cursor):**
```
Lees docs/superpowers/HANDOFF-2026-07-10-customer-first-ui-overhaul.md en
voer fase 1 uit volgens docs/superpowers/plans/2026-07-10-design-system-conversion-entry.md
(superpowers:executing-plans). Branch: feat/phase-1-design-system
```

**Promo jul 2026:** Codex 5u-limiet tijdelijk weg (12 jul); weeklimiet blijft — check `/status` vóór elke sessie.

---

## 2. Business context

| Item | Waarde |
|------|--------|
| Product | pSEO lead-fabriek NL energiemarkt → 6-staps funnel → technisch dossier voor installateurs |
| Kernurgentie | Einde salderen **1 januari 2027** |
| Primair succescriterium | Meer **volledig ingevulde, gekwalificeerde leads** |
| Secundair | Hogere start-rate adrescheck, lagere uitval per stap, betrouwbare PDF/email/B2B |
| **Niet-doel** | Extra indexatie omwille van indexatie; Revolut pixel-kopie; big-bang zonder tests |

**Doelgroep UI:** woningeigenaren 35–65, geen energie-experts, mobiel-first, willen financiële impact begrijpen vóór jargon.

**Visuele richting:** **Customer-first Hybrid** — rust/hiërarchie geïnspireerd op Revolut, maar **geen** fintech/crypto-look. Bestaand navy+amber blijft leidend waar donker; nieuwe “evergreen/mist” tokens voor lichte conversiezones (zie design spec).

---

## 3. Beslissingenlog (bindend)

| Datum | Beslissing | Reden |
|-------|------------|-------|
| 2026-07-10 | Design goedgekeurd: Customer-first Hybrid | Brainstorm + visuele richting |
| 2026-07-10 | 5 fasen (0–4), sequentieel | Risico beperken; fase 0 = trust vóór UI |
| 2026-07-10 | Fase 0 op **Auto** uitgevoerd | Goedkoper, beperkte scope (~24 bestanden) |
| 2026-07-10 | Fases **1–4 op GPT 5.6 Sol** (niet Auto) | Zware multi-file UI; context-drift op Auto |
| 2026-07-10 | **Wachten tot ~8 augustus 2026** voor fase 1+ | Cursor API-quota op; voorkom overage/halve sessies |
| 2026-07-10 | **1 fase = 1 sessie**, merge tussen fases | Minder token-verspilling, review-moment |
| 2026-07-10 | Fase 0 gemerged via **PR #1** naar `master` | CI groen vóór merge |
| 2026-07-10 | `lib/bag-attestation.ts` **uitgesteld** | Niet blokkerend voor fase 1 |
| 2026-07-10 | Planning-docs **committen** in repo | Handoff over een maand zonder chat-context |

---

## 4. Fase-overzicht

| Fase | Naam | Status | Planbestand | Regels | Geschatte tokens |
|------|------|--------|-------------|--------|------------------|
| **0** | Veilige fundering | ✅ **LIVE** (`master` `527bc87`) | `plans/2026-07-10-safe-foundation.md` | 1539 | 150k–350k (gedaan) |
| **1** | Design system + conversion entry | ⏳ Gepland | `plans/2026-07-10-design-system-conversion-entry.md` | 1050 | 250k–500k |
| **2** | Funnel + analytics | ⏳ Gepland | `plans/2026-07-10-funnel-analytics.md` | 1472 | 400k–800k |
| **3** | Rapportketen | ⏳ Gepland | `plans/2026-07-10-report-chain.md` | 1284 | 350k–700k |
| **4** | Route-uitrol + stabilisatie | ⏳ Gepland | `plans/2026-07-10-route-rollout-stabilization.md` | 1071 | 400k–900k |

**Afhankelijkheden:**
```
Fase 0 ──► Fase 1 ──► Fase 2 ──► Fase 3 ──► Fase 4
              │                      │
              └──── Fase 4 shells ───┘ (pSEO primitives uit fase 1/4 plan)
```

Fase 2 plan zegt “Depends on Plans 1 and 2” — dat is **fase 0 + fase 1** in onze nummering (plan-bestandsnamen gebruiken soms interne nummering; zie plan-headers).

---

## 5. Fase 0 — wat precies is gebouwd (LIVE)

### 5.1 Git & deploy

| Item | Waarde |
|------|--------|
| Branch (historisch) | `feat/safe-foundation` |
| Merge commit | `527bc87` (PR #1) |
| Implementatie commit | `001ece1` |
| Productie | Vercel auto-deploy van `master` |
| Supabase migratie | `20260710143000_webhook_retry_payload.sql` — **uitgevoerd door gebruiker** |

### 5.2 Nieuwe bestanden

| Bestand | Rol |
|---------|-----|
| `lib/lead-submission.ts` | Parse/normalize `POST /api/leads`; `deriveLeadAnalysis()` herberekent ROI + health server-side |
| `lib/webhook-delivery.ts` | Deterministische B2B payload, HMAC, HTTP delivery, backoff state |
| `lib/vision-input.ts` | Max 3 MiB decoded, MIME allowlist |
| `components/funnel/prepare-vision-image.ts` | Client compressie naar ≤3 MiB |
| `playwright.unit.config.ts` | Node-only unit tests (geen web server) |
| `tests/unit/lead-submission.spec.ts` | 13 tests totaal in suite |
| `tests/unit/webhook-delivery.spec.ts` | |
| `tests/unit/vision-input.spec.ts` | |
| `.github/workflows/ci.yml` | typecheck → unit → build → core-e2e |
| `supabase/migrations/20260710143000_webhook_retry_payload.sql` | `payload_body`, `payload_signature` op `webhook_deliveries` |

### 5.3 Gewijzigde bestanden (kern)

| Bestand | Wijziging |
|---------|-----------|
| `app/api/leads/route.ts` | Server validation; `emailStatus`; `after()` voor webhooks |
| `app/api/leads/[id]/route.ts` | Resend alleen als `RESEND_API_KEY` (CI-build fix) |
| `app/api/webhooks/retry/route.ts` | Replay opgeslagen payload + verse HMAC |
| `app/api/vision/route.ts` | `parseVisionInput()` |
| `lib/webhooks.ts` | `preparePartnerDeliveries` + `dispatchPreparedPartnerDeliveries` |
| `components/funnel/types.ts` | `RoiCalculationInput`, `roiInput`, `SET_ROI_INPUT` |
| `components/funnel/FunnelContainer.tsx` | `roiInput` in state + persistence |
| `components/funnel/Step2ROI.tsx` | Schrijft `roiInput` bij elke ROI-berekening |
| `components/funnel/Step6LeadCapture.tsx` | Submit bevat `roiInput` |
| `components/funnel/PhotoUpload.tsx` | Compressie vóór upload |
| `package.json` | `typecheck`, `test:unit`, `test:e2e:core` |
| `playwright.config.ts` | CI: `baseURL: http://localhost:3000` (**niet** 127.0.0.1 — Next 16 HMR) |
| `tests/e2e/step6-validatie.spec.ts` | `roiInput` in fixture + submit-assertie |
| `CLAUDE.md` | Server-trust + voortgangstabel |

### 5.4 Server-trust regels (niet breken in fase 1+)

1. Client `roiResult` / `healthScore` = **display only**
2. Opgeslagen `roi_berekening` / `health_score` = server `berekenROI(roiInput)` + `berekenHealthScore()`
3. `roiInput` moet in funnel state + localStorage + lead POST zitten
4. B2B webhook alleen bij `gdpr_consent === true`
5. Webhook retry gebruikt **opgeslagen** `payload_body`, niet herbouw uit mutable client data

### 5.5 Verificatie (alle groen op 10 jul 2026)

```bash
npm run test:unit      # 13/13
npm run typecheck
npm run build
npm run test:e2e:core  # 8/8
```

### 5.6 Bewust niet gebouwd (fase 0)

- `lib/bag-attestation.ts` — HMAC op BAG API response
- `tests/unit/bag-attestation.spec.ts`
- Wijzigingen aan `app/api/bag/route.ts` voor signing

---

## 6. Fase 1 — Design system + conversion entry (VOLGENDE STAP)

**Doel:** Semantic design tokens (Tailwind v4), gedeelde shells (header/footer/hero), homepage server-split, pSEO→funnel attribution via typed query helper.

**Branch aanmaken:** `feat/phase-1-design-system`

**Belangrijkste nieuwe componenten (uit plan):**
- `components/design-system/*` — BrandMark, Container, PageShell, DarkHeroShell, SiteHeader, SiteFooter, PrimaryAction
- `components/home/*` — ConversionHero, TrustSignals, InsightPreview, SocialProofTicker
- `lib/conversion-context.ts` — typed `?wijk=`, `?stad=`, `?provincie=`, UTM, pSEO level

**Homepage:** content = Server Components; alleen adreszoek + social proof + analytics = Client.

**Niet wijzigen:** route URLs, indexed content-semantiek, JSON-LD structuur (wel styling).

**Plan uitvoeren met:** `superpowers:executing-plans` — task-by-task, checkbox tracking in plan.

**Verify na fase 1:**
```bash
npm run typecheck && npm run test:unit && npm run build && npm run test:e2e:core
```

---

## 7. Fase 2 — Funnel + analytics

**Doel:** 6 interne stappen → **4 zichtbare customer stages**; technische scans (meterkast/plaatsing/omvormer) = één optionele module; deterministic state restore; GA4 funnel events met session ID.

**Grote refactor:**
- Extract `funnel-state.ts`, `funnel-storage.ts` uit `FunnelContainer.tsx`
- `lib/funnel-analytics.ts` — typed events, geen PII in payloads
- Lazy-load scan panels + Step6
- Supabase migratie mogelijk voor funnel session (zie plan Task details)

**Let op bestaande fixes niet breken:**
- `?leadId=` zonder `&token=` infinite-fetch loop fix in `FunnelContainer`
- `roiInput` server-trust uit fase 0
- Mobile/desktop split in `ResultsDashboard` (wordt in fase 3 vervangen door report-model)

**Verify na fase 2:**
```bash
npm run test:unit
npx playwright test tests/e2e/funnel-deep.spec.ts --project=chromium  # ~133 tests
npm run test:e2e:core
```

---

## 8. Fase 3 — Rapportketen

**Doel:** Eén `NormalizedReport` model → web, email, PDF, B2B payload **inhoudelijk identiek**.

**Kern:**
- `lib/report-model.ts` — pure builder van server lead record
- `lib/report-email.ts` — HTML uit model
- `components/report/*` — nieuwe responsive report UI (geen runtime viewport hook)
- `SubmissionStatus` — UI claimt nooit “email verzonden” als Resend faalde
- Twee segmenten: nieuwe installatie vs bestaande panelen (upgrade/batterij)

**Vervangt/refactort:** `ResultsDashboard.tsx`, `PDFDownloadButtonInner.tsx`, lead email template in `app/api/leads/route.ts`

---

## 9. Fase 4 — Route-uitrol + stabilisatie

**Doel:** Customer-first system op **alle** publieke routes; a11y (axe), visual regression, performance budgets, Web Vitals.

**Scope:**
- `components/pseo/*` — PseoPageShell, breadcrumbs, conversion cards
- Provincie/stad/wijk/straat/postcode pagina's migreren naar shells
- `CheckPageClient.tsx` extract uit `app/check/page.tsx`
- `app/error.tsx`, kennisbank/nieuws shells
- `@axe-core/playwright`, visual snapshots, `test:performance`
- Optioneel Mapbox verwijderen als plan dat voorschrijft (verify plan Task 7)

**Grootste token-verbruiker** — overweeg uitstellen of opsplitsen in 4a (pSEO) + 4b (a11y/perf) als quota krap is.

---

## 10. Design spec — samenvatting

**Volledig document:** `docs/superpowers/specs/2026-07-10-customer-first-ui-overhaul-design.md`

### Ontwerpprincipes (kern)
1. **Eerst de klantvraag** — “Wat betekent stoppen met salderen voor mijn woning?”
2. **Progressive disclosure** — techniek achter optionele stappen
3. **Eén dominante actie** per viewport
4. **Mobile-first** — 16px inputs, 44px touch targets, geen horizontale scroll
5. **Trust through evidence** — geen fake social proof of SLA-beloftes
6. **Server truth** — rapportcijfers van server, niet client

### Vier-staps funnel (visueel, fase 2)
| Stage | Klanttaal | Intern (6 stappen) |
|-------|-----------|-------------------|
| 1 | Jouw woning | Step 1 adres + Step 2 ROI |
| 2 | Jouw situatie | Eigenaar/panelen vragen (Step 6 kwalificatie, eerder in flow) |
| 3 | Technische check (optioneel) | Steps 3–5 vision |
| 4 | Jouw rapport | Step 6 lead capture + ResultsDashboard |

*(Exacte mapping staat in design spec § funnel — plan fase 2 is leidend bij implementatie.)*

### Kleuren (hybrid)
- Donkere pSEO/hero: bestaand slate-950/900 + amber CTA
- Lichte funnel/conversie: “evergreen/mist” tokens (nieuw in fase 1 `globals.css`)
- Netcongestie ROOD blijft enige rode UI (semantisch)
- Urgentie 2027: amber, geen rode banners

---

## 11. Audits (vóór planning, jul 2026)

Vijf readonly subagent-audits voedden de plannen:

| Audit | Hoofdbevinding |
|-------|----------------|
| Frontend/conversion | Te veel jargon in funnel; mobile druk; inconsistente entry vanaf pSEO |
| Backend/security | Client-trusted ROI; webhook retry kapot; vision geen size cap |
| Testing | Geen CI; funnel-deep zonder unit layer |
| Performance | Grote client bundles op `/check`; geen lazy boundaries |
| Growth/SEO | CTR/conversie belangrijker dan indexatie; cannibalisatie risico laag |

**Prioriteit uit audits:** (1) webhook retry + server trust → **fase 0 done**, (2) CI, (3) funnel/report UX, (4) route rollout.

---

## 12. Kosten & modelstrategie

### Tokenschatting resterend (fases 1–4)

| | Tokens |
|---|--------|
| Optimistisch | ~1,6M |
| Midden | ~2,5M |
| Pessimistisch (+ retries, Max Mode) | ~3,4M |

### Euro's (API pay-as-you-go, GPT 5.6 Sol)

| Scenario | Geschatte extra kost boven inclusief quota |
|----------|---------------------------------------------|
| Past in maand-quota (Pro Plus / gespreid) | €0–15 |
| Pro + overage | €20–55 |
| Zelfde werk op **Claude Fable 5** | ~1,7–2× duurder (~€45–100) |

**Tarief Sol (jul 2026):** $5/M input, $30/M output ([Cursor docs](https://cursor.com/docs/models-and-pricing)). Max Mode = 2× input bij lange context.

### Aanbevolen modelprotocol

| Werk | Model |
|------|-------|
| Fase 1–4 implementatie (plan volgen) | **GPT 5.6 Sol** |
| Moeilijke bugs / responsive edge cases | Sol **Max Mode** |
| Kleine fixes na merge | Auto of Terra |
| Copy tweaks | Luna / Auto |
| **Niet** | Fable (duurder, geen voordeel hier) |

### Kosten beperken
1. Wacht op quota-reset (~8 aug)
2. Eén fase per sessie
3. Max Mode alleen bij grote refactors
4. Tests lokaal draaien; agent alleen bij rode tests
5. Fase 4 eventueel splitsen of uitstellen (laagste conversie-ROI)

---

## 13. CI & testcommando's

### GitHub Actions (`.github/workflows/ci.yml`)
1. `npm run typecheck`
2. `npm run test:unit`
3. `npm run build` (placeholder env vars)
4. `npm run test:e2e:core` (8 tests)

### Lokaal volledige suite
```bash
npm run dev   # aparte terminal, of playwright start webServer
npx playwright test --project=chromium   # ~156 tests
```

### Per-fase verify (minimum)
```bash
npm run typecheck
npm run test:unit
npm run build
npm run test:e2e:core
```

---

## 14. Bekende valkuilen (uit fase 0 sessie)

| Probleem | Oplossing |
|----------|-----------|
| E2E timeout op poort 3000 | Kill zombie `next dev` process |
| `playwright.config` `127.0.0.1` | Gebruik `localhost:3000` |
| `new Resend()` zonder key in build | Guard: alleen init met `RESEND_API_KEY` |
| `?leadId=` zonder `&token=` loop | `alreadySynced` check in FunnelContainer — niet verwijderen |
| PDF op iOS | Blob + `window.open` sync, niet `PDFDownloadLink` |

---

## 15. Openstaande TODO's (niet onderdeel van fase 1–4)

| Item | Locatie | Notitie |
|------|---------|---------|
| Partner-SLA copy | `Step6LeadCapture`, `ResultsDashboard`, `api/leads` email | Wacht op hoofdinkoper-contract |
| `lib/bag-attestation.ts` | fase 0 file map | Security hardening, later |
| GSC handmatige index URLs | `CLAUDE.md` § Google Indexing | Los van UI overhaul |
| Indexing batch 600–800 | `scripts/ping-wijk-indexing.ts` | Los van UI overhaul |

---

## 16. Bestandsindex documentatie

```
docs/superpowers/
├── HANDOFF-2026-07-10-customer-first-ui-overhaul.md   ← DIT BESTAND
├── specs/
│   └── 2026-07-10-customer-first-ui-overhaul-design.md  ← Goedgekeurd design
└── plans/
    ├── 2026-07-10-safe-foundation.md          ← Fase 0 (DONE)
    ├── 2026-07-10-design-system-conversion-entry.md  ← Fase 1
    ├── 2026-07-10-funnel-analytics.md         ← Fase 2
    ├── 2026-07-10-report-chain.md           ← Fase 3
    └── 2026-07-10-route-rollout-stabilization.md     ← Fase 4
```

**Projectgeheugen:** `CLAUDE.md` § "Customer-first UI overhaul" + § "Server-trust boundary"

---

## 17. Workflow per fase (augustus)

```
1. Nieuwe branch: feat/phase-N-<korte-naam>
2. Agent leest: HANDOFF + plan + design spec (sectie relevant)
3. superpowers:executing-plans — task voor task
4. Verify: typecheck, unit, build, e2e:core (+ fase-specifieke tests)
5. PR naar master, CI groen, merge
6. Vercel productie deploy
7. Korte rooktest productie
8. Update HANDOFF + CLAUDE.md voortgangstabel
9. Pauze tot volgende maand/sessie
```

### Branch-naming voorstel

| Fase | Branch |
|------|--------|
| 1 | `feat/phase-1-design-system` |
| 2 | `feat/phase-2-funnel-analytics` |
| 3 | `feat/phase-3-report-chain` |
| 4 | `feat/phase-4-route-rollout` |

---

## 18. Productie rooktest (na elke fase)

- [ ] Homepage laadt, countdown telt (niet `--`)
- [ ] `/check?adres=...` auto-zoekt
- [ ] Lead submit → `emailStatus` in response
- [ ] `/check?leadId=...&token=...` laadt rapport
- [ ] PDF-download opent nieuw tabblad (mobiel + desktop)
- [ ] Geen horizontale scroll 390px / 1440px

---

## 19. Changelog handoff

| Versie | Datum | Wijziging |
|--------|-------|-----------|
| 1.0 | 2026-07-10 | Initiële handoff na fase 0 deploy + gebruiker bevestigde Supabase migratie |

---

*Einde handoff. Bij hervatten: open dit bestand + het plan van de actieve fase.*
