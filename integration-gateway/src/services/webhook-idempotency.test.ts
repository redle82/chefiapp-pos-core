import {
  getWebhookProcessRow,
  isDuplicateWebhookProcessResult,
} from "./webhook-idempotency";

describe("webhook-idempotency", () => {
  describe("getWebhookProcessRow", () => {
    it("returns first row for valid RPC array", () => {
      const row = getWebhookProcessRow([
        { success: true, event_id: "evt_1", message: "ok" },
      ]);
      expect(row).toEqual({ success: true, event_id: "evt_1", message: "ok" });
    });

    it("returns null for invalid payloads", () => {
      expect(getWebhookProcessRow(null)).toBeNull();
      expect(getWebhookProcessRow(undefined)).toBeNull();
      expect(getWebhookProcessRow({})).toBeNull();
      expect(getWebhookProcessRow([])).toBeNull();
    });
  });

  describe("isDuplicateWebhookProcessResult", () => {
    it("detects duplicate/idempotent message", () => {
      expect(
        isDuplicateWebhookProcessResult({
          success: true,
          event_id: "evt_1",
          message: "Duplicate event ignored (idempotent)",
        }),
      ).toBe(true);
    });

    it("detects already processed message", () => {
      expect(
        isDuplicateWebhookProcessResult({
          success: true,
          event_id: "evt_1",
          message: "Event already processed",
        }),
      ).toBe(true);
    });

    it("returns false for normal success message", () => {
      expect(
        isDuplicateWebhookProcessResult({
          success: true,
          event_id: "evt_1",
          message: "Webhook event recorded and queued for processing",
        }),
      ).toBe(false);
    });
  });
});
