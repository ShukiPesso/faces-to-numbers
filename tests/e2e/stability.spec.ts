import { expect, test } from '@playwright/test';
import { he } from '../../src/i18n/he';
import { waitForServiceWorker } from './helpers/offline';

/**
 * T-12 / T-11 HIGH-3 — the "saved on the device" message must not push the page content down.
 * (A message that sits in the page flow shifts <main> on every first visit; CLS, F-19/F-20.)
 */
test('E2E-STAB-01 the offline-ready message does not move <main> @sw', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chrome', 'runs on mobile-chrome only');

  await page.goto('/');
  const main = page.locator('main#main');
  await expect(page.locator('h1').first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const before = await main.boundingBox();
  expect(before, '<main> has a box before the message').not.toBeNull();

  await waitForServiceWorker(page);
  await expect(page.getByTestId('offline-indicator')).toContainText(he['offline.ready']);

  const after = await main.boundingBox();
  expect(after, '<main> has a box after the message').not.toBeNull();
  expect(
    Math.abs((after?.y ?? 0) - (before?.y ?? 0)),
    `<main> top moved from ${String(before?.y)} to ${String(after?.y)}`,
  ).toBeLessThanOrEqual(1);
});
