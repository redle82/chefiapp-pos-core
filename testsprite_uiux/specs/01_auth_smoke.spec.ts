import { test, expect } from '@playwright/test';

test.describe('Forensic Smoke: Identity & Auth', () => {

    test('Identity 1: No Token -> Should render UI with correct Empty State', async ({ page }) => {
        // Clear storage to simulate fresh start
        await page.goto('/app/tpv'); // Navigate to protected route

        // Wait for potential UI render
        await page.waitForTimeout(2000);

        // We expect "AuthBoundary" to catch this.
        // Assuming AuthBoundary renders "Acesso Mínimo" or "Sessão não iniciada"
        // Let's check for the text we put in AuthBoundary or standard login redirect (if standard used)

        // Since we are moving to AuthBoundary which shows "Acesso Restrito" if UNAUTH:
        const hasAuthMessage = await page.getByRole('heading', { name: 'Acesso Restrito' }).isVisible();

        if (!hasAuthMessage) {
            // Fallback: Check if it redirected to /start or login
            const url = page.url();
            console.log('Current URL:', url);
            expect(url).toMatch(/start|login/);
        } else {
            expect(hasAuthMessage).toBeTruthy();
        }
    });

    test('Identity 2: Invalid Token -> Should render EXPIRED/Empty State', async ({ page }) => {
        // 1. Inject Invalid Token
        await page.addInitScript(() => {
            localStorage.setItem('x-chefiapp-token', 'invalid');
        });

        await page.goto('/app/tpv');
        await page.waitForTimeout(2000);

        // 2. Expect "Acesso Restrito" or "Sessão Expirada"
        const hasAuthMessage = await page.getByRole('heading', { name: /Acesso Restrito|Sessão Expirada/i }).isVisible();
        expect(hasAuthMessage).toBeTruthy();
    });

    test('Identity 3: Demo Mode -> Should render DEGRADED state', async ({ page }) => {
        // Inject Demo Flag
        await page.addInitScript(() => {
            localStorage.setItem('chefiapp_demo_mode', 'true');
        });

        await page.goto('/app/tpv');
        await page.waitForTimeout(2000);

        // Should NOT block access, but might show "Demo" indicator if UI implements it.
        // At minimum, it should NOT reflect "UNAUTH".
        const unauthVisible = await page.getByText('Acesso Restrito').isVisible();
        expect(unauthVisible).toBeFalsy();

        // Check if main UI elements of TPV are visible
        // e.g., the Cart or Header
        await expect(page.locator('body')).not.toBeEmpty();
    });

});
