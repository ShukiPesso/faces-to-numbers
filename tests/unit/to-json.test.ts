// F-02 — UT-PARSE-06/07 on FICTIONAL fixtures (Conventions §1.11) + the real-file oracle test.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { personFromMd, stationFromMd, tourFromMd } from '../../scripts/content/to-json.ts';
import { PersonSchema, StationSchema, TourSchema } from '../../src/content/schema.ts';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const readRoot = (relPath: string): string =>
  readFileSync(new URL(relPath, `file://${ROOT}`), 'utf8');

const PERSON_MD = `---
id: test-person-1
order: 99
name: דמות בדיקה 1
honorific: הי״ד
pronoun: she
subtitle: תת-כותרת של דמות בדיקה · בת 99 · מיישוב בדיקה
stationIds: [test-station-a]
oct7Sensitivity: standard
photoReferenceUrl: https://example.org/photo/test-person-1
---

# דמות בדיקה 1 (כותרת — מתעלמים)

## משפט פתיחה · opening
משפט פתיחה של דמות בדיקה 1, עם ״מירכאות״ ועם **הדגשה**.

## ב-7 באוקטובר · oct7
פסקה ראשונה של דמות בדיקה 1.

פסקה שנייה של דמות בדיקה 1.

## מי היא הייתה · personality
תיאור אישיות של דמות בדיקה 1.

## סיפור מהעבר · past
סיפור מהעבר של דמות בדיקה 1.

## ציטוט · quote
> „ציטוט בדיקה של דמות בדיקה 1”
> — מקור הציטוט, בראיון בדיקה

## איך לספר לפי הזמן · guideLevels
- **30 שניות:** גרסת 30 שניות של דמות בדיקה 1.
- **2 דקות:** גרסת 2 דקות של דמות בדיקה 1.
- **5 דקות:** גרסת 5 דקות של דמות בדיקה 1.

## מקורות · sources
- מקור בדיקה (אתר בדיקה) — https://example.org/news/test-1
- מקור בדיקה עם עברית — https://example.org/זיכרון/דף%20בדיקה
`;

const PERSON_EXPECTED = {
  id: 'test-person-1',
  order: 99,
  sourceFile: 'content-source/people/99_test-person-1.md',
  name: 'דמות בדיקה 1',
  honorific: 'הי״ד',
  pronoun: 'she',
  subtitle: 'תת-כותרת של דמות בדיקה · בת 99 · מיישוב בדיקה',
  stationIds: ['test-station-a'],
  opening: 'משפט פתיחה של דמות בדיקה 1, עם ״מירכאות״ ועם **הדגשה**.',
  oct7: 'פסקה ראשונה של דמות בדיקה 1.\n\nפסקה שנייה של דמות בדיקה 1.',
  oct7Sensitivity: 'standard',
  personality: 'תיאור אישיות של דמות בדיקה 1.',
  past: 'סיפור מהעבר של דמות בדיקה 1.',
  quote: { text: 'ציטוט בדיקה של דמות בדיקה 1', by: 'מקור הציטוט, בראיון בדיקה' },
  guideLevels: {
    s30: 'גרסת 30 שניות של דמות בדיקה 1.',
    m2: 'גרסת 2 דקות של דמות בדיקה 1.',
    m5: 'גרסת 5 דקות של דמות בדיקה 1.',
  },
  photo: { status: 'pending', referenceUrl: 'https://example.org/photo/test-person-1' },
  consent: { family: 'not_contacted' },
  sources: [
    { title: 'מקור בדיקה (אתר בדיקה)', url: 'https://example.org/news/test-1' },
    { title: 'מקור בדיקה עם עברית', url: 'https://example.org/זיכרון/דף%20בדיקה' },
  ],
};

describe('UT-PARSE-06 personFromMd', () => {
  it('produces the exact expected object for a fictional person', () => {
    const result = personFromMd('content-source/people/99_test-person-1.md', PERSON_MD);
    expect(result).toEqual(PERSON_EXPECTED);
    expect(Object.keys(result).sort()).toEqual(Object.keys(PERSON_EXPECTED).sort());
    expect(PersonSchema.safeParse(result).success).toBe(true);
  });

  it('normalizes a Windows path in sourceFile', () => {
    const result = personFromMd('content-source\\people\\99_test-person-1.md', PERSON_MD);
    expect(result.sourceFile).toBe('content-source/people/99_test-person-1.md');
  });

  it('builds a cleared photo only with photo AND consent: granted; omits referenceUrl when absent', () => {
    const withPhoto = PERSON_MD.replace(
      'photoReferenceUrl: https://example.org/photo/test-person-1',
      'consent: granted\nphoto: { src: /photos/test-person-1.webp, alt: דמות בדיקה 1, credit: משפחת בדיקה }',
    );
    const cleared = personFromMd('content-source/people/99_test-person-1.md', withPhoto);
    expect(cleared.photo).toEqual({
      status: 'cleared',
      src: '/photos/test-person-1.webp',
      alt: 'דמות בדיקה 1',
      credit: 'משפחת בדיקה',
    });
    expect(cleared.consent).toEqual({ family: 'granted' });

    const requested = personFromMd(
      'content-source/people/99_test-person-1.md',
      withPhoto.replace('consent: granted', 'consent: requested'),
    );
    expect(requested.photo).toEqual({ status: 'pending' });
    expect(requested.consent).toEqual({ family: 'requested' });
  });

  it('includes optional sections (after, altQuote, guideNote) when present', () => {
    const withOptional = PERSON_MD.replace(
      '## ציטוט · quote',
      '## מה קרה אחר כך · after\nמה קרה אחר כך עם דמות בדיקה 1.\n\n## ציטוט · quote',
    ).replace(
      '## מקורות · sources',
      '## ציטוט נוסף · altQuote\n> „ציטוט נוסף של דמות בדיקה 1”\n> — מקור נוסף\n\n## הערה · guideNote\nהערה למדריך על דמות בדיקה 1.\n\n## מקורות · sources',
    );
    const result = personFromMd('content-source/people/99_test-person-1.md', withOptional);
    expect(result.after).toBe('מה קרה אחר כך עם דמות בדיקה 1.');
    expect(result.altQuote).toEqual({ text: 'ציטוט נוסף של דמות בדיקה 1', by: 'מקור נוסף' });
    expect(result.guideNote).toBe('הערה למדריך על דמות בדיקה 1.');
  });

  it('maps the gentleOpening section (F-22) for a graphic person; omitted when absent', () => {
    expect(personFromMd('content-source/people/99_test-person-1.md', PERSON_MD)).not.toHaveProperty(
      'gentleOpening',
    );
    const graphic = PERSON_MD.replace(
      'oct7Sensitivity: standard',
      'oct7Sensitivity: graphic',
    ).replace(
      '## ב-7 באוקטובר · oct7',
      '## פתיחה עדינה · gentleOpening\nפתיחה עדינה של דמות בדיקה 1, עם ״מירכאות״.\n\n## ב-7 באוקטובר · oct7',
    );
    const result = personFromMd('content-source/people/99_test-person-1.md', graphic);
    expect(result.gentleOpening).toBe('פתיחה עדינה של דמות בדיקה 1, עם ״מירכאות״.');
    expect(result).toEqual({
      ...PERSON_EXPECTED,
      oct7Sensitivity: 'graphic',
      gentleOpening: 'פתיחה עדינה של דמות בדיקה 1, עם ״מירכאות״.',
    });
    // Converter order: gentleOpening right after opening.
    const keys = Object.keys(result);
    expect(keys.indexOf('gentleOpening')).toBe(keys.indexOf('opening') + 1);
    expect(PersonSchema.safeParse(result).success).toBe(true);
  });

  it('schema rejects gentleOpening unless oct7Sensitivity is graphic (F-22 refinement)', () => {
    const md = PERSON_MD.replace(
      '## ב-7 באוקטובר · oct7',
      '## פתיחה עדינה · gentleOpening\nפתיחה עדינה של דמות בדיקה 1.\n\n## ב-7 באוקטובר · oct7',
    );
    const result = personFromMd('content-source/people/99_test-person-1.md', md);
    expect(result.oct7Sensitivity).toBe('standard');
    const parsed = PersonSchema.safeParse(result);
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues.map((i) => [i.path.join('.'), i.message])).toEqual([
      ['gentleOpening', "gentleOpening is allowed only when oct7Sensitivity is 'graphic'"],
    ]);
  });

  it('throws on an unknown section key or unknown front matter key', () => {
    expect(() =>
      personFromMd(
        'content-source/people/99_test-person-1.md',
        PERSON_MD.replace('## סיפור מהעבר · past', '## משהו · unknownKey'),
      ),
    ).toThrow('unknown section key "unknownKey"');
    expect(() =>
      personFromMd(
        'content-source/people/99_test-person-1.md',
        PERSON_MD.replace('order: 99', 'order: 99\nfoo: 1'),
      ),
    ).toThrow('unknown front matter key "foo"');
  });
});

const STATION_MD = `---
id: test-station-a
slug: test-station-a
order: 98
title: תחנת בדיקה א
subtitle: תת-כותרת של תחנת בדיקה א
kind: drive
durationMin: 10
radiusM: 500
location: null
personIds: [test-person-1]
companionPersonIds: []
sensitivity: standard
driverWarning: true
silenceMoment: null
---

# תחנת בדיקה א

## מה קרה כאן · background
רקע של תחנת בדיקה א.

פסקה שנייה.

## כדאי לשים לב · talkingPoints
- נקודה ראשונה לתחנת בדיקה א.
- נקודה שנייה, עם ״מירכאות״.
`;

const STATION_EXPECTED = {
  id: 'test-station-a',
  order: 98,
  sourceFile: 'content-source/stations/98_test-station-a.md',
  slug: 'test-station-a',
  title: 'תחנת בדיקה א',
  subtitle: 'תת-כותרת של תחנת בדיקה א',
  kind: 'drive',
  durationMin: 10,
  location: null,
  radiusM: 500,
  background: 'רקע של תחנת בדיקה א.\n\nפסקה שנייה.',
  talkingPoints: ['נקודה ראשונה לתחנת בדיקה א.', 'נקודה שנייה, עם ״מירכאות״.'],
  personIds: ['test-person-1'],
  companionPersonIds: [],
  sensitivity: 'standard',
  silenceMoment: null,
  driverWarning: true,
  sources: [],
};

const TOUR_MD = `---
id: test-tour
title: סיור בדיקה
subtitle: תת-כותרת של סיור בדיקה
totalDurationMin: 120
stationIds: [test-station-a]
lastContentReview: 2026-01-02
---

# סיור בדיקה

## פתיחה · intro
פתיחה של סיור בדיקה.

## המסר · message
המסר של סיור בדיקה.

## לפני שיוצאים לדרך · safety
- כלל בטיחות ראשון של סיור בדיקה.

## איך משתמשים · howTo
- הוראת שימוש ראשונה.
- הוראת שימוש שנייה.

## סיום · closing
סיום של סיור בדיקה.

## אודות · about
אודות סיור בדיקה.

## זכויות והסכמות · rights
זכויות של סיור בדיקה.
`;

const TOUR_EXPECTED = {
  id: 'test-tour',
  sourceFile: 'content-source/tour.md',
  title: 'סיור בדיקה',
  subtitle: 'תת-כותרת של סיור בדיקה',
  totalDurationMin: 120,
  intro: 'פתיחה של סיור בדיקה.',
  message: 'המסר של סיור בדיקה.',
  safety: ['כלל בטיחות ראשון של סיור בדיקה.'],
  howTo: ['הוראת שימוש ראשונה.', 'הוראת שימוש שנייה.'],
  closing: 'סיום של סיור בדיקה.',
  about: 'אודות סיור בדיקה.',
  rights: 'זכויות של סיור בדיקה.',
  stationIds: ['test-station-a'],
  lastContentReview: '2026-01-02',
};

describe('UT-PARSE-07 stationFromMd and tourFromMd', () => {
  it('converts a fictional station with location: null and silenceMoment: null, no sources section → []', () => {
    const result = stationFromMd('content-source/stations/98_test-station-a.md', STATION_MD);
    expect(result).toEqual(STATION_EXPECTED);
    expect(Object.keys(result).sort()).toEqual(Object.keys(STATION_EXPECTED).sort());
    expect(StationSchema.safeParse(result).success).toBe(true);
  });

  it('keeps location / silenceMoment objects and writes dates as YYYY-MM-DD', () => {
    const md = STATION_MD.replace(
      'location: null',
      'location: { lat: 31.4, lng: 34.5, verified: true, verifiedBy: בודק, verifiedAt: 2026-03-04, note: הערת בדיקה }\nlastVerified: 2026-03-05',
    )
      .replace(
        'silenceMoment: null',
        'silenceMoment: { seconds: 30, prompt: "חצי דקה של שקט בתחנת בדיקה א." }',
      )
      .replace(
        '## כדאי לשים לב',
        '## גישה ושעות · accessNotes\nהערות גישה לתחנת בדיקה א.\n\n## כדאי לשים לב',
      )
      .concat('\n## מקורות · sources\n- מקור תחנה — https://example.org/station-a\n');
    const result = stationFromMd('content-source/stations/98_test-station-a.md', md);
    expect(result.location).toEqual({
      lat: 31.4,
      lng: 34.5,
      verified: true,
      verifiedBy: 'בודק',
      verifiedAt: '2026-03-04',
      note: 'הערת בדיקה',
    });
    expect(result.lastVerified).toBe('2026-03-05');
    expect(result.silenceMoment).toEqual({ seconds: 30, prompt: 'חצי דקה של שקט בתחנת בדיקה א.' });
    expect(result.accessNotes).toBe('הערות גישה לתחנת בדיקה א.');
    expect(result.sources).toEqual([{ title: 'מקור תחנה', url: 'https://example.org/station-a' }]);
    expect(StationSchema.safeParse(result).success).toBe(true);
  });

  it('converts a fictional tour (lastContentReview as string, contactEmail omitted when absent)', () => {
    const result = tourFromMd('content-source/tour.md', TOUR_MD);
    expect(result).toEqual(TOUR_EXPECTED);
    expect(Object.keys(result).sort()).toEqual(Object.keys(TOUR_EXPECTED).sort());
    expect(TourSchema.safeParse(result).success).toBe(true);

    const withEmail = tourFromMd(
      'content-source/tour.md',
      TOUR_MD.replace(
        'lastContentReview: 2026-01-02',
        'lastContentReview: 2026-01-02\ncontactEmail: test@example.org',
      ),
    );
    expect(withEmail.contactEmail).toBe('test@example.org');
  });

  it('throws when a bullet section contains a non-bullet line', () => {
    expect(() =>
      tourFromMd(
        'content-source/tour.md',
        TOUR_MD.replace('- הוראת שימוש שנייה.', 'שורה שאינה פריט'),
      ),
    ).toThrow('does not start with "- "');
  });
});

describe('oracle — real source files deep-equal the frozen contract examples', () => {
  it('content-source/people/04_roni-eshel.md → contracts/example-person.json', () => {
    const relPath = 'content-source/people/04_roni-eshel.md';
    const result = personFromMd(relPath, readRoot(relPath));
    expect(result).toEqual(JSON.parse(readRoot('contracts/example-person.json')));
  });

  it('content-source/stations/04_reim-shelter.md → contracts/example-station.json', () => {
    const relPath = 'content-source/stations/04_reim-shelter.md';
    const result = stationFromMd(relPath, readRoot(relPath));
    expect(result).toEqual(JSON.parse(readRoot('contracts/example-station.json')));
  });
});
