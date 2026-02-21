/**
 * IntegrationStatus — Estado de saúde de uma integração
 * 
 * Usado para:
 * - Health checks periódicos
 * - Dashboard de status (ManagerDashboard futuro)
 * - Alertas de degradação
 */
// @ts-nocheck


export type IntegrationHealthStatus = 'ok' | 'degraded' | 'down' | 'unknown';

export interface IntegrationStatus {
  status: IntegrationHealthStatus;
  lastCheckedAt: number;
  message?: string;
  metrics?: {
    latencyMs?: number;
    successRate?: number;
    lastErrorAt?: number;
  };
}

export interface IntegrationInfo {
  id: string;
  name: string;
  description?: string;
  capabilities: string[];
  status: IntegrationStatus;
  enabled: boolean;
  configuredAt?: number;
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

export const createHealthyStatus = (): IntegrationStatus => ({
  status: 'ok',
  lastCheckedAt: Date.now(),
});

export const createDegradedStatus = (message: string): IntegrationStatus => ({
  status: 'degraded',
  lastCheckedAt: Date.now(),
  message,
});

export const createDownStatus = (message: string): IntegrationStatus => ({
  status: 'down',
  lastCheckedAt: Date.now(),
  message,
});
