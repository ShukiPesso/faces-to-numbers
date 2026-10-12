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

  await expect(gate).toBeVisible();
  await expect(page.locator('body')).not.toContainText(oct7Text);
  // Gate G2 (ADR-007): the quote of a graphic person is behind the gate too.
  await expect(page.locator('body')).not.toContainText(quoteText);

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
  for (const slug of slugs) {
    await page.goto(hashUrl(`/station/${slug}`));
    await expect(page.getByTestId('driver-warning'), `driver warning on ${slug}`).toBeVisible();
  }
});
