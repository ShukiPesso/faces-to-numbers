import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { he } from '@/i18n/he';
import { BANNED_UI_WORDS } from '../e2e/helpers/banned';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SRC = join(ROOT, 'src');

/** Recursively lists files under `dir` (absolute paths); empty if the folder does not exist. */
function listFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listFiles(full));
    else out.push(full);
  }
  return out.sort();
}

const rel = (file: string): string => relative(ROOT, file);
const readText = (file: string): string => readFileSync(file, 'utf8');
const srcFiles = (exts: readonly string[]): string[] =>
  listFiles(SRC).filter((f) => exts.some((e) => f.endsWith(e)));

/** Returns "line N: text" for each line of `text` matching `re`. */
function matchLines(text: string, re: RegExp): string[] {
  return text.split('\n').flatMap((line, i) => (re.test(line) ? [`${i + 1}: ${line.trim()}`] : []));
}

// ---------------------------------------------------------------- CI-06
const REFERENCE_URL_RE = /referenceUrl/;

/** Files (relative paths) whose text contains the string `referenceUrl`. */
function findReferenceUrl(files: Record<string, string>): string[] {
  return Object.entries(files).flatMap(([name, text]) =>
    matchLines(text, REFERENCE_URL_RE).map((m) => `${name}:${m}`),
  );
}

interface PhotoInfo {
  status?: string;
  src?: string;
}

/** For each person whose photo is cleared, returns the file path that must exist. */
function missingClearedPhotos(
  people: Record<string, PhotoInfo | undefined>,
  exists: (publicPath: string) => boolean,
): string[] {
  return Object.entries(people).flatMap(([id, photo]) => {
    if (photo?.status !== 'cleared') return [];
    if (!photo.src) return [`${id}: cleared photo has no src`];
    return exists(photo.src) ? [] : [`${id}: public${photo.src} does not exist`];
  });
}

describe('CI-06 no press-photo references in UI, cleared photos exist', () => {
  it('"referenceUrl" does not occur under src/components/ or src/pages/', () => {
    const files = [...listFiles(join(SRC, 'components')), ...listFiles(join(SRC, 'pages'))];
    expect(files.length).toBeGreaterThan(0);
    const texts = Object.fromEntries(files.map((f) => [rel(f), readText(f)]));
    expect(findReferenceUrl(texts)).toEqual([]);
  });

  it('every cleared person photo has its file under public/', () => {
    const dir = join(SRC, 'content', 'data', 'people');
    const files = listFiles(dir).filter((f) => f.endsWith('.json'));
    expect(files.length).toBeGreaterThan(0);
    const people = Object.fromEntries(
      files.map((f) => [rel(f), (JSON.parse(readText(f)) as { photo?: PhotoInfo }).photo]),
    );
    expect(missingClearedPhotos(people, (p) => existsSync(join(ROOT, 'public', p)))).toEqual([]);
  });

  it('negative self-check: matchers report bad input', () => {
    expect(findReferenceUrl({ 'a.tsx': '<img src={person.photo.referenceUrl} />' })).toHaveLength(
      1,
    );
    expect(findReferenceUrl({ 'a.tsx': '<img src={person.photo.src} />' })).toEqual([]);
    const people = {
      x: { status: 'cleared', src: '/photos/x.webp' },
      y: { status: 'pending' },
    };
    expect(missingClearedPhotos(people, () => false)).toEqual([
      'x: public/photos/x.webp does not exist',
    ]);
    expect(missingClearedPhotos(people, () => true)).toEqual([]);
  });
});

// ---------------------------------------------------------------- CI-07
const EMOJI_RE = /\p{Extended_Pictographic}/u;

/** Returns "key: reason" for every value that breaks the UI tone rules. */
function findBadUiStrings(strings: Record<string, string>, banned: readonly string[]): string[] {
  return Object.entries(strings).flatMap(([key, value]) => {
    const reasons: string[] = [];
    if (value.includes('!')) reasons.push('contains "!"');
    if (EMOJI_RE.test(value)) reasons.push('contains emoji');
    for (const word of banned) if (value.includes(word)) reasons.push(`banned word "${word}"`);
    return reasons.map((r) => `${key}: ${r}`);
  });
}

describe('CI-07 UI strings: no "!", emoji or banned words', () => {
  it('src/i18n/he.ts has no offending value (all offenders reported)', () => {
    expect(Object.keys(he).length).toBeGreaterThan(0);
    expect(findBadUiStrings(he, BANNED_UI_WORDS)).toEqual([]);
  });

  it('negative self-check: matcher reports "!", emoji and banned words', () => {
    const bad = { a: 'שלום!', b: 'תודה 🎉', c: `${BANNED_UI_WORDS[0]} לכם`, d: 'שקט ורגוע' };
    const found = findBadUiStrings(bad, BANNED_UI_WORDS);
    expect(found).toHaveLength(3);
    expect(found.some((m) => m.startsWith('a:'))).toBe(true);
    expect(found.some((m) => m.startsWith('b:'))).toBe(true);
    expect(found.some((m) => m.startsWith('c:'))).toBe(true);
    expect(found.some((m) => m.startsWith('d:'))).toBe(false);
  });
});

// ---------------------------------------------------------------- CI-08
interface GeoStation {
  id?: string;
  location: { lat: number; lng: number } | null;
}

/** Non-null locations outside the Gaza-envelope box (catches swapped lat/lng). */
function findOutOfBox(stations: GeoStation[]): string[] {
  return stations.flatMap((s, i) => {
    if (!s.location) return [];
    const { lat, lng } = s.location;
    const ok = lat >= 31.2 && lat <= 31.7 && lng >= 34.3 && lng <= 34.8;
    return ok ? [] : [`${s.id ?? `#${i}`}: lat ${lat}, lng ${lng} outside 31.2-31.7 / 34.3-34.8`];
  });
}

describe('CI-08 station coordinates lie in the Gaza envelope', () => {
  it('every non-null station location is inside lat 31.2-31.7 / lng 34.3-34.8', () => {
    const stations = JSON.parse(
      readText(join(SRC, 'content', 'data', 'stations.json')),
    ) as GeoStation[];
    expect(stations.length).toBeGreaterThan(0);
    expect(findOutOfBox(stations)).toEqual([]);
  });

  it('negative self-check: swapped and null coordinates', () => {
    expect(findOutOfBox([{ id: 'swapped', location: { lat: 34.5, lng: 31.4 } }])).toHaveLength(1);
    expect(findOutOfBox([{ id: 'ok', location: { lat: 31.46, lng: 34.52 } }])).toEqual([]);
    expect(findOutOfBox([{ id: 'null', location: null }])).toEqual([]);
  });
});

// ---------------------------------------------------------------- CI-09
const T_KEY_RE = /\bt\(\s*['"]([a-zA-Z0-9_.]+)['"]/g;

/** Every key captured from `t('key')` calls in `text`. */
function extractKeys(text: string): string[] {
  return [...text.matchAll(T_KEY_RE)].map((m) => m[1] as string);
}

function findUnknownKeys(files: Record<string, string>, known: ReadonlySet<string>): string[] {
  return Object.entries(files).flatMap(([name, text]) =>
    text.split('\n').flatMap((line, i) =>
      extractKeys(line)
        .filter((k) => !known.has(k))
        .map((k) => `${name}:${i + 1}: unknown key "${k}"`),
    ),
  );
}

describe('CI-09 every t() key used in src/ exists in he.ts', () => {
  const files = srcFiles(['.ts', '.tsx']);
  const texts = Object.fromEntries(files.map((f) => [rel(f), readText(f)]));
  const known = new Set(Object.keys(he));

  it('no t() call uses a key missing from he', () => {
    expect(files.length).toBeGreaterThan(0);
    expect(findUnknownKeys(texts, known)).toEqual([]);
  });

  it('lists unused he keys (warning only)', () => {
    const used = new Set(Object.values(texts).flatMap(extractKeys));
    const unused = [...known].filter((k) => !used.has(k));
    if (unused.length > 0) {
      console.warn(`CI-09: ${unused.length} he keys never used via t('…'):\n${unused.join('\n')}`);
    }
    expect(Array.isArray(unused)).toBe(true);
  });

  it('negative self-check: unknown key is reported, known key is not', () => {
    const k = new Set(['a.b']);
    expect(findUnknownKeys({ 'x.tsx': 't(\'a.b\') t("no.such")' }, k)).toEqual([
      'x.tsx:1: unknown key "no.such"',
    ]);
    expect(extractKeys("{t( 'a.b' )}")).toEqual(['a.b']);
    expect(extractKeys("format('a.b')")).toEqual([]);
  });
});

// ---------------------------------------------------------------- CI-10
/**
 * Physical-direction Tailwind utilities (optionally with variant prefixes / negative sign).
 * The task's list ends each name with "-"; the bare compound names (text-left, border-l, ...)
 * are also matched when they end a class token, otherwise `class="text-left"` would slip through.
 */
const PHYSICAL_RE =
  /(?<![\w])(?:(?:ml|mr|pl|pr|left|right)-|(?:border-l|border-r|rounded-l|rounded-r|text-left|text-right)(?:-|(?=[\s"'`;}]|$)))/;

/** "file:line: text" for every line holding a physical class. */
function findPhysicalClasses(files: Record<string, string>): string[] {
  return Object.entries(files).flatMap(([name, text]) =>
    matchLines(text, PHYSICAL_RE).map((m) => `${name}:${m}`),
  );
}

describe('CI-10 no physical-direction Tailwind classes in src/', () => {
  it('src/**/*.{ts,tsx,css} contain no ml- mr- pl- pr- left- right- border-l/r rounded-l/r text-left/right', () => {
    const files = srcFiles(['.ts', '.tsx', '.css']);
    expect(files.length).toBeGreaterThan(0);
    const texts = Object.fromEntries(files.map((f) => [rel(f), readText(f)]));
    expect(findPhysicalClasses(texts)).toEqual([]);
  });

  it('negative self-check: physical classes are reported, logical ones are not', () => {
    const bad = [
      '<div className="ml-4 flex">',
      '<p className="text-left">',
      '<p className="md:pr-2 border-l-2">',
      '@apply right-0 rounded-r;',
      '<i className="-mr-1">',
    ];
    for (const line of bad) {
      expect(findPhysicalClasses({ 'bad.tsx': line }), line).toHaveLength(1);
    }
    const good = '<div className="ms-4 me-2 ps-1 pe-1 start-0 end-0 text-start text-end border-s">';
    expect(findPhysicalClasses({ 'good.tsx': good })).toEqual([]);
  });
});
