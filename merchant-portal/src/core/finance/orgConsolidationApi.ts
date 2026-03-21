/**
 * Org Consolidation API — Enterprise daily consolidation
 *
 * Calls get_org_daily_consolidation RPC via docker-core.
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

/** Error codes for enterprise consolidation API */
export const ORG_CONSOLIDATION_ERROR = {
  /** RPC missing / 404 — Core migration not installed */
  BACKEND_MISSING: "BACKEND_MISSING",
  /** Generic Core/PostgREST error (500, etc.) */
  CORE_ERROR: "CORE_ERROR",
} as const;

export type OrgConsolidationErrorCode =
  (typeof ORG_CONSOLIDATION_ERROR)[keyof typeof ORG_CONSOLIDATION_ERROR];

export class OrgConsolidationError extends Error {
  constructor(
    message: string,
    public readonly code: OrgConsolidationErrorCode
  ) {
    super(message);
    this.name = "OrgConsolidationError";
  }
}

function isBackendMissingError(err: { code?: string }): boolean {
  const c = err.code ?? "";
  return (
    c === "FUNCTION_UNAVAILABLE" ||
    c === "PGRST116" ||
    c === "42883" ||
    String(err).toLowerCase().includes("not found") ||
    String(err).toLowerCase().includes("does not exist")
  );
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
    const msg =
      (error as { message?: string }).message ??
      "Failed to fetch org consolidation";
    if (isBackendMissingError(error as { code?: string })) {
      throw new OrgConsolidationError(msg, ORG_CONSOLIDATION_ERROR.BACKEND_MISSING);
    }
    throw new OrgConsolidationError(msg, ORG_CONSOLIDATION_ERROR.CORE_ERROR);
  }
  const raw = data as OrgDailyConsolidation | null;
  return raw ?? null;
}

function getDatesBetween(from: string, to: string): string[] {
  const out: string[] = [];
  const dFrom = new Date(from);
  const dTo = new Date(to);
  const cur = new Date(dFrom);
  while (cur <= dTo) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/**
 * List org daily consolidations for a date range.
 * Calls getOrgDailyConsolidation for each date (no dedicated list RPC).
 */
export async function listOrgDailyConsolidation(
  orgId: string,
  dateFrom: string,
  dateTo: string
): Promise<OrgDailyConsolidation[]> {
  const dates = getDatesBetween(dateFrom, dateTo);
  const results = await Promise.all(
    dates.map((d) => getOrgDailyConsolidation(orgId, d))
  );
  return results.filter(
    (r): r is OrgDailyConsolidation => r != null
  );
}
