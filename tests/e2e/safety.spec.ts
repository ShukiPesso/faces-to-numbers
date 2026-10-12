import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { expectNoBannedWords } from './helpers/banned';
import { allRoutes } from './helpers/routes';

const routes = allRoutes();

const STATIONS_FILE = fileURLToPath(
  new URL('../../src/content/data/stations.json', import.meta.url),
);

interface StationEntry {
  slug: string;
  kind: string;
}

function driveSlugs(): string[] {
  const stations = JSON.parse(readFileSync(STATIONS_FILE, 'utf8')) as StationEntry[];
  return stations.filter((station) => station.kind === 'drive').map((station) => station.slug);
}

const HE_FILE = fileURLToPath(new URL('../../src/i18n/he.ts', import.meta.url));

const CONTRACT_FILE = fileURLToPath(new URL('../../contracts/strings.he.ts', import.meta.url));

/** Reads a string value straight from a strings source file (not through t()). */
function heSourceValue(key: string, file: string = HE_FILE): string {
  const source = readFileSync(file, 'utf8');
  const match = new RegExp(`'${key.replace(/\./g, '\\.')}':\\s*'([^']*)'`).exec(source);
  if (!match?.[1]) {
    throw new Error(`safety.spec: key "${key}" not found in src/i18n/he.ts`);
  }
  return match[1];
}

const hashUrl = (route: string): string => `/#${route}`;

test('E2E-SAFE-01 no audio/video autoplays or plays on any route', async ({ page }) => {
  for (const route of routes) {
    await page.goto(hashUrl(route));
    await expect(page.locator('h1')).toBeVisible();
    const media = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLMediaElement>('audio, video')).map((el) => ({
        autoplay: el.hasAttribute('autoplay') || el.autoplay,
        playing: !el.paused,
      })),
    );
    expect(
      media.filter((m) => m.autoplay || m.playing),
      `autoplaying/playing media on ${route}`,
    ).toEqual([]);
  }
});

test('E2E-SAFE-02 graphic person: oct7 and quote hidden until "show" @fixture', async ({
  page,
}) => {
  await page.goto(hashUrl('/person/test-person-2'));
  const gate = page.getByTestId('warning-gate');
  const oct7Text = 'טקסט בדיוני של דמות בדיקה 2 בסעיף המוסתר עד לחיצה.';
  const quoteText = 'ציטוט בדיוני של דמות בדיקה 2';
  const openingText = 'משפט פתיחה בדיוני של דמות בדיקה 2.';
  const gentleOpeningText = 'פתיחה עדינה בדיונית של דמות בדיקה 2.';
  const s30Text = 'טקסט בדיוני של חצי דקה עבור דמות בדיקה 2.';
  // The fixture person has no altQuote; it is gated together with quote (same QuoteBlock gate).
  const hiddenBeforeShow = [openingText, oct7Text, quoteText, s30Text];

  await expect(gate).toBeVisible();
  await expect(page.locator('body')).not.toContainText(oct7Text);
  // Gate G2 (ADR-007): the quote of a graphic person is behind the gate too.
  await expect(page.locator('body')).not.toContainText(quoteText);

  // M1 (T-11): at every reading depth, nothing gated leaks and the gentle opening is what shows.
  for (const depth of ['s30', 'm5', 'm2'] as const) {
    await page.locator(`#depth-tab-${depth}`).click();
    await expect(page.locator(`#depth-tab-${depth}`)).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('warning-gate'), `gate at ${depth}`).toBeVisible();
    for (const hidden of hiddenBeforeShow) {
      await expect(page.locator('body'), `"${hidden}" before show at ${depth}`).not.toContainText(
        hidden,
      );
    }
    if (depth !== 's30') {
      await expect(page.getByText(gentleOpeningText), `gentleOpening at ${depth}`).toBeVisible();
    }
  }

  await page.getByTestId('warning-skip').click();
  await expect(page.getByText(oct7Text)).toHaveCount(0);
  await expect(page.getByText(quoteText)).toHaveCount(0);

  await page.getByTestId('warning-show').click();
  const revealed = page.getByText(oct7Text);
  await expect(revealed).toBeVisible();
  await expect(page.getByText(quoteText)).toBeVisible();
  await expect(page.getByTestId('warning-gate')).toHaveCount(0);
  // Focus moves to the revealed region, which contains the text.
  const focusedContains = await page.evaluate(
    (text) => document.activeElement?.textContent?.includes(text) ?? false,
    oct7Text,
  );
  expect(focusedContains).toBe(true);

  // M1 (T-11): after "show" the opening and the s30 text are present too.
  await expect(page.getByText(openingText)).toBeVisible();
  await page.locator('#depth-tab-s30').click();
  await expect(page.getByText(s30Text)).toBeVisible();
  await page.locator('#depth-tab-m2').click();
  await expect(page.getByText(oct7Text)).toBeVisible();

  await page.reload();
  await expect(page.getByText(oct7Text)).toBeVisible();
  await expect(page.getByText(quoteText)).toBeVisible();
  await expect(page.getByTestId('warning-gate')).toHaveCount(0);
});

test('E2E-SAFE-03 every image is same-origin or a data: URI', async ({ page }) => {
  for (const route of routes) {
    await page.goto(hashUrl(route));
    await expect(page.locator('h1')).toBeVisible();
    const origin = new URL(page.url()).origin;
    const srcs = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLImageElement>('img')).map((img) => img.src),
    );
    const foreign = srcs.filter(
      (src) => !src.startsWith('data:') && new URL(src).origin !== origin,
    );
    expect(foreign, `foreign images on ${route}`).toEqual([]);
  }
});

test('E2E-SAFE-04 no banned gamification words on any route', async ({ page }) => {
  for (const route of routes) {
    await page.goto(hashUrl(route));
    await expect(page.locator('h1')).toBeVisible();
    await expectNoBannedWords(page);
  }
});

test('E2E-SAFE-05 every drive station shows the driver warning', async ({ page }) => {
  const slugs = driveSlugs();
  expect(slugs.length).toBeGreaterThan(0);
  // T-12 H1: the exact text, read from the he.ts source file (not via t()).
  const expected = heSourceValue('drive.warning');
  // ...and it still equals the frozen strings contract, so editing he.ts alone cannot pass.
  expect(expected, 'he.ts drive.warning vs contracts/strings.he.ts').toBe(
    heSourceValue('drive.warning', CONTRACT_FILE),
  );
  for (const slug of slugs) {
    await page.goto(hashUrl(`/station/${slug}`));
    const warning = page.getByTestId('driver-warning');
    await expect(warning, `driver warning on ${slug}`).toBeVisible();
    await expect(warning, `driver warning text on ${slug}`).toContainText(expected);
  }
});
