// Pure geometry helpers for scripts/map/build-map-data.mjs (unit-tested in tests/unit/map-geo-utils.test.ts).
// Coordinates are [lng, lat] (GeoJSON order) throughout.

const R = 6371000;
const toRad = (d) => (d * Math.PI) / 180;

/** Local equirectangular projection to metres around a reference latitude (good to <0.1% over 30 km). */
export function toMetres([lng, lat], refLat) {
  return [toRad(lng) * R * Math.cos(toRad(refLat)), toRad(lat) * R];
}

function perpDist(p, a, b) {
  const [px, py] = p;
  const [ax, ay] = a;
  const [bx, by] = b;
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Douglas–Peucker simplification with a tolerance in metres. Keeps first and last points. */
export function simplify(coords, toleranceM, refLat) {
  if (coords.length <= 2) return coords.slice();
  const m = coords.map((c) => toMetres(c, refLat));
  const keep = new Uint8Array(coords.length);
  keep[0] = 1;
  keep[coords.length - 1] = 1;
  const stack = [[0, coords.length - 1]];
  while (stack.length > 0) {
    const [s, e] = stack.pop();
    let maxD = 0;
    let idx = -1;
    for (let i = s + 1; i < e; i++) {
      const d = perpDist(m[i], m[s], m[e]);
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (idx !== -1 && maxD > toleranceM) {
      keep[idx] = 1;
      stack.push([s, idx], [idx, e]);
    }
  }
  return coords.filter((_, i) => keep[i] === 1);
}

/** Rounds every coordinate to `digits` decimals (5 ≈ 1 m). */
export function roundCoords(coords, digits = 5) {
  const f = 10 ** digits;
  return coords.map(([x, y]) => [Math.round(x * f) / f, Math.round(y * f) / f]);
}

const same = (a, b) => a[0] === b[0] && a[1] === b[1];

/** Joins way geometries that share end points into the longest possible rings/lines. */
export function stitch(ways) {
  const pool = ways.filter((w) => w.length >= 2).map((w) => w.slice());
  const out = [];
  while (pool.length > 0) {
    let line = pool.shift();
    let grown = true;
    while (grown && !same(line[0], line[line.length - 1])) {
      grown = false;
      for (let i = 0; i < pool.length; i++) {
        const w = pool[i];
        const head = line[0];
        const tail = line[line.length - 1];
        if (same(tail, w[0])) line = line.concat(w.slice(1));
        else if (same(tail, w[w.length - 1])) line = line.concat(w.slice(0, -1).reverse());
        else if (same(head, w[w.length - 1])) line = w.concat(line.slice(1));
        else if (same(head, w[0])) line = w.slice().reverse().concat(line.slice(1));
        else continue;
        pool.splice(i, 1);
        grown = true;
        break;
      }
    }
    out.push(line);
  }
  return out;
}

/** Sutherland–Hodgman clip of a closed polygon ring to a lng/lat box. Returns [] when outside. */
export function clipPolygon(ring, { west, south, east, north }) {
  const edges = [
    [(p) => p[0] >= west, (a, b) => lerpX(a, b, west)],
    [(p) => p[0] <= east, (a, b) => lerpX(a, b, east)],
    [(p) => p[1] >= south, (a, b) => lerpY(a, b, south)],
    [(p) => p[1] <= north, (a, b) => lerpY(a, b, north)],
  ];
  let poly = same(ring[0], ring[ring.length - 1]) ? ring.slice(0, -1) : ring.slice();
  for (const [inside, cut] of edges) {
    if (poly.length === 0) break;
    const next = [];
    for (let i = 0; i < poly.length; i++) {
      const cur = poly[i];
      const prev = poly[(i + poly.length - 1) % poly.length];
      if (inside(cur)) {
        if (!inside(prev)) next.push(cut(prev, cur));
        next.push(cur);
      } else if (inside(prev)) {
        next.push(cut(prev, cur));
      }
    }
    poly = next;
  }
  return poly.length >= 3 ? [...poly, poly[0]] : [];
}

function lerpX(a, b, x) {
  const t = (x - a[0]) / (b[0] - a[0]);
  return [x, a[1] + t * (b[1] - a[1])];
}
function lerpY(a, b, y) {
  const t = (y - a[1]) / (b[1] - a[1]);
  return [a[0] + t * (b[0] - a[0]), y];
}

/** Clips a polyline to a box, returning the pieces that lie inside (endpoints interpolated). */
export function clipLine(coords, box) {
  const inBox = (p) =>
    p[0] >= box.west && p[0] <= box.east && p[1] >= box.south && p[1] <= box.north;
  const pieces = [];
  let cur = [];
  for (let i = 0; i < coords.length; i++) {
    const p = coords[i];
    if (inBox(p)) {
      if (cur.length === 0 && i > 0) cur.push(edgePoint(coords[i - 1], p, box));
      cur.push(p);
    } else if (cur.length > 0) {
      cur.push(edgePoint(p, coords[i - 1], box));
      pieces.push(cur);
      cur = [];
    }
  }
  if (cur.length > 0) pieces.push(cur);
  return pieces.filter((pc) => pc.length >= 2);
}

/** Point where segment out→in crosses the box boundary (out is outside, in is inside). */
function edgePoint(out, inside, box) {
  let lo = 0;
  let hi = 1;
  for (let k = 0; k < 30; k++) {
    const mid = (lo + hi) / 2;
    const p = [out[0] + (inside[0] - out[0]) * mid, out[1] + (inside[1] - out[1]) * mid];
    const ok = p[0] >= box.west && p[0] <= box.east && p[1] >= box.south && p[1] <= box.north;
    if (ok) hi = mid;
    else lo = mid;
  }
  return [out[0] + (inside[0] - out[0]) * hi, out[1] + (inside[1] - out[1]) * hi];
}

/** The point on any of `lines` closest to `p` (all [lng, lat]). */
export function nearestOnLines(p, lines, refLat) {
  const pm = toMetres(p, refLat);
  let best = null;
  let bestD = Infinity;
  for (const line of lines) {
    for (let i = 1; i < line.length; i++) {
      const a = toMetres(line[i - 1], refLat);
      const b = toMetres(line[i], refLat);
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const len2 = dx * dx + dy * dy;
      const t =
        len2 === 0
          ? 0
          : Math.max(0, Math.min(1, ((pm[0] - a[0]) * dx + (pm[1] - a[1]) * dy) / len2));
      const d = Math.hypot(pm[0] - (a[0] + t * dx), pm[1] - (a[1] + t * dy));
      if (d < bestD) {
        bestD = d;
        const A = line[i - 1];
        const B = line[i];
        best = [A[0] + t * (B[0] - A[0]), A[1] + t * (B[1] - A[1])];
      }
    }
  }
  return best;
}
