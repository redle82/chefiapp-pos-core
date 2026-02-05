#!/usr/bin/env npx tsx
/**
 * Seed Stripe (modo TESTE) — Ver números a subir no dashboard
 *
 * Cria N clientes e N subscrições (teste) para validar analíticos: 2, 10, 50, 100, 1000.
 *
 * Uso:
 *   STRIPE_SECRET_KEY=sk_test_xxx STRIPE_PRICE_ID=price_xxx npx tsx scripts/seed-stripe-test-analytics.ts [N]
 *   npx tsx scripts/seed-stripe-test-analytics.ts 10   # 10 restaurantes
 *   npx tsx scripts/seed-stripe-test-analytics.ts 100 # 100 restaurantes
 *
 * Pré-requisitos:
 *   - Stripe Dashboard em modo TEST (toggle no canto superior)
 *   - STRIPE_SECRET_KEY=sk_test_... (Developers → API keys)
 *   - STRIPE_PRICE_ID=price_... (Products → preço €79/mês em modo Test)
 *
 * Opcional: carregar de merchant-portal/.env.local (STRIPE_* não está lá por defeito; definir no ambiente).
 */

import Stripe from "stripe";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvLocal(): Record<string, string> {
  const path = resolve(
    process.cwd(),
    "merchant-portal/.env.local"
  );
  if (!existsSync(path)) return {};
  const raw = readFileSync(path, "utf-8");
  const out: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) {
      const key = m[1];
      const val = m[2].replace(/^["']|["']$/g, "").trim();
      if (key.startsWith("VITE_STRIPE_")) {
        out[key] = val;
      }
    }
  }
  return out;
}

function getConfig(): { secretKey: string; priceId: string } {
  const envLocal = loadEnvLocal();
  const secretKey =
    process.env.STRIPE_SECRET_KEY ||
    process.env.SK_TEST ||
    "";
  const priceId =
    process.env.STRIPE_PRICE_ID ||
    process.env.VITE_STRIPE_PRICE_ID ||
    envLocal.VITE_STRIPE_PRICE_ID ||
    "";
  if (!secretKey || !secretKey.startsWith("sk_test_")) {
    console.error("❌ Definir STRIPE_SECRET_KEY=sk_test_... (modo TESTE)");
    process.exit(1);
  }
  if (!priceId || !priceId.startsWith("price_")) {
    console.error("❌ Definir STRIPE_PRICE_ID=price_... (Stripe Dashboard → Products → preço em Test)");
    process.exit(1);
  }
  return { secretKey, priceId };
}

async function main() {
  const N = Math.min(
    Math.max(1, parseInt(process.argv[2] || "10", 10)),
    1000
  );
  const { secretKey, priceId } = getConfig();

  const stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" });

  console.log(`\n🔒 Stripe TEST — A criar ${N} clientes + ${N} subscrições (price: ${priceId})\n`);

  const customers: string[] = [];
  const subscriptions: string[] = [];

  for (let i = 1; i <= N; i++) {
    const email = `test-restaurant-${i}@chefiapp.test`;
    const name = `Restaurante Test ${i}`;

    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: { source: "seed-stripe-test-analytics", restaurant_index: String(i) },
      });
      customers.push(customer.id);

      const sub = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId, quantity: 1 }],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        metadata: { source: "seed-stripe-test-analytics", restaurant_index: String(i) },
      });
      subscriptions.push(sub.id);

      if (i % 10 === 0 || i === N) {
        console.log(`   ${i}/${N} — customer ${customer.id} | subscription ${sub.id} (${sub.status})`);
      }
    } catch (e: unknown) {
      const err = e as { message?: string; code?: string };
      console.error(`   ❌ i=${i} ${err.message || String(e)}`);
    }

    if (N > 50 && i % 50 === 0) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log(`\n✅ Concluído: ${customers.length} clientes, ${subscriptions.length} subscrições (incomplete até pagamento).`);
  console.log("   Dashboard Stripe (Test): Customers e Subscriptions devem ter subido.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
