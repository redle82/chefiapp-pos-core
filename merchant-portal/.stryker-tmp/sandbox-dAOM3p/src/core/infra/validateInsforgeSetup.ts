/**
 * InsForge Setup Validation Script
 *
 * Purpose: Validate InsForge integration before deployment
 * Usage: Run this from browser console on localhost OR via Node test
 *
 * Checks:
 *   1. Environment variables are correctly configured
 *   2. InsForge client initializes without errors
 *   3. Backend switching logic works as expected
 *   4. Database connectivity (if credentials provided)
 */
// @ts-nocheck


import { CONFIG } from "../../config";
import {
  backendClient,
  checkBackendHealth,
  isDockerCore,
  isInsforge,
} from "./backendClient";
import { insforge } from "./insforgeClient";

interface ValidationResult {
  step: string;
  status: "pass" | "fail" | "warning" | "skip";
  message: string;
  detail?: unknown;
}

export async function validateInsforgeSetup(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  // ─── Step 1: Environment Variables ─────────────────────────
  results.push({
    step: "1. Check INSFORGE_URL",
    status: CONFIG.INSFORGE_URL ? "pass" : "warning",
    message: CONFIG.INSFORGE_URL
      ? `URL configured: ${CONFIG.INSFORGE_URL}`
      : "Not configured (using Docker Core)",
    detail: { url: CONFIG.INSFORGE_URL },
  });

  results.push({
    step: "2. Check INSFORGE_ANON_KEY",
    status: CONFIG.INSFORGE_ANON_KEY ? "pass" : "warning",
    message: CONFIG.INSFORGE_ANON_KEY
      ? `Key configured (${CONFIG.INSFORGE_ANON_KEY.slice(0, 8)}...)`
      : "Not configured (using Docker Core)",
    detail: { hasKey: Boolean(CONFIG.INSFORGE_ANON_KEY) },
  });

  // ─── Step 3: Backend Selection Logic ──────────────────────
  results.push({
    step: "3. Backend Selection",
    status: "pass",
    message: isInsforge
      ? "✓ InsForge is ACTIVE backend"
      : "✓ Docker Core is ACTIVE backend",
    detail: { isInsforge, isDockerCore },
  });

  // ─── Step 4: Client Initialization ─────────────────────────
  try {
    const hasDatabase = Boolean(insforge.database);
    const hasAuth = Boolean(insforge.auth);
    const hasStorage = Boolean(insforge.storage);

    results.push({
      step: "4. InsForge Client Initialization",
      status: hasDatabase && hasAuth && hasStorage ? "pass" : "fail",
      message:
        hasDatabase && hasAuth && hasStorage
          ? "✓ All modules initialized (database, auth, storage)"
          : "✗ Client initialization incomplete",
      detail: { hasDatabase, hasAuth, hasStorage },
    });
  } catch (error) {
    results.push({
      step: "4. InsForge Client Initialization",
      status: "fail",
      message: "✗ Client initialization error",
      detail: { error: String(error) },
    });
  }

  // ─── Step 5: Backend Health Check ─────────────────────────
  if (!isInsforge) {
    results.push({
      step: "5. Backend Health Check",
      status: "skip",
      message: "Skipped (InsForge not active - set VITE_INSFORGE_URL to test)",
      detail: { reason: "Docker Core is active backend" },
    });
  } else {
    try {
      const isHealthy = await checkBackendHealth();
      results.push({
        step: "5. Backend Health Check",
        status: isHealthy ? "pass" : "fail",
        message: isHealthy
          ? "✓ InsForge backend is reachable"
          : "✗ Cannot reach InsForge backend (check credentials & network)",
        detail: { healthy: isHealthy },
      });
    } catch (error) {
      results.push({
        step: "5. Backend Health Check",
        status: "fail",
        message: "✗ Health check failed",
        detail: { error: String(error) },
      });
    }
  }

  // ─── Step 6: Query API Test ────────────────────────────────
  if (!isInsforge) {
    results.push({
      step: "6. Query API Test",
      status: "skip",
      message: "Skipped (InsForge not active)",
      detail: { reason: "Docker Core is active backend" },
    });
  } else {
    try {
      const { data, error } = await backendClient
        .from("gm_restaurants")
        .select("id, name")
        .limit(1);

      if (error) {
        results.push({
          step: "6. Query API Test",
          status: "fail",
          message: `✗ Query failed: ${error.message || String(error)}`,
          detail: { error },
        });
      } else {
        results.push({
          step: "6. Query API Test",
          status: "pass",
          message: `✓ Successfully queried gm_restaurants (${
            data?.length || 0
          } rows)`,
          detail: { rowCount: data?.length || 0 },
        });
      }
    } catch (error) {
      results.push({
        step: "6. Query API Test",
        status: "fail",
        message: "✗ Query execution error",
        detail: { error: String(error) },
      });
    }
  }

  return results;
}

/**
 * Pretty print validation results to console
 */
export function printValidationResults(results: ValidationResult[]): void {
  console.group("🔍 InsForge Setup Validation");

  results.forEach((result) => {
    const icon =
      result.status === "pass"
        ? "✅"
        : result.status === "fail"
        ? "❌"
        : result.status === "warning"
        ? "⚠️"
        : "⏭️";
    console.log(`${icon} ${result.step}`);
    console.log(`   ${result.message}`);
    if (result.detail) {
      console.log("   Detail:", result.detail);
    }
  });

  const summary = {
    pass: results.filter((r) => r.status === "pass").length,
    fail: results.filter((r) => r.status === "fail").length,
    warning: results.filter((r) => r.status === "warning").length,
    skip: results.filter((r) => r.status === "skip").length,
  };

  console.log("\n📊 Summary:");
  console.log(`   ✅ Pass: ${summary.pass}`);
  console.log(`   ❌ Fail: ${summary.fail}`);
  console.log(`   ⚠️  Warning: ${summary.warning}`);
  console.log(`   ⏭️  Skip: ${summary.skip}`);

  console.groupEnd();

  // Recommend actions
  if (summary.fail > 0) {
    console.warn(
      "\n⚠️  Some checks failed. Review the details above and fix issues before deployment.",
    );
  } else if (summary.warning > 0 && summary.pass === 0) {
    console.info(
      "\n💡 InsForge not configured. Currently using Docker Core (local dev).",
    );
  } else {
    console.info("\n✨ All checks passed! Ready for deployment.");
  }
}

/**
 * Run validation and log results (browser-friendly)
 */
export async function runValidation(): Promise<void> {
  const results = await validateInsforgeSetup();
  printValidationResults(results);
}

// Export for console access
if (typeof window !== "undefined") {
  (window as any).validateInsforge = runValidation;
}
