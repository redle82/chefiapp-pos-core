/**
 * Health Check Service
 *
 * Verifica a saúde do sistema e retorna status.
 */

// LEGACY / LAB — blocked in Docker mode
import { isDockerBackend } from "../infra/backendAdapter";
import {
  removeTabIsolated,
  setTabIsolated,
} from "../storage/TabIsolatedStorage";
import { supabase } from "../supabase";

// ---------------------------------------------------------------------------
// Core RPC Health Check (Docker backend)
// ---------------------------------------------------------------------------
export interface CoreHealthResult {
  status: "healthy" | "degraded";
  timestamp: string;
  version: string;
  checks: Record<string, unknown>;
}

/**
 * Calls the `health_check` PostgreSQL RPC to verify the full Core stack.
 * Only works when running against Docker Core backend.
 * Returns null if the RPC is not available (e.g., migration not applied yet).
 */
export async function checkCoreHealth(): Promise<CoreHealthResult | null> {
  if (!isDockerBackend()) return null;

  try {
    const { getTableClient } = await import("../infra/coreRpc");
    const client = await getTableClient();
    const { data, error } = await client.rpc("health_check");

    if (error) {
      // RPC not deployed yet — graceful degradation
      if (error.code === "42883" || error.message?.includes("does not exist")) {
        console.warn("[HealthCheck] health_check RPC not deployed yet");
        return null;
      }
      console.error("[HealthCheck] RPC error:", error.message);
      return {
        status: "degraded",
        timestamp: new Date().toISOString(),
        version: "unknown",
        checks: { error: error.message },
      };
    }

    return data as CoreHealthResult;
  } catch (err) {
    console.error("[HealthCheck] Failed to call health_check RPC:", err);
    return null;
  }
}

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  checks: {
    database: {
      status: "ok" | "error";
      message?: string;
    };
    supabase: {
      status: "ok" | "error";
      message?: string;
    };
    storage: {
      status: "ok" | "error";
      message?: string;
    };
  };
  version: string;
}

/**
 * Verifica a saúde do sistema
 */
export async function checkHealth(): Promise<HealthStatus> {
  const checks = {
    database: { status: "ok" as const },
    supabase: { status: "ok" as const },
    storage: { status: "ok" as const },
  };

  // Check 1: Database Connection (via Supabase)
  try {
    const { error } = await supabase
      .from("gm_restaurants")
      .select("id")
      .limit(1);

    if (error) {
      checks.database = {
        status: "error",
        message: error.message,
      };
    }
  } catch (err: any) {
    checks.database = {
      status: "error",
      message: err.message || "Database connection failed",
    };
  }

  // Check 2: Supabase Auth
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    // Se não houver sessão, não é erro - apenas verifica se o serviço responde
    checks.supabase = { status: "ok" };
  } catch (err: any) {
    checks.supabase = {
      status: "error",
      message: err.message || "Supabase auth check failed",
    };
  }

  // Check 3: Storage (TabIsolatedStorage)
  try {
    const testKey = "__health_check__";
    setTabIsolated(testKey, "test");
    removeTabIsolated(testKey);
    checks.storage = { status: "ok" };
  } catch (err: any) {
    checks.storage = {
      status: "error",
      message: err.message || "TabIsolatedStorage unavailable",
    };
  }

  // Determinar status geral
  const hasErrors = Object.values(checks).some(
    (check) => check.status === "error",
  );
  const hasWarnings = false; // Pode ser expandido

  let status: "healthy" | "degraded" | "unhealthy";
  if (hasErrors && checks.database.status === "error") {
    status = "unhealthy"; // Database é crítico
  } else if (hasErrors) {
    status = "degraded"; // Alguns serviços falharam, mas não críticos
  } else {
    status = "healthy";
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    checks,
    version: "1.0.0", // Pode ser lido de package.json
  };
}

/**
 * Health check endpoint handler (para uso em rotas)
 */
export async function healthCheckHandler(): Promise<Response> {
  try {
    const health = await checkHealth();
    const statusCode =
      health.status === "healthy"
        ? 200
        : health.status === "degraded"
        ? 200
        : 503;

    return new Response(JSON.stringify(health), {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error.message || "Health check failed",
      }),
      {
        status: 503,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}
