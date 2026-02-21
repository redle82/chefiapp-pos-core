// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { useShift } from "../shift/ShiftContext";
import { alertEngine } from "../alerts/AlertEngine";
import {
  deriveRestaurantReadiness,
  type ConfigStatus,
  type OperationStatus,
  type RestaurantReadiness,
} from "../restaurant/deriveRestaurantReadiness";
import { runtimeToRestaurant } from "../restaurant/runtimeToRestaurant";

export interface DashboardOperationState {
  configStatus: ConfigStatus;
  blockingReasons: string[];
}

export interface DashboardTurnState {
  operationStatus: OperationStatus;
  hasOpenTurn: boolean;
}

export interface DashboardAlertsState {
  activeCount: number;
  criticalCount: number;
}

export interface DashboardViewModel {
  readiness: RestaurantReadiness;
  operation: DashboardOperationState;
  turn: DashboardTurnState;
  alerts: DashboardAlertsState;
}

/**
 * Hook canónico de view-model para o Dashboard.
 *
 * Read-only:
 * - não executa setup
 * - não abre/fecha turno
 * - não faz side-effects fora de fetch de dados
 */
export function useDashboardViewModel(): DashboardViewModel {
  const { runtime } = useRestaurantRuntime();
  const shift = useShift();
  const [alertsActiveCount, setAlertsActiveCount] = useState(0);
  const [alertsCriticalCount, setAlertsCriticalCount] = useState(0);

  // Derivação de readiness config-first a partir do runtime.
  const restaurantReadiness = useMemo(() => {
    const ownerUserId = runtime.restaurant_id ?? "runtime-owner-unavailable";
    let ownerPhone = "runtime-owner-phone-unavailable";
    if (typeof window !== "undefined") {
      try {
        ownerPhone =
          window.localStorage.getItem("chefiapp_owner_phone") ??
          ownerPhone;
      } catch {
        // ignore storage errors
      }
    }

    const restaurant = runtimeToRestaurant({
      runtime,
      ownerUserId,
      ownerPhone,
    });

    return deriveRestaurantReadiness(restaurant);
  }, [runtime]);

  // Alertas: apenas contagens (mock engine in-memory).
  useEffect(() => {
    let cancelled = false;
    const restaurantId = runtime.restaurant_id;

    if (!restaurantId) {
      setAlertsActiveCount(0);
      setAlertsCriticalCount(0);
      return;
    }

    (async () => {
      try {
        const [active, critical] = await Promise.all([
          alertEngine.getActive(restaurantId),
          alertEngine.getCritical(restaurantId),
        ]);
        if (!cancelled) {
          setAlertsActiveCount(active.length);
          setAlertsCriticalCount(critical.length);
        }
      } catch {
        if (!cancelled) {
          setAlertsActiveCount(0);
          setAlertsCriticalCount(0);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [runtime.restaurant_id]);

  const operation: DashboardOperationState = {
    configStatus: restaurantReadiness.configStatus,
    blockingReasons: restaurantReadiness.blockingReasons,
  };

  const turn: DashboardTurnState = {
    operationStatus: restaurantReadiness.operationStatus,
    hasOpenTurn: restaurantReadiness.operationStatus === "TURN_OPEN",
  };

  const alerts: DashboardAlertsState = {
    activeCount: alertsActiveCount,
    criticalCount: alertsCriticalCount,
  };

  return {
    readiness: restaurantReadiness,
    operation,
    turn,
    alerts,
  };
}

