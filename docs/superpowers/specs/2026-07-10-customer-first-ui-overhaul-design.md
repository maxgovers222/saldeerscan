# Design Spec: Customer-first UI-overhaul

**Datum:** 2026-07-10  
**Status:** Goedgekeurd  
**Visuele richting:** Customer-first Hybrid  
**Uitvoeringsaanpak:** Conversion-first systeemoverhaul  
**Primair succescriterium:** Meer volledig ingevulde, gekwalificeerde leads  

---

## 1. Context

SaldeerScan.nl is een pSEO-leadfabriek voor de Nederlandse energiemarkt. Bezoekers landen via homepage, provincie-, stad-, wijk-, straat- en postcodepagina's en converteren via de funnel naar een technisch dossier voor installateurs. De kernurgentie is het einde van salderen per 1 januari 2027.

Google Search Console laat zien dat indexatie niet langer het primaire knelpunt is. De volgende groeifase draait om:

- meer vertrouwen bij organische bezoekers;
- een lagere drempel van landingspagina naar adrescheck;
- minder uitval in de funnel;
- een consequente waarde-uitwisseling bij leadcapture;
- betrouwbare levering van rapport, PDF en B2B-dossier.

De gekozen richting gebruikt de rust, hiërarchie en interactiekwaliteit die de gebruiker waardeert in Revolut, zonder Revolut visueel te kopiëren of SaldeerScan als fintech-/cryptoproduct te positioneren.

---

## 2. Doelgroep

Primaire doelgroep:

- Nederlandse woningeigenaren, globaal 35–65 jaar;
- geen energie- of installatietechnische experts;
- willen snel begrijpen wat stoppen met salderen financieel betekent;
- verwachten betrouwbaarheid, privacy en begrijpelijke onderbouwing;
- gebruiken mobiel, tablet en desktop;
- kunnen afhaken bij veel jargon, kleine bedieningselementen of onduidelijke vervolgstappen.

Secundaire doelgroep:

- installateurs en B2B-inkopers die een compleet, betrouwbaar en commercieel bruikbaar technisch dossier verwachten.

De consumenteninterface optimaliseert voor begrip en vertrouwen. Technische details blijven beschikbaar voor bewijsvoering en B2B-kwaliteit, maar worden via progressive disclosure aangeboden.

---

## 3. Doelen

### 3.1 Primair

Het percentage bezoekers verhogen dat de funnel volledig afrondt en als gekwalificeerde lead wordt opgeslagen.

### 3.2 Secundair

- Meer organische bezoekers laten starten met een adrescheck.
- Uitval per funnelonderdeel meetbaar verlagen.
- Het aandeel succesvolle PDF-generaties verhogen.
- De kwaliteit en volledigheid van technische dossiers behouden of verhogen.
- Webrapport, e-mail, PDF en B2B-payload inhoudelijk synchroniseren.
- De website op alle ondersteunde viewports zonder horizontale overflow, hydration-flash of onbruikbare bediening renderen.

### 3.3 Niet-doelen

- Revolut pixel-voor-pixel kopiëren.
- Een volledig nieuwe merkidentiteit of nieuw logo ontwerpen.
- Extra pagina's laten indexeren als doel op zichzelf.
- Niet-onderbouwde social proof, responstijden of partnerbeloftes toevoegen.
- Alle routes in één oncontroleerbare big-bang wijziging omzetten.

---

## 4. Ontwerpprincipes

### 4.1 Eerst de klantvraag

Elke primaire pagina beantwoordt eerst:

> Wat betekent stoppen met salderen voor mijn woning en wat kan ik nu doen?

BAG, AI, netcongestie en technische termen ondersteunen het antwoord, maar zijn niet de openingsboodschap.

### 4.2 Eén dominante actie per scherm

Per viewport staat maximaal één dominante amberkleurige CTA. Secundaire acties zijn visueel rustiger en concurreren niet met de volgende stap.

### 4.3 Waarde vóór gegevens

De bezoeker ziet persoonlijke waarde voordat contactgegevens worden gevraagd. De leadcapture legt expliciet uit welke tegenprestatie volgt:

- persoonlijk rapport;
- volledige PDF;
- e-mailbevestiging;
- alleen met aparte toestemming: contact door een partner.

### 4.4 Progressive disclosure

De kernuitkomst is direct zichtbaar. Technische uitleg, scenario's, grafieken en details worden:

- op mobiel via accordions of vervolgpanelen getoond;
- op desktop standaard uitgebreider weergegeven;
- volledig in de PDF opgenomen.

### 4.5 Vertrouwen zonder druktrucs

- Alleen feitelijke deadline-urgentie rond 1 januari 2027.
- Geen verzonnen aantallen of kunstmatige schaarste.
- Geen impliciete SLA voordat die contractueel bestaat.
- Privacy en toestemming staan in gewone taal bij het beslismoment.

### 4.6 Device-safe als systeemregel

Responsiviteit wordt niet achteraf per component gerepareerd. Alle primitives voldoen standaard aan:

- `min-width: 0` waar flex/grid-kinderen kunnen krimpen;
- geen viewport-brede elementen binnen containers;
- invoer minimaal 16px op mobiel;
- touch targets minimaal 44×44px;
- veilige sticky actions;
- geen horizontale scroll;
- reduced-motion ondersteuning;
- consistente SSR/hydration-output.

---

## 5. Visuele richting: Customer-first Hybrid

### 5.1 Karakter

- Premium en rustig.
- Vertrouwd Nederlands energieadvies.
- Financiële cijfers helder en scanbaar.
- Technische geloofwaardigheid beschikbaar zonder dashboard-overload.
- Niet klinisch wit en niet volledig donker.

### 5.2 Kleurrollen

- **Deep evergreen `#06130f`** — navigatie, hero, focusmomenten en donkere shells.
- **Evergreen mid `#0b211a`** — donkere kaarten en gelaagde secties.
- **Trust green `#00b875`** — merk, succes, validatie en voortgang.
- **Action amber `#ffb020`** — primaire CTA en financieel aandachtspunt.
- **Mist surface `#f3f7f5`** — formulieren en leesintensieve secties.
- **Paper surface `#fbfdfc`** — verhoogde kaarten binnen mist, niet als paginabrede witte achtergrond.
- **Ink `#10231d`** — hoofdtekst op lichte surfaces.

Negatief financieel effect mag rood gebruiken wanneer semantisch noodzakelijk. Netcongestiestatussen behouden hun bestaande statuskleuren.

### 5.3 Typografie

- Bricolage Grotesque blijft voor koppen en kerngetallen.
- DM Sans blijft voor body, labels en formulieren.
- Monospace uitsluitend voor bedragen, scores en technische data.
- Koppen krijgen sterke hiërarchie en compacte tracking; bodytekst krijgt ruime regelhoogte.

### 5.4 Vormtaal

- Grote, functionele radii; geen decoratieve pill-vorm op elk element.
- Dunne grenzen en subtiele schaduwen in plaats van zware glassmorphism overal.
- Glass-effect alleen waar het informatiehiërarchie ondersteunt.
- Inline SVG-iconen, emoji-vrij.
- Animatie ondersteunt voortgang of status; geen continue decoratieve beweging.

---

## 6. Klantreis

### 6.1 Landing

Homepage en pSEO-landingspagina's gebruiken dezelfde conversielogica:

1. Heldere lokale of algemene belofte.
2. Eén adresinvoer of CTA naar adresinvoer.
3. Drie concrete vertrouwenssignalen.
4. Voorbeeld van het persoonlijke inzicht.
5. Verdere uitleg en technische onderbouwing lager op de pagina.

Wijk-, straat- en postcodecontext blijft bewaard wanneer de bezoeker de funnel opent. Een wijk-CTA mag niet landen op een generieke lege stap zonder duidelijke lokale context.

### 6.2 Persoonlijk inzicht

Na een geldig adres worden BAG, netcongestie en basis-ROI opgehaald. De interface toont zo vroeg mogelijk:

- verwacht financieel effect vanaf 2027;
- woningfit of energiescore;
- aanbevolen vervolgstap;
- welke informatie de uitkomst nauwkeuriger maakt.

### 6.3 Funnel

De hoofdroute bestaat uit vier conceptuele stappen:

1. **Adres & woning**
   - BAG-verificatie;
   - postcode en netcongestie;
   - woningkenmerken.

2. **Uw situatie**
   - huidig verbruik;
   - bestaande zonnepanelen;
   - dakoppervlak en dakrichting;
   - ROI-scenario.

3. **Dossier nauwkeuriger maken**
   - meterkast;
   - plaatsingslocatie;
   - omvormer.

   Deze drie analyses worden één optionele technische module. Elke scan legt uit wat die aan het rapport toevoegt. Overslaan is toegestaan en wordt analytisch gemeten.

4. **Rapport ontvangen**
   - naam, e-mail en telefoon;
   - eigenaarschap en relevante kwalificatie;
   - expliciete AVG-toestemming;
   - heldere uitleg van rapport, PDF en eventueel partnercontact.

De bestaande onderliggende reducer-acties en data kunnen tijdens migratie behouden blijven. De visuele vierstappenstructuur hoeft niet onmiddellijk een destructieve herbouw van alle state te betekenen.

### 6.4 Resultaat

Na succesvolle submit:

1. Altijd een zichtbare bevestiging dat de aanvraag is ontvangen.
2. Bevestigen of de e-mail is verzonden; bij e-mailfout geen onjuiste succesclaim.
3. Kernresultaat tonen.
4. PDF-download aanbieden.
5. Technische details afhankelijk van viewport compact of uitgebreid tonen.

---

## 7. Responsive gedrag

### 7.1 Mobiel

- Eén kolom.
- Compacte sticky header.
- Voortgang en geschatte resterende tijd zichtbaar.
- Kernvraag bovenaan; toelichting direct eronder.
- Antwoordopties als grote keuze-kaarten.
- Sticky CTA onderaan met safe-area padding.
- Rapport: kernuitkomst, twee ondersteunende metrics, accordions en PDF-CTA.

### 7.2 Tablet

- Eén brede leeskolom of gecontroleerde tweekolomsverdeling.
- Geen desktop-grid dat alleen kleiner wordt geschaald.
- Formulier en uitleg mogen naast elkaar wanneer beide leesbaar blijven.

### 7.3 Desktop

- Landinghero mag copy en inzichtpreview naast elkaar tonen.
- Funnel blijft bewust smaller dan het rapport.
- Rapport gebruikt een bredere grid met dezelfde inhoud als mobiel.
- Geen mobiele layout die na hydration naar desktop verspringt.

### 7.4 Breakpoints en verificatie

Minimaal visueel verifiëren op:

- 360px;
- 390px;
- 768px;
- 1024px;
- 1440px.

Breekpunten volgen inhoud en niet alleen apparaattype.

---

## 8. Componentarchitectuur

De overhaul introduceert gedeelde primitives in plaats van route-specifieke classreeksen.

### 8.1 Shells

- `SiteHeader`
- `PageShell`
- `DarkHeroShell`
- `ContentSection`
- `FunnelShell`
- `ReportShell`

### 8.2 Conversiecomponenten

- `ConversionHero`
- `AddressEntryCard`
- `TrustSignals`
- `InsightPreview`
- `PrimaryAction`
- `StickyActionBar`

### 8.3 Formuliercomponenten

- `StepIntro`
- `ChoiceCard`
- `ChoiceGroup`
- `Field`
- `InlineExplanation`
- `ProgressHeader`
- `ValidationMessage`

### 8.4 Rapportcomponenten

- `SubmissionStatus`
- `ReportSummary`
- `ReportMetric`
- `ReportSection`
- `ReportAccordion`
- `ReportAlert`
- `PdfAction`

Componentnamen zijn richtinggevend. Het implementatieplan bepaalt welke bestaande componenten worden uitgebreid en welke nieuwe grenzen daadwerkelijk nodig zijn.

---

## 9. Dataflow en betrouwbaarheid

### 9.1 Funnelstate

- Voortgang blijft lokaal hervatbaar.
- URL-context (`adres`, `wijk`, `stad`, `leadId`, `token`) heeft expliciete prioriteitsregels.
- Oude sessiestate mag actuele URL-context niet stil overschrijven.
- Herstel toont een duidelijke keuze en herstelt alle relevante velden.

### 9.2 Server-validatie

Commerciële dossierdata mag niet uitsluitend uit client-JSON worden vertrouwd.

- ROI en health score worden server-side gevalideerd of gereconstrueerd.
- Partnerfilters gebruiken gevalideerde serverdata.
- Vision-resultaten krijgen structuurvalidatie en, waar haalbaar, sessie-/tijdkoppeling.

### 9.3 Eén rapportmodel

Webrapport, e-mail, PDF en B2B-payload gebruiken dezelfde genormaliseerde rapportdata. Dit voorkomt verschillen in:

- aantal panelen;
- aanbevolen batterij;
- besparing;
- investering;
- terugverdientijd;
- netcongestiestatus;
- technische scanresultaten.

### 9.4 B2B-levering

De webhookretry wordt vóór of parallel aan de conversie-uitrol gerepareerd:

- retry bouwt dezelfde payload opnieuw op;
- payload wordt opnieuw ondertekend;
- body en vereiste headers worden meegestuurd;
- backoff en cronfrequentie zijn op elkaar afgestemd;
- mislukte leveringen zijn observeerbaar.

---

## 10. Loading, fouten en herstel

### 10.1 Loading

Gebruik concrete statusberichten:

- woninggegevens ophalen;
- netcapaciteit controleren;
- besparing berekenen;
- rapport samenstellen.

De interface behoudt afmetingen tijdens loading om layout shift te beperken.

### 10.2 Validatie

- Fouten staan bij het relevante veld.
- De eerste fout krijgt focus na submit.
- Status wordt via `aria-live` aangekondigd.
- Geldige invoer wordt niet gewist door een fout elders.

### 10.3 API-fouten

Elke externe afhankelijkheid heeft:

- een begrijpelijke foutmelding;
- opnieuw-proberen;
- waar mogelijk handmatige fallback;
- behoud van ingevulde gegevens.

### 10.4 PDF

- Nieuw tabblad wordt synchroon geopend wanneer nodig voor mobiele browserbeperkingen.
- Blobgeneratie heeft een directe-downloadfallback.
- Foutstatus sluit een leeg tabblad en toont retry.
- PDF-inhoud wordt in een echte generatietest gecontroleerd.

### 10.5 E-mail

De UI claimt alleen dat een e-mail is verzonden wanneer die status betrouwbaar bekend is. De aanvraag kan nog steeds opgeslagen zijn als e-mail faalt; de interface maakt dit onderscheid duidelijk.

---

## 11. Toegankelijkheid

Minimale acceptatie:

- WCAG AA-contrast voor tekst en bediening.
- Alle interactieve elementen toetsenbordbereikbaar.
- Zichtbare `:focus-visible`.
- Toggle-/keuzeknoppen gebruiken `aria-pressed` of passende radiogroup-semantiek.
- Adresautocomplete volgt het combobox/listbox-patroon.
- Uploadzone werkt met toetsenbord en heeft een echte knop/label.
- Status, loading en fouten zijn aangekondigd.
- Reduced-motion wordt gerespecteerd.
- Decoratieve SVG's zijn verborgen voor assistieve technologie.

---

## 12. Performance

- Server Components blijven de standaard voor contentpagina's.
- Alleen interactieve eilanden worden client-side.
- Funnelstappen en rapportcode worden geladen wanneer nodig.
- `@react-pdf/renderer` blijft buiten de initiële bundle.
- Ongebruikte Mapbox-/UI-dependencies worden tijdens implementatie geverifieerd en zo mogelijk verwijderd.
- Afbeeldingen en fonts veroorzaken geen cumulatieve layout shift.
- Geen runtime viewport-switch die eerst mobiel en daarna desktop rendert.

Performancebudgetten worden in het implementatieplan gekwantificeerd op basis van een baseline-build en browsermeting.

---

## 13. Analytics en succesmeting

### 13.1 Primaire metric

Volledig afgeronde, gekwalificeerde leads gedeeld door unieke funnelsessies.

### 13.2 Secundaire metrics

- pSEO-/homepagebezoek naar adresstart;
- adresstart naar geldige BAG-match;
- uitval per conceptuele funnelstap;
- voltooiing/skip per technische scan;
- lead-submit succes;
- e-mailstatus;
- PDF-generatie en download/open-succes;
- bronpad en pSEO-niveau;
- rapportheropening via e-maillink.

### 13.3 Attributie

Organische landingscontext wordt ook zonder UTM opgeslagen. Events gebruiken consistente namen en bevatten waar relevant:

- `landing_path`;
- `pseo_level`;
- `provincie`;
- `stad`;
- `wijk`;
- `funnel_step`;
- `scan_completion`;
- `lead_quality_segment`.

Met het huidige verkeer wordt eerst een betrouwbare 28-daagse voor/na-vergelijking gebruikt. A/B-tests volgen pas bij voldoende volume.

---

## 14. Uitvoeringsfasen

### Fase 0 — Veilige fundering

- Webhookretry repareren.
- Server-side leadvalidatie aanscherpen.
- CI toevoegen voor typecheck, build en kern-E2E.

### Fase 1 — Design system en shells

- Tokens centraliseren.
- Gedeelde primitives en responsive containers maken.
- Header, footer, feedbackstates en CTA-patronen harmoniseren.

### Fase 2 — Conversiepad

- Homepage.
- pSEO-CTA-overgang naar adresinvoer.
- Vierdelige visuele funnel.
- Leadcapture.
- Resultaatdashboard.
- E-mail en PDF.

### Fase 3 — Volledige website

- Provincie-, stad-, wijk-, straat- en postcodepagina's.
- Kennisbank en nieuws.
- Privacy en overige kernpagina's.

### Fase 4 — Stabilisatie

- Accessibility pass.
- Mobile/desktop visual regression.
- Performance optimalisatie.
- Analyticsvalidatie.
- Documentatie bijwerken.

### 14.1 Implementatiedecompositie

Deze scope is te groot voor één monolithisch uitvoerplan. De implementatie wordt daarom opgesplitst in vijf opeenvolgende, afzonderlijk verifieerbare plannen:

1. **Veilige fundering**
   - webhookretry;
   - server-side leadvalidatie;
   - CI-basis.

2. **Design system en conversie-entry**
   - tokens en primitives;
   - header/footer/shells;
   - homepage;
   - pSEO-naar-adresovergang.

3. **Funnel en analytics**
   - visuele vierstappenstructuur;
   - optionele technische module;
   - stateherstel;
   - bron- en uitvalmeting.

4. **Rapportketen**
   - gedeeld rapportmodel;
   - mobiel/desktop resultaat;
   - e-mail;
   - PDF;
   - report-link hydration.

5. **Volledige route-uitrol en stabilisatie**
   - pSEO- en contentroutes;
   - accessibility;
   - performance;
   - volledige responsive regressie.

Elk plan eindigt met eigen tests en een reviewcheckpoint voordat het volgende plan start. Gedeelde design primitives worden eerst gestabiliseerd om gelijktijdige wijzigingen aan dezelfde bestanden te voorkomen.

---

## 15. Teststrategie

### 15.1 CI

Minimaal:

1. `npm ci`
2. TypeScript-check
3. Production build
4. Playwright Chromium
5. Gerichte mobiele tests

### 15.2 E2E

Nieuwe of aangepaste tests voor:

- pSEO-context naar adresroute;
- vier conceptuele funnelstappen;
- hervatten van state;
- optionele technische scans;
- succesvolle leadsubmit met zichtbare bevestiging;
- mobiel rapport versus desktoprapport;
- PDF-generatie;
- report-token hydration;
- geen horizontale overflow op kernviewports.

Vaste `waitForTimeout`-calls worden waar mogelijk vervangen door toestand- of netwerkgebaseerde waits.

### 15.3 Backend-integratie

- Partnerretry verstuurt body en geldige signature.
- Partnerfilter gebruikt server-gevalideerde score.
- E-mailstatus wordt correct teruggegeven.
- Ongeldige/te grote vision-input stopt vóór betaalde modelcalls.

### 15.4 Handmatige visuele QA

Kernroutes:

- `/`
- `/check`
- één provincie;
- één stad;
- twee wijken;
- één straat;
- één postcode;
- kennisbankoverzicht en artikel;
- nieuwsoverzicht en artikel;
- privacy;
- mobiel en desktop resultaatrapport.

---

## 16. Acceptatiecriteria

De overhaul is gereed wanneer:

- alle routes het Customer-first Hybrid systeem gebruiken;
- de conversieroute één consistente primaire actie per scherm heeft;
- de visuele funnel vier conceptuele stappen toont;
- technische scans als één optionele nauwkeurigheidsmodule werken;
- submit altijd een betrouwbare bevestigingsstatus toont;
- webrapport, e-mail, PDF en B2B-data hetzelfde rapportmodel gebruiken;
- kernroutes geen horizontale overflow hebben op 360–1440px;
- er geen hydration warnings of mobiel-naar-desktop flash is;
- toetsenbordbediening en statusaankondiging werken;
- PDF-download op mobiel en desktop werkt;
- webhookretry geldige, ondertekende dossiers opnieuw levert;
- CI typecheck, build en kern-E2E afdwingt;
- analytics de volledige bron-tot-leadroute kan reconstrueren;
- CLAUDE.md de nieuwe architectuur en actuele state-key/flow documenteert.

---

## 17. Risico's en mitigatie

### Risico: te grote wijziging

**Mitigatie:** conversion-first fasering, route-voor-route migratie en gedeelde componenten vóór brede uitrol.

### Risico: conversiedaling door nieuwe funnelstructuur

**Mitigatie:** bestaande state/data behouden, analytics vóór migratie repareren en 28-daagse voor/na-meting.

### Risico: technische dossierkwaliteit daalt wanneer scans optioneel zijn

**Mitigatie:** duidelijk voordeel per scan, volledigheidsscore en meten van skip versus partnerkwaliteit.

### Risico: lichte surfaces herhalen het oude witte-rapportprobleem

**Mitigatie:** mist/paper alleen als ingebedde leeslaag binnen evergreen shells; geen paginabrede harde witte rapportachtergrond.

### Risico: SEO-regressie tijdens pSEO-reskin

**Mitigatie:** server-rendering, canonical, metadata, JSON-LD, breadcrumbs en bestaande ISR-semantiek behouden en testen.

---

## 18. Besluiten

- Customer-first Hybrid is gekozen boven Pure Revolut en Engineering Premium.
- Conversie-first fasering is gekozen boven big-bang en cosmetische reskin.
- Gekwalificeerde leadvoltooiing is de primaire metric.
- De drie technische fotoscans worden één optionele nauwkeurigheidsmodule.
- De bestaande green/amber-identiteit blijft behouden, met deep evergreen en mist-surfaces als nieuwe systeemlaag.
- Indexatie-uitbreiding is geen primaire werkstroom; CTR, intent, conversie en betrouwbaarheid wel.

