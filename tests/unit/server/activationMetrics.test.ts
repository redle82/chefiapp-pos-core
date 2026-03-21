import {
  computeActivationMetrics,
  type ActivationEvent,
} from "../../../server/activationMetrics";

describe("computeActivationMetrics", () => {
  it("returns zeroed metrics when there are no events", () => {
    const result = computeActivationMetrics([]);

    expect(result).toMatchObject({
      trialStarts: 0,
      firstLogins: 0,
      firstMenus: 0,
      firstShifts: 0,
      firstOrders: 0,
      firstPayments: 0,
      activationRate: 0,
      trialConversionRate: 0,
      timeToFirstOrderHoursMedian: 0,
      timeToFirstOrderHoursAvg: 0,
      activationScores: [],
      aggregates: {
        avgActivationScore: 0,
        medianActivationScore: 0,
        fullyActivatedCount: 0,
        dropoffByStep: {
          noMenu: 0,
          noShift: 0,
          noOrder: 0,
          noPayment: 0,
        },
      },
    });
  });

  it("computes funnel, dropoff and activation score ranking", () => {
    const events: ActivationEvent[] = [
      // Restaurant A: fully activated
      {
        event: "trial_start",
        restaurant_id: "r-a",
        timestamp: "2026-01-01T00:00:00.000Z",
      },
      {
        event: "first_login",
        restaurant_id: "r-a",
        timestamp: "2026-01-01T00:10:00.000Z",
      },
      {
        event: "first_menu_created",
        restaurant_id: "r-a",
        timestamp: "2026-01-01T00:20:00.000Z",
      },
      {
        event: "first_shift_opened",
        restaurant_id: "r-a",
        timestamp: "2026-01-01T00:40:00.000Z",
      },
      {
        event: "first_order_created",
        restaurant_id: "r-a",
        timestamp: "2026-01-01T04:00:00.000Z",
      },
      {
        event: "first_order_created",
        restaurant_id: "r-a",
        timestamp: "2026-01-01T08:00:00.000Z",
      },
      {
        event: "first_payment_received",
        restaurant_id: "r-a",
        timestamp: "2026-01-01T05:00:00.000Z",
      },
      // Restaurant B: partial activation
      {
        event: "trial_started",
        restaurant_id: "r-b",
        timestamp: "2026-01-02T00:00:00.000Z",
      },
      {
        event: "first_login",
        restaurant_id: "r-b",
        timestamp: "2026-01-02T00:10:00.000Z",
      },
      {
        event: "first_menu_created",
        restaurant_id: "r-b",
        timestamp: "2026-01-02T00:20:00.000Z",
      },
      {
        event: "first_order_created",
        restaurant_id: "r-b",
        timestamp: "2026-01-02T06:00:00.000Z",
      },
    ];

    const result = computeActivationMetrics(events);

    expect(result.trialStarts).toBe(2);
    expect(result.firstLogins).toBe(2);
    expect(result.firstMenus).toBe(2);
    expect(result.firstShifts).toBe(1);
    expect(result.firstOrders).toBe(2);
    expect(result.firstPayments).toBe(1);
    expect(result.activationRate).toBe(1);
    expect(result.trialConversionRate).toBe(0.5);
    expect(result.timeToFirstOrderHoursMedian).toBe(5);
    expect(result.timeToFirstOrderHoursAvg).toBe(5);

    expect(result.activationScores).toHaveLength(2);
    expect(result.activationScores[0]).toMatchObject({
      restaurantId: "r-a",
      score: 15,
      maxScore: 15,
      scoreNormalized: 5,
    });
    expect(result.activationScores[1]).toMatchObject({
      restaurantId: "r-b",
      score: 8,
      maxScore: 15,
      scoreNormalized: 2.7,
    });

    expect(result.aggregates).toMatchObject({
      avgActivationScore: 11.5,
      medianActivationScore: 11.5,
      fullyActivatedCount: 1,
      dropoffByStep: {
        noMenu: 0,
        noShift: 1,
        noOrder: 0,
        noPayment: 1,
      },
    });
  });

  it("ignores invalid/negative time deltas and keeps non-negative dropoff counts", () => {
    const events: ActivationEvent[] = [
      {
        event: "trial_start",
        restaurant_id: "r-c",
        timestamp: "2026-02-01T12:00:00.000Z",
      },
      {
        event: "first_order_created",
        restaurant_id: "r-c",
        timestamp: "2026-02-01T15:00:00.000Z",
      },
      {
        event: "trial_start",
        restaurant_id: "r-d",
        timestamp: "2026-02-02T12:00:00.000Z",
      },
      {
        event: "first_order_created",
        restaurant_id: "r-d",
        timestamp: "2026-02-02T10:00:00.000Z",
      },
      {
        event: "first_order_created",
        restaurant_id: "r-e",
        timestamp: "not-a-date",
      },
      {
        event: "first_login",
        restaurant_id: "r-e",
        timestamp: "2026-02-02T13:00:00.000Z",
      },
    ];

    const result = computeActivationMetrics(events);

    // Only r-c has a valid non-negative trial -> first_order duration.
    expect(result.timeToFirstOrderHoursMedian).toBe(3);
    expect(result.timeToFirstOrderHoursAvg).toBe(3);

    expect(result.activationRate).toBe(1.5);
    expect(result.trialConversionRate).toBe(0);
    expect(result.aggregates.dropoffByStep).toEqual({
      noMenu: 2,
      noShift: 0,
      noOrder: 0,
      noPayment: 3,
    });
  });
});
