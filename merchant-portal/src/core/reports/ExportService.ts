/**
 * ExportService — Financial report exports via Core RPCs
 *
 * Server-side aggregation → CSV download.
 * Uses export_z_report_csv / export_sales_period_csv RPCs.
 * Phase 2 — Enterprise Hardening.
 */

import { BackendType, getBackendType } from "../infra/backendAdapter";
import { invokeRpc } from "../infra/coreRpc";
import { Logger } from "../logger";
import { buildCsvFromRows, centsToDecimal, downloadCsvFile } from "./csvExport";

// ─── Types ──────────────────────────────────────────────

export interface ZReportRow {
  report_id: string;
  report_date: string;
  report_type: string;
  total_orders: number;
  total_gross_cents: number;
  total_tax_cents: number;
  cash_revenue_cents: number;
  closed_by: string | null;
  closed_at: string;
  notes: string | null;
}

export interface SalesPeriodRow {
  sale_date: string;
  total_orders: number;
  total_gross_cents: number;
  total_tax_cents: number;
  cash_cents: number;
  card_cents: number;
  other_cents: number;
  average_ticket_cents: number;
}

// ─── Service ────────────────────────────────────────────

export const ExportService = {
  /**
   * Fetch Z-report data from export_z_report_csv RPC.
   */
  async fetchZReportRows(
    restaurantId: string,
    from?: string,
    to?: string,
  ): Promise<ZReportRow[]> {
    if (getBackendType() !== BackendType.docker) {
      return [];
    }

    try {
      const result = await invokeRpc<ZReportRow[]>("export_z_report_csv", {
        p_restaurant_id: restaurantId,
        ...(from ? { p_from: from } : {}),
        ...(to ? { p_to: to } : {}),
      });

      if (result.error || !result.data) {
        Logger.warn("[ExportService] fetchZReportRows RPC failed:", {
          error: result.error?.message,
        });
        return [];
      }

      return Array.isArray(result.data) ? result.data : [];
    } catch (err) {
      Logger.error("[ExportService] fetchZReportRows exception:", {
        error: String(err),
      });
      return [];
    }
  },

  /**
   * Fetch daily sales aggregates from export_sales_period_csv RPC.
   */
  async fetchSalesPeriodRows(
    restaurantId: string,
    from?: string,
    to?: string,
  ): Promise<SalesPeriodRow[]> {
    if (getBackendType() !== BackendType.docker) {
      return [];
    }

    try {
      const result = await invokeRpc<SalesPeriodRow[]>(
        "export_sales_period_csv",
        {
          p_restaurant_id: restaurantId,
          ...(from ? { p_from: from } : {}),
          ...(to ? { p_to: to } : {}),
        },
      );

      if (result.error || !result.data) {
        Logger.warn("[ExportService] fetchSalesPeriodRows RPC failed:", {
          error: result.error?.message,
        });
        return [];
      }

      return Array.isArray(result.data) ? result.data : [];
    } catch (err) {
      Logger.error("[ExportService] fetchSalesPeriodRows exception:", {
        error: String(err),
      });
      return [];
    }
  },

  /**
   * Build CSV string from Z-report rows (does NOT trigger download).
   */
  buildZReportCsv(rows: ZReportRow[]): string {
    const headers = [
      "ID",
      "Date",
      "Type",
      "Orders",
      "Gross (€)",
      "Tax (€)",
      "Cash (€)",
      "Closed By",
      "Closed At",
      "Notes",
    ];

    const csvRows = rows.map((r) => [
      r.report_id,
      r.report_date,
      r.report_type,
      r.total_orders,
      centsToDecimal(r.total_gross_cents),
      centsToDecimal(r.total_tax_cents),
      centsToDecimal(r.cash_revenue_cents),
      r.closed_by ?? "",
      r.closed_at,
      r.notes ?? "",
    ]);

    return buildCsvFromRows(headers, csvRows);
  },

  /**
   * Build CSV string from sales period rows (does NOT trigger download).
   */
  buildSalesPeriodCsv(rows: SalesPeriodRow[]): string {
    const headers = [
      "Date",
      "Orders",
      "Gross (€)",
      "Tax (€)",
      "Cash (€)",
      "Card (€)",
      "Other (€)",
      "Avg Ticket (€)",
    ];

    const csvRows = rows.map((r) => [
      r.sale_date,
      r.total_orders,
      centsToDecimal(r.total_gross_cents),
      centsToDecimal(r.total_tax_cents),
      centsToDecimal(r.cash_cents),
      centsToDecimal(r.card_cents),
      centsToDecimal(r.other_cents),
      centsToDecimal(r.average_ticket_cents),
    ]);

    return buildCsvFromRows(headers, csvRows);
  },

  /**
   * Full pipeline: fetch Z-reports → build CSV → download.
   */
  async downloadZReportCsv(
    restaurantId: string,
    from?: string,
    to?: string,
  ): Promise<boolean> {
    const rows = await this.fetchZReportRows(restaurantId, from, to);
    if (rows.length === 0) {
      Logger.info("[ExportService] No Z-report data found for export.");
      return false;
    }

    const csv = this.buildZReportCsv(rows);
    const dateStr =
      from && to ? `${from}_${to}` : new Date().toISOString().split("T")[0];
    downloadCsvFile(csv, `z-reports_${dateStr}.csv`);
    return true;
  },

  /**
   * Full pipeline: fetch sales period → build CSV → download.
   */
  async downloadSalesPeriodCsv(
    restaurantId: string,
    from?: string,
    to?: string,
  ): Promise<boolean> {
    const rows = await this.fetchSalesPeriodRows(restaurantId, from, to);
    if (rows.length === 0) {
      Logger.info("[ExportService] No sales data found for export.");
      return false;
    }

    const csv = this.buildSalesPeriodCsv(rows);
    const dateStr =
      from && to ? `${from}_${to}` : new Date().toISOString().split("T")[0];
    downloadCsvFile(csv, `sales-period_${dateStr}.csv`);
    return true;
  },
};
