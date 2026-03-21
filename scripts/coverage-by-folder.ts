#!/usr/bin/env npx ts-node
/**
 * Report coverage by subfolder (Core vs Infra).
 * Parses merchant-portal/coverage/coverage-final.json and groups by path.
 *
 * Usage:
 *   pnpm -w merchant-portal run test:coverage   # generate coverage first
 *   npx ts-node scripts/coverage-by-folder.ts
 */

import * as fs from "fs";
import * as path from "path";

const COVERAGE_DIR =
  process.env.COVERAGE_DIR ||
  path.join(process.cwd(), "merchant-portal", "coverage");
const COVERAGE_JSON = path.join(COVERAGE_DIR, "coverage-final.json");

type IstanbulCoverage = Record<
  string,
  {
    s?: Record<string, number>;
    b?: Record<string, number[]>;
  }
>;

function branchStats(b: Record<string, number[]> | undefined): { total: number; covered: number } {
  if (!b || typeof b !== "object") return { total: 0, covered: 0 };
  let total = 0;
  let covered = 0;
  for (const key of Object.keys(b)) {
    const arr = b[key];
    if (!Array.isArray(arr)) continue;
    for (const hits of arr) {
      total += 1;
      if (hits > 0) covered += 1;
    }
  }
  return { total, covered };
}

function lineStats(s: Record<string, number> | undefined): { total: number; covered: number } {
  if (!s || typeof s !== "object") return { total: 0, covered: 0 };
  let total = 0;
  let covered = 0;
  for (const key of Object.keys(s)) {
    total += 1;
    if ((s[key] as number) > 0) covered += 1;
  }
  return { total, covered };
}

const CORE_PREFIX = "merchant-portal/src/core/";
const FOLDERS = ["operational", "governance", "infra", "sovereignty", "db", "sync", "billing"];

function main(): void {
  if (!fs.existsSync(COVERAGE_JSON)) {
    console.error(
      `${COVERAGE_JSON} not found. Run "pnpm -w merchant-portal run test:coverage" first.`
    );
    process.exit(1);
  }

  const raw = fs.readFileSync(COVERAGE_JSON, "utf-8");
  let data: IstanbulCoverage;
  try {
    data = JSON.parse(raw) as IstanbulCoverage;
  } catch {
    console.error("Invalid JSON in coverage-final.json");
    process.exit(1);
  }

  const byFolder: Record<string, { branches: { t: number; c: number }; lines: { t: number; c: number } }> = {};
  for (const folder of FOLDERS) {
    byFolder[folder] = { branches: { t: 0, c: 0 }, lines: { t: 0, c: 0 } };
  }
  byFolder["other"] = { branches: { t: 0, c: 0 }, lines: { t: 0, c: 0 } };

  for (const [filePath, entry] of Object.entries(data)) {
    const n = path.normalize(filePath).replace(/\\/g, "/");
    if (!n.includes(CORE_PREFIX)) continue;

    const rel = n.slice(n.indexOf(CORE_PREFIX) + CORE_PREFIX.length);
    const folder = rel.split("/")[0];
    const target = FOLDERS.includes(folder) ? folder : "other";

    const br = branchStats(entry.b);
    const ln = lineStats(entry.s);
    byFolder[target].branches.t += br.total;
    byFolder[target].branches.c += br.covered;
    byFolder[target].lines.t += ln.total;
    byFolder[target].lines.c += ln.covered;
  }

  console.log("Coverage by core/ subfolder (branches | lines):\n");
  for (const folder of [...FOLDERS, "other"]) {
    const d = byFolder[folder];
    const brPct = d.branches.t > 0 ? (100 * d.branches.c) / d.branches.t : 0;
    const lnPct = d.lines.t > 0 ? (100 * d.lines.c) / d.lines.t : 0;
    console.log(
      `  core/${folder.padEnd(12)} branches: ${brPct.toFixed(1)}% (${d.branches.c}/${d.branches.t})  |  lines: ${lnPct.toFixed(1)}% (${d.lines.c}/${d.lines.t})`
    );
  }
  process.exit(0);
}

main();
