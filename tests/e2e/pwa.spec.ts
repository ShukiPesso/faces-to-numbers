import { expect, test } from '@playwright/test';

/** Installability (E2E-PWA-01). Service workers only run in the Chromium projects (@sw). */

interface ManifestIcon {
  src?: unknown;
  sizes?: unknown;
  purpose?: unknown;
}

function iconSizes(icon: ManifestIcon): string[] {
  return typeof icon.sizes === 'string' ? icon.sizes.split(/\s+/) : [];
}

test.describe('pwa', () => {
  test('E2E-PWA-01 the manifest makes the tour installable and a worker is registered @sw', async ({
    page,
    request,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome', 'E2E-PWA-01 runs on mobile-chrome only');

    await page.goto('/');

    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveCount(1);
    const manifestUrl = await manifestLink.evaluate((link) => (link as HTMLLinkElement).href);
    expect(manifestUrl, 'manifest href').not.toBe('');

    const response = await request.get(manifestUrl);
    expect(response.ok(), `GET ${manifestUrl} → ${String(response.status())}`).toBe(true);
    const manifest = (await response.json()) as Record<string, unknown>;

    expect(typeof manifest.name === 'string' && manifest.name.trim().length > 0, 'name').toBe(true);
    expect(
      typeof manifest.short_name === 'string' && manifest.short_name.trim().length > 0,
      'short_name',
    ).toBe(true);
    expect(manifest.lang).toBe('he');
    expect(manifest.dir).toBe('rtl');
    expect(manifest.display).toBe('standalone');
    expect(
      typeof manifest.start_url === 'string' && manifest.start_url.length > 0,
      'start_url',
    ).toBe(true);

    expect(Array.isArray(manifest.icons), 'icons is an array').toBe(true);
    const icons = (Array.isArray(manifest.icons) ? manifest.icons : []) as ManifestIcon[];
    const sizes = icons.flatMap(iconSizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
    const maskable = icons.filter(
      (icon) => typeof icon.purpose === 'string' && icon.purpose.split(/\s+/).includes('maskable'),
    );
    expect(maskable.length, 'one icon with purpose "maskable"').toBeGreaterThan(0);

    // Every icon the manifest names is actually served.
    for (const icon of icons) {
      expect(typeof icon.src, 'icon src').toBe('string');
      const iconUrl = new URL(String(icon.src), manifestUrl).href;
      const iconResponse = await request.get(iconUrl);
      expect(iconResponse.ok(), `GET ${iconUrl} → ${String(iconResponse.status())}`).toBe(true);
    }

    await expect
      .poll(
        () =>
          page.evaluate(
            async () => (await navigator.serviceWorker.getRegistration()) !== undefined,
          ),
        { message: 'a service worker registration exists' },
      )
      .toBe(true);
  });
});
