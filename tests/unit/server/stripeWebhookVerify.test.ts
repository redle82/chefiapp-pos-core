/**
 * Unit tests for server/stripeWebhookVerify — contract for Edge webhook-stripe.
 */

import Stripe from "stripe";
import { verifyStripeWebhook } from "../../../server/stripeWebhookVerify";

describe("stripeWebhookVerify", () => {
  const secret = "whsec_test_secret";

  it("rejects when signature is missing", () => {
    const payload = JSON.stringify({ id: "evt_1", type: "payment_intent.succeeded" });
    const result = verifyStripeWebhook(payload, "", secret);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/missing|signature|secret/i);
  });

  it("rejects when secret is missing", () => {
    const payload = JSON.stringify({ id: "evt_1", type: "payment_intent.succeeded" });
    const result = verifyStripeWebhook(payload, "v1=abc", "");
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/missing|signature|secret/i);
  });

  it("rejects when signature is invalid", () => {
    const payload = JSON.stringify({ id: "evt_1", type: "payment_intent.succeeded" });
    const result = verifyStripeWebhook(payload, "v1=invalid_signature", secret);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toBeTruthy();
  });

  it("accepts valid payload and signature (generateTestHeaderString)", () => {
    const payload = JSON.stringify({
      id: "evt_test_123",
      object: "event",
      type: "payment_intent.succeeded",
      data: { object: {} },
    });
    const header = Stripe.webhooks.generateTestHeaderString({
      payload,
      secret,
    });
    const result = verifyStripeWebhook(payload, header, secret);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.event.id).toBe("evt_test_123");
      expect(result.event.type).toBe("payment_intent.succeeded");
    }
  });

  it("accepts Buffer payload (body from buffer branch)", () => {
    const payloadStr = JSON.stringify({
      id: "evt_buf",
      object: "event",
      type: "payment_intent.succeeded",
      data: { object: {} },
    });
    const payload = Buffer.from(payloadStr, "utf8");
    const header = Stripe.webhooks.generateTestHeaderString({
      payload: payloadStr,
      secret,
    });
    const result = verifyStripeWebhook(payload, header, secret);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.event.id).toBe("evt_buf");
    }
  });

  it("returns error message via String(e) when thrown value is not Error", () => {
    const payload = JSON.stringify({ id: "evt_1", type: "payment_intent.succeeded" });
    const spy = jest.spyOn(Stripe.webhooks, "constructEvent").mockImplementationOnce(() => {
      throw "non-Error thrown";
    });
    try {
      const result = verifyStripeWebhook(payload, "v1=invalid", secret);
      expect(result.ok).toBe(false);
      expect(result.ok === false && result.error).toBe("non-Error thrown");
    } finally {
      spy.mockRestore();
    }
  });
});
