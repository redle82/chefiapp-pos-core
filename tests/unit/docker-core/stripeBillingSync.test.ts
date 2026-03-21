/**
 * Unit tests: Stripe Billing Sync — mapping, idempotency, handler
 */
import {
  extractRestaurantId,
  handleStripeBillingEvent,
  mapStripeSubscriptionStatus,
  resetProcessedEvents,
} from "../../../docker-core/server/webhooks/stripeBillingSync";

describe("stripeBillingSync", () => {
  beforeEach(() => {
    resetProcessedEvents();
  });

  describe("mapStripeSubscriptionStatus", () => {
    it("maps trialing to trial", () => {
      expect(mapStripeSubscriptionStatus("trialing")).toBe("trial");
    });
    it("maps active to active", () => {
      expect(mapStripeSubscriptionStatus("active")).toBe("active");
    });
    it("maps past_due to past_due", () => {
      expect(mapStripeSubscriptionStatus("past_due")).toBe("past_due");
    });
    it("maps unpaid to canceled", () => {
      expect(mapStripeSubscriptionStatus("unpaid")).toBe("canceled");
    });
    it("maps incomplete to incomplete", () => {
      expect(mapStripeSubscriptionStatus("incomplete")).toBe("incomplete");
    });
    it("maps canceled to canceled", () => {
      expect(mapStripeSubscriptionStatus("canceled")).toBe("canceled");
    });
    it("maps paused to paused", () => {
      expect(mapStripeSubscriptionStatus("paused")).toBe("paused");
    });
    it("unknown returns trial", () => {
      expect(mapStripeSubscriptionStatus("unknown")).toBe("trial");
    });
  });

  describe("extractRestaurantId", () => {
    it("extracts from metadata", () => {
      const payload = {
        data: {
          object: {
            metadata: { restaurant_id: "r1" },
          },
        },
      };
      expect(extractRestaurantId(payload)).toBe("r1");
    });
    it("returns null when no metadata", () => {
      expect(extractRestaurantId({ data: { object: {} } })).toBe(null);
    });
    it("returns null for invalid payload", () => {
      expect(extractRestaurantId(null)).toBe(null);
      expect(extractRestaurantId("x")).toBe(null);
    });
  });

  describe("handleStripeBillingEvent", () => {
    const persist = jest.fn().mockResolvedValue(undefined);
    const log = jest.fn();

    beforeEach(() => {
      persist.mockClear();
      log.mockClear();
    });

    it("persists active for invoice.payment_succeeded", async () => {
      const payload = {
        data: { object: { metadata: { restaurant_id: "r1" } } },
      };
      const result = await handleStripeBillingEvent(
        "evt_1",
        "invoice.payment_succeeded",
        payload,
        persist,
        log,
      );
      expect(result.ok).toBe(true);
      expect(persist).toHaveBeenCalledWith("r1", "active");
    });

    it("persists past_due for invoice.payment_failed", async () => {
      const payload = {
        data: { object: { metadata: { restaurant_id: "r1" } } },
      };
      const result = await handleStripeBillingEvent(
        "evt_2",
        "invoice.payment_failed",
        payload,
        persist,
        log,
      );
      expect(result.ok).toBe(true);
      expect(persist).toHaveBeenCalledWith("r1", "past_due");
    });

    it("persists canceled for customer.subscription.deleted", async () => {
      const payload = {
        data: { object: { metadata: { restaurant_id: "r1" } } },
      };
      const result = await handleStripeBillingEvent(
        "evt_3",
        "customer.subscription.deleted",
        payload,
        persist,
        log,
      );
      expect(result.ok).toBe(true);
      expect(persist).toHaveBeenCalledWith("r1", "canceled");
    });

    it("returns error when restaurant_id missing", async () => {
      const result = await handleStripeBillingEvent(
        "evt_4",
        "invoice.payment_succeeded",
        {},
        persist,
        log,
      );
      expect(result.ok).toBe(false);
      expect(result.message).toContain("restaurant_id");
      expect(persist).not.toHaveBeenCalled();
    });
  });
});
