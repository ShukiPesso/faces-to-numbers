import { Route as RouteIcon } from 'lucide-react';
import { useId } from 'react';
import { SectionHeading } from '@/components/primitives';
import type { Station } from '@/content/schema';
import { t } from '@/lib/i18n';

export interface RouteMapProps {
  stations: Station[];
  visitedIds: string[];
  currentId?: string;
}

/** Marker geometry copied unchanged from design/route-map.svg (D-05). */
interface MarkerSpec {
  id: string;
  n: number;
  cx: number;
  cy: number;
  /** Where the label sits: its x/y, its anchor, and (optionally) a two-line split. */
  label: { x: number; y: number; anchor: 'start' | 'middle' | 'end'; twoLines?: { y2: number } };
}

const MARKERS: readonly MarkerSpec[] = [
  { id: 'sderot', n: 1, cx: 170, cy: 85, label: { x: 194, y: 91, anchor: 'start' } },
  { id: 'route-232', n: 2, cx: 140, cy: 190, label: { x: 164, y: 196, anchor: 'start' } },
  { id: 'observers-hill', n: 3, cx: 100, cy: 290, label: { x: 124, y: 296, anchor: 'start' } },
  { id: 'reim-shelter', n: 4, cx: 90, cy: 395, label: { x: 114, y: 401, anchor: 'start' } },
  { id: 'nova', n: 5, cx: 130, cy: 500, label: { x: 130, y: 540, anchor: 'middle' } },
  {
    id: 'tkuma',
    n: 6,
    cx: 270,
    cy: 375,
    label: { x: 290, y: 326, anchor: 'middle', twoLines: { y2: 346 } },
  },
  { id: 'closing-drive', n: 7, cx: 322, cy: 430, label: { x: 348, y: 548, anchor: 'end' } },
];

/** Half the side of the invisible hit area: 44 map units across (≥ the tap minimum at 360 px). */

/** Splits a title at its last space, for the one label the design draws on two lines. */
function splitTitle(title: string): [string, string] {
  const i = title.lastIndexOf(' ');
  return i < 0 ? [title, ''] : [title.slice(0, i), title.slice(i + 1)];
}

interface MarkerProps {
  spec: MarkerSpec;
  station: Station;
  visited: boolean;
  current: boolean;
}

function Marker({ spec, station, visited, current }: MarkerProps) {
  const { cx, cy, label } = spec;
  const circleClass = current
    ? 'fill-primary stroke-primary'
    : visited
      ? 'fill-gold-soft stroke-gold'
      : 'fill-surface stroke-primary';
  const numberClass = current ? 'fill-primary-ink' : visited ? 'fill-gold' : 'fill-primary';
  const groupClass = ['marker', visited ? 'is-visited' : '', current ? 'is-current' : '']
    .filter(Boolean)
    .join(' ');
  const labelClass = 'fill-ink';
  const lines = label.twoLines ? splitTitle(station.title) : [station.title];
  return (
    // Markers are a picture only (orchestrator fix after T-07/T-08): links inside role="img" fail axe
    // nested-interactive and are under 44px on phones. Stations are reached through the card list.
    <g>
      <g id={`marker-${spec.id}`} className={groupClass}>
        {visited ? <title>{`${station.title} — ${t('tour.visited')}`}</title> : null}
                <circle cx={cx} cy={cy} r="15" strokeWidth={current ? 5 : 3} className={circleClass} />
        <text x={cx} y={cy + 6} textAnchor="middle" className={numberClass}>
          {spec.n}
        </text>
        {lines.map((line, i) => (
          <text
            key={line}
            x={label.x}
            y={i === 0 ? label.y : (label.twoLines?.y2 ?? label.y)}
            textAnchor={label.anchor}
            className={labelClass}
          >
            {line}
          </text>
        ))}
        {visited ? (
          // Shape cue for "visited" (colour is never the only signal): a small badge with a check.
          <g className="visited-badge">
            <circle
              cx={cx + 13}
              cy={cy - 13}
              r="7"
              className="fill-gold stroke-surface"
              strokeWidth="1.5"
            />
            <path
              d={`M${cx + 9.5} ${cy - 13}l2.5 2.5l4.5 -5`}
              className="fill-none stroke-surface"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        ) : null}
      </g>
    </g>
  );
}

export function RouteMap({ stations, visitedIds, currentId }: RouteMapProps) {
  const headingId = useId();
  const byId = new Map(stations.map((s) => [s.id, s]));
  return (
    <figure
      aria-labelledby={headingId}
      className="rounded-lg border border-border bg-surface p-4 md:p-5"
    >
      <SectionHeading level={2} id={headingId} icon={RouteIcon}>
        {t('tour.mapTitle')}
      </SectionHeading>
      {/* direction: ltr keeps the labels from flipping inside the RTL page (gate G2). */}
      <div className="[direction:ltr]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 360 640"
          role="img"
          aria-label={t('tour.mapAlt')}
          data-testid="route-map"
          className="block h-auto w-full font-body"
        >
          <rect width="360" height="640" className="fill-bg" />
          <g className="fill-ink-muted stroke-ink-muted" strokeWidth="2" fontSize="14">
            <line x1="30" y1="50" x2="30" y2="560" strokeDasharray="3 6" />
            <text transform="translate(18 305) rotate(-90)" textAnchor="middle" stroke="none">
              {t('map.border')}
            </text>
            <path d="M334 40V68M334 40l-5 8M334 40l5 8" className="fill-none" />
            <text x="326" y="60" textAnchor="end" stroke="none">
              {t('map.north')}
            </text>
          </g>
          <g
            className="fill-none stroke-primary"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              id="route-line-drive"
              d="M170 85C170 120 140 150 140 190C140 230 105 250 100 290"
              strokeDasharray="10 8"
            />
            <path
              id="route-line-stops"
              d="M100 290C95 330 90 350 90 395C90 440 120 460 130 500C210 520 275 450 270 375"
            />
            <path
              id="route-line-closing"
              d="M270 375C305 380 322 400 322 430C322 470 335 495 342 522"
              strokeDasharray="10 8"
            />
            <path d="M330 508L342 522L326 522" />
          </g>
          <g id="markers" fontSize="16" fontWeight="600">
            {MARKERS.map((spec) => {
              const station = byId.get(spec.id);
              return station ? (
                <Marker
                  key={spec.id}
                  spec={spec}
                  station={station}
                  visited={visitedIds.includes(spec.id)}
                  current={currentId === spec.id}
                />
              ) : null;
            })}
          </g>
          <g fontSize="14" className="fill-ink-muted">
            <line
              x1="60"
              y1="590"
              x2="100"
              y2="590"
              strokeWidth="3"
              strokeDasharray="10 8"
              strokeLinecap="round"
              className="stroke-primary"
            />
            <text x="110" y="595">
              {t('tour.kind.drive')}
            </text>
            <line
              x1="180"
              y1="590"
              x2="220"
              y2="590"
              strokeWidth="3"
              strokeLinecap="round"
              className="stroke-primary"
            />
            <text x="230" y="595">
              {t('tour.kind.stop')}
            </text>
            <text x="180" y="620" textAnchor="middle">
              {t('map.schematicNote')}
            </text>
          </g>
        </svg>
      </div>
      <figcaption aria-hidden="true" className="mt-2 text-xs text-ink-muted">
        {t('tour.mapAlt')}
      </figcaption>
    </figure>
  );
}
