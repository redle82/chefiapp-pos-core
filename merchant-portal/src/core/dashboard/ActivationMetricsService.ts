/**
 * Activation Metrics Service -- fetches real restaurant activation data.
 *
 * Uses the existing `invokeRpc` pattern from core/infra/coreRpc.
 * Falls back to mock data when the RPC is unavailable (e.g. no Docker backend).
 * CSV export delegates to the shared csvExport utilities.
 */

import { invokeRpc } from "../infra/coreRpc";
import { buildCsvFromRows, downloadCsvFile } from "../reports/csvExport";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ActivationMetrics {
  totalRestaurants: number;
  byPhase: {
    setup: number;
    installing: number;
    activating: number;
    commissioning: number;
    operational: number;
    stalled: number;
  };
  averageTimes: {
    setupToActivateMs: number;
    installToTpvMs: number;
    tpvToOperationalMs: number;
    totalMs: number;
  };
  conversionRates: {
    authToSetup: number;
    setupToActivate: number;
    activateToInstall: number;
    installToTpv: number;
    tpvToOperational: number;
  };
  commissioningResults: {
    passed: number;
    failed: number;
    pending: number;
    commonFailures: Array<{ test: string; count: number }>;
  };
  lastUpdated: number;
}

export type DateRange = "7d" | "30d" | "90d" | "all";

// ---------------------------------------------------------------------------
// Mock data (development / fallback)
// ---------------------------------------------------------------------------

function getMockMetrics(): ActivationMetrics {
  return {
    totalRestaurants: 47,
    byPhase: {
      setup: 12,
      installing: 5,
      activating: 8,
      commissioning: 3,
      operational: 15,
      stalled: 4,
    },
    averageTimes: {
      setupToActivateMs: 38 * 60 * 1000,
      installToTpvMs: 12 * 60 * 1000,
      tpvToOperationalMs: 25 * 60 * 1000,
      totalMs: 75 * 60 * 1000,
    },
    conversionRates: {
      authToSetup: 0.89,
      setupToActivate: 0.72,
      activateToInstall: 0.85,
      installToTpv: 0.91,
      tpvToOperational: 0.78,
    },
    commissioningResults: {
      passed: 15,
      failed: 2,
      pending: 3,
      commonFailures: [
        { test: "printer_check", count: 5 },
        { test: "kds_receive", count: 2 },
        { test: "staff_app_check", count: 3 },
      ],
    },
    lastUpdated: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Date range helper
// ---------------------------------------------------------------------------

function getDateFrom(range: DateRange): Date | null {
  const now = new Date();
  switch (range) {
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "all":
      return null;
  }
}

// ---------------------------------------------------------------------------
// RPC response mapper
// ---------------------------------------------------------------------------

function mapRpcResponse(data: Record<string, unknown>): ActivationMetrics {
  const byPhase = (data.by_phase as Record<string, number>) ?? {};
  const avgTimes = (data.average_times as Record<string, number>) ?? {};
  const rates = (data.conversion_rates as Record<string, number>) ?? {};
  const comm = (data.commissioning as Record<string, unknown>) ?? {};
  const failures =
    (comm.common_failures as Array<{ test: string; count: number }>) ?? [];

  return {
    totalRestaurants: (data.total_restaurants as number) ?? 0,
    byPhase: {
      setup: byPhase.setup ?? 0,
      installing: byPhase.installing ?? 0,
      activating: byPhase.activating ?? 0,
      commissioning: byPhase.commissioning ?? 0,
      operational: byPhase.operational ?? 0,
      stalled: byPhase.stalled ?? 0,
    },
    averageTimes: {
      setupToActivateMs: avgTimes.setup_to_activate_ms ?? 0,
      installToTpvMs: avgTimes.install_to_tpv_ms ?? 0,
      tpvToOperationalMs: avgTimes.tpv_to_operational_ms ?? 0,
      totalMs: avgTimes.total_ms ?? 0,
    },
    conversionRates: {
      authToSetup: rates.auth_to_setup ?? 0,
      setupToActivate: rates.setup_to_activate ?? 0,
      activateToInstall: rates.activate_to_install ?? 0,
      installToTpv: rates.install_to_tpv ?? 0,
      tpvToOperational: rates.tpv_to_operational ?? 0,
    },
    commissioningResults: {
      passed: (comm.passed as number) ?? 0,
      failed: (comm.failed as number) ?? 0,
      pending: (comm.pending as number) ?? 0,
      commonFailures: failures,
    },
    lastUpdated: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch activation metrics via the Docker Core RPC.
 * Falls back to mock data when the backend is unavailable.
 */
export async function fetchActivationMetrics(
  dateRange: DateRange = "30d",
): Promise<ActivationMetrics> {
  try {
    const dateFrom = getDateFrom(dateRange);

    const { data, error } = await invokeRpc<Record<string, unknown>>(
      "get_activation_metrics",
      { date_from: dateFrom?.toISOString() ?? null },
    );

    if (error || !data) {
      console.warn(
        "[ActivationMetrics] RPC failed, using mock data:",
        error?.message,
      );
      return getMockMetrics();
    }

    return mapRpcResponse(data);
  } catch {
    console.warn("[ActivationMetrics] Backend unavailable, using mock data");
    return getMockMetrics();
  }
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------

/**
 * Build CSV rows from activation metrics (header + data rows).
 */
export function metricsToCSVRows(
  metrics: ActivationMetrics,
): { headers: string[]; rows: Array<Array<string>> } {
  const headers = ["Metrica", "Valor"];
  const rows: Array<Array<string>> = [
    ["Total Restaurantes", metrics.totalRestaurants.toString()],
    ["Em Setup", metrics.byPhase.setup.toString()],
    ["Instalando", metrics.byPhase.installing.toString()],
    ["Activando", metrics.byPhase.activating.toString()],
    ["Comissionamento", metrics.byPhase.commissioning.toString()],
    ["Operacional", metrics.byPhase.operational.toString()],
    ["Parado", metrics.byPhase.stalled.toString()],
    [
      "Tempo Medio Setup->Activar (min)",
      Math.round(metrics.averageTimes.setupToActivateMs / 60000).toString(),
    ],
    [
      "Tempo Medio Install->TPV (min)",
      Math.round(metrics.averageTimes.installToTpvMs / 60000).toString(),
    ],
    [
      "Tempo Medio TPV->Operacional (min)",
      Math.round(metrics.averageTimes.tpvToOperationalMs / 60000).toString(),
    ],
    [
      "Tempo Medio Total (min)",
      Math.round(metrics.averageTimes.totalMs / 60000).toString(),
    ],
    [
      "Conversao Auth->Setup",
      `${Math.round(metrics.conversionRates.authToSetup * 100)}%`,
    ],
    [
      "Conversao Setup->Activar",
      `${Math.round(metrics.conversionRates.setupToActivate * 100)}%`,
    ],
    [
      "Conversao Activar->Instalar",
      `${Math.round(metrics.conversionRates.activateToInstall * 100)}%`,
    ],
    [
      "Conversao Instalar->TPV",
      `${Math.round(metrics.conversionRates.installToTpv * 100)}%`,
    ],
    [
      "Conversao TPV->Operacional",
      `${Math.round(metrics.conversionRates.tpvToOperational * 100)}%`,
    ],
    ["Comissionamento Aprovados", metrics.commissioningResults.passed.toString()],
    ["Comissionamento Falhados", metrics.commissioningResults.failed.toString()],
    [
      "Comissionamento Pendentes",
      metrics.commissioningResults.pending.toString(),
    ],
  ];

  return { headers, rows };
}

/**
 * Export activation metrics as a CSV file download.
 */
export function exportActivationMetricsCSV(metrics: ActivationMetrics): void {
  const { headers, rows } = metricsToCSVRows(metrics);
  const csv = buildCsvFromRows(headers, rows);
  const date = new Date().toISOString().slice(0, 10);
  downloadCsvFile(csv, `activacao-metricas-${date}.csv`);
}
