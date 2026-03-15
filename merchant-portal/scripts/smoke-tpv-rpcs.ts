/**
 * P0.4 — Smoke-test das RPCs mínimas do TPV (fluxo soberano).
 * Garante que create_order_atomic (e opcionalmente create_device_pairing_code) estão disponíveis no Core/Supabase.
 *
 * Uso: cd merchant-portal && pnpm tsx scripts/smoke-tpv-rpcs.ts
 * Requer: .env.local com VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (ou SUPABASE_SERVICE_ROLE_KEY) e um restaurant_id válido.
 * Opcional: RESTAURANT_ID=uuid para testar create_order_atomic; caso contrário tenta obter o primeiro restaurante.
 */
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const envLocal = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
else dotenv.config();

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const REST_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  apikey: SERVICE_KEY || ANON_KEY || "",
  Authorization: `Bearer ${SERVICE_KEY || ANON_KEY || ""}`,
};

async function main() {
  if (!SUPABASE_URL || (!ANON_KEY && !SERVICE_KEY)) {
    console.error("❌ Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (ou SUPABASE_SERVICE_ROLE_KEY) em .env.local");
    process.exit(1);
  }

  const base = `${SUPABASE_URL}/rest/v1`;
  let restaurantId = process.env.RESTAURANT_ID;

  if (!restaurantId) {
    const res = await fetch(`${base}/gm_restaurants?select=id&limit=1`, { headers: REST_HEADERS });
    if (!res.ok) {
      console.error("❌ Falha ao obter restaurante:", res.status, await res.text());
      process.exit(1);
    }
    const data = await res.json();
    restaurantId = data?.[0]?.id;
    if (!restaurantId) {
      console.error("❌ Nenhum restaurante encontrado. Crie um com o seed (seed-e2e-user.ts) ou defina RESTAURANT_ID.");
      process.exit(1);
    }
    console.log("📍 Restaurante para teste:", restaurantId);
  }

  // Opcional: obter um product_id do restaurante (alguns schemas exigem product_id em gm_order_items)
  let productId: string | null = null;
  const productsRes = await fetch(
    `${base}/gm_products?restaurant_id=eq.${restaurantId}&select=id&limit=1`,
    { headers: REST_HEADERS }
  );
  if (productsRes.ok) {
    const products = await productsRes.json();
    productId = products?.[0]?.id ?? null;
  }

  // 1. create_order_atomic
  console.log("\n🔹 Testando create_order_atomic...");
  const orderItem: Record<string, unknown> = {
    name: "Smoke test item",
    quantity: 1,
    unit_price: 100,
  };
  if (productId) orderItem.product_id = productId;
  const orderPayload = {
    p_restaurant_id: restaurantId,
    p_items: [orderItem],
    p_payment_method: "cash",
    p_sync_metadata: null,
  };
  const orderRes = await fetch(`${base}/rpc/create_order_atomic`, {
    method: "POST",
    headers: REST_HEADERS,
    body: JSON.stringify(orderPayload),
  });
  const orderText = await orderRes.text();
  if (!orderRes.ok) {
    console.error("❌ create_order_atomic falhou:", orderRes.status, orderText);
    process.exit(1);
  }
  const orderData = orderText ? JSON.parse(orderText) : null;
  console.log("✅ create_order_atomic OK", orderData ? `→ order id ${orderData?.id}` : "");

  // 2. create_device_pairing_code (pode não existir no Supabase)
  console.log("\n🔹 Testando create_device_pairing_code...");
  const pairingRes = await fetch(`${base}/rpc/create_device_pairing_code`, {
    method: "POST",
    headers: REST_HEADERS,
    body: JSON.stringify({
      p_restaurant_id: restaurantId,
      p_device_type: "TPV",
      p_device_name: "smoke-test",
    }),
  });
  if (pairingRes.status === 404) {
    console.log("⚠️ create_device_pairing_code não existe no schema (404). Adicione a migration se precisar de pairing TPV.");
  } else if (!pairingRes.ok) {
    console.error("❌ create_device_pairing_code:", pairingRes.status, await pairingRes.text());
  } else {
    const pairingData = await pairingRes.json();
    console.log("✅ create_device_pairing_code OK", pairingData ? `→ code disponível` : "");
  }

  console.log("\n✅ Smoke-test TPV RPCs concluído.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
