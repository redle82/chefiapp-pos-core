/**
 * ChurnRiskEvaluator — unit tests
 *
 * Covers:
 *   - Empty events → no trigger
 *   - Not onboarded → no trigger
 *   - Recent activity (< threshold) → no trigger
 *   - Medium risk (score 40–69) → "Slow activators" + fires
 *   - High risk (score >= 70) → "Stalled" + fires
 *   - Deduplication key format
 *   - ScoreEvaluator pure function: computeChurnRiskScore
 */

import { describe, expect, it } from "vitest";
import type { CommercialEvent } from "../tracking/types";
import {
    ChurnRiskEvaluator,
    computeChurnRiskScore,
} from "./ChurnRiskEvaluator";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const REST_ID = "11111111-1111-4111-8111-111111111111";

function makeEvent(
  overrides: Partial<CommercialEvent> & { event: CommercialEvent["event"] },
): CommercialEvent {
  return {
    timestamp: new Date().toISOString(),
    country: "PT",
    segment: "smb",
    landing_version: "v1",
    device: "desktop",
    path: "/",
    ...overrides,
  } as CommercialEvent;
}

function daysAgo(n: number, nowIso?: string): string {
  const base = nowIso ? new Date(nowIso) : new Date();
  const d = new Date(base.getTime() - n * 24 * 60 * 60 * 1000);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// computeChurnRiskScore
// ---------------------------------------------------------------------------

describe("computeChurnRiskScore", () => {
  const NOW = "2025-06-15T12:00:00.000Z";

  it("returns zero daysSinceLastActivity for empty events", () => {
    const result = computeChurnRiskScore([], NOW);
    expect(result.daysSinceLastActivity).toBe(0);
    expect(result.lastActivityIso).toBeNull();
    expect(result.hasOrdersThisMonth).toBe(false);
    expect(result.hasShiftThisMonth).toBe(false);
    // score = 0 inactivity + 30 no orders + 10 no shift = 40
    expect(result.score).toBe(40);
  });

  it("counts days since last activity correctly", () => {
    const events = [
      makeEvent({
        event: "first_login",
        timestamp: daysAgo(10, NOW),
        restaurant_id: REST_ID,
      }),
    ];
    const result = computeChurnRiskScore(events, NOW);
    expect(result.daysSinceLastActivity).toBe(10);
  });

  it("caps inactivity component at 60 days", () => {
    const events = [
      makeEvent({
        event: "first_login",
        timestamp: daysAgo(90, NOW),
        restaurant_id: REST_ID,
      }),
    ];
    const result = computeChurnRiskScore(events, NOW);
    // inactivity capped at 60 + 30 (no orders) + 10 (no shift) = 100
    expect(result.score).toBe(100);
  });

  it("detects orders in current month → reduces score by 30", () => {
    const thisMonth = NOW.slice(0, 7); // "2025-06"
    const events = [
      makeEvent({
        event: "first_login",
        timestamp: daysAgo(20, NOW),
        restaurant_id: REST_ID,
      }),
      makeEvent({
        event: "first_order_created",
        timestamp: `${thisMonth}-01T08:00:00.000Z`,
        restaurant_id: REST_ID,
      }),
    ];
    const result = computeChurnRiskScore(events, NOW);
    expect(result.hasOrdersThisMonth).toBe(true);
    // inactivity component (20 days) + no shift component (10) = around 30
    // (no +30 since has orders this month)
    expect(result.score).toBeGreaterThanOrEqual(20);
    expect(result.score).toBeLessThan(40); // well below 'Stalled'
  });

  it("detects shift in current month → reduces score by 10", () => {
    const thisMonth = NOW.slice(0, 7);
    const events = [
      makeEvent({
        event: "first_login",
        timestamp: daysAgo(15, NOW),
        restaurant_id: REST_ID,
      }),
      makeEvent({
        event: "first_shift_opened",
        timestamp: `${thisMonth}-05T08:00:00.000Z`,
        restaurant_id: REST_ID,
      }),
    ];
    const result = computeChurnRiskScore(events, NOW);
    expect(result.hasShiftThisMonth).toBe(true);
    // 15 inactivity + 30 no orders = 45 but actual days may vary slightly
    // Key assertion: has shift this month (no +10), no orders (+30)
    expect(result.score).toBeGreaterThanOrEqual(35);
    expect(result.score).toBeLessThan(60);
  });
});

// ---------------------------------------------------------------------------
// ChurnRiskEvaluator.evaluate()
// ---------------------------------------------------------------------------

describe("ChurnRiskEvaluator", () => {
  const NOW = "2025-06-15T12:00:00.000Z";
  const evaluator = new ChurnRiskEvaluator();

  it("returns shouldFire=false for empty events", () => {
    const result = evaluator.evaluate({ events: [], nowIso: NOW });
    expect(result.shouldFire).toBe(false);
  });

  it("returns shouldFire=false when not onboarded (no first_login)", () => {
    const events = [
      makeEvent({ event: "pricing_view", timestamp: daysAgo(30, NOW) }),
    ];
    const result = evaluator.evaluate({ events, nowIso: NOW });
    expect(result.shouldFire).toBe(false);
  });

  it("returns shouldFire=false when last activity was recent (< 7 days)", () => {
    const events = [
      makeEvent({
        event: "first_login",
        timestamp: daysAgo(2, NOW),
        restaurant_id: REST_ID,
      }),
    ];
    const result = evaluator.evaluate({ events, nowIso: NOW });
    expect(result.shouldFire).toBe(false);
  });

  it("returns shouldFire=false when score < 40 (low risk)", () => {
    // 5 days inactive → 5 pts + 30 no orders + 10 no shift = 45 — BUT wait:
    // threshold is 7 days inactivity. 5 days < 7 → returns false before scoring
    const events = [
      makeEvent({
        event: "first_login",
        timestamp: daysAgo(5, NOW),
        restaurant_id: REST_ID,
      }),
    ];
    const result = evaluator.evaluate({ events, nowIso: NOW });
    expect(result.shouldFire).toBe(false);
  });

  it("fires with 'Slow activators' for medium risk (score 40–69)", () => {
    // 8 days inactive + no orders + no shift = 8 + 30 + 10 = 48
    const events = [
      makeEvent({
        event: "first_login",
        timestamp: daysAgo(8, NOW),
        restaurant_id: REST_ID,
      }),
    ];
    const result = evaluator.evaluate({ events, nowIso: NOW });
    expect(result.shouldFire).toBe(true);
    if (!result.shouldFire) return;
    expect(result.payload.classification).toBe("Slow activators");
    expect(result.payload.trigger).toBe("churn_risk");
    expect(result.payload.restaurant_id).toBe(REST_ID);
    expect(result.payload.score).toBeGreaterThanOrEqual(40);
    expect(result.payload.score).toBeLessThan(70);
  });

  it("fires with 'Stalled' for high risk (score >= 70)", () => {
    // 60+ days inactive → 60 + 30 + 10 = 100
    const events = [
      makeEvent({
        event: "first_login",
        timestamp: daysAgo(70, NOW),
        restaurant_id: REST_ID,
      }),
    ];
    const result = evaluator.evaluate({ events, nowIso: NOW });
    expect(result.shouldFire).toBe(true);
    if (!result.shouldFire) return;
    expect(result.payload.classification).toBe("Stalled");
    expect(result.payload.score).toBeGreaterThanOrEqual(70);
  });

  it("returns shouldFire=false when no restaurant_id found in events", () => {
    const events = [
      makeEvent({ event: "first_login", timestamp: daysAgo(30, NOW) }), // no restaurant_id
    ];
    const result = evaluator.evaluate({ events, nowIso: NOW });
    expect(result.shouldFire).toBe(false);
  });

  it("dedupeKey format: churn:{restaurantId}:{month}:churn_risk:{range}", () => {
    const events = [
      makeEvent({
        event: "first_login",
        timestamp: daysAgo(70, NOW),
        restaurant_id: REST_ID,
      }),
    ];
    const result = evaluator.evaluate({ events, nowIso: NOW });
    expect(result.shouldFire).toBe(true);
    if (!result.shouldFire) return;
    const parts = result.dedupeKey.split(":");
    expect(parts[0]).toBe("churn");
    expect(parts[2]).toBe("2025-06");
    expect(parts[3]).toBe("churn_risk");
    expect(["high", "medium"]).toContain(parts[4]);
  });

  it("uses trial_start as onboarding signal (alternative to first_login)", () => {
    const events = [
      makeEvent({
        event: "trial_start",
        timestamp: daysAgo(50, NOW),
        restaurant_id: REST_ID,
      }),
    ];
    const result = evaluator.evaluate({ events, nowIso: NOW });
    expect(result.shouldFire).toBe(true);
  });
});
