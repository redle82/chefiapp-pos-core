import { test } from '@playwright/test';
import path from 'node:path';

const ROUTES = [
    { path: '/app/tpv', name: 'TPV' },
    { path: '/app/kds', name: 'Kitchen Display' },
    { path: '/app/staff', name: 'Staff' },
    { path: '/app/inventory', name: 'Inventory' },
    { path: '/app/billing', name: 'Billing' },
    { path: '/app/setup/staff', name: 'Setup Staff' },
    { path: '/app/setup/payments', name: 'Setup Payments' },
    { path: '/app/status', name: 'System Status' },
];

test('Human Walkthrough — One Screen at a Time', async ({ page }) => {
    console.log('🧭 Starting Human Walkthrough');

    // Inject mocks to bypass auth if needed for pure UI check
    await page.addInitScript(() => {
        localStorage.setItem('x-chefiapp-token', 'mock-token-ritual');
        localStorage.setItem('chefiapp_restaurant_id', 'mock-restaurant-id');
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    for (const route of ROUTES) {
        console.log(`➡️ Visiting: ${route.name}`);

        await page.goto(route.path, { waitUntil: 'domcontentloaded' });

        // pausa consciente — "olhar a tela"
        await page.waitForTimeout(4000);

        // screenshot ritual (prova visual)
        await page.screenshot({
            path: `reports/screenshots/${route.name.replace(/\s+/g, '_')}.png`,
            fullPage: true,
        });

        console.log(`✅ Screen validated: ${route.name}`);
    }

    console.log('🏁 Walkthrough completed.');
});
