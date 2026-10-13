import { Route as RouteIcon } from 'lucide-react';
import { useId } from 'react';
import { SectionHeading } from '@/components/primitives';
import mapBaseJson from '@/content/data/map-base.json';
import type { Station } from '@/content/schema';
import { t } from '@/lib/i18n';

export interface RouteMapProps {
  stations: Station[];
  visitedIds: string[];
  currentId?: string;
}

/* ------------------------------------------------------------------ data */

type LngLat = [number, number];

/** Shape of src/content/data/map-base.json (built by scripts/map/build-map-data.mjs, M-01). */
export interface MapBase {
  generatedAt: string;
  attribution: string;
  bbox: { south: number; west: number; north: number; east: number };
  inputs: Record<string, LngLat>;
  gaza: LngLat[][];
  sea: LngLat[][];
  roads: { ref: string; cls: string; labelled: boolean; coords: LngLat[] }[];
  places: { id: string; name: string; major: boolean; lng: number; lat: number }[];
  route: {
    from: string;
    to: string;
    station?: string;
    approximate: boolean;
    distanceM: number | null;
    coords: LngLat[];
  }[];
}

const MAP = mapBaseJson as unknown as MapBase;

/* ------------------------------------------------------------ projection */

/** Map width in SVG units. Sizes below are tuned so text stays ≥ 11 px on a 360 px phone. */
const W = 1000;
const { south, west, north, east } = MAP.bbox;
const COS = Math.cos((((south + north) / 2) * Math.PI) / 180);
const S = W / ((east - west) * COS); // units per degree of latitude
const H = Math.round((north - south) * S);
const UNITS_PER_KM = S / 111.32;

const px = ([lng, lat]: LngLat): [number, number] => [(lng - west) * COS * S, (north - lat) * S];
const r1 = (n: number) => Math.round(n * 10) / 10;
const pathD = (coords: LngLat[], close = false) =>
  coords
    .map((c, i) => {
      const [x, y] = px(c);
      return `${i === 0 ? 'M' : 'L'}${r1(x)} ${r1(y)}`;
    })
    .join('') + (close ? 'Z' : '');

const FONT_PLACE = 34;
const FONT_PLACE_MAJOR = 42;
const MARKER_R = 30;

/* --------------------------------------------------------------- layout */

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inside = (r: Rect) => r.x >= 8 && r.y >= 8 && r.x + r.w <= W - 8 && r.y + r.h <= H - 8;
/** Rough width of a Hebrew label (no DOM measuring, so the layout is deterministic in tests). */
const textW = (s: string, size: number) => s.length * size * 0.56;

/** Point at fraction `f` of a polyline's projected length. */
function along(coords: LngLat[], f: number): [number, number] {
  const pts = coords.map(px);
  const seg: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1] ?? [0, 0];
    const [bx, by] = pts[i] ?? [0, 0];
    const d = Math.hypot(bx - ax, by - ay);
    seg.push(d);
    total += d;
  }
  let target = total * f;
  for (let i = 0; i < seg.length; i++) {
    const d = seg[i] ?? 0;
    if (target <= d && d > 0) {
      const [ax, ay] = pts[i] ?? [0, 0];
      const [bx, by] = pts[i + 1] ?? [0, 0];
      return [ax + ((bx - ax) * target) / d, ay + ((by - ay) * target) / d];
    }
    target -= d;
  }
  return pts[pts.length - 1] ?? [0, 0];
}

/** Where each station's marker goes: its own point, else the middle of the drive leg it names. */
function markerPositions(stations: Station[]): Map<string, [number, number]> {
  const out = new Map<string, [number, number]>();
  for (const s of stations) {
    let p: [number, number] | null = null;
    if (s.location) p = px([s.location.lng, s.location.lat]);
    else {
      const leg = MAP.route.find((l) => l.station === s.id);
      if (leg) p = along(leg.coords, 0.5);
    }
    if (p && p[0] >= 0 && p[0] <= W && p[1] >= 0 && p[1] <= H) out.set(s.id, p);
  }
  return out;
}

interface PlacedLabel {
  id: string;
  text: string;
  major: boolean;
  dot: [number, number] | null;
  x: number;
  y: number;
  anchor: 'start' | 'end' | 'middle';
}
interface PlacedShield {
  ref: string;
  x: number;
  y: number;
  w: number;
}

function layout(markers: [number, number][]) {
  const taken: Rect[] = markers.map(([x, y]) => ({
    x: x - MARKER_R - 6,
    y: y - MARKER_R - 6,
    w: 2 * MARKER_R + 12,
    h: 2 * MARKER_R + 12,
  }));
  // Reserved corner (bottom right): north arrow above the scale bar.
  taken.push({ x: W - 300, y: H - 250, w: 290, h: 240 });
  const labels: PlacedLabel[] = [];
  for (const p of MAP.places) {
    const [x, y] = px([p.lng, p.lat]);
    if (x < 0 || x > W || y < 0 || y > H) continue;
    const size = p.major ? FONT_PLACE_MAJOR : FONT_PLACE;
    const w = textW(p.name, size);
    // A station marker sitting on the place stands in for its dot.
    const covered = markers.some(([mx, my]) => Math.hypot(mx - x, my - y) < MARKER_R + 14);
    const gap = covered ? MARKER_R + 10 : 18;
    const candidates: { rect: Rect; tx: number; ty: number; anchor: PlacedLabel['anchor'] }[] = [
      {
        rect: { x: x + gap, y: y - size / 2, w, h: size },
        tx: x + gap,
        ty: y + size * 0.35,
        anchor: 'start',
      },
      {
        rect: { x: x - gap - w, y: y - size / 2, w, h: size },
        tx: x - gap,
        ty: y + size * 0.35,
        anchor: 'end',
      },
      {
        rect: { x: x - w / 2, y: y - gap - size, w, h: size },
        tx: x,
        ty: y - gap - size * 0.2,
        anchor: 'middle',
      },
      {
        rect: { x: x - w / 2, y: y + gap, w, h: size },
        tx: x,
        ty: y + gap + size * 0.8,
        anchor: 'middle',
      },
    ];
    const pick =
      candidates.find((c) => inside(c.rect) && !taken.some((r) => overlaps(r, c.rect))) ??
      candidates.find((c) => inside(c.rect));
    if (!pick) continue;
    taken.push(pick.rect);
    if (!covered) taken.push({ x: x - 8, y: y - 8, w: 16, h: 16 });
    labels.push({
      id: p.id,
      text: p.name,
      major: p.major,
      dot: covered ? null : [x, y],
      x: pick.tx,
      y: pick.ty,
      anchor: pick.anchor,
    });
  }
  const shields: PlacedShield[] = [];
  const refs = [...new Set(ROADS.filter((r) => r.labelled).map((r) => r.ref))];
  for (const ref of refs) {
    const pieces = ROADS.filter((r) => r.ref === ref).sort(
      (x, y) => y.coords.length - x.coords.length,
    );
    const w = 26 + ref.length * 18;
    const fractions = [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8, 0.1, 0.9];
    placing: for (const piece of pieces) {
      for (const f of fractions) {
        const [x, y] = along(piece.coords, f);
        const rect = { x: x - w / 2, y: y - 20, w, h: 40 };
        if (inside(rect) && !taken.some((r) => overlaps(r, rect))) {
          taken.push(rect);
          shields.push({ ref, x, y, w });
          break placing;
        }
      }
    }
  }
  return { labels, shields };
}

/** Roads outside the Gaza Strip and longer than ~300 m (the map tells the story on the Israeli side). */
function inRing([x, y]: [number, number], ring: [number, number][]) {
  let isIn = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i] ?? [0, 0];
    const [xj, yj] = ring[j] ?? [0, 0];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) isIn = !isIn;
  }
  return isIn;
}
const GAZA_PX = MAP.gaza.map((ring) => ring.map(px));
const ROADS = MAP.roads.filter((r) => {
  const pts = r.coords.map(px);
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1] ?? [0, 0];
    const [bx, by] = pts[i] ?? [0, 0];
    len += Math.hypot(bx - ax, by - ay);
  }
  const mid = along(r.coords, 0.5);
  return len > 0.3 * UNITS_PER_KM && !GAZA_PX.some((ring) => inRing(mid, ring));
});

/** A point inside the ring for its label: the vertex average if inside, else the first vertex. */
function labelPoint(ring: LngLat[]): [number, number] {
  const pts = ring.map(px);
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  let isIn = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i] ?? [0, 0];
    const [xj, yj] = pts[j] ?? [0, 0];
    if (yi > cy !== yj > cy && cx < ((xj - xi) * (cy - yi)) / (yj - yi) + xi) isIn = !isIn;
  }
  return isIn ? [cx, cy] : (pts[0] ?? [0, 0]);
}

/* -------------------------------------------------------------- markers */

interface MarkerProps {
  station: Station;
  x: number;
  y: number;
  visited: boolean;
  current: boolean;
}

function Marker({ station, x, y, visited, current }: MarkerProps) {
  const circleClass = current
    ? 'fill-primary stroke-primary'
    : visited
      ? 'fill-gold-soft stroke-gold'
      : 'fill-surface stroke-primary';
  const numberClass = current ? 'fill-primary-ink' : visited ? 'fill-gold' : 'fill-primary';
  const groupClass = ['marker', visited ? 'is-visited' : '', current ? 'is-current' : '']
    .filter(Boolean)
    .join(' ');
  const cx = r1(x);
  const cy = r1(y);
  return (
    // Markers are a picture only (orchestrator fix after T-07/T-08): links inside role="img" fail axe
    // nested-interactive. Stations are reached through the numbered card list under the map.
    <g id={`marker-${station.id}`} className={groupClass}>
      <title>{visited ? `${station.title} — ${t('tour.visited')}` : station.title}</title>
      <circle cx={cx} cy={cy} r={MARKER_R} strokeWidth={current ? 10 : 6} className={circleClass} />
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="34" className={numberClass}>
        {station.order}
      </text>
      {visited ? (
        // Shape cue for "visited" (colour is never the only signal): a small badge with a check.
        <g className="visited-badge">
          <circle
            cx={cx + 26}
            cy={cy - 26}
            r="14"
            className="fill-gold stroke-surface"
            strokeWidth="3"
          />
          <path
            d={`M${cx + 19} ${cy - 26}l5 5l9 -10`}
            className="fill-none stroke-surface"
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ) : null}
    </g>
  );
}

/* ------------------------------------------------------------------ map */

const HALO = {
  paintOrder: 'stroke',
  stroke: 'var(--color-surface)',
  strokeWidth: 9,
  strokeLinejoin: 'round',
} as const;

const ROAD_WIDTH: Record<string, number> = { motorway: 9, trunk: 8, primary: 6, secondary: 3.5 };

/** Every station with a point has an unverified point (H-02 pending) → say the positions are approximate. */
function anyUnverified(stations: Station[]) {
  return stations.some((s) => s.location !== null && !s.location.verified);
}

export function RouteMap({ stations, visitedIds, currentId }: RouteMapProps) {
  const headingId = useId();
  const positions = markerPositions(stations);
  const ordered = [...stations].sort((a, b) => a.order - b.order);
  const { labels, shields } = layout([...positions.values()]);
  const scaleKm = 5;
  const scaleW = scaleKm * UNITS_PER_KM;

  return (
    <>
      <SectionHeading level={2} id={headingId} icon={RouteIcon}>
        {t('tour.mapTitle')}
      </SectionHeading>
      <figure
        aria-labelledby={headingId}
        className="rounded-lg border border-border bg-surface p-4 md:p-5"
      >
        {/* direction: ltr keeps the labels from flipping inside the RTL page (gate G2). */}
        <div className="[direction:ltr]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={t('tour.mapAlt')}
            data-testid="route-map"
            className="mx-auto block h-auto w-full rounded-md font-body"
          >
            <rect width={W} height={H} className="fill-bg" />

            {/* sea and Gaza Strip */}
            {MAP.sea.map((ring, i) => (
              <path key={`sea-${i}`} d={pathD(ring, true)} fill="var(--color-map-sea)" />
            ))}
            {MAP.gaza.map((ring, i) => (
              <path
                key={`gaza-${i}`}
                data-testid="map-gaza"
                d={pathD(ring, true)}
                fill="var(--color-map-gaza)"
                stroke="var(--color-map-border)"
                strokeWidth="3"
                strokeDasharray="12 8"
              />
            ))}

            {/* roads */}
            <g className="fill-none" strokeLinecap="round" strokeLinejoin="round">
              {ROADS.map((r, i) => (
                <path
                  key={`road-${i}`}
                  d={pathD(r.coords)}
                  stroke={
                    r.cls === 'secondary' ? 'var(--color-map-road-minor)' : 'var(--color-map-road)'
                  }
                  strokeWidth={ROAD_WIDTH[r.cls] ?? 3}
                />
              ))}
            </g>

            {/* the route: casing first, then the line; drive legs dashed */}
            <g className="fill-none" strokeLinecap="round" strokeLinejoin="round">
              {MAP.route.map((leg) => (
                <path
                  key={`case-${leg.from}`}
                  d={pathD(leg.coords)}
                  stroke="var(--color-surface)"
                  strokeWidth="17"
                />
              ))}
              {MAP.route.map((leg) => (
                <path
                  key={`leg-${leg.from}`}
                  data-testid={`route-leg-${leg.from}`}
                  d={pathD(leg.coords)}
                  className="stroke-primary"
                  strokeWidth="9"
                  strokeDasharray={leg.station ? '22 14' : undefined}
                />
              ))}
            </g>

            {/* labels */}
            <g fontSize={FONT_PLACE} className="fill-ink">
              {MAP.gaza.map((ring, i) => {
                const [x, y] = labelPoint(ring);
                return (
                  <text
                    key={`gaza-label-${i}`}
                    x={r1(x)}
                    y={r1(y)}
                    textAnchor="middle"
                    fontSize="40"
                    fontWeight="600"
                    className="fill-ink-muted"
                  >
                    {t('map.gaza')}
                  </text>
                );
              })}
              {MAP.sea.map((ring, i) => {
                const [x, y] = labelPoint(ring);
                return (
                  <text
                    key={`sea-label-${i}`}
                    x={r1(x)}
                    y={r1(y)}
                    textAnchor="middle"
                    fontSize="30"
                    fill="var(--color-map-sea-ink)"
                  >
                    {t('map.sea')}
                  </text>
                );
              })}
              {labels.map((l) => (
                <g key={`place-${l.id}`} data-testid={`map-place-${l.id}`}>
                  {l.dot ? (
                    <circle cx={r1(l.dot[0])} cy={r1(l.dot[1])} r="7" className="fill-ink" />
                  ) : null}
                  <text
                    x={r1(l.x)}
                    y={r1(l.y)}
                    textAnchor={l.anchor}
                    fontSize={l.major ? FONT_PLACE_MAJOR : FONT_PLACE}
                    fontWeight={l.major ? 700 : 400}
                    style={HALO}
                  >
                    {l.text}
                  </text>
                </g>
              ))}
              {shields.map((s) => (
                <g key={`shield-${s.ref}`} data-testid={`map-road-${s.ref}`}>
                  <rect
                    x={r1(s.x - s.w / 2)}
                    y={r1(s.y - 20)}
                    width={s.w}
                    height="40"
                    rx="8"
                    className="fill-surface stroke-ink-muted"
                    strokeWidth="3"
                  />
                  <text
                    x={r1(s.x)}
                    y={r1(s.y + 10)}
                    textAnchor="middle"
                    fontSize="28"
                    fontWeight="600"
                  >
                    {s.ref}
                  </text>
                </g>
              ))}
            </g>

            {/* markers */}
            <g id="markers" fontWeight="700">
              {ordered.map((station) => {
                const p = positions.get(station.id);
                return p ? (
                  <Marker
                    key={station.id}
                    station={station}
                    x={p[0]}
                    y={p[1]}
                    visited={visitedIds.includes(station.id)}
                    current={currentId === station.id}
                  />
                ) : null;
              })}
            </g>

            {/* north arrow and scale */}
            <g className="fill-ink-muted stroke-ink-muted" fontSize="30">
              <path
                d={`M${W - 60} ${H - 220}v70M${W - 60} ${H - 220}l-14 22M${W - 60} ${H - 220}l14 22`}
                className="fill-none"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <text x={W - 88} y={H - 168} textAnchor="end" stroke="none" style={HALO}>
                {t('map.north')}
              </text>
              <path
                d={`M${r1(W - 40 - scaleW)} ${H - 40}v-14M${r1(W - 40 - scaleW)} ${H - 40}H${W - 40}v-14`}
                className="fill-none"
                strokeWidth="5"
              />
              <text
                x={r1(W - 40 - scaleW / 2)}
                y={H - 60}
                textAnchor="middle"
                direction="rtl"
                stroke="none"
                style={HALO}
              >
                {t('map.scale5km')}
              </text>
            </g>
          </svg>
        </div>
        <figcaption className="mt-3 space-y-1 font-body text-xs text-ink-muted">
          <span className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <span className="inline-flex items-center gap-2">
              <svg aria-hidden="true" width="36" height="8" viewBox="0 0 36 8">
                <line
                  x1="2"
                  y1="4"
                  x2="34"
                  y2="4"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="stroke-primary"
                />
              </svg>
              {t('map.legendStops')}
            </span>
            <span className="inline-flex items-center gap-2">
              <svg aria-hidden="true" width="36" height="8" viewBox="0 0 36 8">
                <line
                  x1="2"
                  y1="4"
                  x2="34"
                  y2="4"
                  strokeWidth="3"
                  strokeDasharray="8 5"
                  strokeLinecap="round"
                  className="stroke-primary"
                />
              </svg>
              {t('map.legendDrive')}
            </span>
          </span>
          {anyUnverified(stations) ? (
            <span data-testid="map-unverified-note" className="block">
              {t('map.unverifiedNote')}
            </span>
          ) : null}
          {/* Inline credit inside a sentence: exempt from the 44 px tap rule (WCAG 2.5.8 inline). */}
          <span className="block" data-inline-text>
            {t('map.attributionPrefix')}{' '}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              dir="ltr"
            >
              {MAP.attribution}
            </a>
          </span>
        </figcaption>
      </figure>
    </>
  );
}
