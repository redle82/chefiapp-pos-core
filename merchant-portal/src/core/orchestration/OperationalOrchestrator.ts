/**
 * Operational Orchestrator — Engine de decisão operacional
 *
 * Decide quando gerar, suprimir ou permitir tarefas com base em estado real.
 * Every decision is persisted to gm_orchestrator_logs via OrchestratorLogger.
 * Contrato: docs/contracts/OPERATIONAL_ORCHESTRATOR_CONTRACT.md
 */

import { OrchestratorLogger } from "./OrchestratorLogger";

export interface OrchestratorState {
  activeOrdersCount: number;
  occupiedTablesCount: number;
  idleMinutesSinceLastOrder: number;
  shiftOpen: boolean;
}

export interface OrchestratorDecision {
  action: "generate" | "suppress" | "allow";
  reason: string;
}

export type OrchestratorEventType =
  | "restaurant_idle"
  | "order_delayed"
  | "table_unattended"
  | "order_created";

/**
 * Engine de decisão pura — sem side effects (except audit logging).
 * Regras:
 * - activeOrders > 0 → suppress MODO_INTERNO; allow PEDIDO_NOVO, ATRASO_ITEM, PEDIDO_ESQUECIDO
 * - activeOrders === 0 && idleMinutes >= X && shiftOpen → generate RESTAURANT_IDLE
 */
export class OperationalOrchestrator {
  /**
   * Decide se um evento deve gerar tarefa ou ser suprimido.
   * Persists decision to gm_orchestrator_logs (fire-and-forget).
   */
  decide(
    state: OrchestratorState,
    eventType: OrchestratorEventType,
    options?: { idleMinutesThreshold?: number; restaurantId?: string },
  ): OrchestratorDecision {
    const idleThreshold = options?.idleMinutesThreshold ?? 15;
    let decision: OrchestratorDecision;

    switch (eventType) {
      case "restaurant_idle": {
        if (state.activeOrdersCount > 0) {
          decision = {
            action: "suppress",
            reason: "Pedidos ativos — não gerar MODO_INTERNO",
          };
          break;
        }
        if (!state.shiftOpen) {
          decision = {
            action: "suppress",
            reason: "Turno fechado",
          };
          break;
        }
        if (state.idleMinutesSinceLastOrder < idleThreshold) {
          decision = {
            action: "suppress",
            reason: `Tempo idle (${Math.floor(
              state.idleMinutesSinceLastOrder,
            )} min) abaixo do limiar (${idleThreshold} min)`,
          };
          break;
        }
        decision = {
          action: "generate",
          reason: "Restaurante ocioso — gerar MODO_INTERNO",
        };
        break;
      }

      case "order_created":
      case "order_delayed":
      case "table_unattended":
        decision = {
          action: "allow",
          reason: "Evento de atendimento — permitir geração",
        };
        break;

      default:
        decision = {
          action: "allow",
          reason: "Tipo de evento desconhecido — permitir por padrão",
        };
        break;
    }

    // Fire-and-forget: persist decision to audit trail
    if (options?.restaurantId) {
      OrchestratorLogger.logDecision(
        options.restaurantId,
        eventType,
        decision,
        state,
      ).catch(() => {
        /* non-blocking */
      });
    }

    return decision;
  }
}

export const operationalOrchestrator = new OperationalOrchestrator();
