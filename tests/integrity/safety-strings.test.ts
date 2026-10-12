/**
 * T-12 / T-11 HIGH-1 — The safety-critical UI strings are pinned.
 *
 * The values below are a REVIEWED ALLOW-LIST of the exact current text in `src/i18n/he.ts`.
 * Changing ANY of them (even one word) requires Shuki's approval: they carry the driver warning
 * (Conventions §1.9), the content-warning gate (§1.4/§1.6) and the location privacy line (§1.10).
 * If you changed a value on purpose with that approval, update it here in the same commit.
 */
import { describe, expect, it } from 'vitest';
import { he } from '@/i18n/he';

const PINNED_SAFETY_STRINGS = {
  // Driver safety (§1.9)
  'drive.warning': 'מי שנוהג לא משתמש באפליקציה בזמן הנסיעה. מי שיושב לידו מקריא.',
  // Content-warning gate
  'warning.title': 'לפני שממשיכים',
  'warning.body': 'הקטע הבא כולל תיאורים קשים. אפשר לקרוא אותו, ואפשר לדלג עליו.',
  'warning.show': 'להציג את הקטע',
  'warning.skip': 'לדלג על הקטע',
  'warning.skipped': 'הקטע לא מוצג. אפשר להציג אותו בכל רגע.',
  // Location and privacy (§1.10)
  'nearby.privacy': 'המיקום נבדק רק במכשיר שלכם, לא נשמר ולא נשלח לשום מקום.',
  'station.locationUnverified':
    'המיקום בבדיקה, ולכן אין כאן קישורי ניווט. אפשר להיעזר בתיאור התחנה.',
} as const satisfies Partial<Record<keyof typeof he, string>>;

describe('safety-critical strings are pinned (T-12 H1)', () => {
  const entries = Object.entries(PINNED_SAFETY_STRINGS) as [keyof typeof he, string][];

  it.each(entries)('%s equals the reviewed value', (key, expected) => {
    expect(
      he[key],
      `he.ts key "${key}" changed. Safety-critical strings need Shuki's approval; ` +
        `if approved, update tests/integrity/safety-strings.test.ts.`,
    ).toBe(expected);
  });
});
