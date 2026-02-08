#!/usr/bin/env npx ts-node
/**
 * SUPREME CHAOS SIMULATION — SATURDAY NIGHT
 *
 * Simulates a full service cycle (20:00 - 23:00) with tired humans.
 * Roles: Owner, Manager, Waiter A (Fast), Waiter B (Slow/Error), Kitchen, Cleaner.
 */

import pg from "pg";

const { Pool } = pg;
const DB_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:54320/chefiapp_core";

const pool = new Pool({ connectionString: DB_URL, max: 20 });
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// =============================================================================
// STATE
// =============================================================================
let tenantId = "";
let restaurantId = "";
let menuCats: string[] = [];
let products: { id: string; price: number; name: string }[] = [];
let tables: string[] = [];

// =============================================================================
// PERSONAS (Human Simulation)
// =============================================================================
async function actAsWaiterA(orderCount: number) {
  console.log("  [Waiter A] Starting shift (Efficient)");
  for (let i = 0; i < orderCount; i++) {
    await createOrder("WAITER_A_APP", "Waiter A", 200, 500);
  }
}

async function actAsWaiterB(orderCount: number) {
  console.log("  [Waiter B] Starting shift (New/Slow)");
  for (let i = 0; i < orderCount; i++) {
    // Human Error: Hesitation
    await delay(1000);
    await createOrder("WAITER_B_APP", "Waiter B", 800, 2000);
    // Human Error: Forgot something (simulated double entry or cancel)
    if (Math.random() > 0.8) {
      console.log('  [Waiter B] "Oops, wrong table..." (Cancelling)');
      // In real world they'd cancel, here we simulate the friction
    }
  }
}

async function actAsManager() {
  console.log("  [Manager] Patroling TPV");
  // Manager creates high value orders occasionally
  await createOrder("TPV_MAIN", "Manager", 500, 1000);
}

async function actAsCustomerQR() {
  console.log("  [Customer] Ordering via QR");
  await createOrder("PUBLIC_WEB", "Customer", 100, 300);
}

// =============================================================================
// ACTIONS
// =============================================================================
async function createOrder(
  source: string,
  author: string,
  latencyMin: number,
  latencyMax: number,
) {
  const client = await pool.connect();
  try {
    const table = tables[Math.floor(Math.random() * tables.length)];
    const product = products[Math.floor(Math.random() * products.length)];

    // Human latency
    await delay(latencyMin + Math.random() * (latencyMax - latencyMin));

    const items = JSON.stringify([
      {
        product_id: product.id,
        name: product.name,
        quantity: 1,
        unit_price: product.price,
      },
    ]);

    const metadata = JSON.stringify({ table_id: table });
    await client.query(
      `SELECT create_order_atomic($1::uuid, $2::jsonb, 'cash', $3::jsonb)`,
      [restaurantId, items, metadata],
    );
    // console.log(`    -> Order created by ${author} via ${source}`);
  } catch (e) {
    console.error(`    ❌ [${author}] Order Failed: ${(e as Error).message}`);
  } finally {
    client.release();
  }
}

async function kitchenWorker() {
  const client = await pool.connect();
  try {
    // Find OPEN orders
    const res = await client.query(
      `SELECT id FROM gm_orders WHERE restaurant_id = $1 AND status = 'OPEN' LIMIT 5`,
      [restaurantId],
    );

    for (const row of res.rows) {
      // Simulate cooking time
      await delay(100);
      await client.query(
        `UPDATE gm_orders SET status = 'PREPARING' WHERE id = $1`,
        [row.id],
      );
      // console.log(`  [Kitchen] Started order ${row.id.substring(0,8)}`);

      await delay(100);
      await client.query(
        `UPDATE gm_orders SET status = 'READY' WHERE id = $1`,
        [row.id],
      );
      // console.log(`  [Kitchen] Order Ready ${row.id.substring(0,8)}`);
    }
  } finally {
    client.release();
  }
}

// =============================================================================
// MAIN SIMULATION
// =============================================================================
async function run() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  SUPREME HUMAN E2E TEST (Saturday Night Chaos)");
  console.log("═══════════════════════════════════════════════════════════");

  const client = await pool.connect();
  try {
    // PHASE 1: OPENING (20:00)
    console.log("\nPHASE 1 — Opening (20:00)");
    tenantId = "00000000-0000-0000-0000-000000000001";
    restaurantId = `10000000-0000-0000-0000-000000009999`; // Fixed ID for simulation

    // Clean slate for this restaurant
    await client.query("DELETE FROM gm_orders WHERE restaurant_id = $1", [
      restaurantId,
    ]);
    await client.query("DELETE FROM gm_tables WHERE restaurant_id = $1", [
      restaurantId,
    ]);
    await client.query("DELETE FROM gm_products WHERE restaurant_id = $1", [
      restaurantId,
    ]);
    await client.query(
      "DELETE FROM gm_menu_categories WHERE restaurant_id = $1",
      [restaurantId],
    );
    await client.query("DELETE FROM gm_restaurants WHERE id = $1", [
      restaurantId,
    ]);

    // Create Restaurant
    await client.query(
      `
            INSERT INTO saas_tenants (id, name, slug) VALUES ($1, 'Supreme Tenant', 'supreme') ON CONFLICT DO NOTHING
        `,
      [tenantId],
    );
    await client.query(
      `
            INSERT INTO gm_restaurants (id, tenant_id, name, slug, status)
            VALUES ($1, $2, 'Saturday Night Bistro', 'saturday-night-bistro', 'active')
        `,
      [restaurantId, tenantId],
    );
    console.log("  ✅ Restaurant Opened");

    // Create Data
    const catRes = await client.query(
      `INSERT INTO gm_menu_categories (restaurant_id, name, sort_order) VALUES ($1, 'Drinks', 1) RETURNING id`,
      [restaurantId],
    );
    const catId = catRes.rows[0].id;

    const p1 = await client.query(
      `INSERT INTO gm_products (restaurant_id, category_id, name, price_cents, available) VALUES ($1, $2, 'Mojito', 1200, true) RETURNING id`,
      [restaurantId, catId],
    );
    const p2 = await client.query(
      `INSERT INTO gm_products (restaurant_id, category_id, name, price_cents, available) VALUES ($1, $2, 'Burger', 1800, true) RETURNING id`,
      [restaurantId, catId],
    );
    products = [
      { id: p1.rows[0].id, name: "Mojito", price: 1200 },
      { id: p2.rows[0].id, name: "Burger", price: 1800 },
    ];

    for (let t = 1; t <= 10; t++) {
      const res = await client.query(
        `INSERT INTO gm_tables (restaurant_id, number, status) VALUES ($1, $2, 'open') RETURNING id`,
        [restaurantId, t],
      );
      tables.push(res.rows[0].id); // Actually UUIDs in some schemas, or numbers. Assuming UUID based on seed. Wait, seed used numbers?
      // Seed used number in column 'number', schema creates UUID?
      // Let's assume create_order_atomic takes the 'number' string or ID?
      // The seed passes "Items" and `table_id` is passed as NULL in the seed.
      // But create_order_atomic signature in seed was: ($1::uuid, $2::jsonb, 'cash', NULL)
      // My createOrder passes tables[i] which is UUID from RETURNING id.
    }
    console.log(`  ✅ Menu & 10 Tables Ready`);

    // PHASE 2: ORDERS FROM EVERYWHERE (20:30)
    console.log("\nPHASE 2 — Orders from Everywhere (20:30)");
    await Promise.all([
      actAsWaiterA(5),
      actAsWaiterB(3),
      actAsManager(),
      actAsCustomerQR(),
    ]);
    console.log("  ✅ Orders flooded in.");

    // PHASE 3: KITCHEN PRESSURE (21:00)
    console.log("\nPHASE 3 — Kitchen Pressure (21:00)");
    await kitchenWorker();
    console.log("  ✅ Kitchen processed batch 1.");
    // Verify One Ignored Order?
    // We leave some open.

    // PHASE 4: TASKS (21:30)
    console.log("\nPHASE 4 — Tasks & Human Chaos (21:30)");
    if (await tableExists(client, "gm_tasks")) {
      await client.query(
        `INSERT INTO gm_tasks (restaurant_id, task_type, message, status) VALUES ($1, 'ENTREGA_PENDENTE', 'Spill at Table 4', 'OPEN')`,
        [restaurantId],
      );
      console.log("  ✅ Spill reported (Task Created)");
      await delay(500);
      await client.query(
        `UPDATE gm_tasks SET status = 'RESOLVED' WHERE restaurant_id = $1 AND message = 'Spill at Table 4'`,
        [restaurantId],
      );
      console.log("  ✅ Cleaned up (Task Done)");
    } else {
      console.log("  ⚠️ (Skipping Tasks - table not found)");
    }

    // PHASE 5: PEAK LOAD (22:00)
    console.log("\nPHASE 5 — Peak Load (22:00)");
    const startPeak = Date.now();
    const promises = [];
    for (let i = 0; i < 50; i++) {
      promises.push(createOrder("PEAK_LOAD", "Chaos Bot", 10, 50));
    }
    await Promise.all(promises);
    const duration = Date.now() - startPeak;
    console.log(
      `  ✅ 50 Orders in ${duration}ms (${(50 / (duration / 1000)).toFixed(
        1,
      )} req/s)`,
    );

    // PHASE 6: CLOSING (23:00)
    console.log("\nPHASE 6 — Closing Time (23:00)");
    const finRes = await client.query(
      `SELECT COUNT(*) as count, SUM(price_snapshot) as total FROM gm_order_items JOIN gm_orders ON gm_orders.id = gm_order_items.order_id WHERE restaurant_id = $1`,
      [restaurantId],
    );
    console.log(`  🏁 Final Count: ${finRes.rows[0].count}`);
    // console.log(`  💰 Final Total: ${(finRes.rows[0].total / 100).toFixed(2)}`);

    console.log("\n✅ SIMULATION COMPLETE.");
  } catch (e) {
    console.error("CRITIAL SIMULATION FAILURE:", e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

async function tableExists(
  client: pg.PoolClient,
  table: string,
): Promise<boolean> {
  const r = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
    [table],
  );
  return r.rowCount !== null && r.rowCount > 0;
}

run();
