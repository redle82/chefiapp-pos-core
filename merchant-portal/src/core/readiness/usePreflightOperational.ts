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
import { runtimeToRestaurant } from "../restaurant/runtimeToRestaurant";
import { deriveRestaurantReadiness } from "../restaurant/deriveRestaurantReadiness";

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
    // Adapter config-first: Runtime → Restaurant → Readiness.
    const restaurant = runtimeToRestaurant({
      runtime,
      // TODO: mapear owner real quando o Core o expuser diretamente.
      ownerUserId: "runtime-owner-unavailable",
      ownerPhone: "runtime-owner-phone-unavailable",
    });
    const restaurantReadiness = deriveRestaurantReadiness(restaurant);

    const hasPublishedMenu = restaurantReadiness.configStatus === "READY";
    const hasIdentity = !restaurantReadiness.blockingReasons.includes(
      "Identidade"
    );
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
