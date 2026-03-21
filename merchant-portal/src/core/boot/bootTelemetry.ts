/**
 * Boot Pipeline — Telemetry
 *
 * Structured console logging and performance marks for the boot pipeline.
 * Uses `performance.mark()` / `performance.measure()` so DevTools shows
 * boot steps in the Performance panel. Console output uses collapsed groups
 * in production-like builds and expanded in debug mode.
 *
 * All logging is gated behind `isDebugEnabled()` to keep production quiet
 * unless the user explicitly enables diagnostics.
 *
 * @module core/boot/bootTelemetry
 */

import { isDebugEnabled, isDevStableMode } from "../runtime/devStableMode";
import type { BootSnapshot } from "./BootState";
import { BootStep, ERROR_STEPS } from "./BootState";

// ─── Performance Marks ────────────────────────────────────────────────────

const MARK_PREFIX = "boot:";

/**
 * Place a `performance.mark` for the given boot step.
 * Marks are visible in DevTools Performance panel.
 */
export function markBootStep(step: BootStep): void {
  try {
    performance.mark(`${MARK_PREFIX}${step}`);
  } catch {
    // Swallow — performance API may be unavailable in SSR/tests
  }
}

/**
 * Measure duration between two boot steps.
 * Creates a `performance.measure` entry visible in DevTools.
 */
export function measureBootSpan(
  name: string,
  startStep: BootStep,
  endStep: BootStep,
): void {
  try {
    performance.measure(
      `${MARK_PREFIX}${name}`,
      `${MARK_PREFIX}${startStep}`,
      `${MARK_PREFIX}${endStep}`,
    );
  } catch {
    // Silently fail if marks don't exist
  }
}

// ─── Console Logging ──────────────────────────────────────────────────────

const STEP_EMOJI: Record<BootStep, string> = {
  [BootStep.BOOT_START]: "🚀",
  [BootStep.AUTH_CHECKING]: "🔐",
  [BootStep.AUTH_RESOLVED]: "✅",
  [BootStep.TENANT_LOADING]: "🏢",
  [BootStep.TENANT_RESOLVED]: "✅",
  [BootStep.LIFECYCLE_DERIVED]: "📊",
  [BootStep.ROUTE_DECIDING]: "🧭",
  [BootStep.BOOT_DONE]: "🎉",
  [BootStep.AUTH_TIMEOUT]: "⏰",
  [BootStep.TENANT_ERROR]: "❌",
  [BootStep.TENANT_TIMEOUT]: "⏰",
  [BootStep.ROUTE_ERROR]: "❌",
};

/**
 * Should boot telemetry log to console?
 * - Always logs in dev mode (not devStable)
 * - In devStable: only if debug is explicitly enabled
 * - Error steps always log regardless
 */
function shouldLog(step: BootStep): boolean {
  if (ERROR_STEPS.has(step)) return true;
  if (!isDevStableMode()) return true;
  return isDebugEnabled();
}

/**
 * Log a boot step transition to console.
 * Uses groupCollapsed for non-error steps to keep console tidy.
 */
export function logBootTransition(
  prevStep: BootStep,
  snapshot: BootSnapshot,
): void {
  if (!shouldLog(snapshot.step)) return;

  const emoji = STEP_EMOJI[snapshot.step] ?? "·";
  const tag = `[Boot] ${emoji} ${snapshot.step}`;
  const ms = `+${snapshot.elapsedMs}ms`;

  if (ERROR_STEPS.has(snapshot.step)) {
    console.error(tag, ms, {
      from: prevStep,
      error: snapshot.error?.message,
      auth: snapshot.auth,
      tenant: snapshot.tenant,
    });
    return;
  }

  if (snapshot.step === BootStep.BOOT_DONE) {
    const dest = snapshot.destination;
    console.log(
      `${tag} ${ms} → ${dest?.type === "REDIRECT" ? dest.to : "ALLOW"} [${
        dest?.reasonCode
      }]`,
    );
    return;
  }

  // Non-terminal, non-error: collapsed group
  try {
    console.groupCollapsed(`${tag} ${ms}`);
    console.log("from:", prevStep);
    if (snapshot.step === BootStep.AUTH_RESOLVED) {
      console.log("auth:", snapshot.auth);
    }
    if (snapshot.step === BootStep.TENANT_RESOLVED) {
      console.log("tenant:", snapshot.tenant);
    }
    if (snapshot.step === BootStep.ROUTE_DECIDING) {
      console.log("destination:", snapshot.destination);
    }
    console.groupEnd();
  } catch {
    // Fallback for environments without groupCollapsed
    console.log(tag, ms);
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────

/**
 * Log the full boot summary after pipeline completes.
 * Includes total duration and final destination.
 */
export function logBootSummary(snapshot: BootSnapshot): void {
  if (!shouldLog(snapshot.step)) return;

  const isError = ERROR_STEPS.has(snapshot.step);
  const icon = isError ? "🔴" : "🟢";
  const label = `[Boot] ${icon} Pipeline ${isError ? "FAILED" : "OK"} in ${
    snapshot.elapsedMs
  }ms`;

  if (isError) {
    console.error(label, {
      step: snapshot.step,
      error: snapshot.error?.message,
      auth: snapshot.auth,
      tenant: snapshot.tenant,
    });
  } else {
    console.log(label, {
      destination: snapshot.destination,
      auth: { userId: snapshot.auth.userId },
      tenant: {
        hasOrg: snapshot.tenant.hasOrg,
        restaurantId: snapshot.tenant.restaurantId,
      },
    });
  }

  // Performance measure: total boot time
  measureBootSpan("total", BootStep.BOOT_START, snapshot.step);
}

// ─── Diagnostic Serializer ────────────────────────────────────────────────

/**
 * Serialize a BootSnapshot for structured logging / error reporting.
 * Strips the Error object (not JSON-serializable) and replaces with message.
 */
export function serializeBootSnapshot(
  snapshot: BootSnapshot,
): Record<string, unknown> {
  return {
    step: snapshot.step,
    elapsedMs: snapshot.elapsedMs,
    auth: {
      isAuthenticated: snapshot.auth.isAuthenticated,
      userId: snapshot.auth.userId,
      loading: snapshot.auth.loading,
    },
    tenant: {
      hasOrg: snapshot.tenant.hasOrg,
      restaurantId: snapshot.tenant.restaurantId,
      activated: snapshot.tenant.activated,
      sealed: snapshot.tenant.sealed,
    },
    destination: snapshot.destination
      ? {
          type: snapshot.destination.type,
          to: snapshot.destination.to,
          reasonCode: snapshot.destination.reasonCode,
        }
      : null,
    error: snapshot.error?.message ?? null,
  };
}
