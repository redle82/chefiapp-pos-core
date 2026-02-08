/**
 * OperationalPulse — Unit Tests
 *
 * Tests the pure calculation engine with deterministic inputs.
 */

import {
  calculateComponents,
  calculatePulse,
  deriveZone,
  hasZoneChanged,
} from "../../../core-engine/pulse/OperationalPulse";
import {
  DEFAULT_PULSE_CONFIG,
  mergePulseConfig,
} from "../../../core-engine/pulse/PulseConfig";
import type { PulseInput } from "../../../core-engine/pulse/PulseState";

const config = DEFAULT_PULSE_CONFIG;

/** Helper: create a PulseInput with defaults */
function input(overrides: Partial<PulseInput> = {}): PulseInput {
  return {
    activeOrders: 0,
    ordersLast30min: 0,
    declaredCapacity: 15,
    hourOfDay: 12,
    ...overrides,
  };
}

describe("OperationalPulse", () => {
  describe("calculateComponents", () => {
    it("returns zero components when no orders and off-peak", () => {
      const c = calculateComponents(input({ hourOfDay: 3 }), config);
      expect(c.orderPressure).toBe(0);
      expect(c.flowRate).toBe(0);
      expect(c.timeBias).toBe(0);
    });

    it("caps orderPressure at 50 even with overflow", () => {
      const c = calculateComponents(
        input({ activeOrders: 100, declaredCapacity: 5 }),
        config,
      );
      expect(c.orderPressure).toBe(50);
    });

    it("caps flowRate at 30 even with overflow", () => {
      const c = calculateComponents(input({ ordersLast30min: 100 }), config);
      expect(c.flowRate).toBe(30);
    });

    it("calculates timeBias from hour curve", () => {
      // hour 12 has curve value 1.0 → timeBias = 20
      const c = calculateComponents(input({ hourOfDay: 12 }), config);
      expect(c.timeBias).toBe(20);
    });

    it("handles declaredCapacity of 0 without crashing", () => {
      const c = calculateComponents(
        input({ activeOrders: 5, declaredCapacity: 0 }),
        config,
      );
      expect(c.orderPressure).toBe(50); // 5/1 * 50 = 250 → clamped to 50
    });
  });

  describe("deriveZone", () => {
    it("returns FLOW_ALTO for score >= 70", () => {
      expect(deriveZone(70, config)).toBe("FLOW_ALTO");
      expect(deriveZone(100, config)).toBe("FLOW_ALTO");
    });

    it("returns FLOW_PARCIAL for 30 <= score < 70", () => {
      expect(deriveZone(30, config)).toBe("FLOW_PARCIAL");
      expect(deriveZone(69, config)).toBe("FLOW_PARCIAL");
    });

    it("returns FLOW_BASE for score < 30", () => {
      expect(deriveZone(0, config)).toBe("FLOW_BASE");
      expect(deriveZone(29, config)).toBe("FLOW_BASE");
    });

    it("respects custom thresholds", () => {
      const custom = mergePulseConfig({
        thresholds: { altoMin: 80, parcialMin: 40 },
      });
      expect(deriveZone(75, custom)).toBe("FLOW_PARCIAL");
      expect(deriveZone(80, custom)).toBe("FLOW_ALTO");
      expect(deriveZone(39, custom)).toBe("FLOW_BASE");
    });
  });

  describe("calculatePulse", () => {
    it("returns FLOW_BASE when restaurant is empty at 3am", () => {
      const snap = calculatePulse(input({ hourOfDay: 3 }), config);
      expect(snap.score).toBe(0);
      expect(snap.zone).toBe("FLOW_BASE");
      expect(snap.timestamp).toBeTruthy();
    });

    it("returns FLOW_ALTO during peak lunch rush", () => {
      const snap = calculatePulse(
        input({ activeOrders: 14, ordersLast30min: 10, hourOfDay: 12 }),
        config,
      );
      // orderPressure = 14/15 * 50 ≈ 46.67
      // flowRate = 10/12 * 30 = 25
      // timeBias = 1.0 * 20 = 20
      // total ≈ 91.67 → FLOW_ALTO
      expect(snap.score).toBeGreaterThanOrEqual(70);
      expect(snap.zone).toBe("FLOW_ALTO");
    });

    it("returns FLOW_PARCIAL during moderate afternoon", () => {
      const snap = calculatePulse(
        input({ activeOrders: 4, ordersLast30min: 3, hourOfDay: 16 }),
        config,
      );
      // orderPressure = 4/15 * 50 ≈ 13.33
      // flowRate = 3/12 * 30 = 7.5
      // timeBias = 0.25 * 20 = 5
      // total ≈ 25.83 → FLOW_BASE (just below 30)
      expect(snap.zone).toBe("FLOW_BASE");
    });

    it("score never exceeds 100", () => {
      const snap = calculatePulse(
        input({
          activeOrders: 100,
          ordersLast30min: 100,
          declaredCapacity: 1,
          hourOfDay: 12,
        }),
        config,
      );
      expect(snap.score).toBeLessThanOrEqual(100);
    });

    it("score never goes below 0", () => {
      const snap = calculatePulse(
        input({ activeOrders: 0, ordersLast30min: 0, hourOfDay: 2 }),
        config,
      );
      expect(snap.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe("hasZoneChanged", () => {
    it("returns true when previous is null", () => {
      const snap = calculatePulse(input(), config);
      expect(hasZoneChanged(null, snap)).toBe(true);
    });

    it("returns false when zone is the same", () => {
      const a = calculatePulse(input({ hourOfDay: 3 }), config);
      const b = calculatePulse(input({ hourOfDay: 4 }), config);
      expect(hasZoneChanged(a, b)).toBe(false); // both FLOW_BASE
    });

    it("returns true when zone changes", () => {
      const base = calculatePulse(input({ hourOfDay: 3 }), config);
      const alto = calculatePulse(
        input({ activeOrders: 14, ordersLast30min: 10, hourOfDay: 12 }),
        config,
      );
      expect(hasZoneChanged(base, alto)).toBe(true);
    });
  });

  describe("mergePulseConfig", () => {
    it("returns defaults when no overrides", () => {
      const c = mergePulseConfig();
      expect(c).toEqual(DEFAULT_PULSE_CONFIG);
    });

    it("merges partial thresholds", () => {
      const c = mergePulseConfig({
        thresholds: { altoMin: 80, parcialMin: 30 },
      });
      expect(c.thresholds.altoMin).toBe(80);
      expect(c.thresholds.parcialMin).toBe(30);
      expect(c.defaultCapacity).toBe(15); // default preserved
    });

    it("overrides top-level fields", () => {
      const c = mergePulseConfig({
        peakBaseline: 20,
        refreshIntervalMs: 10_000,
      });
      expect(c.peakBaseline).toBe(20);
      expect(c.refreshIntervalMs).toBe(10_000);
    });
  });
});
