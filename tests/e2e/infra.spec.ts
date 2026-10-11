import { expect, test } from '@playwright/test';

test('E2E-INFRA-01 app shell loads in Hebrew RTL with a visible h1', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'he');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('h1')).toBeVisible();
});
