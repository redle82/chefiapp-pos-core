#!/usr/bin/env npx ts-node
/**
 * Coverage ROI analysis for src/core.
 * Parses coverage-final.json, lists top files by uncovered branches,
 * classifies branches, ranks by ROI, outputs 5-test batch plan for #1.
 *
 * Usage:
 *   pnpm -w merchant-portal run test:coverage   # generate first
 *   npx ts-node scripts/coverage-core-roi.ts
 */

import * as fs from "fs";
import * as path from "path";

const COVERAGE_DIR =
  process.env.COVERAGE_DIR || path.join(process.cwd(), "merchant-portal", "coverage");
const COVERAGE_JSON = path.join(COVERAGE_DIR, "coverage-final.json");

type BranchMapEntry = {
  loc: { start: { line: number; column: number }; end: { line: number; column: number } };
  type: string;
  locations?: Array<{ start: { line?: number }; end: { line?: number } }>;
};

type FileCoverage = {
  path?: string;
  branchMap?: Record<string, BranchMapEntry>;
  b?: Record<string, number[]>;
  s?: Record<string, number>;
};

type IstanbulCoverage = Record<string, FileCoverage>;

interface UncoveredBranch {
  id: string;
  line: number;
  type: string;
  class: "if" | "switch" | "catch" | "logical" | "default-arg" | "other";
}

interface FileAnalysis {
  relPath: string;
  fullPath: string;
  totalBranches: number;
  uncoveredCount: number;
  uncovered: UncoveredBranch[];
  totalStatements: number;
  lineCount: number;
  branchDensity: number;
  mockComplexity: "low" | "medium" | "high";
  pathValue: "high" | "medium" | "low";
}

const CORE_PREFIX = "merchant-portal/src/core";
const HIGH_PATH_KEYWORDS = ["retry", "conflict", "idempotency", "transition", "error", "catch", "fallback"];
const HIGH_MOCK_FILES = ["CoreOrdersApi", "dockerCoreFetchClient", "validateInsforgeSetup", "RuntimeReader"];

function classifyType(typ: string): UncoveredBranch["class"] {
  if (typ === "if") return "if";
  if (typ === "switch") return "switch";
  if (typ === "catch" || typ === "throw") return "catch";
  if (["binary-expr", "cond-expr", "logical-expr"].includes(typ)) return "logical";
  if (typ === "default-arg") return "default-arg";
  return "other";
}

function analyzeFile(fullPath: string, entry: FileCoverage): FileAnalysis | null {
  const branchMap = entry.branchMap;
  const b = entry.b;
  if (!branchMap || !b) return null;

  const relPath = fullPath.includes(CORE_PREFIX)
    ? fullPath.slice(fullPath.indexOf(CORE_PREFIX) + CORE_PREFIX.length + 1).replace(/\\/g, "/")
    : fullPath;

  const uncovered: UncoveredBranch[] = [];
  for (const id of Object.keys(b)) {
    const hits = b[id];
    if (!Array.isArray(hits)) continue;
    const hasUncovered = hits.some((h) => h === 0);
    if (!hasUncovered) continue;

    const mapEntry = branchMap[id];
    if (!mapEntry?.loc?.start) continue;

    const line = mapEntry.loc.start.line;
    const typ = mapEntry.type || "other";
    uncovered.push({ id, line, type: typ, class: classifyType(typ) });
  }

  const totalBranches = Object.keys(branchMap).reduce((acc, id) => {
    const arr = b[id];
    return acc + (Array.isArray(arr) ? arr.length : 0);
  }, 0);

  const s = entry.s || {};
  const totalStatements = Object.keys(s).length;
  const lineCount = totalStatements; // proxy for file size

  const branchDensity = lineCount > 0 ? uncovered.length / lineCount : 0;

  const baseName = path.basename(fullPath, path.extname(fullPath));
  const mockComplexity = HIGH_MOCK_FILES.some((m) => baseName.includes(m)) ? "high" : 
    uncovered.some((u) => u.class === "catch" || u.class === "logical") ? "medium" : "low";

  const uncoveredText = JSON.stringify(uncovered.map((u) => u.line));
  const pathValue = HIGH_PATH_KEYWORDS.some((k) => relPath.toLowerCase().includes(k) || uncoveredText.includes(k))
    ? "high"
    : uncovered.some((u) => u.class === "catch" || u.class === "if") ? "medium" : "low";

  return {
    relPath,
    fullPath,
    totalBranches,
    uncoveredCount: uncovered.length,
    uncovered,
    totalStatements,
    lineCount,
    branchDensity,
    mockComplexity,
    pathValue,
  };
}

function pathValueScore(pv: string): number {
  if (pv === "high") return 3;
  if (pv === "medium") return 2;
  return 1;
}
function mockScore(mc: string): number {
  if (mc === "low") return 3;
  if (mc === "medium") return 2;
  return 1;
}

function main(): void {
  if (!fs.existsSync(COVERAGE_JSON)) {
    console.error(`${COVERAGE_JSON} not found. Run "pnpm -w merchant-portal run test:coverage" first.`);
    process.exit(1);
  }

  const raw = fs.readFileSync(COVERAGE_JSON, "utf-8");
  let data: IstanbulCoverage;
  try {
    data = JSON.parse(raw);
  } catch {
    console.error("Invalid JSON in coverage-final.json");
    process.exit(1);
  }

  const analyses: FileAnalysis[] = [];
  for (const [filePath, entry] of Object.entries(data)) {
    const n = path.normalize(filePath).replace(/\\/g, "/");
    if (!n.includes("/src/core/")) continue;
    if (n.includes("/locales/") || n.endsWith(".json")) continue;

    const a = analyzeFile(n, entry);
    if (a && a.uncoveredCount > 0) analyses.push(a);
  }

  analyses.sort((a, b) => b.uncoveredCount - a.uncoveredCount);
  const top15 = analyses.slice(0, 15);

  console.log("=".repeat(80));
  console.log("TOP 15 FILES UNDER src/core BY UNCOVERED BRANCHES");
  console.log("=".repeat(80));
  for (let i = 0; i < top15.length; i++) {
    const a = top15[i];
    const byClass = a.uncovered.reduce(
      (acc, u) => {
        acc[u.class] = (acc[u.class] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    console.log(`\n${i + 1}. ${a.relPath}`);
    console.log(`   Uncovered: ${a.uncoveredCount} / ${a.totalBranches} branches`);
    console.log(`   By type: ${JSON.stringify(byClass)}`);
    console.log(`   Lines: ${[...new Set(a.uncovered.map((u) => u.line))].sort((x, y) => x - y).join(", ")}`);
  }

  const maxUncovered = Math.max(1, ...analyses.map((a) => a.uncoveredCount));
  const roi = [...analyses].map((a) => {
    const norm = a.uncoveredCount / maxUncovered;
    const ms = mockScore(a.mockComplexity);
    const pv = pathValueScore(a.pathValue);
    return { ...a, roi: norm * 100 * (ms * ms) * pv * (1 + a.branchDensity) };
  });
  roi.sort((a, b) => b.roi - a.roi);
  const top5 = roi.slice(0, 5);

  console.log("\n" + "=".repeat(80));
  console.log("TOP 5 HIGHEST ROI CORE FILES");
  console.log("=".repeat(80));
  for (let i = 0; i < top5.length; i++) {
    const a = top5[i];
    console.log(`\n${i + 1}. ${a.relPath}`);
    console.log(`   Uncovered: ${a.uncoveredCount} | Mock: ${a.mockComplexity} | PathValue: ${a.pathValue} | Density: ${a.branchDensity.toFixed(3)}`);
  }

  const first = top5[0];
  const lines = [...new Set(first.uncovered.map((u) => u.line))].sort((x, y) => x - y);

  console.log("\n" + "=".repeat(80));
  console.log(`5-TEST BATCH PLAN FOR: ${first.relPath}`);
  console.log("=".repeat(80));
  console.log(`
Target: ${first.uncoveredCount} uncovered branches across ${lines.length} lines.
Exact branch lines to hit: ${lines.join(", ")}

Suggested batch (group by logical path, not by line):
  Test 1: Lines ${lines.slice(0, Math.ceil(lines.length / 5)).join(", ")} — first cluster
  Test 2: Lines ${lines.slice(Math.ceil(lines.length / 5), Math.ceil((2 * lines.length) / 5)).join(", ")} — second cluster
  Test 3: Lines ${lines.slice(Math.ceil((2 * lines.length) / 5), Math.ceil((3 * lines.length) / 5)).join(", ")} — third cluster
  Test 4: Lines ${lines.slice(Math.ceil((3 * lines.length) / 5), Math.ceil((4 * lines.length) / 5)).join(", ")} — fourth cluster
  Test 5: Lines ${lines.slice(Math.ceil((4 * lines.length) / 5)).join(", ")} — fifth cluster

Uncovered branch details (id, line, type):
${first.uncovered.map((u) => `  ${u.id} L${u.line} ${u.type} (${u.class})`).join("\n")}
`);

  process.exit(0);
}

main();
