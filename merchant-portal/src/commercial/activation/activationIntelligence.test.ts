/**
 * Activation Intelligence — Unit tests
 */

import { describe, expect, it } from "vitest";
import {
  ACTIVATION_MILESTONES,
  computeActivationIntelligence,
  computeActivationScorePerRestaurant,
  MAX_ACTIVATION_SCORE,
} from "./activationIntelligence";
import type { CommercialEvent } from "../tracking/types";

const base = {
  timestamp: "2026-02-26T10:00:00.000Z",
  country: "gb" as const,
  segment: "small" as const,
  landing_version: "country-v1",
  device: "desktop" as const,
  path: "/",
};

describe("activationIntelligence", () => {
  it("MAX_ACTIVATION_SCORE is 15", () => {
    expect(MAX_ACTIVATION_SCORE).toBe(15);
  });

  it("computes activation score per restaurant", () => {
    const r1 = "r1-111";
    const r2 = "r2-222";
    const events: CommercialEvent[] = [
      { ...base, event: "first_login", restaurant_id: r1 },
      { ...base, event: "first_menu_created", restaurant_id: r1 },
      { ...base, event: "first_order_created", restaurant_id: r1, order_id: "o1" },
      { ...base, event: "first_login", restaurant_id: r2 },
    ];

    const scores = computeActivationScorePerRestaurant(events);

    const s1 = scores.find((s) => s.restaurantId === r1)!;
    expect(s1).toBeDefined();
    expect(s1.score).toBe(1 + 2 + 5); // login + menu + order = 8
    expect(s1.maxScore).toBe(15);
    expect(s1.milestones.first_login).toBe(true);
    expect(s1.milestones.first_menu_created).toBe(true);
    expect(s1.milestones.first_order_created).toBe(true);
    expect(s1.milestones.first_shift_opened).toBeUndefined();

    const s2 = scores.find((s) => s.restaurantId === r2)!;
    expect(s2.score).toBe(1);
    expect(s2.milestones.first_login).toBe(true);
  });

  it("fully activated restaurant has score 15", () => {
    const r = "full-1";
    const events: CommercialEvent[] = [
      { ...base, event: "first_login", restaurant_id: r },
      { ...base, event: "first_menu_created", restaurant_id: r },
      { ...base, event: "first_shift_opened", restaurant_id: r, shift_id: "s1" },
      {
        ...base,
        event: "first_payment_received",
        restaurant_id: r,
        order_id: "o1",
        amount_cents: 1000,
      },
      { ...base, event: "first_order_created", restaurant_id: r, order_id: "o1" },
    ];

    const scores = computeActivationScorePerRestaurant(events);
    const s = scores.find((x) => x.restaurantId === r)!;
    expect(s.score).toBe(15);
    expect(s.scoreNormalized).toBe(5);
  });

  it("computeActivationIntelligence returns aggregates", () => {
    const r1 = "r1";
    const events: CommercialEvent[] = [
      { ...base, event: "trial_start", restaurant_id: r1 },
      { ...base, event: "first_login", restaurant_id: r1 },
      { ...base, event: "first_order_created", restaurant_id: r1, order_id: "o1" },
    ];

    const result = computeActivationIntelligence(events);

    expect(result.funnel.trialStarts).toBe(1);
    expect(result.funnel.firstOrders).toBe(1);
    expect(result.aggregates.activationRate).toBe(1);
    expect(result.aggregates.fullyActivatedCount).toBe(0); // r1 has score 6, not 15
    expect(result.activationScores).toHaveLength(1);
    expect(result.activationScores[0].score).toBe(6); // 1 + 5
  });

  it("dropoffByStep computes correctly", () => {
    const events: CommercialEvent[] = [
      { ...base, event: "trial_start", restaurant_id: "r1" },
      { ...base, event: "trial_start", restaurant_id: "r2" },
      { ...base, event: "first_menu_created", restaurant_id: "r1" },
      { ...base, event: "first_shift_opened", restaurant_id: "r1", shift_id: "s1" },
      { ...base, event: "first_order_created", restaurant_id: "r1", order_id: "o1" },
    ];

    const result = computeActivationIntelligence(events);

    expect(result.aggregates.dropoffByStep.noMenu).toBe(1); // r2 no menu
    expect(result.aggregates.dropoffByStep.noShift).toBe(0);
    expect(result.aggregates.dropoffByStep.noOrder).toBe(0);
    expect(result.aggregates.dropoffByStep.noPayment).toBe(1); // r1 has order, no payment
  });
});
