import { Page, expect } from '@playwright/test';

/**
 * Bootstrap Guard
 * 
 * Verifies if the system is healthy enough to run tests.
 * Returns TRUE if healthy, FALSE if blocked.
 * 
 * Logic:
 * 1. Go to /app/bootstrap
 * 2. Wait for redirect OR "Demo Mode" button
 * 3. Fail fast if neither happens in 15s
 */
export async function verifySystemHealth(page: Page): Promise<boolean> {
    console.log('🛡️ [Guard] Verifying system health...');

    try {
        await page.goto('/app/bootstrap', { timeout: 15000, waitUntil: 'domcontentloaded' });

        // Case A: Diverted to start (Good)
        if (page.url().includes('/start')) return true;
        if (page.url().includes('/app/auth')) return true;
        if (page.url().includes('/app/preview')) return true;

        // Case B: Stuck on Bootstrap page -> Check for Demo Mode button (S0 Fix)
        const demoBtn = page.getByText('Entrar em Modo Demo', { exact: false });
        if (await demoBtn.isVisible()) {
            console.log('🛡️ [Guard] System in Demo Mode fallback. Accepting as healthy.');
            return true;
        }

        // Case C: Spinning forever?
        await page.waitForTimeout(2000);
        // Double check URL after wait
        if (page.url().includes('/start') || page.url().includes('/app/preview')) return true;

        console.error('🛡️ [Guard] FAILED: System stuck on bootstrap without fallback.');
        return false;

    } catch (err) {
        console.error('🛡️ [Guard] CRITICAL ERROR:', err);
        return false;
    }
}
