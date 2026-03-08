import { test, expect } from '@playwright/test';
import { ROUTE_BUCKETS } from './helpers/routeCatalog';
import { runRouteTest } from './helpers/routeRunner';

test.describe('Bucket 0: Smoke Tests', () => {
    test('Critical paths should load', async ({ page }) => {
        // Smoke tests typically don't need the guard because they ARE the guard
        // But we still use standard runner for consistency

        for (const route of ROUTE_BUCKETS.SMOKE) {
            const result = await runRouteTest(page, route, 'SMOKE');
            expect(result.status, `Route ${route} failed: ${result.error}`).not.toBe('FAILED');
        }
    });
});
