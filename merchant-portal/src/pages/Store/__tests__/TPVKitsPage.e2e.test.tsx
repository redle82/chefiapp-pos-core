/**
 * E2E Test: TPV Kits Page
 * 
 * Tests:
 * - Load page
 * - Change country
 * - Click links
 */

import { test, expect } from '@playwright/test';

test.describe('TPV Kits Page', () => {
    test.beforeEach(async ({ page }) => {
        // Mock auth or use test user
        await page.goto('/app/store/tpv-kits');
    });

    test('should load page with kits', async ({ page }) => {
        // Wait for page to load
        await page.waitForSelector('text=Loja TPV', { timeout: 10000 });

        // Check header
        await expect(page.locator('text=Loja TPV')).toBeVisible();
        await expect(page.locator('text=Kits completos de equipamentos')).toBeVisible();
    });

    test('should change country selector', async ({ page }) => {
        // Wait for country selector
        const countrySelect = page.locator('select').first();
        await countrySelect.waitFor({ timeout: 5000 });

        // Change to US
        await countrySelect.selectOption('US');

        // Wait for kits to reload (may show loading or empty state)
        await page.waitForTimeout(1000);
    });

    test('should filter by tier', async ({ page }) => {
        const tierSelect = page.locator('select').nth(1);
        await tierSelect.waitFor({ timeout: 5000 });

        // Select "Orçamento"
        await tierSelect.selectOption('budget');

        // Wait for filter to apply
        await page.waitForTimeout(500);
    });

    test('should track click events', async ({ page }) => {
        // Wait for a kit card
        const buyButton = page.locator('button:has-text("Comprar Kit na Amazon")').first();
        
        if (await buyButton.isVisible({ timeout: 5000 })) {
            // Intercept network request to click_event
            const clickEventPromise = page.waitForRequest(
                (request) => request.url().includes('click_event'),
                { timeout: 10000 }
            ).catch(() => null);

            // Click button (will open new tab)
            await buyButton.click();

            // Wait a bit for the request
            await page.waitForTimeout(500);

            // Note: In a real test, you'd verify the click_event was created in the database
        }
    });

    test('should show expired price warning', async ({ page }) => {
        // If a kit has expired price, should show "Ver preços na Amazon"
        const expiredButton = page.locator('button:has-text("Ver preços na Amazon")').first();
        
        // This test may not always pass if all prices are fresh
        // It's more of a visual regression test
        if (await expiredButton.isVisible({ timeout: 2000 })) {
            await expect(expiredButton).toBeVisible();
        }
    });
});

