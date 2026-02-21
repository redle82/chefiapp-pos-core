// @ts-nocheck
import { useCallback, useEffect, useState } from "react";
import {
  check as singletonCheck,
  getState,
  startPolling as singletonStartPolling,
  stopPolling as singletonStopPolling,
  subscribe,
} from "./coreHealthSingleton";

/**
 * useCoreHealth — Continuous Health Monitoring (singleton)
 *
 * TRUTH PRINCIPLE: The UI never assumes backend is up.
 * Um único estado e um único polling; todos os consumidores subscrevem o mesmo estado.
 * OPERATIONAL_KERNEL_CONTRACT: reduz logs repetidos "[CoreHealth] Status changed".
 *
 * States: UNKNOWN | UP | DOWN | DEGRADED
 */

export type CoreHealthStatus = "UNKNOWN" | "UP" | "DOWN" | "DEGRADED";

export interface CoreHealthState {
  status: CoreHealthStatus;
  lastChecked: number | null;
  lastSuccess: number | null;
  consecutiveFailures: number;
  latencyMs: number | null;
  isChecking: boolean;
}

export interface UseCoreHealthOptions {
  /** Base URL for health endpoint. Default: localStorage or '' */
  baseUrl?: string;
  /** Polling interval in ms when UP. Default: 30000 (30s) */
  pollInterval?: number;
  /** Polling interval in ms when DOWN. Default: 5000 (5s) */
  downPollInterval?: number;
  /** Timeout for health request in ms. Default: 5000 */
  timeout?: number;
  /** Latency threshold for DEGRADED status in ms. Default: 2000 */
  degradedThresholdMs?: number;
  /** Auto-start polling. Default: true */
  autoStart?: boolean;
}

const DEFAULT_OPTIONS: Required<UseCoreHealthOptions> = {
  baseUrl: "",
  pollInterval: 30000,
  downPollInterval: 5000,
  timeout: 5000,
  degradedThresholdMs: 2000,
  autoStart: true,
};

export function useCoreHealth(
  options: UseCoreHealthOptions = {}
): CoreHealthState & {
  check: () => Promise<CoreHealthStatus>;
  startPolling: () => void;
  stopPolling: () => void;
} {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const [state, setState] = useState<CoreHealthState>(() => getState());

  useEffect(() => {
    const unsub = subscribe(() => setState(getState()));
    return unsub;
  }, []);

  useEffect(() => {
    if (opts.autoStart) {
      singletonStartPolling({
        pollInterval: opts.pollInterval,
        downPollInterval: opts.downPollInterval,
        degradedThresholdMs: opts.degradedThresholdMs,
      });
    }
    if (!opts.autoStart) {
      singletonStopPolling();
    }
  }, [opts.autoStart, opts.pollInterval, opts.downPollInterval, opts.degradedThresholdMs]);

  const check = useCallback((): Promise<CoreHealthStatus> => {
    return singletonCheck({
      degradedThresholdMs: opts.degradedThresholdMs,
    });
  }, [opts.degradedThresholdMs]);

  const startPolling = useCallback(() => {
    singletonStartPolling({
      pollInterval: opts.pollInterval,
      downPollInterval: opts.downPollInterval,
      degradedThresholdMs: opts.degradedThresholdMs,
    });
  }, [opts.pollInterval, opts.downPollInterval, opts.degradedThresholdMs]);

  const stopPolling = useCallback(() => {
    singletonStopPolling();
  }, []);

  return {
    ...state,
    check,
    startPolling,
    stopPolling,
  };
}

/**
 * Utility: Check if action should be blocked based on health
 */
export function shouldBlockAction(status: CoreHealthStatus): boolean {
  return status === "DOWN" || status === "UNKNOWN";
}

/**
 * Utility: Get user-friendly message for health status
 */
export function getHealthMessage(status: CoreHealthStatus): string {
  switch (status) {
    case "UP":
      return "Sistema operacional";
    case "DOWN":
      return "Sistema indisponivel. Tenta novamente em breve.";
    case "DEGRADED":
      return "Sistema lento. Algumas operacoes podem demorar.";
    case "UNKNOWN":
      return "A verificar sistema...";
  }
}
