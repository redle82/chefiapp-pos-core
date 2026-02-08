/**
 * PulseConfig — Default configuration and per-restaurant overrides
 *
 * Pure data, zero dependencies.
 */

import type { PulseThresholds } from "./PulseState";

/** Full configuration for the pulse calculator */
export interface PulseConfig {
  /** Zone boundary thresholds */
  readonly thresholds: PulseThresholds;
  /** Restaurant's max simultaneous order capacity (fallback) */
  readonly defaultCapacity: number;
  /** Baseline: expected orders/30min during peak hour */
  readonly peakBaseline: number;
  /** Hour-of-day curve: multiplier 0.0-1.0 for each hour */
  readonly hourCurve: readonly number[];
  /** How often to recalculate (ms) */
  readonly refreshIntervalMs: number;
}

/**
 * Hour curve for a typical Brazilian restaurant:
 * - 06-10: ramp up (breakfast/café)
 * - 11-14: peak lunch
 * - 15-17: slow afternoon
 * - 18-22: peak dinner
 * - 23-05: closed/minimal
 */
const DEFAULT_HOUR_CURVE: readonly number[] = [
  // 00   01   02   03   04   05
  0.0, 0.0, 0.0, 0.0, 0.0, 0.05,
  // 06   07   08   09   10   11
  0.1, 0.15, 0.25, 0.3, 0.4, 0.8,
  // 12   13   14   15   16   17
  1.0, 0.9, 0.6, 0.3, 0.25, 0.35,
  // 18   19   20   21   22   23
  0.7, 0.95, 1.0, 0.85, 0.5, 0.15,
] as const;

/** Sensible defaults — suitable for a small-medium restaurant */
export const DEFAULT_PULSE_CONFIG: PulseConfig = {
  thresholds: {
    altoMin: 70,
    parcialMin: 30,
  },
  defaultCapacity: 15,
  peakBaseline: 12,
  hourCurve: DEFAULT_HOUR_CURVE,
  refreshIntervalMs: 30_000, // 30 seconds
} as const;

/** Merge partial overrides with defaults */
export function mergePulseConfig(
  overrides?: Partial<PulseConfig>,
): PulseConfig {
  if (!overrides) return DEFAULT_PULSE_CONFIG;
  return {
    ...DEFAULT_PULSE_CONFIG,
    ...overrides,
    thresholds: {
      ...DEFAULT_PULSE_CONFIG.thresholds,
      ...overrides.thresholds,
    },
  };
}
