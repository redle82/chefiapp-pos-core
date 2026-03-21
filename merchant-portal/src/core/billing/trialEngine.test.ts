/**
 * Trial Activation Engine — unit tests
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  expireTrialIfNeeded,
  getRemainingTrialDays,
  isTrialExpired,
  markTrialConverted,
  startTrial,
} from "./trialEngine";
import * as coreBillingApi from "./coreBillingApi";
import * as activationHooks from "../commercial/activationHooks";
import { DbWriteGate } from "../governance/DbWriteGate";

vi.mock("./coreBillingApi");
vi.mock("../governance/DbWriteGate");
vi.mock("../commercial/activationHooks");

describe("trialEngine", () => {
  const restaurantId = "r1";

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    vi.mocked(
      coreBillingApi.ensureStripeCustomerForRestaurant,
    ).mockResolvedValue({
      ok: true,
      customerId: "cus_mock_test",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("startTrial", () => {
    it("starts trial with trial_ends_at = created_at + 14 days", async () => {
      const created = new Date("2026-01-01T12:00:00Z");
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ created_at: created.toISOString() }]),
      });
      vi.mocked(DbWriteGate.update).mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await startTrial(restaurantId);

      expect(result.ok).toBe(true);
      expect(DbWriteGate.update).toHaveBeenCalledWith(
        "OnboardingQuick",
        "gm_restaurants",
        expect.objectContaining({
          billing_status: "trial",
          trial_ends_at: "2026-01-15T12:00:00.000Z",
        }),
        { id: restaurantId },
        { tenantId: restaurantId },
      );
      expect(
        coreBillingApi.ensureStripeCustomerForRestaurant,
      ).toHaveBeenCalledWith(restaurantId);
      expect(activationHooks.onTrialStarted).toHaveBeenCalledWith(restaurantId);
    });

    it("returns error when restaurant not found", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const result = await startTrial(restaurantId);

      expect(result.ok).toBe(false);
      expect(result.error).toContain("not found");
      expect(DbWriteGate.update).not.toHaveBeenCalled();
    });

    it("returns error when DbWriteGate fails", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ created_at: new Date().toISOString() }]),
      });
      vi.mocked(DbWriteGate.update).mockResolvedValue({
        data: null,
        error: { message: "DB error" },
      });

      const result = await startTrial(restaurantId);

      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("isTrialExpired", () => {
    it("returns true when trial_expired", async () => {
      vi.mocked(coreBillingApi.getBillingStatusWithTrial).mockResolvedValue({
        status: "trial",
        trial_ends_at: "2020-01-01T00:00:00Z",
        trial_expired: true,
      });

      expect(await isTrialExpired(restaurantId)).toBe(true);
    });

    it("returns false when trial not expired", async () => {
      const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      vi.mocked(coreBillingApi.getBillingStatusWithTrial).mockResolvedValue({
        status: "trial",
        trial_ends_at: future.toISOString(),
        trial_expired: false,
      });

      expect(await isTrialExpired(restaurantId)).toBe(false);
    });

    it("returns false when null", async () => {
      vi.mocked(coreBillingApi.getBillingStatusWithTrial).mockResolvedValue(
        null,
      );
      expect(await isTrialExpired(restaurantId)).toBe(false);
    });
  });

  describe("getRemainingTrialDays", () => {
    it("returns remaining days when in trial", async () => {
      const in5Days = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      vi.mocked(coreBillingApi.getBillingStatusWithTrial).mockResolvedValue({
        status: "trial",
        trial_ends_at: in5Days.toISOString(),
        trial_expired: false,
      });

      const days = await getRemainingTrialDays(restaurantId);
      expect(days).toBeGreaterThanOrEqual(4);
      expect(days).toBeLessThanOrEqual(6);
    });

    it("returns 0 when trial expired", async () => {
      vi.mocked(coreBillingApi.getBillingStatusWithTrial).mockResolvedValue({
        status: "trial",
        trial_ends_at: "2020-01-01T00:00:00Z",
        trial_expired: true,
      });

      expect(await getRemainingTrialDays(restaurantId)).toBe(0);
    });

    it("returns 0 when null", async () => {
      vi.mocked(coreBillingApi.getBillingStatusWithTrial).mockResolvedValue(
        null,
      );
      expect(await getRemainingTrialDays(restaurantId)).toBe(0);
    });
  });

  describe("markTrialConverted", () => {
    it("sets billing_status to active", async () => {
      vi.mocked(DbWriteGate.update).mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await markTrialConverted(restaurantId);

      expect(result.ok).toBe(true);
      expect(DbWriteGate.update).toHaveBeenCalledWith(
        "OnboardingQuick",
        "gm_restaurants",
        expect.objectContaining({ billing_status: "active" }),
        { id: restaurantId },
        { tenantId: restaurantId },
      );
    });

    it("returns error when update fails", async () => {
      vi.mocked(DbWriteGate.update).mockResolvedValue({
        data: null,
        error: { message: "Conflict" },
      });

      const result = await markTrialConverted(restaurantId);
      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("expireTrialIfNeeded", () => {
    it("updates to past_due when trial expired", async () => {
      vi.mocked(coreBillingApi.getBillingStatusWithTrial).mockResolvedValue({
        status: "trial",
        trial_ends_at: "2020-01-01T00:00:00Z",
        trial_expired: true,
      });
      vi.mocked(DbWriteGate.update).mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await expireTrialIfNeeded(restaurantId);

      expect(result.expired).toBe(true);
      expect(DbWriteGate.update).toHaveBeenCalledWith(
        "OnboardingQuick",
        "gm_restaurants",
        expect.objectContaining({ billing_status: "past_due" }),
        { id: restaurantId },
        { tenantId: restaurantId },
      );
    });

    it("returns expired=false when trial not expired", async () => {
      vi.mocked(coreBillingApi.getBillingStatusWithTrial).mockResolvedValue({
        status: "trial",
        trial_ends_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        trial_expired: false,
      });

      const result = await expireTrialIfNeeded(restaurantId);
      expect(result.expired).toBe(false);
      expect(DbWriteGate.update).not.toHaveBeenCalled();
    });

    it("returns expired=false when already active", async () => {
      vi.mocked(coreBillingApi.getBillingStatusWithTrial).mockResolvedValue({
        status: "active",
        trial_ends_at: null,
        trial_expired: false,
      });

      const result = await expireTrialIfNeeded(restaurantId);
      expect(result.expired).toBe(false);
      expect(DbWriteGate.update).not.toHaveBeenCalled();
    });
  });

  describe("edge case: manual billing upgrade during trial", () => {
    it("markTrialConverted succeeds when called after manual Stripe upgrade", async () => {
      vi.mocked(DbWriteGate.update).mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await markTrialConverted(restaurantId);
      expect(result.ok).toBe(true);
      expect(DbWriteGate.update).toHaveBeenCalledWith(
        "OnboardingQuick",
        "gm_restaurants",
        expect.objectContaining({ billing_status: "active" }),
        { id: restaurantId },
        { tenantId: restaurantId },
      );
    });
  });
});
