import { MORE_REVIEWED_NEWS } from './reviewed-energy-articles'
/** Reviewed replacements for confirmed misleading published articles. */
export interface ReviewedNewsCopy {
  titel: string
  metaDescription: string
  intro: string
  hoofdtekst: string
  faqItems: Array<{ vraag: string; antwoord: string }>
  reviewedAt: string
  sources: Array<{ label: string; url: string }>
}

const salderingSource = {
  label: 'Rijksoverheid — einde salderingsregeling',
  url: 'https://www.rijksoverheid.nl/themas/klimaat-milieu-en-natuur/energie-thuis/salderingsregeling',
}

export const REVIEWED_NEWS_COPY: Record<string, ReviewedNewsCopy> = {
  ...MORE_REVIEWED_NEWS,
  'saldering-afgebouwd-2026-update': {
    titel: 'Salderen in 2026: geen afbouw naar 28%',
    metaDescription: 'De salderingsregeling is in 2026 niet teruggebracht naar 28%. Zij stopt op 1 januari 2027. Controleer wat dit betekent voor uw eigen stroomrekening.',
    intro: 'De eerdere kop over 28% saldering in 2026 was onjuist. De regeling blijft tot en met 31 december 2026 bestaan en stopt daarna volledig.',
    reviewedAt: '2026-10-15', sources: [salderingSource],
    hoofdtekst: `De eerdere tekst op deze pagina presenteerde een afbouw naar 28% in 2026 als geldende regel. Dat was onjuist. Een vroeger afbouwvoorstel is geen beschrijving van de huidige regeling. De wettelijke stopdatum is 1 januari 2027.

Tot en met 31 december 2026 kunt u de jaarlijks afgenomen en teruggeleverde elektriciteit volgens de salderingsregeling verrekenen. Voor een productieoverschot geldt een terugleververgoeding. De stop in 2027 maakt direct eigen gebruik belangrijker in uw vergelijking, maar bepaalt niet automatisch de opbrengst van een batterij.

Vanaf 2027 blijft een vergoeding voor teruggeleverde stroom bestaan. Tot 1 januari 2030 is het wettelijke minimum 50% van het kale leveringstarief, zonder belastingen. Terugleverkosten zijn een afzonderlijk contractonderdeel. Een bruto vergoeding is daarom niet hetzelfde als een gegarandeerde netto-opbrengst.

Vergelijk dezelfde woning met dezelfde productie en hetzelfde verbruik onder de twee regelingen. Gebruik uw eigen tarieven en kosten en bekijk een batterij pas als apart investeringsscenario. Ons controleerbare voorbeeld laat ook zien dat een batterij ongunstig kan uitpakken.`,
    faqItems: [
      { vraag: 'Geldt in 2026 nog maar 28% saldering?', antwoord: 'Nee. Dat percentage beschrijft geen geldende afbouw in 2026. De regeling stopt op 1 januari 2027.' },
      { vraag: 'Verdwijnt de terugleververgoeding ook?', antwoord: 'Nee. Een vergoeding blijft bestaan. Tot 2030 geldt een minimum van 50% van het kale leveringstarief; terugleverkosten worden apart beoordeeld.' },
      { vraag: 'Moet ik vanwege deze wijziging een batterij kopen?', antwoord: 'Dat volgt hier niet uit. Vergelijk extra eigen gebruik, verliezen, investering en contractkosten met dezelfde woning zonder batterij.' },
    ],
  },
  'thuisbatterij-subsidie-2025': {
    titel: 'Subsidie voor een thuisbatterij: controleer de regeling',
    metaDescription: 'Een thuisbatterij valt niet onder de ISDE voor woningeigenaren. Controleer een eventuele lokale regeling, voorwaarden en financiering apart van het rendement.',
    intro: 'Ga niet uit van ISDE-subsidie voor uw thuisbatterij. Een lokale subsidie, lening en financiële terugverdientijd zijn verschillende zaken.',
    reviewedAt: '2026-10-15',
    sources: [{ label: 'RVO — ISDE voor woningeigenaren', url: 'https://www.rvo.nl/subsidies-financiering/isde/woningeigenaren' }, salderingSource],
    hoofdtekst: `De ISDE voor woningeigenaren geeft geen subsidie voor de aanschaf van een thuisbatterij. Dat er binnen dezelfde regeling steun bestaat voor bepaalde andere verduurzamingsmaatregelen, betekent niet dat opslag daarvoor in aanmerking komt. Controleer een verkoopbelofte aan de hand van de officiële regeling.

Een gemeente of provincie kan eigen voorwaarden hanteren. Controleer rechtstreeks bij de betreffende overheid of een regeling bestaat, nog open is en op uw adres en aankoop van toepassing is. Neem een subsidie niet als zekere inkomstenpost op zolang uw aanspraak niet vaststaat. Deze pagina bevestigt geen lokale subsidietoekenning.

Een lening is geen subsidie: neem rente, aflossing en voorwaarden mee in uw totale kosten. Ook een eventuele fiscale behandeling is een afzonderlijke vraag. De salderingsregeling die op 1 januari 2027 stopt, verleent op zichzelf geen recht op een batterijsubsidie.

Beoordeel de batterij eerst op haar extra jaarvoordeel ten opzichte van dezelfde woning zonder opslag. Gebruik een gespecificeerde offerte, uw productie- en verbruiksprofiel, verliezen en contractkosten. Een mogelijke tegemoetkoming verandert de investering, maar bewijst geen gegarandeerd rendement.`,
    faqItems: [
      { vraag: 'Kan ik ISDE aanvragen voor een thuisbatterij?', antwoord: 'Nee, een thuisbatterij valt niet onder deze ISDE voor woningeigenaren. Controleer afzonderlijk of een andere officiële regeling op uw situatie van toepassing is.' },
      { vraag: 'Is een lening hetzelfde als subsidie?', antwoord: 'Nee. Bij financiering moet u de terugbetaling, rente en voorwaarden meenemen. Een subsidie heeft eigen toekenningsvoorwaarden.' },
      { vraag: 'Is een batterij met subsidie altijd rendabel?', antwoord: 'Nee. Een lagere investering verandert de rekensom, maar uw extra eigen gebruik, verliezen, contract en overige kosten blijven bepalend.' },
    ],
  },
  'postcoderoos-regeling-2026-deadline-zonder-eigen-dak': {
    titel: 'Postcoderoos en SCE: controleer uw eigen projectregeling',
    metaDescription: 'De oude postcoderoosregeling en de SCE zijn verschillende regelingen. Controleer de projectafspraken en actuele aanvraagronde bij RVO; ga niet af op een algemene deadline.',
    intro: 'Samen opwekken vraagt om de juiste projectregeling. Een algemene kop over een naderende deadline zegt niet welke rechten u als deelnemer heeft.',
    reviewedAt: '2026-10-15',
    sources: [{ label: 'RVO — Subsidieregeling Coöperatieve Energieopwekking', url: 'https://www.rvo.nl/subsidies-financiering/sce' }, { label: 'RVO — veelgestelde vragen SCE', url: 'https://www.rvo.nl/subsidies-financiering/sce/veelgestelde-vragen' }],
    hoofdtekst: `De oude postcoderoosregeling en de Subsidieregeling Coöperatieve Energieopwekking (SCE) zijn niet uitwisselbaar. Vraag uw coöperatie of VvE welke regeling en beschikking bij het project horen. De afspraken voor een bestaand project kunnen verschillen van de voorwaarden voor een nieuwe aanvraag.

De SCE is bedoeld voor energiecoöperaties en VvE's die gezamenlijk duurzame elektriciteit opwekken. De voorwaarden gaan onder meer over het project en de deelnemende leden. Als particuliere deelnemer kunt u de projectsubsidie niet behandelen als een vrij te besteden aanschafsubsidie voor uw eigen installatie.

Bij de controle op 15 oktober 2026 vermeldde RVO dat de aanvraagronde 2026 sloot op 1 oktober 2026 om 17.00 uur. Dat is geen algemene einddatum voor ieder bestaand project of voor al uw deelnemersrechten. Controleer de actuele RVO-pagina en uw eigen projectdocumenten voordat u een besluit neemt.

Vraag om een overzicht van uw inleg, jaarlijkse kosten, verwachte uitkeringen, risico's, looptijd en afspraken bij verhuizing of beëindiging. Onze huishoudelijke calculator is geen waardering van een coöperatief project: opbrengsten en subsidies van zo'n project mogen niet zonder meer als eigen dakproductie worden ingevoerd.`,
    faqItems: [
      { vraag: 'Is postcoderoos hetzelfde als SCE?', antwoord: 'Nee. Controleer onder welke regeling en beschikking uw eigen project valt. De voorwaarden voor een oude regeling en een nieuwe aanvraag hoeven niet gelijk te zijn.' },
      { vraag: 'Betekent sluiting van een aanvraagronde dat mijn bestaande project stopt?', antwoord: 'Dat volgt daar niet uit. Een aanvraagperiode voor nieuwe subsidie en de looptijd van een bestaand project zijn verschillende zaken.' },
      { vraag: 'Kan ik dit project met de gewone huishoudelijke scan waarderen?', antwoord: 'Niet zonder aanvullende projectberekening. Inleg, uitkeringen, projectkosten, subsidievoorwaarden en uitstapafspraken vallen buiten het huishoudmodel.' },
    ],
  },
  'energielabel-c-woningwaarde-zonnepanelen': {
    titel: 'Energielabel bij uw woning: wat is verplicht en wat zegt het?',
    metaDescription: 'De label C-plicht voor kantoren is geen algemene label C-plicht voor uw koopwoning. Lees welke woningregels gelden en hoe u maatregelen beoordeelt.',
    intro: 'Een energielabel laat zien hoe energiezuinig een woning is. Bij verkoop, verhuur en oplevering gelden labelregels. Verwar die regels niet met de afzonderlijke label C-verplichting voor kantoren of met het einde van salderen.',
    hoofdtekst: `## Welke labelregels gelden voor woningen?

Volgens de Rijksoverheid is een energielabel in beginsel nodig bij verkoop, verhuur en oplevering van een woning. Het label geeft de energieprestatie en mogelijke verbeteringen aan. Voor bijzondere gebouwen en situaties bestaan uitzonderingen; controleer de officiële uitleg voor uw situatie.

De label C-verplichting die RVO beschrijft, betreft kantoren. Die regeling bewijst geen algemene verplichting om een bestaande koopwoning vóór 2027 naar label C te brengen. Voor huurwoningen en andere gebouwtypen kunnen afzonderlijke regels gelden. Beoordeel die op hun eigen voorwaarden en data.

## Wat zegt een label over woningwaarde?

De Rijksoverheid beschrijft dat een beter energielabel invloed kan hebben op verkoop en verhuur. Dat is geen garantie voor een bepaald prijsverschil of een vaste verbetering door zonnepanelen. De staat van de woning, de maatregelen, de markt en de waardering van een koper spelen ook mee.

Vraag een energieadviseur welke maatregelen voor de energieprestatie van uw woning relevant zijn. Vergelijk de kosten en praktische gevolgen van de aangeboden opties. Een eenvoudige zonnepaneelberekening kan een officiële labelopname niet vervangen.

## Salderen is een afzonderlijke berekening

Salderen stopt op 1 januari 2027. Tot 1 januari 2030 geldt een minimumvergoeding van 50% van het kale stroomleveringstarief, zonder belastingen. Terugleverkosten zijn een afzonderlijke post. Het energielabel bepaalt uw persoonlijke leverancierstarieven niet.

Gebruik voor uw zonnepaneelberekening de opwek uit uw omvormer-app, uw verbruik en de tarieven uit uw contract. Vergelijk eerst de situatie met uw huidige panelen en uw huidige verbruikspatroon. Onderzoek daarna wat anders plannen of opslag toevoegt en welke investering daarvoor nodig is.

## Wat kunt u nu controleren?

Controleer of uw geregistreerde label nog geldig is en of de woninggegevens kloppen. Bewaar offertes en vraag naar de aannames achter beloofde verbeteringen. Houd de officiële labelbeoordeling, de mogelijke woningwaarde en de jaarlijkse elektriciteitskosten als afzonderlijke uitkomsten naast elkaar. Zo voorkomt u dat één voordeel wordt gebruikt om een andere, onbewezen belofte te onderbouwen.`,
    faqItems: [
      { vraag: 'Moet iedere koopwoning in 2027 energielabel C hebben?', antwoord: 'De hier genoemde label C-regeling is een regeling voor kantoren. Voor woningen geldt onder meer een labelplicht bij verkoop, verhuur en oplevering. Controleer eventuele aanvullende regels voor uw eigen woningtype.' },
      { vraag: 'Garanderen zonnepanelen een bepaald nieuw energielabel?', antwoord: 'Een vaste labelsprong kan niet uit deze scan worden afgeleid. Laat een energieadviseur de geregistreerde woningkenmerken en maatregelen beoordelen.' },
      { vraag: 'Vervalt elke terugleververgoeding na 2026?', antwoord: 'Nee. Salderen stopt op 1 januari 2027, maar voor teruglevering blijft een vergoeding bestaan. Tot 1 januari 2030 geldt een minimum van 50% van het kale leveringstarief; terugleverkosten staan daar los van.' },
    ],
    reviewedAt: '2026-10-13',
    sources: [
      { label: 'Rijksoverheid — energielabel woning', url: 'https://www.rijksoverheid.nl/themas/klimaat-milieu-en-natuur/energielabel-woningen-en-gebouwen/energielabel-woning' },
      { label: 'RVO — energielabel C kantoren', url: 'https://www.rvo.nl/onderwerpen/wetten-en-regels-gebouwen/energielabel-c-kantoren' },
      salderingSource,
    ],
  },
  'garantie-zonnepanelen-bescherm-investering-na-saldering': {
    titel: 'Garantie op zonnepanelen: controleer uw eigen voorwaarden',
    metaDescription: 'Lees uw zonnepaneel- en installatievoorwaarden en bewaar bewijs van een probleem. Het einde van salderen is een aparte financiële verandering.',
    intro: 'Garantievoorwaarden verschillen per product en overeenkomst. Controleer uw eigen documenten in plaats van uit te gaan van algemene beloften over looptijd, installatiekosten of overdraagbaarheid. Het einde van salderen verandert de financiële berekening van zonnestroom.',
    hoofdtekst: `## Begin bij uw eigen documenten

Leg de offerte, aankoopfactuur, installatiegegevens en garantievoorwaarden naast elkaar. Noteer welk onderdeel een probleem heeft: een paneel, omvormer, bekabeling of de installatie. Zoek op wie de betreffende toezegging heeft gedaan en welke stappen in de voorwaarden staan voor het melden van een probleem.

Maak foto's van zichtbare gebreken en bewaar relevante meldingen uit de omvormer-app. Deel alleen informatie die nodig is om het probleem te beoordelen. Vraag de verkoper of installateur schriftelijk welke beoordeling wordt uitgevoerd en of vooraf kosten worden gerekend.

## Wat moet u bij een garantiebelofte navragen?

Vraag wat precies wordt gedekt en hoe een claim wordt beoordeeld. Controleer afzonderlijk eventuele afspraken over prestaties, vervangende onderdelen, arbeid, voorrijkosten en verwijdering of terugplaatsing. Neem geen standaardduur of kostendekking aan op basis van het woord garantie alleen.

Wilt u een woning met zonnepanelen verkopen, vraag dan hoe eventuele product- of installatiegaranties kunnen worden overgedragen. Als een aanbieder niet meer bestaat, controleer welke andere contactroute uw eigen documenten vermelden. Deze check stelt niet vast wie een individuele claim moet betalen.

## Minder opbrengst is nog geen vastgestelde oorzaak

Vergelijk meetgegevens over vergelijkbare periodes en noteer veranderingen in schaduw, instellingen of storingsmeldingen. Laat een deskundige beoordelen wat een afwijking verklaart. Een lagere jaaropbrengst alleen is onvoldoende om in deze rekentool een technisch defect of gegarandeerde compensatie vast te stellen.

## Salderen blijft volledig mogelijk tot eind 2026

De salderingsregeling is in 2026 niet al gedeeltelijk afgebouwd. Zij stopt in één keer op 1 januari 2027. Er blijft een vergoeding voor teruggeleverde stroom bestaan. Deze wijziging is geen bewijs dat uw garantie verandert of dat u vóór die datum een batterij nodig heeft.

Bereken de impact met uw eigen opwek, verbruik en contracttarieven. Beoordeel de technische werking van uw installatie en een eventuele aanschaf apart. Bewaar de onderbouwing van beide beoordelingen, zodat een financiële verwachting niet wordt verward met een technische garantie.`,
    faqItems: [
      { vraag: 'Worden arbeidskosten altijd door een productgarantie betaald?', antwoord: 'Neem dat niet automatisch aan. Controleer uw eigen overeenkomst en vraag de aanbieder welke onderdelen en kosten onder de betreffende toezegging vallen.' },
      { vraag: 'Kan SaldeerScan vaststellen of mijn panelen defect zijn?', antwoord: 'Nee. De financiële scan is geen technische inspectie en beoordeelt geen individuele garantieclaim. Bewaar storingsinformatie en vraag een deskundige om beoordeling.' },
      { vraag: 'Was salderen in 2026 al gedeeltelijk afgebouwd?', antwoord: 'Nee. Salderen blijft volledig mogelijk tot en met 31 december 2026 en stopt in één keer per 1 januari 2027. Een terugleververgoeding blijft bestaan.' },
    ],
    reviewedAt: '2026-10-13',
    sources: [salderingSource],
  },
}
