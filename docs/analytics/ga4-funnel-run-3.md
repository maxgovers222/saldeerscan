# GA4-funnel RUN 3

Deze definitie gebruikt de bestaande eventnamen en payloads. De twee leesbare
stagenamen worden in GA4 afgeleid; de applicatie blijft de bestaande generieke
stage-events sturen.

## Funneldefinitie

| Stap | GA4-event | Voorwaarde |
| --- | --- | --- |
| 1 | `pseo_check_cta` | Klik op een CTA vanaf een pSEO-pagina |
| 2 | `address_entry_start` | Eerste invoer in het adresveld |
| 3 | `address_entry_submit` | Geselecteerd adres wordt ingestuurd |
| 4 | `funnel_session_started` | Een nieuwe `/check`-funnelsessie start |
| 5 | `bag_match_succeeded` | BAG-match slaagt |
| 6 | `stage_2_completed` | Afgeleid van `funnel_stage_completed` met `completed_stage = 2` |
| 7 | `stage_4_viewed` | Afgeleid van `funnel_stage_viewed` met `funnel_stage = 4` |
| 8 | `lead_submit_succeeded` | Lead is succesvol opgeslagen |

De eerste drie stappen zijn acquisitie-diagnostiek. Gebruik voor de
productfunnel een open funnel vanaf `funnel_session_started`: bezoekers kunnen
ook rechtstreeks op `/check` landen of een vooraf ingevuld adres meenemen.

## Eenmalige GA4-inrichting

1. Maak event-scoped custom dimensions voor `landing_path` en `pseo_level`.
2. Gebruik de ingebouwde dimensie **Device category** voor `device`; stuur geen
   extra clientparameter.
3. Maak het afgeleide event `stage_2_completed` met:
   `event_name = funnel_stage_completed` en `completed_stage = 2`.
4. Maak het afgeleide event `stage_4_viewed` met:
   `event_name = funnel_stage_viewed` en `funnel_stage = 4`.
5. Markeer `lead_submit_succeeded` als key event.
6. Registreer `funnel_session_id` niet als custom dimension: die waarde is
   alleen bedoeld voor technische kwaliteitscontrole en heeft hoge cardinaliteit.

## Verkenning en KPI

Maak in GA4 Explore een open funnel met de acht stappen hierboven. Voeg
breakdowns toe voor `landing_path`, `pseo_level` en de ingebouwde
`Device category`. Rapporteer daarnaast twee deel-funnels:

- acquisitie: `pseo_check_cta` → `funnel_session_started`;
- product: `funnel_session_started` → `bag_match_succeeded` →
  `stage_2_completed` → `stage_4_viewed` → `lead_submit_succeeded`.

De primaire lead-CVR is:

`event count(lead_submit_succeeded) / event count(funnel_session_started)`

Gebruik voor lage volumes minimaal een voortschrijdend venster van 14 dagen en
toon absolute aantallen naast percentages. De code stuurt per funnelsessie één
`funnel_session_started` en maximaal één `lead_submit_succeeded`.

## Datakwaliteit

- `landing_path` en `pseo_level` blijven van instroom tot lead gelijk.
- `funnel_session_id` koppelt events binnen één funnel, maar bevat geen
  gebruikers- of contactgegevens.
- Adres, naam, e-mail, telefoon, lead-id en rapporttoken worden nooit naar GA4
  gestuurd.
- `address_entry_submit` telt submitpogingen. Gebruik
  `bag_match_succeeded` als de succesvolle adresstap.
