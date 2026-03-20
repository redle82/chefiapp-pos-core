#!/usr/bin/env npx tsx
/**
 * Security Headers Verification Script
 *
 * Reads vercel.json and verifies that all required security headers
 * are present with correct values. Designed to run in CI.
 *
 * Usage:
 *   npx tsx merchant-portal/scripts/security-headers-check.ts
 *
 * Exit code 0 = all checks passed, 1 = one or more failures.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VercelHeader {
  key: string;
  value: string;
}

interface VercelHeaderRule {
  source: string;
  headers: VercelHeader[];
}

interface VercelConfig {
  headers?: VercelHeaderRule[];
}

interface CheckResult {
  name: string;
  status: "PASS" | "FAIL" | "WARN";
  detail: string;
}

// ---------------------------------------------------------------------------
// Required headers per route category
// ---------------------------------------------------------------------------

const REQUIRED_HEADERS: Record<string, { key: string; validator: (value: string) => string | null }[]> = {
  // Headers required on ALL routes
  "*": [
    {
      key: "X-Frame-Options",
      validator: (v) => (v === "DENY" ? null : `Expected "DENY", got "${v}"`),
    },
    {
      key: "X-Content-Type-Options",
      validator: (v) => (v === "nosniff" ? null : `Expected "nosniff", got "${v}"`),
    },
    {
      key: "X-XSS-Protection",
      validator: (v) => (v === "0" ? null : `Expected "0" (deprecated header), got "${v}"`),
    },
    {
      key: "Referrer-Policy",
      validator: (v) =>
        ["strict-origin-when-cross-origin", "no-referrer", "same-origin"].includes(v)
          ? null
          : `Unexpected value "${v}"`,
    },
    {
      key: "Permissions-Policy",
      validator: (v) => (v.includes("camera=()") && v.includes("microphone=()") ? null : "Must disable camera and microphone"),
    },
    {
      key: "Strict-Transport-Security",
      validator: (v) => {
        const match = v.match(/max-age=(\d+)/);
        if (!match) return "Missing max-age directive";
        const maxAge = parseInt(match[1], 10);
        if (maxAge < 31536000) return `max-age=${maxAge} is less than 1 year (31536000)`;
        return null;
      },
    },
  ],
};

// CSP checks (applied to non-API routes only)
const CSP_FORBIDDEN_DIRECTIVES = [
  { directive: "script-src", forbidden: "'unsafe-eval'", reason: "unsafe-eval allows arbitrary code execution" },
];

const CSP_REQUIRED_DIRECTIVES = [
  "default-src",
  "script-src",
  "style-src",
  "img-src",
  "connect-src",
  "font-src",
  "frame-src",
  "form-action",
  "base-uri",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseCSP(csp: string): Map<string, string> {
  const directives = new Map<string, string>();
  for (const part of csp.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const spaceIdx = trimmed.indexOf(" ");
    if (spaceIdx === -1) {
      directives.set(trimmed, "");
    } else {
      directives.set(trimmed.slice(0, spaceIdx), trimmed.slice(spaceIdx + 1));
    }
  }
  return directives;
}

function isNonApiRoute(source: string): boolean {
  return !source.includes("api");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function run(): void {
  const vercelJsonPath = path.resolve(__dirname, "..", "vercel.json");

  if (!fs.existsSync(vercelJsonPath)) {
    console.error(`FAIL: vercel.json not found at ${vercelJsonPath}`);
    process.exit(1);
  }

  const config: VercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, "utf-8"));
  const results: CheckResult[] = [];

  if (!config.headers || config.headers.length === 0) {
    results.push({ name: "headers-exist", status: "FAIL", detail: "No headers configured in vercel.json" });
    printResults(results);
    process.exit(1);
  }

  // Check each route rule
  for (const rule of config.headers) {
    const headerMap = new Map(rule.headers.map((h) => [h.key.toLowerCase(), h.value]));

    // Check required headers for all routes
    for (const req of REQUIRED_HEADERS["*"]) {
      const value = headerMap.get(req.key.toLowerCase());
      const checkName = `[${rule.source}] ${req.key}`;
      if (!value) {
        results.push({ name: checkName, status: "FAIL", detail: "Header missing" });
        continue;
      }
      const error = req.validator(value);
      if (error) {
        results.push({ name: checkName, status: "FAIL", detail: error });
      } else {
        results.push({ name: checkName, status: "PASS", detail: value });
      }
    }

    // CSP checks for non-API routes
    const cspValue = headerMap.get("content-security-policy");
    const cspCheckPrefix = `[${rule.source}] CSP`;

    if (!cspValue) {
      results.push({ name: `${cspCheckPrefix}`, status: "WARN", detail: "No Content-Security-Policy header" });
      continue;
    }

    results.push({ name: `${cspCheckPrefix} present`, status: "PASS", detail: "Header found" });

    const directives = parseCSP(cspValue);

    // Check required directives (non-API only)
    if (isNonApiRoute(rule.source)) {
      for (const reqDir of CSP_REQUIRED_DIRECTIVES) {
        if (directives.has(reqDir)) {
          results.push({ name: `${cspCheckPrefix} has ${reqDir}`, status: "PASS", detail: directives.get(reqDir) || "(empty)" });
        } else {
          results.push({ name: `${cspCheckPrefix} has ${reqDir}`, status: "FAIL", detail: `Missing ${reqDir} directive` });
        }
      }
    }

    // Check forbidden CSP values
    for (const check of CSP_FORBIDDEN_DIRECTIVES) {
      const dirValue = directives.get(check.directive);
      if (dirValue && dirValue.includes(check.forbidden)) {
        results.push({
          name: `${cspCheckPrefix} no ${check.forbidden} in ${check.directive}`,
          status: "FAIL",
          detail: check.reason,
        });
      } else {
        results.push({
          name: `${cspCheckPrefix} no ${check.forbidden} in ${check.directive}`,
          status: "PASS",
          detail: "Not present",
        });
      }
    }

    // Additional: check unsafe-inline in script-src for non-API routes
    if (isNonApiRoute(rule.source)) {
      const scriptSrc = directives.get("script-src") || "";
      if (scriptSrc.includes("'unsafe-inline'")) {
        results.push({
          name: `${cspCheckPrefix} no unsafe-inline in script-src`,
          status: "FAIL",
          detail: "unsafe-inline in script-src weakens CSP significantly",
        });
      } else {
        results.push({
          name: `${cspCheckPrefix} no unsafe-inline in script-src`,
          status: "PASS",
          detail: "Not present",
        });
      }
    }
  }

  printResults(results);

  const failures = results.filter((r) => r.status === "FAIL");
  if (failures.length > 0) {
    console.log(`\n${failures.length} check(s) FAILED.`);
    process.exit(1);
  }

  console.log("\nAll security header checks passed.");
  process.exit(0);
}

function printResults(results: CheckResult[]): void {
  console.log("\n=== Security Headers Check ===\n");

  const maxNameLen = Math.max(...results.map((r) => r.name.length));

  for (const r of results) {
    const icon = r.status === "PASS" ? "PASS" : r.status === "WARN" ? "WARN" : "FAIL";
    const paddedName = r.name.padEnd(maxNameLen);
    console.log(`  [${icon}] ${paddedName}  ${r.detail}`);
  }
}

run();
