/**
 * expand-wijken.ts
 *
 * Haalt alle CBS 2023 wijken op in één request, vergelijkt met bestaande
 * WIJKEN in seed-wijken.ts, en voegt ontbrekende toe tot totaal ~2000.
 *
 * Bergen op Zoom en Tholen worden altijd volledig opgenomen.
 *
 * Gebruik: npx tsx scripts/expand-wijken.ts [--dry-run]
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const DRY_RUN = process.argv.includes('--dry-run')
const TARGET = 2000
const VERPLICHTE_GEMEENTEN = ['Bergen op Zoom', 'Tholen']

// ── Gemeente → provincie ─────────────────────────────────────────────────────

const GP: Record<string, string> = {
  // Groningen
  'Groningen': 'groningen', 'Midden-Groningen': 'groningen', 'Het Hogeland': 'groningen',
  'Eemsdelta': 'groningen', 'Westerkwartier': 'groningen', 'Veendam': 'groningen',
  'Stadskanaal': 'groningen', 'Oldambt': 'groningen', 'Pekela': 'groningen',
  'Aa en Hunze': 'drenthe',

  // Friesland
  'Leeuwarden': 'friesland', 'Smallingerland': 'friesland', 'Súdwest-Fryslân': 'friesland',
  'Heerenveen': 'friesland', 'Ooststellingwerf': 'friesland', 'Weststellingwerf': 'friesland',
  'Opsterland': 'friesland', 'Tytsjerksteradiel': 'friesland', 'Achtkarspelen': 'friesland',
  'Dantumadiel': 'friesland', 'Noardeast-Fryslân': 'friesland', 'Waadhoeke': 'friesland',
  'De Friese Meren': 'friesland', 'Harlingen': 'friesland', 'Ameland': 'friesland',
  'Terschelling': 'friesland', 'Vlieland': 'friesland', 'Schiermonnikoog': 'friesland',

  // Drenthe
  'Assen': 'drenthe', 'Emmen': 'drenthe', 'Hoogeveen': 'drenthe', 'Meppel': 'drenthe',
  'Coevorden': 'drenthe', 'Borger-Odoorn': 'drenthe', 'Midden-Drenthe': 'drenthe',
  'Noordenveld': 'drenthe', 'Tynaarlo': 'drenthe', 'De Wolden': 'drenthe',
  'Westerveld': 'drenthe',

  // Overijssel
  'Enschede': 'overijssel', 'Zwolle': 'overijssel', 'Deventer': 'overijssel',
  'Hengelo': 'overijssel', 'Almelo': 'overijssel', 'Kampen': 'overijssel',
  'Hardenberg': 'overijssel', 'Oldenzaal': 'overijssel', 'Rijssen-Holten': 'overijssel',
  'Twenterand': 'overijssel', 'Hellendoorn': 'overijssel', 'Wierden': 'overijssel',
  'Tubbergen': 'overijssel', 'Dinkelland': 'overijssel', 'Losser': 'overijssel',
  'Hof van Twente': 'overijssel', 'Haaksbergen': 'overijssel', 'Raalte': 'overijssel',
  'Borne': 'overijssel', 'Dalfsen': 'overijssel', 'Steenwijkerland': 'overijssel',
  'Staphorst': 'overijssel', 'Zwartewaterland': 'overijssel', 'Olst-Wijhe': 'overijssel',
  'Ommen': 'overijssel',

  // Gelderland
  'Nijmegen': 'gelderland', 'Arnhem': 'gelderland', 'Apeldoorn': 'gelderland',
  'Ede': 'gelderland', 'Doetinchem': 'gelderland', 'Harderwijk': 'gelderland',
  'Tiel': 'gelderland', 'Zutphen': 'gelderland', 'Wageningen': 'gelderland',
  'Zevenaar': 'gelderland', 'Culemborg': 'gelderland', 'Nijkerk': 'gelderland',
  'Barneveld': 'gelderland', 'Wijchen': 'gelderland', 'Overbetuwe': 'gelderland',
  'Lingewaard': 'gelderland', 'Duiven': 'gelderland', 'Westervoort': 'gelderland',
  'Rheden': 'gelderland', 'Renkum': 'gelderland', 'Brummen': 'gelderland',
  'Voorst': 'gelderland', 'Lochem': 'gelderland', 'Aalten': 'gelderland',
  'Winterswijk': 'gelderland', 'Oost Gelre': 'gelderland', 'Berkelland': 'gelderland',
  'Montferland': 'gelderland', 'Bronckhorst': 'gelderland', 'Berg en Dal': 'gelderland',
  'Heumen': 'gelderland', 'Beuningen': 'gelderland', 'Druten': 'gelderland',
  'Maasdriel': 'gelderland', 'West Maas en Waal': 'gelderland', 'Zaltbommel': 'gelderland',
  'Neder-Betuwe': 'gelderland', 'West Betuwe': 'gelderland', 'Buren': 'gelderland',
  'Epe': 'gelderland', 'Heerde': 'gelderland', 'Hattem': 'gelderland',
  'Elburg': 'gelderland', 'Oldebroek': 'gelderland', 'Nunspeet': 'gelderland',
  'Putten': 'gelderland', 'Ermelo': 'gelderland', 'Scherpenzeel': 'gelderland',
  'Rozendaal': 'gelderland',

  // Utrecht
  'Utrecht': 'utrecht', 'Amersfoort': 'utrecht', 'Veenendaal': 'utrecht',
  'Nieuwegein': 'utrecht', 'Houten': 'utrecht', 'Zeist': 'utrecht',
  'Soest': 'utrecht', 'Woerden': 'utrecht', 'De Bilt': 'utrecht',
  'Stichtse Vecht': 'utrecht', 'De Ronde Venen': 'utrecht', 'Leusden': 'utrecht',
  'Baarn': 'utrecht', 'IJsselstein': 'utrecht', 'Utrechtse Heuvelrug': 'utrecht',
  'Wijk bij Duurstede': 'utrecht', 'Bunschoten': 'utrecht', 'Bunnik': 'utrecht',
  'Lopik': 'utrecht', 'Oudewater': 'utrecht', 'Rhenen': 'utrecht',
  'Renswoude': 'utrecht', 'Woudenberg': 'utrecht', 'Eemnes': 'utrecht',
  'Montfoort': 'utrecht',

  // Noord-Holland
  'Amsterdam': 'noord-holland', 'Haarlem': 'noord-holland', 'Zaanstad': 'noord-holland',
  'Haarlemmermeer': 'noord-holland', 'Alkmaar': 'noord-holland', 'Hilversum': 'noord-holland',
  'Hoorn': 'noord-holland', 'Purmerend': 'noord-holland', 'Velsen': 'noord-holland',
  'Den Helder': 'noord-holland', 'Enkhuizen': 'noord-holland', 'Amstelveen': 'noord-holland',
  'Beverwijk': 'noord-holland', 'Heemstede': 'noord-holland', 'Diemen': 'noord-holland',
  'Edam-Volendam': 'noord-holland', 'Medemblik': 'noord-holland', 'Koggenland': 'noord-holland',
  'Drechterland': 'noord-holland', 'Stede Broec': 'noord-holland', 'Schagen': 'noord-holland',
  'Texel': 'noord-holland', 'Heerhugowaard': 'noord-holland', 'Heiloo': 'noord-holland',
  'Castricum': 'noord-holland', 'Uitgeest': 'noord-holland', 'Bloemendaal': 'noord-holland',
  'Zandvoort': 'noord-holland', 'Opmeer': 'noord-holland', 'Aalsmeer': 'noord-holland',
  'Uithoorn': 'noord-holland', 'Ouder-Amstel': 'noord-holland', 'Waterland': 'noord-holland',
  'Oostzaan': 'noord-holland', 'Wormerland': 'noord-holland', 'Landsmeer': 'noord-holland',
  'Laren': 'noord-holland', 'Blaricum': 'noord-holland', 'Huizen': 'noord-holland',
  'Hillegom': 'noord-holland', 'Langedijk': 'noord-holland', 'Bergen (NH.)': 'noord-holland',
  'Gooise Meren': 'noord-holland', 'Hollands Kroon': 'noord-holland', 'Weesp': 'noord-holland',

  // Zuid-Holland
  'Rotterdam': 'zuid-holland', 'Den Haag': 'zuid-holland', "'s-Gravenhage": 'zuid-holland',
  'Dordrecht': 'zuid-holland', 'Leiden': 'zuid-holland', 'Zoetermeer': 'zuid-holland',
  'Delft': 'zuid-holland', 'Westland': 'zuid-holland', 'Alphen aan den Rijn': 'zuid-holland',
  'Leidschendam-Voorburg': 'zuid-holland', 'Pijnacker-Nootdorp': 'zuid-holland',
  'Schiedam': 'zuid-holland', 'Gouda': 'zuid-holland', 'Spijkenisse': 'zuid-holland',
  'Nissewaard': 'zuid-holland', 'Vlaardingen': 'zuid-holland', 'Capelle aan den IJssel': 'zuid-holland',
  'Barendrecht': 'zuid-holland', 'Lansingerland': 'zuid-holland', 'Ridderkerk': 'zuid-holland',
  'Maassluis': 'zuid-holland', 'Hellevoetsluis': 'zuid-holland', 'Brielle': 'zuid-holland',
  'Westvoorne': 'zuid-holland', 'Krimpen aan den IJssel': 'zuid-holland',
  'Hendrik-Ido-Ambacht': 'zuid-holland', 'Sliedrecht': 'zuid-holland',
  'Hardinxveld-Giessendam': 'zuid-holland', 'Gorinchem': 'zuid-holland',
  'Papendrecht': 'zuid-holland', 'Albrandswaard': 'zuid-holland',
  'Goeree-Overflakkee': 'zuid-holland', 'Hoeksche Waard': 'zuid-holland',
  'Krimpenerwaard': 'zuid-holland', 'Leiderdorp': 'zuid-holland',
  'Katwijk': 'zuid-holland', 'Wassenaar': 'zuid-holland', 'Voorschoten': 'zuid-holland',
  'Oegstgeest': 'zuid-holland', 'Zoeterwoude': 'zuid-holland',
  'Teylingen': 'zuid-holland', 'Kaag en Braassem': 'zuid-holland',
  'Nieuwkoop': 'zuid-holland', 'Waddinxveen': 'zuid-holland', 'Zuidplas': 'zuid-holland',
  'Bodegraven-Reeuwijk': 'zuid-holland', 'Midden-Delfland': 'zuid-holland',
  'Rijswijk': 'zuid-holland',

  // Zeeland
  'Middelburg': 'zeeland', 'Vlissingen': 'zeeland', 'Goes': 'zeeland',
  'Terneuzen': 'zeeland', 'Hulst': 'zeeland', 'Schouwen-Duiveland': 'zeeland',
  'Borsele': 'zeeland', 'Reimerswaal': 'zeeland', 'Kapelle': 'zeeland',
  'Noord-Beveland': 'zeeland', 'Veere': 'zeeland', 'Sluis': 'zeeland',
  'Tholen': 'zeeland',

  // Noord-Brabant
  'Eindhoven': 'noord-brabant', 'Tilburg': 'noord-brabant', 'Breda': 'noord-brabant',
  'Helmond': 'noord-brabant', "'s-Hertogenbosch": 'noord-brabant', 'Oss': 'noord-brabant',
  'Bergen op Zoom': 'noord-brabant', 'Roosendaal': 'noord-brabant',
  'Oosterhout': 'noord-brabant', 'Veldhoven': 'noord-brabant', 'Waalwijk': 'noord-brabant',
  'Uden': 'noord-brabant', 'Meierijstad': 'noord-brabant', 'Altena': 'noord-brabant',
  'Moerdijk': 'noord-brabant', 'Deurne': 'noord-brabant', 'Best': 'noord-brabant',
  'Geldrop-Mierlo': 'noord-brabant', 'Boxtel': 'noord-brabant', 'Bernheze': 'noord-brabant',
  'Landerd': 'noord-brabant', 'Gemert-Bakel': 'noord-brabant', 'Laarbeek': 'noord-brabant',
  'Nuenen c.a.': 'noord-brabant', 'Son en Breugel': 'noord-brabant',
  'Valkenswaard': 'noord-brabant', 'Waalre': 'noord-brabant', 'Cranendonck': 'noord-brabant',
  'Heeze-Leende': 'noord-brabant', 'Asten': 'noord-brabant', 'Someren': 'noord-brabant',
  'Bladel': 'noord-brabant', 'Eersel': 'noord-brabant', 'Reusel-De Mierden': 'noord-brabant',
  'Oirschot': 'noord-brabant', 'Hilvarenbeek': 'noord-brabant', 'Loon op Zand': 'noord-brabant',
  'Dongen': 'noord-brabant', 'Gilze en Rijen': 'noord-brabant', 'Alphen-Chaam': 'noord-brabant',
  'Baarle-Nassau': 'noord-brabant', 'Drimmelen': 'noord-brabant',
  'Geertruidenberg': 'noord-brabant', 'Halderberge': 'noord-brabant',
  'Steenbergen': 'noord-brabant', 'Woensdrecht': 'noord-brabant', 'Zundert': 'noord-brabant',
  'Sint-Michielsgestel': 'noord-brabant', 'Heusden': 'noord-brabant',
  'Vught': 'noord-brabant', 'Oisterwijk': 'noord-brabant', 'Boekel': 'noord-brabant',
  'Cuijk': 'noord-brabant', 'Land van Cuijk': 'noord-brabant', 'Mill en Sint Hubert': 'noord-brabant',
  'Boxmeer': 'noord-brabant', 'Mook en Middelaar': 'noord-brabant',

  // Limburg
  'Maastricht': 'limburg', 'Venlo': 'limburg', 'Sittard-Geleen': 'limburg',
  'Heerlen': 'limburg', 'Roermond': 'limburg', 'Weert': 'limburg',
  'Venray': 'limburg', 'Horst aan de Maas': 'limburg', 'Peel en Maas': 'limburg',
  'Bergen (L.)': 'limburg', 'Gennep': 'limburg', 'Beesel': 'limburg',
  'Leudal': 'limburg', 'Roerdalen': 'limburg', 'Maasgouw': 'limburg',
  'Echt-Susteren': 'limburg', 'Brunssum': 'limburg', 'Kerkrade': 'limburg',
  'Landgraaf': 'limburg', 'Simpelveld': 'limburg', 'Voerendaal': 'limburg',
  'Beek': 'limburg', 'Stein': 'limburg', 'Schinnen': 'limburg',
  'Nuth': 'limburg', 'Eijsden-Margraten': 'limburg', 'Gulpen-Wittem': 'limburg',
  'Vaals': 'limburg', 'Valkenburg aan de Geul': 'limburg', 'Meerssen': 'limburg',
  'Onderbanken': 'limburg', 'Nederwert': 'limburg', 'Nederweert': 'limburg',

  // Flevoland
  'Almere': 'flevoland', 'Lelystad': 'flevoland', 'Dronten': 'flevoland',
  'Noordoostpolder': 'flevoland', 'Urk': 'flevoland', 'Zeewolde': 'flevoland',
}

type Netcongestie = 'ROOD' | 'ORANJE' | 'GROEN'

interface WijkEntry {
  wijk: string; stad: string; provincie: string
  bouwjaar: number; netcongestie: Netcongestie; aantalWoningen?: number
}

function toSlug(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

function deriveBouwjaar(voor2000pct: number): number {
  if (voor2000pct <= 20) return 2005
  if (voor2000pct <= 40) return 1998
  if (voor2000pct <= 60) return 1990
  if (voor2000pct <= 75) return 1982
  return 1972
}

function deriveNetcongestie(gemeente: string): Netcongestie {
  const rood = ['Amsterdam', 'Rotterdam', 'Utrecht', 'Den Haag', "'s-Gravenhage", 'Eindhoven',
    'Almere', 'Breda', 'Tilburg', 'Apeldoorn', 'Nijmegen', 'Groningen', 'Arnhem',
    'Enschede', 'Zaanstad', 'Zwolle', 'Haarlem', 'Haarlemmermeer', 'Leiden', 'Dordrecht']
  const groen = ['Texel', 'Ameland', 'Terschelling', 'Vlieland', 'Schiermonnikoog',
    'Sluis', 'Borsele', 'Hulst', 'Vaals', 'Gulpen-Wittem', 'Tholen']
  if (rood.includes(gemeente)) return 'ROOD'
  if (groen.includes(gemeente)) return 'GROEN'
  return 'ORANJE'
}

async function run() {
  const seedPath = resolve(__dir, 'seed-wijken.ts')
  const seedContent = readFileSync(seedPath, 'utf-8')

  // Extract existing (wijk slug | stad slug) combinations
  const existingSlugs = new Set<string>()
  const re = /wijk:\s*["']([^"']+)["'][^}]*stad:\s*["']([^"']+)["']/g
  let m: RegExpExecArray | null
  while ((m = re.exec(seedContent)) !== null) {
    existingSlugs.add(`${toSlug(m[1])}|${toSlug(m[2])}`)
  }
  console.log(`Bestaande wijken in seed: ${existingSlugs.size}`)
  const needed = TARGET - existingSlugs.size
  console.log(`Toe te voegen: ~${needed}`)

  // ── Fetch CBS wijk names (één request) ──────────────────────────────────────
  console.log('CBS wijk-namen ophalen...')
  const namesUrl = `https://opendata.cbs.nl/ODataApi/odata/85318NED/WijkenEnBuurten` +
    `?$filter=startswith(Key, 'WK')&$select=Key,Title&$top=5000`
  const namesRes = await fetch(namesUrl, { signal: AbortSignal.timeout(30000) })
  const namesJson = await namesRes.json() as { value: { Key: string; Title: string }[] }
  const namesMap = new Map(namesJson.value.map(x => [x.Key.trim(), x.Title.trim()]))
  console.log(`  ${namesMap.size} wijk-namen opgehaald`)

  // ── Fetch CBS stats (één request) ───────────────────────────────────────────
  console.log('CBS statistieken ophalen...')
  const statsUrl = `https://opendata.cbs.nl/ODataApi/odata/85318NED/TypedDataSet` +
    `?$filter=startswith(WijkenEnBuurten, 'WK')` +
    `&$select=WijkenEnBuurten,Gemeentenaam_1,AantalInwoners_5,BouwjaarVoor2000_45,BouwjaarVanaf2000_46` +
    `&$top=5000`
  const statsRes = await fetch(statsUrl, { signal: AbortSignal.timeout(30000) })
  const statsJson = await statsRes.json() as { value: {
    WijkenEnBuurten: string; Gemeentenaam_1: string
    AantalInwoners_5: number; BouwjaarVoor2000_45: number; BouwjaarVanaf2000_46: number
  }[] }
  console.log(`  ${statsJson.value.length} wijk-statistieken opgehaald`)

  // ── Merge ────────────────────────────────────────────────────────────────────
  const allWijken = statsJson.value.map(item => {
    const code = item.WijkenEnBuurten.trim()
    const naam = namesMap.get(code) ?? ''
    const total = (item.BouwjaarVoor2000_45 ?? 0) + (item.BouwjaarVanaf2000_46 ?? 0)
    const voor2000pct = total > 0 ? Math.round((item.BouwjaarVoor2000_45 ?? 0) / total * 100) : 75
    return {
      naam,
      gemeente: item.Gemeentenaam_1.trim(),
      inwoners: item.AantalInwoners_5 ?? 0,
      voor2000pct,
    }
  }).filter(x => x.naam)

  // Sort: verplichte gemeenten eerst, daarna op inwoners aflopend
  allWijken.sort((a, b) => {
    const aV = VERPLICHTE_GEMEENTEN.includes(a.gemeente) ? 1 : 0
    const bV = VERPLICHTE_GEMEENTEN.includes(b.gemeente) ? 1 : 0
    if (aV !== bV) return bV - aV
    return b.inwoners - a.inwoners
  })

  // ── Selecteer nieuwe entries ─────────────────────────────────────────────────
  const newEntries: WijkEntry[] = []
  let verplichtCount = 0

  for (const item of allWijken) {
    const isVerplicht = VERPLICHTE_GEMEENTEN.includes(item.gemeente)
    if (!isVerplicht && newEntries.length >= needed) break
    if (!isVerplicht && item.inwoners < 200) continue

    const cleanNaam = item.naam.replace(/^Wijk \d+\s*/i, '').trim() || item.naam
    const slug = `${toSlug(cleanNaam)}|${toSlug(item.gemeente)}`
    if (existingSlugs.has(slug)) continue

    const provincie = GP[item.gemeente]
    if (!provincie) {
      if (isVerplicht) console.warn(`  ⚠ Geen provincie gevonden voor: ${item.gemeente}`)
      continue
    }

    existingSlugs.add(slug)
    if (isVerplicht) verplichtCount++
    newEntries.push({
      wijk: cleanNaam, stad: item.gemeente, provincie,
      bouwjaar: deriveBouwjaar(item.voor2000pct),
      netcongestie: deriveNetcongestie(item.gemeente),
      aantalWoningen: Math.round(item.inwoners * 0.42),
    })
  }

  console.log(`\nVerplichte gemeenten: ${verplichtCount} wijken`)
  console.log(`Nieuwe entries totaal: ${newEntries.length}`)
  console.log(`Verwacht eindtotaal:   ~${existingSlugs.size}`)

  if (DRY_RUN) {
    console.log('\n── Bergen op Zoom wijken ──')
    newEntries.filter(e => e.stad === 'Bergen op Zoom').forEach(e => console.log(`  ${e.wijk}`))
    console.log('\n── Tholen wijken ──')
    newEntries.filter(e => e.stad === 'Tholen').forEach(e => console.log(`  ${e.wijk}`))
    console.log('\n── Top 10 overige ──')
    newEntries.filter(e => !VERPLICHTE_GEMEENTEN.includes(e.stad)).slice(0, 10).forEach(e =>
      console.log(`  ${e.wijk} (${e.stad}) — ${e.aantalWoningen} woningen`)
    )
    return
  }

  // ── Schrijf naar seed-wijken.ts ──────────────────────────────────────────────
  const lines = newEntries.map(e =>
    `  { wijk: "${e.wijk}", stad: "${e.stad}", provincie: "${e.provincie}", bouwjaar: ${e.bouwjaar}, netcongestie: "${e.netcongestie}", aantalWoningen: ${e.aantalWoningen} },`
  ).join('\n')

  // Detecteer line ending (CRLF op Windows, LF op Unix)
  const nl = seedContent.includes('\r\n') ? '\r\n' : '\n'
  const marker = `]${nl}${nl}// ─── Main ─`
  if (!seedContent.includes(marker)) throw new Error('Insert-marker niet gevonden in seed-wijken.ts')

  const insertBlock = lines.split('\n').join(nl)
  const newContent = seedContent.replace(
    marker,
    `  // ── Uitbreiding batch 3 — CBS 2023 naar ${TARGET} wijken ──────────────────${nl}${insertBlock}${nl}]${nl}${nl}// ─── Main ─`
  )
  writeFileSync(seedPath, newContent, 'utf-8')
  console.log(`\n✓ ${newEntries.length} wijken toegevoegd aan seed-wijken.ts`)
}

run().catch(e => { console.error(e); process.exit(1) })
