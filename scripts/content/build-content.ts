/**
 * F-02 — CLI: content-source/** → src/content/data/** (validated with zod).
 *
 *   npm run content:build   # tsx scripts/content/build-content.ts
 *   npm run content:check   # tsx scripts/content/build-content.ts --check
 *
 * Output is byte-stable: keys are ordered by a fixed KEY_ORDER per type and the
 * files are serialized with `JSON.stringify(obj, null, 2) + '\n'`.
 */
import {
  readFileSync,
  readdirSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  unlinkSync,
} from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ZodType, ZodTypeDef } from 'zod';

import { PersonSchema, StationSchema, TourSchema } from '../../src/content/schema.ts';
import { personFromMd, stationFromMd, tourFromMd } from './to-json.ts';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SOURCE_DIR = join(ROOT, 'content-source');
const DATA_DIR = join(ROOT, 'src', 'content', 'data');
const PEOPLE_OUT_DIR = join(DATA_DIR, 'people');

/** Fixed key order per type — the order of the zod schemas. */
const PERSON_KEY_ORDER = [
  'id',
  'order',
  'sourceFile',
  'name',
  'honorific',
  'pronoun',
  'subtitle',
  'stationIds',
  'opening',
  'oct7',
  'oct7Sensitivity',
  'personality',
  'past',
  'after',
  'quote',
  'altQuote',
  'guideLevels',
  'guideNote',
  'photo',
  'consent',
  'sources',
] as const;

const STATION_KEY_ORDER = [
  'id',
  'order',
  'sourceFile',
  'slug',
  'title',
  'subtitle',
  'kind',
  'durationMin',
  'location',
  'radiusM',
  'background',
  'talkingPoints',
  'personIds',
  'companionPersonIds',
  'sensitivity',
  'silenceMoment',
  'accessNotes',
  'driverWarning',
  'lastVerified',
  'sources',
] as const;

const TOUR_KEY_ORDER = [
  'id',
  'sourceFile',
  'title',
  'subtitle',
  'totalDurationMin',
  'intro',
  'message',
  'safety',
  'howTo',
  'closing',
  'about',
  'rights',
  'stationIds',
  'lastContentReview',
  'contactEmail',
] as const;

/** Nested objects produced by to-json.ts, also written in a fixed order. */
const NESTED_KEY_ORDER: Record<string, readonly string[]> = {
  quote: ['text', 'by'],
  altQuote: ['text', 'by'],
  guideLevels: ['s30', 'm2', 'm5'],
  photo: ['status', 'src', 'alt', 'credit', 'referenceUrl'],
  consent: ['family', 'note'],
  location: ['lat', 'lng', 'verified', 'verifiedBy', 'verifiedAt', 'note'],
  silenceMoment: ['seconds', 'prompt'],
};
const SOURCE_KEY_ORDER = ['title', 'url'] as const;

type Json = Record<string, unknown>;

function isRecord(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pickOrdered(obj: Json, order: readonly string[], where: string): Json {
  const out: Json = {};
  for (const key of order) {
    if (key in obj) out[key] = obj[key];
  }
  const extra = Object.keys(obj).filter((key) => !order.includes(key));
  if (extra.length > 0) {
    throw new Error(`${where}: keys missing from KEY_ORDER: ${extra.join(', ')}`);
  }
  return out;
}

function orderKeys(obj: Json, order: readonly string[], where: string): Json {
  const top = pickOrdered(obj, order, where);
  for (const [key, value] of Object.entries(top)) {
    const nested = NESTED_KEY_ORDER[key];
    if (nested && isRecord(value)) {
      top[key] = pickOrdered(value, nested, `${where}.${key}`);
    } else if (key === 'sources' && Array.isArray(value)) {
      top[key] = (value as unknown[]).map((item: unknown, i) =>
        isRecord(item)
          ? pickOrdered(item, SOURCE_KEY_ORDER, `${where}.sources[${String(i)}]`)
          : item,
      );
    }
  }
  return top;
}

function serialize(obj: unknown): string {
  return JSON.stringify(obj, null, 2) + '\n';
}

function listMarkdown(dir: string): string[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .sort();
}

function validate<T>(schema: ZodType<T, ZodTypeDef, unknown>, value: unknown, file: string): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`${file}: schema validation failed\n${issues}`);
  }
  return result.data;
}

interface BuildOutput {
  /** Map of output path (relative to ROOT, forward slashes) → file contents. */
  files: Map<string, string>;
  peopleCount: number;
  stationCount: number;
}

function buildInMemory(): BuildOutput {
  const files = new Map<string, string>();
  const errors: string[] = [];

  const convert = (relPath: string, fn: (relPath: string, text: string) => Json): Json | null => {
    try {
      return fn(relPath, readFileSync(join(ROOT, relPath), 'utf8'));
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
      return null;
    }
  };

  // People — one JSON per person.
  const people: Json[] = [];
  const seenPersonIds = new Set<string>();
  for (const name of listMarkdown(join(SOURCE_DIR, 'people'))) {
    const relPath = `content-source/people/${name}`;
    const raw = convert(relPath, personFromMd);
    if (!raw) continue;
    try {
      const person = validate(PersonSchema, raw, relPath);
      if (seenPersonIds.has(person.id)) {
        throw new Error(`${relPath}: duplicate person id "${person.id}"`);
      }
      seenPersonIds.add(person.id);
      people.push(orderKeys(raw, PERSON_KEY_ORDER, relPath));
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  // Stations — one array sorted by order.
  const stations: Json[] = [];
  const seenStationIds = new Set<string>();
  for (const name of listMarkdown(join(SOURCE_DIR, 'stations'))) {
    const relPath = `content-source/stations/${name}`;
    const raw = convert(relPath, stationFromMd);
    if (!raw) continue;
    try {
      const station = validate(StationSchema, raw, relPath);
      if (seenStationIds.has(station.id)) {
        throw new Error(`${relPath}: duplicate station id "${station.id}"`);
      }
      seenStationIds.add(station.id);
      stations.push(orderKeys(raw, STATION_KEY_ORDER, relPath));
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  // Tour.
  const tourRel = 'content-source/tour.md';
  const tourRaw = convert(tourRel, tourFromMd);
  let tour: Json | null = null;
  if (tourRaw) {
    try {
      validate(TourSchema, tourRaw, tourRel);
      tour = orderKeys(tourRaw, TOUR_KEY_ORDER, tourRel);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }

  for (const person of people) {
    files.set(`src/content/data/people/${String(person.id)}.json`, serialize(person));
  }
  const sortedStations = [...stations].sort((a, b) => Number(a.order) - Number(b.order));
  files.set('src/content/data/stations.json', serialize(sortedStations));
  files.set('src/content/data/tour.json', serialize(tour));

  return { files, peopleCount: people.length, stationCount: stations.length };
}

function listExistingPeopleJson(): string[] {
  if (!existsSync(PEOPLE_OUT_DIR)) return [];
  return readdirSync(PEOPLE_OUT_DIR)
    .filter((name) => name.endsWith('.json'))
    .map((name) => `src/content/data/people/${name}`);
}

function runBuild(): number {
  const { files, peopleCount, stationCount } = buildInMemory();
  mkdirSync(PEOPLE_OUT_DIR, { recursive: true });

  // Remove JSON for people that no longer have a source file.
  for (const stale of listExistingPeopleJson()) {
    if (!files.has(stale)) {
      unlinkSync(join(ROOT, stale));
      process.stderr.write(`removed stale ${stale}\n`);
    }
  }
  for (const [relPath, contents] of files) {
    writeFileSync(join(ROOT, relPath), contents, 'utf8');
  }
  process.stderr.write(
    `content:build — wrote ${String(peopleCount)} people, ${String(stationCount)} stations, tour → ${relative(ROOT, DATA_DIR)}/\n`,
  );
  return 0;
}

function runCheck(): number {
  const { files } = buildInMemory();
  const differing: string[] = [];

  for (const [relPath, expected] of files) {
    const abs = join(ROOT, relPath);
    if (!existsSync(abs)) {
      differing.push(`${relPath} (missing)`);
      continue;
    }
    if (readFileSync(abs, 'utf8') !== expected) {
      differing.push(`${relPath} (differs)`);
    }
  }
  for (const stale of listExistingPeopleJson()) {
    if (!files.has(stale)) differing.push(`${stale} (stale — no source file)`);
  }

  if (differing.length > 0) {
    process.stderr.write(
      `content:check — ${String(differing.length)} file(s) out of date; run \`npm run content:build\`:\n` +
        differing.map((line) => `  ${line}`).join('\n') +
        '\n',
    );
    return 1;
  }
  process.stderr.write(`content:check — ${String(files.size)} files up to date\n`);
  return 0;
}

function main(): number {
  const check = process.argv.includes('--check');
  try {
    return check ? runCheck() : runBuild();
  } catch (err) {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    return 1;
  }
}

process.exitCode = main();
