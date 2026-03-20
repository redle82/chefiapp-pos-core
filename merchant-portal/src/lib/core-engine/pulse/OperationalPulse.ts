/**
 * OperationalPulse — Pure deterministic calculator
 *
 * Zero side effects, zero I/O, zero UI dependencies.
 * Takes input signals + config → returns PulseSnapshot.
 *
 * Formula:
 *   orderPressure = (activeOrders / capacity) × 50      [0-50]
 *   flowRate      = (ordersLast30min / peakBaseline) × 30 [0-30]
 *   timeBias      = hourCurve[hour] × 20                  [0-20]
 *   pulse         = clamp(sum, 0, 100)
 */

import type { PulseConfig } from "./PulseConfig";
import type {
  PulseComponents,
  PulseInput,
  PulseSnapshot,
  PulseZone,
} from "./PulseState";

/** Clamp a number between min and max */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Calculate individual pulse components from raw inputs */
export function calculateComponents(
  input: PulseInput,
  config: PulseConfig,
): PulseComponents {
  const capacity = Math.max(input.declaredCapacity, 1); // avoid div/0
  const baseline = Math.max(config.peakBaseline, 1);

  const orderPressure = clamp((input.activeOrders / capacity) * 50, 0, 50);
  const flowRate = clamp((input.ordersLast30min / baseline) * 30, 0, 30);

  const hourIndex = clamp(Math.floor(input.hourOfDay), 0, 23);
  const curve = config.hourCurve[hourIndex] ?? 0;
  const timeBias = clamp(curve * 20, 0, 20);

  return { orderPressure, flowRate, timeBias };
}

/** Derive the zone from a pulse score using configured thresholds */
export function deriveZone(score: number, config: PulseConfig): PulseZone {
  if (score >= config.thresholds.altoMin) return "FLOW_ALTO";
  if (score >= config.thresholds.parcialMin) return "FLOW_PARCIAL";
  return "FLOW_BASE";
}

/**
 * Calculate a complete PulseSnapshot from input signals.
 *
 * This is the main entry point — pure function, no side effects.
 */
export function calculatePulse(
  input: PulseInput,
  config: PulseConfig,
): PulseSnapshot {
  const components = calculateComponents(input, config);
  const rawScore =
    components.orderPressure + components.flowRate + components.timeBias;
  const score = clamp(Math.round(rawScore * 100) / 100, 0, 100);
  const zone = deriveZone(score, config);

  return {
    score,
    zone,
    timestamp: new Date().toISOString(),
    components,
  };
}

/**
 * Check if a zone transition occurred between two snapshots.
 * Useful for triggering events only on zone change.
 */
export function hasZoneChanged(
  previous: PulseSnapshot | null,
  current: PulseSnapshot,
): boolean {
  if (!previous) return true;
  return previous.zone !== current.zone;
}

/** Re-export types for convenience */
export type {
  PulseComponents,
  PulseInput,
  PulseSnapshot,
  PulseZone,
} from "./PulseState";
