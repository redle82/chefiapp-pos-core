/**
 * Preflight Operacional — Fonte de verdade para "operações prontas?"
 *
 * Um único módulo que expõe: coreStatus, canLoadProducts, hasPublishedMenu,
 * hasIdentity, isShiftActive, isCashOpen, blockers[].
 * Usado pelo Dashboard (cartão Operação) e TPV (estado vazio / Abrir Turno).
 *
 * Regras: não altera regras de negócio; apenas agrega estado para UX clara.
 */

import type { CoreHealthStatus } from "../health/useCoreHealth";

/** Códigos de blocker acionáveis (mensagens claras para o humano). */
export type PreflightBlockerCode =
  | "CORE_OFFLINE"
  | "NO_PUBLISHED_MENU"
  | "SHIFT_REQUIRED"
  | "CASH_REQUIRED"
  | "NO_IDENTITY";

export interface PreflightBlocker {
  code: PreflightBlockerCode;
  message: string;
}

export interface PreflightOperationalResult {
  /** UP = Core acessível; DOWN/UNKNOWN/DEGRADED = problemas. */
  coreStatus: CoreHealthStatus;
  /** true só quando coreStatus === 'UP' (catálogo pode ser carregado). */
  canLoadProducts: boolean;
  /** Menu publicado (restaurante operacional para venda). */
  hasPublishedMenu: boolean;
  /** Identidade do restaurante preenchida (setup identity). */
  hasIdentity: boolean;
  /** Turno/caixa aberto (gm_cash_registers status=open). */
  isShiftActive: boolean;
  /** Alias de isShiftActive (mesma autoridade: caixa = turno). */
  isCashOpen: boolean;
  /** Lista de blockers; vazia = operação pronta. */
  blockers: PreflightBlocker[];
  /** true quando não há blockers (operações TPV/KDS permitidas). */
  operationReady: boolean;
}

const BLOCKER_MESSAGES: Record<PreflightBlockerCode, string> = {
  CORE_OFFLINE: "Core está offline. Inicie o Docker Core para operar TPV/KDS.",
  NO_PUBLISHED_MENU: "Menu não publicado. Publica no Menu Builder.",
  SHIFT_REQUIRED: "Turno necessário. Abra o turno.",
  CASH_REQUIRED: "Caixa fechado. Abra o caixa.",
  NO_IDENTITY: "Identidade do restaurante incompleta. Configura em Config.",
};

/**
 * Calcula o resultado do preflight a partir do estado atual (função pura).
 * Fonte de verdade para derivar blockers e operationReady.
 */
export function computePreflight(params: {
  coreStatus: CoreHealthStatus;
  hasPublishedMenu: boolean;
  hasIdentity: boolean;
  isCashOpen: boolean;
}): PreflightOperationalResult {
  const { coreStatus, hasPublishedMenu, hasIdentity, isCashOpen } = params;

  const isShiftActive = isCashOpen;
  const canLoadProducts = coreStatus === "UP";
  const blockers: PreflightBlocker[] = [];

  if (coreStatus !== "UP" && coreStatus !== "DEGRADED") {
    blockers.push({
      code: "CORE_OFFLINE",
      message: BLOCKER_MESSAGES.CORE_OFFLINE,
    });
  }
  if (!hasPublishedMenu) {
    blockers.push({
      code: "NO_PUBLISHED_MENU",
      message: BLOCKER_MESSAGES.NO_PUBLISHED_MENU,
    });
  }
  if (!hasIdentity) {
    blockers.push({
      code: "NO_IDENTITY",
      message: BLOCKER_MESSAGES.NO_IDENTITY,
    });
  }
  if (!isCashOpen) {
    blockers.push({
      code: "CASH_REQUIRED",
      message: BLOCKER_MESSAGES.CASH_REQUIRED,
    });
    blockers.push({
      code: "SHIFT_REQUIRED",
      message: BLOCKER_MESSAGES.SHIFT_REQUIRED,
    });
  }

  return {
    coreStatus,
    canLoadProducts,
    hasPublishedMenu,
    hasIdentity,
    isShiftActive,
    isCashOpen,
    blockers,
    operationReady: blockers.length === 0,
  };
}
