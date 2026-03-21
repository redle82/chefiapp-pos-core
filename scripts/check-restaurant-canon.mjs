#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const requiredDocs = [
  "docs/architecture/RESTAURANT_LIFECYCLE_CONTRACT.md",
  "docs/contracts/RESTAURANT_LIFECYCLE_CONTRACT.md",
  "docs/architecture/CORE_CONTRACT_INDEX.md",
];

const failures = [];

for (const relPath of requiredDocs) {
  const absPath = path.join(root, relPath);
  if (!fs.existsSync(absPath)) {
    failures.push(`MISSING_DOC: ${relPath}`);
    continue;
  }

  const content = fs.readFileSync(absPath, "utf8").trim();
  if (!content) {
    failures.push(`EMPTY_DOC: ${relPath}`);
  }
}

if (failures.length > 0) {
  console.error("[restaurant-canon] FAILED");
  for (const failure of failures) {
    console.error(`[restaurant-canon] ${failure}`);
  }
  process.exit(1);
}

console.log("[restaurant-canon] PASSED");
