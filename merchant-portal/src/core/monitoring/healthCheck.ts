/**
 * Health Check Service
 *
 * Verifica a saúde do sistema e retorna status.
 */

// LEGACY / LAB — blocked in Docker mode
import {
  removeTabIsolated,
  setTabIsolated,
} from "../storage/TabIsolatedStorage";
import { supabase } from "../supabase";

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
    (check) => check.status === "error"
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
      }
    );
  }
}
