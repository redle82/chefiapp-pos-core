#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const viteConfigPath = path.join(root, "merchant-portal/vite.config.ts");
const mainDebugPath = path.join(root, "merchant-portal/src/main_debug.tsx");

if (!fs.existsSync(viteConfigPath)) {
  failures.push("MISSING_FILE: merchant-portal/vite.config.ts");
} else {
  const viteContent = fs.readFileSync(viteConfigPath, "utf8");
  const hasSwDisabledInDev =
    viteContent.includes("devOptions") && viteContent.includes("enabled: false");
  if (viteContent.includes("VitePWA") && !hasSwDisabledInDev) {
    failures.push("SW_DEV_ENABLED: VitePWA devOptions.enabled must be false in dev");
  }
}

if (!fs.existsSync(mainDebugPath)) {
  failures.push("MISSING_FILE: merchant-portal/src/main_debug.tsx");
} else {
  const mainContent = fs.readFileSync(mainDebugPath, "utf8");
  if (!mainContent.includes("import.meta.env.DEV")) {
    failures.push("DEV_GUARD_MISSING: main_debug.tsx must guard cleanup with import.meta.env.DEV");
  }
  if (!mainContent.includes("serviceWorker") || !mainContent.includes("unregister")) {
    failures.push("SW_UNREGISTER_MISSING: main_debug.tsx must unregister SW in DEV");
  }
}

if (failures.length) {
  console.error("[sw-not-in-dev] FAILED");
  for (const failure of failures) {
    console.error(`[sw-not-in-dev] ${failure}`);
  }
  process.exit(1);
}

console.log("[sw-not-in-dev] PASSED");
