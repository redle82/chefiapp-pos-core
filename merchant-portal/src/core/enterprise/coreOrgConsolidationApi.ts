/**
 * Core Org Consolidation API — Enterprise daily consolidation
 *
 * Calls get_org_daily_consolidation RPC (Core).
 * Consumes org consolidation backend.
 */

import { getDockerCoreFetchClient } from "../infra/dockerCoreFetchClient";

export interface OrgLocationRow {
  restaurant_id: string;
  restaurant_name: string;
  revenue_cents: number;
  discrepancy_cents: number;
  status: "green" | "yellow" | "red";
}

export interface OrgDailyConsolidation {
  total_locations: number;
  total_revenue_cents: number;
  total_discrepancy_cents: number;
  overall_status: "green" | "yellow" | "red";
  locations: OrgLocationRow[];
}

export async function getOrgDailyConsolidation(
  orgId: string,
  date: string
): Promise<OrgDailyConsolidation | null> {
  const client = getDockerCoreFetchClient();
  const { data, error } = await client.rpc("get_org_daily_consolidation", {
    p_org_id: orgId,
    p_date: date,
  });
  if (error) {
    throw new Error(
      (error as { message?: string }).message ??
        "Failed to fetch org consolidation"
    );
  }
  const raw = data as OrgDailyConsolidation | null;
  return raw ?? null;
}
