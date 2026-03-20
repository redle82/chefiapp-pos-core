/**
 * PulseHistory — Historical pulse data for shift charts
 *
 * Pure deterministic logic, zero I/O, zero side effects.
 *
 * Accumulates PulseHistoryEntry snapshots during a shift
 * to power timeline charts showing pulse evolution.
 * Provides zone duration calculations and chart data points.
 */

import type { PulseHistoryEntry, PulseSnapshot, PulseZone } from "./PulseState";

// ─── Types ──────────────────────────────────────────────

/** Zone duration summary for a shift */
export interface ZoneDurationSummary {
  /** Total seconds spent in FLOW_ALTO */
  readonly flowAltoSec: number;
  /** Total seconds spent in FLOW_PARCIAL */
  readonly flowParcialSec: number;
  /** Total seconds spent in FLOW_BASE */
  readonly flowBaseSec: number;
  /** Shift total duration in seconds */
  readonly totalSec: number;
  /** Percentage in each zone (0-100) */
  readonly percentages: Record<PulseZone, number>;
}

/** A chart data point (simplified for rendering) */
export interface PulseChartPoint {
  /** Minutes since shift start */
  readonly minutesSinceStart: number;
  /** Pulse score at this point */
  readonly score: number;
  /** Zone at this point */
  readonly zone: PulseZone;
}

/** Immutable accumulator for pulse history during a shift */
export interface PulseHistoryAccumulator {
  /** All recorded entries */
  readonly entries: readonly PulseHistoryEntry[];
  /** Shift start ISO timestamp */
  readonly shiftStart: string;
  /** Maximum score observed */
  readonly peakScore: number;
  /** Minimum score observed */
  readonly troughScore: number;
  /** Number of zone transitions */
  readonly transitionCount: number;
}

// ─── Constants ──────────────────────────────────────────

/** Default max entries to keep (2-hour shift at 30s intervals) */
export const MAX_HISTORY_ENTRIES = 240;

// ─── Pure Functions ─────────────────────────────────────

/**
 * Create a new accumulator at shift start.
 */
export function createHistoryAccumulator(
  shiftStartISO: string,
): PulseHistoryAccumulator {
  return {
    entries: [],
    shiftStart: shiftStartISO,
    peakScore: 0,
    troughScore: 100,
    transitionCount: 0,
  };
}

/**
 * Convert a PulseSnapshot into a PulseHistoryEntry.
 */
export function snapshotToEntry(
  snapshot: PulseSnapshot,
  timestampISO: string,
): PulseHistoryEntry {
  return {
    timestamp: timestampISO,
    score: snapshot.score,
    zone: snapshot.zone,
    components: { ...snapshot.components },
  };
}

/**
 * Record a new pulse reading into the history.
 * Enforces the MAX_HISTORY_ENTRIES cap (FIFO eviction).
 * Returns a new accumulator.
 */
export function recordPulseEntry(
  acc: PulseHistoryAccumulator,
  entry: PulseHistoryEntry,
): PulseHistoryAccumulator {
  const prevZone =
    acc.entries.length > 0 ? acc.entries[acc.entries.length - 1].zone : null;

  const zoneChanged = prevZone !== null && prevZone !== entry.zone;

  let newEntries = [...acc.entries, entry];
  if (newEntries.length > MAX_HISTORY_ENTRIES) {
    newEntries = newEntries.slice(newEntries.length - MAX_HISTORY_ENTRIES);
  }

  return {
    entries: newEntries,
    shiftStart: acc.shiftStart,
    peakScore: Math.max(acc.peakScore, entry.score),
    troughScore: Math.min(acc.troughScore, entry.score),
    transitionCount: acc.transitionCount + (zoneChanged ? 1 : 0),
  };
}

/**
 * Calculate zone durations from history entries.
 * Uses time gaps between consecutive entries.
 */
export function calculateZoneDurations(
  acc: PulseHistoryAccumulator,
): ZoneDurationSummary {
  const durations: Record<PulseZone, number> = {
    FLOW_ALTO: 0,
    FLOW_PARCIAL: 0,
    FLOW_BASE: 0,
  };

  const entries = acc.entries;
  for (let i = 0; i < entries.length - 1; i++) {
    const current = entries[i];
    const next = entries[i + 1];
    const gap = Math.max(
      0,
      (new Date(next.timestamp).getTime() -
        new Date(current.timestamp).getTime()) /
        1000,
    );
    durations[current.zone] += gap;
  }

  const totalSec =
    durations.FLOW_ALTO + durations.FLOW_PARCIAL + durations.FLOW_BASE;

  const percentages: Record<PulseZone, number> = {
    FLOW_ALTO:
      totalSec > 0
        ? Math.round((durations.FLOW_ALTO / totalSec) * 1000) / 10
        : 0,
    FLOW_PARCIAL:
      totalSec > 0
        ? Math.round((durations.FLOW_PARCIAL / totalSec) * 1000) / 10
        : 0,
    FLOW_BASE:
      totalSec > 0
        ? Math.round((durations.FLOW_BASE / totalSec) * 1000) / 10
        : 0,
  };

  return {
    flowAltoSec: Math.round(durations.FLOW_ALTO),
    flowParcialSec: Math.round(durations.FLOW_PARCIAL),
    flowBaseSec: Math.round(durations.FLOW_BASE),
    totalSec: Math.round(totalSec),
    percentages,
  };
}

/**
 * Convert history to chart-friendly data points.
 *
 * @param acc Pulse history accumulator
 * @param maxPoints Maximum points to return (downsamples if exceeded)
 */
export function toChartData(
  acc: PulseHistoryAccumulator,
  maxPoints = 120,
): readonly PulseChartPoint[] {
  const entries = acc.entries;
  if (entries.length === 0) return [];

  const shiftStartMs = new Date(acc.shiftStart).getTime();

  const allPoints: PulseChartPoint[] = entries.map((e) => ({
    minutesSinceStart:
      Math.round(
        ((new Date(e.timestamp).getTime() - shiftStartMs) / 60_000) * 10,
      ) / 10,
    score: e.score,
    zone: e.zone,
  }));

  // Downsample if too many points
  if (allPoints.length <= maxPoints) return allPoints;

  const step = allPoints.length / maxPoints;
  const sampled: PulseChartPoint[] = [];
  for (let i = 0; i < maxPoints; i++) {
    sampled.push(allPoints[Math.floor(i * step)]);
  }
  // Always include last point
  const last = allPoints[allPoints.length - 1];
  if (sampled.length > 0 && sampled[sampled.length - 1] !== last) {
    sampled[sampled.length - 1] = last;
  }

  return sampled;
}

/**
 * Get a textual shift summary string.
 */
export function getShiftSummary(acc: PulseHistoryAccumulator): string {
  if (acc.entries.length === 0) return "Sem dados de pulse neste turno.";

  const durations = calculateZoneDurations(acc);
  const latest = acc.entries[acc.entries.length - 1];

  return [
    `Turno: ${
      durations.totalSec > 0 ? Math.round(durations.totalSec / 60) : 0
    } min`,
    `Score atual: ${latest.score} (${latest.zone})`,
    `Pico: ${acc.peakScore} | Mínimo: ${acc.troughScore}`,
    `FLOW_ALTO: ${durations.percentages.FLOW_ALTO}%`,
    `FLOW_PARCIAL: ${durations.percentages.FLOW_PARCIAL}%`,
    `FLOW_BASE: ${durations.percentages.FLOW_BASE}%`,
    `Transições: ${acc.transitionCount}`,
  ].join(" | ");
}
