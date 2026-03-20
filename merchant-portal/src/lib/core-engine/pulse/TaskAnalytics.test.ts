import { describe, expect, it } from "vitest";
import type { TaskCompletionEvent } from "./TaskAnalytics";
import {
  calculateCorrelation,
  computeZoneStats,
  createEmptyAnalytics,
  generateSummary,
  recordCompletion,
  recordPulseTick,
} from "./TaskAnalytics";

// ─── Helpers ────────────────────────────────────────────

function makeEvent(
  overrides: Partial<TaskCompletionEvent> = {},
): TaskCompletionEvent {
  return {
    completedAt: "2025-01-15T12:00:00.000Z",
    pulseScore: 75,
    pulseZone: "FLOW_ALTO",
    durationSec: 30,
    priority: "normal",
    ...overrides,
  };
}

// ─── createEmptyAnalytics ───────────────────────────────

describe("createEmptyAnalytics", () => {
  it("returns zeroed accumulator", () => {
    const acc = createEmptyAnalytics();
    expect(acc.events).toEqual([]);
    expect(acc.zoneTime).toEqual({
      FLOW_ALTO: 0,
      FLOW_PARCIAL: 0,
      FLOW_BASE: 0,
    });
    expect(acc.lastZone).toBeNull();
    expect(acc.lastTimestamp).toBeNull();
  });
});

// ─── recordCompletion ───────────────────────────────────

describe("recordCompletion", () => {
  it("appends event to accumulator", () => {
    const acc = createEmptyAnalytics();
    const ev = makeEvent();
    const next = recordCompletion(acc, ev);
    expect(next.events).toHaveLength(1);
    expect(next.events[0]).toEqual(ev);
  });

  it("preserves previous events immutably", () => {
    const acc = createEmptyAnalytics();
    const e1 = makeEvent({ pulseScore: 80 });
    const e2 = makeEvent({ pulseScore: 50, pulseZone: "FLOW_PARCIAL" });
    const a1 = recordCompletion(acc, e1);
    const a2 = recordCompletion(a1, e2);
    expect(a2.events).toHaveLength(2);
    expect(acc.events).toHaveLength(0); // original unchanged
    expect(a1.events).toHaveLength(1); // first unchanged
  });
});

// ─── recordPulseTick ────────────────────────────────────

describe("recordPulseTick", () => {
  it("initializes state on first tick", () => {
    const acc = createEmptyAnalytics();
    const next = recordPulseTick(acc, "FLOW_ALTO", "2025-01-15T12:00:00.000Z");
    expect(next.lastZone).toBe("FLOW_ALTO");
    expect(next.lastTimestamp).toBe("2025-01-15T12:00:00.000Z");
    // No time accumulated yet
    expect(next.zoneTime.FLOW_ALTO).toBe(0);
  });

  it("accumulates zone time on subsequent ticks", () => {
    let acc = createEmptyAnalytics();
    acc = recordPulseTick(acc, "FLOW_ALTO", "2025-01-15T12:00:00.000Z");
    acc = recordPulseTick(acc, "FLOW_ALTO", "2025-01-15T12:00:30.000Z");
    // 30s in FLOW_ALTO
    expect(acc.zoneTime.FLOW_ALTO).toBe(30);
    expect(acc.zoneTime.FLOW_PARCIAL).toBe(0);
  });

  it("tracks zone transitions correctly", () => {
    let acc = createEmptyAnalytics();
    acc = recordPulseTick(acc, "FLOW_ALTO", "2025-01-15T12:00:00.000Z");
    acc = recordPulseTick(acc, "FLOW_PARCIAL", "2025-01-15T12:01:00.000Z");
    acc = recordPulseTick(acc, "FLOW_BASE", "2025-01-15T12:02:00.000Z");
    // 60s in FLOW_ALTO (from first to second tick), 60s in FLOW_PARCIAL
    expect(acc.zoneTime.FLOW_ALTO).toBe(60);
    expect(acc.zoneTime.FLOW_PARCIAL).toBe(60);
    expect(acc.zoneTime.FLOW_BASE).toBe(0); // current zone, no next tick yet
    expect(acc.lastZone).toBe("FLOW_BASE");
  });

  it("handles zero-duration gap gracefully", () => {
    let acc = createEmptyAnalytics();
    acc = recordPulseTick(acc, "FLOW_ALTO", "2025-01-15T12:00:00.000Z");
    acc = recordPulseTick(acc, "FLOW_ALTO", "2025-01-15T12:00:00.000Z");
    expect(acc.zoneTime.FLOW_ALTO).toBe(0);
  });
});

// ─── computeZoneStats ───────────────────────────────────

describe("computeZoneStats", () => {
  it("returns 3 zone stats for empty accumulator", () => {
    const acc = createEmptyAnalytics();
    const stats = computeZoneStats(acc);
    expect(stats).toHaveLength(3);
    for (const s of stats) {
      expect(s.count).toBe(0);
      expect(s.avgDurationSec).toBe(0);
    }
  });

  it("computes per-zone event counts", () => {
    let acc = createEmptyAnalytics();
    acc = recordCompletion(acc, makeEvent({ pulseZone: "FLOW_ALTO" }));
    acc = recordCompletion(acc, makeEvent({ pulseZone: "FLOW_ALTO" }));
    acc = recordCompletion(acc, makeEvent({ pulseZone: "FLOW_BASE" }));
    const stats = computeZoneStats(acc);
    const alto = stats.find((s) => s.zone === "FLOW_ALTO")!;
    const base = stats.find((s) => s.zone === "FLOW_BASE")!;
    const parcial = stats.find((s) => s.zone === "FLOW_PARCIAL")!;
    expect(alto.count).toBe(2);
    expect(base.count).toBe(1);
    expect(parcial.count).toBe(0);
  });

  it("computes avgDurationSec", () => {
    let acc = createEmptyAnalytics();
    acc = recordCompletion(
      acc,
      makeEvent({ pulseZone: "FLOW_ALTO", durationSec: 20 }),
    );
    acc = recordCompletion(
      acc,
      makeEvent({ pulseZone: "FLOW_ALTO", durationSec: 40 }),
    );
    const stats = computeZoneStats(acc);
    const alto = stats.find((s) => s.zone === "FLOW_ALTO")!;
    expect(alto.avgDurationSec).toBe(30);
  });

  it("computes tasksPerMinute with zone time", () => {
    let acc = createEmptyAnalytics();
    // Add 2 events in FLOW_ALTO
    acc = recordCompletion(acc, makeEvent({ pulseZone: "FLOW_ALTO" }));
    acc = recordCompletion(acc, makeEvent({ pulseZone: "FLOW_ALTO" }));
    // Simulate 2 minutes (120s) in FLOW_ALTO
    acc = recordPulseTick(acc, "FLOW_ALTO", "2025-01-15T12:00:00.000Z");
    acc = recordPulseTick(acc, "FLOW_PARCIAL", "2025-01-15T12:02:00.000Z"); // 120s elapsed
    const stats = computeZoneStats(acc);
    const alto = stats.find((s) => s.zone === "FLOW_ALTO")!;
    // 2 tasks / (120/60) = 1.0 tasks/min
    expect(alto.tasksPerMinute).toBe(1);
    expect(alto.totalZoneTimeSec).toBe(120);
  });

  it("tasksPerMinute equals count when < 60s in zone", () => {
    let acc = createEmptyAnalytics();
    acc = recordCompletion(acc, makeEvent({ pulseZone: "FLOW_ALTO" }));
    // Only 30s in zone
    acc = recordPulseTick(acc, "FLOW_ALTO", "2025-01-15T12:00:00.000Z");
    acc = recordPulseTick(acc, "FLOW_BASE", "2025-01-15T12:00:30.000Z");
    const stats = computeZoneStats(acc);
    const alto = stats.find((s) => s.zone === "FLOW_ALTO")!;
    expect(alto.tasksPerMinute).toBe(1); // count when < 60s
  });
});

// ─── calculateCorrelation ───────────────────────────────

describe("calculateCorrelation", () => {
  it("returns 0 for fewer than 3 data points", () => {
    expect(calculateCorrelation([])).toBe(0);
    expect(calculateCorrelation([makeEvent()])).toBe(0);
    expect(calculateCorrelation([makeEvent(), makeEvent()])).toBe(0);
  });

  it("returns a number between -1 and 1 for valid data", () => {
    const events = [
      makeEvent({ pulseScore: 80, durationSec: 10 }),
      makeEvent({ pulseScore: 60, durationSec: 20 }),
      makeEvent({ pulseScore: 40, durationSec: 30 }),
    ];
    const r = calculateCorrelation(events);
    expect(r).toBeGreaterThanOrEqual(-1);
    expect(r).toBeLessThanOrEqual(1);
  });

  it("positive correlation when higher pulse → faster completion", () => {
    // Higher pulse → lower duration → higher 1/duration
    const events = [
      makeEvent({ pulseScore: 90, durationSec: 10 }),
      makeEvent({ pulseScore: 60, durationSec: 30 }),
      makeEvent({ pulseScore: 30, durationSec: 60 }),
    ];
    const r = calculateCorrelation(events);
    expect(r).toBeGreaterThan(0);
  });

  it("handles zero duration (maps to 0 speed)", () => {
    const events = [
      makeEvent({ pulseScore: 80, durationSec: 0 }),
      makeEvent({ pulseScore: 60, durationSec: 10 }),
      makeEvent({ pulseScore: 40, durationSec: 20 }),
    ];
    // Should not throw
    const r = calculateCorrelation(events);
    expect(typeof r).toBe("number");
    expect(Number.isFinite(r)).toBe(true);
  });

  it("returns 0 when all pulse scores are the same (zero variance)", () => {
    const events = [
      makeEvent({ pulseScore: 50, durationSec: 10 }),
      makeEvent({ pulseScore: 50, durationSec: 20 }),
      makeEvent({ pulseScore: 50, durationSec: 30 }),
    ];
    expect(calculateCorrelation(events)).toBe(0);
  });
});

// ─── generateSummary ────────────────────────────────────

describe("generateSummary", () => {
  it("returns correct summary for empty accumulator", () => {
    const acc = createEmptyAnalytics();
    const s = generateSummary(acc);
    expect(s.totalTasks).toBe(0);
    expect(s.avgPulseAtCompletion).toBe(0);
    expect(s.pulseCompletionCorrelation).toBe(0);
    expect(s.byZone).toHaveLength(3);
    expect(s.zoneDistribution.FLOW_ALTO).toBe(0);
    expect(s.zoneDistribution.FLOW_PARCIAL).toBe(0);
    expect(s.zoneDistribution.FLOW_BASE).toBe(0);
  });

  it("computes avgPulseAtCompletion correctly", () => {
    let acc = createEmptyAnalytics();
    acc = recordCompletion(acc, makeEvent({ pulseScore: 80 }));
    acc = recordCompletion(acc, makeEvent({ pulseScore: 60 }));
    const s = generateSummary(acc);
    expect(s.avgPulseAtCompletion).toBe(70);
  });

  it("computes zone distribution percentages", () => {
    let acc = createEmptyAnalytics();
    acc = recordCompletion(acc, makeEvent({ pulseZone: "FLOW_ALTO" }));
    acc = recordCompletion(acc, makeEvent({ pulseZone: "FLOW_ALTO" }));
    acc = recordCompletion(acc, makeEvent({ pulseZone: "FLOW_ALTO" }));
    acc = recordCompletion(acc, makeEvent({ pulseZone: "FLOW_BASE" }));
    const s = generateSummary(acc);
    expect(s.totalTasks).toBe(4);
    expect(s.zoneDistribution.FLOW_ALTO).toBe(75);
    expect(s.zoneDistribution.FLOW_BASE).toBe(25);
    expect(s.zoneDistribution.FLOW_PARCIAL).toBe(0);
  });

  it("includes correlation in summary", () => {
    let acc = createEmptyAnalytics();
    acc = recordCompletion(acc, makeEvent({ pulseScore: 90, durationSec: 10 }));
    acc = recordCompletion(acc, makeEvent({ pulseScore: 60, durationSec: 30 }));
    acc = recordCompletion(acc, makeEvent({ pulseScore: 30, durationSec: 60 }));
    const s = generateSummary(acc);
    expect(s.pulseCompletionCorrelation).toBeGreaterThan(0);
  });
});
