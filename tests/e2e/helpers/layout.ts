import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/** Asserts the page does not scroll horizontally (Conventions §6). */
export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(
    scrollWidth,
    `horizontal overflow: scrollWidth ${scrollWidth}px > clientWidth ${clientWidth}px`,
  ).toBeLessThanOrEqual(clientWidth);
}

/** A tap target that is smaller than the required minimum. */
export interface SmallTapTarget {
  readonly tag: string;
  readonly text: string;
  readonly width: number;
  readonly height: number;
}

const TAP_TARGET_SELECTOR = 'button, a, [role=tab], input, select';

/**
 * Asserts every visible `button`, `a`, `[role=tab]`, `input` and `select` is at least
 * `min` × `min` CSS px (Conventions §5). Elements inside `[data-inline-text]` (links in running
 * text) and visually-hidden (sr-only) elements are skipped. On failure, the message lists each offending element with its text.
 */
export async function expectTapTargets(page: Page, min = 44): Promise<void> {
  const offenders: SmallTapTarget[] = await page.evaluate(
    ({ selector, minSize }) => {
      const result: { tag: string; text: string; width: number; height: number }[] = [];
      for (const element of Array.from(document.querySelectorAll<HTMLElement>(selector))) {
        if (element.closest('[data-inline-text]')) {
          continue;
        }
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        // Visually-hidden (sr-only) elements, e.g. the skip link until focused, are not visible.
        const visuallyHidden =
          rect.width <= 1 ||
          rect.height <= 1 ||
          style.clip === 'rect(0px, 0px, 0px, 0px)' ||
          style.clipPath === 'inset(50%)';
        const visible =
          !visuallyHidden && style.visibility !== 'hidden' && style.display !== 'none';
        if (!visible) {
          continue;
        }
        if (rect.width < minSize || rect.height < minSize) {
          const label =
            element.innerText.trim() ||
            element.getAttribute('aria-label') ||
            element.getAttribute('title') ||
            element.getAttribute('name') ||
            '';
          result.push({
            tag: element.tagName.toLowerCase(),
            text: label.replace(/\s+/g, ' ').slice(0, 80),
            width: Math.round(rect.width * 10) / 10,
            height: Math.round(rect.height * 10) / 10,
          });
        }
      }
      return result;
    },
    { selector: TAP_TARGET_SELECTOR, minSize: min },
  );
  const report = offenders
    .map((o) => `<${o.tag}> "${o.text}" ${o.width}×${o.height}px`)
    .join('\n  ');
  expect(offenders, `tap targets smaller than ${min}×${min}px:\n  ${report}`).toEqual([]);
}
