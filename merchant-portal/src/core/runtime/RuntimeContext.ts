/**
 * RuntimeContext - Production vs Trial Mode Detection
 *
 * Enforces PRODUCTION_READINESS_CONTRACT.md and exposes backend type.
 * - backendType: 'docker' | 'supabase' (SSOT from backendAdapter)
 * - Production mode: Mocks are FORBIDDEN
 * - Trial mode: Mocks are allowed
 */

import { getBackendType, type BackendType } from "../infra/backendAdapter";
import { Logger } from "../logger";
import { isDevStableMode } from "./devStableMode";

// ============================================================================
// TYPES
// ============================================================================

export type RuntimeMode = "trial" | "production";

export type { BackendType };

export interface RuntimeContext {
  mode: RuntimeMode;
  backendType: BackendType;
  isProduction: boolean;
  isTrial: boolean;
  devStableActive: boolean;
}

// ============================================================================
// DETECTION
// ============================================================================

/**
 * Determines the current runtime mode based on environment variables.
 * Uses process.env so it works in both Vite (injects env at build) and Node/Jest.
 * Priority:
 * 1. VITE_RUNTIME_MODE env var (explicit)
 * 2. Production builds (NODE_ENV === 'production') → production
 * 3. Default → trial
 */
export function getRuntimeModeFromEnv(env: NodeJS.ProcessEnv): RuntimeMode {
  // 1. Explicit override via env var
  const explicit = env.VITE_RUNTIME_MODE;
  if (explicit === "production") return "production";
  if (explicit === "trial") return "trial";

  // 2. Production build defaults to production mode
  if (env.NODE_ENV === "production") return "production";

  // 3. Development defaults to trial
  return "trial";
}

function detectRuntimeMode(): RuntimeMode {
  const env =
    typeof process !== "undefined" ? process.env : ({} as NodeJS.ProcessEnv);
  return getRuntimeModeFromEnv(env);
}

// ============================================================================
// SINGLETON
// ============================================================================

const RUNTIME_MODE: RuntimeMode = detectRuntimeMode();

export const RUNTIME: Readonly<RuntimeContext> = Object.freeze({
  mode: RUNTIME_MODE,
  backendType: getBackendType(),
  isProduction: RUNTIME_MODE === "production",
  isTrial: RUNTIME_MODE === "trial",
  devStableActive: isDevStableMode(),
});

// ============================================================================
// GUARDS
// ============================================================================

/**
 * Asserts that a service is NOT using a mock implementation.
 *
 * In production mode, this will CRASH the application to prevent
 * silent failures and ensure all services use real implementations.
 *
 * @param serviceName - Human-readable name of the service
 * @param isMock - Whether the current implementation is a mock
 * @throws Error in production if isMock is true
 */
export function assertNoMock(serviceName: string, isMock: boolean): void {
  if (!isMock) return;
  if (RUNTIME.isTrial) {
    // Allowed in trial mode, but log for visibility
    Logger.info(
      `[RUNTIME] ⚠️ Mock active: ${serviceName} (allowed in trial mode)`,
    );
    return;
  }

  // CRITICAL: Crash in production
  const message = `[PRODUCTION_VIOLATION] Mock usage forbidden: ${serviceName}`;
  Logger.error(`❌ ${message}`);
  Logger.error(
    "Service attempted to use mock implementation in production mode.",
  );
  Logger.error(
    "This is a critical error that must be fixed before deployment.",
  );
  throw new Error(message);
}

/**
 * Asserts that the system is running in production mode.
 * Use this for operations that should NEVER run in trial mode.
 *
 * @param operationName - Human-readable name of the operation
 * @throws Error if not in production mode
 */
export function assertProduction(operationName: string): void {
  if (RUNTIME.isProduction) return;

  const message = `[TRIAL_BLOCKED] ${operationName} is disabled in trial mode`;
  Logger.warn(`⚠️ ${message}`);
  throw new Error(message);
}

/**
 * Logs the current runtime status. Call this on app boot.
 */
export function logRuntimeStatus(): void {
  const icon = RUNTIME.isProduction ? "🔴" : "🟢";
  const modeLabel = RUNTIME.isProduction ? "PRODUCTION" : "TRIAL";
  const stable = RUNTIME.devStableActive ? " [STABLE]" : "";

  Logger.info(`${icon} Runtime Mode: ${modeLabel}${stable}`);
  Logger.info(`   → Backend: ${RUNTIME.backendType}`);

  if (RUNTIME.isProduction) {
    Logger.info("   → Mocks are FORBIDDEN");
    Logger.info("   → All operations are REAL");
  } else {
    Logger.info("   → Mocks are ALLOWED");
    Logger.info("   → Data may be ephemeral");
  }
}

// ============================================================================
// RESTAURANT ID GUARDS
// ============================================================================

/** IDs that are ONLY valid in trial/demo mode (hardcoded, seed, or trial) */
const DEMO_ONLY_RESTAURANT_IDS = new Set([
  "trial-restaurant-id",
  "mock-restaurant-id",
]);

/** UUID prefix pattern for seed/demo data */
const SEED_UUID_PREFIX = "00000000-0000-0000-0000-";

/**
 * Assert that a restaurant ID is valid for the current runtime mode.
 * In production, seed/trial/mock IDs are FORBIDDEN.
 *
 * @throws Error if a demo-only restaurant ID is used in production
 */
export function assertValidRestaurantId(restaurantId: string): void {
  if (!RUNTIME.isProduction) return;

  if (DEMO_ONLY_RESTAURANT_IDS.has(restaurantId)) {
    throw new Error(
      `[PRODUCTION_VIOLATION] Demo restaurant ID "${restaurantId}" used in production mode. ` +
        `A real restaurant must be created via onboarding.`,
    );
  }

  if (restaurantId.startsWith(SEED_UUID_PREFIX)) {
    throw new Error(
      `[PRODUCTION_VIOLATION] Seed restaurant ID "${restaurantId}" used in production mode. ` +
        `Seed data (00000000-*) is forbidden in production.`,
    );
  }
}

// ============================================================================
// DEMO FLAGS GUARD
// ============================================================================

/**
 * Validate that demo flags are correctly set for the current runtime mode.
 * Returns an array of violations (empty = all good).
 */
export function validateDemoFlags(): string[] {
  if (!RUNTIME.isProduction) return [];

  const violations: string[] = [];

  // Check for DEMO_PREVIEW (must be false in production)
  const demoPreview =
    typeof import.meta !== "undefined"
      ? import.meta.env?.VITE_DEMO_PREVIEW
      : undefined;
  if (demoPreview === "true" || demoPreview === true) {
    violations.push("DEMO_PREVIEW must be false in production");
  }

  // Check for MOCK_FISCAL (must be false in production)
  const mockFiscal =
    typeof import.meta !== "undefined"
      ? import.meta.env?.VITE_MOCK_FISCAL
      : undefined;
  if (mockFiscal === "true" || mockFiscal === true) {
    violations.push("MOCK_FISCAL must be false in production");
  }

  return violations;
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export const isProduction = RUNTIME.isProduction;
export const isTrial = RUNTIME.isTrial;
export const runtimeMode = RUNTIME.mode;
