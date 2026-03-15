#!/usr/bin/env npx tsx
/**
 * Smoke P0 Soberano — Checklist repetível e evidência objetiva
 *
 * Lê credenciais do seed (e2e-creds.json) e imprime:
 * - restaurant_id esperado (para comparar com localStorage em cada superfície)
 * - Checklist passo a passo
 * - One-liner para verificação na consola do browser
 *
 * Uso:
 *   cd merchant-portal && pnpm tsx scripts/smoke-sovereign-p0.ts
 *   # Ou com restaurant_id por env (se não tiver creds):
 *   E2E_RESTAURANT_ID=xxx pnpm tsx scripts/smoke-sovereign-p0.ts
 *
 * Ref: docs/ops/P0_SOBERANO_SMOKE_FLOW.md
 */

import fs from "fs";
import path from "path";

const CREDENTIALS_PATH = path.resolve(
  process.cwd(),
  "tests/e2e/e2e-creds.json",
);
const EXPECTED_RESTAURANT_ID =
  process.env.E2E_RESTAURANT_ID || process.env.SOVEREIGN_RESTAURANT_ID;

interface SovereignCreds {
  email?: string;
  password?: string;
  name?: string;
  user_id?: string;
  restaurant_id?: string;
}

function loadCreds(): SovereignCreds | null {
  if (!fs.existsSync(CREDENTIALS_PATH)) return null;
  try {
    const raw = fs.readFileSync(CREDENTIALS_PATH, "utf-8");
    return JSON.parse(raw) as SovereignCreds;
  } catch {
    return null;
  }
}

function main() {
  const creds = loadCreds();
  const restaurantId =
    creds?.restaurant_id ?? EXPECTED_RESTAURANT_ID ?? null;

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(" P0 Soberano — Smoke checklist");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");

  if (!restaurantId) {
    console.log("❌ Nenhum restaurant_id disponível.");
    console.log("   Execute primeiro: pnpm tsx scripts/seed-e2e-user.ts");
    console.log("   Ou defina: E2E_RESTAURANT_ID=<uuid>");
    console.log("");
    process.exit(1);
  }

  console.log("Restaurant ID esperado (em todas as superfícies):");
  console.log("  ", restaurantId);
  console.log("");
  if (creds?.email) {
    console.log("Login (do seed):");
    console.log("  Email:   ", creds.email);
    console.log("  Password:", creds.password ?? "(ver e2e-creds.json)");
    console.log("");
  }

  console.log("--- Checklist ---");
  console.log("1. Portal em dev: pnpm --filter merchant-portal run dev");
  console.log("2. Abrir http://localhost:5175/auth (ou /auth/login)");
  console.log("3. Login com o user do seed");
  console.log("4. Consola do browser: deve aparecer [TenantResolver] 🔒 Tenant Sealed:", restaurantId);
  console.log("5. Em cada superfície, na consola executar:");
  console.log("   localStorage.getItem('chefiapp_restaurant_id')");
  console.log("   → Deve devolver:", restaurantId);
  console.log("");
  console.log("--- Superfícies a validar ---");
  console.log("  Admin:    /admin/config/general ou /admin/modules");
  console.log("  TPV:      /op/tpv");
  console.log("  KDS:      /op/kds");
  console.log("  AppStaff: /app/staff/home");
  console.log("");
  console.log("--- One-liner (colar na consola do browser, após login) ---");
  console.log(
    "  localStorage.getItem('chefiapp_restaurant_id') === '" + restaurantId + "' ? '✅ OK' : '❌ divergente: ' + localStorage.getItem('chefiapp_restaurant_id')",
  );
  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
}

main();
