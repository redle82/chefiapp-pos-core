/**
 * Health Check Endpoint
 * Provides system health status for load balancers and monitoring.
 *
 * GET /health → basic liveness check
 * GET /health/ready → readiness check (DB, Redis, etc.)
 * GET /health/detailed → detailed status (admin only)
 */

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  uptime: number;
  timestamp: string;
  version: string;
  checks: Record<string, ComponentCheck>;
}

interface ComponentCheck {
  status: "up" | "down" | "degraded";
  latencyMs?: number;
  message?: string;
  lastChecked: string;
}

const startTime = Date.now();
const VERSION = process.env.APP_VERSION || "1.0.0";

async function checkDatabase(): Promise<ComponentCheck> {
  const start = Date.now();
  try {
    // Placeholder — replace with actual DB ping
    const latencyMs = Date.now() - start;
    return {
      status: latencyMs < 1000 ? "up" : "degraded",
      latencyMs,
      lastChecked: new Date().toISOString(),
    };
  } catch (err) {
    return {
      status: "down",
      message: err instanceof Error ? err.message : "Unknown error",
      lastChecked: new Date().toISOString(),
    };
  }
}

async function checkMemory(): Promise<ComponentCheck> {
  if (typeof process !== "undefined" && process.memoryUsage) {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1048576);
    const heapTotalMB = Math.round(usage.heapTotal / 1048576);
    const usagePercent = Math.round((usage.heapUsed / usage.heapTotal) * 100);

    return {
      status: usagePercent < 85 ? "up" : usagePercent < 95 ? "degraded" : "down",
      message: `${heapUsedMB}MB / ${heapTotalMB}MB (${usagePercent}%)`,
      lastChecked: new Date().toISOString(),
    };
  }
  return { status: "up", message: "N/A (browser)", lastChecked: new Date().toISOString() };
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const [db, memory] = await Promise.all([checkDatabase(), checkMemory()]);

  const checks: Record<string, ComponentCheck> = { database: db, memory };

  const allUp = Object.values(checks).every((c) => c.status === "up");
  const anyDown = Object.values(checks).some((c) => c.status === "down");

  return {
    status: anyDown ? "unhealthy" : allUp ? "healthy" : "degraded",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    version: VERSION,
    checks,
  };
}

export async function getLivenessCheck(): Promise<{ status: string }> {
  return { status: "ok" };
}

export async function getReadinessCheck(): Promise<{ ready: boolean; reason?: string }> {
  const health = await getHealthStatus();
  if (health.status === "unhealthy") {
    const downComponents = Object.entries(health.checks)
      .filter(([, c]) => c.status === "down")
      .map(([name]) => name);
    return { ready: false, reason: `Components down: ${downComponents.join(", ")}` };
  }
  return { ready: true };
}
