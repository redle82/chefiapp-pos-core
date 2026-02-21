/**
 * P4-6: Advanced Reporting Service
 *
 * Domínio = Core (Docker) only.
 * MENU_DERIVATIONS: Relatórios agregam sempre via join com product_id e snapshot (gm_order_items);
 * nunca recalcular preço de venda fora do Menu.
 */
// @ts-nocheck


import { CONFIG } from "../../config";
import { BackendType, getBackendType } from "../infra/backendAdapter";
import { Logger } from "../logger";
import { type ReportConfig } from "./ReportBuilder";

const REST = (
  CONFIG.CORE_URL?.endsWith("/rest")
    ? CONFIG.CORE_URL
    : `${CONFIG.CORE_URL || ""}/rest`
).replace(/\/?$/, "/v1");
const CORE_ANON = CONFIG.CORE_ANON_KEY || "";

function coreHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    apikey: CORE_ANON,
    Authorization: `Bearer ${CORE_ANON}`,
  };
}

function requireCore(): void {
  if (getBackendType() !== BackendType.docker) {
    throw new Error(
      "Reporting requires Docker Core. Backend not configured or not Docker."
    );
  }
}

export type ReportFormat = "pdf" | "excel" | "csv" | "json";

export interface ScheduledReport {
  id: string;
  reportId: string;
  schedule: "daily" | "weekly" | "monthly";
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time: string; // HH:mm
  recipients: string[];
  format: ReportFormat;
  enabled: boolean;
}

class AdvancedReportingService {
  /**
   * Generate report data. Core (Docker) only.
   * MENU_DERIVATIONS: quando agregar por produto/receita, usar gm_order_items com product_id + price_snapshot.
   */
  async generateReportData(
    config: ReportConfig,
    restaurantId: string,
    dateRange?: { from: Date; to: Date }
  ): Promise<any[]> {
    try {
      requireCore();
      const url = `${REST}/gm_orders?restaurant_id=eq.${encodeURIComponent(
        restaurantId
      )}&order=created_at.desc&limit=100&select=*`;
      const res = await fetch(url, { method: "GET", headers: coreHeaders() });
      if (!res.ok) {
        Logger.error(
          "Core report data failed",
          new Error(`${res.status} ${res.statusText}`),
          { restaurantId }
        );
        return [];
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      Logger.error("Failed to generate report data", err, {
        config,
        restaurantId,
      });
      throw err;
    }
  }

  /**
   * Export report to format
   */
  async exportReport(
    config: ReportConfig,
    format: ReportFormat,
    data: any[]
  ): Promise<{
    success: boolean;
    url?: string;
    error?: string;
  }> {
    try {
      switch (format) {
        case "pdf":
          return await this.exportToPDF(config, data);
        case "excel":
          return await this.exportToExcel(config, data);
        case "csv":
          return await this.exportToCSV(config, data);
        case "json":
          return await this.exportToJSON(config, data);
        default:
          return {
            success: false,
            error: "Formato não suportado",
          };
      }
    } catch (err) {
      Logger.error("Failed to export report", err, { config, format });
      return {
        success: false,
        error: "Erro ao exportar relatório",
      };
    }
  }

  /**
   * Export to PDF
   */
  private async exportToPDF(
    config: ReportConfig,
    data: any[]
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    // TODO: Implement PDF generation using a library like jsPDF or pdfkit
    // For now, use browser print
    return {
      success: true,
      url: "data:application/pdf;base64,placeholder", // Placeholder
    };
  }

  /**
   * Export to Excel
   */
  private async exportToExcel(
    config: ReportConfig,
    data: any[]
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    // TODO: Implement Excel export using a library like xlsx
    const csv = this.convertToCSV(data, config);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    return {
      success: true,
      url,
    };
  }

  /**
   * Export to CSV
   */
  private async exportToCSV(
    config: ReportConfig,
    data: any[]
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    const csv = this.convertToCSV(data, config);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    return {
      success: true,
      url,
    };
  }

  /**
   * Export to JSON
   */
  private async exportToJSON(
    config: ReportConfig,
    data: any[]
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    return {
      success: true,
      url,
    };
  }

  /**
   * Convert data to CSV
   */
  private convertToCSV(data: any[], config: ReportConfig): string {
    if (data.length === 0) return "";

    const headers = config.fields.map((f) => f.label);
    const rows = data.map((item) => {
      return config.fields
        .map((f) => {
          const value = this.getNestedValue(item, f.source);
          return `"${String(value || "").replace(/"/g, '""')}"`;
        })
        .join(",");
    });

    return [headers.join(","), ...rows].join("\n");
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }

  /**
   * Schedule report. Core (Docker) only.
   * Stub: scheduled_reports table may not exist in Core yet — fail explicit.
   */
  async scheduleReport(
    schedule: ScheduledReport
  ): Promise<{ success: boolean; error?: string }> {
    requireCore();
    try {
      const url = `${REST}/scheduled_reports`;
      const body = {
        id: schedule.id,
        report_id: schedule.reportId,
        schedule: schedule.schedule,
        day_of_week: schedule.dayOfWeek,
        day_of_month: schedule.dayOfMonth,
        time: schedule.time,
        recipients: schedule.recipients,
        format: schedule.format,
        enabled: schedule.enabled,
      };
      const res = await fetch(url, {
        method: "POST",
        headers: coreHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        return {
          success: false,
          error:
            "Reporting requires Docker Core. Scheduled reports endpoint not available.",
        };
      }
      return { success: true };
    } catch (err) {
      Logger.error("Failed to schedule report", err, { schedule });
      return {
        success: false,
        error:
          "Reporting requires Docker Core. Backend not configured or not Docker.",
      };
    }
  }

  /**
   * Get scheduled reports. Core (Docker) only.
   */
  async getScheduledReports(restaurantId: string): Promise<ScheduledReport[]> {
    requireCore();
    try {
      const url = `${REST}/scheduled_reports?restaurant_id=eq.${encodeURIComponent(
        restaurantId
      )}&select=*`;
      const res = await fetch(url, { method: "GET", headers: coreHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      const rows = Array.isArray(data) ? data : [];
      return rows.map((r: any) => ({
        id: r.id,
        reportId: r.report_id,
        schedule: r.schedule,
        dayOfWeek: r.day_of_week,
        dayOfMonth: r.day_of_month,
        time: r.time,
        recipients: r.recipients || [],
        format: r.format,
        enabled: r.enabled,
      }));
    } catch (err) {
      Logger.error("Failed to get scheduled reports", err, { restaurantId });
      return [];
    }
  }
}

export const advancedReportingService = new AdvancedReportingService();
