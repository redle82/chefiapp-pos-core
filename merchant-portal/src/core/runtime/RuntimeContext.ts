/**
 * RuntimeContext - Production vs Trial Mode Detection
 *
 * Enforces PRODUCTION_READINESS_CONTRACT.md and exposes backend type.
 * - backendType: 'docker' | 'supabase' (SSOT from backendAdapter)
 * - Production mode: Mocks are FORBIDDEN
 * - Trial mode: Mocks are allowed
 */

import { getBackendType, type BackendType } from "../infra/backendAdapter";
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
    console.log(
      `[RUNTIME] ⚠️ Mock active: ${serviceName} (allowed in trial mode)`,
    );
    return;
  }

  // CRITICAL: Crash in production
  const message = `[PRODUCTION_VIOLATION] Mock usage forbidden: ${serviceName}`;
  console.error(`❌ ${message}`);
  console.error(
    "Service attempted to use mock implementation in production mode.",
  );
  console.error(
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
  console.warn(`⚠️ ${message}`);
  throw new Error(message);
}

/**
 * Logs the current runtime status. Call this on app boot.
 */
export function logRuntimeStatus(): void {
  const icon = RUNTIME.isProduction ? "🔴" : "🟢";
  const modeLabel = RUNTIME.isProduction ? "PRODUCTION" : "TRIAL";
  const stable = RUNTIME.devStableActive ? " [STABLE]" : "";

  console.log(`${icon} Runtime Mode: ${modeLabel}${stable}`);
  console.log(`   → Backend: ${RUNTIME.backendType}`);

  if (RUNTIME.isProduction) {
    console.log("   → Mocks are FORBIDDEN");
    console.log("   → All operations are REAL");
  } else {
    console.log("   → Mocks are ALLOWED");
    console.log("   → Data may be ephemeral");
  }
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export const isProduction = RUNTIME.isProduction;
export const isTrial = RUNTIME.isTrial;
export const runtimeMode = RUNTIME.mode;
