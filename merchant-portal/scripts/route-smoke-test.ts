#!/usr/bin/env npx tsx
/**
 * route-smoke-test.ts -- Validates route definitions against component imports.
 *
 * Checks:
 *   1. Every <Route path="..." element={<Comp />} /> has a valid component import
 *   2. Reports orphan routes (path defined but component import missing)
 *   3. Reports orphan page components (file exists in pages/ but no route references it)
 *   4. Summary: total routes, validated, orphan routes, orphan components
 *
 * Usage:
 *   npx tsx merchant-portal/scripts/route-smoke-test.ts
 *
 * Exit code: 0 = all pass, 1 = issues found
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MERCHANT = path.resolve(__dirname, "..");
const ROUTES_DIR = path.join(MERCHANT, "src/routes");
const PAGES_DIR = path.join(MERCHANT, "src/pages");

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function getAllFiles(dir: string, ext: string[]): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllFiles(full, ext));
    } else if (ext.some((e) => entry.name.endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// 1. Parse route files for <Route path="..." element={<ComponentName ...} />
// ---------------------------------------------------------------------------

interface RouteEntry {
  path: string;
  componentName: string;
  file: string;
  line: number;
}

function extractRoutes(file: string): RouteEntry[] {
  const content = fs.readFileSync(file, "utf-8");
  const lines = content.split("\n");
  const entries: RouteEntry[] = [];

  // Match: <Route path="/something" element={<ComponentName ... />}
  // Also handle multi-line by joining with context
  const routePathRe = /path=["']([^"']+)["']/;
  const elementRe = /element=\{?\s*<(\w+)/;

  for (let i = 0; i < lines.length; i++) {
    // Look at a window of 5 lines for multi-line Route declarations
    const window = lines.slice(i, i + 5).join(" ");
    const pathMatch = routePathRe.exec(window);
    const elemMatch = elementRe.exec(window);

    if (pathMatch && elemMatch && window.includes("<Route")) {
      entries.push({
        path: pathMatch[1],
        componentName: elemMatch[1],
        file,
        line: i + 1,
      });
    }
  }

  return entries;
}

// ---------------------------------------------------------------------------
// 2. Parse imports from route files
// ---------------------------------------------------------------------------

function extractImports(file: string): Set<string> {
  const content = fs.readFileSync(file, "utf-8");
  const imports = new Set<string>();
  // Match: import { Foo, Bar } from "..." or import Foo from "..."
  const importRe = /import\s+(?:\{([^}]+)\}|(\w+))\s+from/g;
  let match: RegExpExecArray | null;
  while ((match = importRe.exec(content)) !== null) {
    if (match[1]) {
      // Named imports
      for (const name of match[1].split(",")) {
        imports.add(name.trim().split(" as ")[0].trim());
      }
    }
    if (match[2]) {
      imports.add(match[2].trim());
    }
  }
  return imports;
}

// ---------------------------------------------------------------------------
// 3. Collect page component names from src/pages/
// ---------------------------------------------------------------------------

function getPageComponentNames(): Set<string> {
  const files = getAllFiles(PAGES_DIR, [".tsx", ".ts"]);
  const names = new Set<string>();
  for (const f of files) {
    const basename = path.basename(f, path.extname(f));
    // Skip test/spec files, index files, and style files
    if (/\.(test|spec|stories|module)/.test(basename)) continue;
    if (basename === "index") {
      // Use parent folder name
      const parent = path.basename(path.dirname(f));
      names.add(parent);
    } else {
      names.add(basename);
    }
  }
  return names;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log("Route Smoke Test");
  console.log("=".repeat(60));

  // Gather route files (non-test .tsx files)
  const routeFiles = getAllFiles(ROUTES_DIR, [".tsx"])
    .filter((f) => !f.includes(".test."));

  if (routeFiles.length === 0) {
    console.log("No route files found in", ROUTES_DIR);
    process.exit(1);
  }

  console.log(`\nFound ${routeFiles.length} route file(s):\n`);
  for (const f of routeFiles) {
    console.log(`  ${path.relative(MERCHANT, f)}`);
  }

  // Extract all routes and imports per file
  const allRoutes: RouteEntry[] = [];
  const allImports = new Set<string>();

  for (const file of routeFiles) {
    const routes = extractRoutes(file);
    const imports = extractImports(file);
    allRoutes.push(...routes);
    for (const imp of imports) allImports.add(imp);
  }

  console.log(`\nTotal routes found: ${allRoutes.length}\n`);

  // Check each route's component is imported
  const orphanRoutes: RouteEntry[] = [];
  const validatedRoutes: RouteEntry[] = [];

  // Built-in React Router components that don't need page imports
  const builtins = new Set([
    "Navigate", "Outlet", "Route", "Routes",
    "Suspense", "Fragment", "ErrorBoundary",
  ]);

  for (const route of allRoutes) {
    if (builtins.has(route.componentName) || allImports.has(route.componentName)) {
      validatedRoutes.push(route);
    } else {
      orphanRoutes.push(route);
    }
  }

  // Find page components that have no route referencing them
  const pageComponents = getPageComponentNames();
  const routedComponentNames = new Set(allRoutes.map((r) => r.componentName));
  const orphanPages: string[] = [];

  for (const pageName of pageComponents) {
    // Check if any route references this component or a variant of its name
    const isReferenced = routedComponentNames.has(pageName) ||
      allImports.has(pageName);
    if (!isReferenced) {
      orphanPages.push(pageName);
    }
  }

  // Report
  console.log("--- Results ---\n");
  console.log(`  Total routes:        ${allRoutes.length}`);
  console.log(`  Validated:           ${validatedRoutes.length}`);
  console.log(`  Orphan routes:       ${orphanRoutes.length}`);
  console.log(`  Orphan pages:        ${orphanPages.length}`);

  if (orphanRoutes.length > 0) {
    console.log("\nOrphan routes (component not found in imports):");
    for (const r of orphanRoutes) {
      console.log(`  ${r.path} -> <${r.componentName} /> (${path.relative(MERCHANT, r.file)}:${r.line})`);
    }
  }

  if (orphanPages.length > 0) {
    console.log("\nOrphan pages (exist in pages/ but no route references them):");
    for (const p of orphanPages.sort()) {
      console.log(`  ${p}`);
    }
  }

  console.log("");

  if (orphanRoutes.length > 0) {
    console.log("FAIL: Found orphan routes with missing component imports.");
    process.exit(1);
  }

  console.log("PASS: All routes have valid component imports.");
  process.exit(0);
}

main();
