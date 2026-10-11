// F-02 — UT-PARSE-01..05. All Markdown here is FICTIONAL (Conventions §1.11).
import { describe, expect, it } from 'vitest';

import {
  parseBullets,
  parseFrontMatter,
  parseGuideLevels,
  parseQuote,
  parseSources,
  splitSections,
} from '../../scripts/content/parse.ts';

const FILE = 'content-source/people/99_test-person.md';

describe('UT-PARSE-01 parseFrontMatter', () => {
  it('returns data + body', () => {
    const text = [
      '---',
      'id: test-person',
      'order: 99',
      'tags: [a, b]',
      '---',
      '',
      '# כותרת',
      '',
      'גוף',
    ].join('\n');
    const result = parseFrontMatter(text, FILE);
    expect(result.data).toEqual({ id: 'test-person', order: 99, tags: ['a', 'b'] });
    expect(result.body).toContain('# כותרת');
    expect(result.body).toContain('גוף');
    expect(result.body).not.toContain('id: test-person');
  });

  it('throws with the file name when front matter is missing', () => {
    expect(() => parseFrontMatter('# דמות בדיקה 1\n\n## פתיחה · opening\nטקסט', FILE)).toThrow(
      `${FILE}: missing front matter`,
    );
  });
});

describe('UT-PARSE-02 splitSections', () => {
  it('keys sections by the token after " · " and ignores text before the first heading', () => {
    const body = [
      '# דמות בדיקה 1 (מתעלמים)',
      'שורה לפני הכותרת הראשונה — מתעלמים',
      '',
      '## משפט פתיחה · opening',
      '',
      'פסקה ראשונה של דמות בדיקה 1.',
      '',
      '',
      '',
      'פסקה שנייה.',
      '',
      '## ב-7 באוקטובר · oct7',
      'טקסט **מודגש** עם ״מירכאות״.',
      '',
    ].join('\n');
    const sections = splitSections(body, FILE);
    expect(Object.keys(sections)).toEqual(['opening', 'oct7']);
    // leading/trailing blank lines trimmed; 3+ newlines collapsed to exactly 2
    expect(sections.opening).toBe('פסקה ראשונה של דמות בדיקה 1.\n\nפסקה שנייה.');
    expect(sections.oct7).toBe('טקסט **מודגש** עם ״מירכאות״.');
  });

  it('keeps a single paragraph break as \\n\\n', () => {
    const sections = splitSections('## א · a\nשורה 1\n\nשורה 2\n', FILE);
    expect(sections.a).toBe('שורה 1\n\nשורה 2');
  });

  it('throws on a duplicate key', () => {
    const body = '## פתיחה · opening\nא\n\n## פתיחה שוב · opening\nב\n';
    expect(() => splitSections(body, FILE)).toThrow(`${FILE}: duplicate section key "opening"`);
  });

  it('throws on an immediately repeated key', () => {
    expect(() => splitSections('## א · x\n## ב · x\nטקסט', FILE)).toThrow(
      'duplicate section key "x"',
    );
  });

  it('throws on a "## " heading without " · <fieldKey>"', () => {
    expect(() => splitSections('## כותרת בלי מפתח\nטקסט', FILE)).toThrow(
      'malformed section heading',
    );
  });

  it('returns an empty record when there are no headings', () => {
    expect(splitSections('# רק כותרת\nטקסט', FILE)).toEqual({});
  });
});

describe('UT-PARSE-03 parseBullets', () => {
  it('returns bullet texts verbatim, keeping **bold** and ״ ׳ quotes', () => {
    const text = [
      '- פריט **מודגש** ראשון.',
      '- ״ציטוט״ עם ׳גרש׳ – ומקף.',
      '- פריט עם - מקף באמצע',
    ].join('\n');
    expect(parseBullets(text, FILE)).toEqual([
      'פריט **מודגש** ראשון.',
      '״ציטוט״ עם ׳גרש׳ – ומקף.',
      'פריט עם - מקף באמצע',
    ]);
  });

  it('keeps a leading **label:** unless asked to strip it', () => {
    const text = '- **30 שניות:** טקסט קצר של דמות בדיקה 1.';
    expect(parseBullets(text, FILE)).toEqual(['**30 שניות:** טקסט קצר של דמות בדיקה 1.']);
    expect(parseBullets(text, FILE, { stripLabel: true })).toEqual(['טקסט קצר של דמות בדיקה 1.']);
  });

  it('throws on a line that does not start with "- "', () => {
    expect(() => parseBullets('- פריט\nשורה חופשית', FILE)).toThrow(FILE);
    expect(() => parseBullets('* פריט', FILE)).toThrow('does not start with "- "');
  });

  it('throws when stripLabel is requested and a bullet has no label', () => {
    expect(() => parseBullets('- בלי תווית', FILE, { stripLabel: true })).toThrow(
      'missing the leading',
    );
  });

  it('parseGuideLevels maps exactly three labelled bullets to s30/m2/m5', () => {
    const text = [
      '- **30 שניות:** גרסה קצרה של תחנת בדיקה א.',
      '- **2 דקות:** גרסה בינונית של תחנת בדיקה א.',
      '- **5 דקות:** גרסה ארוכה של תחנת בדיקה א.',
    ].join('\n');
    expect(parseGuideLevels(text, FILE)).toEqual({
      s30: 'גרסה קצרה של תחנת בדיקה א.',
      m2: 'גרסה בינונית של תחנת בדיקה א.',
      m5: 'גרסה ארוכה של תחנת בדיקה א.',
    });
    expect(() => parseGuideLevels('- **30 שניות:** רק אחד', FILE)).toThrow('exactly 3 bullets');
  });
});

describe('UT-PARSE-04 parseQuote', () => {
  it('extracts text between „ and ” and by after "— "', () => {
    const text = '> „משפט בדיקה, עם ״מירכאות״ בפנים”\n> — דמות בדיקה 1, בראיון';
    expect(parseQuote(text, FILE)).toEqual({
      text: 'משפט בדיקה, עם ״מירכאות״ בפנים',
      by: 'דמות בדיקה 1, בראיון',
    });
  });

  it('throws on malformed quotes', () => {
    expect(() => parseQuote('> "משפט" \n> — מישהו', FILE)).toThrow('quote line 1');
    expect(() => parseQuote('> „משפט”\n> - מישהו', FILE)).toThrow('quote line 2');
    expect(() => parseQuote('> „משפט”', FILE)).toThrow('exactly two lines');
    expect(() => parseQuote('> „משפט”\n> — א\n> — ב', FILE)).toThrow('exactly two lines');
  });
});

describe('UT-PARSE-05 parseSources', () => {
  it('splits "- title — url" lines and preserves URLs exactly', () => {
    const text = [
      '- כתבה לדוגמה (אתר בדיקה) — https://example.org/news/abc123',
      '- כותרת עם — מקף ארוך בפנים — https://example.org/%D7%A2%D7%91%D7%A8%D7%99%D7%AA/%20x/',
      '- עברית בכתובת — https://example.org/זיכרון/דף%20בדיקה',
    ].join('\n');
    expect(parseSources(text, FILE)).toEqual([
      { title: 'כתבה לדוגמה (אתר בדיקה)', url: 'https://example.org/news/abc123' },
      {
        title: 'כותרת עם — מקף ארוך בפנים',
        url: 'https://example.org/%D7%A2%D7%91%D7%A8%D7%99%D7%AA/%20x/',
      },
      { title: 'עברית בכתובת', url: 'https://example.org/זיכרון/דף%20בדיקה' },
    ]);
  });

  it('throws on a line without " — "', () => {
    expect(() => parseSources('- כותרת בלי כתובת', FILE)).toThrow('source line must be');
  });

  it('returns [] for an empty section', () => {
    expect(parseSources('', FILE)).toEqual([]);
  });
});
