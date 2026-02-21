/**
 * Analytics Client — Satélite Cognitivo (Leituras & Intelligence)
 *
 * Este cliente usa InsForge quando disponível, com fallback para Docker Core.
 * Prioriza performance e disponibilidade de dados históricos/analytics.
 *
 * Estratégia:
 * - VITE_INSFORGE_URL set → Tenta InsForge primeiro
 * - InsForge falha/timeout → Fallback automático para Docker Core
 * - VITE_INSFORGE_URL vazio → Docker Core direto
 *
 * Usa este cliente para:
 * ✅ Dashboard metrics (revenue, orders_count)
 * ✅ Historical reports (last 30 days, trends)
 * ✅ Analytics queries (aggregations, charts)
 * ✅ Export data (CSV, PDF reports)
 * ✅ AI/ML feature extraction
 *
 * NÃO usa este cliente para:
 * ❌ create_order_atomic (use coreClient)
 * ❌ process_order_payment (use coreClient)
 * ❌ Real-time operations (use coreClient)
 *
 * Arquitetura: Hybrid Backend Pattern
 * Decisão: docs/architecture/ADR_HYBRID_BACKEND.md
 */

import { CONFIG } from "../../config";
import { Logger } from "../logger";
import { getDockerCoreFetchClient } from "./dockerCoreFetchClient";
import { insforge } from "./insforgeClient";

/** True quando InsForge está configurado e ativo */
export const isInsforgeEnabled = Boolean(CONFIG.INSFORGE_URL);

/**
 * Cliente para analytics e leituras.
 * Retorna InsForge se configurado, senão Docker Core.
 */
export function getAnalyticsClient() {
  if (isInsforgeEnabled) {
    return insforge.database;
  }
  return getDockerCoreFetchClient();
}

/**
 * Health check do analytics backend.
 * Valida que queries de leitura podem ser executadas.
 */
export async function checkAnalyticsHealth(): Promise<{
  healthy: boolean;
  backend: "insforge" | "docker";
  latencyMs?: number;
}> {
  const startTime = Date.now();

  try {
    const client = getAnalyticsClient();
    const { error } = await client.from("gm_orders").select("id").limit(1);

    const latencyMs = Date.now() - startTime;

    if (error) {
      Logger.warn("[ANALYTICS_HEALTH] Query failed", { error, latencyMs });
      return {
        healthy: false,
        backend: isInsforgeEnabled ? "insforge" : "docker",
        latencyMs,
      };
    }

    // Warn se latência > 300ms (degrada UX)
    if (latencyMs > 300) {
      Logger.warn("[ANALYTICS_HEALTH] High latency detected", {
        latencyMs,
        backend: isInsforgeEnabled ? "insforge" : "docker",
      });
    }

    return {
      healthy: true,
      backend: isInsforgeEnabled ? "insforge" : "docker",
      latencyMs,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    Logger.error("[ANALYTICS_HEALTH] Backend unreachable", {
      error,
      latencyMs,
      backend: isInsforgeEnabled ? "insforge" : "docker",
    });

    return {
      healthy: false,
      backend: isInsforgeEnabled ? "insforge" : "docker",
      latencyMs,
    };
  }
}

/**
 * Singleton: cliente de analytics.
 * Use este export para queries de leitura e analytics.
 */
export const analyticsClient = getAnalyticsClient();

// Export type for compatibility
export type AnalyticsClient = ReturnType<typeof getAnalyticsClient>;
