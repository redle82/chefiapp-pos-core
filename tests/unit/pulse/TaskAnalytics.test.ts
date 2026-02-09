/**
 * TaskAnalytics — Comprehensive Unit Tests
 *
 * Tests every exported function in core-engine/pulse/TaskAnalytics.ts:
 * createEmptyAnalytics, recordCompletion, recordPulseTick,
 * computeZoneStats, calculateCorrelation, generateSummary.
 */

import { describe, it, expect } from "@jest/globals";
import {
  createEmptyAnalytics,
  recordCompletion,
  recordPulseTick,
  computeZoneStats,
  calculateCorrelation,
  generateSummary,
  type TaskCompletionEvent,
  type TaskAnalyticsAccumulator,
} from "../../../core-engine/pulse/TaskAnalytics";

// ── Helpers ─────────────────────────────────────────────

function event(
  overrides: Partial<TaskCompletionEvent> = {},
): TaskCompletionEvent {
  return {
    completedAt: "2026-02-09T12:00:00Z",
    pulseScore: 50,
    pulseZone: "FLOW_PARCIAL",
    durationSec: 60,
    priority: "normal",
    ...overrides,
  };
}

function isoAt(minutesAfterNoon: number): string {
  const d = new Date("2026-02-09T12:00:00Z");
  d.setMinutes(d.getMinutes() + minutesAfterNoon);
  return d.toISOString();
}

// ── createEmptyAnalytics ────────────────────────────────

describe("createEmptyAnalytics", () => {
  it("returns accumulator with empty events", () => {
    const acc = createEmptyAnalytics();
    expect(acc.events).toEqual([]);
  });

  it("initializes all zones to zero time", () => {
    const acc = createEmptyAnalytics();
    expect(acc.zoneTime.FLOW_ALTO).toBe(0);
    expect(acc.zoneTime.FLOW_PARCIAL).toBe(0);
    expect(acc.zoneTime.FLOW_BASE).toBe(0);
  });

  it("has null lastZone and lastTimestamp", () => {
    const acc = createEmptyAnalytics();
    expect(acc.lastZone).toBeNull();
    expect(acc.lastTimestamp).toBeNull();
  });
});

// ── recordCompletion ────────────────────────────────────

describe("recordCompletion", () => {
  it("appends event to accumulator", () => {
    const acc = createEmptyAnalytics();
    const evt = event();
    const next = recordCompletion(acc, evt);

    expect(next.events).toHaveLength(1);
    expect(next.events[0]).toEqual(evt);
  });

  it("preserves existing events (immutable)", () => {
    let acc = createEmptyAnalytics();
    acc = recordCompletion(acc, event({ pulseScore: 10 }));
    acc = recordCompletion(acc, event({ pulseScore: 90 }));

    expect(acc.events).toHaveLength(2);
    expect(acc.events[0].pulseScore).toBe(10);
    expect(acc.events[1].pulseScore).toBe(90);
  });

  it("does not mutate original accumulator", () => {
    const acc = createEmptyAnalytics();
    const next = recordCompletion(acc, event());

    expect(acc.events).toHaveLength(0);
    expect(next.events).toHaveLength(1);
  });
});

// ── recordPulseTick ─────────────────────────────────────

describe("recordPulseTick", () => {
  it("first tick sets lastZone and lastTimestamp only", () => {
    const acc = createEmptyAnalytics();
    const next = recordPulseTick(acc, "FLOW_ALTO", isoAt(0));

    expect(next.lastZone).toBe("FLOW_ALTO");
    expect(next.lastTimestamp).toBe(isoAt(0));
    expect(next.zoneTime.FLOW_ALTO).toBe(0); // No elapsed yet
  });

  it("second tick accumulates elapsed time in previous zone", () => {
    let acc = createEmptyAnalytics();
    acc = recordPulseTick(acc, "FLOW_ALTO", isoAt(0));
    acc = recordPulseTick(acc, "FLOW_ALTO", isoAt(5)); // 5 min later

    expect(acc.zoneTime.FLOW_ALTO).toBe(300); // 5 * 60 seconds
    expect(acc.zoneTime.FLOW_PARCIAL).toBe(0);
    expect(acc.zoneTime.FLOW_BASE).toBe(0);
  });

  it("tracks zone transitions correctly", () => {
    let acc = createEmptyAnalytics();
    acc = recordPulseTick(acc, "FLOW_BASE", isoAt(0));
    acc = recordPulseTick(acc, "FLOW_PARCIAL", isoAt(10)); // 10 min in BASE
    acc = recordPulseTick(acc, "FLOW_ALTO", isoAt(15)); // 5 min in PARCIAL

    expect(acc.zoneTime.FLOW_BASE).toBe(600); // 10 * 60
    expect(acc.zoneTime.FLOW_PARCIAL).toBe(300); // 5 * 60
    expect(acc.zoneTime.FLOW_ALTO).toBe(0); // current zone, not closed
  });

  it("handles zero-elapsed ticks gracefully", () => {
    let acc = createEmptyAnalytics();
    acc = recordPulseTick(acc, "FLOW_BASE", isoAt(0));
    acc = recordPulseTick(acc, "FLOW_BASE", isoAt(0)); // same timestamp

    expect(acc.zoneTime.FLOW_BASE).toBe(0);
  });
});

// ── computeZoneStats ────────────────────────────────────

describe("computeZoneStats", () => {
  it("returns stats for all 3 zones even with no events", () => {
    const acc = createEmptyAnalytics();
    const stats = computeZoneStats(acc);

    expect(stats).toHaveLength(3);
    expect(stats.map((s) => s.zone)).toEqual([
      "FLOW_ALTO",
      "FLOW_PARCIAL",
      "FLOW_BASE",
    ]);
    for (const s of stats) {
      expect(s.count).toBe(0);
      expect(s.avgDurationSec).toBe(0);
    }
  });

  it("calculates correct avg duration per zone", () => {
    let acc = createEmptyAnalytics();
    // Seed zone time
    acc = recordPulseTick(acc, "FLOW_ALTO", isoAt(0));
    acc = recordPulseTick(acc, "FLOW_ALTO", isoAt(30)); // 30 min

    // Add events in ALTO zone
    acc = recordCompletion(
      acc,
      event({ pulseZone: "FLOW_ALTO", durationSec: 30 }),
    );
    acc = recordCompletion(
      acc,
      event({ pulseZone: "FLOW_ALTO", durationSec: 90 }),
    );

    const stats = computeZoneStats(acc);
    const alto = stats.find((s) => s.zone === "FLOW_ALTO")!;

    expect(alto.count).toBe(2);
    expect(alto.avgDurationSec).toBe(60); // (30+90)/2
    expect(alto.totalZoneTimeSec).toBe(1800); // 30 min
  });

  it("calculates tasks per minute", () => {
    let acc = createEmptyAnalytics();
    acc = recordPulseTick(acc, "FLOW_PARCIAL", isoAt(0));
    acc = recordPulseTick(acc, "FLOW_PARCIAL", isoAt(10)); // 10 min = 600s

    // 6 tasks in 10 minutes = 0.6 tasks/min
    for (let i = 0; i < 6; i++) {
      acc = recordCompletion(
        acc,
        event({ pulseZone: "FLOW_PARCIAL", durationSec: 30 }),
      );
    }

    const stats = computeZoneStats(acc);
    const parcial = stats.find((s) => s.zone === "FLOW_PARCIAL")!;

    expect(parcial.count).toBe(6);
    expect(parcial.tasksPerMinute).toBe(0.6);
  });
});

// ── calculateCorrelation ────────────────────────────────

describe("calculateCorrelation", () => {
  it("returns 0 with fewer than 3 events", () => {
    expect(calculateCorrelation([])).toBe(0);
    expect(calculateCorrelation([event()])).toBe(0);
    expect(calculateCorrelation([event(), event()])).toBe(0);
  });

  it("returns positive correlation when higher pulse = faster tasks", () => {
    const events = [
      event({ pulseScore: 20, durationSec: 120 }), // slow
      event({ pulseScore: 50, durationSec: 60 }), // medium
      event({ pulseScore: 80, durationSec: 30 }), // fast
    ];

    const corr = calculateCorrelation(events);
    expect(corr).toBeGreaterThan(0);
    expect(corr).toBeLessThanOrEqual(1);
  });

  it("returns negative correlation when higher pulse = slower tasks", () => {
    const events = [
      event({ pulseScore: 20, durationSec: 30 }), // fast at low pulse
      event({ pulseScore: 50, durationSec: 60 }), // medium
      event({ pulseScore: 80, durationSec: 120 }), // slow at high pulse
    ];

    const corr = calculateCorrelation(events);
    expect(corr).toBeLessThan(0);
    expect(corr).toBeGreaterThanOrEqual(-1);
  });

  it("returns 0 when pulse is constant (no variance)", () => {
    const events = [
      event({ pulseScore: 50, durationSec: 30 }),
      event({ pulseScore: 50, durationSec: 60 }),
      event({ pulseScore: 50, durationSec: 90 }),
    ];

    expect(calculateCorrelation(events)).toBe(0);
  });

  it("handles zero-duration events without crashing", () => {
    const events = [
      event({ pulseScore: 10, durationSec: 0 }),
      event({ pulseScore: 50, durationSec: 0 }),
      event({ pulseScore: 90, durationSec: 0 }),
    ];

    // Should not throw, all ys become 0
    const corr = calculateCorrelation(events);
    expect(typeof corr).toBe("number");
    expect(Number.isFinite(corr)).toBe(true);
  });
});

// ── generateSummary ─────────────────────────────────────

describe("generateSummary", () => {
  it("returns empty summary for fresh accumulator", () => {
    const summary = generateSummary(createEmptyAnalytics());

    expect(summary.totalTasks).toBe(0);
    expect(summary.avgPulseAtCompletion).toBe(0);
    expect(summary.pulseCompletionCorrelation).toBe(0);
    expect(summary.zoneDistribution.FLOW_ALTO).toBe(0);
    expect(summary.zoneDistribution.FLOW_PARCIAL).toBe(0);
    expect(summary.zoneDistribution.FLOW_BASE).toBe(0);
    expect(summary.byZone).toHaveLength(3);
  });

  it("computes correct distribution across zones", () => {
    let acc = createEmptyAnalytics();

    // 3 in ALTO, 2 in PARCIAL, 5 in BASE = 10 total
    for (let i = 0; i < 3; i++)
      acc = recordCompletion(acc, event({ pulseZone: "FLOW_ALTO" }));
    for (let i = 0; i < 2; i++)
      acc = recordCompletion(acc, event({ pulseZone: "FLOW_PARCIAL" }));
    for (let i = 0; i < 5; i++)
      acc = recordCompletion(acc, event({ pulseZone: "FLOW_BASE" }));

    const summary = generateSummary(acc);

    expect(summary.totalTasks).toBe(10);
    expect(summary.zoneDistribution.FLOW_ALTO).toBe(30);
    expect(summary.zoneDistribution.FLOW_PARCIAL).toBe(20);
    expect(summary.zoneDistribution.FLOW_BASE).toBe(50);
  });

  it("computes correct avg pulse at completion", () => {
    let acc = createEmptyAnalytics();
    acc = recordCompletion(acc, event({ pulseScore: 40 }));
    acc = recordCompletion(acc, event({ pulseScore: 60 }));
    acc = recordCompletion(acc, event({ pulseScore: 80 }));

    const summary = generateSummary(acc);
    expect(summary.avgPulseAtCompletion).toBe(60); // (40+60+80)/3
  });

  it("full shift simulation with zone transitions", () => {
    let acc = createEmptyAnalytics();

    // Shift starts in BASE zone
    acc = recordPulseTick(acc, "FLOW_BASE", isoAt(0));
    acc = recordCompletion(
      acc,
      event({ pulseZone: "FLOW_BASE", pulseScore: 20, durationSec: 120 }),
    );
    acc = recordCompletion(
      acc,
      event({ pulseZone: "FLOW_BASE", pulseScore: 25, durationSec: 100 }),
    );

    // Transition to PARCIAL
    acc = recordPulseTick(acc, "FLOW_PARCIAL", isoAt(30));
    acc = recordCompletion(
      acc,
      event({ pulseZone: "FLOW_PARCIAL", pulseScore: 55, durationSec: 60 }),
    );

    // Peak: ALTO
    acc = recordPulseTick(acc, "FLOW_ALTO", isoAt(45));
    acc = recordCompletion(
      acc,
      event({ pulseZone: "FLOW_ALTO", pulseScore: 85, durationSec: 30 }),
    );
    acc = recordCompletion(
      acc,
      event({ pulseZone: "FLOW_ALTO", pulseScore: 90, durationSec: 25 }),
    );

    // End tick
    acc = recordPulseTick(acc, "FLOW_ALTO", isoAt(60));

    const summary = generateSummary(acc);

    expect(summary.totalTasks).toBe(5);
    expect(summary.byZone).toHaveLength(3);

    const alto = summary.byZone.find((z) => z.zone === "FLOW_ALTO")!;
    expect(alto.count).toBe(2);
    expect(alto.totalZoneTimeSec).toBe(900); // 15 min

    const base = summary.byZone.find((z) => z.zone === "FLOW_BASE")!;
    expect(base.count).toBe(2);
    expect(base.totalZoneTimeSec).toBe(1800); // 30 min

    const parcial = summary.byZone.find((z) => z.zone === "FLOW_PARCIAL")!;
    expect(parcial.count).toBe(1);
    expect(parcial.totalZoneTimeSec).toBe(900); // 15 min

    // ALTO zone should have higher tasks/min than BASE
    expect(alto.tasksPerMinute).toBeGreaterThan(base.tasksPerMinute);

    // Correlation should be positive (higher pulse → faster completions)
    expect(summary.pulseCompletionCorrelation).toBeGreaterThan(0);
  });
});
