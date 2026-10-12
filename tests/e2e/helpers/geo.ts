import type { BrowserContext, Page } from '@playwright/test';

/** A geolocation point in the shape Playwright's `context.setGeolocation` accepts. */
export interface FixturePoint {
  readonly latitude: number;
  readonly longitude: number;
}

/**
 * Test coordinates for the fictional fixture stations (docs/04_TESTING_STRATEGY.md §3).
 * - `atA`:   ≈60 m from station `test-a` (inside its 300 m radius)
 * - `nearB`: ≈1.1 km from station `test-b`
 * - `far`:   more than 5 km from every station
 */
export const FIXTURE_POINTS = {
  atA: { latitude: 31.4005, longitude: 34.5003 },
  nearB: { latitude: 31.46, longitude: 34.55 },
  far: { latitude: 31.6, longitude: 34.7 },
} as const satisfies Record<'atA' | 'nearB' | 'far', FixturePoint>;

/** Grants the geolocation permission and places the device at `point`. */
export async function grantGeo(context: BrowserContext, point: FixturePoint): Promise<void> {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: point.latitude, longitude: point.longitude });
}

/** Removes every granted permission, so a geolocation request is not allowed. */
export async function denyGeo(context: BrowserContext): Promise<void> {
  await context.clearPermissions();
  // Clearing alone leaves Chromium at "prompt", which headless never answers. Deny explicitly
  // (Chromium only; WebKit/Firefox keep the cleared state). Raised by T-04.
  const browser = context.browser();
  if (browser && browser.browserType().name() === 'chromium') {
    const session = await browser.newBrowserCDPSession();
    await session.send('Browser.setPermission', {
      permission: { name: 'geolocation' },
      setting: 'denied',
    });
    await session.detach();
  }
}

/** Reads the current number of location reads (all three kinds) recorded on the page. */
export type GeoCallCount = () => Promise<number>;

interface GeoSpyWindow {
  __geoCalls?: number;
}

/**
 * Counts every way a page can read the location, in `window.__geoCalls` (via `addInitScript`, so it
 * applies to every document the page loads): `getCurrentPosition`, `watchPosition` and
 * `navigator.permissions.query({ name: 'geolocation' })`.
 * Call it **before** `page.goto`. Returns a function that reads the current count.
 */
export async function spyGeolocation(page: Page): Promise<GeoCallCount> {
  await page.addInitScript(() => {
    const spyWindow = window as unknown as GeoSpyWindow;
    spyWindow.__geoCalls = 0;
    const count = (): void => {
      spyWindow.__geoCalls = (spyWindow.__geoCalls ?? 0) + 1;
    };

    const geolocation = navigator.geolocation as Geolocation | undefined;
    if (geolocation) {
      const originalGet = geolocation.getCurrentPosition.bind(geolocation);
      geolocation.getCurrentPosition = (...args: Parameters<Geolocation['getCurrentPosition']>) => {
        count();
        originalGet(...args);
      };
      const originalWatch = geolocation.watchPosition.bind(geolocation);
      geolocation.watchPosition = (...args: Parameters<Geolocation['watchPosition']>) => {
        count();
        return originalWatch(...args);
      };
    }

    const permissions = navigator.permissions as Permissions | undefined;
    if (permissions) {
      const originalQuery = permissions.query.bind(permissions);
      permissions.query = (descriptor: PermissionDescriptor) => {
        if (descriptor.name === 'geolocation') {
          count();
        }
        return originalQuery(descriptor);
      };
    }
  });
  return () => page.evaluate(() => (window as unknown as GeoSpyWindow).__geoCalls ?? 0);
}
