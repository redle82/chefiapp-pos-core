#!/usr/bin/env node
/**
 * check:browser-guard-purity
 *
 * Static guardrail to keep BrowserBlockGuard decision logic strict and local:
 * - No global trial/runtime imports (e.g. TrialMode / RuntimeContext isTrial)
 * - No storage-based bypass (localStorage/sessionStorage/STATE_MODE/chefiapp_trial_mode)
 * - No trial env-based bypass and no catalog prefetch leakage hook in guard file
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const relPath =
  "merchant-portal/src/components/operational/BrowserBlockGuard.tsx";
const filePath = path.join(repoRoot, relPath);

if (!fs.existsSync(filePath)) {
  console.error(`❌ check:browser-guard-purity: file not found: ${relPath}`);
  process.exit(1);
}

const source = fs.readFileSync(filePath, "utf8");

/* ── OPG-005: scan App.tsx for dead-code bypass handlers ── */
const appTsxRelPath = "merchant-portal/src/App.tsx";
const appTsxPath = path.join(repoRoot, appTsxRelPath);
const appSource = fs.existsSync(appTsxPath)
  ? fs.readFileSync(appTsxPath, "utf8")
  : "";

const forbiddenRules = [
  {
    id: "OPG-001",
    reason: "Must not import trial-mode helpers into BrowserBlockGuard.",
    remediation:
      "Use only the explicit URL query gate (?mode=trial) inside /op/tpv and /op/kds; do not use global trial mode signals.",
    regex: /from\s+["'][^"']*TrialMode[^"']*["']/,
  },
  {
    id: "OPG-001",
    reason:
      "Must not import global runtime trial flags into BrowserBlockGuard.",
    remediation:
      "Use only the explicit URL query gate (?mode=trial) inside /op/tpv and /op/kds; do not use global trial mode signals.",
    regex: /from\s+["'][^"']*RuntimeContext[^"']*["']/,
  },
  {
    id: "OPG-002",
    reason: "STATE_MODE cannot influence BrowserBlockGuard decisions.",
    remediation:
      "Do not use storage (local/session) or STATE_MODE to bypass; the guard must be decided only by runtime (Electron/Tauri) or ?mode=trial.",
    regex: /STATE_MODE/,
  },
  {
    id: "OPG-002",
    reason:
      "chefiapp_trial_mode storage key must not be read in BrowserBlockGuard.",
    remediation:
      "Do not use storage (local/session) or STATE_MODE to bypass; the guard must be decided only by runtime (Electron/Tauri) or ?mode=trial.",
    regex: /chefiapp_trial_mode/,
  },
  {
    id: "OPG-002",
    reason: "localStorage must not influence BrowserBlockGuard decisions.",
    remediation:
      "Do not use storage (local/session) or STATE_MODE to bypass; the guard must be decided only by runtime (Electron/Tauri) or ?mode=trial.",
    regex: /\blocalStorage\b/,
  },
  {
    id: "OPG-002",
    reason: "sessionStorage must not influence BrowserBlockGuard decisions.",
    remediation:
      "Do not use storage (local/session) or STATE_MODE to bypass; the guard must be decided only by runtime (Electron/Tauri) or ?mode=trial.",
    regex: /\bsessionStorage\b/,
  },
  {
    id: "OPG-001",
    reason: "Global isTrial symbol is forbidden in BrowserBlockGuard.",
    remediation:
      "Use only the explicit URL query gate (?mode=trial) inside /op/tpv and /op/kds; do not use global trial mode signals.",
    regex: /\bisTrial\b/,
  },
  {
    id: "OPG-003",
    reason:
      "process.env.*TRIAL* must not influence BrowserBlockGuard decisions.",
    remediation:
      "Do not use env flags to bypass the operational guard; keep the decision constrained to runtime or ?mode=trial.",
    regex: /\bprocess\.env\.[A-Z0-9_]*TRIAL[A-Z0-9_]*\b/i,
  },
  {
    id: "OPG-003",
    reason:
      "import.meta.env.*TRIAL* must not influence BrowserBlockGuard decisions.",
    remediation:
      "Do not use env flags to bypass the operational guard; keep the decision constrained to runtime or ?mode=trial.",
    regex: /\bimport\.meta\.env\.[A-Z0-9_]*TRIAL[A-Z0-9_]*\b/i,
  },
  {
    id: "OPG-004",
    reason:
      "BrowserBlockGuard must not reference gm_products (preload/prefetch leakage risk).",
    remediation:
      "When blocked, the operational routes must not trigger catalog loading; ensure no gm_products requests occur before ALLOW.",
    regex: /\bgm_products\b/,
  },
];

/* ── OPG-005: Dead-code bypass handlers that must never return to App.tsx ── */
const appBypassRules = [
  {
    id: "OPG-005",
    reason:
      "TPVRouteHandler is a dead-code bypass removed in PR-13; must not be reintroduced.",
    remediation:
      "All /op/tpv routing must go through BrowserBlockGuard in OperationalRoutes.tsx. Do not create alternative route handlers in App.tsx.",
    regex: /\bTPVRouteHandler\b/,
  },
  {
    id: "OPG-005",
    reason:
      "TPVTrialGate is a dead-code bypass removed in PR-13; must not be reintroduced.",
    remediation:
      "Trial mode is handled via ?mode=trial query inside BrowserBlockGuard. Do not create alternative gate components in App.tsx.",
    regex: /\bTPVTrialGate\b/,
  },
  {
    id: "OPG-005",
    reason:
      "PublicProviders was a dead-code bypass provider tree removed in PR-13; must not be reintroduced.",
    remediation:
      "Public trial rendering goes through MarketingRoutes /trial → /op/tpv?mode=trial → BrowserBlockGuard ALLOW. Do not create alternative provider trees in App.tsx.",
    regex: /\bPublicProviders\b/,
  },
];

function lineNumberAt(text, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (text.charCodeAt(i) === 10) line += 1;
  }
  return line;
}

function collectViolations(rule, text, file) {
  const baseFlags = rule.regex.flags.replace(/g/g, "");
  const rx = new RegExp(rule.regex.source, `${baseFlags}g`);
  const matches = [];
  let match = rx.exec(text);
  while (match) {
    matches.push({
      id: rule.id,
      reason: rule.reason,
      remediation: rule.remediation,
      file,
      line: lineNumberAt(text, match.index),
      token: match[0],
    });
    if (matches.length >= 8) break;
    match = rx.exec(text);
  }
  return matches;
}

const violations = forbiddenRules.flatMap((rule) =>
  collectViolations(rule, source, relPath),
);

// OPG-005: scan App.tsx for dead-code bypass handlers
if (appSource) {
  violations.push(
    ...appBypassRules.flatMap((rule) =>
      collectViolations(rule, appSource, appTsxRelPath),
    ),
  );
}

if (violations.length > 0) {
  console.error("\n❌ check:browser-guard-purity failed\n");
  for (const violation of violations) {
    console.error(
      `- ${violation.file}:${violation.line} [${violation.id}] ${violation.reason}`,
    );
    console.error(`  token: ${violation.token}`);
    console.error(`  How to fix: ${violation.remediation}`);
  }
  console.error(
    "\nExpected decision inputs: Electron/Tauri runtime and explicit ?mode=trial query only.",
  );
  process.exit(1);
}

console.log(
  "✅ check:browser-guard-purity: BrowserBlockGuard remains storage/global-trial free",
);
