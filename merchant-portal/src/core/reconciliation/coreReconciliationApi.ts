/**
 * Core Reconciliation API — Financial reconciliation report
 *
 * Calls get_reconciliation_report RPC (Core).
 */

import { getDockerCoreFetchClient } from "../infra/dockerCoreFetchClient";

export interface ReconciliationDiscrepancy {
  order_id: string;
  expected: number;
  received: number;
  difference: number;
  provider?: string;
}

export interface ReconciliationReport {
  total_orders: number;
  total_order_amount: number;
  total_receipts: number;
  total_receipt_amount: number;
  missing_receipts: number;
  orphan_receipts: number;
  mismatched_orders: number;
  discrepancies: ReconciliationDiscrepancy[];
}

export async function getReconciliationReport(
  restaurantId: string,
  date: string
): Promise<ReconciliationReport | null> {
  const client = getDockerCoreFetchClient();
  const { data, error } = await client.rpc("get_reconciliation_report", {
    p_restaurant_id: restaurantId,
    p_date: date,
  });
  if (error) {
    throw new Error(
      (error as { message?: string }).message ?? "Failed to fetch reconciliation report"
    );
  }
  const raw = data as ReconciliationReport | null;
  return raw ?? null;
}
