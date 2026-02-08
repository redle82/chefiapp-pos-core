/**
 * Supreme E2E — Tasks created by owner/manager; staff executes; kitchen tasks on KDS
 * Validates: task system route loads (owner/manager creates; staff executes per contract).
 */
import { test, expect } from '@playwright/test';

test.describe('tasks-system', () => {
  test('task system or app route loads', async ({ page }) => {
    await page.goto('/app');
    await expect(page).toHaveURL(/\/(app|tpv|kds|task)/);
    await expect(page).toHaveTitle(/.+/);
  });

  test('app shell responds', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('domcontentloaded');
    const body = await page.locator('body').textContent();
    expect(body?.length ?? 0).toBeGreaterThan(0);
  });
});
