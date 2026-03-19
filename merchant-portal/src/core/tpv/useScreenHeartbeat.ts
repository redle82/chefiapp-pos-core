/**
 * useScreenHeartbeat — Announces a screen's presence via BroadcastChannel.
 *
 * Each screen (KDS, CustomerDisplay, etc.) calls this hook once at the
 * component top level. It sends:
 *   - "open" on mount
 *   - "heartbeat" every 10 seconds
 *   - "close" on unmount
 *
 * The Screens Hub listens via useScreenInstances to track live status.
 */

import { useEffect, useRef } from "react";

export const SCREEN_CHANNEL_NAME = "chefiapp_screens";

export const HEARTBEAT_INTERVAL_MS = 10_000;

export interface ScreenMessage {
  action: "open" | "heartbeat" | "close";
  instanceId: string;
  type: string;
  title: string;
  timestamp: number;
}

/**
 * Sends periodic heartbeat messages so the Screens Hub can track this
 * screen instance as online.
 *
 * Gracefully degrades to a no-op when BroadcastChannel is unavailable (SSR).
 */
export function useScreenHeartbeat(type: string, title: string): void {
  const instanceIdRef = useRef<string>("");

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;

    const instanceId = crypto.randomUUID();
    instanceIdRef.current = instanceId;

    const channel = new BroadcastChannel(SCREEN_CHANNEL_NAME);

    const send = (action: ScreenMessage["action"]) => {
      const msg: ScreenMessage = {
        action,
        instanceId,
        type,
        title,
        timestamp: Date.now(),
      };
      channel.postMessage(msg);
    };

    send("open");

    const intervalId = setInterval(() => send("heartbeat"), HEARTBEAT_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
      send("close");
      channel.close();
    };
  }, [type, title]);
}
