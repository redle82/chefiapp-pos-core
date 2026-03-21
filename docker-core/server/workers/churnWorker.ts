/**
 * Churn Recovery Worker — Scans due retries and executes them.
 *
 * Query: gm_churn_recovery_attempts WHERE next_retry_at <= NOW() AND recovered = false
 * Callable manually for testing. Does not rely on external cron.
 */

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { executeRetry, scanForDueRetries } from "../billing/churnRecoveryEngine";

export interface ChurnWorkerResult {
  scanned: number;
  executed: number;
  errors: string[];
}

function getSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "ChurnWorker requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)"
    );
  }
  return createClient(url, key);
}

/**
 * Scan for due retries and execute them.
 */
export async function runChurnWorker(
  client?: SupabaseClient
): Promise<ChurnWorkerResult> {
  const supabase = client ?? getSupabaseClient();
  const due = await scanForDueRetries(supabase);
  const result: ChurnWorkerResult = { scanned: due.length, executed: 0, errors: [] };

  for (const row of due) {
    try {
      const res = await executeRetry(supabase, row.restaurant_id);
      if (res.success) result.executed++;
    } catch (e) {
      result.errors.push(
        `restaurant=${row.restaurant_id}: ${(e as Error).message}`
      );
    }
  }

  return result;
}

/**
 * Entry point for manual/cron invocation.
 */
async function main(): Promise<void> {
  const result = await runChurnWorker();
  console.log(
    JSON.stringify({
      scanned: result.scanned,
      executed: result.executed,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    })
  );
  if (result.errors.length > 0) process.exitCode = 1;
}

if (require.main === module) {
  main().catch((e) => {
    console.error("ChurnWorker failed:", e);
    process.exit(1);
  });
}
