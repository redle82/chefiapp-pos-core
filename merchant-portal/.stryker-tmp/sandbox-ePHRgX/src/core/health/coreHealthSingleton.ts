/**
 * CoreHealth Singleton — Um único estado e um único polling para Core Health
 *
 * OPERATIONAL_KERNEL_CONTRACT: reduz múltiplas instâncias de useCoreHealth
 * e logs repetidos "[CoreHealth] Status changed". Todos os consumidores
 * subscrevem o mesmo estado.
 */
// @ts-nocheck


import { isDebugMode } from "../debugMode";
import { fetchHealth } from "../health";
import { getTabIsolated } from "../storage/TabIsolatedStorage";
import type { CoreHealthStatus, CoreHealthState } from "./useCoreHealth";

const INITIAL_STATE: CoreHealthState = {
  status: "UNKNOWN",
  lastChecked: null,
  lastSuccess: null,
  consecutiveFailures: 0,
  latencyMs: null,
  isChecking: false,
};

type Listener = () => void;

export interface CoreHealthSingletonOptions {
  pollInterval?: number;
  downPollInterval?: number;
  timeout?: number;
  degradedThresholdMs?: number;
}

let state: CoreHealthState = { ...INITIAL_STATE };
const listeners = new Set<Listener>();
let pollingTimer: ReturnType<typeof setTimeout> | null = null;
let consecutiveFailuresRef = 0;
let refCount = 0;
let currentOpts: CoreHealthSingletonOptions = {};

function notify() {
  listeners.forEach((l) => l());
}

export function getState(): CoreHealthState {
  return { ...state };
}

export function setState(next: Partial<CoreHealthState>) {
  state = { ...state, ...next };
  notify();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  refCount++;
  return () => {
    listeners.delete(listener);
    refCount--;
    if (refCount <= 0) {
      refCount = 0;
      stopPolling();
    }
  };
}

export function stopPolling(): void {
  if (pollingTimer != null) {
    clearTimeout(pollingTimer);
    pollingTimer = null;
  }
}

export async function check(
  opts: CoreHealthSingletonOptions = {}
): Promise<CoreHealthStatus> {
  const degradedThresholdMs = opts.degradedThresholdMs ?? 2000;

  if (isDebugMode() && getTabIsolated("chefiapp_bypass_health") === "true") {
    consecutiveFailuresRef = 0;
    setState({
      status: "UP",
      lastChecked: Date.now(),
      lastSuccess: Date.now(),
      consecutiveFailures: 0,
      latencyMs: 0,
      isChecking: false,
    });
    return "UP";
  }

  setState({ isChecking: true });
  const startTime = Date.now();

  try {
    const result = await fetchHealth();
    const now = Date.now();
    const latencyMs = now - startTime;

    if (result === "down") {
      consecutiveFailuresRef += 1;
      setState({
        status: "DOWN",
        lastChecked: now,
        consecutiveFailures: consecutiveFailuresRef,
        latencyMs,
        isChecking: false,
      });
      return "DOWN";
    }

    const status: CoreHealthStatus =
      latencyMs > degradedThresholdMs ? "DEGRADED" : "UP";
    consecutiveFailuresRef = 0;
    setState({
      status,
      lastChecked: now,
      lastSuccess: now,
      consecutiveFailures: 0,
      latencyMs,
      isChecking: false,
    });
    return status;
  } catch {
    const now = Date.now();
    const latencyMs = now - startTime;
    consecutiveFailuresRef += 1;
    setState({
      status: "DOWN",
      lastChecked: now,
      consecutiveFailures: consecutiveFailuresRef,
      latencyMs,
      isChecking: false,
    });
    return "DOWN";
  }
}

export function startPolling(opts: CoreHealthSingletonOptions = {}): void {
  if (pollingTimer != null) return;
  currentOpts = {
    pollInterval: 30000,
    downPollInterval: 5000,
    degradedThresholdMs: 2000,
    ...opts,
  };

  const poll = async () => {
    const currentStatus = await check(currentOpts);
    const interval =
      currentStatus === "DOWN"
        ? currentOpts.downPollInterval!
        : currentOpts.pollInterval!;
    let nextInterval = interval;
    if (consecutiveFailuresRef > 5) {
      const mult = Math.min(Math.pow(2, consecutiveFailuresRef - 5), 8);
      nextInterval = interval * mult;
    }
    if (refCount > 0) {
      pollingTimer = setTimeout(poll, nextInterval);
    }
  };

  poll();
}
