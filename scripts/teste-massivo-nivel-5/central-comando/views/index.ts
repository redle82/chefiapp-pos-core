/**
 * Sistema de Visões do Central de Comando
 *
 * Define as diferentes visões: Laboratório, Operacional, Executivo, Auditoria, Dono
 */

export type ViewMode =
  | "laboratory"
  | "operational"
  | "executive"
  | "audit"
  | "owner";

export interface ViewConfig {
  mode: ViewMode;
  updateInterval: number; // segundos
  granularity: "event" | "aggregated" | "business";
  showTechnicalDetails: boolean;
  showAlerts: boolean;
  allowedMetrics: string[];
}

export const VIEW_CONFIGS: { [key in ViewMode]: ViewConfig } = {
  laboratory: {
    mode: "laboratory",
    updateInterval: 1, // 1 segundo
    granularity: "event",
    showTechnicalDetails: true,
    showAlerts: true,
    allowedMetrics: ["*"], // Todas as métricas
  },
  operational: {
    mode: "operational",
    updateInterval: 5, // 5 segundos
    granularity: "aggregated",
    showTechnicalDetails: true,
    showAlerts: true,
    allowedMetrics: [
      "infrastructure",
      "database",
      "events",
      "tasks",
      "operation",
    ],
  },
  executive: {
    mode: "executive",
    updateInterval: 15, // 15 segundos
    granularity: "business",
    showTechnicalDetails: false,
    showAlerts: true,
    allowedMetrics: ["operation", "tasks"], // Apenas métricas de negócio
  },
  audit: {
    mode: "audit",
    updateInterval: 0, // Sob demanda
    granularity: "event",
    showTechnicalDetails: true,
    showAlerts: false,
    allowedMetrics: ["*"], // Todas as métricas
  },
  owner: {
    mode: "owner",
    updateInterval: 30, // 30 segundos - dono não precisa de real-time
    granularity: "business",
    showTechnicalDetails: false,
    showAlerts: true,
    allowedMetrics: ["operation", "tasks"], // Apenas métricas de negócio
  },
};

export function getViewConfig(mode: ViewMode): ViewConfig {
  return VIEW_CONFIGS[mode];
}
