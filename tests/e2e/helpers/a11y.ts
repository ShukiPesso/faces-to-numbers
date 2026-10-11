import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const BLOCKING_IMPACTS: ReadonlySet<string> = new Set(['serious', 'critical']);

/** Runs axe on the current page and fails on any `serious` or `critical` violation. */
export async function expectNoSeriousA11yViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations
    .filter((violation) => violation.impact != null && BLOCKING_IMPACTS.has(violation.impact))
    .map((violation) => {
      const targets = violation.nodes.map((node) => JSON.stringify(node.target)).join(', ');
      return `${violation.id} (${violation.impact ?? 'unknown'}): ${targets}`;
    });
  expect(blocking, `serious/critical axe violations:\n  ${blocking.join('\n  ')}`).toEqual([]);
}
