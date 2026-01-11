import { test } from '@playwright/test';
import { ROUTE_BUCKETS } from './helpers/routeCatalog';
import { runRouteTest } from './helpers/routeRunner';
import { verifySystemHealth } from './helpers/bootstrapGuard';

test.describe('Bucket 3: Peripheral', () => {
    test('Secondary system routes check', async ({ page }) => {
        const healthy = await verifySystemHealth(page);

        for (const route of ROUTE_BUCKETS.PERIPHERAL) {
            await runRouteTest(page, route, 'PERIPHERAL', !healthy);
        }
    });
});
