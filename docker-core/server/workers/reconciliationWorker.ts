import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { generateOrgDailyConsolidation } from "../finance/orgConsolidationEngine";
import { generateDailyReconciliation } from "../finance/reconciliationEngine";

export interface ReconciliationWorkerError {
  restaurantId: string;
  message: string;
}

export interface ReconciliationWorkerResult {
  date: string;
  scanned: number;
  reconciled: number;
  failures: ReconciliationWorkerError[];
}

export interface OrgReconciliationWorkerResult {
  date: string;
  scanned: number;
  consolidated: number;
  failures: Array<{ organizationId: string; message: string }>;
}

function getSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "ReconciliationWorker requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)",
    );
  }

  return createClient(url, key);
}

function getYesterdayIsoDate(now = new Date()): string {
  const dt = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

export async function runDailyReconciliation(
  client?: SupabaseClient,
  date = getYesterdayIsoDate(),
): Promise<ReconciliationWorkerResult> {
  const supabase = client ?? getSupabaseClient();

  const { data: restaurants, error } = await supabase
    .from("gm_restaurants")
    .select("id")
    .eq("status", "active");

  if (error) {
    throw new Error(`Failed to load active restaurants: ${error.message}`);
  }

  const rows = Array.isArray(restaurants) ? restaurants : [];
  const result: ReconciliationWorkerResult = {
    date,
    scanned: rows.length,
    reconciled: 0,
    failures: [],
  };

  for (const row of rows) {
    const restaurantId = (row as { id?: string }).id;
    if (!restaurantId) continue;

    try {
      const reconciliation = await generateDailyReconciliation(
        restaurantId,
        date,
        supabase,
      );

      result.reconciled += 1;

      console.log(
        JSON.stringify({
          event: "reconciliation.generated",
          restaurantId,
          date,
          status: reconciliation.status,
          discrepancy_amount_cents: reconciliation.discrepancy_amount_cents,
        }),
      );
    } catch (workerError) {
      const message =
        workerError instanceof Error
          ? workerError.message
          : String(workerError);

      result.failures.push({ restaurantId, message });

      console.error(
        JSON.stringify({
          event: "reconciliation.failed",
          restaurantId,
          date,
          message,
        }),
      );
    }
  }

  return result;
}

export async function runOrgConsolidation(
  client?: SupabaseClient,
  date = getYesterdayIsoDate(),
): Promise<OrgReconciliationWorkerResult> {
  const supabase = client ?? getSupabaseClient();

  const { data: organizations, error } = await supabase
    .from("gm_organizations")
    .select("id");

  if (error) {
    throw new Error(`Failed to load organizations: ${error.message}`);
  }

  const rows = Array.isArray(organizations) ? organizations : [];
  const result: OrgReconciliationWorkerResult = {
    date,
    scanned: rows.length,
    consolidated: 0,
    failures: [],
  };

  for (const row of rows) {
    const organizationId = (row as { id?: string }).id;
    if (!organizationId) continue;

    try {
      const consolidation = await generateOrgDailyConsolidation(
        organizationId,
        date,
        supabase,
      );

      result.consolidated += 1;

      console.log(
        JSON.stringify({
          event: "org.consolidation.generated",
          organizationId,
          date,
          status: consolidation.status,
          total_revenue_cents: consolidation.total_revenue_cents,
          total_discrepancy_cents: consolidation.total_discrepancy_cents,
        }),
      );
    } catch (workerError) {
      const message =
        workerError instanceof Error
          ? workerError.message
          : String(workerError);

      result.failures.push({ organizationId, message });

      console.error(
        JSON.stringify({
          event: "org.consolidation.failed",
          organizationId,
          date,
          message,
        }),
      );
    }
  }

  return result;
}

async function main(): Promise<void> {
  const summary = await runDailyReconciliation();
  const orgSummary = await runOrgConsolidation(undefined, summary.date);

  console.log(
    JSON.stringify({
      event: "reconciliation.summary",
      ...summary,
      org: orgSummary,
      timestamp: new Date().toISOString(),
    }),
  );

  if (summary.failures.length > 0 || orgSummary.failures.length > 0) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error("ReconciliationWorker failed:", error);
    process.exit(1);
  });
}
