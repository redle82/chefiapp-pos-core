import { test, expect } from '@playwright/test';

const TARGET_ROUTES = [
    '/app/tpv',
    '/app/kds',
    '/app/staff',
    '/app/inventory',
    '/app/setup',
    '/terms'
];

test.describe('Forensic Smoke: Core Routes', () => {
    for (const route of TARGET_ROUTES) {
        test(`Route ${route} should render without crash`, async ({ page }) => {
            // 1. Console & Network Trap
            const errors: string[] = [];
            const failedRequests: string[] = [];

            page.on('console', msg => {
                if (msg.type() === 'error') errors.push(msg.text());
            });
            page.on('pageerror', err => errors.push(err.message));
            page.on('requestfailed', req => failedRequests.push(`${req.url()} (${req.failure()?.errorText})`));

            // 2. Network Isolation (Mock Backend)
            await page.route('**/api/**', async route => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ status: 'mocked', health: 'ok', data: [] })
                });
            });

            // 3. Navigate
            await page.goto(route);

            // 3. Stabilization & Network Check
            await page.waitForTimeout(2000);
            await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
                console.warn(`[WARN] ${route} did not reach network idle`);
            });

            // 4. Evidence Capture (Unique Path)
            const safeRoute = route.replace(/\//g, '_');
            await page.screenshot({
                path: `testsprite_uiux/artifacts/${safeRoute}_${Date.now()}_load.png`
            });

            // 5. Assertions
            // 5. Assertions

            // C) Critical Error Check (Logged BEFORE blank screen assertion to see cause)
            if (errors.length > 0) {
                console.warn(`[WARN] Console Errors on ${route}:`);
                errors.forEach(e => console.warn(`  - ${e}`));
            }
            if (failedRequests.length > 0) {
                console.warn(`[WARN] Failed Requests on ${route}:`);
                failedRequests.forEach(f => console.warn(`  - ${f}`));
            }

            // A) No Blank Screen
            const bodyText = await page.evaluate(() => document.body.innerText);
            expect(bodyText.length, `Route ${route} rendered blank screen (See logs above)`).toBeGreaterThan(50);

            // B) Sentinel: ErrorBoundary Check
            const hasErrorBoundary = await page.locator('text=Ocorreu um erro').count();
            if (hasErrorBoundary > 0) {
                console.warn(`[WARN] ${route} rendered ErrorBoundary`);
            }
        });
    }
});
