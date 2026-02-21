/**
 * usePulse — React hook for operational pulse calculation
 *
 * Pure calculation hook: receives a PulseInput supplier,
 * recalculates on an interval, and exposes the current snapshot.
 *
 * Does NOT fetch data — the Provider is responsible for sourcing inputs.
 */
// @ts-nocheck


import { useCallback, useEffect, useRef, useState } from "react";
import type {
  PulseConfig,
  PulseInput,
  PulseSnapshot,
  PulseZone,
} from "../../../../core-engine/pulse";
import {
  calculatePulse,
  hasZoneChanged,
  mergePulseConfig,
} from "../../../../core-engine/pulse";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UsePulseOptions {
  /** Partial config overrides (merged with defaults) */
  config?: Partial<PulseConfig>;
  /** Override refresh interval (ms). Falls back to config.refreshIntervalMs */
  refreshMs?: number;
  /** Disable pulse calculation entirely (e.g. shift closed) */
  enabled?: boolean;
}

export interface UsePulseResult {
  /** Latest pulse snapshot (null before first calculation) */
  snapshot: PulseSnapshot | null;
  /** Whether pulse is actively being calculated */
  isActive: boolean;
  /** Previous zone (for transition detection) */
  previousZone: PulseZone | null;
  /** Whether zone changed on last tick */
  zoneChanged: boolean;
  /** Imperatively recalculate now */
  recalculate: () => PulseSnapshot | null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * @param getInput - Callback that returns current PulseInput, or null if
 *   data is not yet available. Stored in a ref so callers don't need
 *   to memoize it.
 * @param options - Optional config/interval/enabled overrides.
 */
export function usePulse(
  getInput: () => PulseInput | null,
  options: UsePulseOptions = {},
): UsePulseResult {
  const mergedConfig = mergePulseConfig(options.config);
  const refreshMs = options.refreshMs ?? mergedConfig.refreshIntervalMs;
  const enabled = options.enabled ?? true;

  const [snapshot, setSnapshot] = useState<PulseSnapshot | null>(null);
  const [previousZone, setPreviousZone] = useState<PulseZone | null>(null);
  const [zoneChanged, setZoneChanged] = useState(false);

  // Refs to avoid stale closures in setInterval callback
  const getInputRef = useRef(getInput);
  const configRef = useRef(mergedConfig);
  const prevSnapshotRef = useRef<PulseSnapshot | null>(null);

  useEffect(() => {
    getInputRef.current = getInput;
  }, [getInput]);

  useEffect(() => {
    configRef.current = mergedConfig;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(mergedConfig)]);

  const tick = useCallback(() => {
    const input = getInputRef.current();
    if (!input) return null;

    const next = calculatePulse(input, configRef.current);
    const prev = prevSnapshotRef.current;

    const changed = prev !== null && hasZoneChanged(prev, next);
    if (changed && prev) {
      setPreviousZone(prev.zone);
    }
    setZoneChanged(changed);
    setSnapshot(next);
    prevSnapshotRef.current = next;

    return next;
  }, []);

  // Main effect: start/stop interval
  useEffect(() => {
    if (!enabled) {
      setSnapshot(null);
      setZoneChanged(false);
      prevSnapshotRef.current = null;
      return;
    }

    // Immediate first tick
    tick();

    const id = setInterval(tick, refreshMs);
    return () => clearInterval(id);
  }, [enabled, refreshMs, tick]);

  return {
    snapshot,
    isActive: enabled && snapshot !== null,
    previousZone,
    zoneChanged,
    recalculate: tick,
  };
}
