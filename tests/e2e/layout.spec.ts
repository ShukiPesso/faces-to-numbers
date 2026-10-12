import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { expectNoHorizontalOverflow, expectTapTargets } from './helpers/layout';
import { allRoutes } from './helpers/routes';

const ROUTES = allRoutes();
const SCREENSHOT_PROJECTS = ['mobile-chrome', 'desktop'];
const DESKTOP_PROJECTS = ['desktop'];

/** The app uses hash routing: router path `/tour` is served at `/#/tour`. */
async function open(page: Page, route: string): Promise<void> {
  await page.goto(`/#${route}`);
  await expect(page.locator('h1').first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

test.describe('E2E-LAYOUT-01 no horizontal overflow', () => {
  for (const route of ROUTES) {
    test(`E2E-LAYOUT-01 ${route}`, async ({ page }) => {
      await open(page, route);
      await expectNoHorizontalOverflow(page);
    });
  }
});

test.describe('E2E-LAYOUT-02 tap targets', () => {
  for (const route of ROUTES) {
    test(`E2E-LAYOUT-02 ${route}`, async ({ page }) => {
      await open(page, route);
      await expectTapTargets(page, 44);
    });
  }
});

test('E2E-LAYOUT-03 html is he/rtl and the right navigation shows per size', async ({
  page,
}, testInfo) => {
  await open(page, '/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'he');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

  const bottomNav = page.getByTestId('bottom-nav');
  const sideNav = page.getByTestId('side-nav');
  if (DESKTOP_PROJECTS.includes(testInfo.project.name)) {
    await expect(sideNav).toBeVisible();
    await expect(bottomNav).toBeHidden();
  } else {
    await expect(bottomNav).toBeVisible();
    await expect(sideNav).toBeHidden();
  }
});

test.describe('E2E-LAYOUT-04 visual baselines', () => {
  const firstStation = ROUTES.find((r) => r.startsWith('/station/'));
  const firstPerson = ROUTES.find((r) => r.startsWith('/person/'));
  const pages: ReadonlyArray<readonly [string, string | undefined]> = [
    ['home', '/'],
    ['tour', '/tour'],
    ['station', firstStation],
    ['person', firstPerson],
  ];

  for (const [name, route] of pages) {
    test(`E2E-LAYOUT-04 ${name}`, async ({ page }, testInfo) => {
      test.skip(
        !SCREENSHOT_PROJECTS.includes(testInfo.project.name),
        'visual baselines are Chromium-only (orchestrator decision, T-07)',
      );
      expect(route, `no ${name} route found in content data`).toBeDefined();
      await open(page, route ?? '/');
      await expect(page).toHaveScreenshot(`${name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
        animations: 'disabled',
        mask: [page.locator('[data-volatile]')],
      });
    });
  }
});
