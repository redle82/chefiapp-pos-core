#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const requiredFiles = [
  "merchant-portal/src/features/admin/config/pages/GeneralConfigPage.tsx",
  "merchant-portal/src/features/admin/dashboard/components/AdminSidebar.tsx",
  "docs/contracts/CONTRATO_OWNER_ONLY_WEB.md",
  "docs/architecture/CORE_CONTRACT_INDEX.md",
];

const violations = [];

for (const relPath of requiredFiles) {
  const absPath = path.join(root, relPath);
  if (!fs.existsSync(absPath)) {
    violations.push(`MISSING_FILE: ${relPath}`);
    continue;
  }

  const content = fs.readFileSync(absPath, "utf8").trim();
  if (!content) {
    violations.push(`EMPTY_FILE: ${relPath}`);
  }
}

if (violations.length) {
  console.error("[admin-general-contract] FAILED");
  for (const violation of violations) {
    console.error(`[admin-general-contract] ${violation}`);
  }
  process.exit(1);
}

console.log("[admin-general-contract] PASSED");
