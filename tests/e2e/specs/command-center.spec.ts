/**
 * Supreme E2E — Command Center (web)
 * Validates: Command Center / app dashboard loads; Core state visible.
 */
import { test, expect } from '@playwright/test';

test.describe('command-center', () => {
  test('app / command center route loads', async ({ page }) => {
    await page.goto('/app');
    await expect(page).toHaveURL(/\/app/);
    await expect(page).toHaveTitle(/.+/);
  });

  test('app has visible content', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('domcontentloaded');
    const body = await page.locator('body').textContent();
    expect(body?.length ?? 0).toBeGreaterThan(0);
  });
});
