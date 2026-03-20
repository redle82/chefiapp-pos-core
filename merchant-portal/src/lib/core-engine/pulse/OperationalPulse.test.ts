import { describe, expect, it } from "vitest";
import {
  calculateComponents,
  calculatePulse,
  deriveZone,
  hasZoneChanged,
} from "./OperationalPulse";
import { DEFAULT_PULSE_CONFIG, mergePulseConfig } from "./PulseConfig";
import type { PulseInput, PulseSnapshot } from "./PulseState";

// ─── Helpers ────────────────────────────────────────────

function makeInput(overrides: Partial<PulseInput> = {}): PulseInput {
  return {
    activeOrders: 5,
    ordersLast30min: 6,
    declaredCapacity: 15,
    hourOfDay: 12, // peak hour, curve = 1.0
    ...overrides,
  };
}

const cfg = DEFAULT_PULSE_CONFIG;

// ─── calculateComponents ────────────────────────────────

describe("calculateComponents", () => {
  it("computes orderPressure correctly", () => {
    const c = calculateComponents(
      makeInput({ activeOrders: 10, declaredCapacity: 20 }),
      cfg,
    );
    // (10/20) * 50 = 25
    expect(c.orderPressure).toBeCloseTo(25, 2);
  });

  it("computes flowRate correctly", () => {
    const c = calculateComponents(makeInput({ ordersLast30min: 6 }), cfg);
    // (6/12) * 30 = 15
    expect(c.flowRate).toBeCloseTo(15, 2);
  });

  it("computes timeBias correctly at peak hour", () => {
    const c = calculateComponents(makeInput({ hourOfDay: 12 }), cfg);
    // curve[12] = 1.0, timeBias = 1.0 * 20 = 20
    expect(c.timeBias).toBeCloseTo(20, 2);
  });

  it("computes timeBias at low hour", () => {
    const c = calculateComponents(makeInput({ hourOfDay: 0 }), cfg);
    // curve[0] = 0.0, timeBias = 0
    expect(c.timeBias).toBe(0);
  });

  it("avoids div/0 on zero declaredCapacity (falls back to 1)", () => {
    const c = calculateComponents(
      makeInput({ activeOrders: 1, declaredCapacity: 0 }),
      cfg,
    );
    // Math.max(0, 1) = 1, (1/1) * 50 = 50
    expect(c.orderPressure).toBe(50);
  });

  it("avoids div/0 on zero peakBaseline (falls back to 1)", () => {
    const zeroPeakCfg = mergePulseConfig({ peakBaseline: 0 });
    const c = calculateComponents(
      makeInput({ ordersLast30min: 1 }),
      zeroPeakCfg,
    );
    // (1/1) * 30 = 30
    expect(c.flowRate).toBe(30);
  });

  it("clamps orderPressure to max 50", () => {
    const c = calculateComponents(
      makeInput({ activeOrders: 100, declaredCapacity: 1 }),
      cfg,
    );
    expect(c.orderPressure).toBe(50);
  });

  it("clamps flowRate to max 30", () => {
    const c = calculateComponents(makeInput({ ordersLast30min: 999 }), cfg);
    expect(c.flowRate).toBe(30);
  });

  it("clamps timeBias to max 20", () => {
    // Even with curve > 1 in a hypothetical config
    const bigCurve = mergePulseConfig({
      hourCurve: Array(24).fill(5),
    });
    const c = calculateComponents(makeInput({ hourOfDay: 12 }), bigCurve);
    expect(c.timeBias).toBe(20);
  });

  it("uses 0 for out-of-range hourCurve index (undefined fallback)", () => {
    // hourCurve has 24 entries (0..23); if hourOfDay > 23, clamp to 23
    const c = calculateComponents(makeInput({ hourOfDay: 50 }), cfg);
    // clamped to hour 23, curve[23] = 0.15, timeBias = 0.15 * 20 = 3
    expect(c.timeBias).toBeCloseTo(3, 2);
  });

  it("clamps negative hourOfDay to 0", () => {
    const c = calculateComponents(makeInput({ hourOfDay: -5 }), cfg);
    // clamped to 0, curve[0] = 0.0
    expect(c.timeBias).toBe(0);
  });

  it("handles fractional hourOfDay (floors to int)", () => {
    const c = calculateComponents(makeInput({ hourOfDay: 12.7 }), cfg);
    // floor(12.7) = 12, curve[12] = 1.0
    expect(c.timeBias).toBe(20);
  });

  it("all components are non-negative", () => {
    const c = calculateComponents(
      makeInput({
        activeOrders: 0,
        ordersLast30min: 0,
        declaredCapacity: 10,
        hourOfDay: 0,
      }),
      cfg,
    );
    expect(c.orderPressure).toBeGreaterThanOrEqual(0);
    expect(c.flowRate).toBeGreaterThanOrEqual(0);
    expect(c.timeBias).toBeGreaterThanOrEqual(0);
  });
});

// ─── deriveZone ─────────────────────────────────────────

describe("deriveZone", () => {
  it("returns FLOW_ALTO when score >= altoMin", () => {
    expect(deriveZone(70, cfg)).toBe("FLOW_ALTO");
    expect(deriveZone(100, cfg)).toBe("FLOW_ALTO");
  });

  it("returns FLOW_PARCIAL when score >= parcialMin and < altoMin", () => {
    expect(deriveZone(30, cfg)).toBe("FLOW_PARCIAL");
    expect(deriveZone(69.9, cfg)).toBe("FLOW_PARCIAL");
  });

  it("returns FLOW_BASE when score < parcialMin", () => {
    expect(deriveZone(0, cfg)).toBe("FLOW_BASE");
    expect(deriveZone(29.9, cfg)).toBe("FLOW_BASE");
  });

  it("boundary: exactly at thresholds", () => {
    expect(deriveZone(70, cfg)).toBe("FLOW_ALTO");
    expect(deriveZone(30, cfg)).toBe("FLOW_PARCIAL");
  });

  it("works with custom thresholds", () => {
    const custom = mergePulseConfig({
      thresholds: { altoMin: 50, parcialMin: 20 },
    });
    expect(deriveZone(50, custom)).toBe("FLOW_ALTO");
    expect(deriveZone(20, custom)).toBe("FLOW_PARCIAL");
    expect(deriveZone(19, custom)).toBe("FLOW_BASE");
  });
});

// ─── calculatePulse ─────────────────────────────────────

describe("calculatePulse", () => {
  it("returns a valid PulseSnapshot", () => {
    const snap = calculatePulse(makeInput(), cfg);
    expect(snap).toHaveProperty("score");
    expect(snap).toHaveProperty("zone");
    expect(snap).toHaveProperty("timestamp");
    expect(snap).toHaveProperty("components");
    expect(typeof snap.score).toBe("number");
    expect(["FLOW_ALTO", "FLOW_PARCIAL", "FLOW_BASE"]).toContain(snap.zone);
  });

  it("score is clamped between 0 and 100", () => {
    const low = calculatePulse(
      makeInput({ activeOrders: 0, ordersLast30min: 0, hourOfDay: 0 }),
      cfg,
    );
    expect(low.score).toBeGreaterThanOrEqual(0);

    const high = calculatePulse(
      makeInput({ activeOrders: 999, ordersLast30min: 999, hourOfDay: 12 }),
      cfg,
    );
    expect(high.score).toBeLessThanOrEqual(100);
  });

  it("all-zero input → FLOW_BASE", () => {
    const snap = calculatePulse(
      makeInput({
        activeOrders: 0,
        ordersLast30min: 0,
        declaredCapacity: 15,
        hourOfDay: 0,
      }),
      cfg,
    );
    expect(snap.score).toBe(0);
    expect(snap.zone).toBe("FLOW_BASE");
  });

  it("maxed-out input → FLOW_ALTO with score 100", () => {
    const snap = calculatePulse(
      makeInput({
        activeOrders: 100,
        ordersLast30min: 100,
        declaredCapacity: 1,
        hourOfDay: 12,
      }),
      cfg,
    );
    expect(snap.score).toBe(100);
    expect(snap.zone).toBe("FLOW_ALTO");
  });

  it("score matches sum of components (rounded, clamped)", () => {
    const input = makeInput({
      activeOrders: 5,
      ordersLast30min: 4,
      hourOfDay: 19,
    });
    const snap = calculatePulse(input, cfg);
    const { orderPressure, flowRate, timeBias } = snap.components;
    const raw = orderPressure + flowRate + timeBias;
    const expected = Math.min(100, Math.max(0, Math.round(raw * 100) / 100));
    expect(snap.score).toBeCloseTo(expected, 2);
  });

  it("timestamp is a valid ISO string", () => {
    const snap = calculatePulse(makeInput(), cfg);
    expect(() => new Date(snap.timestamp)).not.toThrow();
    expect(new Date(snap.timestamp).toISOString()).toBe(snap.timestamp);
  });
});

// ─── hasZoneChanged ─────────────────────────────────────

describe("hasZoneChanged", () => {
  it("returns true when previous is null", () => {
    const current: PulseSnapshot = {
      score: 50,
      zone: "FLOW_PARCIAL",
      timestamp: new Date().toISOString(),
      components: { orderPressure: 25, flowRate: 15, timeBias: 10 },
    };
    expect(hasZoneChanged(null, current)).toBe(true);
  });

  it("returns false when zones are the same", () => {
    const prev: PulseSnapshot = {
      score: 75,
      zone: "FLOW_ALTO",
      timestamp: new Date().toISOString(),
      components: { orderPressure: 40, flowRate: 25, timeBias: 10 },
    };
    const curr: PulseSnapshot = {
      score: 80,
      zone: "FLOW_ALTO",
      timestamp: new Date().toISOString(),
      components: { orderPressure: 45, flowRate: 25, timeBias: 10 },
    };
    expect(hasZoneChanged(prev, curr)).toBe(false);
  });

  it("returns true when zones differ", () => {
    const prev: PulseSnapshot = {
      score: 75,
      zone: "FLOW_ALTO",
      timestamp: new Date().toISOString(),
      components: { orderPressure: 40, flowRate: 25, timeBias: 10 },
    };
    const curr: PulseSnapshot = {
      score: 25,
      zone: "FLOW_BASE",
      timestamp: new Date().toISOString(),
      components: { orderPressure: 10, flowRate: 10, timeBias: 5 },
    };
    expect(hasZoneChanged(prev, curr)).toBe(true);
  });
});
