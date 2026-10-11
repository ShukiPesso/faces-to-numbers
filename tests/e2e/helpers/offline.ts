import { expect } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';

/**
 * Waits until a service worker is active **and** controls the page.
 * Service workers are only supported on Chromium in Playwright — use in `@sw` tests only.
 */
export async function waitForServiceWorker(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null), {
      message: 'service worker should control the page',
    })
    .toBe(true);
}

/** Cuts the network for every page in the context. */
export async function goOffline(context: BrowserContext): Promise<void> {
  await context.setOffline(true);
}

/** Restores the network for every page in the context. */
export async function goOnline(context: BrowserContext): Promise<void> {
  await context.setOffline(false);
}
