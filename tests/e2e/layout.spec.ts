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

/**
 * Hides every element that is currently `position: fixed` (BottomNav, the station sticky bar,
 * the offline panel, the update prompt) with `visibility: hidden`: a style rule for the two
 * late-appearing panels plus a pass over everything fixed at capture time. Layout is untouched, so the
 * page keeps its real size; only the paint of the overlays is removed, which stops them from
 * covering content in full-page captures. Elements that are static at a size (the sticky bar
 * from lg) are left visible so they stay protected by the baseline.
 */
async function hideFixedElements(page: Page): Promise<void> {
  // The offline "saved" panel and the update prompt appear late (after the service worker is
  // ready), so a one-off pass could miss them: hide them by selector for the whole page life.
  await page.addStyleTag({
    content:
      '[data-testid="offline-indicator"], [data-testid="update-prompt"] { visibility: hidden !important; }',
  });
  await page.evaluate(() => {
    for (const el of Array.from(document.body.querySelectorAll<HTMLElement>('*'))) {
      if (getComputedStyle(el).position === 'fixed') {
        el.style.setProperty('visibility', 'hidden', 'important');
      }
    }
  });
}

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
      await hideFixedElements(page);
      await expect(page).toHaveScreenshot(`${name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
        animations: 'disabled',
        mask: [page.locator('[data-volatile]')],
      });
    });
  }

  test('E2E-LAYOUT-04 header', async ({ page }, testInfo) => {
    test.skip(
      !SCREENSHOT_PROJECTS.includes(testInfo.project.name),
      'visual baselines are Chromium-only (orchestrator decision, T-07)',
    );
    await open(page, '/');
    await hideFixedElements(page);
    // Tight threshold: the brand mark is a small part of the page, so a page-level 1% ratio
    // would let it disappear unnoticed (D-09 finding 4).
    await expect(page.locator('header').first()).toHaveScreenshot('header.png', {
      maxDiffPixelRatio: 0.001,
      animations: 'disabled',
    });
  });
});
