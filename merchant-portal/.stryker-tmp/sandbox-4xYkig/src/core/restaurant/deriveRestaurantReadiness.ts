import type { OperationState, Restaurant } from "./restaurant.types";

export type ConfigStatus = "READY" | "INCOMPLETE";

export type OperationStatus = "TURN_OPEN" | "TURN_CLOSED" | "PREVIEW_ONLY";

/**
 * Estado derivado de prontidão do restaurante (config-first).
 *
 * - configStatus: ONLY identidade, local, cardápio e publicação.
 * - operationStatus: ONLY turno/operation (não bloqueia configuração).
 * - blockingReasons: etiquetas humanas 1:1 com blocos críticos.
 */
export interface RestaurantReadiness {
  configStatus: ConfigStatus;
  operationStatus: OperationStatus;
  blockingReasons: string[];
}

function computeConfigBlockingReasons(restaurant: Restaurant): string[] {
  const reasons: string[] = [];

  if (restaurant.identity.status === "INCOMPLETE") {
    reasons.push("Identidade");
  }
  if (restaurant.local.status === "INCOMPLETE") {
    reasons.push("Local & Moeda");
  }
  if (restaurant.menu.status === "INCOMPLETE") {
    reasons.push("Cardápio");
  }
  if (restaurant.publication.status === "INCOMPLETE") {
    reasons.push("Publicação");
  }

  return reasons;
}

function computeOperationStatus(
  operation: OperationState,
  configStatus: ConfigStatus
): OperationStatus {
  if (operation.isTurnOpen && operation.currentTurnId) {
    return "TURN_OPEN";
  }

  if (configStatus === "READY") {
    // Config pronto mas turno fechado → preview permitido.
    return "PREVIEW_ONLY";
  }

  // Config ainda incompleta; turno não é relevante (fechado por definição).
  return "TURN_CLOSED";
}

/**
 * Deriva o estado de readiness a partir do schema canónico de Restaurant.
 *
 * Regra:
 * - blockingReasons é a lista de blocos com status === 'INCOMPLETE'.
 * - configStatus === 'INCOMPLETE' se blockingReasons.length > 0; senão 'READY'.
 * - operationStatus depende de operation.isTurnOpen/currentTurnId + configStatus.
 */
export function deriveRestaurantReadiness(
  restaurant: Restaurant
): RestaurantReadiness {
  const blockingReasons = computeConfigBlockingReasons(restaurant);
  const configStatus: ConfigStatus =
    blockingReasons.length > 0 ? "INCOMPLETE" : "READY";

  const operationStatus = computeOperationStatus(
    restaurant.operation,
    configStatus
  );

  return {
    configStatus,
    operationStatus,
    blockingReasons,
  };
}

