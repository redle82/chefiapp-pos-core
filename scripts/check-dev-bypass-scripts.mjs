#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const scriptsDir = path.join(root, "scripts");

if (!fs.existsSync(scriptsDir)) {
  console.log("[dev-bypass-scripts] PASSED (scripts directory not found)");
  process.exit(0);
}

const entries = fs.readdirSync(scriptsDir, { withFileTypes: true });
const suspicious = entries
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .filter((name) => /bypass/i.test(name) && !/check-dev-bypass-scripts/i.test(name));

if (suspicious.length) {
  console.error("[dev-bypass-scripts] FAILED");
  for (const name of suspicious) {
    console.error(`[dev-bypass-scripts] SUSPICIOUS_SCRIPT: scripts/${name}`);
  }
  process.exit(1);
}

console.log("[dev-bypass-scripts] PASSED");
