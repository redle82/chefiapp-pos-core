/**
 * InsForge E2E RLS validation script
 *
 * Validates: (1) debug_jwt returns null without auth and object with sub when authenticated;
 * (2) SELECT isolation by tenant (user A sees only restaurant A);
 * (3) create_order_atomic rejects restaurant B when called as user A.
 *
 * Run: npx tsx scripts/insforge-e2e-rls.ts
 * Env: VITE_INSFORGE_URL, VITE_INSFORGE_ANON_KEY (required).
 * Optional (full E2E): INSFORGE_E2E_EMAIL, INSFORGE_E2E_PASSWORD, INSFORGE_E2E_RESTAURANT_A_ID, INSFORGE_E2E_RESTAURANT_B_ID
 */
// @ts-nocheck


import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const baseUrl = process.env.VITE_INSFORGE_URL;
const anonKey = process.env.VITE_INSFORGE_ANON_KEY;
const e2eEmail = process.env.INSFORGE_E2E_EMAIL;
const e2ePassword = process.env.INSFORGE_E2E_PASSWORD;
const restaurantAId = process.env.INSFORGE_E2E_RESTAURANT_A_ID;
const restaurantBId = process.env.INSFORGE_E2E_RESTAURANT_B_ID;

async function main() {
  if (!baseUrl || !anonKey) {
    console.error("Missing VITE_INSFORGE_URL or VITE_INSFORGE_ANON_KEY. Set in .env.local.");
    process.exit(1);
  }

  const { createClient } = await import("@insforge/sdk");
  const insforge = createClient({ baseUrl, anonKey });

  console.log("=== 1. debug_jwt without auth ===\n");
  const { data: jwtAnon, error: errAnon } = await insforge.database.rpc("debug_jwt");
  if (errAnon) {
    console.log("rpc('debug_jwt') error (expected without JWT):", errAnon.message);
  } else {
    console.log("debug_jwt (no auth):", jwtAnon === null ? "null" : JSON.stringify(jwtAnon));
  }
  const expectEmpty = jwtAnon == null || (typeof jwtAnon === "object" && Object.keys(jwtAnon as object).length === 0);
  console.log(expectEmpty ? "OK: JWT empty/null without auth\n" : "WARN: JWT had content without auth\n");

  if (!e2eEmail || !e2ePassword) {
    console.log("Skip auth + isolation + RPC tests (set INSFORGE_E2E_EMAIL, INSFORGE_E2E_PASSWORD for full E2E).");
    return;
  }

  console.log("=== 2. Sign in and debug_jwt with auth ===\n");
  const { data: signInData, error: signInErr } = await insforge.auth.signInWithPassword({
    email: e2eEmail,
    password: e2ePassword,
  });
  if (signInErr || !signInData?.accessToken) {
    console.error("Sign in failed:", signInErr?.message ?? "no accessToken");
    return;
  }
  const { data: jwtAuth } = await insforge.database.rpc("debug_jwt");
  const hasSub = jwtAuth != null && typeof jwtAuth === "object" && "sub" in (jwtAuth as object);
  console.log("debug_jwt (with auth):", jwtAuth === null ? "null" : JSON.stringify(jwtAuth));
  console.log(hasSub ? "OK: JWT has sub\n" : "FAIL: JWT missing sub — check InsForge JWT setting name\n");

  if (!restaurantAId || !restaurantBId) {
    console.log("Skip isolation + RPC tests (set INSFORGE_E2E_RESTAURANT_A_ID, INSFORGE_E2E_RESTAURANT_B_ID).");
    return;
  }

  console.log("=== 3. SELECT isolation (gm_restaurants) ===\n");
  const { data: restaurants, error: restErr } = await insforge.database.from("gm_restaurants").select("id, name");
  if (restErr) {
    console.error("gm_restaurants select error:", restErr.message);
    return;
  }
  const onlyA = (restaurants as { id: string }[]).every((r) => r.id === restaurantAId);
  console.log("Restaurants visible:", (restaurants as { id: string }[]).map((r) => r.id));
  console.log(onlyA ? "OK: Only own restaurant(s) visible\n" : "WARN: Other restaurants visible — check restaurant_users\n");

  console.log("=== 4. create_order_atomic: own restaurant (expect success) ===\n");
  const itemsA = [{ name: "E2E item", quantity: 1, unit_price: 100, product_id: null }];
  const { data: orderA, error: orderAErr } = await insforge.database.rpc("create_order_atomic", {
    p_restaurant_id: restaurantAId,
    p_items: itemsA,
  });
  if (orderAErr) {
    console.error("create_order_atomic(restaurant A) error:", orderAErr.message);
  } else {
    console.log("create_order_atomic(restaurant A) OK:", orderA);
  }

  console.log("\n=== 5. create_order_atomic: other restaurant (expect FORBIDDEN) ===\n");
  const { data: orderB, error: orderBErr } = await insforge.database.rpc("create_order_atomic", {
    p_restaurant_id: restaurantBId,
    p_items: itemsA,
  });
  const forbidden = orderBErr != null && (orderBErr.message?.includes("FORBIDDEN") ?? false);
  if (forbidden) {
    console.log("OK: create_order_atomic(restaurant B) rejected:", orderBErr?.message ?? "");
  } else {
    console.error("FAIL: create_order_atomic(restaurant B) should be FORBIDDEN. Error:", orderBErr?.message ?? "none", "Data:", orderB);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
