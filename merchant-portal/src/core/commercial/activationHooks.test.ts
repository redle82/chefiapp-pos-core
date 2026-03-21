/**
 * Unit tests: activationHooks — emit, handler registration
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  onConversion,
  onPaymentFailed,
  onTrialExpired,
  onTrialStarted,
  setActivationHookHandler,
} from "./activationHooks";

describe("activationHooks", () => {
  let handler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    handler = vi.fn().mockResolvedValue(undefined);
    setActivationHookHandler(handler);
  });

  afterEach(() => {
    setActivationHookHandler(null);
  });

  it("onTrialStarted emits trial_started", async () => {
    await onTrialStarted("r1");
    expect(handler).toHaveBeenCalledWith({ type: "trial_started", restaurantId: "r1" });
  });

  it("onTrialExpired emits trial_expired", async () => {
    await onTrialExpired("r1");
    expect(handler).toHaveBeenCalledWith({ type: "trial_expired", restaurantId: "r1" });
  });

  it("onPaymentFailed emits payment_failed", async () => {
    await onPaymentFailed("r1");
    expect(handler).toHaveBeenCalledWith({ type: "payment_failed", restaurantId: "r1" });
  });

  it("onConversion emits conversion with plan", async () => {
    await onConversion("r1", "pro");
    expect(handler).toHaveBeenCalledWith({
      type: "conversion",
      restaurantId: "r1",
      plan: "pro",
    });
  });

  it("does not throw when no handler registered", async () => {
    setActivationHookHandler(null);
    await expect(onTrialStarted("r1")).resolves.toBeUndefined();
    expect(handler).not.toHaveBeenCalled();
  });
});
