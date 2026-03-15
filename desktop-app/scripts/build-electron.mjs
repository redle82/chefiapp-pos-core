#!/usr/bin/env node
/**
 * Build script for ChefIApp Desktop
 *
 * Steps:
 * 1. Build merchant-portal (Vite production build)
 * 2. Copy merchant-portal/dist/ → desktop-app/resources/frontend/
 * 3. Compile Electron main/preload with tsc
 * 4. Run electron-builder
 */

import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const WORKSPACE_ROOT = path.resolve(ROOT, "..");
const MERCHANT_PORTAL = path.join(WORKSPACE_ROOT, "merchant-portal");
const FRONTEND_DEST = path.join(ROOT, "resources", "frontend");

function run(cmd, opts = {}) {
  console.log(`\n▸ ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: ROOT, ...opts });
}

function step(label) {
  console.log(`\n${"═".repeat(60)}\n  ${label}\n${"═".repeat(60)}`);
}

// ── Step 1: Build merchant-portal with electron target ──────────────

step("1/4 — Building merchant-portal (electron target)");
run("pnpm run build", {
  cwd: MERCHANT_PORTAL,
  env: {
    ...process.env,
    VITE_BUILD_TARGET: "electron",
  },
});

// ── Step 2: Copy dist → resources/frontend ──────────────────────────

step("2/4 — Copying merchant-portal dist to resources/frontend");

const distSrc = path.join(MERCHANT_PORTAL, "dist");
if (!existsSync(distSrc)) {
  console.error("❌  merchant-portal/dist/ not found — build may have failed.");
  process.exit(1);
}

if (existsSync(FRONTEND_DEST)) {
  rmSync(FRONTEND_DEST, { recursive: true });
}
mkdirSync(FRONTEND_DEST, { recursive: true });
cpSync(distSrc, FRONTEND_DEST, { recursive: true });
console.log(`✓ Copied to ${FRONTEND_DEST}`);

// ── Step 3a: Copy production node_modules (tsc + electron-builder need them) ─────

step("3a — Copying production node_modules (for tsc and packaging)");

// pnpm hoists to workspace root; copy deps into desktop-app/node_modules so tsc
// can resolve electron-log/electron-store and electron-builder can bundle asar.
run("node scripts/copy-deps.mjs", { cwd: ROOT });

// ── Step 3b: Compile Electron source (tsc) ───────────────────────────

step("3b/4 — Compiling Electron TypeScript");
run("pnpm run build");

// ── Step 4: Package with electron-builder ───────────────────────────

step("4/4 — Packaging with electron-builder");

const platform = process.argv.includes("--win") ? "dist:win" : "dist:mac";
// pnpm hoists deps to workspace root; ensure electron-builder can resolve them.
run(`pnpm run ${platform}`, {
  env: {
    ...process.env,
    NODE_PATH: path.join(WORKSPACE_ROOT, "node_modules"),
  },
});

console.log("\n✅  Desktop build complete!");
