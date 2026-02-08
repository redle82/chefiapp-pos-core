#!/usr/bin/env npx ts-node
/**
 * SUPREME SEED — ChefIApp
 *
 * Seed determinístico para o Supreme E2E + Stress: N restaurantes, produtos,
 * mesas, pedidos (via create_order_atomic) e tarefas (gm_tasks). Autoridade: Docker Core.
 *
 * Uso:
 *   npx tsx scripts/supreme-seed.ts
 *   SUPREME_SEED_RESTAURANTS=100 SUPREME_SEED_ORDERS=5000 npx tsx scripts/supreme-seed.ts
 *
 * Variáveis:
 *   DATABASE_URL — postgresql://postgres:postgres@localhost:54320/chefiapp_core
 *   SUPREME_SEED_RESTAURANTS — número de restaurantes (default 10)
 *   SUPREME_SEED_STAFF_PER_RESTAURANT — ignorado se employees não existir (default 9)
 *   SUPREME_SEED_ORDERS — número de pedidos (default 500)
 *   SUPREME_SEED_TASKS — número de tarefas (default 200)
 *   SUPREME_SEED_CLEANUP — "true" para limpar dados antes (default true)
 */

import pg from 'pg';

const { Pool } = pg;

// =============================================================================
// CONFIG
// =============================================================================

const N_RESTAURANTS = parseInt(process.env.SUPREME_SEED_RESTAURANTS || '10', 10);
const N_ORDERS = parseInt(process.env.SUPREME_SEED_ORDERS || '500', 10);
const N_TASKS = parseInt(process.env.SUPREME_SEED_TASKS || '200', 10);
const CLEANUP = process.env.SUPREME_SEED_CLEANUP !== 'false';

const DB_URL =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54320/chefiapp_core';

// Seed hash = hash dos parâmetros + timestamp (para reprodutibilidade)
function seedHash(): string {
  const payload = `${N_RESTAURANTS}-${N_ORDERS}-${N_TASKS}-${CLEANUP}-${Date.now()}`;
  let h = 0;
  for (let i = 0; i < payload.length; i++) {
    const c = payload.charCodeAt(i);
    h = (h << 5) - h + c;
    h = h & h;
  }
  return Math.abs(h).toString(36);
}

// =============================================================================
// DB
// =============================================================================

const pool = new Pool({
  connectionString: DB_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// =============================================================================
// HELPERS
// =============================================================================

async function tableExists(client: pg.PoolClient, table: string): Promise<boolean> {
  const r = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
    [table]
  );
  return r.rowCount !== null && r.rowCount > 0;
}

// =============================================================================
// SEED
// =============================================================================

async function run(): Promise<void> {
  const hash = seedHash();
  const start = Date.now();
  const errors: string[] = [];

  console.log('Supreme Seed — starting');
  console.log(`  RESTAURANTS=${N_RESTAURANTS} ORDERS=${N_ORDERS} TASKS=${N_TASKS} CLEANUP=${CLEANUP}`);
  console.log(`  SEED_HASH=${hash}`);
  console.log('');

  const client = await pool.connect();

  try {
    // 1) Cleanup (optional)
    if (CLEANUP) {
      await client.query('DELETE FROM gm_order_items');
      await client.query('DELETE FROM gm_orders');
      if (await tableExists(client, 'gm_tasks')) {
        await client.query('DELETE FROM gm_tasks');
      }
      await client.query('DELETE FROM gm_tables');
      await client.query('DELETE FROM gm_products');
      await client.query('DELETE FROM gm_menu_categories');
      await client.query('DELETE FROM gm_restaurants');
      await client.query('DELETE FROM saas_tenants');
      console.log('  Cleanup done');
    }

    // 2) Tenant
    await client.query(`
      INSERT INTO saas_tenants (id, name, slug)
      VALUES ('00000000-0000-0000-0000-000000000001', 'Tenant Supreme', 'tenant-supreme')
      ON CONFLICT DO NOTHING
    `);
    const tenantId = '00000000-0000-0000-0000-000000000001';

    // 3) Restaurants + categories + products + tables
    const restaurantIds: string[] = [];
    const productIdsByRestaurant: Map<string, string[]> = new Map();

    for (let r = 0; r < N_RESTAURANTS; r++) {
      const restId = `10000000-0000-0000-0000-${String(r).padStart(12, '0')}`;
      restaurantIds.push(restId);

      await client.query(
        `INSERT INTO gm_restaurants (id, tenant_id, name, slug, status)
         VALUES ($1, $2, $3, $4, 'active')
         ON CONFLICT (slug) DO NOTHING`,
        [restId, tenantId, `Restaurant Supreme ${r + 1}`, `restaurant-supreme-${r}`]
      );

      const catRes = await client.query(
        `INSERT INTO gm_menu_categories (restaurant_id, name, sort_order)
         VALUES ($1, 'Main', 1)
         RETURNING id`,
        [restId]
      );
      const categoryId = catRes.rows[0]?.id;
      if (!categoryId) continue;

      const productIds: string[] = [];
      for (let p = 0; p < 5; p++) {
        const prodRes = await client.query(
          `INSERT INTO gm_products (restaurant_id, category_id, name, price_cents, available)
           VALUES ($1, $2, $3, $4, true)
           RETURNING id`,
          [restId, categoryId, `Product ${r}-${p}`, 500 + p * 100]
        );
        if (prodRes.rows[0]?.id) productIds.push(prodRes.rows[0].id);
      }
      productIdsByRestaurant.set(restId, productIds);

      for (let t = 0; t < 10; t++) {
        await client.query(
          `INSERT INTO gm_tables (restaurant_id, number, status)
           VALUES ($1, $2, 'closed')
           ON CONFLICT (restaurant_id, number) DO NOTHING`,
          [restId, t + 1]
        );
      }
    }

    console.log(`  Restaurants: ${restaurantIds.length}`);
    const totalProducts = Array.from(productIdsByRestaurant.values()).reduce((s, a) => s + a.length, 0);
    console.log(`  Products: ${totalProducts}`);

    // 4) Orders via create_order_atomic (table_id null to allow many OPEN)
    let ordersCreated = 0;
    const ordersPerRestaurant = Math.max(1, Math.floor(N_ORDERS / restaurantIds.length));

    for (const restId of restaurantIds) {
      const pids = productIdsByRestaurant.get(restId);
      if (!pids || pids.length === 0) continue;

      for (let o = 0; o < ordersPerRestaurant && ordersCreated < N_ORDERS; o++) {
        const productId = pids[o % pids.length];
        const items = JSON.stringify([
          { product_id: productId, name: 'Item', quantity: 1, unit_price: 1000 },
        ]);
        try {
          await client.query(
            `SELECT create_order_atomic($1::uuid, $2::jsonb, 'cash', NULL)`,
            [restId, items]
          );
          ordersCreated++;
        } catch (e) {
          errors.push(`Order ${ordersCreated + 1}: ${(e as Error).message}`);
        }
      }
    }

    console.log(`  Orders: ${ordersCreated}`);

    // 5) Tasks (if gm_tasks exists)
    if (await tableExists(client, 'gm_tasks')) {
      const taskTypes = ['ATRASO_ITEM', 'ACUMULO_BAR', 'ENTREGA_PENDENTE'];
      const stations = ['BAR', 'KITCHEN', 'SERVICE'];
      let tasksCreated = 0;
      for (let i = 0; i < N_TASKS && restaurantIds.length > 0; i++) {
        const restId = restaurantIds[i % restaurantIds.length];
        const taskType = taskTypes[i % taskTypes.length];
        const station = stations[i % stations.length];
        try {
          await client.query(
            `INSERT INTO gm_tasks (restaurant_id, task_type, station, priority, message, status)
             VALUES ($1, $2, $3, 'MEDIA', $4, 'OPEN')`,
            [restId, taskType, station, `Task seed ${i}`]
          );
          tasksCreated++;
        } catch (e) {
          errors.push(`Task ${i}: ${(e as Error).message}`);
        }
      }
      console.log(`  Tasks: ${tasksCreated}`);
    } else {
      console.log('  Tasks: table gm_tasks not found, skip');
    }

    const duration = Date.now() - start;
    console.log('');
    console.log(`Seed complete in ${duration}ms. SEED_HASH=${hash}`);
    if (errors.length > 0) {
      console.error('Errors:', errors.slice(0, 10));
      if (errors.length > 10) console.error(`... and ${errors.length - 10} more`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
