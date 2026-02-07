/**
 * useOperationalKernel — Estado operacional único (OPERATIONAL_KERNEL_CONTRACT)
 *
 * Agrega CoreHealth, Preflight, Shift e Terminais num único estado para a UI.
 * Consumidores: OwnerDashboardWithMapLayout (/admin/reports/overview), outros ecrãs que precisem do estado operacional.
 */

import { useMemo } from "react";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import type { CoreHealthStatus } from "../health/useCoreHealth";
import { usePreflightOperational } from "../readiness/usePreflightOperational";
import { useShift } from "../shift/ShiftContext";
import { useTerminals } from "../terminal/useTerminals";
import { CONFIG } from "../../config";

export type OperationalCoreStatus = "UP" | "DOWN" | "DEGRADED" | "UNKNOWN";
export type OperationalShiftStatus = "OPEN" | "CLOSED";
export type OperationalTerminalsStatus = "INSTALLED" | "NOT_INSTALLED" | "NOT_IMPLEMENTED";

/** Estado de terminais no Kernel: gate explícito — quando NOT_IMPLEMENTED, nenhum hook chama gm_terminals/gm_equipment. */
export interface OperationalTerminalsState {
  status: OperationalTerminalsStatus;
  canQuery: boolean;
}

export interface OperationalState {
  core: OperationalCoreStatus;
  shift: OperationalShiftStatus;
  terminals: OperationalTerminalsState;
  canOperate: boolean;
  reason: string | null;
}

function mapCore(s: CoreHealthStatus): OperationalCoreStatus {
  return s === "UP" || s === "DOWN" || s === "DEGRADED" || s === "UNKNOWN" ? s : "UNKNOWN";
}

/**
 * Retorna o estado operacional composto (OperationalState) a partir das fontes actuais.
 * Gate de terminais: quando TERMINAL_INSTALLATION_TRACK é false, terminals = NOT_IMPLEMENTED e canQuery = false;
 * nenhum hook deve chamar gm_terminals ou gm_equipment para listagem de terminais.
 */
export function useOperationalKernel(options?: { healthAutoStart?: boolean }): OperationalState {
  const { runtime } = useRestaurantRuntime();
  const restaurantId = runtime?.restaurant_id ?? null;
  const preflight = usePreflightOperational({
    healthAutoStart: options?.healthAutoStart ?? true,
  });
  const shift = useShift();
  const trackEnabled = CONFIG.TERMINAL_INSTALLATION_TRACK;
  const { hasTerminals } = useTerminals(restaurantId);

  return useMemo((): OperationalState => {
    const core = mapCore(preflight.coreStatus);
    const shiftStatus: OperationalShiftStatus =
      shift?.isShiftOpen === true ? "OPEN" : "CLOSED";

    const terminals: OperationalTerminalsState = trackEnabled
      ? {
          status: hasTerminals ? "INSTALLED" : "NOT_INSTALLED",
          canQuery: true,
        }
      : {
          status: "NOT_IMPLEMENTED",
          canQuery: false,
        };

    const canOperate = preflight.operationReady;
    const reason = preflight.blockers[0]?.message ?? null;

    return {
      core,
      shift: shiftStatus,
      terminals,
      canOperate,
      reason,
    };
  }, [
    preflight.coreStatus,
    preflight.operationReady,
    preflight.blockers,
    shift?.isShiftOpen,
    trackEnabled,
    hasTerminals,
  ]);
}
