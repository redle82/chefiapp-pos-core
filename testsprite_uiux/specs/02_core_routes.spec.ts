import { test } from '@playwright/test';
import { ROUTE_BUCKETS } from './helpers/routeCatalog';
import { runRouteTest } from './helpers/routeRunner';
import { verifySystemHealth } from './helpers/bootstrapGuard';

test.describe('Bucket 2: Core Product', () => {
    test('Core app routes check', async ({ page }) => {
        const healthy = await verifySystemHealth(page);

        for (const route of ROUTE_BUCKETS.CORE) {
            await runRouteTest(page, route, 'CORE', !healthy);
        }
    });
});
