import { test, expect } from '@playwright/test';

// Phase G: Hardened Smoke Test
// Uses data-testid for robustness.
// Follows TPV "Quick Order" Flow.

test('Order Pulse 1: Create Order via TPV (Quick Flow)', async ({ page }) => {
    // 1. Setup: Auth & Restaurant
    await page.addInitScript(() => {
        localStorage.setItem('x-chefiapp-token', 'mock-token-f3');
        localStorage.setItem('chefiapp_auth_method', 'email');
        localStorage.setItem('chefiapp_user_email', 'tester@chefiapp.com');
        localStorage.setItem('chefiapp_restaurant_id', 'mock-restaurant-id');
        localStorage.setItem('chefiapp_demo_mode', 'true');
    });

    await page.goto('/app/tpv');

    // 2. Verify Page Load
    await expect(page.getByTestId('tpv-root')).toBeVisible({ timeout: 10000 });

    // 3. Create Quick Order
    // This is the "Counter Mode" flow where you just punch an order.
    await page.getByTestId('tpv-new-order-btn').click();

    // 4. Verify Order Created (Optimistic UI)
    // Should appear in "New" column
    const newCol = page.getByTestId('col-new');
    await expect(newCol.getByTestId('order-card')).toBeVisible();

    // 5. Send to Kitchen
    // Only "New" orders have the "Send" button
    const orderCard = newCol.getByTestId('order-card').first();
    const sendBtn = orderCard.getByTestId('order-action-send');
    await expect(sendBtn).toBeVisible();
    await sendBtn.click();

    // 6. Verify Move to Preparing (KDS Logic)
    // Should disappear from New and appear in Preparing
    await expect(newCol.getByTestId('order-card')).toHaveCount(0);

    const prepCol = page.getByTestId('col-preparing');
    await expect(prepCol.getByTestId('order-card')).toBeVisible();

    // 7. Verify "Ready" Action available
    await expect(prepCol.getByTestId('order-action-ready')).toBeVisible();
});
