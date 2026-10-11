/**
 * CI-05 — Sources and file mapping.
 *
 * 1. Every `- <title> — <url>` line in a Markdown `sources` section matches the JSON `sources`
 *    of the same object: equal URL sets, equal title per URL.
 * 2. Every person JSON / station in stations.json has exactly one Markdown file named by its
 *    `sourceFile`, and every Markdown file has exactly one JSON object.
 *
 * Own, deliberately simple reader written from content-source/README.md. Imports nothing from the
 * converter or from src/content/loader.ts.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const SOURCE_DIR = join(REPO_ROOT, 'content-source');
const DATA_DIR = join(REPO_ROOT, 'src', 'content', 'data');

type JsonObject = Record<string, unknown>;

interface SourceEntry {
  title: string;
  url: string;
}

// ---------------------------------------------------------------------------------------------
// Own reader: extract the body of the `sources` section, then parse its lines.
// ---------------------------------------------------------------------------------------------
const SECTION_HEADING = /^## .+ · (\w+)\s*$/;
const SEPARATOR = ' — '; // space, em dash U+2014, space

/** Body lines of the `sources` section (after the front matter), or null if absent. */
function sourcesSectionLines(markdown: string): string[] | null {
  const lines = markdown.split(/\r?\n/);
  let fences = 0;
  let inSources = false;
  let found = false;
  const body: string[] = [];
  for (const line of lines) {
    if (fences < 2) {
      if (line === '---') fences++;
      continue;
    }
    if (line.startsWith('## ')) {
      inSources = SECTION_HEADING.exec(line)?.[1] === 'sources';
      if (inSources) found = true;
      continue;
    }
    if (inSources) body.push(line);
  }
  if (!found) return null;
  while (body.length > 0 && (body[0] ?? '').trim() === '') body.shift();
  while (body.length > 0 && (body[body.length - 1] ?? '').trim() === '') body.pop();
  return body;
}

function parseSourceLines(lines: string[]): { entries: SourceEntry[]; errors: string[] } {
  const entries: SourceEntry[] = [];
  const errors: string[] = [];
  for (const line of lines) {
    const cut = line.lastIndexOf(SEPARATOR);
    if (!line.startsWith('- ') || cut < 0) {
      errors.push(`not a "- <title> — <url>" line: ${JSON.stringify(line)}`);
      continue;
    }
    entries.push({ title: line.slice(2, cut), url: line.slice(cut + SEPARATOR.length) });
  }
  return { entries, errors };
}

function jsonSources(json: JsonObject): { entries: SourceEntry[]; errors: string[] } {
  const raw = json.sources;
  if (raw === undefined) return { entries: [], errors: [] };
  if (!Array.isArray(raw)) return { entries: [], errors: ['JSON sources is not an array'] };
  const entries: SourceEntry[] = [];
  const errors: string[] = [];
  (raw as unknown[]).forEach((item, i) => {
    const o = typeof item === 'object' && item !== null ? (item as JsonObject) : {};
    if (typeof o.title !== 'string' || typeof o.url !== 'string') {
      errors.push(`JSON sources[${i}] lacks string title/url`);
    } else {
      entries.push({ title: o.title, url: o.url });
    }
  });
  return { entries, errors };
}

/** Compares Markdown and JSON source lists; returns problems (empty = identical). */
function compareSources(md: SourceEntry[], json: SourceEntry[]): string[] {
  const problems: string[] = [];
  const mdUrls = md.map((s) => s.url);
  const jsonUrls = json.map((s) => s.url);
  const dup = (urls: string[]) => urls.filter((u, i) => urls.indexOf(u) !== i);
  for (const u of dup(mdUrls)) problems.push(`duplicate URL in Markdown: ${u}`);
  for (const u of dup(jsonUrls)) problems.push(`duplicate URL in JSON: ${u}`);
  for (const u of mdUrls) if (!jsonUrls.includes(u)) problems.push(`URL missing in JSON: ${u}`);
  for (const u of jsonUrls) if (!mdUrls.includes(u)) problems.push(`URL not in Markdown: ${u}`);
  for (const m of md) {
    const j = json.find((s) => s.url === m.url);
    if (j && j.title !== m.title) {
      problems.push(
        `title differs for ${m.url}\n  md:   ${JSON.stringify(m.title)}\n  json: ${JSON.stringify(j.title)}`,
      );
    }
  }
  return problems;
}

function sourceProblems(markdown: string, json: JsonObject): string[] {
  const lines = sourcesSectionLines(markdown) ?? [];
  const md = parseSourceLines(lines);
  const js = jsonSources(json);
  return [...md.errors, ...js.errors, ...compareSources(md.entries, js.entries)];
}

// ---------------------------------------------------------------------------------------------
// Real content.
// ---------------------------------------------------------------------------------------------
function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8')) as unknown;
}

function asObject(value: unknown): JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function mdFiles(dir: string): string[] {
  return readdirSync(join(SOURCE_DIR, dir))
    .filter((f) => f.endsWith('.md'))
    .sort();
}

const PEOPLE_JSON: JsonObject[] = readdirSync(join(DATA_DIR, 'people'))
  .filter((f) => f.endsWith('.json'))
  .sort()
  .map((f) => asObject(readJson(join(DATA_DIR, 'people', f))));

const STATIONS_JSON: JsonObject[] = (() => {
  const raw = readJson(join(DATA_DIR, 'stations.json'));
  return Array.isArray(raw) ? (raw as unknown[]).map(asObject) : [];
})();

const TOUR_JSON: JsonObject = asObject(readJson(join(DATA_DIR, 'tour.json')));

/** Every Markdown file as `content-source/...` path, paired with the JSON objects claiming it. */
const MD_PATHS: string[] = [
  ...mdFiles('people').map((f) => `content-source/people/${f}`),
  ...mdFiles('stations').map((f) => `content-source/stations/${f}`),
  'content-source/tour.md',
];

const ALL_JSON: JsonObject[] = [...PEOPLE_JSON, ...STATIONS_JSON, TOUR_JSON];

function claimants(mdPath: string): JsonObject[] {
  return ALL_JSON.filter((j) => j.sourceFile === mdPath);
}

describe('CI-05 sources match between Markdown and JSON', () => {
  for (const mdPath of MD_PATHS) {
    const rel = mdPath.replace(/^content-source\//, '');
    it(`CI-05 ${rel} · sources`, () => {
      const owners = claimants(mdPath);
      expect(owners, `expected exactly one JSON object for ${rel}`).toHaveLength(1);
      const markdown = readFileSync(join(REPO_ROOT, mdPath), 'utf8');
      const problems = sourceProblems(markdown, owners[0] ?? {});
      expect(problems, problems.join('\n')).toEqual([]);
    });
  }
});

describe('CI-05 every JSON object has exactly one Markdown source file', () => {
  it('CI-05 counts: 9 person JSON files, 7 stations, 9 + 7 + 1 Markdown files', () => {
    expect(PEOPLE_JSON).toHaveLength(9);
    expect(STATIONS_JSON).toHaveLength(7);
    expect(MD_PATHS).toHaveLength(17);
  });

  for (const json of ALL_JSON) {
    const label = typeof json.id === 'string' ? json.id : '(no id)';
    it(`CI-05 JSON ${label} · sourceFile`, () => {
      const sourceFile = json.sourceFile;
      expect(typeof sourceFile, `${label}: sourceFile is not a string`).toBe('string');
      const matches = MD_PATHS.filter((p) => p === sourceFile);
      expect(matches, `${label}: Markdown files matching ${String(sourceFile)}`).toHaveLength(1);
      expect(existsSync(join(REPO_ROOT, String(sourceFile)))).toBe(true);
      // The file name encodes the id: NN_<id>.md (tour.md excepted).
      const idInName = /\/\d{2}_([a-z0-9-]+)\.md$/.exec(String(sourceFile))?.[1];
      if (idInName !== undefined) expect(json.id).toBe(idInName);
    });
  }

  it('CI-05 every Markdown file is claimed by exactly one JSON object', () => {
    const wrong = MD_PATHS.map((p) => [p, claimants(p).length] as const).filter(([, n]) => n !== 1);
    expect(wrong).toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------
// Negative self-check (fictional data, in memory only — Conventions §1.11).
// ---------------------------------------------------------------------------------------------
const FICTIONAL_MD = [
  '---',
  'id: test-person-1',
  '---',
  '# דמות בדיקה 1',
  '## פתיחה · opening',
  'טקסט בדיקה — עם קו מפריד בתוכו.',
  '## מקורות · sources',
  '- מקור בדיקה א — כותרת משנה — https://example.org/test-a',
  '- מקור בדיקה ב — https://example.org/בדיקה%20ב',
].join('\n');

const FICTIONAL_JSON: JsonObject = {
  sources: [
    { title: 'מקור בדיקה א — כותרת משנה', url: 'https://example.org/test-a' },
    { title: 'מקור בדיקה ב', url: 'https://example.org/בדיקה%20ב' },
  ],
};

describe('CI-05 self-check: the comparison can fail', () => {
  it('CI-05 self-check · faithful fictional fixture has no problems (split on LAST " — ")', () => {
    expect(sourceProblems(FICTIONAL_MD, FICTIONAL_JSON)).toEqual([]);
  });

  it('CI-05 self-check · a changed URL is reported', () => {
    const broken = structuredClone(FICTIONAL_JSON);
    broken.sources = [
      { title: 'מקור בדיקה א — כותרת משנה', url: 'https://example.org/test-x' },
      { title: 'מקור בדיקה ב', url: 'https://example.org/בדיקה%20ב' },
    ];
    const problems = sourceProblems(FICTIONAL_MD, broken).join('\n');
    expect(problems).toContain('URL missing in JSON: https://example.org/test-a');
    expect(problems).toContain('URL not in Markdown: https://example.org/test-x');
  });

  it('CI-05 self-check · a changed title is reported', () => {
    const broken = structuredClone(FICTIONAL_JSON);
    broken.sources = [
      { title: 'מקור בדיקה א — כותרת משנה', url: 'https://example.org/test-a' },
      { title: 'מקור בדיקה שונה', url: 'https://example.org/בדיקה%20ב' },
    ];
    expect(sourceProblems(FICTIONAL_MD, broken).join('\n')).toContain('title differs');
  });

  it('CI-05 self-check · an extra JSON source with no Markdown line is reported', () => {
    const noSection = '---\nid: x\n---\n## פתיחה · opening\nטקסט בדיקה.';
    const json: JsonObject = { sources: [{ title: 'מקור בדיקה', url: 'https://example.org/t' }] };
    expect(sourceProblems(noSection, json)).toEqual(['URL not in Markdown: https://example.org/t']);
  });
});
