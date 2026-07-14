@AGENTS.md

## Werkwijze voor Claude Code

Gebruik altijd de relevante superpowers skills vóór elke taak:
- **Nieuwe feature of creatief werk** → `superpowers:brainstorming` eerst
- **Bug of onverwacht gedrag** → `superpowers:systematic-debugging`
- **Implementatieplan uitvoeren** → `superpowers:executing-plans`
- **Meerdere onafhankelijke taken** → `superpowers:dispatching-parallel-agents`
- **Werk afronden / branch mergen** → `superpowers:finishing-a-development-branch`
- **Code review ontvangen** → `superpowers:receiving-code-review`
- **Code review aanvragen** → `superpowers:requesting-code-review`
- **Werk valideren voor afronden** → `superpowers:verification-before-completion`

Bij twijfel: gebruik de skill. Niet gebruiken is nooit de veilige keuze.

**Projectgeheugen (`CLAUDE.md`):** bij stack-, env-, API- of operatie-relevante wijzigingen dit bestand meenemen; niet elke kleine UI-copy hoeft hier terug te komen.

# Saldeerscan.nl — pSEO Lead Fabriek

Next.js 16 / React 19 platform voor de Nederlandse energiemarkt. Genereert 10.000+ statische pagina's (pSEO op straat- én wijk-niveau) die converteren via een 6-staps funnel naar 'Technisch Dossiers' voor B2B partners (installateurs). Kernurgentie: einde salderen per 1 januari 2027.

## Stack

| Laag | Keuze |
|------|-------|
| Framework | Next.js 16.2.2 + React 19 (App Router) |
| Styling | Tailwind v4 (CSS-first config, geen tailwind.config.ts) |
| UI | Shadcn/UI v4 + `@base-ui/react` |
| Database | Supabase (Postgres) |
| Supabase client | `@supabase/ssr` — drie clients: `lib/supabase/server.ts`, `lib/supabase/browser.ts`, `lib/supabase/admin.ts` |
| Geocoding | Mapbox Search JS React (`@mapbox/search-js-react`) |
| Grafieken | Recharts v3 |
| AI — screening | Gemini 2.5 Flash (`@google/generative-ai`) |
| AI — diepanalyse | Claude claude-sonnet-4-6 (`@anthropic-ai/sdk`) |
| Email | Resend (transactioneel, fire-and-forget) |
| Rate limiting | Upstash Redis (`@upstash/ratelimit` + `@upstash/redis`) met in-memory fallback voor lokale dev |
| Error tracking | Sentry (`@sentry/nextjs`) — `sentry.client.config.ts` + `sentry.server.config.ts`, DSN via `NEXT_PUBLIC_SENTRY_DSN` |
| E2E testen | Playwright (chromium, `tests/e2e/`) |
| Scripts | `tsx` — draai met `npx tsx scripts/<naam>.ts` |

## Projectstructuur

```
app/
  page.tsx                          # Homepage: deep navy hero + CountdownTimer + adreszoek + USPs + stats
  layout.tsx                        # Fonts: Bricolage Grotesque (headings) + DM Sans (body)
  globals.css                       # Tailwind v4 + design tokens + .glass-card-navy + @media print
  sitemap.ts                        # Gesplitste sitemaps: core + provincies + kennisbank + nieuws + postcodes.xml
  privacy/page.tsx                  # AVG-compliant privacyverklaring (9 secties, volledig ingevuld)
  icon.tsx                          # Dynamische favicon 32x32 (edge runtime, navy cirkel + amber hexagon)
  apple-icon.tsx                    # Apple touch icon 180x180 (zelfde stijl)
  check/page.tsx                    # 6-staps Super Funnel (Suspense + useSearchParams voor ?adres=, ?wijk=, ?stad= prefill)
  postcode/[code]/page.tsx          # pSEO postcode-pagina 'zonnepanelen 1234 AB' (ISR 30d), via getWijkenByPostcode()
  nieuws/page.tsx                   # Nieuwsoverzicht (lib/nieuws.ts)
  nieuws/[slug]/page.tsx            # Nieuwsartikel detail
  kennisbank/page.tsx               # Kennisbank overzicht
  kennisbank/[slug]/page.tsx        # Kennisbank artikel detail
  [provincie]/page.tsx              # Provincie overzichtspagina met steden (ISR 30d)
  [provincie]/[stad]/page.tsx       # Stad overzichtspagina met wijken + urgentie strip (ISR 30d)
  [provincie]/[stad]/[wijk]/page.tsx          # pSEO wijk-pagina (ISR 30d) + breadcrumb + ranking badge + CountdownTimer
  [provincie]/[stad]/[wijk]/[straat]/page.tsx # pSEO adrespagina (ISR 30d)
  api/
    bag/route.ts                    # BAG/PDOK lookup
    bag/suggest/route.ts            # Adres autocomplete suggesties
    netcongestie/route.ts           # Netbeheer NL congestion check
    roi/route.ts                    # ROI + 2027 shock-effect
    health-score/route.ts           # Energie score 0-100
    vision/route.ts                 # Two-tier Vision analyse
    generate-content/route.ts       # Gemini Flash pSEO content
    leads/route.ts                  # Lead opslaan + serverrapport + persistente Resend-status + webhook trigger
    leads/[id]/route.ts             # Get token-beveiligd serverrapport; DELETE verwijdert lead na verificatie
    webhooks/b2b/route.ts           # B2B partner webhook dispatcher
    webhooks/retry/route.ts         # Webhook retry job — dagelijkse cron, backoff 24h/48h/96h, byte-identieke replay
    indexing/cron/route.ts          # Dagelijkse Google Indexing API cron (automatisch, max 200 URLs/dag)

components/
  CountdownTimer.tsx                # Client countdown naar 2027-01-01, SSR-safe (-- placeholder), 4 glass cards
  funnel/
    FunnelContainer.tsx             # useReducer state machine (6 stappen), accepteert initialAdres/initialWijk/initialStad props + localStorage persistentie + ?leadId=&token= email-link hydration (server fetch → ResultsDashboard)
    Step1Adres.tsx                  # Auto-zoekt bij mount als initialAdres aanwezig; AnalysisLoading tijdens fetch
    Step2ROI.tsx … Step6LeadCapture.tsx
    ResultsDashboard.tsx            # Responsive webweergave van NormalizedReport v1; CSS-breakpoints, geen viewport-hook
    Shock2027Banner.tsx             # 2027 saldering urgentie — amber design (bg-amber-950/20 border-amber-500/25), geen rode kleuren
    PhotoUpload.tsx                 # Dropzone + vision API (geen icon prop, vaste SVG upload icon)
    FunnelProgress.tsx
    AnalysisLoading.tsx             # Labor illusion loader met roterende berichten (BAG / netcapaciteit / ROI)
    StepHeader.tsx                  # Gedeelde stap-header component — clean design: geen grid/glow, stap-label 'Stap X — Naam' in DM Sans
    PDFDownloadButton.tsx           # @react-pdf/renderer v4, dynamic import (ssr:false) — zie PDFDownloadButtonInner
    types.ts                        # Gedeelde funnel types (incl. wijk + stad in FunnelState)
  report/                           # Gedeelde websecties voor samenvatting, impact, advies, woning en techniek
  pseo/
    LocalSchema.tsx                 # JSON-LD LocalBusiness + FAQPage injectie (prop: jsonLd)
  ui/                               # Shadcn componenten

lib/
  bag.ts                            # BAG adapter (Mapbox → PDOK)
  netcongestie.ts                   # Postcode-prefix cache lookup
  roi.ts                            # ROI algoritme + saldering afbouw 2026→2027
  report-model.ts                   # NormalizedReport v1 + pure builder vanuit opgeslagen server-lead
  report-email.ts                   # HTML-e-mail vanuit hetzelfde NormalizedReport
  health-score.ts                   # Score 0-100 (bouwjaar/label/dak/congestie)
  gemini.ts                         # Gemini 2.5 Flash adapter (pSEO content + screening + generateWijkContent met 800w + 5 FAQs)
  vision.ts                         # Two-tier: Gemini screen → Claude diepanalyse + withRetry
  webhooks.ts                       # HMAC-SHA256 signed B2B dispatcher (consent-gated)
  rate-limit.ts                     # Upstash Redis sliding window, namespace per route; in-memory fallback lokaal
  pseo.ts                           # pSEO helpers: slug-lookup (getWijkPage/getPseoPage); lijsten/sitemaps aggregeren op `slug` (prefix / segmenten), niet op titelcase `provincie`-kolom; o.a. `getUrgentWijkenByProvincie`, `getProvincieHubStats`
  indexing-priority.ts              # Indexing-API volgorde: hubs → INDEXING_PRIORITY_PATHS → wijken (urgentie) → straten (cron + ping-wijk-indexing)
  json-ld.ts                        # JSON-LD builder (+ o.a. `buildPostcodeHubGraphLd`, `buildWebApplicationSchema`)
  nieuws.ts                         # Nieuws data adapter
  kennisbank.ts                     # Kennisbank data adapter
  google-indexing.ts                # Google Indexing API helper
  analytics.ts                      # Analytics helpers
  utils.ts                          # Gedeelde utility functies
  lead-report-token.ts              # HMAC-SHA256 signing/verificatie van `?token=` op rapport-URLs (e-mail + ?leadId= hydration)
  roi-result-guard.ts               # `parseStoredRoi(raw)` — valideert en normaliseert roi_berekening uit DB; retourneert null bij corrupt/incompleet record
  supabase/server.ts|browser.ts|admin.ts

scripts/
  seed-netcongestie.ts              # Seed netcongestie_cache tabel
  seed-pseo.ts                      # Seed eerste batch pSEO adrespagina's (met PDOK WFS integratie voor echte straat-data per wijk: --wijk --stad --provincie)
  seed-wijken.ts                    # 2000-wijk seed via Gemini AI (--skip-existing, --batch=0,50, --dry-run flags; CBS PDOK WFS voor aantalWoningen; JSON-LD @graph)
  seed-nieuws.ts                    # Seed 8 actuele nieuwsartikelen

tests/
  e2e/
    wijk-validatie.spec.ts          # Test bekende golden batch wijk + straat URLs (200 status + H1 + JSON-LD)
    funnel-handshake.spec.ts        # Test URL params + countdown timer aanwezig
    funnel-validatie.spec.ts        # Test disabled button, progress bar, homepage CTA
    funnel-deep.spec.ts             # Diepgaande funnel tests — alle 6 stappen (133 tests)
    funnel-compleet.spec.ts         # Volledige funnel doorloop (5 tests)
    leadid-hydrate.spec.ts          # Email leadId rapport-hydratie: ?leadId= URL laadt ResultsDashboard via mock-API (2 tests)
    step6-validatie.spec.ts         # Step 6 lead capture validatie (naam/email/telefoon)

supabase/migrations/
  20260407000001_leads.sql
  20260407000002_pseo_pages.sql
  20260407000003_netcongestie_cache.sql   # Bevat ook b2b_partners tabel + FK naar leads
  20260410000001_pseo_status.sql          # Voegt status kolom toe aan pseo_pages (draft/published)
```

## Database tabellen

- **leads** — volledig verrijkt lead record; GDPR-constraint blokkeert B2B export zonder consent. Kwalificatievelden: `is_eigenaar` (BOOLEAN), `heeft_panelen` (BOOLEAN), `wijk` (TEXT). RLS ingeschakeld — alleen service_role heeft toegang.
- **pseo_pages** — gegenereerde pagina's (slug, SEO content, JSON-LD, stats); kolom `status` (draft/published). RLS ingeschakeld.
- **netcongestie_cache** — postcode-prefix → ROOD/ORANJE/GROEN (TTL 24h). RLS ingeschakeld.
- **b2b_partners** — webhook URL, HMAC key hash, lead filter (min score, provincie, etc.). RLS ingeschakeld.

## Kritieke architectuurbeslissingen

### Vision: two-tier kostenbeheer
`lib/vision.ts` werkt in twee lagen:
1. **Tier 1 — Gemini 2.5 Flash** (screening, ~€0.0001/call): beantwoordt "Is dit een [type]? Ja/Nee + confidence". Drempel: confidence < 0.7 → foutmelding naar gebruiker.
2. **Tier 2 — Claude claude-sonnet-4-6** (diepanalyse, alleen als Tier 1 ≥ 0.7): geeft gestructureerde JSON terug per type (meterkast/plaatsing/omvormer).

`withRetry` wrapper in `vision.ts` handelt Claude 529 (overloaded) en 429 (rate limit) af met exponential backoff (1s, 2s, 3s).

### GDPR consent gate
De B2B webhook dispatcher in `lib/webhooks.ts` controleert altijd `gdpr_consent === true` vóór dispatch. Zonder consent: nul webhooks, log warning. De database heeft een CHECK constraint `b2b_requires_consent` als extra zekerheid.

### Server-trust boundary (fase 0 — `feat/safe-foundation`, jul 2026)
- **`lib/lead-submission.ts`** — enige parse/normalize-grens voor `POST /api/leads`. Client `healthScore` / `roiResult` zijn display-only; opgeslagen `health_score` / `roi_berekening` komen uit server `berekenROI()` + `berekenHealthScore()` op basis van **`roiInput`** (provenance in `FunnelState.roiInput`, gezet door `Step2ROI`).
- **`emailStatus`** — API retourneert `sent` | `failed` | `not_configured` na Resend-poging.
- **`lib/vision-input.ts`** — max 3 MiB decoded vóór AI; `PhotoUpload` comprimeert bron (max 10 MB) via `prepare-vision-image.ts`.
- **CI** — `.github/workflows/ci.yml`: `npm run typecheck`, `npm run test:unit`, `npm run build`, `npm run test:e2e:core`.

### B2B webhook delivery & retry
- **`lib/webhook-delivery.ts`** — `buildPartnerPayload`, HMAC-signing, `deliverPartnerWebhook`, `nextDeliveryState`.
- **`preparePartnerDeliveries`** schrijft elke partner-row met `payload_body` + `payload_signature` vóór HTTP; **`dispatchPreparedPartnerDeliveries`** draait in Next.js `after()` op de leads-route (`maxDuration = 60`).
- **Retry** (`GET /api/webhooks/retry`, dagelijks 06:00 Vercel Hobby): herlaadt opgeslagen body + actieve partner, verstuurt opnieuw met verse HMAC. Backoff: **24h → 48h → 96h** (past bij dagelijkse cron). Migratie: `20260710143000_webhook_retry_payload.sql`.
- Legacy deliveries zonder `payload_body` worden éénmalig herbouwd uit de lead-row.

### Saldering afbouw 2027
`lib/roi.ts` heeft een `SALDERING_SCHEMA` map (2025: 64%, 2026: 28%, 2027: 0%). Het `shockEffect2027` object drijft urgentie in `Shock2027Banner.tsx` én op pSEO-pagina's.

### Rate limiting
`lib/rate-limit.ts` — **Upstash Redis** sliding window (5 req/IP/uur) via `@upstash/ratelimit`, namespace per route (key = `${pathname}:${ip}`). Redis instantie is lazy-loaded en gecached in module scope. In-memory fallback als `UPSTASH_REDIS_REST_URL` ontbreekt (lokale dev — geen persistentie tussen requests).

### www-redirect
Wordt afgehandeld door het **Vercel dashboard** (niet in `vercel.json`). Dubbele redirect-configuratie veroorzaakte browser-cache redirect loops.

### URL pre-fill handshake
`app/check/page.tsx` leest `useSearchParams()` (wrapped in `Suspense`):
- `?adres=` → `initialAdres` → `FunnelContainer` → `Step1Adres` triggert `doSearch()` automatisch bij mount
- `?wijk=` + `?stad=` → `initialWijk` / `initialStad` → in `FunnelState` → gebruikt door `AnalysisLoading` voor dynamische berichten

wijk-pSEO CTA linkt naar `/check?wijk=[wijk]&stad=[stad]` om de URL handshake te activeren.

### Funnel localStorage persistentie
`FunnelContainer` slaat volledige `FunnelState` op in `localStorage` (key: `wep_funnel_state`). Bij herladen verschijnt een "Doorgaan waar je was?" banner — ook als URL-params aanwezig zijn (initialAdres/Wijk/Stad). Opslaan is gedebounced met 500ms om I/O te beperken.

### Social proof teller
Homepage-teller verborgen onder 25 leads. Bij ≥25 leads: afgerond naar beneden op tiental (bijv. 37 → "30+"). Logica in `app/page.tsx`.

### pSEO routes — drie niveaus
- **Provincie-niveau**: `app/[provincie]/page.tsx` — ISR 7d, steden overzicht, JSON-LD AdministrativeArea
- **Stad-niveau**: `app/[provincie]/[stad]/page.tsx` — ISR 7d, wijken overzicht, urgentie strip, JSON-LD City
- **Wijk-niveau**: `app/[provincie]/[stad]/[wijk]/page.tsx` — ISR 7d, `generateStaticParams()` via `getTopWijken(500)`, AI-content via `generateWijkContent()`, breadcrumb, ranking badge, CountdownTimer, BreadcrumbList JSON-LD, gerelateerde wijken sectie onderaan
- **Straat-niveau**: `app/[provincie]/[stad]/[wijk]/[straat]/page.tsx` — ISR 30d, `generateStaticParams()` pre-bouwt top-500 straten op `aantal_woningen`
- **Postcode-niveau**: `app/postcode/[code]/page.tsx` — ISR 30d, 4-cijferige postcode, toont wijken via `getWijkenByPostcode()`

### Wijk ranking badge
`neighborhoodRanking(bouwjaar, score)` in wijk pagina:
- score ≥ 90 of (bouwjaar 1995-2015 → rendementScore=92) → "Top 10% meest rendabele wijken"
- score ≥ 74 → "Top 25% meest rendabele wijken"
- anders: geen badge

### CountdownTimer component
`components/CountdownTimer.tsx` — `'use client'`, telt af naar `2027-01-01T00:00:00+01:00`. SSR-safe: rendert `--` placeholder en hydrateert bij client mount. Geplaatst op `/check` en wijkpagina's; de homepage gebruikt stabiele server-rendered 2027-copy.

### NormalizedReport v1 — één rapportcontract
- `lib/report-model.ts` definieert `NormalizedReport` versie 1. `buildReportModel(reportSourceFromStoredLead(...))` bouwt het model uit de opgeslagen, server-berekende lead; ongeldige of incomplete ROI-data levert geen rapport op.
- `POST /api/leads` en de token-beveiligde `GET /api/leads/[id]` retourneren `report`. De client bewaart dit als `reportModel`; `roiResult` en `healthScore` blijven alleen legacy-displaydata en zijn geen bron voor commerciële rapportcijfers.
- Web (`ResultsDashboard`), e-mail (`renderReportEmail`), PDF (`SaldeerRapportPDF`) en B2B (`buildPartnerPayload`) consumeren hetzelfde model. Partnerpayloads bevatten `report_version` en `report`; compatibiliteitsvelden worden van model/serverbron afgeleid.
- `report_email_status`: `pending` = afleverstatus wordt nog bepaald; `sent` = Resend heeft de verzending geaccepteerd; `failed` = verzending faalde maar aanvraag en PDF blijven beschikbaar; `not_configured` = e-mail is in deze omgeving niet geconfigureerd en de PDF blijft beschikbaar. Alleen `sent` mag als verzonden worden getoond.
- Rapporttoken-gedrag is ongewijzigd: HMAC-token op `?leadId=...&token=...`, 401 zonder geldig token tenzij de expliciete legacy-env aanstaat. `?leadId=` zonder token blijft stabiliseren zonder fetch-loop.

### ResultsDashboard — responsive zonder viewport-switch
`components/funnel/ResultsDashboard.tsx` ontvangt uitsluitend een `NormalizedReport`. De mobiele samenvatting en disclosure-accordions (`md:hidden`) en het brede desktopgrid (`hidden md:grid`) worden met CSS-breakpoints gekozen; er is geen runtime `window.innerWidth`, media-queryhook of hydration-switch. De PDF-knop blijft op beide formaten beschikbaar en horizontale documentoverflow is niet toegestaan.

### PDF-download — blob + nieuw tabblad (niet meer `PDFDownloadLink`)
`components/funnel/PDFDownloadButton.tsx` laadt `PDFDownloadButtonInner` via `next/dynamic({ ssr: false })`; alleen de inner importeert `@react-pdf/renderer`. Daardoor blijft React-PDF buiten de initiële `/`- en `/check`-chunks. De click-handler opent synchroon een tabblad vóór `pdf().toBlob()` en gebruikt bij een geblokkeerde popup een directe `<a download>`-fallback. De PDF ontvangt hetzelfde `NormalizedReport` en berekent geen commerciële waarden opnieuw.

### Sitemaps
`app/sitemap.ts` gebruikt `generateSitemaps()` om per provincie een apart XML-bestand te genereren (max 50k URL's per sitemap). Bevat nu ook provincie-URLs (priority 0.9) en stad-URLs (priority 0.85).

### ROI validatie
`app/api/roi/route.ts` — bouwjaar validatie: `< 1000 || > 2030` (niet < 1800, want panden zoals Anne Frank Huis zijn 1635). DakOppervlakte max: 5000 m² (niet 500).

### pSEO content kwaliteit
`scripts/seed-wijken.ts` — géén template fallback, altijd Gemini. Haalt CBS PDOK WFS data op voor echte `aantalWoningen`. Gemini prompt: 800w hyperlocale content + 5 FAQs. JSON-LD @graph: WebPage + FAQPage. Flags: `--skip-existing`, `--batch=START,END`, `--dry-run`.

### Email bevestiging
`app/api/leads/route.ts` — na succesvolle leadopslag bouwt de server het rapport en rendert `lib/report-email.ts` de HTML uit datzelfde model. De Resend-call is **geawait** en de uitkomst wordt als `report_email_status` opgeslagen vóór het definitieve rapport en de B2B-snapshot worden opgebouwd. FROM-adres: `RESEND_FROM_EMAIL` env var — **geen fallback meer**. Stel in Vercel in als `SaldeerScan <noreply@saldeerscan.nl>`.

### Lead validatie (Step 6)
`components/funnel/Step6LeadCapture.tsx` — strikte validatie vóór submit:
- **Naam**: minimaal 2 woorden vereist (voor- + achternaam)
- **Email**: trim + lowercase normalisatie, regex min TLD-lengte 2
- **Telefoon**: landselector (NL +31 / BE +32 / DE +49 / LU +352) + regex per land. Opgeslagen in internationaal formaat (`+31612345678`). Live groen vinkje toont genormaliseerd nummer zodra het valide is.
- `normalizePhone(raw, code)` strip leading zero + prepend country code
- `validatePhone(raw, code)` regex per land via `COUNTRIES` array

### Lead kwalificatievragen (Step 6)
Twee toggle-vragen vóór het formulier die commerciële segmentatie mogelijk maken voor B2B inkopers:
- **Eigenaar/huurder** → `is_eigenaar BOOLEAN` — filtert onkwalificeerbare huurders eruit
- **Heeft al panelen** → `heeft_panelen BOOLEAN` — bepaalt product (installatie vs. batterij/upgrade)
Beide zijn optioneel (null = niet ingevuld). Vragen zijn pill-buttons, niet verplicht voor submit.

### Lead datakwaliteit
- `stad` gebruikt `state.stad` (pSEO pre-fill) als primaire bron, valt terug op `extractStad(adres)` — split op komma's zodat "Den Haag" intact blijft
- `provincie` valt terug op `bagData.postcode.substring(0,4)` als netcongestie ontbreekt
- `huisnummer` wordt expliciet gestuurd vanuit `bagData.huisnummer`
- `wijk` wordt opgeslagen als de gebruiker via een pSEO wijk-pagina binnenkomt

### Interne linking structuur
Breadcrumbs: Home → Provincie → Stad → Wijk op alle pSEO pagina's. Provincie pagina's linken naar alle steden. Stad pagina's linken naar alle wijken. Wijk CTAs linken naar `/check?wijk=...&stad=...`. Sitemap bevat alle drie niveaus. Wijkpagina's bevatten ook een "Andere wijken in {stad}" sectie (max 6 links, via `getWijkenByStad()`) voor extra interne linking.

`lib/pseo.ts`: wijk/stad/provincie-**lijsten** en top-straten gebruiken **`slug`-prefix of segmenten** (zelfde canon als de App Router), zodat oude rijen met afwijkende `provincie`/`stad`-tekst in de kolommen toch correct linken. `scripts/seed-pseo.ts` (SAMPLE) schrijft `provincie`/`stad` voortaan als **URL-slugs**; PDOK-mode deed dat al.

BreadcrumbList JSON-LD aanwezig op provincie (Home→Provincie), stad (Home→Provincie→Stad) en wijk pagina's (Home→Provincie→Stad→Wijk). Canonical URLs zijn absoluut (`https://saldeerscan.nl/...`) op alle pSEO routes. Organization JSON-LD schema staat in root layout. `app/robots.ts` genereert `/robots.txt` via Next.js MetadataRoute.

## Design systeem

**Identiteit: High-End Engineering Dashboard — deep navy + amber**

Homepage en pSEO pagina's: dark navy achtergrond. Funnel cards (`/check`): wit/licht.

| Gebied | Waarde |
|--------|--------|
| Hero / pagina achtergrond | `#020617` (slate-950) → `#0f172a` (slate-900) gradient |
| Section achtergrond (afwisselend) | `#020617` / `#0f172a` |
| Card (glassmorphism, op donker) | `bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl` of `.glass-card-navy` |
| Card (funnel, op licht) | `bg-white border border-slate-200 rounded-2xl` |
| Amber CTA button | `bg-amber-500 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.4)] active:scale-105` |
| `amberBtnCls` pattern | `shadow-[0_0_35px_rgba(245,158,11,0.5)]` (sterkere glow variant in funnel) |
| Disabled button | `disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none` |
| Stats / highlight cijfers | `#f59e0b` (amber-500) |
| Urgentie strips (homepage, stad) | `background: rgba(28,18,8,0.95)` + `border-amber-500/20` + tekst `text-amber-300/80` — **geen rood** |
| Urgentie cards (Shock2027Banner, PDF) | `bg-amber-950/20 border-amber-500/25` — negatieve getallen mogen `text-red-400` blijven (semantisch) |
| Status ROOD | `bg-red-50 border-red-200 text-red-600` (licht) / `bg-red-950/50 border-red-700 text-red-400` (donker) — **alleen voor netcongestie ROOD status** |
| Status ORANJE | `bg-amber-50 border-amber-200 text-amber-600` (licht) / `bg-amber-950/50 border-amber-700 text-amber-400` (donker) |
| Status GROEN | `bg-emerald-50 border-emerald-200 text-emerald-600` (licht) / `bg-emerald-950/50 border-emerald-700 text-emerald-400` (donker) |
| SVG grid (hero only) | opacity 0.03, fade via `maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'` |
| Input focus (donker) | `.amber-glow` class in globals.css — amber border + subtle glow |
| Print/PDF | `@media print` in globals.css, `.no-print` klasse op interactieve elementen |

Fonts (via `app/layout.tsx`, Next.js Google Fonts):
- **Bricolage Grotesque** — koppen (H1-H6), `var(--font-heading)`
- **DM Sans** — body tekst, labels, form fields, `var(--font-sans)` — **gebruik dit als default, niet font-mono**
- **ui-monospace** — uitsluitend voor numerieke data/scores/bedragen, `font-mono`

**Emoji-vrij**: geen emoji's in de UI. Gebruik altijd inline SVG iconen.

## Environment variables

Kopieer `.env.example` naar `.env.local` en vul in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
MAPBOX_ACCESS_TOKEN=        # Server-side only (lib/bag.ts geocoding)
GOOGLE_AI_API_KEY=          # Gemini 2.5 Flash (screening + pSEO content + wijk seed)
ANTHROPIC_API_KEY=          # Claude claude-sonnet-4-6 (vision diepanalyse)
RESEND_API_KEY=             # Transactionele email (lead bevestiging)
EPONLINE_API_KEY=           # EP-online RVO (energie labels)
UPSTASH_REDIS_REST_URL=     # Upstash Redis (rate limiting, persistent)
UPSTASH_REDIS_REST_TOKEN=   # Upstash Redis token
NEXT_PUBLIC_SENTRY_DSN=     # Sentry error tracking
LEAD_REPORT_HMAC_SECRET=    # Optioneel: eigen geheim voor ?token= op rapportlinks (anders fallback service role)
LEAD_REPORT_LEGACY_OPEN_READ=true  # Alleen rollback: GET /api/leads/[id] zonder token toestaan
GOOGLE_INDEXING_SA_KEY=       # JSON service account (Indexing API) — cron + ping-wijk-indexing.ts
CRON_SECRET=                  # Bearer token voor GET /api/indexing/cron (Vercel Cron)
INDEXING_PRIORITY_PATHS=     # Optioneel: komma-gescheiden paden eerst in dynamische batch (GSC-prioriteit), bv. /utrecht/utrecht/leidsche-rijn
INDEXING_EXTRA_INDEXING_URLS= # Optioneel: extra volledige URL's (komma) bij hub-ping elke run
```

## NPM scripts

```bash
npm run dev               # Start dev server
npm run build             # Production build
npm run typecheck         # next typegen + tsc --noEmit
npm run test:unit         # Playwright unit runner (tests/unit)
npm run test:e2e:core     # Kern E2E: leadid-hydrate + step6-validatie (chromium)
npm run seed:netcongestie # Seed netcongestie_cache tabel
npm run seed:pseo         # Seed eerste batch pSEO adrespagina's
npm run seed:wijken       # 2000-wijk seed via Gemini (gebruik --batch=0,50 per run)
npx playwright test       # Volledige E2E suite
npx tsx scripts/ping-wijk-indexing.ts --batch=START,END  # Google Indexing API, max 200/dag
```

## Email adressen

- `info@saldeerscan.nl` — algemeen contact (footer, JSON-LD), forward via ImprovMX → Gmail
- `privacy@saldeerscan.nl` — AVG-verzoeken (privacyverklaring), forward via ImprovMX → Gmail

## TODO na hoofdinkoper

Contact-/opvolgteksten gebruiken nu **neutrale** bewoording (“naar aanleiding van uw aanvraag”, “na uw aanvraag”) — geen impliciete SLA. Zodra er een overeenkomst is met een hoofdinkoper, kun je overal dezelfde **concrete** beloftes (responstijd, aantal partners, etc.) doorvoeren:

- `components/funnel/Step6LeadCapture.tsx` — TrustBar titels (“Lokale installateurs”, “Vrijblijvend”) desgewenst vervangen door concrete partner-/SLA-copy; subtitels nu neutraal (“o.b.v. uw aanvraag”, “geen koopplicht”)
- `components/funnel/ResultsDashboard.tsx` — blok “Wat gebeurt er nu?”
- `app/api/leads/route.ts` — intro + “Wat nu?” in de bevestigingsmail

## Google Indexing API voortgang

Limiet 200 URLs/dag. Voortgang (apr 2026): batch 0–600 gedaan → volgende: `--batch=600,800`

**Prioriteit:** vaste hubs (incl. twee postcode-URL's) → optioneel `INDEXING_PRIORITY_PATHS` → wijken (ROOD / verlies / volume) → straten. Dagelijkse cron roteert een venster over die gesorteerde lijst (`lib/indexing-priority.ts`).

GSC-prioriteit URLs — zet in Vercel `INDEXING_PRIORITY_PATHS` (komma-gescheiden paden) of ping handmatig:
```
npx tsx scripts/ping-wijk-indexing.ts --batch=600,800
```
Daarna handmatig pingen (niet in wijk-batch, aparte URLs):
- https://saldeerscan.nl/nieuws
- https://saldeerscan.nl/flevoland
- https://saldeerscan.nl/utrecht/rhenen
- en de overige 40 URLs uit GSC "gecrawld niet geïndexeerd" lijst

## Handmatige DB-fixes (eenmalig uitvoeren in Supabase SQL editor)

```sql
-- Fix Issue 6: Bergen op Zoom wijken op ROOD zetten (postcode 4600-4799 = ROOD per CONGESTION_SEED)
UPDATE pseo_pages
SET netcongestie_status = 'ROOD'
WHERE stad = 'bergen-op-zoom' AND provincie = 'noord-brabant';
```

Migraties uitgevoerd t/m `20260422000003_rls.sql`. Aanvullend o.a. `20260502000001_leads_huidige_panelen_aantal.sql` (kolom `huidige_panelen_aantal` op `leads`). Alle tabellen hebben RLS ingeschakeld (apr 2026).

## Verificatie checklist

- `curl /api/bag?adres=Prinsengracht+123+Amsterdam` → BAG JSON
- ROI voor 1975 rijtjeshuis (110m²) → €400-800/jaar besparing
- ROI voor pre-1800 pand (bouwjaar 1635) → werkt zonder 400 error
- Homepage adres invoeren → redirect naar `/check?adres=...` → auto-zoek triggered
- Homepage countdown timer telt af (niet `--`)
- `/check?wijk=IJburg&stad=Amsterdam` → Step 1 AnalysisLoading toont "Netcapaciteit IJburg verifiëren..."
- Step 6: naam vereist 2 woorden, telefoonnummer toont live groen preview na validatie
- Step 6 submit → SuccessState toont ResultsDashboard (mobiel: samenvatting + PDF-knop; desktop ≥768px: volledig rapport met ShockChart + ROITijdlijn)
- PDF-downloadknop op mobiel én desktop → opent PDF in nieuw tabblad (geen afdrukknop meer)
- Favicon zichtbaar in browsertabblad én als `<link rel="icon">` in page source (niet Vercel logo); Google crawl-update via GSC "Request Indexing" op homepage om favicon in zoekresultaten te versnellen
- Homepage urgentie strip is amber (niet rood)
- pSEO straat-route laadt met JSON-LD in `<head>`
- pSEO wijk-route (`/utrecht/utrecht/leidsche-rijn`) laadt na seed, breadcrumb aanwezig, `Place` schema in `<head>`
- pSEO wijk-route: "Data Ribbon" toont Grid Status / Gem. Bouwjaar / Energy Score via `LocalStatsRibbon`
- Provincie pagina (`/noord-holland`) → grid van alle steden + sectie urgente wijken; klik op stad → `pseo_second_click` GA4 event
- Stad pagina (`/noord-holland/amsterdam`) → grid van alle wijken; CTA heeft geen `[CONVERSIE]` placeholder
- Postcode pagina (`/postcode/1012`) → sticky nav met logo + "Gratis check" knop + `CollectionPage` JSON-LD bij aanwezige data
- GDPR checkbox niet aangevinkt → submit geblokkeerd
- 6e identiek request zelfde IP op zelfde route → 429 met `Retry-After: 3600`
- Lead zonder `gdpr_consent` → webhook nooit verstuurd
- `/sitemap/noord-holland.xml` → Noord-Holland URLs incl. provincie + stad URLs
- Vision: verkeerde foto → 422 screening error, juiste foto → analyse JSON
- `npx playwright test --project=chromium` → groen (~156 tests: funnel-deep 133 + funnel-compleet 5 + step6-validatie 6 + funnel-handshake 3 + funnel-validatie 4 + leadid-hydrate 2 + wijk-validatie 3; max 1 skip als lokale pSEO-straat-data ontbreekt); volledige suite incl. `mobile-chrome` ≈ dubbel; `playwright.config` start `npm run dev` met `webServer.timeout` 180s voor trage cold starts
- `/postcode/1234` → postcode-pagina laadt met wijken in omgeving
- Rapportlink: `GET /api/leads/{uuid}?token=…` met geldige token → JSON; zonder token (zonder legacy-env) → 401; te veel requests zelfde IP → 429 op report-read namespace
- Na geslaagde lead-submit: browser-URL wordt `/check?leadId=…&token=…` (bookmark/herlaad); POST JSON bevat `reportToken`
- Root layout: `<head>` bevat WebSite JSON-LD met `SearchAction` (target: `/check?adres={search_term_string}`) + Organization schema

## Customer-first UI overhaul — voortgang

**Handoff (lees bij hervatten):** `docs/superpowers/HANDOFF-2026-07-10-customer-first-ui-overhaul.md`  
**Codex uitvoering (nu):** `docs/superpowers/CODEX-EXECUTION-PLAN.md`  
**Codex prompts (copy-paste):** `docs/superpowers/CODEX-PROMPTS.md`  
**Design spec:** `docs/superpowers/specs/2026-07-10-customer-first-ui-overhaul-design.md`  
**Vorige chat:** transcript `827f96be-974a-4a0c-9d2a-8e76dc979a14`  
**Hervatten:** ~8 augustus 2026 · model **GPT 5.6 Sol** · **1 fase/sessie** · **niet** op Auto voor fasen 1–4

| Fase | Status | Branch / merge | Plan |
|------|--------|----------------|------|
| 0 Veilige fundering | **LIVE** (jul 2026, PR #1 → `master` `527bc87`) | gemerged | `docs/superpowers/plans/2026-07-10-safe-foundation.md` |
| 1 Design system + entry | **Uitgevoerd, lokaal geverifieerd** (jul 2026; nog niet gecommit) | `feat/phase-1-design-system` | `docs/superpowers/plans/2026-07-10-design-system-conversion-entry.md` |
| 2 Funnel + analytics | Gepland | `feat/phase-2-funnel-analytics` | `docs/superpowers/plans/2026-07-10-funnel-analytics.md` |
| 3 Rapportketen | **Uitgevoerd, lokaal geverifieerd** (jul 2026; klaar voor review) | `feat/phase-3-report-chain` | `docs/superpowers/plans/2026-07-10-report-chain.md` |
| 4 Route-uitrol | Gepland | `feat/phase-4-route-rollout` | `docs/superpowers/plans/2026-07-10-route-rollout-stabilization.md` |

### Fase 1 design-systemcontract

- **Semantische kleuren (`app/globals.css`)** — `evergreen-950 #06130f`, `evergreen-900 #0b211a`, `trust #00b875`, `trust-dark #008f5b`, `action #ffb020`, `action-hover #ffc04d`, `mist #f3f7f5`, `paper #fbfdfc`, `ink #10231d`, `ink-muted #5a6d66`, `success #00b875`, `warning #d97706`, `danger #dc2626`.
- **Fonts** — `next/font` zet Bricolage Grotesque op `--font-bricolage` (koppen/kerngetallen) en DM Sans op `--font-dm-sans` (body/formulieren).
- **Gedeelde Server Components** — `components/design-system/`: `BrandMark`, `Container`, `PageShell`, `DarkHeroShell`, `ContentSection`, `SiteHeader`, `SiteFooter`, `PrimaryAction`.
- **Conversiecontext** — `lib/conversion-context.ts` bouwt en parseert `landing_path`, `pseo_level`, `provincie`, `stad`, `wijk`, `straat`, `postcode`. Primaire provincie-, stad-, wijk-, straat- en postcode-CTA's bewaren deze velden richting `/check`; de checkpagina toont de lokale context alleen ter presentatie.
- **Homepagegrens** — `app/page.tsx` en `components/home/HomePage.tsx` zijn server-composed. Alleen `AddressAutocomplete` en `SocialProofTicker` zijn client islands; discoveryqueries blijven server-side.
- **pSEO-invarianten** — metadata, canonicals, JSON-LD-structuren, ISR-waarden, routeslugs en interne hublinks zijn bewust behouden; alleen conversiehrefs en styling zijn aangepast.

**Fase 0 productie:** migratie `20260710143000_webhook_retry_payload.sql` uitgevoerd in Supabase (jul 2026).

**Nog open uit fase 0 file map:** `lib/bag-attestation.ts` (HMAC op BAG-response) — bewust uitgesteld; niet blokkerend voor fase 1.

**Tokenschatting fasen 1–4:** ~1,6M–3,4M · **~€20–55** overage op Pro bij Sol; wachten op quota-reset is aanbevolen (kwaliteit + kosten). Zie HANDOFF §12.
