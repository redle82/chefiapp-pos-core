#!/usr/bin/env node
/**
 * Operational Device-Only Guardrails — OPERATIONAL_DEVICE_ONLY_CONTRACT.md
 *
 * Lei O1: /op/* routes wrapped with BrowserBlockGuard
 * Lei O2: CTA opens desktop via deep link/helper (no plain window.open('/op/*'))
 * Lei O3: SW not registered in dev (VitePWA devOptions.enabled = false, main_debug unregister)
 *
 * Optional: --doctor prints repo identity and checks duplicate Vite listeners on common ports.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const violations = [];

// ---------------------------------------------------------------------------
// O1: BrowserBlockGuard applied to /op/tpv and /op/kds
// ---------------------------------------------------------------------------
const routesPath = path.join(
  repoRoot,
  "merchant-portal/src/routes/OperationalRoutes.tsx",
);
const routesContent = readFileSync(routesPath, "utf8");

if (!routesContent.includes("BrowserBlockGuard")) {
  violations.push(
    "❌ OPERATIONAL_DEVICE_ONLY: BrowserBlockGuard not found in OperationalRoutes.",
  );
}

const tpvGuard =
  /BrowserBlockGuard.*requiredPlatform=\"desktop\".*moduleLabel=\"TPV\"/s;
const kdsGuard =
  /BrowserBlockGuard.*requiredPlatform=\"desktop\".*moduleLabel=\"KDS\"/s;

if (!tpvGuard.test(routesContent)) {
  violations.push(
    "❌ OPERATIONAL_DEVICE_ONLY: TPV route must use BrowserBlockGuard(desktop, 'TPV') with requiredPlatform=\"desktop\".",
  );
}
if (!kdsGuard.test(routesContent)) {
  violations.push(
    "❌ OPERATIONAL_DEVICE_ONLY: KDS route must use BrowserBlockGuard(desktop, 'KDS') with requiredPlatform=\"desktop\".",
  );
}

// ---------------------------------------------------------------------------
// O3: SW disabled in dev
// ---------------------------------------------------------------------------
const viteConfigPath = path.join(repoRoot, "merchant-portal/vite.config.ts");
const viteContent = readFileSync(viteConfigPath, "utf8");

const hasSwDisabledInDev =
  viteContent.includes("devOptions") && viteContent.includes("enabled: false");
if (viteContent.includes("VitePWA") && !hasSwDisabledInDev) {
  violations.push(
    "❌ OPERATIONAL_DEVICE_ONLY: VitePWA devOptions.enabled must be false in dev.",
  );
}

const mainDebugPath = path.join(repoRoot, "merchant-portal/src/main_debug.tsx");
const mainContent = readFileSync(mainDebugPath, "utf8");

if (!mainContent.includes("serviceWorker") || !mainContent.includes("unregister")) {
  violations.push(
    "❌ OPERATIONAL_DEVICE_ONLY: main_debug must unregister SW in DEV.",
  );
}
if (!mainContent.includes("import.meta.env.DEV")) {
  violations.push(
    "❌ OPERATIONAL_DEVICE_ONLY: SW cleanup must run when import.meta.env.DEV.",
  );
}

// ---------------------------------------------------------------------------
// O2: Admin CTA for TPV/KDS must use openOperationalWindow (not raw window.open)
// ---------------------------------------------------------------------------
const o2Files = [
  "merchant-portal/src/features/admin/modules/pages/ModulesPage.tsx",
  "merchant-portal/src/features/admin/software-tpv/pages/SoftwareTpvPage.tsx",
  "merchant-portal/src/pages/Activation/ActivationCenterPage.tsx",
  "merchant-portal/src/features/admin/modules/hooks/useDeviceInstall.ts",
];

for (const relPath of o2Files) {
  try {
    const content = readFileSync(path.join(repoRoot, relPath), "utf8");
    const usesHelper =
      content.includes("openOperationalWindow") ||
      content.includes("openOperationalInNewWindow") ||
      content.includes("openTpvInNewWindow") ||
      content.includes("openKdsInNewWindow");
    if (!usesHelper) {
      violations.push(
        `❌ OPERATIONAL_DEVICE_ONLY (O2): ${relPath} must use openOperationalWindow helpers for TPV/KDS CTA.`,
      );
    }
  } catch {
    /* file may not exist */
  }
}

// ---------------------------------------------------------------------------
// Doctor (best-effort): show repo identity + detect duplicate dev servers
// Enabled when running with --doctor
// ---------------------------------------------------------------------------
const isDoctor = process.argv.includes("--doctor");
if (isDoctor) {
  try {
    const sha = execSync("git rev-parse --short HEAD", { cwd: repoRoot })
      .toString()
      .trim();
    const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: repoRoot })
      .toString()
      .trim();
    console.log(`\n[doctor:dev] repo=${repoRoot}`);
    console.log(`[doctor:dev] git=${sha} (${branch})`);
  } catch {
    console.log(`\n[doctor:dev] repo=${repoRoot}`);
    console.log(`[doctor:dev] git=unknown`);
  }

  // Radiografia: instruções para validar [DEV_BUILD] + SW + localStorage no console
  console.log(
    "\n[doctor:dev] App-side fingerprint (DevTools Console):",
  );
  console.log(
    "  - Procura por [DEV_BUILD] — deve incluir: sha, surface, origin, path, api, sw, swState",
  );
  console.log(
    "  - Se [DEV_BUILD] não aparece: não estás a correr main_debug ou o build não é DEV.",
  );
  console.log(
    "\n[doctor:dev] SW check (DEV): DevTools → Application → Service Workers",
  );
  console.log(
    "  - Esperado: nenhum SW activated.",
  );
  console.log(
    "  - Se activated: Unregister + Application → Storage → Clear site data.",
  );
  console.log(
    "\n[doctor:dev] LocalStorage quick-check (DEV): DevTools Console:",
  );
  console.log(
    "  - localStorage.getItem('chefiapp_pilot_mode')",
  );
  console.log(
    "  - localStorage.getItem('chefiapp_restaurant_id')",
  );
  console.log(
    "  - Se diferirem do esperado, o runtime vai parecer 'outra app'.",
  );

  // Check common dev ports for multiple listeners (mac/linux best-effort)
  const portsToCheck = [5173, 5174, 5175];
  for (const p of portsToCheck) {
    try {
      const out = execSync(`lsof -nP -iTCP:${p} -sTCP:LISTEN || true`)
        .toString()
        .trim();
      if (out) {
        const lines = out.split("\n").filter(Boolean);
        const listenerRows = Math.max(0, lines.length - 1);
        console.log(`[doctor:dev] port ${p}: ${listenerRows} listener(s)`);
        if (listenerRows > 1) {
          violations.push(
            `❌ doctor:dev: multiple processes listening on port ${p}. Kill extra dev servers to avoid \"two admin\" illusions.`,
          );
        }
      } else {
        console.log(`[doctor:dev] port ${p}: 0 listener(s)`);
      }
    } catch {
      // ignore
    }
  }
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------
if (violations.length) {
  console.error("\nOperational Device-Only guardrails failed.\n");
  for (const v of violations) console.error(v + "\n");
  process.exit(1);
}

console.log("✅ Operational Device-Only guardrails OK");
