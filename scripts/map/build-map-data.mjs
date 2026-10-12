// Builds src/content/data/map-base.json: the background of the route map (Gaza Strip area, main roads,
// towns) from OpenStreetMap via Overpass, plus the driving route between the stations from OSRM.
//
// Needs internet access to overpass-api.de and router.project-osrm.org, so it runs in GitHub Actions
// (.github/workflows/map-data.yml), not in the cloud container. Re-run it whenever a station's
// coordinates change (tests/integrity/map-data.test.ts fails until you do).
//
// Data © OpenStreetMap contributors, ODbL 1.0 — the map shows this attribution.
//
// Usage: node scripts/map/build-map-data.mjs [--out src/content/data/map-base.json]

import { readFileSync, writeFileSync } from 'node:fs';
import {
  clipLine,
  clipPolygon,
  nearestOnLines,
  roundCoords,
  simplify,
  stitch,
} from './geo-utils.mjs';

const OUT = process.argv.includes('--out')
  ? process.argv[process.argv.indexOf('--out') + 1]
  : 'src/content/data/map-base.json';
const STATIONS = 'src/content/data/stations.json';

/** Map window (lng/lat). Covers Sderot (N) to Re'im (S), the Gaza border (W) to Netivot (E). */
const BBOX = { south: 31.365, west: 34.405, north: 31.545, east: 34.645 };
const REF_LAT = (BBOX.south + BBOX.north) / 2;

/** Roads drawn with a number shield. Others of the same classes are drawn unlabelled. */
const LABELLED_ROADS = ['232', '34', '25', '4', '241', '242'];

/** Places drawn on the map, matched on OSM name:en (letters only, lower case). `major` = larger label. */
const PLACES = [
  { en: 'sderot', major: true },
  { en: 'netivot', major: true },
  { en: 'kfaraza' },
  { en: 'nahaloz' },
  { en: 'beeri' },
  { en: 'reim' },
  { en: 'saad' },
  { en: 'mefalsim' },
  { en: 'niram' },
  { en: 'alumim' },
  { en: 'tkuma' },
  { en: 'kissufim' },
  { en: 'einhashlosha' },
  { en: 'orhaner' },
  { en: 'ibim' },
  { en: 'shuva' },
  { en: 'kfarmaimon' },
];
const norm = (s) => (s ?? '').toLowerCase().replace(/[^a-z]/g, '');

const OVERPASS = 'https://overpass-api.de/api/interpreter';
const OSRM = 'https://router.project-osrm.org/route/v1/driving';
const UA = 'faces-to-numbers map-data build (github.com/ShukiPesso/faces-to-numbers)';

const log = (...a) => process.stderr.write(`[map-data] ${a.join(' ')}\n`);

async function overpass() {
  const b = `${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east}`;
  const q = `[out:json][timeout:120];
way["highway"~"^(motorway|trunk|primary|secondary)$"](${b});
out geom tags;
node["place"~"^(city|town|village|hamlet)$"](${b});
out tags;
rel["type"="boundary"]["name:en"="Gaza Strip"];
out geom;`;
  const res = await fetch(OVERPASS, {
    method: 'POST',
    headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(q)}`,
  });
  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

async function osrmLeg(points) {
  const coords = points.map(([lng, lat]) => `${lng.toFixed(6)},${lat.toFixed(6)}`).join(';');
  const res = await fetch(`${OSRM}/${coords}?overview=full&geometries=geojson`, {
    headers: { 'User-Agent': UA },
  });
  if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.[0]) throw new Error(`OSRM ${data.code}`);
  return {
    coords: data.routes[0].geometry.coordinates,
    distanceM: Math.round(data.routes[0].distance),
  };
}

const ll = (g) => [g.lon, g.lat];

function buildRoads(elements) {
  const groups = new Map();
  for (const el of elements) {
    if (el.type !== 'way' || !el.geometry) continue;
    const cls = el.tags.highway;
    const ref = (el.tags.ref ?? '').split(';')[0].trim();
    const key = `${cls}|${ref}`;
    if (!groups.has(key)) groups.set(key, { cls, ref, ways: [] });
    groups.get(key).ways.push(el.geometry.map(ll));
  }
  const roads = [];
  for (const { cls, ref, ways } of groups.values()) {
    for (const line of stitch(ways)) {
      for (const piece of clipLine(line, BBOX)) {
        const s = roundCoords(simplify(piece, 12, REF_LAT));
        if (s.length >= 2)
          roads.push({ ref, cls, labelled: LABELLED_ROADS.includes(ref), coords: s });
      }
    }
  }
  const order = { secondary: 0, primary: 1, trunk: 2, motorway: 3 };
  roads.sort((a, b) => order[a.cls] - order[b.cls]);
  return roads;
}

function buildPlaces(elements) {
  const found = new Map();
  for (const el of elements) {
    if (el.type !== 'node' || !el.tags?.place) continue;
    const key = norm(el.tags['name:en']);
    const spec = PLACES.find((p) => p.en === key);
    if (!spec || found.has(key)) continue;
    found.set(key, {
      id: key,
      name: el.tags['name:he'] ?? el.tags.name,
      major: Boolean(spec.major),
      lng: Math.round(el.lon * 1e5) / 1e5,
      lat: Math.round(el.lat * 1e5) / 1e5,
    });
  }
  const missing = PLACES.filter((p) => !found.has(p.en)).map((p) => p.en);
  if (missing.length > 0) log(`places not found in OSM (skipped): ${missing.join(', ')}`);
  return PLACES.filter((p) => found.has(p.en)).map((p) => found.get(p.en));
}

function buildGaza(elements) {
  const rel = elements.find((e) => e.type === 'relation');
  if (!rel) throw new Error('Gaza Strip boundary relation not found');
  const outers = rel.members.filter((m) => m.type === 'way' && m.role !== 'inner' && m.geometry);
  const rings = stitch(outers.map((m) => m.geometry.map(ll)));
  const polys = [];
  for (const ring of rings) {
    if (ring.length < 4) continue;
    const clipped = clipPolygon(ring, BBOX);
    if (clipped.length > 0) polys.push(roundCoords(simplify(clipped, 20, REF_LAT)));
  }
  if (polys.length === 0) throw new Error('Gaza Strip polygon does not intersect the map window');
  return polys;
}

async function buildRoute(stations, places, roads) {
  const byId = Object.fromEntries(stations.map((s) => [s.id, s]));
  const pt = (id) => {
    const loc = byId[id]?.location;
    return loc ? [loc.lng, loc.lat] : null;
  };
  const r232 = roads.filter((r) => r.ref === '232').map((r) => r.coords);
  const place = (id) => places.find((p) => p.id === id);
  const via = (id) => {
    const p = place(id);
    return p && r232.length > 0 ? nearestOnLines([p.lng, p.lat], r232, REF_LAT) : null;
  };
  const netivot = place('netivot');
  const legs = [
    {
      from: 'sderot',
      to: 'observers-hill',
      station: 'route-232',
      points: [pt('sderot'), via('mefalsim'), via('kfaraza'), pt('observers-hill')],
    },
    {
      from: 'observers-hill',
      to: 'reim-shelter',
      points: [pt('observers-hill'), pt('reim-shelter')],
    },
    { from: 'reim-shelter', to: 'nova', points: [pt('reim-shelter'), pt('nova')] },
    { from: 'nova', to: 'tkuma', points: [pt('nova'), pt('tkuma')] },
    { from: 'tkuma', to: 'closing-drive', points: [pt('tkuma'), pt('closing-drive')] },
    {
      from: 'closing-drive',
      to: 'netivot',
      station: 'closing-drive',
      points: [pt('closing-drive'), netivot ? [netivot.lng, netivot.lat] : null],
    },
  ];
  const out = [];
  for (const leg of legs) {
    const points = leg.points.filter(Boolean);
    if (points.length < 2 || !pt(leg.from)) {
      log(`route leg ${leg.from} → ${leg.to}: missing coordinates, skipped`);
      continue;
    }
    let coords;
    let distanceM = null;
    let approximate = false;
    try {
      ({ coords, distanceM } = await osrmLeg(points));
    } catch (e) {
      log(`route leg ${leg.from} → ${leg.to}: OSRM failed (${e.message}), straight line used`);
      coords = points;
      approximate = true;
    }
    out.push({
      from: leg.from,
      to: leg.to,
      ...(leg.station ? { station: leg.station } : {}),
      approximate,
      distanceM,
      coords: roundCoords(simplify(coords, 8, REF_LAT)),
    });
    await new Promise((r) => setTimeout(r, 1100)); // be gentle with the public OSRM server
  }
  return out;
}

async function main() {
  const stations = JSON.parse(readFileSync(STATIONS, 'utf8'));
  const list = Array.isArray(stations) ? stations : stations.stations;
  log('querying Overpass…');
  const osm = await overpass();
  const roads = buildRoads(osm.elements);
  const places = buildPlaces(osm.elements);
  const gaza = buildGaza(osm.elements);
  log(`roads: ${roads.length} lines, places: ${places.length}, gaza rings: ${gaza.length}`);
  log('routing with OSRM…');
  const route = await buildRoute(list, places, roads);
  const data = {
    generatedAt: new Date().toISOString().slice(0, 10),
    attribution: '© OpenStreetMap contributors',
    license: 'ODbL 1.0 (https://www.openstreetmap.org/copyright)',
    bbox: BBOX,
    // The station coordinates this file was built from. tests/integrity/map-data.test.ts compares them
    // with stations.json, so a changed coordinate cannot ship with a stale route.
    inputs: Object.fromEntries(
      list.filter((s) => s.location).map((s) => [s.id, [s.location.lng, s.location.lat]]),
    ),
    gaza,
    roads,
    places,
    route,
  };
  writeFileSync(OUT, `${JSON.stringify(data)}\n`);
  log(`wrote ${OUT} (${JSON.stringify(data).length} bytes)`);
}

main().catch((e) => {
  log(`FAILED: ${e.message}`);
  process.exit(1);
});
