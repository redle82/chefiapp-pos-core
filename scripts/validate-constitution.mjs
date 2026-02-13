#!/usr/bin/env node

/**
 * CONSTITUTION VALIDATOR - Auto-Destruição
 *
 * Este script FALHA o build se arquivos proibidos existirem.
 * Não é informativo. É executivo.
 *
 * Regra: Se este script falhar, o sistema não pode ser construído.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// ============================================================================
// CONSTITUIÇÃO EXECUTIVA - ÚNICA VERDADE
// ============================================================================

const FORBIDDEN_FILES = [
  // Landing duplicada
  "landing-page/src",
  "merchant-portal/src/pages/OldLanding.tsx",
  "merchant-portal/src/pages/LandingOld.tsx",

  // Login antigo (substituído por AuthPage)
  "merchant-portal/src/pages/LoginPage.tsx",

  // FlowGate duplicado
  "merchant-portal/src/core/flow/OldFlowGate.tsx",
  "merchant-portal/src/core/flow/FlowGateOld.tsx",

  // Rotas mortas (comentado - ainda em uso, mas precisa revisão)
  // 'merchant-portal/src/pages/BootstrapPage.tsx', // TODO: Revisar se ainda é necessário
];

const FORBIDDEN_PATTERNS = [
  // Imports de arquivos proibidos (LoginPage antigo, não PhoneLoginPage)
  /import\s*{\s*LoginPage\s*}/i,
  /from\s*['"]\..*\/LoginPage['"]/i,
  /import.*OldLanding/i,
  /from.*OldLanding/i,
];

// AuthPage.tsx removido da lista: fluxo atual é landing → demo → onboarding/dashboard (sem tela de auth dedicada). Ver DOC_INDEX / core frozen.
// Landing canónica única: LandingV2 (docs/strategy/LANDING_CANON.md). LandingPage.tsx obsoleto.
const REQUIRED_FILES = [
  "merchant-portal/src/core/flow/FlowGate.tsx",
  "merchant-portal/src/pages/LandingV2/LandingV2Page.tsx",
];

// ============================================================================
// VALIDAÇÃO
// ============================================================================

let errors = [];
let warnings = [];

// 1. Verificar arquivos proibidos
FORBIDDEN_FILES.forEach((file) => {
  const fullPath = path.join(rootDir, file);
  if (fs.existsSync(fullPath)) {
    errors.push(`❌ FORBIDDEN FILE EXISTS: ${file}`);
  }
});

// 2. Verificar arquivos obrigatórios
REQUIRED_FILES.forEach((file) => {
  const fullPath = path.join(rootDir, file);
  if (!fs.existsSync(fullPath)) {
    errors.push(`❌ REQUIRED FILE MISSING: ${file}`);
  }
});

// 3. Verificar imports proibidos em arquivos críticos
const criticalFiles = [
  "merchant-portal/src/App.tsx",
  "merchant-portal/src/pages/Landing/components/Hero.tsx",
  "merchant-portal/src/pages/Landing/components/Footer.tsx",
];

criticalFiles.forEach((file) => {
  const fullPath = path.join(rootDir, file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, "utf-8");
    FORBIDDEN_PATTERNS.forEach((pattern) => {
      if (pattern.test(content)) {
        errors.push(`❌ FORBIDDEN IMPORT IN ${file}: ${pattern}`);
      }
    });
  }
});

// 4. Verificar se há múltiplos FlowGates
const flowGateFiles = [];
function findFlowGates(dir) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findFlowGates(fullPath);
    } else if (file.includes("FlowGate") && file.endsWith(".tsx")) {
      flowGateFiles.push(fullPath);
    }
  });
}

findFlowGates(path.join(rootDir, "merchant-portal/src"));
if (flowGateFiles.length > 1) {
  errors.push(`❌ MULTIPLE FLOWGATES FOUND: ${flowGateFiles.length} files`);
  flowGateFiles.forEach((f) =>
    warnings.push(`   - ${path.relative(rootDir, f)}`),
  );
}

// ============================================================================
// OUTPUT
// ============================================================================

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🔒 CONSTITUTION VALIDATOR");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

if (warnings.length > 0) {
  console.log("⚠️  WARNINGS:");
  warnings.forEach((w) => console.log(w));
  console.log("");
}

if (errors.length > 0) {
  console.log("❌ ERRORS (BUILD WILL FAIL):");
  errors.forEach((e) => console.log(e));
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🚨 BUILD BLOCKED BY CONSTITUTION");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  process.exit(1);
} else {
  console.log("✅ CONSTITUTION VALIDATED");
  console.log("   System is clean. Build allowed.\n");
  process.exit(0);
}
