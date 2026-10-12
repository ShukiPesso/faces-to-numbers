import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { allRoutes } from './helpers/routes';

const READ_ALOUD_MIN_PX = 22;

/** Font size (px) of the main body paragraph: the longest visible paragraph inside <main>. */
async function bodyParagraphFontSize(page: Page): Promise<number> {
  return page.evaluate(() => {
    let best: HTMLElement | null = null;
    for (const p of Array.from(document.querySelectorAll<HTMLElement>('main p'))) {
      const rect = p.getBoundingClientRect();
      if (rect.width <= 1 || rect.height <= 1) continue;
      if (!best || p.innerText.length > best.innerText.length) best = p;
    }
    return best ? parseFloat(getComputedStyle(best).fontSize) : 0;
  });
}

test('E2E-READ-01 read-aloud enlarges body text and persists after reload', async ({ page }) => {
  await page.goto('/#/about');
  await expect(page.locator('h1')).toBeVisible();
  const toggle = page.getByTestId('read-aloud-toggle');

  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  expect(await bodyParagraphFontSize(page)).toBeLessThan(READ_ALOUD_MIN_PX);

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  expect(await bodyParagraphFontSize(page)).toBeGreaterThanOrEqual(READ_ALOUD_MIN_PX);

  await page.reload();
  await expect(page.getByTestId('read-aloud-toggle')).toHaveAttribute('aria-pressed', 'true');
  expect(await bodyParagraphFontSize(page)).toBeGreaterThanOrEqual(READ_ALOUD_MIN_PX);

  await page.getByTestId('read-aloud-toggle').click();
  await expect(page.getByTestId('read-aloud-toggle')).toHaveAttribute('aria-pressed', 'false');
  expect(await bodyParagraphFontSize(page)).toBeLessThan(READ_ALOUD_MIN_PX);
});

const shareRoute = allRoutes().find((route) => route.startsWith('/station/')) ?? '/';

test.describe('E2E-SHARE-01', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'mobile-chrome',
      'task scope: share is verified on mobile-chrome only',
    );
  });

  test('navigator.share is called with the current URL', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __shared?: { url?: string }[] };
      w.__shared = [];
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: (data: { url?: string }) => {
          w.__shared?.push(data);
          return Promise.resolve();
        },
      });
    });
    await page.goto(`/#${shareRoute}`);
    await page.getByTestId('share-button').click();
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as unknown as { __shared?: { url?: string }[] }).__shared?.[0]?.url,
        ),
      )
      .toBe(page.url());
  });

  test('without navigator.share the link is copied and "copied" is shown', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    });
    await page.goto(`/#${shareRoute}`);
    await page.getByTestId('share-button').click();
    await expect(page.getByRole('status').filter({ hasText: 'הקישור הועתק' })).toBeVisible();
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toBe(page.url());
  });
});
