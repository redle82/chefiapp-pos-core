/**
 * useScreenInstances — Tracks live screen instances via BroadcastChannel.
 *
 * Listens on "chefiapp_screens" for heartbeat messages sent by screens
 * using the useScreenHeartbeat hook. Maintains a local map of instances
 * with status derived from heartbeat freshness:
 *   - online:  heartbeat received within 30 seconds
 *   - stale:   no heartbeat for 30–60 seconds
 *   - offline: no heartbeat for 60+ seconds
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  SCREEN_CHANNEL_NAME,
  type ScreenMessage,
} from "../../../core/tpv/useScreenHeartbeat";

export const STALE_THRESHOLD_MS = 30_000;
export const OFFLINE_THRESHOLD_MS = 60_000;
const STATUS_CHECK_INTERVAL_MS = 5_000;

export type ScreenStatus = "online" | "offline" | "stale";

export interface ScreenInstance {
  id: string;
  type: string;
  title: string;
  openedAt: Date;
  lastHeartbeat: Date;
  status: ScreenStatus;
}

function deriveStatus(lastHeartbeat: Date, now: number): ScreenStatus {
  const elapsed = now - lastHeartbeat.getTime();
  if (elapsed < STALE_THRESHOLD_MS) return "online";
  if (elapsed < OFFLINE_THRESHOLD_MS) return "stale";
  return "offline";
}

export function useScreenInstances(): {
  instances: ScreenInstance[];
  activeCount: number;
  getStatusForType: (type: string) => "online" | "offline" | "unknown";
} {
  const instancesMapRef = useRef<
    Map<
      string,
      { type: string; title: string; openedAt: Date; lastHeartbeat: Date }
    >
  >(new Map());

  const [instances, setInstances] = useState<ScreenInstance[]>([]);

  const refreshInstances = useCallback(() => {
    const now = Date.now();
    const result: ScreenInstance[] = [];
    for (const [id, data] of instancesMapRef.current) {
      result.push({
        id,
        type: data.type,
        title: data.title,
        openedAt: data.openedAt,
        lastHeartbeat: data.lastHeartbeat,
        status: deriveStatus(data.lastHeartbeat, now),
      });
    }
    setInstances(result);
  }, []);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;

    const channel = new BroadcastChannel(SCREEN_CHANNEL_NAME);

    channel.onmessage = (event: MessageEvent<ScreenMessage>) => {
      const msg = event.data;
      if (!msg || !msg.instanceId) return;

      if (msg.action === "close") {
        instancesMapRef.current.delete(msg.instanceId);
      } else {
        const existing = instancesMapRef.current.get(msg.instanceId);
        if (existing) {
          existing.lastHeartbeat = new Date(msg.timestamp);
        } else {
          instancesMapRef.current.set(msg.instanceId, {
            type: msg.type,
            title: msg.title,
            openedAt: new Date(msg.timestamp),
            lastHeartbeat: new Date(msg.timestamp),
          });
        }
      }
      refreshInstances();
    };

    // Periodic status check to update stale/offline states
    const intervalId = setInterval(refreshInstances, STATUS_CHECK_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
      channel.close();
    };
  }, [refreshInstances]);

  const activeCount = instances.filter((i) => i.status === "online").length;

  const getStatusForType = useCallback(
    (type: string): "online" | "offline" | "unknown" => {
      const matching = instances.filter((i) => i.type === type);
      if (matching.length === 0) return "unknown";
      if (matching.some((i) => i.status === "online")) return "online";
      return "offline";
    },
    [instances],
  );

  return { instances, activeCount, getStatusForType };
}
