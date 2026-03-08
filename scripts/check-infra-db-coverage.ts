/**
 * Check infra + db coverage gate.
 * Reads coverage (Vitest Istanbul format), filters files under
 * merchant-portal/src/infra/, merchant-portal/src/core/infra/, merchant-portal/src/core/db/,
 * computes branch (and line) coverage, exits 1 if below target.
 *
 * Usage:
 *   pnpm -w merchant-portal run test -- --coverage   # generate coverage first
 *   npx ts-node scripts/check-infra-db-coverage.ts
 *
 * Target: INFRA_DB_COVERAGE_TARGET (default 60).
 * Coverage path: COVERAGE_DIR (default <cwd>/merchant-portal/coverage for runs from repo root).
 */

import * as fs from "fs";
import * as path from "path";

const COVERAGE_DIR =
  process.env.COVERAGE_DIR ||
  path.join(process.cwd(), "merchant-portal", "coverage");
const COVERAGE_JSON = path.join(COVERAGE_DIR, "coverage-final.json");
const TARGET = parseInt(
  process.env.INFRA_DB_COVERAGE_TARGET || "29",
  10
);

type IstanbulCoverage = Record<
  string,
  {
    s?: Record<string, number>;
    b?: Record<string, number[]>;
    f?: Record<string, number>;
  }
>;

const INFRA_DB_PATH_SEGMENTS = [
  "merchant-portal/src/infra/",
  "merchant-portal/src/core/infra/",
  "merchant-portal/src/core/db/",
];

function normalizePath(p: string): string {
  return path.normalize(p).replace(/\\/g, "/");
}

function isInfraOrDbFile(filePath: string): boolean {
  const n = normalizePath(filePath);
  if (!n.endsWith(".ts") && !n.endsWith(".tsx") && !n.endsWith(".js")) return false;
  return INFRA_DB_PATH_SEGMENTS.some((seg) => n.includes(seg));
}

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

function main(): void {
  if (!fs.existsSync(COVERAGE_JSON)) {
    console.error(
      `check-infra-db-coverage: ${COVERAGE_JSON} not found. Run "pnpm -w merchant-portal run test -- --coverage" first.`
    );
    process.exit(1);
  }

  const raw = fs.readFileSync(COVERAGE_JSON, "utf-8");
  let data: IstanbulCoverage;
  try {
    data = JSON.parse(raw) as IstanbulCoverage;
  } catch (e) {
    console.error("check-infra-db-coverage: invalid JSON in coverage-final.json");
    process.exit(1);
  }

  let totalBranches = 0;
  let coveredBranches = 0;
  let totalLines = 0;
  let coveredLines = 0;
  const files: string[] = [];

  for (const [filePath, entry] of Object.entries(data)) {
    if (!isInfraOrDbFile(filePath)) continue;
    files.push(filePath);
    const br = branchStats(entry.b);
    totalBranches += br.total;
    coveredBranches += br.covered;
    const ln = lineStats(entry.s);
    totalLines += ln.total;
    coveredLines += ln.covered;
  }

  const branchPct = totalBranches > 0 ? (100 * coveredBranches) / totalBranches : 0;
  const linePct = totalLines > 0 ? (100 * coveredLines) / totalLines : 0;

  console.log("Infra + DB coverage (merchant-portal infra/, core/infra/, core/db/):");
  console.log(`  Files: ${files.length}`);
  console.log(`  Branches: ${coveredBranches}/${totalBranches} (${branchPct.toFixed(1)}%)`);
  console.log(`  Lines: ${coveredLines}/${totalLines} (${linePct.toFixed(1)}%)`);
  console.log(`  Target: ${TARGET}%`);

  if (totalBranches === 0 && files.length === 0) {
    console.warn(
      "check-infra-db-coverage: no infra/db files in coverage. Run merchant-portal tests with --coverage."
    );
    process.exit(1);
  }

  if (branchPct < TARGET) {
    console.error(
      `check-infra-db-coverage: branch coverage ${branchPct.toFixed(1)}% is below target ${TARGET}%.`
    );
    process.exit(1);
  }

  console.log("check-infra-db-coverage: gate passed.");
  process.exit(0);
}

main();
