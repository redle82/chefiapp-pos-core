#!/usr/bin/env npx ts-node
/**
 * Mapa matemático: ficheiros que mais movem o global.
 *
 * Rank por: total branches | uncovered | densidade uncovered
 * Meta: identificar ficheiros com 80–150+ branches onde atacar.
 *
 * Usage:
 *   pnpm -w merchant-portal run test:coverage   # gerar primeiro
 *   npx ts-node scripts/coverage-branch-weight-map.ts
 */

import * as fs from "fs";
import * as path from "path";

const COVERAGE_DIR =
  process.env.COVERAGE_DIR || path.join(process.cwd(), "merchant-portal", "coverage");
const COVERAGE_JSON = path.join(COVERAGE_DIR, "coverage-final.json");

type BranchMapEntry = {
  loc?: { start?: { line?: number }; end?: { line?: number } };
  type?: string;
};

type FileCoverage = {
  branchMap?: Record<string, BranchMapEntry>;
  b?: Record<string, number[]>;
};

type IstanbulCoverage = Record<string, FileCoverage>;

interface FileStats {
  relPath: string;
  totalBranches: number;
  coveredBranches: number;
  uncoveredCount: number;
  uncoveredDensity: number; // uncovered / total (0–1)
  pathValue: "core" | "infra" | "domain" | "other";
}

const SKIP_PATTERNS = ["/locales/", ".json", "node_modules", ".test.", ".spec."];

function analyzeFile(fullPath: string, entry: FileCoverage): FileStats | null {
  const branchMap = entry.branchMap;
  const b = entry.b;
  if (!branchMap || !b) return null;

  const norm = fullPath.replace(/\\/g, "/");
  const merchantIdx = norm.indexOf("/merchant-portal/src/");
  const relPath = merchantIdx >= 0 ? norm.slice(merchantIdx + "/merchant-portal/src/".length) : path.basename(fullPath);

  if (SKIP_PATTERNS.some((p) => relPath.includes(p))) return null;

  let totalBranches = 0;
  let coveredBranches = 0;
  let uncoveredCount = 0;

  for (const id of Object.keys(branchMap)) {
    const hits = b[id];
    if (!Array.isArray(hits)) continue;
    const branchCount = hits.length;
    totalBranches += branchCount;
    const hasUncovered = hits.some((h) => h === 0);
    if (hasUncovered) {
      uncoveredCount += hits.filter((h) => h === 0).length;
    }
    coveredBranches += hits.filter((h) => h > 0).length;
  }

  if (totalBranches === 0) return null;

  const uncoveredDensity = uncoveredCount / totalBranches;

  let pathValue: FileStats["pathValue"] = "other";
  if (relPath.includes("/core/")) pathValue = "core";
  else if (relPath.includes("/infra/") || relPath.includes("/infra")) pathValue = "infra";
  else if (relPath.includes("/domain/")) pathValue = "domain";

  return {
    relPath,
    totalBranches,
    coveredBranches,
    uncoveredCount,
    uncoveredDensity,
    pathValue,
  };
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

  const all: FileStats[] = [];
  for (const [filePath, entry] of Object.entries(data)) {
    const n = path.normalize(filePath).replace(/\\/g, "/");
    const s = analyzeFile(n, entry);
    if (s && s.uncoveredCount > 0) all.push(s);
  }

  const globalTotal = all.reduce((a, f) => a + f.totalBranches, 0);
  const globalCovered = all.reduce((a, f) => a + f.coveredBranches, 0);
  const globalUncovered = all.reduce((a, f) => a + f.uncoveredCount, 0);
  const globalPct = globalTotal > 0 ? (100 * globalCovered) / globalTotal : 0;

  const targetPct = 45;
  const neededCovered = Math.ceil((targetPct / 100) * globalTotal) - globalCovered;
  const needed = Math.max(0, neededCovered);

  console.log("═".repeat(80));
  console.log("MAPA MATEMÁTICO — BRANCH COVERAGE GLOBAL");
  console.log("═".repeat(80));
  console.log(`
  Total branches:     ${globalTotal}
  Covered:            ${globalCovered}
  Uncovered:          ${globalUncovered}
  Global %:           ${globalPct.toFixed(2)}%
  
  Para ${targetPct}%: precisas de +${needed} branches cobertos
  Impacto por branch: +${(100 / globalTotal).toFixed(4)}pp
`);

  // Top 10 por total branches (ficheiros grandes)
  const byTotal = [...all].sort((a, b) => b.totalBranches - a.totalBranches);
  console.log("─".repeat(80));
  console.log("TOP 10 — POR TOTAL BRANCHES (ficheiros que pesam mais no denominador)");
  console.log("─".repeat(80));
  for (let i = 0; i < Math.min(10, byTotal.length); i++) {
    const f = byTotal[i];
    const pp = (f.totalBranches / globalTotal * 100).toFixed(2);
    console.log(`  ${(i + 1).toString().padStart(2)}. ${f.relPath}`);
    console.log(`      total: ${f.totalBranches} | uncovered: ${f.uncoveredCount} | ${pp}% do global`);
  }

  // Top 10 por uncovered (oportunidade bruta)
  const byUncovered = [...all].sort((a, b) => b.uncoveredCount - a.uncoveredCount);
  console.log("\n" + "─".repeat(80));
  console.log("TOP 10 — POR UNCOVERED (maior oportunidade líquida)");
  console.log("─".repeat(80));
  for (let i = 0; i < Math.min(10, byUncovered.length); i++) {
    const f = byUncovered[i];
    const ppIfClose = (f.uncoveredCount / globalTotal * 100).toFixed(2);
    console.log(`  ${(i + 1).toString().padStart(2)}. ${f.relPath}`);
    console.log(`      uncovered: ${f.uncoveredCount} | total: ${f.totalBranches} | se fechares tudo: +${ppIfClose}pp`);
  }

  // Top 10 por densidade uncovered (uncovered/total) — muitos uncovered no mesmo ficheiro
  const byDensity = [...all]
    .filter((f) => f.totalBranches >= 20)
    .sort((a, b) => b.uncoveredDensity - a.uncoveredDensity);
  console.log("\n" + "─".repeat(80));
  console.log("TOP 10 — POR DENSIDADE UNCOVERED (≥20 branches, maior % descoberto)");
  console.log("─".repeat(80));
  for (let i = 0; i < Math.min(10, byDensity.length); i++) {
    const f = byDensity[i];
    const pct = (100 * f.uncoveredDensity).toFixed(1);
    console.log(`  ${(i + 1).toString().padStart(2)}. ${f.relPath}`);
    console.log(`      ${pct}% uncovered | ${f.uncoveredCount}/${f.totalBranches}`);
  }

  // Sprint targets: ficheiros com 80+ total e 30+ uncovered
  const sprintTargets = all.filter((f) => f.totalBranches >= 80 && f.uncoveredCount >= 30);
  sprintTargets.sort((a, b) => b.uncoveredCount - a.uncoveredCount);

  console.log("\n" + "═".repeat(80));
  console.log("TARGETS PARA SPRINT (≥80 total branches, ≥30 uncovered)");
  console.log("═".repeat(80));
  if (sprintTargets.length === 0) {
    const fallback = all.filter((f) => f.uncoveredCount >= 20).sort((a, b) => b.uncoveredCount - a.uncoveredCount);
    console.log("  Nenhum ficheiro com 80+/30+. Alternativa: ≥20 uncovered:\n");
    for (let i = 0; i < Math.min(10, fallback.length); i++) {
      const f = fallback[i];
      console.log(`  ${(i + 1).toString().padStart(2)}. ${f.relPath} — ${f.uncoveredCount} uncovered / ${f.totalBranches} total`);
    }
  } else {
    for (let i = 0; i < sprintTargets.length; i++) {
      const f = sprintTargets[i];
      const pp = (f.uncoveredCount / globalTotal * 100).toFixed(2);
      console.log(`  ${(i + 1).toString().padStart(2)}. ${f.relPath}`);
      console.log(`      uncovered: ${f.uncoveredCount} | total: ${f.totalBranches} | potencial: +${pp}pp`);
    }
  }

  // Resumo estratégico
  console.log("\n" + "═".repeat(80));
  console.log("RESUMO ESTRATÉGICO");
  console.log("═".repeat(80));
  console.log(`
  1. Ficheiros com 40–50 branches não movem o global.
  2. Foca em ficheiros com 80–150+ total e 30+ uncovered.
  3. Um ficheiro com 100 uncovered que feches 40 → +0.5pp.
  4. Seis ficheiros com 20 cada que feches 20 → +0.25pp (mais esforço).
  
  Próximo passo: escolher 1 ficheiro do sprint target e atacar 20–40 branches.
`);
  process.exit(0);
}

main();
