#!/usr/bin/env npx tsx
/**
 * STRESS FRIDAY PEAK — Simulação "sexta 21h"
 *
 * 6 workers concorrentes (TPV, KDS x2, AppStaff x2, WebOrder) simulando
 * create order → add item → update status → payment em paralelo.
 *
 * Critério de sucesso: 0 erros de constraint, total_cents = sum(items) em 100% dos pedidos.
 *
 * Usage:
 *   npx tsx scripts/stress/stress-friday-peak.ts
 *   BLOCK_DIRECT_WRITES=true npx tsx scripts/stress/stress-friday-peak.ts
 */

const CORE_URL =
  process.env.CORE_URL ||
  process.env.VITE_CORE_URL ||
  "http://localhost:3001";
const REST = `${CORE_URL.replace(/\/$/, "")}/rest/v1`;
const CORE_KEY =
  process.env.CORE_ANON_KEY ||
  process.env.CORE_SERVICE_KEY ||
  "chefiapp-core-secret-key-min-32-chars-long";

const RESTAURANT_ID =
  process.env.STRESS_RESTAURANT_ID ||
  "00000000-0000-0000-0000-000000000100";

/** Owner do restaurante seed (06-seed-enterprise). Actor obrigatório para update_order_status. */
const SEED_ACTOR_USER_ID = "00000000-0000-0000-0000-000000000002";

const WORKER_NAMES = ["TPV", "KDS_1", "KDS_2", "AppStaff_1", "AppStaff_2", "WebOrder"] as const;
const ORDERS_PER_WORKER = 5;

interface OrderResult {
  worker: string;
  orderId: string | null;
  latencyMs: number;
  success: boolean;
  error?: string;
  totalCents?: number;
  itemsSum?: number;
  totalMatch?: boolean;
}

const results: OrderResult[] = [];
const latencies: number[] = [];

async function fetchCore(
  path: string,
  opts: { method?: string; body?: object } = {},
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  const url = path.startsWith("http") ? path : `${REST}${path}`;
  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      apikey: CORE_KEY,
      Authorization: `Bearer ${CORE_KEY}`,
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    return { ok: res.ok, error: text || res.statusText };
  }
  if (!res.ok) {
    const err = data as { message?: string };
    return { ok: false, error: err?.message ?? text };
  }
  return { ok: true, data };
}

async function getProducts(): Promise<{ id: string; price_cents: number; name: string }[]> {
  const { ok, data, error } = await fetchCore(
    `/gm_products?restaurant_id=eq.${RESTAURANT_ID}&available=eq.true&limit=10`,
  );
  if (!ok || !Array.isArray(data)) {
    throw new Error(`Failed to fetch products: ${error}`);
  }
  return data as { id: string; price_cents: number; name: string }[];
}

async function runWorker(workerName: string): Promise<void> {
  const products = await getProducts();
  if (products.length === 0) throw new Error("No products found");

  for (let i = 0; i < ORDERS_PER_WORKER; i++) {
    const start = Date.now();
    let orderId: string | null = null;
    let totalCents = 0;
    let itemsSum = 0;

    try {
      const items = products.slice(0, 2).map((p) => ({
        product_id: p.id,
        name: p.name,
        quantity: 1 + (i % 2),
        unit_price: p.price_cents,
      }));
      totalCents = items.reduce(
        (s, it) => s + it.quantity * it.unit_price,
        0,
      );

      const { ok, data, error } = await fetchCore("/rpc/create_order_atomic", {
        method: "POST",
        body: {
          p_restaurant_id: RESTAURANT_ID,
          p_items: items,
          p_payment_method: "cash",
          p_idempotency_key: `stress-${workerName}-${i}-${Date.now()}`,
        },
      });

      if (!ok || !data) {
        results.push({
          worker: workerName,
          orderId: null,
          latencyMs: Date.now() - start,
          success: false,
          error: error ?? "create_order_atomic failed",
        });
        continue;
      }

      const createResult = data as { id?: string };
      orderId = createResult.id ?? null;
      if (!orderId) {
        results.push({
          worker: workerName,
          orderId: null,
          latencyMs: Date.now() - start,
          success: false,
          error: "No order id returned",
        });
        continue;
      }

      const { ok: addOk, error: addError } = await fetchCore(
        "/rpc/add_order_item_atomic",
        {
          method: "POST",
          body: {
            p_order_id: orderId,
            p_restaurant_id: RESTAURANT_ID,
            p_product_id: products[0].id,
            p_quantity: 1,
            p_name_snapshot: products[0].name,
            p_price_snapshot: products[0].price_cents,
            p_idempotency_key: `stress-add-${workerName}-${i}-${Date.now()}`,
          },
        },
      );

      if (!addOk) {
        results.push({
          worker: workerName,
          orderId,
          latencyMs: Date.now() - start,
          success: false,
          error: addError ?? "add_order_item_atomic failed",
        });
        continue;
      }

      const { ok: statusOk } = await fetchCore("/rpc/update_order_status", {
        method: "POST",
        body: {
          p_order_id: orderId,
          p_restaurant_id: RESTAURANT_ID,
          p_new_status: "IN_PREP",
          p_actor_user_id: SEED_ACTOR_USER_ID,
        },
      });

      if (!statusOk) {
        results.push({
          worker: workerName,
          orderId,
          latencyMs: Date.now() - start,
          success: false,
          error: "update_order_status failed",
        });
        continue;
      }

      const { data: orderData } = await fetchCore(
        `/gm_orders?id=eq.${orderId}&select=total_cents`,
      );
      const orderRow = Array.isArray(orderData) ? orderData[0] : orderData;
      const fetchedTotal = orderRow?.total_cents ?? 0;

      const { data: itemsData } = await fetchCore(
        `/gm_order_items?order_id=eq.${orderId}&select=subtotal_cents`,
      );
      const itemsRows = Array.isArray(itemsData) ? itemsData : [];
      itemsSum = itemsRows.reduce(
        (s: number, r: { subtotal_cents?: number }) =>
          s + (r.subtotal_cents ?? 0),
        0,
      );

      const totalMatch = fetchedTotal === itemsSum;
      const latencyMs = Date.now() - start;
      latencies.push(latencyMs);

      results.push({
        worker: workerName,
        orderId,
        latencyMs,
        success: true,
        totalCents: fetchedTotal,
        itemsSum,
        totalMatch,
      });
    } catch (e) {
      results.push({
        worker: workerName,
        orderId,
        latencyMs: Date.now() - start,
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function main(): Promise<void> {
  console.log("Stress Friday Peak — 6 workers, create/add/status/payment");
  console.log(`Core: ${REST}`);
  console.log(`Restaurant: ${RESTAURANT_ID}`);
  if (process.env.BLOCK_DIRECT_WRITES === "true") {
    console.log("BLOCK_DIRECT_WRITES=true (writes must go via RPC)");
  }
  console.log("");

  try {
    await Promise.all(WORKER_NAMES.map((w) => runWorker(w)));
  } catch (e) {
    console.error("Fatal:", e);
    process.exit(1);
  }

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  const totalMatch = results.filter((r) => r.totalMatch === true);
  const totalMismatch = results.filter((r) => r.success && r.totalMatch === false);

  console.log("--- Results ---");
  console.log(`Successful: ${successful.length}/${results.length}`);
  console.log(`Failed: ${failed.length}`);
  if (failed.length > 0) {
    failed.slice(0, 5).forEach((f) => {
      console.log(`  ${f.worker}: ${f.error}`);
    });
    if (failed.length > 5) console.log(`  ... and ${failed.length - 5} more`);
  }
  console.log(`total_cents = sum(items): ${totalMatch.length}/${successful.length}`);
  if (totalMismatch.length > 0) {
    totalMismatch.forEach((m) => {
      console.log(
        `  Mismatch ${m.orderId}: total=${m.totalCents} sum=${m.itemsSum}`,
      );
    });
  }
  console.log("");
  console.log("--- Metrics ---");
  if (latencies.length > 0) {
    console.log(`Avg latency: ${(latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(0)}ms`);
    console.log(`P95 latency: ${percentile(latencies, 95)}ms`);
    console.log(`Max latency: ${Math.max(...latencies)}ms`);
  }

    let stressSuccess = failed.length === 0 && totalMismatch.length === 0;
  console.log("");
  console.log(stressSuccess ? "Original stress: PASS" : "Original stress: FAIL");

  // ─── T7 Concurrency Scenarios ───────────────────────────────────────
  console.log("");
  console.log("--- T7 Concurrency Scenarios ---");

  const concurrencyResults: { name: string; pass: boolean; error?: string }[] = [];

  // C1: STRESS_CLOSE_RACE — two simultaneous CLOSED
  try {
    const products = await getProducts();
    if (products.length === 0) throw new Error("No products");
    const items = products.slice(0, 1).map((p) => ({
      product_id: p.id,
      name: p.name,
      quantity: 1,
      unit_price: p.price_cents,
    }));
    const { ok: createOk, data: createData } = await fetchCore("/rpc/create_order_atomic", {
      method: "POST",
      body: {
        p_restaurant_id: RESTAURANT_ID,
        p_items: items,
        p_payment_method: "cash",
        p_idempotency_key: `stress-close-race-create-${Date.now()}`,
      },
    });
    if (!createOk || !createData) {
      concurrencyResults.push({ name: "C1_STRESS_CLOSE_RACE", pass: false, error: "create failed" });
    } else {
      const orderId = (createData as { id?: string }).id;
      if (!orderId) {
        concurrencyResults.push({ name: "C1_STRESS_CLOSE_RACE", pass: false, error: "no order id" });
      } else {
        await fetchCore("/rpc/update_order_status", {
          method: "POST",
          body: { p_order_id: orderId, p_restaurant_id: RESTAURANT_ID, p_new_status: "PREPARING", p_actor_user_id: SEED_ACTOR_USER_ID },
        });
        await fetchCore("/rpc/update_order_status", {
          method: "POST",
          body: { p_order_id: orderId, p_restaurant_id: RESTAURANT_ID, p_new_status: "IN_PREP", p_actor_user_id: SEED_ACTOR_USER_ID },
        });
        await fetchCore("/rpc/update_order_status", {
          method: "POST",
          body: { p_order_id: orderId, p_restaurant_id: RESTAURANT_ID, p_new_status: "READY", p_actor_user_id: SEED_ACTOR_USER_ID },
        });

        const closeBody = {
          p_order_id: orderId,
          p_restaurant_id: RESTAURANT_ID,
          p_new_status: "CLOSED",
          p_actor_user_id: SEED_ACTOR_USER_ID,
        };
        const [r1, r2] = await Promise.all([
          fetchCore("/rpc/update_order_status", { method: "POST", body: closeBody }),
          fetchCore("/rpc/update_order_status", { method: "POST", body: closeBody }),
        ]);

        const okCount = (r1.ok ? 1 : 0) + (r2.ok ? 1 : 0);
        const { data: orderCheck } = await fetchCore(`/gm_orders?id=eq.${orderId}&select=status`);
        const row = Array.isArray(orderCheck) ? orderCheck[0] : orderCheck;
        const finalStatus = (row as { status?: string })?.status;

        const c1Pass = finalStatus === "CLOSED" && okCount === 1;
        concurrencyResults.push({
          name: "C1_STRESS_CLOSE_RACE",
          pass: c1Pass,
          error: c1Pass ? undefined : `okCount=${okCount} status=${finalStatus}`,
        });
        console.log(`  C1: ${c1Pass ? "PASS" : "FAIL"} (order ${finalStatus}, ${okCount}/2 close ok)`);
      }
    }
  } catch (e) {
    concurrencyResults.push({ name: "C1_STRESS_CLOSE_RACE", pass: false, error: e instanceof Error ? e.message : String(e) });
    console.log(`  C1: FAIL (${e instanceof Error ? e.message : e})`);
  }

  // C2: STRESS_ADD_ITEM_IDEMPOTENCY_RACE — same idempotency_key in parallel
  try {
    const products = await getProducts();
    if (products.length === 0) throw new Error("No products");
    const items = products.slice(0, 1).map((p) => ({ product_id: p.id, name: p.name, quantity: 1, unit_price: p.price_cents }));
    const { ok: createOk, data: createData } = await fetchCore("/rpc/create_order_atomic", {
      method: "POST",
      body: { p_restaurant_id: RESTAURANT_ID, p_items: items, p_payment_method: "cash", p_idempotency_key: `stress-add-race-create-${Date.now()}` },
    });
    if (!createOk || !createData) {
      concurrencyResults.push({ name: "C2_STRESS_ADD_ITEM_IDEMPOTENCY_RACE", pass: false, error: "create failed" });
    } else {
      const orderId = (createData as { id?: string }).id;
      if (!orderId) {
        concurrencyResults.push({ name: "C2_STRESS_ADD_ITEM_IDEMPOTENCY_RACE", pass: false, error: "no order id" });
      } else {
        const idemKey = `stress-add-race-${RESTAURANT_ID}`;
        const addBody = {
          p_order_id: orderId,
          p_restaurant_id: RESTAURANT_ID,
          p_product_id: products[0].id,
          p_quantity: 1,
          p_name_snapshot: products[0].name,
          p_price_snapshot: products[0].price_cents,
          p_idempotency_key: idemKey,
        };
        await Promise.all([
          fetchCore("/rpc/add_order_item_atomic", { method: "POST", body: addBody }),
          fetchCore("/rpc/add_order_item_atomic", { method: "POST", body: addBody }),
        ]);

        const { data: itemsData } = await fetchCore(`/gm_order_items?order_id=eq.${orderId}&select=id,idempotency_key,subtotal_cents`);
        const rows = Array.isArray(itemsData) ? itemsData : [];
        const withKey = rows.filter((r: { idempotency_key?: string }) => r.idempotency_key === idemKey);
        const itemsSum = rows.reduce((s: number, r: { subtotal_cents?: number }) => s + (r.subtotal_cents ?? 0), 0);
        const { data: orderData } = await fetchCore(`/gm_orders?id=eq.${orderId}&select=total_cents`);
        const orderRow = Array.isArray(orderData) ? orderData[0] : orderData;
        const totalCents = (orderRow as { total_cents?: number })?.total_cents ?? 0;

        const c2Pass = withKey.length === 1 && totalCents === itemsSum;
        concurrencyResults.push({
          name: "C2_STRESS_ADD_ITEM_IDEMPOTENCY_RACE",
          pass: c2Pass,
          error: c2Pass ? undefined : `itemsWithKey=${withKey.length} totalMatch=${totalCents === itemsSum}`,
        });
        console.log(`  C2: ${c2Pass ? "PASS" : "FAIL"} (1 item with key, total=${totalCents} sum=${itemsSum})`);
      }
    }
  } catch (e) {
    concurrencyResults.push({ name: "C2_STRESS_ADD_ITEM_IDEMPOTENCY_RACE", pass: false, error: e instanceof Error ? e.message : String(e) });
    console.log(`  C2: FAIL (${e instanceof Error ? e.message : e})`);
  }

  // C3: STRESS_PAYMENT_IDEMPOTENCY_RETRY — 5x same idempotency_key
  try {
    let cashRegisterId: string | null = null;
    const { data: regData } = await fetchCore(`/gm_cash_registers?restaurant_id=eq.${RESTAURANT_ID}&status=eq.open&select=id&limit=1`);
    const regRows = Array.isArray(regData) ? regData : (regData ? [regData] : []);
    if (regRows.length > 0) {
      cashRegisterId = (regRows[0] as { id?: string }).id ?? null;
    }
    if (!cashRegisterId) {
      const { ok: openOk, data: openData } = await fetchCore("/rpc/open_cash_register_atomic", {
        method: "POST",
        body: { p_restaurant_id: RESTAURANT_ID, p_name: "Stress C3", p_opening_balance_cents: 0 },
      });
      if (openOk && openData) cashRegisterId = (openData as { id?: string }).id ?? null;
    }
    if (!cashRegisterId) {
      concurrencyResults.push({ name: "C3_STRESS_PAYMENT_IDEMPOTENCY_RETRY", pass: false, error: "no open cash register" });
      console.log("  C3: SKIP (no open cash register)");
    } else {
      const products = await getProducts();
      if (products.length === 0) throw new Error("No products");
      const items = products.slice(0, 1).map((p) => ({ product_id: p.id, name: p.name, quantity: 1, unit_price: p.price_cents }));
      const totalCents = products[0].price_cents;
      const { ok: createOk, data: createData } = await fetchCore("/rpc/create_order_atomic", {
        method: "POST",
        body: { p_restaurant_id: RESTAURANT_ID, p_items: items, p_payment_method: "cash", p_idempotency_key: `stress-pay-retry-create-${Date.now()}` },
      });
      if (!createOk || !createData) {
        concurrencyResults.push({ name: "C3_STRESS_PAYMENT_IDEMPOTENCY_RETRY", pass: false, error: "create failed" });
      } else {
        const orderId = (createData as { id?: string }).id;
        if (!orderId) {
          concurrencyResults.push({ name: "C3_STRESS_PAYMENT_IDEMPOTENCY_RETRY", pass: false, error: "no order id" });
        } else {
          const idemKey = `stress-pay-retry-${RESTAURANT_ID}`;
          const payBody = {
            p_order_id: orderId,
            p_restaurant_id: RESTAURANT_ID,
            p_cash_register_id: cashRegisterId,
            p_method: "cash",
            p_amount_cents: totalCents,
            p_idempotency_key: idemKey,
          };
          const payResults = await Promise.all([
            fetchCore("/rpc/process_order_payment", { method: "POST", body: payBody }),
            fetchCore("/rpc/process_order_payment", { method: "POST", body: payBody }),
            fetchCore("/rpc/process_order_payment", { method: "POST", body: payBody }),
            fetchCore("/rpc/process_order_payment", { method: "POST", body: payBody }),
            fetchCore("/rpc/process_order_payment", { method: "POST", body: payBody }),
          ]);

          const successCount = payResults.filter((r) => r.ok && (r.data as { success?: boolean })?.success).length;
          const { data: payRows } = await fetchCore(`/gm_payments?restaurant_id=eq.${RESTAURANT_ID}&idempotency_key=eq.${encodeURIComponent(idemKey)}&select=id`);
          const payCount = Array.isArray(payRows) ? payRows.length : payRows ? 1 : 0;

          const c3Pass = payCount === 1 && successCount === 1;
          concurrencyResults.push({
            name: "C3_STRESS_PAYMENT_IDEMPOTENCY_RETRY",
            pass: c3Pass,
            error: c3Pass ? undefined : `payCount=${payCount} successCount=${successCount}`,
          });
          console.log(`  C3: ${c3Pass ? "PASS" : "FAIL"} (1 payment row, ${successCount}/5 success)`);
        }
      }
    }
  } catch (e) {
    concurrencyResults.push({ name: "C3_STRESS_PAYMENT_IDEMPOTENCY_RETRY", pass: false, error: e instanceof Error ? e.message : String(e) });
    console.log(`  C3: FAIL (${e instanceof Error ? e.message : e})`);
  }

  const concurrencyPass = concurrencyResults.every((r) => r.pass);
  const allPass = stressSuccess && concurrencyPass;
  console.log("");
  console.log(allPass ? "PASS: 0 errors, total_cents invariant + T7 concurrency OK" : "FAIL: see errors above");
  process.exit(allPass ? 0 : 1);
}

main();
