import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/** Gamification / celebration words that must never appear in the UI (Conventions §1.4). */
export const BANNED_UI_WORDS = [
  'כל הכבוד',
  'מעולה',
  'הצלחתם',
  'ניצחתם',
  'צברתם',
  'ניקוד',
  'תג הישג',
  'רמה הבאה',
] as const;

/** Asserts the rendered page text contains none of `BANNED_UI_WORDS`. */
export async function expectNoBannedWords(page: Page): Promise<void> {
  const text = await page.evaluate(() => document.body.innerText);
  const found = BANNED_UI_WORDS.filter((word) => text.includes(word));
  expect(found, `banned UI words found on ${page.url()}`).toEqual([]);
}
