import crypto from "crypto";
import {
  getRawBody,
  verifyStripeSignature,
  verifySumUpSignature,
} from "./webhook-signature";

describe("webhook-signature", () => {
  describe("verifyStripeSignature", () => {
    const secret = "whsec_test_secret";
    const nowSeconds = Math.floor(Date.now() / 1000);

    const makeHeader = (payload: string, timestamp = nowSeconds) => {
      const signedPayload = `${timestamp}.${payload}`;
      const signature = crypto
        .createHmac("sha256", secret)
        .update(signedPayload, "utf8")
        .digest("hex");
      return `t=${timestamp},v1=${signature}`;
    };

    it("accepts valid signature and recent timestamp", () => {
      const payload = JSON.stringify({
        id: "evt_1",
        type: "payment_intent.succeeded",
      });
      const result = verifyStripeSignature(
        payload,
        makeHeader(payload),
        secret,
      );
      expect(result.ok).toBe(true);
    });

    it("rejects missing signature header", () => {
      const payload = "{}";
      const result = verifyStripeSignature(payload, "", secret);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatch(/signature/i);
    });

    it("rejects missing webhook secret", () => {
      const payload = "{}";
      const result = verifyStripeSignature(payload, "t=1,v1=abc", "");
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatch(/secret/i);
    });

    it("rejects stale timestamp", () => {
      const payload = "{}";
      const oldTs = nowSeconds - 601;
      const result = verifyStripeSignature(
        payload,
        makeHeader(payload, oldTs),
        secret,
      );
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatch(/timestamp|expired|stale/i);
    });

    it("rejects invalid signature", () => {
      const payload = "{}";
      const result = verifyStripeSignature(
        payload,
        `t=${nowSeconds},v1=deadbeef`,
        secret,
      );
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatch(/invalid/i);
    });
  });

  describe("verifySumUpSignature", () => {
    const secret = "sumup_secret";

    it("accepts valid sha256=... signature", () => {
      const payload = JSON.stringify({ id: "pay_1", status: "PAID" });
      const signature =
        "sha256=" +
        crypto
          .createHmac("sha256", secret)
          .update(payload, "utf8")
          .digest("hex");
      expect(verifySumUpSignature(payload, signature, secret)).toBe(true);
    });

    it("accepts legacy plain-hex signature", () => {
      const payload = JSON.stringify({ id: "pay_1", status: "PAID" });
      const signature = crypto
        .createHmac("sha256", secret)
        .update(payload, "utf8")
        .digest("hex");
      expect(verifySumUpSignature(payload, signature, secret)).toBe(true);
    });

    it("rejects invalid signature", () => {
      expect(verifySumUpSignature("{}", "sha256=invalid", secret)).toBe(false);
    });

    it("rejects missing secret", () => {
      expect(verifySumUpSignature("{}", "sha256=abc", "")).toBe(false);
    });
  });

  describe("getRawBody", () => {
    it("uses rawBody from request when available", () => {
      const req = {
        rawBody: '{"id":"evt_1"}',
        body: { id: "evt_1" },
      } as unknown as Parameters<typeof getRawBody>[0];
      expect(getRawBody(req)).toBe('{"id":"evt_1"}');
    });

    it("falls back to JSON.stringify when rawBody missing", () => {
      const req = { body: { id: "evt_1" } } as unknown as Parameters<
        typeof getRawBody
      >[0];
      expect(getRawBody(req)).toBe('{"id":"evt_1"}');
    });
  });
});
