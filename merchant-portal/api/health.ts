/**
 * GET /api/health
 *
 * Health check endpoint for uptime monitoring.
 * Verifies Supabase connectivity and required env vars.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

const REQUIRED_ENV_VARS = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
];

interface HealthCheck {
  name: string;
  status: "pass" | "fail";
  message?: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const checks: HealthCheck[] = [];

  // Check required env vars
  for (const varName of REQUIRED_ENV_VARS) {
    checks.push({
      name: `env:${varName}`,
      status: process.env[varName] ? "pass" : "fail",
      message: process.env[varName] ? "Set" : "Missing",
    });
  }

  // Check Supabase connectivity
  try {
    const { getSupabaseAdmin } = await import("./_lib/supabase");
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("restaurants")
      .select("id")
      .limit(1);

    checks.push({
      name: "supabase:connectivity",
      status: error ? "fail" : "pass",
      message: error ? error.message : "Connected",
    });
  } catch (err) {
    checks.push({
      name: "supabase:connectivity",
      status: "fail",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }

  const allPassing = checks.every((c) => c.status === "pass");

  res.status(allPassing ? 200 : 503).json({
    status: allPassing ? "ok" : "degraded",
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
    timestamp: new Date().toISOString(),
    checks,
  });
}
