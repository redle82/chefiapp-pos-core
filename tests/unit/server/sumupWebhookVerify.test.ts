/**
 * Unit tests for server/sumupWebhookVerify — same logic as Edge webhook-sumup.
 * Ensures signature verification and payload derivation are covered without Deno.
 */

import {
  hmacSha256Hex,
  verifySumUpSignature,
  getSumUpEventId,
  getSumUpEventType,
} from "../../../server/sumupWebhookVerify";

describe("sumupWebhookVerify", () => {
  describe("hmacSha256Hex", () => {
    it("returns deterministic hex string for secret and body", () => {
      const a = hmacSha256Hex("secret", "body");
      const b = hmacSha256Hex("secret", "body");
      expect(a).toBe(b);
      expect(a).toMatch(/^[a-f0-9]{64}$/);
    });

    it("returns different value for different body", () => {
      const a = hmacSha256Hex("s", "a");
      const b = hmacSha256Hex("s", "b");
      expect(a).not.toBe(b);
    });

    it("returns different value for different secret", () => {
      const a = hmacSha256Hex("s1", "body");
      const b = hmacSha256Hex("s2", "body");
      expect(a).not.toBe(b);
    });
  });

  describe("verifySumUpSignature", () => {
    it("returns true when signature matches sha256= + HMAC(secret, body)", () => {
      const secret = "webhook-secret";
      const body = '{"id":"pay1","status":"PAID"}';
      const sigHex = hmacSha256Hex(secret, body);
      const signature = `sha256=${sigHex}`;
      expect(verifySumUpSignature(secret, body, signature)).toBe(true);
    });

    it("returns false when signature is wrong", () => {
      const secret = "webhook-secret";
      const body = "{}";
      expect(verifySumUpSignature(secret, body, "sha256=wrong")).toBe(false);
    });

    it("returns false when signature is missing", () => {
      expect(verifySumUpSignature("s", "body", null)).toBe(false);
      expect(verifySumUpSignature("s", "body", undefined)).toBe(false);
      expect(verifySumUpSignature("s", "body", "")).toBe(false);
    });

    it("returns false when secret is empty", () => {
      const body = "{}";
      const sig = "sha256=" + hmacSha256Hex("x", body);
      expect(verifySumUpSignature("", body, sig)).toBe(false);
    });
  });

  describe("getSumUpEventId", () => {
    it("uses paymentId when present", () => {
      expect(getSumUpEventId({ paymentId: "pay-1" })).toBe("pay-1");
    });

    it("uses event_id when paymentId absent", () => {
      expect(getSumUpEventId({ event_id: "evt-1" })).toBe("evt-1");
    });

    it("uses id when paymentId and event_id absent", () => {
      expect(getSumUpEventId({ id: "id-1" })).toBe("id-1");
    });

    it("generates synthetic id when none present", () => {
      const id = getSumUpEventId({});
      expect(id).toMatch(/^sumup_\d+_[a-z0-9]+$/);
    });
  });

  describe("getSumUpEventType", () => {
    it("derives payment.{status} when status present", () => {
      expect(getSumUpEventType({ status: "PAID" })).toBe("payment.paid");
      expect(getSumUpEventType({ status: "PENDING" })).toBe("payment.pending");
    });

    it("uses event_type when status absent", () => {
      expect(getSumUpEventType({ event_type: "payment.completed" })).toBe("payment.completed");
    });

    it("returns payment.notification when neither present", () => {
      expect(getSumUpEventType({})).toBe("payment.notification");
    });
  });
});
