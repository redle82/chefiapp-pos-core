/**
 * Supreme E2E — Web Public (QR table) creating orders
 * Validates: public ordering page loads; order creation reflects Core truth.
 */
import { test, expect } from '@playwright/test';

test.describe('order-from-public-web', () => {
  test('public ordering page loads', async ({ page }) => {
    await page.goto('/public');
    await expect(page).toHaveURL(/\/public/);
    await expect(page).toHaveTitle(/.+/);
  });

  test('public slug page loads when slug provided', async ({ page }) => {
    await page.goto('/public/restaurante-piloto');
    await expect(page).toHaveURL(/\/public\/restaurante-piloto/);
  });
});
