#!/usr/bin/env npx tsx
/**
 * security-audit.ts -- Automated security audit for ChefIApp POS Core.
 *
 * Checks:
 *   1. Build output scanned for leaked secrets
 *   2. RLS enabled on all tenant tables (reads migration files)
 *   3. ProtectedAction wraps sensitive UI components
 *   4. RBAC permissions checked in use cases
 *   5. Security headers configured
 *   6. Webhook signature verification present
 *
 * Usage:
 *   npx tsx merchant-portal/scripts/security-audit.ts
 *
 * Exit code: 0 = all pass, 1 = one or more failures
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");
const MERCHANT = path.join(ROOT, "merchant-portal");
const SRC = path.join(MERCHANT, "src");
const DIST = path.join(MERCHANT, "dist");
const MIGRATIONS = path.join(ROOT, "docker-core/schema/migrations");

// ---------------------------------------------------------------------------
// Result tracking
// ---------------------------------------------------------------------------

interface CheckResult {
  name: string;
  status: "PASS" | "FAIL" | "WARN" | "SKIP";
  detail: string;
}

const results: CheckResult[] = [];

function pass(name: string, detail: string): void {
  results.push({ name, status: "PASS", detail });
}

function fail(name: string, detail: string): void {
  results.push({ name, status: "FAIL", detail });
}

function warn(name: string, detail: string): void {
  results.push({ name, status: "WARN", detail });
}

function skip(name: string, detail: string): void {
  results.push({ name, status: "SKIP", detail });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readFileIfExists(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

function findFiles(dir: string, pattern: RegExp, maxDepth = 10): string[] {
  const found: string[] = [];
  if (!fs.existsSync(dir)) return found;

  function walk(current: string, depth: number): void {
    if (depth > maxDepth) return;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
        walk(full, depth + 1);
      } else if (entry.isFile() && pattern.test(entry.name)) {
        found.push(full);
      }
    }
  }

  walk(dir, 0);
  return found;
}

function fileContains(filePath: string, patterns: RegExp[]): RegExp[] {
  const content = readFileIfExists(filePath);
  if (!content) return [];
  return patterns.filter((p) => p.test(content));
}

// ---------------------------------------------------------------------------
// Check 1: Secrets in build output
// ---------------------------------------------------------------------------

function checkSecretsInBuild(): void {
  const section = "secrets-in-build";

  if (!fs.existsSync(DIST)) {
    skip(`${section}`, "No dist/ directory found. Run build first.");
    return;
  }

  const jsFiles = findFiles(DIST, /\.(js|css)$/);
  if (jsFiles.length === 0) {
    skip(`${section}`, "No JS/CSS files in dist/");
    return;
  }

  const secretPatterns: Array<{ name: string; pattern: RegExp }> = [
    { name: "Supabase service_role key", pattern: /service_role/ },
    { name: "SUPABASE_SERVICE env ref", pattern: /SUPABASE_SERVICE/ },
    { name: "Stripe secret key (live)", pattern: /sk_live_[a-zA-Z0-9]{20,}/ },
    { name: "Stripe secret key (test)", pattern: /sk_test_[a-zA-Z0-9]{20,}/ },
    { name: "JWT secret env var", pattern: /jwt_secret/i },
    { name: "Private key material", pattern: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/ },
    { name: "Hardcoded DB password", pattern: /(?:db_password|database_password|pg_password)\s*[:=]\s*["'][^"']{8,}["']/i },
  ];

  let anyFailed = false;

  for (const file of jsFiles) {
    const content = readFileIfExists(file);
    if (!content) continue;

    for (const { name, pattern } of secretPatterns) {
      if (pattern.test(content)) {
        fail(`${section}:${name}`, `Found in ${path.relative(ROOT, file)}`);
        anyFailed = true;
      }
    }
  }

  if (!anyFailed) {
    pass(section, `Scanned ${jsFiles.length} files -- no secrets found`);
  }
}

// ---------------------------------------------------------------------------
// Check 2: RLS on tenant tables
// ---------------------------------------------------------------------------

function checkRLSMigrations(): void {
  const section = "rls-tenant-tables";

  const migrationFiles = findFiles(MIGRATIONS, /\.sql$/);
  if (migrationFiles.length === 0) {
    // Also check supabase migrations
    const supabaseMigrations = findFiles(path.join(ROOT, "supabase/migrations"), /\.sql$/);
    if (supabaseMigrations.length === 0) {
      warn(section, "No migration files found");
      return;
    }
    migrationFiles.push(...supabaseMigrations);
  }

  // Find all ALTER TABLE ... ENABLE ROW LEVEL SECURITY
  const rlsEnabledTables = new Set<string>();
  const rlsPattern = /ALTER\s+TABLE\s+(?:public\.)?(\w+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi;

  for (const file of migrationFiles) {
    const content = readFileIfExists(file);
    if (!content) continue;

    let match;
    while ((match = rlsPattern.exec(content)) !== null) {
      rlsEnabledTables.add(match[1].toLowerCase());
    }
  }

  // Critical tenant tables that MUST have RLS
  const criticalTables = [
    "gm_orders",
    "gm_order_items",
    "gm_payments",
    "gm_products",
    "gm_categories",
    "gm_tables",
    "gm_reservations",
    "gm_restaurants",
    "gm_restaurant_members",
    "gm_profiles",
    "gm_fiscal_queue",
    "daily_closings",
    "shift_logs",
    "webhook_events",
    "integration_orders",
  ];

  const missingRLS: string[] = [];
  for (const table of criticalTables) {
    if (!rlsEnabledTables.has(table)) {
      missingRLS.push(table);
    }
  }

  if (missingRLS.length > 0) {
    fail(section, `Tables missing RLS: ${missingRLS.join(", ")}`);
  } else {
    pass(section, `All ${criticalTables.length} critical tables have RLS enabled in migrations`);
  }

  // Bonus: check for permissive policies (USING (true))
  const permissivePattern = /CREATE\s+POLICY\s+\S+\s+ON\s+(?:public\.)?(\w+)\s+.*?USING\s*\(\s*true\s*\)/gi;
  const permissiveTables = new Set<string>();

  for (const file of migrationFiles) {
    const content = readFileIfExists(file);
    if (!content) continue;

    let match;
    while ((match = permissivePattern.exec(content)) !== null) {
      permissiveTables.add(match[1].toLowerCase());
    }
  }

  if (permissiveTables.size > 0) {
    warn(
      "rls-permissive-policies",
      `Tables with USING(true) policies found: ${[...permissiveTables].join(", ")}. Verify these are intentional.`,
    );
  } else {
    pass("rls-permissive-policies", "No permissive USING(true) policies found");
  }
}

// ---------------------------------------------------------------------------
// Check 3: ProtectedAction coverage
// ---------------------------------------------------------------------------

function checkProtectedActionUsage(): void {
  const section = "protected-action-coverage";

  const tsxFiles = findFiles(path.join(SRC, "pages"), /\.tsx$/);
  const filesUsingProtectedAction: string[] = [];
  const adminPages: string[] = [];

  for (const file of tsxFiles) {
    const content = readFileIfExists(file);
    if (!content) continue;

    const relativePath = path.relative(SRC, file);

    if (/ProtectedAction/.test(content)) {
      filesUsingProtectedAction.push(relativePath);
    }

    // Identify admin/settings pages that SHOULD use ProtectedAction
    if (
      /admin|settings|staff|billing|report/i.test(relativePath) &&
      /(delete|remove|refund|reopen|export|edit|update)/i.test(content) &&
      !/ProtectedAction/.test(content)
    ) {
      adminPages.push(relativePath);
    }
  }

  if (filesUsingProtectedAction.length === 0) {
    fail(section, "ProtectedAction is not used in any page");
  } else if (filesUsingProtectedAction.length < 3) {
    warn(
      section,
      `ProtectedAction used in only ${filesUsingProtectedAction.length} page(s): ${filesUsingProtectedAction.join(", ")}`,
    );
  } else {
    pass(section, `ProtectedAction used in ${filesUsingProtectedAction.length} pages`);
  }

  if (adminPages.length > 0) {
    warn(
      "protected-action-admin-gaps",
      `${adminPages.length} admin page(s) with sensitive actions but no ProtectedAction: ${adminPages.slice(0, 5).join(", ")}${adminPages.length > 5 ? "..." : ""}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Check 4: RBAC in use cases
// ---------------------------------------------------------------------------

function checkRBACInUseCases(): void {
  const section = "rbac-use-cases";

  const useCaseFiles = [
    path.join(SRC, "application/OrderUseCases.ts"),
    path.join(SRC, "application/PaymentUseCases.ts"),
    path.join(SRC, "core/orders/reopenOrder.ts"),
    path.join(SRC, "core/shift/ShiftService.ts"),
  ];

  const sensitiveActions: Array<{
    file: string;
    action: string;
    hasRoleCheck: boolean;
    hasAudit: boolean;
  }> = [];

  for (const file of useCaseFiles) {
    const content = readFileIfExists(file);
    if (!content) continue;

    const relativePath = path.relative(SRC, file);

    // Check for role/permission enforcement patterns
    const hasRoleParam = /role:\s*(UserRole|Role)/i.test(content);
    const hasPermissionCheck =
      /requirePermission|hasPermission|canRefund|canReopenOrder|canCancelOrder/.test(content);
    const hasAuditLog = /logAuditEvent/.test(content);

    // Check specific functions
    const functionMatches = content.matchAll(
      /export\s+(?:async\s+)?function\s+(\w+)/g,
    );

    for (const match of functionMatches) {
      const fnName = match[1];
      // Extract function body (rough heuristic: next export or end of file)
      const fnStart = match.index!;
      const nextExport = content.indexOf("export ", fnStart + 1);
      const fnBody = content.slice(fnStart, nextExport > 0 ? nextExport : undefined);

      const fnHasRoleCheck =
        /requirePermission|hasPermission|canRefund|canReopenOrder|canCancelOrder|callerRole/.test(
          fnBody,
        );
      const fnHasAudit = /logAuditEvent/.test(fnBody);

      sensitiveActions.push({
        file: relativePath,
        action: fnName,
        hasRoleCheck: fnHasRoleCheck,
        hasAudit: fnHasAudit,
      });
    }
  }

  const missingRole = sensitiveActions.filter((a) => !a.hasRoleCheck);
  const missingAudit = sensitiveActions.filter(
    (a) => !a.hasAudit && !["splitBill", "reconcilePayments", "addItemToOrder", "removeItemFromOrder"].includes(a.action),
  );

  if (missingRole.length > 0) {
    warn(
      `${section}-role-check`,
      `${missingRole.length} use case function(s) without role check: ${missingRole.map((a) => a.action).join(", ")}`,
    );
  } else {
    pass(`${section}-role-check`, "All use case functions have role checks");
  }

  if (missingAudit.length > 0) {
    warn(
      `${section}-audit-log`,
      `${missingAudit.length} sensitive function(s) without audit logging: ${missingAudit.map((a) => a.action).join(", ")}`,
    );
  } else {
    pass(`${section}-audit-log`, "All sensitive functions have audit logging");
  }
}

// ---------------------------------------------------------------------------
// Check 5: Security headers
// ---------------------------------------------------------------------------

function checkSecurityHeaders(): void {
  const section = "security-headers";

  const headerFile = path.join(ROOT, "docker-core/src/middleware/securityHeaders.ts");
  const content = readFileIfExists(headerFile);

  if (!content) {
    fail(section, "Security headers middleware not found");
    return;
  }

  const requiredHeaders = [
    { name: "X-Content-Type-Options", pattern: /X-Content-Type-Options.*nosniff/ },
    { name: "X-Frame-Options", pattern: /X-Frame-Options.*DENY/ },
    { name: "Strict-Transport-Security", pattern: /Strict-Transport-Security/ },
    { name: "Content-Security-Policy", pattern: /Content-Security-Policy/ },
    { name: "Referrer-Policy", pattern: /Referrer-Policy/ },
  ];

  const missing: string[] = [];
  for (const { name, pattern } of requiredHeaders) {
    if (!pattern.test(content)) {
      missing.push(name);
    }
  }

  if (missing.length > 0) {
    fail(section, `Missing headers: ${missing.join(", ")}`);
  } else {
    pass(section, "All required security headers configured");
  }

  // Check for unsafe CSP directives in production config
  if (/unsafe-eval/.test(content)) {
    const devOnlyCheck = /isDev.*unsafe-eval|unsafe-eval.*isDev/s;
    if (!devOnlyCheck.test(content)) {
      warn(
        "csp-unsafe-eval",
        "CSP allows 'unsafe-eval' in production config. Consider restricting to dev only.",
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Check 6: Webhook signature verification
// ---------------------------------------------------------------------------

function checkWebhookSecurity(): void {
  const section = "webhook-security";

  // Stripe webhook
  const stripeWebhook = readFileIfExists(path.join(MERCHANT, "api/webhooks/stripe.ts"));
  if (stripeWebhook) {
    const checks = {
      hmacVerification: /createHmac.*sha256/.test(stripeWebhook),
      timingSafe: /timingSafeEqual/.test(stripeWebhook),
      timestampCheck: /age\s*>\s*300|timestamp.*old/i.test(stripeWebhook),
      idempotency: /webhook_events/.test(stripeWebhook),
      rawBody: /bodyParser.*false|readRawBody/.test(stripeWebhook),
    };

    const missing = Object.entries(checks)
      .filter(([, v]) => !v)
      .map(([k]) => k);

    if (missing.length > 0) {
      fail(`${section}-stripe`, `Missing security checks: ${missing.join(", ")}`);
    } else {
      pass(`${section}-stripe`, "Stripe webhook has HMAC, timing-safe compare, timestamp check, idempotency, raw body parsing");
    }
  } else {
    fail(`${section}-stripe`, "Stripe webhook handler not found");
  }

  // Delivery webhook
  const deliveryWebhook = readFileIfExists(path.join(MERCHANT, "api/webhooks/delivery.ts"));
  if (deliveryWebhook) {
    if (/createHmac|timingSafeEqual/.test(deliveryWebhook)) {
      pass(`${section}-delivery`, "Delivery webhook uses HMAC verification");
    } else if (/x-api-key|x-glovo-api-key/.test(deliveryWebhook)) {
      warn(
        `${section}-delivery`,
        "Delivery webhook uses simple API key comparison (not HMAC). Consider upgrading to signature verification.",
      );
    } else {
      fail(`${section}-delivery`, "Delivery webhook has no authentication");
    }
  }
}

// ---------------------------------------------------------------------------
// Check 7: Env files not committed
// ---------------------------------------------------------------------------

function checkEnvFiles(): void {
  const section = "env-files";

  const dangerousEnvFiles = [
    path.join(MERCHANT, ".env"),
    path.join(MERCHANT, ".env.local"),
    path.join(MERCHANT, ".env.production"),
  ];

  for (const envFile of dangerousEnvFiles) {
    if (fs.existsSync(envFile)) {
      const content = readFileIfExists(envFile);
      if (!content) continue;

      // Check if it contains actual secrets (not just template values)
      const secretPatterns = [
        /sk_live_/,
        /sk_test_/,
        /service_role/,
        /eyJhbGciOi/,  // JWT prefix
        /supabase.*key.*=.*[a-zA-Z0-9]{30,}/i,
      ];

      const hasSecrets = secretPatterns.some((p) => p.test(content));
      if (hasSecrets) {
        warn(
          `${section}:${path.basename(envFile)}`,
          `${path.basename(envFile)} contains what appear to be real secrets. Ensure this file is gitignored.`,
        );
      }
    }
  }

  // Check .gitignore includes env files
  const gitignore = readFileIfExists(path.join(ROOT, ".gitignore"));
  if (gitignore) {
    if (/\.env\.local|\.env\.\*/.test(gitignore)) {
      pass(section, ".env files are gitignored");
    } else {
      warn(section, ".gitignore may not cover all .env files");
    }
  }
}

// ---------------------------------------------------------------------------
// Run all checks
// ---------------------------------------------------------------------------

console.log("========================================");
console.log("  ChefIApp POS Core -- Security Audit");
console.log("========================================\n");

checkSecretsInBuild();
checkRLSMigrations();
checkProtectedActionUsage();
checkRBACInUseCases();
checkSecurityHeaders();
checkWebhookSecurity();
checkEnvFiles();

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

console.log("--- Results ---\n");

const statusIcon: Record<string, string> = {
  PASS: "[PASS]",
  FAIL: "[FAIL]",
  WARN: "[WARN]",
  SKIP: "[SKIP]",
};

for (const r of results) {
  console.log(`  ${statusIcon[r.status]} ${r.name}`);
  console.log(`         ${r.detail}\n`);
}

// Summary
const counts = {
  pass: results.filter((r) => r.status === "PASS").length,
  fail: results.filter((r) => r.status === "FAIL").length,
  warn: results.filter((r) => r.status === "WARN").length,
  skip: results.filter((r) => r.status === "SKIP").length,
};

console.log("--- Summary ---\n");
console.log(`  PASS: ${counts.pass}`);
console.log(`  FAIL: ${counts.fail}`);
console.log(`  WARN: ${counts.warn}`);
console.log(`  SKIP: ${counts.skip}`);
console.log(`  Total: ${results.length}\n`);

if (counts.fail > 0) {
  console.log("========================================");
  console.log("  SECURITY AUDIT: FAILED");
  console.log("========================================");
  process.exit(1);
} else if (counts.warn > 0) {
  console.log("========================================");
  console.log(`  SECURITY AUDIT: PASSED with ${counts.warn} warning(s)`);
  console.log("========================================");
  process.exit(0);
} else {
  console.log("========================================");
  console.log("  SECURITY AUDIT: ALL CLEAR");
  console.log("========================================");
  process.exit(0);
}
