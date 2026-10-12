import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { expectNoSeriousA11yViolations } from './helpers/a11y';
import { allRoutes } from './helpers/routes';

const PEOPLE_DIR = fileURLToPath(new URL('../../src/content/data/people', import.meta.url));

interface PersonMeta {
  id: string;
  sensitivity: string;
}

function readPeople(): PersonMeta[] {
  return readdirSync(PEOPLE_DIR)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => {
      const raw = JSON.parse(readFileSync(join(PEOPLE_DIR, name), 'utf8')) as Record<
        string,
        unknown
      >;
      return { id: String(raw.id), sensitivity: String(raw.oct7Sensitivity) };
    });
}

const PEOPLE = readPeople();
const GRAPHIC_PERSON = PEOPLE.find((p) => p.sensitivity === 'graphic');
const STANDARD_PERSON = PEOPLE.find((p) => p.sensitivity === 'standard');

async function open(page: Page, route: string): Promise<void> {
  await page.goto(`/#${route}`);
  await expect(page.locator('main h1, h1').first()).toBeVisible();
}

test.describe('E2E-A11Y-01 axe: zero serious/critical violations', () => {
  for (const route of allRoutes()) {
    test(`route ${route}`, async ({ page }) => {
      await open(page, route);
      await expectNoSeriousA11yViolations(page);
    });
  }

  test('person page with the graphic content gate opened', async ({ page }) => {
    expect(GRAPHIC_PERSON, 'a person with oct7Sensitivity graphic exists').toBeDefined();
    await open(page, `/person/${GRAPHIC_PERSON?.id ?? ''}`);
    await expectNoSeriousA11yViolations(page); // gate closed
    await page.getByTestId('warning-show').click();
    await expect(page.getByTestId('warning-gate')).toHaveCount(0);
    await expectNoSeriousA11yViolations(page);
  });

  test('read-aloud mode on', async ({ page }) => {
    await open(page, '/');
    const toggle = page.getByTestId('read-aloud-toggle');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expectNoSeriousA11yViolations(page);
    await open(page, `/person/${(STANDARD_PERSON ?? PEOPLE[0])?.id ?? ''}`);
    await expectNoSeriousA11yViolations(page);
  });
});

async function expectFocusVisible(page: Page, label: string): Promise<void> {
  const info = await page.evaluate(() => {
    const el = document.activeElement;
    if (el === null || el === document.body) return null;
    const s = getComputedStyle(el);
    return {
      tag: el.tagName.toLowerCase(),
      testid: el.getAttribute('data-testid') ?? '',
      outlineStyle: s.outlineStyle,
      outlineWidth: parseFloat(s.outlineWidth),
      boxShadow: s.boxShadow,
    };
  });
  expect(info, `${label}: something is focused`).not.toBeNull();
  const hasOutline = info?.outlineStyle !== 'none' && (info?.outlineWidth ?? 0) > 0;
  const hasShadow = info?.boxShadow !== undefined && info.boxShadow !== 'none';
  expect(
    hasOutline || hasShadow,
    `${label}: focused <${info?.tag ?? '?'} data-testid="${info?.testid ?? ''}"> has no visible focus indicator (outline-style=${info?.outlineStyle ?? '?'}, width=${String(info?.outlineWidth)}, box-shadow=${info?.boxShadow ?? '?'})`,
  ).toBe(true);
}

test.describe('E2E-A11Y-02 keyboard walk', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'desktop only (Testing Strategy §E2E-A11Y-02)');
  });

  test('skip link is first Tab stop and moves focus to main', async ({ page }) => {
    await open(page, '/');
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('skip-link')).toBeFocused();
    await expectFocusVisible(page, 'skip link');
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();
  });

  test('person page: depth tabs reachable, ArrowLeft selects next tab, focus always visible', async ({
    page,
  }) => {
    const person = STANDARD_PERSON ?? PEOPLE[0];
    expect(person, 'a person exists').toBeDefined();
    await open(page, `/person/${person?.id ?? ''}`);

    const tabs = page.getByTestId('depth-tabs');
    await expect(tabs).toBeVisible();

    let reached = false;
    for (let i = 0; i < 60 && !reached; i += 1) {
      await page.keyboard.press('Tab');
      await expectFocusVisible(page, `Tab stop ${String(i + 1)}`);
      reached = await tabs.evaluate((el) => el.contains(document.activeElement));
    }
    expect(reached, 'Tab reaches the depth tabs').toBe(true);

    const selected = tabs.locator('[role="tab"][aria-selected="true"]');
    const before = await selected.getAttribute('id');
    await page.keyboard.press('ArrowLeft');
    await expect(selected).not.toHaveAttribute('id', before ?? '');
    await expect(selected).toBeFocused();
    await expectFocusVisible(page, 'depth tab after ArrowLeft');

    const afterLeft = await selected.getAttribute('id');
    await page.keyboard.press('ArrowRight');
    await expect(selected).not.toHaveAttribute('id', afterLeft ?? '');
    await expect(selected).toHaveAttribute('id', before ?? '');
  });
});
