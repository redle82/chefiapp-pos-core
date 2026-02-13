/**
 * useDeviceGate(restaurantId) — Device Gate para TPV/KDS
 *
 * Valida que o dispositivo instalado localmente está autorizado e ativo na Config (gm_equipment).
 * CONFIG_RUNTIME_CONTRACT: "Se desligar aqui → morre lá." docs/contracts/CONFIG_RUNTIME_CONTRACT.md §2.2, §2.3.
 *
 * Ordem: depois de sabermos restaurantId e readiness; antes do layout operacional.
 */

import { useEffect, useState } from "react";
import { CONFIG } from "../../config";
import { listEquipmentByRestaurant } from "../../infra/readers/EquipmentReader";
import { getInstalledDevice } from "../storage/installedDeviceStorage";

export type DeviceBlockedReason =
  | "DEVICE_NOT_INSTALLED"
  | "DEVICE_RESTAURANT_MISMATCH"
  | "DEVICE_NOT_IN_CONFIG"
  | "DEVICE_DISABLED";

export interface UseDeviceGateResult {
  /** true enquanto a verificação contra a Config está a correr */
  loading: boolean;
  /** true se o dispositivo pode operar (instalado, restaurante correto, presente na Config, is_active) */
  allowed: boolean;
  /** Preenchido quando allowed === false */
  reason?: DeviceBlockedReason;
}

/**
 * Verifica se o dispositivo instalado (installedDeviceStorage) está ativo na Config (gm_equipment).
 * Bypass: DEBUG_DIRECT_FLOW (vertical slice) ou !TERMINAL_INSTALLATION_TRACK (trilho desligado).
 */
export function useDeviceGate(
  restaurantId: string | null,
): UseDeviceGateResult {
  const [state, setState] = useState<UseDeviceGateResult>({
    loading: true,
    allowed: false,
  });

  useEffect(() => {
    if (!restaurantId) {
      setState({
        loading: false,
        allowed: false,
        reason: "DEVICE_RESTAURANT_MISMATCH",
      });
      return;
    }

    if (CONFIG.DEBUG_DIRECT_FLOW) {
      setState({ loading: false, allowed: true });
      return;
    }

    if (!CONFIG.TERMINAL_INSTALLATION_TRACK) {
      setState({ loading: false, allowed: true });
      return;
    }

    const device = getInstalledDevice();
    if (!device) {
      setState({
        loading: false,
        allowed: false,
        reason: "DEVICE_NOT_INSTALLED",
      });
      return;
    }

    if (device.restaurant_id !== restaurantId) {
      setState({
        loading: false,
        allowed: false,
        reason: "DEVICE_RESTAURANT_MISMATCH",
      });
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));

    listEquipmentByRestaurant(restaurantId)
      .then((equipment) => {
        if (cancelled) return;
        const row = equipment.find((e) => e.id === device.device_id);
        if (!row) {
          setState({
            loading: false,
            allowed: false,
            reason: "DEVICE_NOT_IN_CONFIG",
          });
          return;
        }
        if (!row.is_active) {
          setState({
            loading: false,
            allowed: false,
            reason: "DEVICE_DISABLED",
          });
          return;
        }
        setState({ loading: false, allowed: true });
      })
      .catch(() => {
        if (!cancelled) {
          setState({
            loading: false,
            allowed: false,
            reason: "DEVICE_NOT_IN_CONFIG",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  return state;
}
