/**
 * BAG/Kadaster adapter — TypeScript port of bag_scraper.py
 * Uses PDOK public API (no auth) + Mapbox geocoding (server-side token).
 */

const MAPBOX_GEOCODE_URL =
  'https://api.mapbox.com/geocoding/v5/mapbox.places/{query}.json'
const BAG_PAND_ITEMS =
  'https://api.pdok.nl/kadaster/bag/ogc/v2/collections/pand/items'

// ---------------------------------------------------------------------------
// Public result type
// ---------------------------------------------------------------------------

export interface BagResult {
  bouwjaar: number | null
  oppervlakte: number | null
  woningtype: string | null
  postcode: string | null
  huisnummer: number | null
  lat: number
  lon: number
  pandId: string | null
  dakOppervlakte: number | null // estimated from pand polygon area
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

type Coordinate = [number, number] // [lon, lat]

type GeoJsonGeometry =
  | { type: 'Polygon'; coordinates: Coordinate[][] }
  | { type: 'MultiPolygon'; coordinates: Coordinate[][][] }
  | { type: string; coordinates: unknown }

interface GeoJsonFeature {
  type: 'Feature'
  geometry: GeoJsonGeometry | null
  properties: Record<string, unknown> | null
}

interface GeoJsonFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJsonFeature[]
}

async function httpGetJson<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`)
  }
  return res.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// Geometry utilities (ray-casting, shoelace area, haversine)
// ---------------------------------------------------------------------------

function pointInRing(lon: number, lat: number, ring: Coordinate[]): boolean {
  const n = ring.length
  if (n < 3) return false
  let inside = false
  let j = n - 1
  for (let i = 0; i < n; i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-30) + xi) {
      inside = !inside
    }
    j = i
  }
  return inside
}

export function pointInPolygon(lon: number, lat: number, geometry: GeoJsonGeometry): boolean {
  if (geometry.type === 'Polygon') {
    const coords = geometry.coordinates as Coordinate[][]
    if (!coords?.length) return false
    if (!pointInRing(lon, lat, coords[0])) return false
    for (let h = 1; h < coords.length; h++) {
      if (pointInRing(lon, lat, coords[h])) return false
    }
    return true
  }
  if (geometry.type === 'MultiPolygon') {
    const coords = geometry.coordinates as Coordinate[][][]
    if (!coords?.length) return false
    for (const poly of coords) {
      if (pointInRing(lon, lat, poly[0])) {
        const inHole = poly.slice(1).some((h) => pointInRing(lon, lat, h))
        if (!inHole) return true
      }
    }
    return false
  }
  return false
}

export function ringAreaSqDeg(ring: Coordinate[]): number {
  const n = ring.length
  if (n < 3) return 0
  let s = 0
  for (let i = 0; i < n - 1; i++) {
    const [x1, y1] = ring[i]
    const [x2, y2] = ring[i + 1]
    s += x1 * y2 - x2 * y1
  }
  return Math.abs(s) * 0.5
}

/** Returns the area (sq deg) of the containing shell, or Infinity if the point is not inside. */
function containingShellArea(lon: number, lat: number, feat: GeoJsonFeature): number {
  const geom = feat.geometry
  if (!geom) return Infinity
  if (geom.type === 'Polygon') {
    const coords = geom.coordinates as Coordinate[][]
    if (
      coords?.length &&
      pointInRing(lon, lat, coords[0]) &&
      !coords.slice(1).some((h) => pointInRing(lon, lat, h))
    ) {
      return ringAreaSqDeg(coords[0])
    }
  } else if (geom.type === 'MultiPolygon') {
    const coords = geom.coordinates as Coordinate[][][]
    if (coords?.length) {
      for (const poly of coords) {
        if (
          poly.length &&
          pointInRing(lon, lat, poly[0]) &&
          !poly.slice(1).some((h) => pointInRing(lon, lat, h))
        ) {
          return ringAreaSqDeg(poly[0])
        }
      }
    }
  }
  return Infinity
}

export function haversineM(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const R = 6_371_000
  const p1 = (lat1 * Math.PI) / 180
  const p2 = (lat2 * Math.PI) / 180
  const dPhi = ((lat2 - lat1) * Math.PI) / 180
  const dLambda = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dLambda / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)))
}

// ---------------------------------------------------------------------------
// Step 1: Geocode via Mapbox
// ---------------------------------------------------------------------------

interface GeocodeResult {
  lat: number
  lon: number
  houseNumber: string | null
  placeType: string
}

export async function geocodeMapbox(address: string): Promise<GeocodeResult & { raw: unknown }> {
  const token = process.env.MAPBOX_ACCESS_TOKEN?.trim()
  if (!token) throw new Error('MAPBOX_ACCESS_TOKEN is not set')

  const query = encodeURIComponent(address)
  const params = new URLSearchParams({
    access_token: token,
    limit: '1',
    country: 'NL',
    types: 'address',
    language: 'nl',
  })
  const url = `${MAPBOX_GEOCODE_URL.replace('{query}', query)}?${params}`

  const data = await httpGetJson<{ features?: Array<Record<string, unknown>> }>(url)
  const features = data.features ?? []
  if (!features.length) throw new Error(`Geen adres gevonden voor: ${address}`)

  const feat = features[0]
  const geometry = feat.geometry as { coordinates: [number, number] }
  const [lon, lat] = geometry.coordinates
  const props = (feat.properties ?? {}) as Record<string, unknown>

  // Mapbox returns house number in properties.address for NL addresses
  let houseNumber: string | null = null
  if (typeof props.address === 'string' && props.address) {
    houseNumber = props.address.trim()
  }

  const placeType =
    Array.isArray(feat.place_type) && feat.place_type.length
      ? String(feat.place_type[0])
      : 'address'

  return { lat, lon, houseNumber, placeType, raw: feat }
}

// ---------------------------------------------------------------------------
// Step 2: Pick smallest pand polygon containing the point
// ---------------------------------------------------------------------------

interface PandResult {
  pandId: string | null
  bouwjaar: number | null
  verblijfsobjectHrefs: string[]
  polygon: GeoJsonGeometry | null
  shellAreaSqDeg: number
}

async function fetchPandFeatures(
  lon: number,
  lat: number,
  halfSize: number,
): Promise<GeoJsonFeature[]> {
  const bbox = `${lon - halfSize},${lat - halfSize},${lon + halfSize},${lat + halfSize}`
  const params = new URLSearchParams({ bbox, f: 'json', limit: '50' })
  const data = await httpGetJson<GeoJsonFeatureCollection>(
    `${BAG_PAND_ITEMS}?${params}`,
  )
  return data.features ?? []
}

export async function pickPand(lat: number, lon: number): Promise<PandResult> {
  for (const hs of [0.00015, 0.0004, 0.001, 0.003]) {
    const features = await fetchPandFeatures(lon, lat, hs)
    const candidates = features.filter(
      (f) => f.geometry != null && pointInPolygon(lon, lat, f.geometry as GeoJsonGeometry),
    )
    if (candidates.length) {
      candidates.sort((a, b) => containingShellArea(lon, lat, a) - containingShellArea(lon, lat, b))
      const best = candidates[0]
      const props = best.properties ?? {}

      // Extract verblijfsobject hrefs — field name varies across API versions
      const rawHref =
        props['verblijfsobject.href'] ??
        props['verblijfsobject'] ??
        []
      const hrefs: string[] = typeof rawHref === 'string' ? [rawHref] : (rawHref as string[])

      const shellArea = containingShellArea(lon, lat, best)

      return {
        pandId: typeof props.identificatie === 'string' ? props.identificatie : null,
        bouwjaar: typeof props.bouwjaar === 'number' ? props.bouwjaar : null,
        verblijfsobjectHrefs: hrefs,
        polygon: best.geometry as GeoJsonGeometry,
        shellAreaSqDeg: shellArea,
      }
    }
  }
  throw new Error('Geen pand gevonden op deze locatie.')
}

// ---------------------------------------------------------------------------
// Step 3: Fetch matching verblijfsobject
// ---------------------------------------------------------------------------

interface VerblijfsobjectResult {
  postcode: string | null
  huisnummer: number | null
  oppervlakte: number | null
  verblijfsobjectId: string | null
}

export async function getVerblijfsobject(
  hrefs: string[],
  geocodedHouseNumber: string | null,
  lat: number,
  lon: number,
): Promise<VerblijfsobjectResult> {
  if (!hrefs.length) {
    return { postcode: null, huisnummer: null, oppervlakte: null, verblijfsobjectId: null }
  }

  /** Ensure the href has f=json appended */
  function ensureJson(href: string): string {
    return href.endsWith('f=json') ? href : `${href}${href.includes('?') ? '&' : '?'}f=json`
  }

  let targetNr: number | null = null
  if (geocodedHouseNumber) {
    const parsed = parseInt(geocodedHouseNumber, 10)
    if (!isNaN(parsed)) targetNr = parsed
  }

  let voFeature: Record<string, unknown> | null = null

  // Pass 1: match by house number
  if (targetNr !== null) {
    for (const href of hrefs) {
      try {
        const vo = await httpGetJson<Record<string, unknown>>(ensureJson(href))
        const vProps = (vo.properties as Record<string, unknown>) ?? {}
        if (vProps.huisnummer === targetNr) {
          voFeature = vo
          break
        }
      } catch {
        // continue to next href
      }
    }
  }

  // Pass 2: closest by haversine distance
  if (!voFeature) {
    let bestDist = Infinity
    for (const href of hrefs) {
      try {
        const vo = await httpGetJson<Record<string, unknown>>(ensureJson(href))
        const geom = vo.geometry as { coordinates?: [number, number] } | null
        if (geom?.coordinates) {
          const [vLon, vLat] = geom.coordinates
          const d = haversineM(lon, lat, vLon, vLat)
          if (d < bestDist) {
            bestDist = d
            voFeature = vo
          }
        }
      } catch {
        // continue
      }
    }
  }

  if (!voFeature) {
    return { postcode: null, huisnummer: null, oppervlakte: null, verblijfsobjectId: null }
  }

  const p = (voFeature.properties as Record<string, unknown>) ?? {}
  return {
    postcode: typeof p.postcode === 'string' ? p.postcode : null,
    huisnummer: typeof p.huisnummer === 'number' ? p.huisnummer : null,
    oppervlakte: typeof p.oppervlakte === 'number' ? p.oppervlakte : null,
    verblijfsobjectId: typeof p.identificatie === 'string' ? p.identificatie : null,
  }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function getBagData(adres: string): Promise<BagResult | null> {
  try {
    const { lat, lon, houseNumber, raw } = await geocodeMapbox(adres)

    // Derive woningtype from raw Mapbox feature
    const mbProps = ((raw as Record<string, unknown>).properties as Record<string, unknown>) ?? {}
    const woningtype =
      typeof mbProps.category === 'string' && mbProps.category
        ? mbProps.category
        : 'Woning'

    const pand = await pickPand(lat, lon)

    const vo = await getVerblijfsobject(pand.verblijfsobjectHrefs, houseNumber, lat, lon)

    // Estimate roof area: area in sq degrees → sq metres using 1° ≈ 111 320 m
    const M_PER_DEG = 111_320
    const dakOppervlakte =
      pand.shellAreaSqDeg !== Infinity && pand.shellAreaSqDeg > 0
        ? Math.round(pand.shellAreaSqDeg * M_PER_DEG * M_PER_DEG)
        : null

    return {
      bouwjaar: pand.bouwjaar,
      oppervlakte: vo.oppervlakte,
      woningtype,
      postcode: vo.postcode,
      huisnummer: vo.huisnummer,
      lat,
      lon,
      pandId: pand.pandId,
      dakOppervlakte,
    }
  } catch (err) {
    console.error(`[BAG] Fout bij ophalen data voor ${adres}:`, err)
    return null
  }
}
