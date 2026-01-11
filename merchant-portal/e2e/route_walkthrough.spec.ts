import { test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// Extracted from main.tsx
const ROUTES = [
    // Cinematic / Onboarding
    '/start/cinematic/summary',

    // Operational (The Sellable Core)
    '/app/tpv',
    '/app/kds',
    '/app/staff',
    '/app/inventory',
    '/app/billing',
    '/app/status',
    '/app/leaks',
    '/app/purchasing',
    '/app/audit',

    // Setup (Configuration)
    '/app/setup/staff',
    '/app/setup/billing',
    '/app/setup/payments',

    // Static
    '/terms',
    '/privacy'
];

function ensureDir(p: string) {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

test('Route Walkthrough (AntGravit)', async ({ page, browser }) => {
    const reportsDir = path.resolve(process.cwd(), 'reports');
    const shotsDir = path.join(reportsDir, 'screenshots');
    ensureDir(shotsDir);

    const log: Record<string, any>[] = [];
    const consoleEvents: any[] = [];
    const failedResponses: any[] = [];

    page.on('console', (msg) => {
        const type = msg.type();
        // Capture errors and warnings. 
        // Note: Some routine framework warnings might appear.
        if (type === 'error' || type === 'warning') {
            consoleEvents.push({
                type,
                text: msg.text(),
                location: msg.location(),
            });
        }
    });

    page.on('response', async (res) => {
        const status = res.status();
        if (status >= 400) {
            failedResponses.push({
                url: res.url(),
                status,
                statusText: res.statusText(),
            });
        }
    });

    // 1) abrir home / bootstrap to ensure app loads
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Inject mock token to bypass auth guards if needed, 
    // though the app might rely on internal logic.
    await page.addInitScript(() => {
        localStorage.setItem('x-chefiapp-token', 'mock-token-for-walkthrough');
        localStorage.setItem('chefiapp_restaurant_id', 'mock-restaurant-id');
    });

    // 2) Walkthrough desktop + mobile
    for (const route of ROUTES) {
        consoleEvents.length = 0;
        failedResponses.length = 0;

        const startedAt = Date.now();
        let ok = true;
        let err: any = null;

        try {
            await page.goto(route, { waitUntil: 'domcontentloaded' });
            // Wait for React to settle / animations / data mesh
            await page.waitForTimeout(2000);
        } catch (e) {
            ok = false;
            err = String(e);
        }

        const safeRoute = route.replace(/[\/:]/g, '_').replace(/^_/, '');
        const desktopShot = `desktop_${safeRoute}.png`;
        await page.screenshot({ path: path.join(shotsDir, desktopShot), fullPage: true });

        // Mobile pass
        const context = await browser.newContext({
            viewport: { width: 390, height: 844 },
            userAgent:
                'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        });
        const mPage = await context.newPage();

        // Inject auth for mobile context too
        await mPage.addInitScript(() => {
            localStorage.setItem('x-chefiapp-token', 'mock-token-for-walkthrough');
            localStorage.setItem('chefiapp_restaurant_id', 'mock-restaurant-id');
        });

        try {
            await mPage.goto(route, { waitUntil: 'domcontentloaded' });
            await mPage.waitForTimeout(2000);
        } catch { }
        const mobileShot = `mobile_${safeRoute}.png`;
        await mPage.screenshot({ path: path.join(shotsDir, mobileShot), fullPage: true });
        await context.close();

        const elapsedMs = Date.now() - startedAt;

        log.push({
            route,
            ok,
            elapsedMs,
            error: err,
            desktopShot: `screenshots/${desktopShot}`, // Relative for markdown
            mobileShot: `screenshots/${mobileShot}`,   // Relative for markdown
            console: [...consoleEvents],
            failedResponses: [...failedResponses],
            url: page.url(),
            title: await page.title().catch(() => ''),
        });
    }

    // 3) generate report
    const mdPath = path.join(reportsDir, 'route-walkthrough.md');
    const lines: string[] = [];
    lines.push(`# Route Walkthrough Report`);
    lines.push(`**Date:** ${new Date().toISOString()}`);
    lines.push(`**BaseURL:** ${process.env.E2E_BASE_URL || 'http://localhost:5173'}`);
    lines.push('');

    for (const r of log) {
        lines.push(`---`);
        lines.push(`## \`${r.route}\``); // Backticks for clarity
        lines.push(`- Status: ${r.ok ? '✅ OK' : '❌ FAIL'}`);
        lines.push(`- URL: \`${r.url}\``);
        lines.push(`- Title: ${r.title || '(no title)'}`);
        lines.push(`- Load time: ${r.elapsedMs}ms`);
        if (r.error) lines.push(`- Error: \`${r.error}\``);

        lines.push(`### Screenshots`);
        // Use relative paths for images in markdown
        lines.push(`| Desktop | Mobile |`);
        lines.push(`| --- | --- |`);
        lines.push(`| ![](${r.desktopShot}) | ![](${r.mobileShot}) |`);

        lines.push(`### Console`);
        if (r.console?.length) {
            for (const c of r.console) {
                lines.push(`- **${c.type}**: \`${c.text}\``);
            }
        } else {
            lines.push(`- (clean)`);
        }

        lines.push(`### Network Failures`);
        if (r.failedResponses?.length) {
            for (const f of r.failedResponses) {
                lines.push(`- ${f.status} ${f.statusText} — \`${f.url}\``);
            }
        } else {
            lines.push(`- (clean)`);
        }
        lines.push('');
    }

    fs.writeFileSync(mdPath, lines.join('\n'), 'utf-8');
});
