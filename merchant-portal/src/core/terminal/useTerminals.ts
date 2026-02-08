/**
 * useTerminals — Lista equipamento TPV/KDS e deriva "tem terminais" + estado Online/Offline
 *
 * Fontes: gm_equipment (lista), installedDeviceStorage (este browser), gm_terminals (heartbeat).
 * Contrato: TERMINAL_INSTALLATION_RITUAL.md
 */

import { useCallback, useEffect, useState } from "react";
import type { TerminalEquipmentRow } from "../../core-boundary/readers/EquipmentReader";
import {
  listEquipmentByRestaurant,
  listTerminalsHeartbeatsByRestaurant,
} from "../../core-boundary/readers/EquipmentReader";
import { CONFIG } from "../../config";
import { getInstalledDevice } from "../storage/installedDeviceStorage";

const HEARTBEAT_RECENT_MS = 60_000; // 60s = Online
const REFETCH_INTERVAL_MS = 30_000;

function isHeartbeatRecent(lastHeartbeatAt: string | null): boolean {
  if (!lastHeartbeatAt) return false;
  const ts = new Date(lastHeartbeatAt).getTime();
  return Date.now() - ts <= HEARTBEAT_RECENT_MS;
}

export interface UseTerminalsResult {
  equipment: TerminalEquipmentRow[];
  heartbeats: { id: string; name: string; type: string; last_heartbeat_at: string | null }[];
  hasTerminals: boolean;
  isLoading: boolean;
  /** Este browser é o dispositivo instalado para este equipamento? */
  isThisBrowser(equipment: TerminalEquipmentRow): boolean;
  /** Terminal Online (este browser é este dispositivo ou heartbeat recente). */
  isOnline(equipment: TerminalEquipmentRow): boolean;
}

export function useTerminals(restaurantId: string | null): UseTerminalsResult {
  const localDevice = getInstalledDevice();
  const [equipmentFromApi, setEquipmentFromApi] = useState<TerminalEquipmentRow[]>([]);
  const [heartbeats, setHeartbeats] = useState<
    { id: string; name: string; type: string; last_heartbeat_at: string | null }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const trackEnabled = CONFIG.TERMINAL_INSTALLATION_TRACK;

  // Gate: quando o trilho não está implementado (canQuery false), zero chamadas a gm_equipment / gm_terminals.
  useEffect(() => {
    if (!restaurantId || !trackEnabled) {
      setEquipmentFromApi([]);
      setHeartbeats([]);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    Promise.all([
      listEquipmentByRestaurant(restaurantId),
      listTerminalsHeartbeatsByRestaurant(restaurantId),
    ])
      .then(([eq, hb]) => {
        if (!cancelled) {
          setEquipmentFromApi(eq);
          setHeartbeats(hb);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEquipmentFromApi([]);
          setHeartbeats([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [restaurantId, trackEnabled]);

  // Refresh heartbeats periodically for Online/Offline (só quando o trilho está ativo)
  useEffect(() => {
    if (!restaurantId || !trackEnabled) return;
    const interval = setInterval(() => {
      listTerminalsHeartbeatsByRestaurant(restaurantId).then(setHeartbeats);
    }, REFETCH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [restaurantId, trackEnabled]);

  // Incluir dispositivo local como equipamento quando pertence a este restaurante (TERMINAL_INSTALLATION_RITUAL)
  const equipment: TerminalEquipmentRow[] =
    localDevice && restaurantId && localDevice.restaurant_id === restaurantId
      ? (() => {
          const kind = localDevice.module_id === "tpv" ? "TPV" : "KDS";
          const localRow: TerminalEquipmentRow = {
            id: localDevice.device_id,
            name: localDevice.device_name,
            kind,
            is_active: true,
          };
          const exists = equipmentFromApi.some((e) => e.id === localDevice.device_id);
          return exists ? equipmentFromApi : [localRow, ...equipmentFromApi];
        })()
      : equipmentFromApi;

  const hasTerminals =
    equipment.length > 0 ||
    (!!localDevice && !!restaurantId && localDevice.restaurant_id === restaurantId);

  const isThisBrowser = useCallback(
    (eq: TerminalEquipmentRow): boolean =>
      !!localDevice &&
      localDevice.restaurant_id === restaurantId &&
      localDevice.device_id === eq.id,
    [localDevice, restaurantId]
  );

  const isOnline = useCallback(
    (eq: TerminalEquipmentRow): boolean => {
      if (isThisBrowser(eq)) return true;
      const hb = heartbeats.find(
        (h) => h.name === eq.name && (h.type === eq.kind || h.type === eq.kind)
      );
      return !!hb && isHeartbeatRecent(hb.last_heartbeat_at);
    },
    [heartbeats, isThisBrowser]
  );

  return {
    equipment,
    heartbeats,
    hasTerminals,
    isLoading,
    isThisBrowser,
    isOnline,
  };
}
