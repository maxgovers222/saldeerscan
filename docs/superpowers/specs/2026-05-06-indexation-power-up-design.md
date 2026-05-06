# Design Spec: Indexation Power-Up — Wijk pagina SEO

**Datum:** 2026-05-06  
**Scope:** `app/[provincie]/[stad]/[wijk]/page.tsx` only  
**Doel:** Google bewijzen dat elke wijk-pagina unieke waarde heeft

---

## Probleemstelling

1.868 pagina's "Ontdekt — momenteel niet geïndexeerd". Oorzaak: Google ziet te veel overeenkomst tussen pagina's (thin content-signaal). Bestaande unieke elementen (FAQPage JSON-LD, AI-content, gerelateerde wijken) zijn al aanwezig maar onvoldoende.

---

## Wat er al goed is (niet aanpassen)

- **FAQPage JSON-LD** — `@graph` met WebPage + FAQPage, 5 Gemini-vragen per wijk ✅
- **"Andere wijken in stad"** — max 6 wijken met Energy Score + bouwjaar ✅
- **AI-hoofdtekst** — 800w hyperlocale content via Gemini ✅

---

## Wijzigingen

### 1. Meta-title verbetering

**Vóór:**
```
{page.titel} | SaldeerScan {wijk} {stad} — 2027 check (fallback)
```

**Na:**
- DB-titel: ongewijzigd (Gemini kwaliteit, bewaard)
- Fallback: `{Wijk}: Voorkom €{verlies} verlies per 2027 — SaldeerScan`

**Meta-description (alle pagina's):**
```
Gratis 2027 saldeercheck: woningen in {wijk} riskeren €{verlies}/jaar na 1 jan 2027.
BAG-data, AI-analyse en persoonlijk investeringsrapport.
```
*Verlies-berekening gedupliceerd uit Page-component naar generateMetadata (zelfde formule).*

---

### 2. Renovatie-Intelligence tekstblok (nieuw)

**Positie:** In de 2-koloms Wijkanalyse sectie, ná "Netwerkbeperkingen" card, vóór FAQ.

**Variatie-mechanisme:**
```typescript
// era selector (5 ranges)
bouwjaar < 1945  → era 'historisch'
bouwjaar < 1965  → era 'naoorlogs'
bouwjaar < 1985  → era 'jaren70-80'
bouwjaar < 2000  → era 'jaren90'
bouwjaar >= 2000 → era 'modern'
null             → era 'onbekend'

// sub-template selector (0-2) — deterministisch op wijk slug
const t = (charCodeSum(wijk) % 3)
```

**Templates per era (3 per era = 18 unieke varianten):**

| Era | Template 0 | Template 1 | Template 2 |
|---|---|---|---|
| historisch | "Hoewel BAG-data..." | "Panden uit voor 1945 zijn..." | "Het historisch karakter van {wijk}..." |
| naoorlogs | "De naoorlogse bouw in {wijk}..." | "Woningen gebouwd na 1945..." | "In naoorlogse wijken zoals {wijk}..." |
| jaren70-80 | "De BAG-data registreert bouwjaar {yr}..." | "Woningen uit de jaren '70-'80 in {wijk}..." | "Hoewel {wijk} zijn oorsprong..." |
| jaren90 | "Woningen uit de jaren '90..." | "De overgangsgeneratie in {wijk}..." | "Bouwjaar {yr} is het startpunt..." |
| modern | "Moderne woningen in {wijk}..." | "Energiezuinige nieuwbouw..." | "Na 2000 gebouwde woningen..." |
| onbekend | (generiek) | | |

Elk template eindigt altijd met dezelfde amber-highlighted call-to-action:
> "→ Heeft u na de aankoop geïsoleerd of dubbel glas geplaatst? Uw werkelijke rendement is waarschijnlijk **15–20% hoger** dan deze basis-analyse."

**Design:**
- Container: `bg-amber-950/20 border border-amber-500/25 rounded-2xl p-6 sm:p-7`
- Label boven: `text-xs uppercase tracking-widest` in amber — "Renovatie-Inzicht"
- Headline: `font-extrabold text-white`
- Tekst: `text-sm text-white/60 leading-relaxed`
- Amber highlight op "15–20% hoger": `font-bold text-amber-400`

---

## Technische randvoorwaarden

- Alles pure Server Component — geen client code nodig
- Geen nieuwe API-calls, geen Gemini — volledig statisch computed
- Geen Lucide icons — inline SVG (bestaande conventie)
- Tailwind v4 CSS-first — geen nieuwe config nodig
- ISR revalidate blijft 7d (604800s)
- Labour Illusion op `/check` pagina onaangetast (andere route)

---

## Scope-afbakening

**In scope:** `app/[provincie]/[stad]/[wijk]/page.tsx` — twee wijzigingen (generateMetadata + renovatie-sectie)  
**Out of scope:** andere routes, seed-scripts, DB-schema, FAQPage JSON-LD (al goed)
