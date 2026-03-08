/**
 * Check server coverage gate — Onda 0.
 * Reads coverage/coverage-final.json, filters files under server/,
 * computes branch (and optional line) coverage, exits 1 if below target.
 *
 * Usage:
 *   npm run test:coverage   # generate coverage first
 *   npx ts-node scripts/check-server-coverage.ts
 *
 * Target: SERVER_COVERAGE_BRANCHES_TARGET (default 84; meta Onda 6 é 87).
 */

import * as fs from "fs";
import * as path from "path";

const COVERAGE_DIR = process.env.COVERAGE_DIR || path.join(process.cwd(), "coverage");
const COVERAGE_JSON = path.join(COVERAGE_DIR, "coverage-final.json");
const TARGET_BRANCHES = parseInt(
  process.env.SERVER_COVERAGE_BRANCHES_TARGET || "84",
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

function normalizePath(p: string): string {
  return path.normalize(p).replace(/\\/g, "/");
}

function isServerFile(filePath: string): boolean {
  const n = normalizePath(filePath);
  return n.includes("/server/") && (n.endsWith(".ts") || n.endsWith(".js"));
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
      `check-server-coverage: ${COVERAGE_JSON} not found. Run "npm run test:coverage" first.`
    );
    process.exit(1);
  }

  const raw = fs.readFileSync(COVERAGE_JSON, "utf-8");
  let data: IstanbulCoverage;
  try {
    data = JSON.parse(raw) as IstanbulCoverage;
  } catch (e) {
    console.error("check-server-coverage: invalid JSON in coverage-final.json");
    process.exit(1);
  }

  let totalBranches = 0;
  let coveredBranches = 0;
  let totalLines = 0;
  let coveredLines = 0;
  const files: string[] = [];

  for (const [filePath, entry] of Object.entries(data)) {
    if (!isServerFile(filePath)) continue;
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

  console.log("Server coverage (server/**):");
  console.log(`  Files: ${files.length} (${files.map((f) => path.basename(f)).join(", ")})`);
  console.log(`  Branches: ${coveredBranches}/${totalBranches} (${branchPct.toFixed(1)}%)`);
  console.log(`  Statements/lines: ${coveredLines}/${totalLines} (${linePct.toFixed(1)}%)`);
  console.log(`  Target branches: ${TARGET_BRANCHES}%`);

  if (totalBranches === 0 && files.length === 0) {
    console.warn("check-server-coverage: no server files in coverage. Run tests that import server/.");
    process.exit(1);
  }

  if (branchPct < TARGET_BRANCHES) {
    console.error(
      `check-server-coverage: branch coverage ${branchPct.toFixed(1)}% is below target ${TARGET_BRANCHES}%.`
    );
    process.exit(1);
  }

  console.log("check-server-coverage: gate passed.");
  process.exit(0);
}

main();
