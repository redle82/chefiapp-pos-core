import type { SupabaseClient } from "@supabase/supabase-js";
import { handleStripeInvoiceWebhook } from "../../../docker-core/server/webhooks/stripeWebhook";

describe("stripeWebhook enterprise invoice", () => {
  function createClient() {
    const updateEq = jest.fn().mockResolvedValue({ error: null });
    const update = jest.fn().mockReturnValue({
      eq: updateEq,
    });

    const from = jest.fn((table: string) => {
      if (table === "gm_org_invoices") {
        return {
          update,
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    return {
      client: { from } as unknown as SupabaseClient,
      update,
    };
  }

  function createStripeLib(event: unknown) {
    return {
      webhooks: {
        constructEvent: jest.fn().mockReturnValue(event),
      },
    };
  }

  it("webhook paid updates status", async () => {
    const { client, update } = createClient();

    const event = {
      type: "invoice.paid",
      data: { object: { id: "in_123", payment_intent: "pi_123" } },
    };

    const result = await handleStripeInvoiceWebhook({
      body: "{}",
      signature: "sig",
      webhookSecret: "whsec_test",
      client,
      stripeLib: createStripeLib(event),
    });

    expect(result.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_status: "paid",
        stripe_payment_intent_id: "pi_123",
      }),
    );
  });

  it("webhook failed updates status", async () => {
    const { client, update } = createClient();

    const event = {
      type: "invoice.payment_failed",
      data: { object: { id: "in_123", payment_intent: "pi_123" } },
    };

    const result = await handleStripeInvoiceWebhook({
      body: "{}",
      signature: "sig",
      webhookSecret: "whsec_test",
      client,
      stripeLib: createStripeLib(event),
    });

    expect(result.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_status: "failed",
        stripe_payment_intent_id: "pi_123",
      }),
    );
  });

  it("invalid signature rejected", async () => {
    const { client } = createClient();

    const result = await handleStripeInvoiceWebhook({
      body: "{}",
      signature: "bad",
      webhookSecret: "whsec_test",
      client,
      stripeLib: {
        webhooks: {
          constructEvent: jest.fn().mockImplementation(() => {
            throw new Error("invalid signature");
          }),
        },
      },
    });

    expect(result.status).toBe(400);
    expect(result.json).toEqual(
      expect.objectContaining({ error: "invalid_signature" }),
    );
  });
});
