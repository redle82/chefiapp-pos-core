import crypto from "crypto";
import dotenv from "dotenv";
import { Pool } from "pg";
import { beforeAll, describe, expect, it } from "vitest";

dotenv.config();

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgres://postgres:postgres@127.0.0.1:54320/chefiapp_core",
});

async function hasTable(tableName: string) {
  const res = await pool.query("SELECT to_regclass($1) AS name", [tableName]);
  return Boolean(res.rows[0]?.name);
}

async function hasFunction(functionName: string) {
  const res = await pool.query(
    `
      SELECT 1
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE p.proname = $1
      LIMIT 1
    `,
    [functionName],
  );
  return res.rowCount > 0;
}

let schemaReady = false;

describe("Hardening P0-E: Optimistic Locking Integration", () => {
  if (!process.env.DATABASE_URL) {
    it.skip("Skipping DB integration test (No DATABASE_URL)", () => {});
    return;
  }

  beforeAll(async () => {
    const [hasRegisters, hasOrders, hasPaymentFn] = await Promise.all([
      hasTable("public.gm_cash_registers"),
      hasTable("public.gm_orders"),
      hasFunction("process_order_payment"),
    ]);
    schemaReady = hasRegisters && hasOrders && hasPaymentFn;
    if (!schemaReady) {
      console.warn(
        "[HardeningP0.locking] Missing schema (gm_cash_registers, gm_orders or process_order_payment).",
      );
    }
  });

  it("SHOULD reject status update after payment increments version", async () => {
    if (!schemaReady) {
      return;
    }
    const testId = crypto.randomUUID();
    const testRestaurantId = crypto.randomUUID();
    const testRegisterId = crypto.randomUUID();

    // 1. Setup Data
    await pool.query(
      `
            INSERT INTO gm_cash_registers(id, restaurant_id, status, opening_balance_cents, total_sales_cents)
            VALUES ($1, $2, 'open', 0, 0)
        `,
      [testRegisterId, testRestaurantId],
    );

    await pool.query(
      `
            INSERT INTO gm_orders(id, restaurant_id, status, total_amount, payment_status, version)
            VALUES ($1, $2, 'pending', 1000, 'pending', 1)
        `,
      [testId, testRestaurantId],
    );

    // 2. Simulate "Client" fetching Order (Version 1)
    // const clientVersion = 1;

    // 3. Process Payment (Should bump version to 2)
    const payRes = await pool.query(
      `
            SELECT * FROM process_order_payment(
                $1, $2, $3, NULL, 1000, 'cash', 'idem_test_' || gen_random_uuid()
            )
        `,
      [testRestaurantId, testId, testRegisterId],
    );

    expect(payRes.rows[0].process_order_payment.success).toBe(true);
    expect(payRes.rows[0].process_order_payment.payment_status).toBe("paid");

    // 4. Verify Version Bumped
    const orderRes = await pool.query(
      "SELECT version, status FROM gm_orders WHERE id = $1",
      [testId],
    );
    expect(orderRes.rows[0].version).toBeGreaterThan(1);
    const newVersion = orderRes.rows[0].version;

    // 5. Attempt Concurrent Update with OLD Version (Attack)
    const updateRes = await pool.query(
      `
            UPDATE gm_orders
            SET status = 'cancelled'
            WHERE id = $1 AND version = 1
            RETURNING id
        `,
      [testId],
    );

    // MUST FAIL (No rows updated)
    expect(updateRes.rowCount).toBe(0);

    // 6. Verify Final State
    const finalRes = await pool.query(
      "SELECT status FROM gm_orders WHERE id = $1",
      [testId],
    );
    expect(finalRes.rows[0].status).toBe("paid"); // Payment won
  });
});
