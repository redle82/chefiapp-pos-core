import { describe, expect, it } from "vitest";
import {
  MAX_HISTORY_ENTRIES,
  calculateZoneDurations,
  createHistoryAccumulator,
  getShiftSummary,
  recordPulseEntry,
  snapshotToEntry,
  toChartData,
} from "./PulseHistory";
import type { PulseHistoryEntry, PulseSnapshot, PulseZone } from "./PulseState";

// ─── Helpers ────────────────────────────────────────────

const SHIFT_START = "2025-01-15T10:00:00.000Z";

function makeEntry(
  score: number,
  zone: PulseZone,
  minutesOffset: number,
): PulseHistoryEntry {
  const ts = new Date(
    new Date(SHIFT_START).getTime() + minutesOffset * 60_000,
  ).toISOString();
  return {
    timestamp: ts,
    score,
    zone,
    components: {
      orderPressure: score * 0.5,
      flowRate: score * 0.3,
      timeBias: score * 0.2,
    },
  };
}

function makeSnapshot(score: number, zone: PulseZone): PulseSnapshot {
  return {
    score,
    zone,
    timestamp: new Date().toISOString(),
    components: {
      orderPressure: score * 0.5,
      flowRate: score * 0.3,
      timeBias: score * 0.2,
    },
  };
}

// ─── Constants ──────────────────────────────────────────

describe("MAX_HISTORY_ENTRIES", () => {
  it("is 240", () => {
    expect(MAX_HISTORY_ENTRIES).toBe(240);
  });
});

// ─── createHistoryAccumulator ───────────────────────────

describe("createHistoryAccumulator", () => {
  it("returns empty accumulator with given shift start", () => {
    const acc = createHistoryAccumulator(SHIFT_START);
    expect(acc.entries).toEqual([]);
    expect(acc.shiftStart).toBe(SHIFT_START);
    expect(acc.peakScore).toBe(0);
    expect(acc.troughScore).toBe(100);
    expect(acc.transitionCount).toBe(0);
  });
});

// ─── snapshotToEntry ────────────────────────────────────

describe("snapshotToEntry", () => {
  it("converts snapshot to history entry", () => {
    const snap = makeSnapshot(75, "FLOW_ALTO");
    const entry = snapshotToEntry(snap, "2025-01-15T10:05:00.000Z");
    expect(entry.timestamp).toBe("2025-01-15T10:05:00.000Z");
    expect(entry.score).toBe(75);
    expect(entry.zone).toBe("FLOW_ALTO");
    expect(entry.components).toEqual(snap.components);
  });

  it("creates a copy of components (not reference)", () => {
    const snap = makeSnapshot(50, "FLOW_PARCIAL");
    const entry = snapshotToEntry(snap, SHIFT_START);
    expect(entry.components).toEqual(snap.components);
    expect(entry.components).not.toBe(snap.components);
  });
});

// ─── recordPulseEntry ───────────────────────────────────

describe("recordPulseEntry", () => {
  it("appends entry and updates peak/trough", () => {
    let acc = createHistoryAccumulator(SHIFT_START);
    const e1 = makeEntry(60, "FLOW_PARCIAL", 0);
    acc = recordPulseEntry(acc, e1);
    expect(acc.entries).toHaveLength(1);
    expect(acc.peakScore).toBe(60);
    expect(acc.troughScore).toBe(60);
  });

  it("tracks peakScore and troughScore correctly", () => {
    let acc = createHistoryAccumulator(SHIFT_START);
    acc = recordPulseEntry(acc, makeEntry(40, "FLOW_PARCIAL", 0));
    acc = recordPulseEntry(acc, makeEntry(80, "FLOW_ALTO", 1));
    acc = recordPulseEntry(acc, makeEntry(20, "FLOW_BASE", 2));
    expect(acc.peakScore).toBe(80);
    expect(acc.troughScore).toBe(20);
  });

  it("does not count transition on first entry", () => {
    let acc = createHistoryAccumulator(SHIFT_START);
    acc = recordPulseEntry(acc, makeEntry(75, "FLOW_ALTO", 0));
    expect(acc.transitionCount).toBe(0);
  });

  it("counts zone transitions", () => {
    let acc = createHistoryAccumulator(SHIFT_START);
    acc = recordPulseEntry(acc, makeEntry(75, "FLOW_ALTO", 0));
    acc = recordPulseEntry(acc, makeEntry(50, "FLOW_PARCIAL", 1)); // +1 transition
    acc = recordPulseEntry(acc, makeEntry(45, "FLOW_PARCIAL", 2)); // same zone
    acc = recordPulseEntry(acc, makeEntry(15, "FLOW_BASE", 3)); // +1 transition
    expect(acc.transitionCount).toBe(2);
  });

  it("enforces FIFO eviction at MAX_HISTORY_ENTRIES", () => {
    let acc = createHistoryAccumulator(SHIFT_START);
    for (let i = 0; i < MAX_HISTORY_ENTRIES + 10; i++) {
      acc = recordPulseEntry(acc, makeEntry(50, "FLOW_PARCIAL", i * 0.5));
    }
    expect(acc.entries).toHaveLength(MAX_HISTORY_ENTRIES);
    // First entry should be the 11th (0-indexed 10) since first 10 evicted
    const firstEntryTime = new Date(acc.entries[0].timestamp).getTime();
    const expectedTime = new Date(SHIFT_START).getTime() + 10 * 0.5 * 60_000;
    expect(firstEntryTime).toBe(expectedTime);
  });

  it("is immutable (does not mutate input)", () => {
    let acc = createHistoryAccumulator(SHIFT_START);
    const original = acc;
    acc = recordPulseEntry(acc, makeEntry(60, "FLOW_PARCIAL", 0));
    expect(original.entries).toHaveLength(0);
    expect(acc.entries).toHaveLength(1);
  });
});

// ─── calculateZoneDurations ─────────────────────────────

describe("calculateZoneDurations", () => {
  it("returns zeroes for empty accumulator", () => {
    const acc = createHistoryAccumulator(SHIFT_START);
    const d = calculateZoneDurations(acc);
    expect(d.flowAltoSec).toBe(0);
    expect(d.flowParcialSec).toBe(0);
    expect(d.flowBaseSec).toBe(0);
    expect(d.totalSec).toBe(0);
  });

  it("returns zeroes for single entry (no gap)", () => {
    let acc = createHistoryAccumulator(SHIFT_START);
    acc = recordPulseEntry(acc, makeEntry(75, "FLOW_ALTO", 0));
    const d = calculateZoneDurations(acc);
    expect(d.totalSec).toBe(0);
  });

  it("calculates durations from time gaps", () => {
    let acc = createHistoryAccumulator(SHIFT_START);
    acc = recordPulseEntry(acc, makeEntry(75, "FLOW_ALTO", 0)); // T+0
    acc = recordPulseEntry(acc, makeEntry(75, "FLOW_ALTO", 2)); // T+2min → 120s ALTO
    acc = recordPulseEntry(acc, makeEntry(50, "FLOW_PARCIAL", 5)); // T+5min → 180s ALTO more
    const d = calculateZoneDurations(acc);
    // ALTO: gap T0→T2 (120s) + gap T2→T5 (180s) = 300s
    expect(d.flowAltoSec).toBe(300);
    expect(d.flowParcialSec).toBe(0); // last entry has no next
    expect(d.totalSec).toBe(300);
  });

  it("calculates percentages correctly", () => {
    let acc = createHistoryAccumulator(SHIFT_START);
    acc = recordPulseEntry(acc, makeEntry(75, "FLOW_ALTO", 0));
    acc = recordPulseEntry(acc, makeEntry(50, "FLOW_PARCIAL", 1)); // 60s ALTO
    acc = recordPulseEntry(acc, makeEntry(15, "FLOW_BASE", 2)); // 60s PARCIAL
    acc = recordPulseEntry(acc, makeEntry(10, "FLOW_BASE", 3)); // 60s BASE
    const d = calculateZoneDurations(acc);
    // total = 180s, each zone = 60s = 33.3%
    expect(d.percentages.FLOW_ALTO).toBeCloseTo(33.3, 1);
    expect(d.percentages.FLOW_PARCIAL).toBeCloseTo(33.3, 1);
    expect(d.percentages.FLOW_BASE).toBeCloseTo(33.3, 1);
  });

  it("handles all-same-zone scenarios", () => {
    let acc = createHistoryAccumulator(SHIFT_START);
    acc = recordPulseEntry(acc, makeEntry(75, "FLOW_ALTO", 0));
    acc = recordPulseEntry(acc, makeEntry(80, "FLOW_ALTO", 5));
    const d = calculateZoneDurations(acc);
    expect(d.flowAltoSec).toBe(300); // 5min = 300s
    expect(d.percentages.FLOW_ALTO).toBe(100);
  });
});

// ─── toChartData ────────────────────────────────────────

describe("toChartData", () => {
  it("returns empty array for empty accumulator", () => {
    const acc = createHistoryAccumulator(SHIFT_START);
    expect(toChartData(acc)).toEqual([]);
  });

  it("converts entries to chart points with minutesSinceStart", () => {
    let acc = createHistoryAccumulator(SHIFT_START);
    acc = recordPulseEntry(acc, makeEntry(75, "FLOW_ALTO", 0));
    acc = recordPulseEntry(acc, makeEntry(60, "FLOW_PARCIAL", 5));
    acc = recordPulseEntry(acc, makeEntry(20, "FLOW_BASE", 10));
    const points = toChartData(acc);
    expect(points).toHaveLength(3);
    expect(points[0].minutesSinceStart).toBe(0);
    expect(points[0].score).toBe(75);
    expect(points[0].zone).toBe("FLOW_ALTO");
    expect(points[1].minutesSinceStart).toBe(5);
    expect(points[2].minutesSinceStart).toBe(10);
  });

  it("downsamples when entries exceed maxPoints", () => {
    let acc = createHistoryAccumulator(SHIFT_START);
    for (let i = 0; i < 200; i++) {
      acc = recordPulseEntry(acc, makeEntry(50, "FLOW_PARCIAL", i * 0.5));
    }
    const points = toChartData(acc, 50);
    expect(points).toHaveLength(50);
  });

  it("includes last point after downsampling", () => {
    let acc = createHistoryAccumulator(SHIFT_START);
    for (let i = 0; i < 200; i++) {
      acc = recordPulseEntry(acc, makeEntry(i % 100, "FLOW_PARCIAL", i * 0.5));
    }
    const points = toChartData(acc, 50);
    const lastEntry = acc.entries[acc.entries.length - 1];
    const lastPoint = points[points.length - 1];
    expect(lastPoint.score).toBe(lastEntry.score);
  });

  it("does not downsample when entries <= maxPoints", () => {
    let acc = createHistoryAccumulator(SHIFT_START);
    for (let i = 0; i < 10; i++) {
      acc = recordPulseEntry(acc, makeEntry(50, "FLOW_PARCIAL", i));
    }
    const points = toChartData(acc, 120);
    expect(points).toHaveLength(10);
  });
});

// ─── getShiftSummary ────────────────────────────────────

describe("getShiftSummary", () => {
  it("returns fallback message for empty history", () => {
    const acc = createHistoryAccumulator(SHIFT_START);
    expect(getShiftSummary(acc)).toBe("Sem dados de pulse neste turno.");
  });

  it("returns formatted summary string", () => {
    let acc = createHistoryAccumulator(SHIFT_START);
    acc = recordPulseEntry(acc, makeEntry(75, "FLOW_ALTO", 0));
    acc = recordPulseEntry(acc, makeEntry(50, "FLOW_PARCIAL", 30));
    acc = recordPulseEntry(acc, makeEntry(20, "FLOW_BASE", 60));
    const summary = getShiftSummary(acc);
    expect(summary).toContain("Turno:");
    expect(summary).toContain("Score atual:");
    expect(summary).toContain("Pico: 75");
    expect(summary).toContain("Mínimo: 20");
    expect(summary).toContain("FLOW_ALTO:");
    expect(summary).toContain("FLOW_PARCIAL:");
    expect(summary).toContain("FLOW_BASE:");
    expect(summary).toContain("Transições: 2");
  });

  it("shows latest score in summary", () => {
    let acc = createHistoryAccumulator(SHIFT_START);
    acc = recordPulseEntry(acc, makeEntry(75, "FLOW_ALTO", 0));
    acc = recordPulseEntry(acc, makeEntry(42, "FLOW_PARCIAL", 5));
    const summary = getShiftSummary(acc);
    expect(summary).toContain("Score atual: 42 (FLOW_PARCIAL)");
  });
});
