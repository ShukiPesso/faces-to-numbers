import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Real content folder (written by the content converter, task F-02). */
const DATA_DIR = fileURLToPath(new URL('../../../src/content/data', import.meta.url));

const STATIC_ROUTES = ['/', '/tour', '/about', '/sources'] as const;

function readJson(file: string): unknown {
  return JSON.parse(readFileSync(file, 'utf8')) as unknown;
}

function stringField(value: unknown, field: string, file: string): string {
  if (typeof value === 'object' && value !== null && field in value) {
    const fieldValue = (value as Record<string, unknown>)[field];
    if (typeof fieldValue === 'string' && fieldValue.length > 0) {
      return fieldValue;
    }
  }
  throw new Error(`routes.ts: expected a non-empty string "${field}" in ${file}`);
}

/**
 * Every route path of the real app, built at runtime from the real content JSON:
 * `/`, `/tour`, `/about`, `/sources`, then `/station/<slug>` for each entry of
 * `src/content/data/stations.json` (file order) and `/person/<id>` for each
 * `src/content/data/people/*.json` (sorted by file name).
 *
 * Paths are router paths (the part after `#`). Until the content data folder exists
 * (task F-02), only `['/']` is returned.
 */
export function allRoutes(): string[] {
  if (!existsSync(DATA_DIR)) {
    return ['/'];
  }

  const stationsFile = join(DATA_DIR, 'stations.json');
  const stations = readJson(stationsFile);
  if (!Array.isArray(stations)) {
    throw new Error(`routes.ts: expected an array in ${stationsFile}`);
  }
  const stationRoutes = stations.map(
    (station: unknown) => `/station/${stringField(station, 'slug', stationsFile)}`,
  );

  const peopleDir = join(DATA_DIR, 'people');
  const personRoutes = readdirSync(peopleDir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => {
      const file = join(peopleDir, name);
      return `/person/${stringField(readJson(file), 'id', file)}`;
    });

  return [...STATIC_ROUTES, ...stationRoutes, ...personRoutes];
}
