// @ts-nocheck
import type { CoreHealthStatus } from "../health/types";
import type { PreflightOperationalResult } from "../readiness/preflightOperational";

export type ConfigStatus = "incomplete" | "ready";

export type OperationalStatus = "preview_only" | "turn_closed" | "turn_open";

export interface RestaurantReadiness {
  configStatus: ConfigStatus;
  operationalStatus: OperationalStatus;
  reasons: string[];
}

interface Params {
  preflight: PreflightOperationalResult;
  runtimeRestaurantId: string | null;
}

function isCoreReachable(status: CoreHealthStatus): boolean {
  return status === "UP" || status === "DEGRADED";
}

/**
 * Deriva estados macro de prontidão do restaurante a partir do preflight operacional.
 *
 * Regra (resumo):
 * - config_status:
 *   - "ready"       → tem identidade + menu publicado (mínimo viável para vender)
 *   - "incomplete"  → falta identidade OU menu publicado
 * - operational_status:
 *   - "turn_open"    → caixa/turno aberto no Core
 *   - "turn_closed"  → Core alcançável e configuração mínima ok, mas caixa fechado
   *   - "preview_only" → cenário restante (sem restaurante, Core em baixo ou config mínima em falta)
 */
export function deriveRestaurantReadiness({
  preflight,
  runtimeRestaurantId,
}: Params): RestaurantReadiness {
  const hasRestaurant = !!runtimeRestaurantId;
  const hasIdentity = preflight.hasIdentity;
  const hasMenu = preflight.hasPublishedMenu;
  const isCashOpen = preflight.isCashOpen;
  const coreStatus = preflight.coreStatus;

  const configStatus: ConfigStatus =
    hasIdentity && hasMenu ? "ready" : "incomplete";

  let operationalStatus: OperationalStatus = "preview_only";

  if (isCashOpen) {
    operationalStatus = "turn_open";
  } else if (hasRestaurant && isCoreReachable(coreStatus) && hasIdentity && hasMenu) {
    operationalStatus = "turn_closed";
  } else {
    operationalStatus = "preview_only";
  }

  const reasons: string[] = [];

  if (!hasRestaurant) {
    reasons.push("Sem restaurante selecionado ou criado.");
  }
  if (!isCoreReachable(coreStatus)) {
    reasons.push("Core offline ou desconhecido.");
  }
  if (!hasIdentity) {
    reasons.push("Identidade do restaurante incompleta.");
  }
  if (!hasMenu) {
    reasons.push("Menu não publicado.");
  }
  if (!isCashOpen && operationalStatus !== "preview_only") {
    reasons.push("Turno/caixa fechado.");
  }

  return {
    configStatus,
    operationalStatus,
    reasons,
  };
}

