#!/usr/bin/env node

import { execSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

function sh(cmd) {
  return execSync(cmd, { cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'] }).toString('utf8');
}

function hasRef(ref) {
  try {
    sh(`git show-ref --verify --quiet ${ref}`);
    return true;
  } catch {
    return false;
  }
}

function pickBaseRef() {
  const envBase = process.env.UI_GUARDRAILS_BASE_REF;
  if (envBase) return envBase;

  if (hasRef('refs/remotes/origin/main')) return 'origin/main';
  // Fallback for local work without remotes
  try {
    sh('git rev-parse --verify HEAD~1');
    return 'HEAD~1';
  } catch {
    return 'HEAD';
  }
}

const baseRef = pickBaseRef();
const headRef = 'HEAD';

const diffRange = `${baseRef}...${headRef}`;

function getNameStatus() {
  // name-status gives: <status>\t<path> [\t<path2>]
  const out = sh(`git diff --name-status ${diffRange}`);
  return out
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => line.split(/\t+/));
}

function getDiffFile(filePath) {
  return sh(`git diff ${diffRange} --unified=0 -- ${filePath}`);
}

const violations = [];

// ---------------------------------------------------------------------------
// Rule 1: No new files in legacy folder merchant-portal/src/ui/components/
// ---------------------------------------------------------------------------
const legacyFolder = 'merchant-portal/src/ui/components/';
const allowedLegacyAdds = new Set([
  `${legacyFolder}README.md`,
]);

for (const parts of getNameStatus()) {
  const status = parts[0];
  const filePath = parts[1];

  // Added or copied
  if ((status === 'A' || status?.startsWith('A') || status === 'C' || status?.startsWith('C')) && filePath?.startsWith(legacyFolder)) {
    if (!allowedLegacyAdds.has(filePath)) {
      violations.push(
        `❌ UI_GUARDRAILS: New legacy UI file added: ${filePath}\n   Rule: do not add new files under ${legacyFolder} (deprecated).`
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Rule 2: No new imports from ui/components (legacy)
// ---------------------------------------------------------------------------
const importNeedle = /(?:from\s+['\"][^'\"]*\/ui\/components\/[^'\"]+['\"]|require\(['\"][^'\"]*\/ui\/components\/[^'\"]+['\"]\))/;

for (const parts of getNameStatus()) {
  const status = parts[0];
  const filePath = parts[1];

  // Only inspect modified/added files in merchant-portal/src
  if (!filePath || !filePath.startsWith('merchant-portal/src/')) continue;
  if (!(status === 'M' || status === 'A' || status?.startsWith('R') || status?.startsWith('C'))) continue;

  const patch = getDiffFile(filePath);
  const addedLines = patch
    .split('\n')
    .filter((l) => l.startsWith('+') && !l.startsWith('+++'));

  for (const line of addedLines) {
    if (importNeedle.test(line)) {
      violations.push(
        `❌ UI_GUARDRAILS: New legacy import detected in ${filePath}\n   Added: ${line.slice(1).trim()}\n   Rule: do not introduce new imports from /ui/components/ (deprecated).`
      );
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Rule 3: Prevent introducing new re-exports of base components from wrappers
// in merchant-portal/src/ui/design-system/index.ts (must not expand collisions)
// ---------------------------------------------------------------------------
const dsIndex = 'merchant-portal/src/ui/design-system/index.ts';
const forbiddenReexports = [
  "export { Button } from './Button'",
  "export { Input } from './Input'",
  "export { Card } from './Card'",
  "export { Badge } from './Badge'",
];

try {
  const patch = getDiffFile(dsIndex);
  const addedLines = patch
    .split('\n')
    .filter((l) => l.startsWith('+') && !l.startsWith('+++'))
    .map((l) => l.slice(1).trim());

  for (const forbidden of forbiddenReexports) {
    if (addedLines.includes(forbidden)) {
      violations.push(
        `❌ UI_GUARDRAILS: New forbidden re-export added in ${dsIndex}\n   Added: ${forbidden}\n   Rule: base components should not be re-exported from wrapper files here; keep primitives as the future single source of truth.`
      );
    }
  }
} catch {
  // ignore if file doesn't exist in this repo state
}

if (violations.length) {
  console.error(`\nUI Guardrails failed (base=${baseRef}, head=${headRef}).\n`);
  for (const v of violations) console.error(v + '\n');
  process.exit(1);
}

console.log(`✅ UI Guardrails OK (base=${baseRef}, head=${headRef})`);
