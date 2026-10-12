import { expect, test } from '@playwright/test';
import type { ConsoleMessage } from '@playwright/test';

// The one approved skip (task T-10): without a live URL there is nothing to smoke-test.
test.skip(!process.env.LIVE_URL, 'LIVE_URL not set');

const SERVICE_WORKER_TIMEOUT_MS = 15_000;

/** Console messages of type `error` seen since the last check. Filled by every test in this file. */
const consoleErrors: string[] = [];

function recordConsoleError(message: ConsoleMessage): void {
  if (message.type() === 'error') {
    consoleErrors.push(message.text());
  }
}

test.beforeEach(({ page }) => {
  page.on('console', recordConsoleError);
});

// Each test checks the errors it produced, so a failure is reported against the test that caused it.
test.afterEach(() => {
  const errors = consoleErrors.splice(0);
  expect(errors, 'no console errors during the smoke tests').toEqual([]);
});

test('E2E-SMOKE-01 home returns 200 with a visible h1 in RTL @smoke', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});

test('E2E-SMOKE-02 tour opens and the first station page renders @smoke', async ({ page }) => {
  await page.goto('/#/tour');
  const firstStation = page.locator('[data-testid^="station-card-"]').first();
  await expect(firstStation).toBeVisible();
  await firstStation.click();
  await expect(page).toHaveURL(/#\/station\//);
  await expect(page.locator('h1')).toBeVisible();
});

test('E2E-SMOKE-03 service worker registers within 15 s @smoke', async ({ page }) => {
  await page.goto('/');
  const registered = await page.evaluate(
    (timeoutMs) =>
      Promise.race([
        navigator.serviceWorker.ready.then(() => true),
        new Promise<boolean>((resolve) => setTimeout(() => resolve(false), timeoutMs)),
      ]),
    SERVICE_WORKER_TIMEOUT_MS,
  );
  expect(registered, 'navigator.serviceWorker.ready should resolve within 15 s').toBe(true);
});
