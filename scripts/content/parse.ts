/**
 * F-02 — line-based parsers for the strict Markdown format described in
 * `content-source/README.md` (rules 1–9). No Markdown library is used to split
 * sections; text is copied verbatim and only README rule 2 whitespace handling
 * (trim + collapse 3+ newlines to 2) is applied.
 */
import matter from 'gray-matter';

export interface FrontMatterResult {
  data: Record<string, unknown>;
  body: string;
}

export interface QuoteValue {
  text: string;
  by: string;
}

export interface GuideLevelsValue {
  s30: string;
  m2: string;
  m5: string;
}

export interface SourceValue {
  title: string;
  url: string;
}

export interface ParseBulletsOptions {
  /** Strip a leading `**label:** ` from each bullet (used by `guideLevels`). */
  stripLabel?: boolean;
}

/** README rule 1: `## <label> · <fieldKey>` — middle dot is U+00B7. */
export const SECTION_HEADING_RE = /^## (.+) · ([A-Za-z0-9]+)\s*$/;
const FRONT_MATTER_START_RE = /^---\r?\n/;
const LABELLED_BULLET_RE = /^\*\*[^*]+:\*\* /;
const QUOTE_TEXT_RE = /^> „(.+)”$/; // > „…”
const QUOTE_BY_RE = /^> — (.+)$/; // > — …
const SOURCE_SEPARATOR = ' — '; // space, em dash, space

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Splits text into lines, tolerating CRLF; does not alter line content otherwise. */
function toLines(text: string): string[] {
  return text.split(/\r?\n/);
}

/**
 * Parses the YAML front matter with gray-matter.
 * Throws `${file}: missing front matter` when the text does not start with `---`.
 */
export function parseFrontMatter(text: string, file: string): FrontMatterResult {
  if (!FRONT_MATTER_START_RE.test(text)) {
    throw new Error(`${file}: missing front matter`);
  }
  const parsed = matter(text);
  const data: unknown = parsed.data;
  if (!isRecord(data)) {
    throw new Error(`${file}: front matter must be a YAML mapping`);
  }
  return { data, body: parsed.content };
}

/**
 * README rules 1–4: keys sections by the token after ` · ` in `## ` headings.
 * Lines before the first heading are ignored. Each body is trimmed and runs of
 * 3+ newlines are collapsed to exactly 2. A duplicate key or a malformed `## `
 * heading throws.
 */
export function splitSections(body: string, file: string): Record<string, string> {
  const sections: Record<string, string> = {};
  let currentKey: string | null = null;
  let currentLines: string[] = [];

  const flush = (): void => {
    if (currentKey === null) return;
    const text = currentLines
      .join('\n')
      .trim()
      .replace(/\n{3,}/g, '\n\n');
    sections[currentKey] = text;
  };

  const lines = toLines(body);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? '';
    if (line.startsWith('## ')) {
      const match = SECTION_HEADING_RE.exec(line);
      if (!match) {
        throw new Error(
          `${file}: line ${String(i + 1)}: malformed section heading (expected "## <label> · <fieldKey>"): ${line}`,
        );
      }
      const key = match[2] ?? '';
      flush();
      if (Object.prototype.hasOwnProperty.call(sections, key)) {
        throw new Error(`${file}: duplicate section key "${key}"`);
      }
      currentKey = key;
      currentLines = [];
      continue;
    }
    if (currentKey !== null) {
      currentLines.push(line);
    }
  }
  flush();
  return sections;
}

/**
 * README rule 6: every non-empty line must start with `- `; the text after it
 * is kept verbatim. With `stripLabel`, a leading `**label:** ` is removed.
 */
export function parseBullets(
  text: string,
  file: string,
  options: ParseBulletsOptions = {},
): string[] {
  const items: string[] = [];
  for (const line of toLines(text)) {
    if (line.trim() === '') continue;
    if (!line.startsWith('- ')) {
      throw new Error(
        `${file}: bullet section contains a line that does not start with "- ": ${line}`,
      );
    }
    let item = line.slice(2);
    if (options.stripLabel) {
      if (!LABELLED_BULLET_RE.test(item)) {
        throw new Error(`${file}: bullet is missing the leading "**label:** ": ${line}`);
      }
      item = item.replace(LABELLED_BULLET_RE, '');
    }
    items.push(item);
  }
  return items;
}

/** README rule 7: exactly three labelled bullets → `{ s30, m2, m5 }`. */
export function parseGuideLevels(text: string, file: string): GuideLevelsValue {
  const items = parseBullets(text, file, { stripLabel: true });
  const [s30, m2, m5] = items;
  if (items.length !== 3 || s30 === undefined || m2 === undefined || m5 === undefined) {
    throw new Error(
      `${file}: guideLevels must have exactly 3 bullets, found ${String(items.length)}`,
    );
  }
  return { s30, m2, m5 };
}

/** README rule 8: exactly the two lines `> „<text>”` and `> — <by>`. */
export function parseQuote(text: string, file: string): QuoteValue {
  const lines = toLines(text).filter((line) => line.trim() !== '');
  const [first, second] = lines;
  if (lines.length !== 2 || first === undefined || second === undefined) {
    throw new Error(`${file}: quote must be exactly two lines, found ${String(lines.length)}`);
  }
  const textMatch = QUOTE_TEXT_RE.exec(first);
  if (!textMatch || textMatch[1] === undefined) {
    throw new Error(`${file}: quote line 1 must be "> „<text>”": ${first}`);
  }
  const byMatch = QUOTE_BY_RE.exec(second);
  if (!byMatch || byMatch[1] === undefined) {
    throw new Error(`${file}: quote line 2 must be "> — <by>": ${second}`);
  }
  return { text: textMatch[1], by: byMatch[1] };
}

/**
 * README rule 9: every line is `- <title> — <url>`; split on the LAST ` — ` so a
 * title may itself contain an em dash. The URL is kept exactly as written.
 */
export function parseSources(text: string, file: string): SourceValue[] {
  return parseBullets(text, file).map((item) => {
    const at = item.lastIndexOf(SOURCE_SEPARATOR);
    if (at === -1) {
      throw new Error(`${file}: source line must be "- <title> — <url>": - ${item}`);
    }
    const title = item.slice(0, at);
    const url = item.slice(at + SOURCE_SEPARATOR.length);
    if (title === '' || url === '') {
      throw new Error(`${file}: source line has an empty title or url: - ${item}`);
    }
    return { title, url };
  });
}
