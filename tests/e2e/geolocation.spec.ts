import { expect, test } from '@playwright/test';
import { he } from '../../src/i18n/he';
import { allRoutes } from './helpers/routes';
import { denyGeo, FIXTURE_POINTS, grantGeo, spyGeolocation } from './helpers/geo';

/** Fills the `{name}` placeholders of a strings-contract template. */
function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => values[name] ?? match);
}

const TITLE_A = 'תחנת בדיקה א';
const TITLE_B = 'תחנת בדיקה ב';

const FIXTURE_ROUTES = [
  '/',
  '/tour',
  '/station/test-a',
  '/station/test-b',
  '/station/test-c',
  '/person/test-person-1',
  '/person/test-person-2',
  '/person/test-person-3',
  '/about',
  '/sources',
] as const;

test('E2E-GEO-01 at station A shows the "at" banner and a link to it @fixture', async ({
  page,
  context,
}) => {
  await grantGeo(context, FIXTURE_POINTS.atA);
  await page.goto('/#/tour');
  await page.getByTestId('where-am-i').click();

  const banner = page.getByTestId('nearby-banner');
  await expect(banner).toContainText(fill(he['nearby.at'], { title: TITLE_A }));
  await banner.getByRole('link', { name: he['nearby.open'] }).click();
  await expect(page).toHaveURL(/#\/station\/test-a$/);
});

test('E2E-GEO-02 near station B shows the "near" banner with a distance @fixture', async ({
  page,
  context,
}) => {
  await grantGeo(context, FIXTURE_POINTS.nearB);
  await page.goto('/#/tour');
  await page.getByTestId('where-am-i').click();

  const banner = page.getByTestId('nearby-banner');
  const [before] = he['nearby.near'].split('{title}');
  await expect(banner).toContainText(before + TITLE_B);
  await expect(banner).toContainText(/\d+(\.\d+)?\s*(מטר|ק״מ)/);
  await expect(banner).not.toContainText(TITLE_A);
});

test('E2E-GEO-03 far from every station shows the "none" message @fixture', async ({
  page,
  context,
}) => {
  await grantGeo(context, FIXTURE_POINTS.far);
  await page.goto('/#/tour');
  await page.getByTestId('where-am-i').click();

  await expect(page.getByTestId('nearby-banner')).toContainText(he['nearby.none']);
});

test('E2E-GEO-04 denied permission shows the denied message and the list stays usable @fixture', async ({
  page,
  context,
}) => {
  await denyGeo(context);
  // clearPermissions() alone leaves the state at "prompt", which a headless browser never answers
  // (the request would hang until the app's own timeout). Mark it explicitly as denied, which is
  // what a visitor tapping "Block" produces.
  await page.goto('about:blank');
  const pageSession = await context.newCDPSession(page);
  const { targetInfo } = await pageSession.send('Target.getTargetInfo');
  const browserSession = await context.browser()?.newBrowserCDPSession();
  await browserSession?.send('Browser.setPermission', {
    permission: { name: 'geolocation' },
    setting: 'denied',
    browserContextId: targetInfo.browserContextId,
  });
  await page.goto('/#/tour');
  await page.getByTestId('where-am-i').click();

  await expect(page.getByTestId('nearby-banner')).toContainText(he['nearby.denied']);

  const card = page.getByTestId('station-card-test-a');
  await expect(card).toBeVisible();
  await card.click();
  await expect(page).toHaveURL(/#\/station\/test-a$/);
});

test('E2E-GEO-05 no route reads the location on load @fixture', async ({ page, context }) => {
  await grantGeo(context, FIXTURE_POINTS.atA);
  const calls = await spyGeolocation(page);

  for (const route of FIXTURE_ROUTES) {
    await page.goto(`/#${route}`);
    await expect(page.locator('h1').first()).toBeVisible();
    expect(
      await calls(),
      `location reads (getCurrentPosition/watchPosition/permissions.query) on ${route}`,
    ).toBe(0);
  }
});

test('E2E-GEO-05 no REAL route reads the location before any press (mobile-chrome)', async ({
  page,
  context,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chrome', 'real routes: mobile-chrome only');
  await grantGeo(context, FIXTURE_POINTS.atA);
  const calls = await spyGeolocation(page);

  const routes = allRoutes();
  expect(routes.length, 'routes come from the real content').toBeGreaterThan(4);
  for (const route of routes) {
    await page.goto(`/#${route}`);
    await expect(page.locator('h1').first()).toBeVisible();
    expect(
      await calls(),
      `location reads (getCurrentPosition/watchPosition/permissions.query) on ${route}`,
    ).toBe(0);
  }
});

test('E2E-LINK-01 navigation links use the exact verified coordinates @fixture', async ({
  page,
}) => {
  await page.goto('/#/station/test-a');
  await expect(page.getByTestId('nav-waze')).toHaveAttribute(
    'href',
    'https://waze.com/ul?ll=31.400000,34.500000&navigate=yes',
  );
  await expect(page.getByTestId('nav-google')).toHaveAttribute(
    'href',
    'https://www.google.com/maps/dir/?api=1&destination=31.400000,34.500000',
  );
  await expect(page.getByTestId('nav-apple')).toHaveAttribute(
    'href',
    'https://maps.apple.com/?daddr=31.400000,34.500000&dirflg=d',
  );

  await page.goto('/#/station/test-c');
  await expect(page.getByTestId('location-unverified')).toBeVisible();
  await expect(page.getByTestId('nav-waze')).toHaveCount(0);
  await expect(page.getByTestId('nav-google')).toHaveCount(0);
  await expect(page.getByTestId('nav-apple')).toHaveCount(0);
});
