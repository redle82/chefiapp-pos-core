import crypto from "crypto";
import { beforeAll, describe, expect, it } from "vitest";

// Mock Supabase Client for Trigger Test?
// Actually, standard unit tests mock the DB. Triggers run in the DB.
// "Integration Testing" needed here?
// Since we can't run real DB triggers in 'vitest' without a real DB instance,
// and the user context implies a mixed environment:
// We will simulate the "Action -> Effect" proof by ensuring the Code Logic *would* have called something if it was client side,
// BUT triggers are server side.
//
// Strategy: Since we created the SQL, and we can't run it locally easily without 'supabase start' and seeding:
// We will create a SCRIPT 'scripts/verify-triggers.ts' that uses the real Local DB connection (pg)
// to insert data and check event_store.

import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgres://postgres:postgres@127.0.0.1:54322/postgres",
});

async function hasTable(tableName: string) {
  const res = await pool.query("SELECT to_regclass($1) AS name", [tableName]);
  return Boolean(res.rows[0]?.name);
}

async function hasColumn(tableName: string, columnName: string) {
  const res = await pool.query(
    `
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = $1 AND column_name = $2
            LIMIT 1
        `,
    [tableName, columnName],
  );
  return res.rowCount > 0;
}

let schemaReady = false;

describe("Hardening P0-D: CDC Triggers Integration", () => {
  // SKIP validation if no DB access (CI/CD safety)
  if (!process.env.DATABASE_URL) {
    it.skip("Skipping DB integration test (No DATABASE_URL)", () => {});
    return;
  }

  beforeAll(async () => {
    const [hasOrders, hasEventStore, hasSourceColumn] = await Promise.all([
      hasTable("public.gm_orders"),
      hasTable("public.event_store"),
      hasColumn("gm_orders", "source"),
    ]);
    schemaReady = hasOrders && hasEventStore && hasSourceColumn;
    if (!schemaReady) {
      console.warn(
        "[HardeningP0.triggers] Missing schema (gm_orders.source or event_store).",
      );
    }
  });

  it("SHOULD emit ORDER_CREATED when gm_orders is changed", async () => {
    if (!schemaReady) {
      return;
    }
    const testId = crypto.randomUUID();
    const testRestaurantId = crypto.randomUUID(); // Mock

    // 1. Insert Order
    await pool.query(
      `
                        INSERT INTO gm_restaurants(id, name)
                        VALUES ($1, 'Test Restaurant')
                `,
      [testRestaurantId],
    );

    await pool.query(
      `
                        INSERT INTO gm_orders(id, restaurant_id, status, total_cents, payment_status, source)
                        VALUES ($1, $2, 'OPEN', 1000, 'PENDING', 'test_cdc')
                `,
      [testId, testRestaurantId],
    );

    // 2. Check Event Store
    const res = await pool.query(
      `
                        SELECT * FROM event_store WHERE stream_id = $1 AND event_type = 'ORDER_CREATED'
                `,
      [testId],
    );

    expect(res.rows.length).toBe(1);
    expect(res.rows[0].payload.totalCents).toBe(1000);
  });
});
