#!/usr/bin/env node
/**
 * Build script for ChefIApp Desktop
 *
 * Since the Electron shell loads chefiapp.com directly, there is no need
 * to build or bundle the frontend. Steps:
 *
 * 1. Compile Electron main/preload with tsc
 * 2. Package with electron-builder
 */

import { execSync } from "node:child_process";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: ROOT, ...opts });
}

function step(label) {
  console.log(`\n${"=".repeat(60)}\n  ${label}\n${"=".repeat(60)}`);
}

// ── Step 1: Compile Electron TypeScript ─────────────────────────────

step("1/2 — Compiling Electron TypeScript");
run("npm run build");

// ── Step 2: Package with electron-builder ───────────────────────────

step("2/2 — Packaging with electron-builder");

const platform = process.argv.includes("--win") ? "dist:win" : "dist:mac";
const WORKSPACE_ROOT = path.resolve(ROOT, "..");
run(`npx electron-builder --config electron-builder.yml ${process.argv.includes("--win") ? "--win" : "--mac"}`, {
  env: {
    ...process.env,
    NODE_PATH: path.join(WORKSPACE_ROOT, "node_modules"),
  },
});

console.log("\n  Desktop build complete!");
