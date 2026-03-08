#!/usr/bin/env node
/**
 * Copies production dependencies (+ transitives) from the workspace root
 * node_modules into desktop-app/node_modules/ so electron-builder can
 * bundle them into the asar.
 *
 * Required because pnpm with node-linker=hoisted puts everything at the
 * workspace root, and electron-builder only looks inside the app directory.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const WS = path.resolve(ROOT, "..");
const localNM = path.join(ROOT, "node_modules");
const rootNM = path.join(WS, "node_modules");

// Clear local node_modules
if (existsSync(localNM)) rmSync(localNM, { recursive: true });
mkdirSync(localNM, { recursive: true });

// Read prod deps from package.json
const pkg = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8"));
const prodDeps = Object.keys(pkg.dependencies || {});

const visited = new Set();
const queue = [...prodDeps];

while (queue.length > 0) {
  const dep = queue.shift();
  if (visited.has(dep)) continue;
  visited.add(dep);

  const src = path.join(rootNM, dep);
  if (!existsSync(src)) {
    console.warn("⚠ MISS:", dep);
    continue;
  }

  const dest = path.join(localNM, dep);
  if (!existsSync(dest)) {
    const dir = path.dirname(dest);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    cpSync(src, dest, { recursive: true });
    console.log("✓", dep);
  }

  try {
    const subPkg = JSON.parse(
      readFileSync(path.join(src, "package.json"), "utf8"),
    );
    for (const sub of Object.keys(subPkg.dependencies || {})) {
      if (!visited.has(sub)) queue.push(sub);
    }
  } catch {
    /* no package.json or parse error — skip */
  }
}

console.log(`→ ${visited.size} packages copied to desktop-app/node_modules/`);
