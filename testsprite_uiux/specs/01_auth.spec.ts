import { test } from '@playwright/test';
import { ROUTE_BUCKETS } from './helpers/routeCatalog';
import { runRouteTest } from './helpers/routeRunner';
import { verifySystemHealth } from './helpers/bootstrapGuard';

test.describe('Bucket 1: Auth Flows', () => {
    test('Auth routes check', async ({ page }) => {
        const healthy = await verifySystemHealth(page);

        for (const route of ROUTE_BUCKETS.AUTH) {
            await runRouteTest(page, route, 'AUTH', !healthy);
        }
    });
});
