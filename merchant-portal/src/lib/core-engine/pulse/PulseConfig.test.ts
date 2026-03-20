import { describe, expect, it } from "vitest";
import { DEFAULT_PULSE_CONFIG, mergePulseConfig } from "./PulseConfig";

describe("DEFAULT_PULSE_CONFIG", () => {
  it("has correct threshold defaults", () => {
    expect(DEFAULT_PULSE_CONFIG.thresholds.altoMin).toBe(70);
    expect(DEFAULT_PULSE_CONFIG.thresholds.parcialMin).toBe(30);
  });

  it("has correct capacity/baseline defaults", () => {
    expect(DEFAULT_PULSE_CONFIG.defaultCapacity).toBe(15);
    expect(DEFAULT_PULSE_CONFIG.peakBaseline).toBe(12);
  });

  it("has a 24-entry hourCurve", () => {
    expect(DEFAULT_PULSE_CONFIG.hourCurve).toHaveLength(24);
  });

  it("hourCurve values are between 0 and 1", () => {
    for (const v of DEFAULT_PULSE_CONFIG.hourCurve) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it("has refreshIntervalMs = 30000", () => {
    expect(DEFAULT_PULSE_CONFIG.refreshIntervalMs).toBe(30_000);
  });
});

describe("mergePulseConfig", () => {
  it("returns DEFAULT_PULSE_CONFIG when no overrides", () => {
    const result = mergePulseConfig();
    expect(result).toEqual(DEFAULT_PULSE_CONFIG);
  });

  it("returns DEFAULT_PULSE_CONFIG when overrides is undefined", () => {
    const result = mergePulseConfig(undefined);
    expect(result).toEqual(DEFAULT_PULSE_CONFIG);
  });

  it("overrides top-level fields", () => {
    const result = mergePulseConfig({ peakBaseline: 20, defaultCapacity: 30 });
    expect(result.peakBaseline).toBe(20);
    expect(result.defaultCapacity).toBe(30);
    // Other fields remain default
    expect(result.refreshIntervalMs).toBe(30_000);
  });

  it("deep-merges thresholds (partial override)", () => {
    const result = mergePulseConfig({
      thresholds: { altoMin: 80, parcialMin: 30 },
    });
    expect(result.thresholds.altoMin).toBe(80);
    // parcialMin should be overridden too
    expect(result.thresholds.parcialMin).toBe(30);
  });

  it("deep-merges thresholds (only one threshold)", () => {
    const result = mergePulseConfig({
      thresholds: { altoMin: 60 } as any,
    });
    expect(result.thresholds.altoMin).toBe(60);
    // parcialMin inherited from default
    expect(result.thresholds.parcialMin).toBe(30);
  });

  it("overrides hourCurve entirely", () => {
    const flat = Array(24).fill(0.5);
    const result = mergePulseConfig({ hourCurve: flat });
    expect(result.hourCurve).toEqual(flat);
    expect(result.hourCurve).toHaveLength(24);
  });

  it("overrides refreshIntervalMs", () => {
    const result = mergePulseConfig({ refreshIntervalMs: 10_000 });
    expect(result.refreshIntervalMs).toBe(10_000);
  });

  it("does not mutate DEFAULT_PULSE_CONFIG", () => {
    const before = {
      ...DEFAULT_PULSE_CONFIG,
      thresholds: { ...DEFAULT_PULSE_CONFIG.thresholds },
    };
    mergePulseConfig({ peakBaseline: 999 });
    expect(DEFAULT_PULSE_CONFIG.peakBaseline).toBe(before.peakBaseline);
    expect(DEFAULT_PULSE_CONFIG.thresholds.altoMin).toBe(
      before.thresholds.altoMin,
    );
  });
});
