import {
  BackendType,
  getBackendHealthCheckBaseUrl,
  getBackendType,
} from "./infra/backendAdapter";

export type HealthStatus = "ok" | "down";

const CORE_REQUIRED_MSG =
  "Health check requires Docker Core. Supabase domain fallback is forbidden.";

/**
 * Health check ONLY via Docker Core (GET /rest/v1/).
 * ANTI-SUPABASE §4: No supabase.functions.invoke; if not Docker, throw.
 */
export async function fetchHealth(
  basePath: string = ""
): Promise<HealthStatus> {
  if (getBackendType() !== BackendType.docker) {
    throw new Error(CORE_REQUIRED_MSG);
  }

  let base = getBackendHealthCheckBaseUrl();
  // Fallback: em browser com proxy (/rest), usar origin para o health ir via Vite proxy
  if (!base && typeof window !== "undefined") {
    base = window.location.origin;
  }
  if (!base) {
    console.warn("[Health] Docker Core URL not configured");
    return "down";
  }
  try {
    const url = `${base}/rest/v1/`;
    const res = await fetch(url, { method: "GET", mode: "cors" });
    return res.ok ? "ok" : "down";
  } catch (e) {
    console.warn("[Health] Docker Core unreachable:", e);
    return "down";
  }
}

export * from "./health/gating";
export * from "./health/useCoreHealth";
