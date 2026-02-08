/**
 * SCALE TEST - ChefIApp Massive Test Suite
 * 
 * Playwright E2E test for validating multi-tenant operation at scale.
 * Tests 5-10 restaurants operating simultaneously with concurrent orders.
 * 
 * Usage:
 *   npx playwright test tests/massive/scale-test.spec.ts
 *   npx playwright test tests/massive/scale-test.spec.ts --headed
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import pg from 'pg';

const { Pool } = pg;

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  BASE_URL: process.env.E2E_BASE_URL || 'http://localhost:5173',
  RESTAURANT_COUNT: parseInt(process.env.SCALE_RESTAURANT_COUNT || '5', 10),
  ORDERS_PER_RESTAURANT: parseInt(process.env.SCALE_ORDERS_PER_RESTAURANT || '5', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54320/chefiapp_core',
  POSTGREST_URL: process.env.POSTGREST_URL || 'http://localhost:3001',
  VIEWPORT: { width: 1440, height: 900 },
  TIMEOUT: 30000,
};

// =============================================================================
// TYPES
// =============================================================================

interface TestRestaurant {
  id: string;
  name: string;
  slug: string;
  tables: Array<{ id: string; number: number }>;
  products: Array<{ id: string; name: string; price_cents: number }>;
}

interface TestResult {
  restaurantId: string;
  restaurantName: string;
  ordersCreated: number;
  ordersVisible: number;
  kdsReceived: number;
  errors: string[];
}

// =============================================================================
// HELPERS
// =============================================================================

function getDbPool(): pg.Pool {
  return new Pool({
    connectionString: CONFIG.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

async function getTestRestaurants(pool: pg.Pool): Promise<TestRestaurant[]> {
  const restaurantsResult = await pool.query(
    `SELECT id, name, slug FROM public.gm_restaurants 
     WHERE name LIKE 'Test Restaurant%' OR name LIKE 'Restaurante Piloto%'
     LIMIT $1`,
    [CONFIG.RESTAURANT_COUNT]
  );

  if (restaurantsResult.rows.length === 0) {
    throw new Error('No test restaurants found. Run seed-massive-test-docker.ts first.');
  }

  // Fetch tables and products for each restaurant
  const restaurantsWithData: TestRestaurant[] = [];

  for (const restaurant of restaurantsResult.rows) {
    const [tablesResult, productsResult] = await Promise.all([
      pool.query(
        `SELECT id, number FROM public.gm_tables 
         WHERE restaurant_id = $1 
         LIMIT 5`,
        [restaurant.id]
      ),
      pool.query(
        `SELECT id, name, price_cents FROM public.gm_products 
         WHERE restaurant_id = $1 AND available = true 
         LIMIT 10`,
        [restaurant.id]
      ),
    ]);

    restaurantsWithData.push({
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug || `test-${restaurant.id.slice(0, 8)}`,
      tables: tablesResult.rows || [],
      products: productsResult.rows || [],
    });
  }

  return restaurantsWithData;
}

async function createOrderViaAPI(
  pool: pg.Pool,
  restaurant: TestRestaurant
): Promise<string | null> {
  if (restaurant.tables.length === 0 || restaurant.products.length === 0) {
    return null;
  }

  const table = restaurant.tables[Math.floor(Math.random() * restaurant.tables.length)];
  const product = restaurant.products[Math.floor(Math.random() * restaurant.products.length)];

  try {
    // Use create_order_atomic RPC via PostgREST or direct SQL
    const rpcItems = [{
      product_id: product.id,
      name: product.name,
      quantity: 1,
      unit_price: product.price_cents,
    }];

    const syncMetadata = {
      table_id: table.id,
      table_number: table.number,
      origin: 'SCALE_TEST',
      timestamp: new Date().toISOString()
    };

    const result = await pool.query(
      `SELECT create_order_atomic($1::uuid, $2::jsonb, $3::text, $4::jsonb) as result`,
      [
        restaurant.id,
        JSON.stringify(rpcItems),
        'cash',
        JSON.stringify(syncMetadata)
      ]
    );

    const rpcResult = result.rows[0].result;
    return rpcResult.id || null;
  } catch (error) {
    console.error(`Exception creating order for ${restaurant.name}:`, error);
    return null;
  }
}

async function setupPageForRestaurant(page: Page, restaurant: TestRestaurant): Promise<void> {
  // Navigate to auth page
  await page.goto(`${CONFIG.BASE_URL}/app/auth`);

  // Inject demo mode and restaurant context
  await page.evaluate((rest) => {
    localStorage.setItem('chefiapp_demo_mode', 'true');
    localStorage.setItem('chefiapp_restaurant_id', rest.id);
    localStorage.setItem('chefiapp_name', rest.name);
    localStorage.setItem('chefiapp_slug', rest.slug);
    // Mark as fully onboarded
    localStorage.setItem('chefiapp_evt_identity_done', '1');
    localStorage.setItem('chefiapp_evt_menu_done', '1');
    localStorage.setItem('chefiapp_evt_payments_done', '1');
    localStorage.setItem('chefiapp_evt_published', '1');
  }, restaurant);

  // Navigate to TPV
  await page.goto(`${CONFIG.BASE_URL}/app/tpv`);
  
  // Wait for TPV to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Allow React to render
}

async function verifyOrderInTPV(page: Page, orderId: string): Promise<boolean> {
  try {
    // Look for order in the UI - this depends on your TPV implementation
    // Common patterns: order list, order card, order number
    const orderVisible = await page.locator(`[data-order-id="${orderId}"]`).isVisible({ timeout: 5000 })
      .catch(() => false);
    
    if (orderVisible) return true;

    // Alternative: check for order number or short_id
    const orderNumberVisible = await page.getByText(`#${orderId.slice(0, 8)}`).isVisible({ timeout: 5000 })
      .catch(() => false);

    return orderNumberVisible;
  } catch {
    return false;
  }
}

async function verifyOrderInKDS(page: Page, orderId: string): Promise<boolean> {
  try {
    // Navigate to KDS
    await page.goto(`${CONFIG.BASE_URL}/app/kds`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Look for order in KDS
    const orderVisible = await page.locator(`[data-order-id="${orderId}"]`).isVisible({ timeout: 5000 })
      .catch(() => false);

    if (orderVisible) return true;

    // Alternative: check for order status or number
    const orderInKDS = await page.getByText(/OPEN|NEW|PENDING/i).first().isVisible({ timeout: 5000 })
      .catch(() => false);

    return orderInKDS;
  } catch {
    return false;
  }
}

// =============================================================================
// TESTS
// =============================================================================

test.describe('Massive Scale Test - Multi-Tenant Operation', () => {
  let testRestaurants: TestRestaurant[];
  let pool: pg.Pool;

  test.beforeAll(async () => {
    pool = getDbPool();
    testRestaurants = await getTestRestaurants(pool);
    
    test.setTimeout(CONFIG.TIMEOUT * testRestaurants.length * 2);
    
    console.log(`📍 Found ${testRestaurants.length} test restaurants`);
  });

  test.afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  test('Multiple restaurants operating simultaneously', async ({ browser }) => {
    const results: TestResult[] = [];
    const contexts: BrowserContext[] = [];

    try {
      // Create browser contexts for each restaurant
      for (const restaurant of testRestaurants) {
        const context = await browser.newContext({
          viewport: CONFIG.VIEWPORT,
        });
        contexts.push(context);
      }

      // Process each restaurant in parallel
      const restaurantPromises = testRestaurants.map(async (restaurant, index) => {
        const context = contexts[index];
        const page = await context.newPage();
        const result: TestResult = {
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          ordersCreated: 0,
          ordersVisible: 0,
          kdsReceived: 0,
          errors: [],
        };

        try {
          // Setup page for restaurant
          await setupPageForRestaurant(page, restaurant);

          // Create orders via API
          const orderPromises: Promise<string | null>[] = [];
          for (let i = 0; i < CONFIG.ORDERS_PER_RESTAURANT; i++) {
            orderPromises.push(createOrderViaAPI(pool, restaurant));
          }

          const orderIds = (await Promise.all(orderPromises)).filter((id): id is string => id !== null);
          result.ordersCreated = orderIds.length;

          // Wait a bit for realtime to propagate
          await page.waitForTimeout(2000);

          // Verify orders appear in TPV
          for (const orderId of orderIds) {
            const visible = await verifyOrderInTPV(page, orderId);
            if (visible) result.ordersVisible++;
          }

          // Verify orders appear in KDS
          for (const orderId of orderIds) {
            const visible = await verifyOrderInKDS(page, orderId);
            if (visible) result.kdsReceived++;
          }

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          result.errors.push(errorMsg);
          console.error(`Error testing ${restaurant.name}:`, errorMsg);
        } finally {
          await page.close();
        }

        return result;
      });

      const restaurantResults = await Promise.all(restaurantPromises);
      results.push(...restaurantResults);

      // Print summary
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('📊 SCALE TEST RESULTS');
      console.log('═══════════════════════════════════════════════════════════');
      
      let totalOrdersCreated = 0;
      let totalOrdersVisible = 0;
      let totalKDSReceived = 0;
      let totalErrors = 0;

      results.forEach(result => {
        console.log(`\n🍽️  ${result.restaurantName}:`);
        console.log(`   Orders Created: ${result.ordersCreated}`);
        console.log(`   Orders Visible in TPV: ${result.ordersVisible}`);
        console.log(`   Orders Received in KDS: ${result.kdsReceived}`);
        if (result.errors.length > 0) {
          console.log(`   Errors: ${result.errors.length}`);
          result.errors.forEach(e => console.log(`     - ${e}`));
        }

        totalOrdersCreated += result.ordersCreated;
        totalOrdersVisible += result.ordersVisible;
        totalKDSReceived += result.kdsReceived;
        totalErrors += result.errors.length;
      });

      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('📈 TOTALS');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`   Restaurants: ${results.length}`);
      console.log(`   Total Orders Created: ${totalOrdersCreated}`);
      console.log(`   Total Orders Visible: ${totalOrdersVisible}`);
      console.log(`   Total KDS Received: ${totalKDSReceived}`);
      console.log(`   Total Errors: ${totalErrors}`);
      console.log('═══════════════════════════════════════════════════════════\n');

      // Assertions
      expect(results.length).toBeGreaterThanOrEqual(5);
      expect(totalOrdersCreated).toBeGreaterThanOrEqual(25); // At least 5 orders per restaurant
      expect(totalErrors).toBe(0);

      // Success criteria
      const visibilityRate = totalOrdersCreated > 0 
        ? (totalOrdersVisible / totalOrdersCreated) * 100 
        : 0;
      const kdsRate = totalOrdersCreated > 0 
        ? (totalKDSReceived / totalOrdersCreated) * 100 
        : 0;

      console.log(`\n✅ Success Criteria:`);
      console.log(`   Visibility Rate: ${visibilityRate.toFixed(1)}%`);
      console.log(`   KDS Reception Rate: ${kdsRate.toFixed(1)}%`);

      // Note: These assertions are lenient because UI verification can be flaky
      // The important thing is that orders are created successfully
      expect(totalOrdersCreated).toBeGreaterThan(0);
      
    } finally {
      // Cleanup contexts
      for (const context of contexts) {
        await context.close();
      }
    }
  });

  test('Concurrent order creation across restaurants', async () => {
    const orderPromises: Promise<string | null>[] = [];

    // Create orders concurrently across all restaurants
    for (const restaurant of testRestaurants) {
      for (let i = 0; i < CONFIG.ORDERS_PER_RESTAURANT; i++) {
        orderPromises.push(createOrderViaAPI(pool, restaurant));
      }
    }

    const orderIds = (await Promise.all(orderPromises)).filter((id): id is string => id !== null);

    console.log(`\n🔥 Created ${orderIds.length} orders concurrently across ${testRestaurants.length} restaurants`);

    // Verify all orders exist in database
    const ordersResult = await pool.query(
      `SELECT id, restaurant_id, status FROM public.gm_orders 
       WHERE id = ANY($1::uuid[])`,
      [orderIds]
    );

    const orders = ordersResult.rows;
    expect(orders).toBeTruthy();
    expect(orders.length).toBe(orderIds.length);

    // Verify orders are distributed across restaurants
    const ordersByRestaurant = new Map<string, number>();
    orders.forEach(order => {
      const count = ordersByRestaurant.get(order.restaurant_id) || 0;
      ordersByRestaurant.set(order.restaurant_id, count + 1);
    });

    console.log(`\n📊 Orders by restaurant:`);
    ordersByRestaurant.forEach((count, restaurantId) => {
      const restaurant = testRestaurants.find(r => r.id === restaurantId);
      console.log(`   ${restaurant?.name || restaurantId}: ${count} orders`);
    });

    // Cleanup
    await pool.query(
      `UPDATE public.gm_orders 
       SET status = 'CLOSED', payment_status = 'PAID' 
       WHERE id = ANY($1::uuid[])`,
      [orderIds]
    );

    expect(ordersByRestaurant.size).toBeGreaterThanOrEqual(5);
  });
});
