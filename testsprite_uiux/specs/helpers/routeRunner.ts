import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export type TestResultStatus = 'PASSED' | 'FAILED' | 'BLOCKED' | 'SKIPPED';

export interface RouteResult {
    route: string;
    bucket: string;
    status: TestResultStatus;
    duration: number;
    error?: string;
    screenshot?: string;
}

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESULTS_FILE = path.join(__dirname, '../../output/route_results.json');


// Ensure results file exists and is array
if (!fs.existsSync(RESULTS_FILE)) {
    if (!fs.existsSync(path.dirname(RESULTS_FILE))) fs.mkdirSync(path.dirname(RESULTS_FILE), { recursive: true });
    fs.writeFileSync(RESULTS_FILE, '[]');
}

export async function runRouteTest(
    page: Page,
    route: string,
    bucket: string,
    blocked: boolean = false
): Promise<RouteResult> {
    const start = Date.now();

    if (blocked) {
        return logResult({
            route,
            bucket,
            status: 'BLOCKED',
            duration: 0,
            error: 'Blocked by upstream failure (Guard check).'
        });
    }

    try {
        // Dynamic timeout based on route complexity
        const isHeavy = route.includes('/setup/') || route.includes('/audit');
        const timeout = isHeavy ? 20000 : 8000;

        await page.goto(route, { timeout, waitUntil: 'domcontentloaded' });

        // Best effort stability check
        await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => { });

        // Critical: Check if page "crashed" (Target closed) by accessing a property
        await page.title();

        // Visual sanity check (body exists)
        const body = await page.locator('body').count();
        if (body === 0) throw new Error('Empty body rendered');

        return logResult({
            route,
            bucket,
            status: 'PASSED',
            duration: Date.now() - start
        });

    } catch (err: any) {
        return logResult({
            route,
            bucket,
            status: 'FAILED',
            duration: Date.now() - start,
            error: err.message
        });
    }
}

function logResult(result: RouteResult): RouteResult {
    // Atomic append to JSON (simplified for local concurrency - might need lock in strict ci)
    try {
        const data = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8'));
        data.push(result);
        fs.writeFileSync(RESULTS_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Failed to write result:', e);
    }
    return result;
}
