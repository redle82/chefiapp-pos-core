/**
 * usePreflightOperational — Hook que expõe o Preflight Operacional
 *
 * Uma única fonte de verdade para a UI: coreStatus, blockers, operationReady.
 * Usado pelo Dashboard (cartão Operação) e TPV (estado vazio, botão Abrir Turno).
 */

import { useMemo } from "react";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { useCoreHealth } from "../health/useCoreHealth";
import { useShift } from "../shift/ShiftContext";
import type { PreflightOperationalResult } from "./preflightOperational";
import { computePreflight } from "./preflightOperational";

export interface UsePreflightOptions {
  /** Desativar polling do health (ex.: quando já há outro consumer). */
  healthAutoStart?: boolean;
}

/**
 * Retorna o estado de preflight operacional (Core, menu, identidade, caixa/turno).
 */
export function usePreflightOperational(
  options: UsePreflightOptions = {}
): PreflightOperationalResult {
  const { healthAutoStart = true } = options;
  const { status: coreStatus } = useCoreHealth({
    autoStart: healthAutoStart,
    pollInterval: 60000,
    downPollInterval: 30000,
  });
  const { runtime } = useRestaurantRuntime();
  const shift = useShift();

  return useMemo((): PreflightOperationalResult => {
    const hasPublishedMenu = runtime?.isPublished ?? false;
    const hasIdentity = runtime?.setup_status?.identity === true;
    const isCashOpen = shift?.isShiftOpen ?? false;

    return computePreflight({
      coreStatus,
      hasPublishedMenu,
      hasIdentity,
      isCashOpen,
    });
  }, [
    coreStatus,
    runtime?.isPublished,
    runtime?.setup_status?.identity,
    shift?.isShiftOpen,
  ]);
}
