/**
 * CI-04 — Independent fidelity check (the anti-hallucination net, ADR-003).
 *
 * A SECOND reader of content-source/*.md, written from content-source/README.md alone.
 * It must not import the converter or src/content/loader.ts: if it shared
 * code with the converter, a bug in one would hide in the other. Deliberately simple regex code.
 *
 * For every `## <label> · <key>` section the matching JSON field must equal the Markdown body
 * (whitespace-normalised for text, item-by-item for bullets). In reverse, every JSON field that
 * is not generated from front matter must have a section. `sources` are checked in CI-05.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const SOURCE_DIR = join(REPO_ROOT, 'content-source');
const DATA_DIR = join(REPO_ROOT, 'src', 'content', 'data');

type FileType = 'person' | 'station' | 'tour';
type JsonObject = Record<string, unknown>;

// ---------------------------------------------------------------------------------------------
// Section kinds and allowed keys — transcribed from content-source/README.md.
// ---------------------------------------------------------------------------------------------
const TEXT_KEYS = new Set([
  'opening',
  'gentleOpening',
  'oct7',
  'personality',
  'past',
  'after',
  'guideNote',
  'background',
  'accessNotes',
  'intro',
  'message',
  'closing',
  'about',
  'rights',
]);
const BULLET_KEYS = new Set(['talkingPoints', 'safety', 'howTo']);
const QUOTE_KEYS = new Set(['quote', 'altQuote']);

const SECTION_KEYS: Record<FileType, readonly string[]> = {
  person: [
    'opening',
    'gentleOpening',
    'oct7',
    'personality',
    'past',
    'after',
    'quote',
    'altQuote',
    'guideLevels',
    'guideNote',
    'sources',
  ],
  station: ['background', 'talkingPoints', 'accessNotes', 'sources'],
  tour: ['intro', 'message', 'safety', 'howTo', 'closing', 'about', 'rights'],
};

/** JSON keys that come from front matter or are added by the converter (not from sections). */
const NON_SECTION_KEYS: Record<FileType, readonly string[]> = {
  person: [
    'id',
    'order',
    'sourceFile',
    'name',
    'honorific',
    'pronoun',
    'subtitle',
    'stationIds',
    'oct7Sensitivity',
    'photo',
    'consent',
  ],
  station: [
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
    'personIds',
    'companionPersonIds',
    'sensitivity',
    'silenceMoment',
    'driverWarning',
    'lastVerified',
  ],
  tour: [
    'id',
    'sourceFile',
    'title',
    'subtitle',
    'totalDurationMin',
    'stationIds',
    'lastContentReview',
    'contactEmail',
  ],
};

/** Visitor-visible front-matter strings compared exactly. */
const FRONT_MATTER_TEXT_KEYS: Record<FileType, readonly string[]> = {
  person: ['name', 'subtitle', 'honorific'],
  station: ['title', 'subtitle'],
  tour: ['title', 'subtitle'],
};

// ---------------------------------------------------------------------------------------------
// Own Markdown reader.
// ---------------------------------------------------------------------------------------------
const SECTION_HEADING = /^## .+ · (\w+)\s*$/;

interface ParsedMarkdown {
  frontMatter: string[];
  sections: Map<string, string>;
  errors: string[];
}

function trimBlankLines(lines: string[]): string[] {
  let start = 0;
  let end = lines.length;
  while (start < end && (lines[start] ?? '').trim() === '') start++;
  while (end > start && (lines[end - 1] ?? '').trim() === '') end--;
  return lines.slice(start, end);
}

function parseMarkdown(text: string): ParsedMarkdown {
  const errors: string[] = [];
  const lines = text.split(/\r?\n/);

  // (1) front matter = lines between the first two lines that are exactly '---'.
  const fences: number[] = [];
  lines.forEach((line, i) => {
    if (fences.length < 2 && line === '---') fences.push(i);
  });
  const [open, close] = fences;
  if (open === undefined || close === undefined) {
    return { frontMatter: [], sections: new Map(), errors: ['front matter fences not found'] };
  }
  const frontMatter = lines.slice(open + 1, close);
  const rest = lines.slice(close + 1);

  // (2) split on section headings; anything before the first heading is ignored.
  const sections = new Map<string, string>();
  let currentKey: string | null = null;
  let buffer: string[] = [];
  const flush = (): void => {
    if (currentKey === null) return;
    if (sections.has(currentKey)) errors.push(`duplicate section key "${currentKey}"`);
    sections.set(currentKey, trimBlankLines(buffer).join('\n'));
  };
  for (const line of rest) {
    if (line.startsWith('## ')) {
      const match = SECTION_HEADING.exec(line);
      if (!match?.[1]) {
        errors.push(`"## " line without " · <key>": ${line}`);
        continue;
      }
      flush();
      currentKey = match[1];
      buffer = [];
    } else if (currentKey !== null) {
      buffer.push(line);
    }
  }
  flush();
  return { frontMatter, sections, errors };
}

/** Reads a simple top-level `key: value` front-matter line (optional surrounding quotes). */
function frontMatterValue(frontMatter: string[], key: string): string | undefined {
  const prefix = `${key}:`;
  const line = frontMatter.find((l) => l.startsWith(prefix));
  if (line === undefined) return undefined;
  let value = line.slice(prefix.length).trim();
  const quoted = /^"(.*)"$/.exec(value) ?? /^'(.*)'$/.exec(value);
  if (quoted?.[1] !== undefined) value = quoted[1];
  return value;
}

// ---------------------------------------------------------------------------------------------
// Comparison — returns a list of human-readable problems (empty list = faithful).
// ---------------------------------------------------------------------------------------------
function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function show(value: unknown): string {
  return JSON.stringify(value);
}

function bulletItems(body: string, key: string, problems: string[]): string[] {
  const items: string[] = [];
  for (const line of body.split('\n')) {
    if (line.startsWith('- ')) items.push(line.slice(2));
    else problems.push(`${key}: line is not a "- " bullet: ${show(line)}`);
  }
  return items;
}

function compareSection(key: string, body: string, value: unknown): string[] {
  const problems: string[] = [];

  if (TEXT_KEYS.has(key)) {
    if (typeof value !== 'string') return [`${key}: JSON value is not a string: ${show(value)}`];
    if (normalize(value) !== normalize(body)) {
      problems.push(
        `${key}: JSON text differs from Markdown\n  md:   ${show(normalize(body))}\n  json: ${show(normalize(value))}`,
      );
    }
    return problems;
  }

  if (BULLET_KEYS.has(key)) {
    const items = bulletItems(body, key, problems);
    if (!Array.isArray(value)) return [...problems, `${key}: JSON value is not an array`];
    if (items.length !== value.length) {
      problems.push(`${key}: Markdown has ${items.length} items, JSON has ${value.length}`);
    }
    items.forEach((item, i) => {
      const jsonItem: unknown = value[i];
      if (jsonItem !== item) {
        problems.push(`${key}[${i}]: differs\n  md:   ${show(item)}\n  json: ${show(jsonItem)}`);
      }
    });
    return problems;
  }

  if (key === 'guideLevels') {
    const items = bulletItems(body, key, problems);
    if (items.length !== 3) problems.push(`guideLevels: expected 3 bullets, found ${items.length}`);
    if (typeof value !== 'object' || value === null) {
      return [...problems, 'guideLevels: JSON value is not an object'];
    }
    const levels = value as JsonObject;
    (['s30', 'm2', 'm5'] as const).forEach((level, i) => {
      const item = items[i] ?? '';
      const match = /^\*\*[^*]+:\*\* (.*)$/.exec(item);
      if (!match) {
        problems.push(`guideLevels.${level}: bullet has no "**label:** " prefix: ${show(item)}`);
        return;
      }
      if (levels[level] !== match[1]) {
        problems.push(
          `guideLevels.${level}: differs\n  md:   ${show(match[1])}\n  json: ${show(levels[level])}`,
        );
      }
    });
    if (Object.keys(levels).length !== 3) {
      problems.push(`guideLevels: JSON has keys ${show(Object.keys(levels))}`);
    }
    return problems;
  }

  if (QUOTE_KEYS.has(key)) {
    const lines = body.split('\n');
    if (lines.length !== 2)
      problems.push(`${key}: expected exactly 2 lines, found ${lines.length}`);
    const textMatch = /^> „(.*)”$/.exec(lines[0] ?? '');
    const byMatch = /^> — (.*)$/.exec(lines[1] ?? '');
    if (!textMatch) problems.push(`${key}: first line is not "> „…”": ${show(lines[0])}`);
    if (!byMatch) problems.push(`${key}: second line is not "> — …": ${show(lines[1])}`);
    if (typeof value !== 'object' || value === null) {
      return [...problems, `${key}: JSON value is not an object`];
    }
    const quote = value as JsonObject;
    if (textMatch && quote.text !== textMatch[1]) {
      problems.push(
        `${key}.text: differs\n  md:   ${show(textMatch[1])}\n  json: ${show(quote.text)}`,
      );
    }
    if (byMatch && quote.by !== byMatch[1]) {
      problems.push(`${key}.by: differs\n  md:   ${show(byMatch[1])}\n  json: ${show(quote.by)}`);
    }
    if (Object.keys(quote).length !== 2) {
      problems.push(`${key}: JSON has keys ${show(Object.keys(quote))}`);
    }
    return problems;
  }

  return [`${key}: no comparison rule for this key`];
}

/** Reverse direction: every JSON field is either front-matter/generated or has a section. */
function fieldsWithoutSection(type: FileType, json: JsonObject, sections: Map<string, string>) {
  const problems: string[] = [];
  for (const key of Object.keys(json)) {
    if (key === 'sources') continue; // CI-05
    if (NON_SECTION_KEYS[type].includes(key)) continue;
    if (!SECTION_KEYS[type].includes(key)) {
      problems.push(`JSON field "${key}" is neither a known section nor a front-matter field`);
    } else if (!sections.has(key)) {
      problems.push(`JSON field "${key}" has no "## … · ${key}" section in the Markdown file`);
    }
  }
  return problems;
}

function frontMatterProblems(type: FileType, frontMatter: string[], json: JsonObject): string[] {
  const problems: string[] = [];
  for (const key of FRONT_MATTER_TEXT_KEYS[type]) {
    const md = frontMatterValue(frontMatter, key);
    if (md !== json[key]) {
      problems.push(`front matter ${key}: md ${show(md)} ≠ json ${show(json[key])}`);
    }
  }
  return problems;
}

// ---------------------------------------------------------------------------------------------
// Real content: discover files and their JSON objects.
// ---------------------------------------------------------------------------------------------
function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8')) as unknown;
}

function asObject(value: unknown): JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

interface SourceCase {
  rel: string; // e.g. people/04_roni-eshel.md
  type: FileType;
  markdown: string;
  json: JsonObject | undefined;
}

function mdFiles(dir: string): string[] {
  return readdirSync(join(SOURCE_DIR, dir))
    .filter((f) => f.endsWith('.md'))
    .sort();
}

const stationsJson: unknown[] = (() => {
  const raw = readJson(join(DATA_DIR, 'stations.json'));
  return Array.isArray(raw) ? (raw as unknown[]) : [];
})();

function personJson(file: string): JsonObject | undefined {
  const id = /^\d{2}_([a-z0-9-]+)\.md$/.exec(file)?.[1];
  if (!id) return undefined;
  try {
    return asObject(readJson(join(DATA_DIR, 'people', `${id}.json`)));
  } catch {
    return undefined;
  }
}

function stationJson(file: string): JsonObject | undefined {
  const matches = stationsJson
    .map(asObject)
    .filter((s) => s.sourceFile === `content-source/stations/${file}`);
  return matches.length === 1 ? matches[0] : undefined;
}

const CASES: SourceCase[] = [
  ...mdFiles('people').map((f) => ({
    rel: `people/${f}`,
    type: 'person' as const,
    markdown: readFileSync(join(SOURCE_DIR, 'people', f), 'utf8'),
    json: personJson(f),
  })),
  ...mdFiles('stations').map((f) => ({
    rel: `stations/${f}`,
    type: 'station' as const,
    markdown: readFileSync(join(SOURCE_DIR, 'stations', f), 'utf8'),
    json: stationJson(f),
  })),
  {
    rel: 'tour.md',
    type: 'tour' as const,
    markdown: readFileSync(join(SOURCE_DIR, 'tour.md'), 'utf8'),
    json: asObject(readJson(join(DATA_DIR, 'tour.json'))),
  },
];

describe('CI-04 independent fidelity check', () => {
  it('CI-04 found all content-source files (9 people, 7 stations, tour)', () => {
    expect(CASES.filter((c) => c.type === 'person')).toHaveLength(9);
    expect(CASES.filter((c) => c.type === 'station')).toHaveLength(7);
    expect(CASES.filter((c) => c.type === 'tour')).toHaveLength(1);
  });

  for (const c of CASES) {
    const parsed = parseMarkdown(c.markdown);

    it(`CI-04 ${c.rel} · structure`, () => {
      expect(c.json, `no JSON object found for ${c.rel}`).toBeDefined();
      expect(parsed.errors, parsed.errors.join('\n')).toEqual([]);
      const unknown = [...parsed.sections.keys()].filter((k) => !SECTION_KEYS[c.type].includes(k));
      expect(unknown, `unknown section keys in ${c.rel}`).toEqual([]);
    });

    it(`CI-04 ${c.rel} · front matter`, () => {
      const problems = frontMatterProblems(c.type, parsed.frontMatter, c.json ?? {});
      expect(problems, problems.join('\n')).toEqual([]);
    });

    for (const [key, body] of parsed.sections) {
      if (key === 'sources') continue; // CI-05 (sources.test.ts)
      it(`CI-04 ${c.rel} · ${key}`, () => {
        const problems = compareSection(key, body, c.json?.[key]);
        expect(problems, problems.join('\n')).toEqual([]);
      });
    }

    it(`CI-04 ${c.rel} · reverse (no JSON field without a section)`, () => {
      const problems = fieldsWithoutSection(c.type, c.json ?? {}, parsed.sections);
      expect(problems, problems.join('\n')).toEqual([]);
    });
  }
});

// ---------------------------------------------------------------------------------------------
// Negative self-check (Conventions §1.11: fictional fixture, in memory only).
// ---------------------------------------------------------------------------------------------
const FICTIONAL_MARKDOWN = [
  '---',
  'id: test-person-1',
  'name: דמות בדיקה 1',
  'subtitle: תחנת בדיקה א · נתון בדיקה',
  '---',
  '',
  '# דמות בדיקה 1',
  '',
  '## פתיחה · opening',
  'זהו טקסט בדיקה ראשון.',
  '',
  'ופסקה שנייה של בדיקה.',
  '',
  '## ציטוט · quote',
  '> „משפט בדיקה”',
  '> — דובר בדיקה',
  '',
  '## רמות · guideLevels',
  '- **30 שניות:** רמת בדיקה קצרה.',
  '- **2 דקות:** רמת בדיקה בינונית.',
  '- **5 דקות:** רמת בדיקה ארוכה.',
].join('\n');

const FICTIONAL_JSON: JsonObject = {
  id: 'test-person-1',
  name: 'דמות בדיקה 1',
  subtitle: 'תחנת בדיקה א · נתון בדיקה',
  opening: 'זהו טקסט בדיקה ראשון.\n\nופסקה שנייה של בדיקה.',
  quote: { text: 'משפט בדיקה', by: 'דובר בדיקה' },
  guideLevels: { s30: 'רמת בדיקה קצרה.', m2: 'רמת בדיקה בינונית.', m5: 'רמת בדיקה ארוכה.' },
};

function allProblems(markdown: string, json: JsonObject): string[] {
  const parsed = parseMarkdown(markdown);
  const problems = [...parsed.errors];
  problems.push(...frontMatterProblems('person', parsed.frontMatter, json));
  for (const [key, body] of parsed.sections) problems.push(...compareSection(key, body, json[key]));
  problems.push(...fieldsWithoutSection('person', json, parsed.sections));
  return problems;
}

function cloneWith(patch: (j: JsonObject) => void): JsonObject {
  const copy = structuredClone(FICTIONAL_JSON);
  patch(copy);
  return copy;
}

describe('CI-04 self-check: the comparison can fail', () => {
  it('CI-04 self-check · faithful fictional fixture has no problems', () => {
    expect(allProblems(FICTIONAL_MARKDOWN, FICTIONAL_JSON)).toEqual([]);
  });

  it('CI-04 self-check · one changed word in a text field is reported', () => {
    const broken = cloneWith((j) => {
      j.opening = 'זהו טקסט שונה ראשון.\n\nופסקה שנייה של בדיקה.';
    });
    expect(allProblems(FICTIONAL_MARKDOWN, broken).join('\n')).toContain('opening');
  });

  it('CI-04 self-check · changed quote attribution is reported', () => {
    const broken = cloneWith((j) => {
      j.quote = { text: 'משפט בדיקה', by: 'דובר אחר' };
    });
    expect(allProblems(FICTIONAL_MARKDOWN, broken).join('\n')).toContain('quote.by');
  });

  it('CI-04 self-check · changed guide level is reported', () => {
    const broken = cloneWith((j) => {
      j.guideLevels = { s30: 'רמת בדיקה קצרה.', m2: 'רמה מומצאת.', m5: 'רמת בדיקה ארוכה.' };
    });
    expect(allProblems(FICTIONAL_MARKDOWN, broken).join('\n')).toContain('guideLevels.m2');
  });

  it('CI-04 self-check · a JSON field with no Markdown section is reported', () => {
    const broken = cloneWith((j) => {
      j.past = 'עובדה שלא הופיעה במקור.';
    });
    expect(allProblems(FICTIONAL_MARKDOWN, broken).join('\n')).toContain('"past"');
  });

  it('CI-04 self-check · changed front-matter name is reported', () => {
    const broken = cloneWith((j) => {
      j.name = 'דמות בדיקה 2';
    });
    expect(allProblems(FICTIONAL_MARKDOWN, broken).join('\n')).toContain('front matter name');
  });

  it('CI-04 self-check · gentleOpening is compared as a text section (F-22)', () => {
    const md = FICTIONAL_MARKDOWN.replace(
      '## ציטוט · quote',
      '## פתיחה עדינה · gentleOpening\nפתיחה עדינה של בדיקה.\n\n## ציטוט · quote',
    );
    const faithful = cloneWith((j) => {
      j.gentleOpening = 'פתיחה עדינה של בדיקה.';
    });
    expect(allProblems(md, faithful)).toEqual([]);
    const changed = cloneWith((j) => {
      j.gentleOpening = 'פתיחה עדינה שונה של בדיקה.';
    });
    expect(allProblems(md, changed).join('\n')).toContain('gentleOpening: JSON text differs');
    // A gentleOpening in JSON with no Markdown section is reported too.
    expect(allProblems(FICTIONAL_MARKDOWN, faithful).join('\n')).toContain('"gentleOpening"');
  });

  it('CI-04 self-check · a reordered bullet list is reported', () => {
    const md = '---\nid: x\n---\n## נקודות · talkingPoints\n- פריט בדיקה א\n- פריט בדיקה ב';
    const parsed = parseMarkdown(md);
    const body = parsed.sections.get('talkingPoints') ?? '';
    expect(compareSection('talkingPoints', body, ['פריט בדיקה א', 'פריט בדיקה ב'])).toEqual([]);
    expect(compareSection('talkingPoints', body, ['פריט בדיקה ב', 'פריט בדיקה א'])).not.toEqual([]);
  });
});
