import { expect, test, type Page } from '@playwright/test';
import { goOffline, goOnline, waitForServiceWorker } from './helpers/offline';
import { allRoutes } from './helpers/routes';

/**
 * Offline promise (E2E-OFF-01..02): once the site was opened with reception, the whole tour
 * works with no reception at all. Service workers only run in the Chromium projects (@sw).
 */

/**
 * Records every request of the page that failed or answered with an error status. A request
 * that the browser itself cancelled because the page navigated away (net::ERR_ABORTED) is not a
 * missing file; anything not in the precache fails offline with a different error.
 */
function trackMissingAssets(page: Page): string[] {
  const missing: string[] = [];
  page.on('requestfailed', (request) => {
    const error = request.failure()?.errorText ?? 'failed';
    if (error === 'net::ERR_ABORTED') return;
    missing.push(`${request.url()} (${error})`);
  });
  page.on('response', (response) => {
    if (response.status() >= 400) {
      missing.push(`${response.url()} (HTTP ${String(response.status())})`);
    }
  });
  return missing;
}

function describeMissing(missing: string[]): string {
  return missing.length > 0 ? `missing offline: ${missing.join(', ')}` : 'no failed requests';
}

/** Opens the site with reception and waits until the service worker controls the page. */
async function openWithServiceWorker(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // clientsClaim should hand the page to the first worker; reload once if it has not yet.
  const controlled = await page.evaluate(() => navigator.serviceWorker.controller !== null);
  if (!controlled) {
    await page.reload();
  }
  await waitForServiceWorker(page);
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Opens a route as a brand-new document, as when a deep link is opened with no reception: the
 * HTML, script, styles and fonts all have to come from the service worker's cache.
 */
async function openFresh(page: Page, route: string): Promise<void> {
  await page.goto('about:blank');
  await page.goto(`/#${route}`);
  await expect(page).toHaveURL(new RegExp(`#${escapeRegExp(route)}$`));
}

/**
 * The browser may reuse a file it still holds in memory instead of asking the service worker,
 * which would hide a file missing from the precache. So also check that every same-origin file
 * this document used (resource timing) is in Cache Storage, and record the ones that are not.
 */
async function recordUncachedResources(page: Page, missing: string[]): Promise<void> {
  const uncached = await page.evaluate(async () => {
    const urls = [
      location.href.split('#')[0] ?? location.href,
      ...performance
        .getEntriesByType('resource')
        .map((entry) => entry.name)
        .filter((url) => new URL(url).origin === location.origin),
    ];
    const result: string[] = [];
    for (const url of new Set(urls)) {
      if (!(await caches.match(url, { ignoreSearch: true }))) {
        // The document URL is served by the navigation fallback (index.html).
        if (
          url === urls[0] &&
          (await caches.match(new URL('index.html', url).href, { ignoreSearch: true }))
        ) {
          continue;
        }
        result.push(url);
      }
    }
    return result;
  });
  for (const url of uncached) {
    const entry = `${url} (not in the service worker cache)`;
    if (!missing.includes(entry)) missing.push(entry);
  }
}

/**
 * The route shows its h1 and non-empty main content, and nothing it asked for was missing from
 * the cache. On failure the message lists the URLs that failed offline (collected up to then).
 */
async function expectRouteRenders(page: Page, route: string, missing: string[]): Promise<void> {
  try {
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading, `${route}: h1 visible offline`).toBeVisible();
    await expect(heading, `${route}: h1 has text`).not.toHaveText('');
    await expect(page.locator('main#main'), `${route}: main content`).not.toHaveText('');
  } catch (error) {
    await recordUncachedResources(page, missing).catch(() => undefined);
    throw new Error(
      `${route} did not render offline — ${describeMissing(missing)}\n${String(error)}`,
    );
  }
  await recordUncachedResources(page, missing);
  expect(missing, `${route}: ${describeMissing(missing)}`).toEqual([]);
}

test.describe('offline', () => {
  test('E2E-OFF-01 every route renders offline after the first visit @sw', async ({
    page,
    context,
  }) => {
    const routes = allRoutes();
    expect(routes.length, 'routes come from the real content').toBeGreaterThan(4);

    await openWithServiceWorker(page);
    const missing = trackMissingAssets(page);

    await goOffline(context);
    try {
      for (const route of routes) {
        await openFresh(page, route);
        await expectRouteRenders(page, route, missing);
        await expect(page.getByTestId('offline-indicator')).toBeVisible();
        await expect(page.getByTestId('offline-indicator')).not.toBeEmpty();
      }
      expect(missing, describeMissing(missing)).toEqual([]);
    } finally {
      await goOnline(context);
    }
  });

  test('E2E-OFF-02 a hard reload offline loads the shell and a station from cache @sw', async ({
    page,
    context,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome', 'E2E-OFF-02 runs on mobile-chrome only');

    const station = allRoutes().find((route) => route.startsWith('/station/'));
    expect(station, 'at least one station route').toBeDefined();
    if (!station) return;

    await openWithServiceWorker(page);
    const missing = trackMissingAssets(page);

    await goOffline(context);
    try {
      // App shell: a full document reload with no network.
      await page.reload();
      await expect(page.locator('header').first()).toBeVisible();
      await expectRouteRenders(page, '/', missing);
      await expect(page.getByTestId('offline-indicator')).not.toBeEmpty();

      // A station page: a fresh document load straight onto the station's deep link.
      await openFresh(page, station);
      await expectRouteRenders(page, station, missing);
      await expect(page.getByTestId('offline-indicator')).not.toBeEmpty();

      expect(missing, describeMissing(missing)).toEqual([]);
    } finally {
      await goOnline(context);
    }
  });
});
