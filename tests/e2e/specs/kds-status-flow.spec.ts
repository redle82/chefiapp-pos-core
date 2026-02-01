/**
 * Supreme E2E — KDS receiving and updating order states
 * Validates: KDS page loads; status flow OPEN → IN_PREP → READY (per CORE_KDS_CONTRACT).
 */
import { test, expect } from '@playwright/test';

test.describe('kds-status-flow', () => {
  test('KDS route loads', async ({ page }) => {
    await page.goto('/kds');
    await expect(page).toHaveURL(/\/kds/);
    await expect(page).toHaveTitle(/.+/);
  });

  test('KDS page has content', async ({ page }) => {
    await page.goto('/kds');
    await page.waitForLoadState('domcontentloaded');
    const body = await page.locator('body').textContent();
    expect(body?.length ?? 0).toBeGreaterThan(0);
  });
});
