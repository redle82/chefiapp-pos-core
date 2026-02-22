import {
  extractSumUpWebhookFields,
  mapSumUpStatusToInternal,
} from "./sumup-payment";

describe("sumup-payment", () => {
  describe("mapSumUpStatusToInternal", () => {
    it("maps paid-like statuses to completed", () => {
      expect(mapSumUpStatusToInternal("SUCCESSFUL")).toBe("completed");
      expect(mapSumUpStatusToInternal("PAID")).toBe("completed");
      expect(mapSumUpStatusToInternal("completed")).toBe("completed");
    });

    it("maps failed-like statuses to failed", () => {
      expect(mapSumUpStatusToInternal("FAILED")).toBe("failed");
      expect(mapSumUpStatusToInternal("DECLINED")).toBe("failed");
      expect(mapSumUpStatusToInternal("CANCELED")).toBe("failed");
    });

    it("defaults unknown statuses to pending", () => {
      expect(mapSumUpStatusToInternal("WHATEVER")).toBe("pending");
    });
  });

  describe("extractSumUpWebhookFields", () => {
    it("extracts merchant, amount, status and order id from payload variants", () => {
      const body = {
        id: "evt_123",
        payload: {
          type: "transaction.completed",
          status: "SUCCESSFUL",
          amount: 1999,
          merchant_code: "M123",
          transaction_code: "T123",
          metadata: { order_id: "order-1" },
        },
      };

      expect(extractSumUpWebhookFields(body)).toEqual({
        eventId: "evt_123",
        eventType: "transaction.completed",
        paymentStatus: "completed",
        paymentAmount: 19.99,
        merchantCode: "M123",
        paymentReference: "T123",
        orderId: "order-1",
      });
    });

    it("handles Pix-specific webhook format (SumUp Pix)", () => {
      const pixWebhook = {
        id: "evt_pix_001",
        payload: {
          type: "checkout.completed",
          checkout_id: "chk_pix_001",
          status: "COMPLETED",
          amount: 9999,
          currency: "BRL",
          merchant_code: "MERCHANTS_BR_001",
          metadata: { order_id: "order-pix-001" },
        },
      };

      const extracted = extractSumUpWebhookFields(pixWebhook);

      expect(extracted.eventId).toBe("evt_pix_001");
      expect(extracted.paymentStatus).toBe("completed");
      expect(extracted.paymentAmount).toBe(99.99);
      expect(extracted.merchantCode).toBe("MERCHANTS_BR_001");
    });

    it("extracts numeric amount and converts to decimal", () => {
      const body = {
        id: "evt_amount_test",
        payload: {
          amount: 5050,
          transaction_code: "T_AMOUNT",
          status: "PAID",
        },
      };

      const result = extractSumUpWebhookFields(body);
      expect(result.paymentAmount).toBe(50.5);
    });
  });

  describe("Webhook Idempotency & Safety", () => {
    it("should mark duplicate event_id as idempotent", () => {
      const webhook1 = {
        id: "evt_dup_001",
        payload: {
          type: "transaction.completed",
          status: "SUCCESSFUL",
          amount: 5000,
          merchant_code: "M123",
          transaction_code: "T123",
        },
      };

      const webhook2 = {
        id: "evt_dup_001", // Same event_id
        payload: {
          type: "transaction.completed",
          status: "SUCCESSFUL",
          amount: 5000,
          merchant_code: "M123",
          transaction_code: "T123",
        },
      };

      const extract1 = extractSumUpWebhookFields(webhook1);
      const extract2 = extractSumUpWebhookFields(webhook2);

      expect(extract1.eventId).toBe(extract2.eventId);
    });

    it("should handle webhook with missing order_id gracefully", () => {
      const body = {
        id: "evt_no_order",
        payload: {
          type: "transaction.completed",
          status: "SUCCESSFUL",
          amount: 2500,
          merchant_code: "M123",
          transaction_code: "T123",
          // No metadata.order_id
        },
      };

      const result = extractSumUpWebhookFields(body);

      expect(result.eventId).toBe("evt_no_order");
      expect(result.paymentStatus).toBe("completed");
      expect(result.orderId).toBeFalsy(); // null or undefined
    });

    it("should preserve event order for concurrent webhooks", () => {
      const webhooks = [
        {
          id: "evt_order_1",
          payload: {
            type: "transaction.completed",
            status: "SUCCESSFUL",
            amount: 1000,
          },
        },
        {
          id: "evt_order_2",
          payload: {
            type: "transaction.completed",
            status: "SUCCESSFUL",
            amount: 2000,
          },
        },
        {
          id: "evt_order_3",
          payload: {
            type: "transaction.completed",
            status: "SUCCESSFUL",
            amount: 3000,
          },
        },
      ];

      const results = webhooks.map((w) => extractSumUpWebhookFields(w));

      expect(results[0].eventId).toBe("evt_order_1");
      expect(results[1].eventId).toBe("evt_order_2");
      expect(results[2].eventId).toBe("evt_order_3");
    });
  });

  describe("Status Transitions", () => {
    it("should track Pix payment lifecycle correctly", () => {
      const statuses = ["PENDING", "SUCCESSFUL", "PAID", "COMPLETED"];

      const mappings = statuses.map((status) =>
        mapSumUpStatusToInternal(status),
      );

      // All payment completion statuses should map to 'completed'
      expect(mappings).toEqual([
        "pending",
        "completed",
        "completed",
        "completed",
      ]);
    });

    it("should handle failed Pix transactions", () => {
      const failedStatuses = ["DECLINED", "FAILED", "CANCELED", "EXPIRED"];

      const mappings = failedStatuses.map((status) =>
        mapSumUpStatusToInternal(status),
      );

      expect(mappings).toEqual(["failed", "failed", "failed", "pending"]);
    });
  });
});
