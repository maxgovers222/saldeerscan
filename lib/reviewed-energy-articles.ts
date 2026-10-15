import type { ReviewedNewsCopy } from './reviewed-news'

// Authored corrections of the audited corpus. These are read-time replacements,
// not a publication job or permission to change production rows.
const source = (label: string, url: string) => ({ label, url })
const law = source('Rijksoverheid — einde salderingsregeling', 'https://www.rijksoverheid.nl/themas/klimaat-milieu-en-natuur/energie-thuis/salderingsregeling')
const contract = source('ACM ConsuWijzer — energiecontract vergelijken', 'https://consument.acm.nl/elektriciteit-en-gas/overstappen-vergelijken-en-verhuizen/tips-bij-het-kiezen-van-een-energieleverancier?vergelijkingspunt=zon')
const solar = source('RVO — wetgeving zonne-energie', 'https://www.rvo.nl/onderwerpen/zonne-energie/wetgeving')
const isde = source('RVO — ISDE voor woningeigenaren', 'https://www.rvo.nl/subsidies-financiering/isde/woningeigenaren')
const sce = source('RVO — coöperatieve energieopwekking', 'https://www.rvo.nl/subsidies-financiering/sce')
const sceFaq = source('RVO — vragen over SCE en postcoderoos', 'https://www.rvo.nl/subsidies-financiering/sce/veelgestelde-vragen')
const guarantee = source('ACM ConsuWijzer — rechten bij verduurzaming', 'https://consument.acm.nl/energietransitie/wat-zijn-mijn-rechten-bij-verduurzaming-van-mijn-huis')
const grid = source('Liander — omvormer schakelt uit', 'https://www.liander.nl/storingen-en-onderhoud/spanningsproblemen/omvormer-schakelt-uit')
const capacity = source('Netbeheer Nederland — capaciteitskaart', 'https://capaciteitskaart.netbeheernederland.nl/')
const permit = source('Rijksoverheid — het Omgevingsloket', 'https://www.rijksoverheid.nl/themas/bouwen-en-wonen/omgevingswet/omgevingsloket')
const label = source('Rijksoverheid — energielabel woning', 'https://www.rijksoverheid.nl/themas/klimaat-milieu-en-natuur/energielabel-woningen-en-gebouwen/energielabel-woning')
const heat = source('RVO — warmtepomp', 'https://www.rvo.nl/onderwerpen/duurzaam-verwarmen-koelen/warmtepomp')
const tenant = source('Rijksoverheid — huurwoning verbouwen', 'https://www.rijksoverheid.nl/documenten/vraag-en-antwoord/woning-huren/mag-ik-mijn-huurwoning-verbouwen-of-renoveren')
const charging = source('RVO — elektrisch vervoer', 'https://www.rvo.nl/onderwerpen/elektrisch-vervoer')

function copy(titel: string, intro: string, paragraphs: string[], faq: [string, string][], sources: ReviewedNewsCopy['sources']): ReviewedNewsCopy {
  return { titel, intro, metaDescription: intro, hoofdtekst: paragraphs.join('\n\n'),
    faqItems: faq.map(([vraag, antwoord]) => ({ vraag, antwoord })), reviewedAt: '2026-10-15', sources }
}

export const MORE_REVIEWED_NEWS: Record<string, ReviewedNewsCopy> = {
  'dynamisch-energiecontract-zonnepanelen-voordelen-risicos': copy(
    'Dynamisch energiecontract met zonnepanelen: vergelijk uw tijdprofiel',
    'Een dynamisch contract kan anders uitpakken per verbruiks- en opwekmoment. Vergelijk kosten en risico’s met uw eigen meetgegevens.',
    [
      'De eerdere tekst koppelde een dynamisch contract aan een afbouw van salderen naar 28% in 2026. Die afbouw geldt niet. Salderen stopt op 1 januari 2027; de contractkeuze is een afzonderlijke vergelijking.',
      'Bij een dynamisch contract verandert de stroomprijs gedurende de dag. Volgens ACM ConsuWijzer is daardoor vooraf geen betrouwbare jaarrekening te voorspellen. Een lage gemiddelde marktprijs bewijst niet dat uw eigen stroomafname op goedkope momenten valt.',
      'Vraag hoe de leverancier afname, teruglevering, opslag, belastingen en vaste kosten afrekent. Leg uw productie- en verbruiksmomenten naast die voorwaarden. Verbruik verschuiven is alleen een voordeel voor zover het werkelijk uitvoerbaar is en de totale kosten dalen.',
      'De SaldeerScan-jaarvergelijking gebruikt vaste ingevoerde tarieven. Zij simuleert geen kwartierprijzen, handelsopbrengsten of een automatisch laadplan. Gebruik haar om aannames te vergelijken; voor deze contractkeuze is aanvullend een berekening met tijdgegevens nodig.',
    ], [['Is dynamisch altijd goedkoper met zonnepanelen?', 'Nee. Uw tijdprofiel en alle contractkosten bepalen de uitkomst.'], ['Kan de jaarcalculator de dynamische jaarrekening voorspellen?', 'Nee. Het model rekent met vaste tarieven en bevat geen prijsreeks per kwartier.']], [contract, law]),
  'energiebelasting-teruggave-vervalt': copy(
    'Energiebelasting en salderen: houd de rekeningposten uit elkaar',
    'Het einde van salderen verandert de verrekening van zonnestroom. Dat is geen algemene uitspraak dat iedere belastingvermindering verdwijnt.',
    [
      'De eerdere kop over het vervallen van energiebelastingteruggave was te algemeen. Onderscheid saldering van terugleververgoeding, terugleverkosten en de afzonderlijke belastingposten op uw energierekening.',
      'Tot en met 2026 wordt teruggeleverde stroom binnen de salderingsregeling jaarlijks verrekend met afgenomen stroom. Vanaf 2027 stopt die verrekening. Over zelf opgewekte stroom die u direct gebruikt, betaalt u geen energiebelasting of leverancierskosten.',
      'Direct eigen gebruik voorkomt dus een deel van uw stroominkoop. Dat maakt nog geen bepaald bedrag aan belastingteruggave of batterijrendement zeker. Controleer voor ieder jaar de belastingregels en uw eigen rekening, en vraag uw leverancier om uitleg bij onduidelijke posten.',
      'Vul in de calculator het totale leveringstarief inclusief belasting in. Het kale tarief is een apart veld, onder meer om de wettelijke bruto vergoedingsgrens te kunnen beoordelen. Tel belasting niet nogmaals bij het totale tarief op.',
    ], [['Verdwijnt iedere belastingvermindering door het einde van salderen?', 'Die conclusie volgt daar niet uit. Saldering en andere belastingposten moeten afzonderlijk worden gecontroleerd.'], ['Moet ik belasting bij het all-in tarief optellen?', 'Nee. Gebruik het tarief inclusief belasting zonder dezelfde belasting dubbel te tellen.']], [law, contract]),
  'kleine-windmolen-tuin-regels-rendement': copy(
    'Kleine windmolen in de tuin: eerst locatie en regels controleren',
    'Een tuinwindmolen vraagt een eigen locatie- en vergunningonderzoek. Deze zonnepaneelcalculator stelt de opbrengst of terugverdientijd ervan niet vast.',
    [
      'Controleer via het Omgevingsloket en uw gemeente welke regels gelden op de exacte locatie. Neem afmetingen, plaatsing en mogelijke gevolgen voor de omgeving mee. Een algemene internetpagina is geen toestemming om een turbine te plaatsen.',
      'Vraag de leverancier welke meetgegevens en locatieaannames achter de opbrengstverwachting zitten. Laat beoordelen of die gegevens bij de voorgestelde hoogte en omgeving passen. Een opgegeven vermogen alleen zegt niet hoeveel energie uw tuin jaarlijks oplevert.',
      'Vergelijk een volledige offerte inclusief plaatsing, eventuele voorzieningen, onderhoud en verwijdering met een onderbouwde productieprognose. Er is hier geen gecontroleerde basis voor de eerder genoemde vaste terugverdientijd of een algemene subsidietoekenning.',
      'SaldeerScan berekent een vereenvoudigd huishoudelijk zonnepaneelscenario. Voer een verkoopprognose voor windenergie daarom niet in alsof het gemeten dakproductie is. Vraag een afzonderlijke projectberekening voordat u investeert.',
    ], [['Geeft deze pagina toestemming voor een tuinwindmolen?', 'Nee. Controleer de regels voor uw eigen plan en locatie bij het Omgevingsloket en uw gemeente.'], ['Kan ik hier de terugverdientijd vaststellen?', 'Nee. Het zonnepaneelmodel bevat geen wind-, locatie- of onderhoudsmodel.']], [permit]),
  'laadpaal-thuis-combineren-zonnepanelen-terugverdientijd': copy(
    'Thuis laden met zonnepanelen: bereken het extra eigen gebruik',
    'Laden op zonnige momenten kan uw eigen gebruik veranderen. Bereken het extra voordeel apart van de aanschaf van auto, laadpunt en zonnepanelen.',
    [
      'De eerdere algemene terugverdientijd van zes tot negen jaar voor een combinatie van laadpaal en panelen is niet onderbouwd voor uw woning. Een bestaande auto en bestaande panelen vormen een andere uitgangssituatie dan een volledig nieuwe installatie.',
      'Noteer hoeveel energie u thuis laadt en wanneer de auto beschikbaar is. Alleen jaarverbruik verhogen bewijst niet dat u meer zonnestroom op het moment van opwek gebruikt. Vraag een installateur hoe laadsturing en uw aansluiting bij de auto en installatie passen.',
      'Vergelijk dezelfde huishoudsituatie met en zonder de voorgestelde laadsturing. Neem de extra investering, abonnementen, laadverliezen en eventuele afspraken met werkgever of leasebedrijf afzonderlijk mee. Gebruik geen verwachte vergoeding zolang de voorwaarden niet vaststaan.',
      'In de calculator is het totale huishoudverbruik inclusief thuis laden nodig. Pas het directe eigen gebruik alleen aan als u dit met meetgegevens of een duidelijk benoemde aanname kunt onderbouwen. Het model optimaliseert geen laadschema en berekent geen complete autokosten.',
    ], [['Maakt een elektrische auto een batterij noodzakelijk?', 'Nee. Onderzoek eerst het werkelijke laadmoment en wat directe zonnestroom voor uw situatie toevoegt.'], ['Mag ik laadverbruik dubbel meetellen?', 'Nee. Gebruik één totaalverbruik en houd direct gebruikte zonnestroom apart van netafname.']], [charging, law]),
  'liander-netcongestie-particulieren-nieuwe-regels-impact': copy(
    'Liander en netcongestie: controleer de gevolgen voor uw aansluiting',
    'Een regionale capaciteitsmelding bewijst geen verplichte thuisbatterij of nieuwe omvormeraansturing bij iedere woning.',
    [
      'De eerdere tekst stelde zonder passende bron dat particuliere omvormers verplicht op afstand door Liander aangestuurd moeten worden en dat opslag nodig is. Die algemene conclusies zijn ingetrokken. Controleer een concrete mededeling bij uw eigen netbeheerder.',
      'Een capaciteitskaart geeft gebiedsinformatie voor een bepaald type transportvraag. Zij is geen actuele meting van uw bestaande woningaansluiting. Voor een nieuwe aansluiting of verzwaring heeft u adresgerichte informatie en een passende aanvraag nodig.',
      'Schakelt uw omvormer uit, bewaar dan de foutcode en tijdstippen. Liander beschrijft dat hoge lokale netspanning een oorzaak kan zijn. Laat een deskundige de oorzaak beoordelen; de regionale kaart alleen stelt die niet vast.',
      'SaldeerScan heeft geen geverifieerde actuele netstatus voor uw adres. Een oudere postcodekleur wordt daarom niet als huidig feit getoond. Een batterijadvies vraagt een eigen technische en financiële beoordeling en volgt niet uit een regionale kleur.',
    ], [['Bewijst rood dat mijn bestaande teruglevering verboden is?', 'Nee. Vraag de netbeheerder welke actuele voorwaarden op uw aansluiting en aanvraag van toepassing zijn.'], ['Toont deze scan een actuele Liander-meting?', 'Nee. De actuele adresstatus is niet geverifieerd.']], [grid, capacity, solar]),
  'netcongestie-kaart-2025': copy(
    'Netcongestiekaart lezen: gebiedssignaal en adresvraag scheiden',
    'Controleer datum, richting en aansluitingstype op de capaciteitskaart. Een oude kaartkleur is geen bewijs voor een actuele beperking op uw woning.',
    [
      'Gebruik de actuele capaciteitskaart van Netbeheer Nederland en lees de bijbehorende toelichting. Controleer of u naar afname of invoeding kijkt en voor welke aansluitingen de weergave geldt. Leg de datum en legenda vast wanneer u informatie gebruikt.',
      'Een regionale kleur is geen storingsmeting bij uw woning en voorspelt niet automatisch wanneer een omvormer uitvalt. Voor uw bestaande aansluiting, een verzwaring of nieuwe aansluiting is informatie van de eigen netbeheerder nodig.',
      'Bij een uitvallende omvormer zijn foutcodes, tijdstippen en installatiegegevens zinvoller dan alleen een kaartkleur. Laat controleren of spanning of een andere technische oorzaak speelt. Verander niet zelf veiligheidsinstellingen om een storing te omzeilen.',
      'Deze website geeft zonder geverifieerde actuele bron geen groene, oranje of rode adresstatus. Gebruik de huishoudberekening voor contractscenario’s; zij geeft geen transportcapaciteit of aansluitrecht af.',
    ], [['Is een kaartkleur een diagnose voor mijn omvormer?', 'Nee. Daarvoor zijn gegevens van uw installatie en een technische beoordeling nodig.'], ['Garandeert de calculator beschikbare netcapaciteit?', 'Nee. Vraag de actuele situatie voor uw aansluiting aan uw netbeheerder.']], [capacity, grid]),
  'postcoderoos-2026-zonder-eigen-dak-zonne-energie': copy(
    'Zonne-energie zonder eigen dak: vragen voor uw coöperatie',
    'Beoordeel een gezamenlijk energieproject op de projectregeling, inleg, kosten en uitstapvoorwaarden. Een eigen dakcalculator vervangt dat onderzoek niet.',
    [
      'Een coöperatie of VvE kan gezamenlijk duurzame elektriciteit opwekken. Vraag onder welke beschikking en regeling het aangeboden project valt. De oude postcoderoosregeling en SCE zijn verschillende regelingen; behandel ze niet als een naamswijziging.',
      'Vraag vóór deelname om de projectbegroting, uw inleg, jaarlijkse kosten, verwachte uitkering, risico’s en afspraken bij verhuizing. Controleer wie eigenaar is van de installatie en wat er gebeurt als opbrengst of realisatie tegenvalt.',
      'Een aanvraagperiode voor nieuwe subsidie is geen algemene vervaldatum voor bestaande deelnemersrechten. De actuele aanvraagstatus staat bij RVO. Laat uw coöperatie uitleggen welke voorwaarden bij uw eigen project horen.',
      'SaldeerScan waardeert geen coöperatieve deelname. Een projectuitkering is geen direct verbruikte zonnestroom uit uw eigen dak. Houd een projectberekening en de elektriciteitsrekening van uw woning als afzonderlijke vergelijkingen naast elkaar.',
    ], [['Is SCE een persoonlijke aankoopsubsidie?', 'Nee. Het is een regeling voor projecten van energiecoöperaties en VvE’s met eigen voorwaarden.'], ['Kan ik een coöperatie beoordelen met de huishoudcalculator?', 'Niet volledig. Projectfinanciën en deelnemersafspraken vallen buiten dit model.']], [sce, sceFaq]),
  'postcoderoos-uitgebreid-2025': copy(
    'Postcoderoos en SCE: meer dan een nieuwe naam',
    'De SCE is een andere regeling dan de oude postcoderoos. Controleer welke voorwaarden voor uw project en deelnemerschap gelden.',
    [
      'De eerdere tekst beschreef SCE als een naamswijziging met automatisch gunstiger voorwaarden. Dat is geen juiste basis om een project te beoordelen. De regeling en beschikking van het concrete project zijn leidend.',
      'Bij SCE vraagt een energiecoöperatie of VvE subsidie aan voor gezamenlijke opwek. Uw eigen uitkering en risico volgen daarnaast uit de projectstukken en deelnemersafspraken. Een toegekende projectsubsidie garandeert uw persoonlijke rendement niet.',
      'Vraag bij een bestaand project naar de beschikking, startdatum, subsidiabele productie en resterende looptijd. Vraag bij een nieuwe aanbieding of een aanvraag is gedaan en welke onzekerheden nog bestaan. Neem een verwachte toekenning niet als vaststaand geld op.',
      'Gebruik de uitleg en veelgestelde vragen van RVO om de oude regeling en SCE uit elkaar te houden. Laat de coöperatie schriftelijk toelichten hoe de regeling, stroomopbrengst en kosten in de deelnemersberekening zijn verwerkt.',
    ], [['Zijn alle oude projecten automatisch SCE-projecten?', 'Dat mag u niet aannemen. Vraag welke beschikking en regeling bij het project horen.'], ['Garandeert een projectsubsidie mijn uitkering?', 'Nee. Controleer ook productie, kosten, financiering en uw deelnemersafspraken.']], [sce, sceFaq]),
  'saldering-afschaffing-2027-definitief': copy(
    'Salderen stopt in 2027: welke gegevens heeft u nodig?',
    'Vanaf 1 januari 2027 stopt salderen. Vergelijk uw eigen productie, directe gebruik en contractkosten voordat u een investering overweegt.',
    [
      'Tot en met 31 december 2026 blijft salderen bestaan. Daarna vervalt de jaarlijkse verrekening met afgenomen stroom. Het eerdere plan voor een gefaseerde afbouw is niet de geldende regeling.',
      'Teruggeleverde stroom houdt een vergoeding. Tot 2030 geldt een wettelijke bruto ondergrens van 50% van het kale leveringstarief. Terugleverkosten zijn een aparte contractpost. Vergelijk de vergoeding daarom samen met alle kosten.',
      'Verzamel jaarproductie uit de omvormer-app, netafname en teruglevering uit de metergegevens en de tariefbladen van uw leverancier. Direct gebruik is productie die op hetzelfde moment thuis wordt benut, geen jaarlijkse wegstreping.',
      'Bereken eerst dezelfde woning zonder nieuwe investering onder beide regelingen. Vergelijk daarna een afzonderlijk opslagsysteem op zijn extra voordeel, investering en beperkingen. De stopdatum rechtvaardigt geen algemene belofte over terugverdientijd of koopurgentie.',
    ], [['Stopt ook de vergoeding voor teruglevering?', 'Nee. Vergoeding en terugleverkosten moeten afzonderlijk worden beoordeeld.'], ['Moet ik vóór 2027 een batterij aanschaffen?', 'Dat volgt niet uit de stopdatum. Vergelijk de meerkosten en het extra voordeel voor uw woning.']], [law, contract]),
  'thuisbatterij-prijzen-rendabele-modellen': copy(
    'Thuisbatterij vergelijken: totale offerte en extra voordeel',
    'Deze pagina bevat geen geteste ranglijst van rendabele batterijmodellen. Vergelijk een volledige offerte met uw eigen productie, gebruik en contract.',
    [
      'De eerdere kop suggereerde dat bepaalde modellen hier als rendabel waren vastgesteld. Er is geen vergelijkend productonderzoek dat zo’n ranglijst onderbouwt. De passende keuze hangt ook af van uw installatie en meetgegevens.',
      'Vraag per offerte naar bruikbare capaciteit, vermogen, rendement, installatie, sturing, abonnementen, garantie en eventuele aanpassingen. Controleer welke kosten vaststaan en welke verwachte inkomsten afhangen van een contract of handelsdienst.',
      'Vergelijk de batterij met dezelfde woning zonder batterij vanaf 2027. Extra besparing is niet de volledige opbrengst van uw panelen en evenmin automatisch het verlies door het einde van salderen. Neem opslagverlies mee en tel verplaatste energie maar één keer.',
      'De calculator toont een eenvoudige jaarvergelijking. Zij rekent geen handel, degradatie, financiering of onderhoud door. Een gunstige eenvoudige terugverdientijd is daarom geen rendementszekerheid. De ISDE voor woningeigenaren subsidieert geen thuisbatterij.',
    ], [['Welke batterij is hier als beste getest?', 'Geen. Deze pagina biedt een vergelijkingskader en geen producttest of merkadvies.'], ['Is alle paneelopbrengst batterijvoordeel?', 'Nee. Alleen het verschil met dezelfde woning zonder opslag is het extra voordeel.']], [law, isde, contract]),
  'warmtepomp-zonnepanelen-combinatie': copy(
    'Warmtepomp en zonnepanelen: beoordeel woning en gebruik samen',
    'Een warmtepomp vraagt een eigen woning- en verwarmingsadvies. Jaarlijkse zonneproductie alleen bewijst niet dat de warmtepomp op eigen stroom draait.',
    [
      'De eerdere tekst presenteerde de combinatie als vanzelf rendabel. RVO beschrijft dat de geschiktheid van een warmtepomp samenhangt met onder meer de woning en isolatie. Laat de warmtevraag en het afgiftesysteem beoordelen.',
      'Een gelijk jaarvolume aan zonnestroom en stroomverbruik zegt niet dat productie en warmtevraag samenvallen. Gebruik meetgegevens of een onderbouwd tijdprofiel om direct eigen gebruik te ramen. Neem een nieuwe warmtepomp niet alleen als extra jaarverbruik zonder verdere toelichting op.',
      'Vraag een gespecificeerde offerte en vergelijk totale energiekosten, investering, installatieaanpassingen en onderhoud. Voor een mogelijke ISDE-aanvraag gelden afzonderlijke voorwaarden en producteisen. De subsidie op één maatregel geldt niet automatisch voor alle onderdelen van een combinatie.',
      'SaldeerScan is geen warmtepompdimensionering of verwarmingsberekening. U kunt het totale stroomverbruik en directe gebruik aanpassen voor een scenario, maar een besparing op gas en het volledige warmtepomprendement worden hier niet vastgesteld.',
    ], [['Bewijst voldoende jaaropwek dat de warmtepomp zelfvoorzienend is?', 'Nee. Ook het moment van productie en verbruik is bepalend.'], ['Bereken ik hier het complete warmtepomprendement?', 'Nee. Warmtevraag, gasbesparing, dimensionering en onderhoud vragen een afzonderlijk advies.']], [heat, isde, law]),
  'zonnepaneel-garantie-2026-dekking-afloop': copy(
    'Zonnepaneelgarantie: controleer wat is beloofd en door wie',
    'Een productgarantie, prestatiebelofte en wettelijke rechten zijn verschillende zaken. Gebruik uw eigen documenten in plaats van een algemene garantieduur.',
    [
      'De eerdere tekst noemde een vaste resterende prestatie na vijftien jaar alsof die voor elk paneel geldt. Daarvoor is geen algemene basis. Zoek in uw koop- en garantievoorwaarden welke prestaties werkelijk zijn toegezegd.',
      'Volgens ACM ConsuWijzer zijn commerciële garanties een aanvulling op wettelijke rechten. Leg bij een probleem de aankoopdatum, factuur, productgegevens, foutmelding en eventuele eerdere contacten vast. Bespreek het probleem met de verkoper en vraag om een onderbouwde oplossing.',
      'Controleer afzonderlijk de afspraken over panelen, omvormer, montage en arbeid. Vraag hoe de prestaties worden gemeten en welke procedure voor een claim geldt. Een lagere jaarproductie kan verschillende oorzaken hebben; deze scan stelt geen defect of recht op vergoeding vast.',
      'De financiële regels voor salderen veranderen op 1 januari 2027. Die verandering verlengt of verkort niet vanzelf de garanties in uw overeenkomst. Beoordeel financiële opbrengst en een eventuele productklacht als afzonderlijke vragen.',
    ], [['Geldt één garantiepercentage voor alle panelen?', 'Nee. Controleer de specifieke toezegging en meetvoorwaarden van uw eigen aankoop.'], ['Vervangt een commerciële garantie mijn wettelijke rechten?', 'Nee. ACM ConsuWijzer beschrijft commerciële garantie als aanvulling op wettelijke rechten.']], [guarantee, law]),
  'zonnepanelen-prijsdaling-2025': copy(
    'Zonnepanelenprijs vergelijken: kijk naar de volledige offerte',
    'De eerdere belofte van 30% prijsdaling is niet onderbouwd voor uw installatie. Vergelijk actuele offertes op dezelfde onderdelen en aannames.',
    [
      'De oorspronkelijke kop stelde een prijsdaling van 30% als algemene aankoopgrond. Deze pagina heeft geen gecontroleerde prijsreeks die dat percentage voor particuliere installaties onderbouwt. Een verandering van paneelinkoopprijzen is bovendien niet gelijk aan een daling van de complete installatieprijs.',
      'Leg offertes naast elkaar voor hetzelfde dak en dezelfde omvang. Controleer panelen, omvormer, montage, elektrische voorzieningen, bereikbaarheid, arbeid en garantie. Vraag welke posten ontbreken of later kunnen veranderen.',
      'Controleer ook of plaatsing en gebouw aan de toepasselijke regels voldoen. RVO beschrijft dat vergunningvrij plaatsen nog steeds veiligheidseisen kent. Een lage prijs vervangt geen beoordeling van dak, installatie en aansluiting.',
      'Reken de terugverdientijd met uw eigen productie, direct gebruik en contractkosten. Een offerte in oktober 2026 levert geen volledig extra jaar saldering op. Gebruik het 2026-scenario als expliciet referentiejaar, niet als een beloofd toekomstig rendement.',
    ], [['Is mijn volledige installatie zeker 30% goedkoper?', 'Dat volgt niet uit deze pagina. Vergelijk complete actuele offertes voor dezelfde situatie.'], ['Is het 2026-scenario nog een heel toekomstig jaar?', 'Nee. Het is een referentiejaar om de regelingen te vergelijken; de resterende looptijd hangt van de echte installatiedatum af.']], [solar, law]),
  'zonnepanelen-reinigen-kosten-baten-rendement': copy(
    'Zonnepanelen reinigen: beoordeel noodzaak en offerte',
    'Een lagere opbrengst bewijst niet dat reinigen de oplossing is. Controleer meetgegevens en productvoorschriften voordat u onderhoud bestelt.',
    [
      'Vergelijk productie over vergelijkbare omstandigheden en noteer storingen, schaduw en zichtbare vervuiling. Een verschil tussen twee jaren kan niet zonder onderzoek volledig aan vuil worden toegeschreven. Deze pagina meet geen vervuilingsverlies.',
      'Vraag een deskundige of reiniging in uw situatie nodig is en welke werkwijze volgens de fabrikant is toegestaan. Ga niet zelf een onveilig dak op en gebruik geen methode die installatie of garantie kan schaden. Voor een specifiek product zijn de eigen onderhoudsvoorschriften leidend.',
      'Vraag een prijsopgave, werkomschrijving en toelichting op eventuele opbrengstbeloften. Vergelijk de totale kosten met het onderbouwde extra voordeel. Er is hier geen gecontroleerde basis voor een algemeen winstpercentage of vaste onderhoudsfrequentie.',
      'Het einde van salderen op 1 januari 2027 is geen technische reinigingsdeadline. Gebruik bij de beoordeling van extra productie de juiste vergoeding en contractkosten. SaldeerScan stelt niet vast of reiniging, reparatie of een andere maatregel nodig is.',
    ], [['Moet ieder systeem vóór 2027 gereinigd worden?', 'Nee. De stopdatum van salderen is geen onderhoudsvoorschrift.'], ['Bereken ik hier de oorzaak van lagere productie?', 'Nee. Daarvoor zijn installatiegegevens en zo nodig een deskundige beoordeling nodig.']], [guarantee, law]),
}

export const REVIEWED_KNOWLEDGE: Record<string, ReviewedNewsCopy> = {
  'beste-zonnepanelen-2025': copy(
    'Zonnepanelen kiezen: vergelijk de installatie voor uw dak',
    'Er is hier geen onafhankelijke ranglijst van de beste panelen. Beoordeel de volledige installatie, onderbouwde opbrengst en offerte voor uw woning.',
    ['Een merknaam of hoger paneelvermogen bewijst niet dat een complete installatie beter bij uw dak past. Vraag naar de gebruikte dakgegevens, schaduw, opstelling, omvormer en aannames achter de opbrengstprognose.',
      'Vergelijk offertes op dezelfde omvang en onderdelen. Controleer installatie, benodigde aanpassingen, garantie en onderhoud. Vraag welke veiligheids- en plaatsingsregels voor uw gebouw gelden; vergunningvrij betekent niet dat er geen eisen zijn.',
      'De eerdere tekst verwees naar een gefaseerde afbouw vanaf 2025 en beloofde vaste voordelen per paneel. Die uitspraken zijn vervangen. Salderen stopt op 1 januari 2027. Voor uw jaarwaarde zijn eigen gebruik en contractkosten nodig, naast de offerte.',
      'Voer in de calculator de productieprognose in als een schatting, of gebruik de werkelijke jaarproductie van bestaande panelen. De scan test geen merken en keurt geen dak of installatie.'],
    [['Welk merk heeft SaldeerScan als beste getest?', 'Geen. Vraag om vergelijkbare offertes en controleer de onderbouwing voor uw dak.'], ['Is meer piekvermogen altijd meer voordeel?', 'Niet vanzelf. Productie, prijs, bruikbaarheid en eigen gebruik moeten samen worden vergeleken.']], [solar, law]),
  'einde-salderen-2027-uitleg': copy(
    'Einde salderen in 2027: maak dezelfde woning vergelijkbaar',
    'Vergelijk de situatie met en zonder salderen met dezelfde productie en hetzelfde verbruik. Onderzoek nieuwe investeringen daarna afzonderlijk.',
    ['Salderen stopt volledig op 1 januari 2027. Er is geen geldende afbouw naar een lager percentage in 2026. De stop betreft de jaarlijkse verrekening van teruggeleverde en afgenomen stroom.',
      'Vanaf 2027 blijft een terugleververgoeding bestaan. Tot 2030 geldt een minimum van 50% van het kale leveringstarief. Terugleverkosten zijn een afzonderlijke post. Een bruto minimum is geen gegarandeerd netto eurobedrag.',
      'Begin met productie, netafname en teruglevering over dezelfde periode. Direct eigen gebruik is het deel van de productie dat op dat moment thuis wordt benut. Bij volledige meetgegevens kunt u dat bepalen als productie minus teruglevering; totaalverbruik is dan netafname plus direct gebruik.',
      'Bereken eerst beide regelingen met dezelfde aannames. Bekijk daarna wat een uitvoerbare verandering in gebruik of opslag toevoegt. Zo schrijft u de bestaande paneelopbrengst niet toe aan een nieuwe batterij.'],
    [['Wordt salderen in 2026 al beperkt tot 28%?', 'Nee. De regeling blijft tot en met 2026 bestaan en stopt op 1 januari 2027.'], ['Is het nadeel voor elk huishouden hetzelfde?', 'Nee. Gebruik en contract bepalen samen met de productie het verschil.']], [law, contract]),
  'energiebelasting-2027-veranderingen': copy(
    'Energiebelasting bij zonnepanelen: totaal en kaal tarief scheiden',
    'Gebruik het totale stroomtarief en het kale leveringstarief als afzonderlijke gegevens. Vermijd dubbeltelling van belastingen en vergoeding.',
    ['Het totale leveringstarief inclusief belastingen is de prijs die u voor een ingekochte kWh gebruikt in een eenvoudige jaarvergelijking. Het kale leveringstarief bevat die belastingen niet. Deze bedragen hebben verschillende functies in de berekening.',
      'Tot en met 2026 kan de jaarlijkse salderingsverrekening binnen uw afname plaatsvinden. Vanaf 2027 vervalt die verrekening. Direct opgewekte en gebruikte stroom blijft volgens de Rijksoverheid vrij van energiebelasting en leverancierskosten.',
      'De wettelijke bruto vergoedingsgrens tot 2030 verwijst naar 50% van het kale leveringstarief. Trek terugleverkosten daar afzonderlijk naast. Dat is geen belofte dat het netto voordeel precies de helft van uw totale inkooptarief is.',
      'De calculator voorspelt geen toekomstige belastingtarieven en geen individuele belastingteruggave. Gebruik actuele contract- en rekeninggegevens voor ieder scenario en vraag uitleg aan uw leverancier over andere belastingposten.'],
    [['Is 50% van het kale tarief gelijk aan 50% van all-in?', 'Nee. De grondslag is het kale leveringstarief, zonder belastingen.'], ['Kan ik hier toekomstige belastingtarieven vaststellen?', 'Nee. De vergelijking gebruikt expliciet ingevoerde tarieven en is geen belastingaangifte.']], [law, contract]),
  'energielabel-woning-verbeteren': copy(
    'Energielabel verbeteren: begin met uw woninggegevens',
    'Een officiële labelbeoordeling en een zonnepaneelberekening beantwoorden verschillende vragen. Laat maatregelen voor uw woning onderbouwen.',
    ['Controleer het geldige energielabel en de geregistreerde woninggegevens. De Rijksoverheid beschrijft de labelregels bij verkoop, verhuur en oplevering. De eerdere kop beloofde een route van G naar A vóór 2027; deze scan kan zo’n labelsprong niet vaststellen.',
      'Vraag een energieadviseur welke kenmerken en maatregelen bij uw woning het verschil maken. Houd offerteprijzen, verwachte gebruiksbesparing en de officiële labeluitkomst apart. Een algemene maatregel of wijkgemiddelde voorspelt uw nieuwe label niet.',
      'Controleer een mogelijke subsidie bij RVO op de actuele voorwaarden, producteisen en aanvraagprocedure. Een indicatie op een website is geen toekenning. Neem geen niet-geverifieerde subsidie of vaste terugverdientijd als gegarandeerd voordeel op.',
      'Gebruik de huishoudcalculator voor een afzonderlijke zonnestroomvergelijking met eigen jaargegevens. Het einde van salderen is geen algemene verplichting om een bestaande koopwoning vóór die datum naar een bepaald label te brengen.'],
    [['Geeft de scan een officieel nieuw label?', 'Nee. Laat een daarvoor bevoegde energieadviseur de woning beoordelen.'], ['Bewijst een subsidie dat een maatregel mijn gewenste label oplevert?', 'Nee. Subsidievoorwaarden en de woningbeoordeling zijn afzonderlijke vragen.']], [label, isde]),
  'omvormer-kiezen-zonnepanelen': copy(
    'Omvormer kiezen: vraag om een ontwerp voor uw installatie',
    'Vergelijk een omvormervoorstel op uw dak, panelen, aansluiting en voorwaarden. Deze scan test geen string-, micro- of optimizersystemen.',
    ['Vraag de installateur hoe het ontwerp aansluit bij paneelconfiguratie, schaduw, elektrische aansluiting en eventuele uitbreidingsplannen. Laat uitleggen welke componenten nodig zijn en welke opbrengstaannames worden gebruikt.',
      'De eerdere tekst noemde vaste procentuele verliezen en prijsverschillen voor verschillende systemen. Die percentages zijn niet voor uw installatie aangetoond. Vergelijk een gespecificeerde offerte met een onderbouwd ontwerp in plaats van een algemene rangorde.',
      'Controleer veiligheid, toepasselijke net- en producteisen, garantie, monitoring en onderhoud. RVO geeft een overzicht van de wetgeving voor zonne-energie. Laat de uitvoering en de concrete conformiteit door een deskundige beoordelen.',
      'Meer productie is niet hetzelfde als een even grote stijging van direct eigen gebruik. Vergelijk het productiemoment en uw verbruik. De calculator beoordeelt de jaarwaarde bij uw aannames, niet het elektrische ontwerp.'],
    [['Welk systeem is altijd het beste?', 'Dat kan hier niet worden vastgesteld. Vraag een onderbouwd ontwerp voor uw eigen installatie.'], ['Keurt SaldeerScan een omvormer goed?', 'Nee. Productkeuze, conformiteit en aansluiting vragen een technische beoordeling.']], [solar, law]),
  'salderingsregeling-afbouw-2026-2027': copy(
    'Salderingsregeling 2026–2027: volledige stop, geen percentageschema',
    'In 2026 geldt geen stapsgewijze afbouw van salderen. Op 1 januari 2027 stopt de regeling volledig; terugleververgoeding blijft bestaan.',
    ['Deze URL bevat het oudere woord afbouw. Het eerder voorgestelde percentageschema is geen geldende beschrijving van 2026. Volgens de Rijksoverheid blijft de regeling tot en met 31 december 2026 bestaan en stopt zij daarna.',
      'Onder salderen wordt jaarlijks teruggeleverde stroom binnen de afgenomen hoeveelheid verrekend. Productie die u direct zelf gebruikt is iets anders: die stroom wordt niet eerst via het net afgenomen en teruggeleverd.',
      'Vanaf 2027 blijft een bruto vergoeding voor teruglevering gelden. Tot 2030 is de wettelijke ondergrens 50% van het kale leveringstarief. Controleer daarnaast alle terugleverkosten in uw contract.',
      'Gebruik de calculator voor twee vergelijkbare referentiejaren. Een heel jaar 2026 is geen belofte voor de resterende maanden na uw aankoop. Beoordeel een installatie met de werkelijke planning en de verwachte kosten daarna.'],
    [['Welke afbouwpercentages gelden in 2026?', 'Er geldt geen actueel gefaseerd percentageschema. De volledige stopdatum is 1 januari 2027.'], ['Is de terugleververgoeding na 2026 nul?', 'Nee. Controleer de vergoeding en terugleverkosten afzonderlijk.']], [law]),
  'thuisbatterij-saldering-alternatief': copy(
    'Thuisbatterij na salderen: beoordeel alleen het extra voordeel',
    'Een batterij vervangt de salderingsregeling niet. Vergelijk dezelfde woning met en zonder opslag en neem verlies en investering afzonderlijk mee.',
    ['Een batterij verplaatst energie in de tijd en kent verliezen. Zij maakt niet automatisch al uw teruggeleverde energie beschikbaar voor later gebruik. Capaciteit, vermogen, productie en verbruiksmomenten bepalen wat praktisch mogelijk is.',
      'De relevante jaarbesparing is het verschil met dezelfde woning zonder batterij. Trek de waarde van stroom die anders teruggeleverd zou worden af en vergelijk de contractkosten in beide situaties. De bestaande paneelopbrengst is geen extra batterijopbrengst.',
      'SaldeerScan begrenst de jaarlijkse opslag met expliciete capaciteit-, verbruik- en rendementsaannames. Het model simuleert geen kwartierdata, handel, degradatie, onderhoud of financiering. Een ongunstige uitkomst kan daarom een zinvolle conclusie zijn; een gunstige uitkomst vraagt verdere toetsing.',
      'Voor woningeigenaren valt een thuisbatterij niet onder de ISDE. Controleer eventuele andere regelingen en contracten apart. Gebruik een volledige offerte en neem een onzekere subsidie of handelsopbrengst niet als vaststaand inkomen op.'],
    [['Is mijn salderingsverlies gelijk aan batterijbesparing?', 'Nee. Alleen het berekende verschil tussen dezelfde woning met en zonder batterij is het extra voordeel.'], ['Is een korte eenvoudige terugverdientijd een garantie?', 'Nee. Het jaarmodel laat kosten en technische effecten buiten beschouwing die nader moeten worden onderzocht.']], [law, isde, contract]),
  'wat-is-salderen': copy(
    'Wat is salderen? Jaarverrekening en direct gebruik uitgelegd',
    'Salderen is het jaarlijks verrekenen van teruggeleverde met afgenomen stroom. Direct eigen gebruik vindt plaats vóór die netverrekening.',
    ['Zonnestroom kan direct in huis worden gebruikt of aan het net worden teruggeleverd. In de salderingsregeling wordt teruggeleverde stroom jaarlijks verrekend met afgenomen stroom. Voor een overschot boven de afname geldt een vergoeding.',
      'Gebruik productie en metergegevens over dezelfde periode. Productie is niet hetzelfde als teruglevering. Als de metingen de volledige situatie dekken, is direct eigen gebruik productie minus teruglevering en totaalverbruik netafname plus direct gebruik.',
      'De regeling blijft tot en met 2026 bestaan en stopt op 1 januari 2027. Daarna blijft terugleververgoeding bestaan. Tot 2030 is de bruto ondergrens 50% van het kale leveringstarief; terugleverkosten staan daar los van.',
      'Uw voordeel hangt af van het contract en de energiestromen. De calculator gebruikt vaste jaarbedragen en tarieven om dezelfde woning te vergelijken. Zij voorspelt geen toekomstige leverancierstarieven of gegarandeerde besparing.'],
    [['Zijn productie en teruglevering hetzelfde?', 'Nee. Productie die u direct thuis gebruikt, wordt niet teruggeleverd.'], ['Wat verandert op 1 januari 2027?', 'De salderingsverrekening stopt. Een vergoeding voor teruglevering blijft bestaan.']], [law, contract]),
  'zonnepanelen-huurhuis-toegestaan': copy(
    'Zonnepanelen in een huurwoning: leg toestemming en kosten vast',
    'Bespreek plaatsing, eigendom, kosten en verhuizing met uw verhuurder. Deze scan stelt geen individueel plaatsingsrecht of vaste huurdersbesparing vast.',
    ['De eerdere tekst veronderstelde een algemene verplichting voor verhuurders en een vaste besparing voor huurders. Dat is geen betrouwbare beschrijving van ieder huurcontract. De Rijksoverheid beschrijft dat voor renovatie toestemming van de verhuurder nodig is.',
      'Vraag vóór de opdracht schriftelijk hoe toestemming, dakgebruik, installatie, eigendom, onderhoud en aansprakelijkheid zijn geregeld. Bespreek ook wat er bij een storing, verhuizing of beëindiging van de huur gebeurt.',
      'Leg mogelijke huur-, service- of gebruikskosten naast de verwachte elektriciteitsbesparing. Controleer wie het energiecontract heeft, wie de productie ontvangt en wie eventuele terugleverkosten draagt. Vraag bij een geschil advies over uw eigen overeenkomst.',
      'Gebruik in de calculator alleen de energiestromen en tarieven die voor uw huishouden gelden. Het model verwerkt geen huurverhoging, contractovername of eigendomsrechten en is geen vervanging van een beoordeling van uw huurafspraken.'],
    [['Bewijst de scan dat ik zonder overleg panelen mag plaatsen?', 'Nee. Regel de toestemming en afspraken met uw verhuurder voordat u een opdracht geeft.'], ['Is mijn voordeel automatisch de volledige paneelopbrengst?', 'Nee. Kijk ook wie de kosten draagt en welke huur- of gebruiksafspraken gelden.']], [tenant, law]),
  'zonnepanelen-subsidie-nederland': copy(
    'Zonnepanelen: subsidie, btw en financiering apart controleren',
    'Zonnepanelen vallen niet onder de ISDE voor woningeigenaren. Controleer een eventuele andere regeling op haar eigen voorwaarden.',
    ['De eerdere tekst presenteerde subsidies en leningen te algemeen als een zeker voordeel. De ISDE voor woningeigenaren is geen aanschafsubsidie voor zonnepanelen. Een regeling voor andere maatregelen geeft geen automatisch recht voor een zonnepaneelinstallatie.',
      'RVO beschrijft het btw-nultarief voor levering en installatie van zonnepanelen op of nabij woningen. Een fiscale behandeling is iets anders dan een uit te keren subsidie. Controleer de toepasselijkheid op de concrete factuur en situatie.',
      'Voor een mogelijke lokale regeling moet u rechtstreeks bij gemeente of provincie nagaan of zij bestaat, open is en op uw aankoop past. Een lening moet worden terugbetaald; neem rente en voorwaarden apart mee in de totale kosten.',
      'Salderen stopt volledig op 1 januari 2027, zonder huidig afbouwschema in 2026. Bereken uw installatie met de offerte en eigen contractgegevens. Neem een onzekere tegemoetkoming niet als vaststaande opbrengst op.'],
    [['Kan ik ISDE aanvragen voor gewone zonnepanelen?', 'Niet onder de ISDE voor woningeigenaren. Controleer andere maatregelen en eventuele lokale regelingen afzonderlijk.'], ['Is een lening een subsidie?', 'Nee. Bij een lening horen terugbetaling en mogelijk rente en andere voorwaarden.']], [isde, solar, law]),
  'zonnepanelen-terugverdientijd-berekenen': copy(
    'Terugverdientijd zonnepanelen: bereken met dezelfde aannames',
    'Een eenvoudige terugverdientijd is investering gedeeld door positieve jaarwaarde. Toon tarieven en kosten en beoordeel onzekerheden afzonderlijk.',
    ['Begin met een volledige offerte, productieprognose, totaalverbruik en direct eigen gebruik. Gebruik voor bestaande panelen waar mogelijk meetgegevens. Houd de volledige paneleninvestering en een eventuele extra batterijinvestering uit elkaar.',
      'Vanaf 2027 bestaat de jaarwaarde in een eenvoudige vaste-tariefvergelijking uit vermeden inkoop door direct gebruik plus bruto terugleververgoeding minus terugleverkosten. Tot en met 2026 hoort daar de salderingsverrekening bij. Gebruik dezelfde woning zodat u de regelwijziging niet verwart met een andere installatie.',
      'Deel de investering alleen door een positieve passende jaarwaarde. Bij nul of een negatief bedrag volgt geen zinvolle positieve eenvoudige terugverdientijd. Voor een batterij telt uitsluitend het extra voordeel vergeleken met dezelfde woning zonder opslag.',
      'Dit model bevat geen kasstroom over de volledige levensduur, degradatie, financiering, onderhoud of kwartierprijzen. Een referentiejaar 2026 is ook geen volledig toekomstig salderingsjaar vanaf een aankoop later in 2026. Laat een investeringsbesluit toetsen met uw planning en offerte.'],
    [['Kan ik nul of een negatief voordeel als snelle terugverdientijd tonen?', 'Nee. Dan volgt geen positieve eenvoudige terugverdientijd en moet u de invoer en investering heroverwegen.'], ['Bereken ik hier een gegarandeerd levensduurrendement?', 'Nee. Het is een beperkte jaarvergelijking met expliciete aannames.']], [law, contract]),
}
