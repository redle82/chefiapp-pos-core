/**
 * HealthCheckService — Comprehensive system health verification
 *
 * Runs individual checks for each subsystem and aggregates into an overall status.
 * All checks are non-blocking: a failing check never crashes the caller.
 */

import { Logger } from "../logger";
import { supabase } from "../supabase";
import {
  getAllCircuitBreakers,
  type CircuitBreakerState,
} from "../infra/CircuitBreaker";

export type HealthStatus = "healthy" | "degraded" | "down";

export interface HealthCheckResult {
  name: string;
  status: HealthStatus;
  latencyMs: number;
  details?: Record<string, unknown>;
}

export interface CircuitBreakerHealthEntry {
  name: string;
  state: CircuitBreakerState;
  consecutiveFailures: number;
  totalCalls: number;
  totalFailures: number;
  lastFailureTime: number;
}

export interface SystemHealthSummary {
  overall: HealthStatus;
  timestamp: string;
  checks: HealthCheckResult[];
  circuitBreakers: CircuitBreakerHealthEntry[];
  durationMs: number;
}

async function timedCheck(
  name: string,
  fn: () => Promise<{ status: HealthStatus; details?: Record<string, unknown> }>,
): Promise<HealthCheckResult> {
  const start = performance.now();
  try {
    const result = await fn();
    return {
      name,
      status: result.status,
      latencyMs: Math.round(performance.now() - start),
      details: result.details,
    };
  } catch (err) {
    return {
      name,
      status: "down",
      latencyMs: Math.round(performance.now() - start),
      details: { error: err instanceof Error ? err.message : String(err) },
    };
  }
}

/**
 * Check Supabase connectivity — query must finish within 2 seconds.
 */
export async function checkSupabase(): Promise<HealthCheckResult> {
  return timedCheck("supabase", async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    try {
      const { error } = await supabase
        .from("gm_restaurants")
        .select("id")
        .limit(1)
        .abortSignal(controller.signal);

      clearTimeout(timeout);

      if (error) {
        return { status: "degraded", details: { error: error.message } };
      }
      return { status: "healthy" };
    } catch (err) {
      clearTimeout(timeout);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("abort")) {
        return { status: "degraded", details: { error: "Query exceeded 2s timeout" } };
      }
      throw err;
    }
  });
}

/**
 * Check SyncEngine — queue length, stuck items.
 */
export async function checkSyncEngine(): Promise<HealthCheckResult> {
  return timedCheck("sync_engine", async () => {
    try {
      const { SyncEngine } = await import("../sync/SyncEngine");
      const connectivity = SyncEngine.getConnectivity();

      // Subscribe briefly to capture current state
      let pendingCount = 0;
      let isProcessing = false;
      const unsub = SyncEngine.subscribe((state) => {
        pendingCount = state.pendingCount;
        isProcessing = state.isProcessing;
      });
      unsub(); // Immediately unsubscribe after getting initial state

      const isStuck = pendingCount > 50;

      if (connectivity === "offline") {
        return {
          status: "degraded",
          details: { connectivity, pendingCount, isProcessing },
        };
      }
      if (isStuck) {
        return {
          status: "degraded",
          details: { connectivity, pendingCount, warning: "Queue exceeds 50 items" },
        };
      }
      return {
        status: "healthy",
        details: { connectivity, pendingCount, isProcessing },
      };
    } catch {
      return { status: "down", details: { error: "SyncEngine not available" } };
    }
  });
}

/**
 * Check payment providers — verifies configured providers are reachable.
 */
export async function checkPaymentProviders(): Promise<HealthCheckResult> {
  return timedCheck("payment_providers", async () => {
    // Payment providers are external services; we verify config presence.
    // A full HTTP ping would be too heavy for a browser health check.
    try {
      const stripeKey =
        typeof import.meta !== "undefined"
          ? (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY
          : undefined;

      const configured: string[] = [];
      if (stripeKey) configured.push("stripe");

      if (configured.length === 0) {
        return { status: "degraded", details: { warning: "No payment provider configured" } };
      }
      return { status: "healthy", details: { providers: configured } };
    } catch {
      return { status: "degraded", details: { error: "Unable to check payment config" } };
    }
  });
}

/**
 * Check printer — verifies print queue is not stuck.
 */
export async function checkPrinter(): Promise<HealthCheckResult> {
  return timedCheck("printer", async () => {
    try {
      const { PrintQueue } = await import("../print/PrintQueue");
      const pending = await PrintQueue.getPending();
      const stuckThreshold = 10;

      if (pending.length > stuckThreshold) {
        return {
          status: "degraded",
          details: { pendingJobs: pending.length, warning: "Print queue backlog" },
        };
      }
      return { status: "healthy", details: { pendingJobs: pending.length } };
    } catch {
      // Printer not configured is acceptable
      return { status: "healthy", details: { note: "Print queue not available" } };
    }
  });
}

/**
 * Check Service Worker registration.
 */
export async function checkServiceWorker(): Promise<HealthCheckResult> {
  return timedCheck("service_worker", async () => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return { status: "healthy", details: { note: "SW not supported in this environment" } };
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        return { status: "degraded", details: { warning: "No SW registered" } };
      }

      const isActive = !!registration.active;
      return {
        status: isActive ? "healthy" : "degraded",
        details: {
          active: isActive,
          installing: !!registration.installing,
          waiting: !!registration.waiting,
          scope: registration.scope,
        },
      };
    } catch {
      return { status: "degraded", details: { error: "Failed to query SW registration" } };
    }
  });
}

/**
 * Collect circuit breaker health entries from the global registry.
 */
function getCircuitBreakerHealth(): CircuitBreakerHealthEntry[] {
  const entries: CircuitBreakerHealthEntry[] = [];
  for (const [, cb] of getAllCircuitBreakers()) {
    const metrics = cb.getMetrics();
    entries.push({
      name: cb.name,
      state: metrics.state,
      consecutiveFailures: metrics.consecutiveFailures,
      totalCalls: metrics.totalCalls,
      totalFailures: metrics.totalFailures,
      lastFailureTime: metrics.lastFailureTime,
    });
  }
  return entries;
}

/**
 * Check circuit breaker states — any OPEN breaker means degraded service.
 */
export async function checkCircuitBreakers(): Promise<HealthCheckResult> {
  return timedCheck("circuit_breakers", async () => {
    const entries = getCircuitBreakerHealth();
    if (entries.length === 0) {
      return { status: "healthy", details: { note: "No circuit breakers registered" } };
    }

    const openBreakers = entries.filter((e) => e.state === "OPEN");
    const halfOpenBreakers = entries.filter((e) => e.state === "HALF_OPEN");

    const breakerSummary = Object.fromEntries(
      entries.map((e) => [e.name, e.state]),
    );

    if (openBreakers.length > 0) {
      return {
        status: "degraded",
        details: {
          breakers: breakerSummary,
          openServices: openBreakers.map((e) => e.name),
          warning: `${openBreakers.length} service(s) in OPEN state`,
        },
      };
    }

    if (halfOpenBreakers.length > 0) {
      return {
        status: "healthy",
        details: {
          breakers: breakerSummary,
          note: `${halfOpenBreakers.length} service(s) recovering (HALF_OPEN)`,
        },
      };
    }

    return { status: "healthy", details: { breakers: breakerSummary } };
  });
}

/**
 * Run all health checks and return aggregated summary.
 */
export async function checkAll(): Promise<SystemHealthSummary> {
  const start = performance.now();

  const checks = await Promise.all([
    checkSupabase(),
    checkSyncEngine(),
    checkPaymentProviders(),
    checkPrinter(),
    checkServiceWorker(),
    checkCircuitBreakers(),
  ]);

  const circuitBreakers = getCircuitBreakerHealth();
  const overall = getSystemStatus(checks);

  const summary: SystemHealthSummary = {
    overall,
    timestamp: new Date().toISOString(),
    checks,
    circuitBreakers,
    durationMs: Math.round(performance.now() - start),
  };

  Logger.debug("[HealthCheckService] System health check complete", {
    overall,
    durationMs: summary.durationMs,
    openCircuitBreakers: circuitBreakers
      .filter((cb) => cb.state === "OPEN")
      .map((cb) => cb.name),
  });

  return summary;
}

/**
 * Derive overall system status from individual checks.
 * Any "down" -> "down"; any "degraded" -> "degraded"; else "healthy".
 */
export function getSystemStatus(checks: HealthCheckResult[]): HealthStatus {
  if (checks.some((c) => c.status === "down")) return "down";
  if (checks.some((c) => c.status === "degraded")) return "degraded";
  return "healthy";
}
