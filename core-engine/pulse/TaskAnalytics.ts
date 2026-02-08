/**
 * TaskAnalytics — Pulse × Task completion correlation
 *
 * Pure deterministic logic, zero I/O, zero side effects.
 *
 * Tracks task completions bucketed by pulse zone to answer:
 * "Do operators complete more tasks when the restaurant is busy?"
 *
 * Also provides efficiency metrics: tasks/minute per zone,
 * and a simple correlation coefficient between pulse score
 * and completion rate.
 */

import type { PulseZone } from "./PulseState";

// ─── Types ──────────────────────────────────────────────

/** A single task completion event with its pulse context */
export interface TaskCompletionEvent {
  /** ISO timestamp when the task was completed */
  readonly completedAt: string;
  /** Pulse score at the moment of completion */
  readonly pulseScore: number;
  /** Pulse zone at the moment of completion */
  readonly pulseZone: PulseZone;
  /** Duration in seconds the task took to complete */
  readonly durationSec: number;
  /** Task priority (for weighted analysis) */
  readonly priority: "critical" | "high" | "normal" | "low";
}

/** Per-zone aggregated statistics */
export interface ZoneStats {
  readonly zone: PulseZone;
  /** Total tasks completed in this zone */
  readonly count: number;
  /** Average completion time in seconds */
  readonly avgDurationSec: number;
  /** Tasks per minute while in this zone */
  readonly tasksPerMinute: number;
  /** Total time spent in this zone in seconds */
  readonly totalZoneTimeSec: number;
}

/** Complete analytics summary for a shift */
export interface TaskAnalyticsSummary {
  /** Stats per zone */
  readonly byZone: readonly ZoneStats[];
  /** Overall correlation coefficient (-1 to 1) */
  readonly pulseCompletionCorrelation: number;
  /** Total tasks completed across all zones */
  readonly totalTasks: number;
  /** Average pulse score at task completion */
  readonly avgPulseAtCompletion: number;
  /** Distribution: % of tasks in each zone */
  readonly zoneDistribution: Record<PulseZone, number>;
}

/** Mutable accumulator for collecting events during a shift */
export interface TaskAnalyticsAccumulator {
  /** All completion events (append-only) */
  readonly events: readonly TaskCompletionEvent[];
  /** Time spent in each zone (seconds, updated per pulse reading) */
  readonly zoneTime: Record<PulseZone, number>;
  /** Last pulse zone (for time tracking) */
  readonly lastZone: PulseZone | null;
  /** Last pulse timestamp ISO (for duration calc) */
  readonly lastTimestamp: string | null;
}

// ─── Pure Functions ─────────────────────────────────────

/**
 * Create an empty analytics accumulator for shift start.
 */
export function createEmptyAnalytics(): TaskAnalyticsAccumulator {
  return {
    events: [],
    zoneTime: { FLOW_ALTO: 0, FLOW_PARCIAL: 0, FLOW_BASE: 0 },
    lastZone: null,
    lastTimestamp: null,
  };
}

/**
 * Record a task completion event.
 * Returns a new accumulator (immutable).
 */
export function recordCompletion(
  acc: TaskAnalyticsAccumulator,
  event: TaskCompletionEvent,
): TaskAnalyticsAccumulator {
  return {
    ...acc,
    events: [...acc.events, event],
  };
}

/**
 * Record a pulse tick (for zone-time tracking).
 * Call this on every pulse reading to accumulate zone durations.
 *
 * @param acc Current accumulator
 * @param zone Current pulse zone
 * @param timestamp ISO timestamp of this pulse reading
 */
export function recordPulseTick(
  acc: TaskAnalyticsAccumulator,
  zone: PulseZone,
  timestamp: string,
): TaskAnalyticsAccumulator {
  if (acc.lastZone === null || acc.lastTimestamp === null) {
    return { ...acc, lastZone: zone, lastTimestamp: timestamp };
  }

  const elapsed = Math.max(
    0,
    (new Date(timestamp).getTime() - new Date(acc.lastTimestamp).getTime()) /
      1000,
  );

  const newZoneTime = { ...acc.zoneTime };
  newZoneTime[acc.lastZone] = (newZoneTime[acc.lastZone] || 0) + elapsed;

  return {
    ...acc,
    zoneTime: newZoneTime,
    lastZone: zone,
    lastTimestamp: timestamp,
  };
}

/**
 * Compute per-zone statistics from accumulated events.
 */
export function computeZoneStats(
  acc: TaskAnalyticsAccumulator,
): readonly ZoneStats[] {
  const zones: PulseZone[] = ["FLOW_ALTO", "FLOW_PARCIAL", "FLOW_BASE"];

  return zones.map((zone) => {
    const zoneEvents = acc.events.filter((e) => e.pulseZone === zone);
    const count = zoneEvents.length;
    const totalZoneTimeSec = acc.zoneTime[zone] || 0;

    const avgDurationSec =
      count > 0
        ? Math.round(zoneEvents.reduce((s, e) => s + e.durationSec, 0) / count)
        : 0;

    const tasksPerMinute =
      totalZoneTimeSec > 60
        ? Math.round((count / (totalZoneTimeSec / 60)) * 100) / 100
        : count > 0
        ? count
        : 0;

    return { zone, count, avgDurationSec, tasksPerMinute, totalZoneTimeSec };
  });
}

/**
 * Calculate Pearson correlation coefficient between pulse scores
 * and task completion speed (1/duration).
 *
 * Returns value between -1 and 1:
 *   +1 = higher pulse → faster completions
 *   -1 = higher pulse → slower completions
 *    0 = no correlation
 *
 * Returns 0 if fewer than 3 data points (insufficient data).
 */
export function calculateCorrelation(
  events: readonly TaskCompletionEvent[],
): number {
  if (events.length < 3) return 0;

  const xs = events.map((e) => e.pulseScore);
  const ys = events.map((e) => (e.durationSec > 0 ? 1 / e.durationSec : 0));

  const n = xs.length;
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
  const sumX2 = xs.reduce((a, x) => a + x * x, 0);
  const sumY2 = ys.reduce((a, y) => a + y * y, 0);

  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (den === 0) return 0;

  return Math.round((num / den) * 1000) / 1000;
}

/**
 * Generate a complete analytics summary from the accumulator.
 */
export function generateSummary(
  acc: TaskAnalyticsAccumulator,
): TaskAnalyticsSummary {
  const byZone = computeZoneStats(acc);
  const totalTasks = acc.events.length;
  const pulseCompletionCorrelation = calculateCorrelation(acc.events);

  const avgPulseAtCompletion =
    totalTasks > 0
      ? Math.round(
          (acc.events.reduce((s, e) => s + e.pulseScore, 0) / totalTasks) * 100,
        ) / 100
      : 0;

  const zoneDistribution: Record<PulseZone, number> = {
    FLOW_ALTO: 0,
    FLOW_PARCIAL: 0,
    FLOW_BASE: 0,
  };

  if (totalTasks > 0) {
    for (const stat of byZone) {
      zoneDistribution[stat.zone] =
        Math.round((stat.count / totalTasks) * 100 * 10) / 10;
    }
  }

  return {
    byZone,
    pulseCompletionCorrelation,
    totalTasks,
    avgPulseAtCompletion,
    zoneDistribution,
  };
}
