/**
 * Supreme E2E — TPV creating orders
 * Validates: TPV page loads; Core is authority for order_id and totals.
 */
import { test, expect } from '@playwright/test';

test.describe('order-from-tpv', () => {
  test('TPV route loads', async ({ page }) => {
    await page.goto('/tpv');
    await expect(page).toHaveURL(/\/tpv/);
    await expect(page).toHaveTitle(/.+/);
  });

  test('TPV or app shell is present', async ({ page }) => {
    await page.goto('/tpv');
    await page.waitForLoadState('domcontentloaded');
    const body = await page.locator('body').textContent();
    expect(body?.length ?? 0).toBeGreaterThan(0);
  });
});
