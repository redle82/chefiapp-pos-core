import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

interface StripeEventObject {
  id?: string;
  payment_intent?: string | null;
}

interface StripeEvent {
  type: string;
  data: {
    object: StripeEventObject;
  };
}

interface StripeLibLike {
  webhooks: {
    constructEvent: (
      body: string,
      signature: string,
      secret: string,
    ) => StripeEvent;
  };
}

export interface StripeWebhookInput {
  body: string;
  signature: string;
  webhookSecret: string;
  client?: SupabaseClient;
  stripeLib?: StripeLibLike;
}

export interface StripeWebhookResponse {
  status: number;
  json: Record<string, unknown>;
}

function getSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "stripeWebhook requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)",
    );
  }

  return createClient(url, key);
}

function getStripeLib(): StripeLibLike {
  const Stripe = (
    require("stripe") as { default?: { webhooks: StripeLibLike["webhooks"] } }
  ).default;

  if (!Stripe || !Stripe.webhooks) {
    throw new Error("Stripe SDK webhooks not available");
  }

  return Stripe as StripeLibLike;
}

export async function handleStripeInvoiceWebhook(
  input: StripeWebhookInput,
): Promise<StripeWebhookResponse> {
  const supabase = input.client ?? getSupabaseClient();
  const stripeLib = input.stripeLib ?? getStripeLib();

  let event: StripeEvent;

  try {
    event = stripeLib.webhooks.constructEvent(
      input.body,
      input.signature,
      input.webhookSecret,
    );
  } catch (error) {
    return {
      status: 400,
      json: {
        error: "invalid_signature",
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }

  const eventType = event.type;
  const object = event.data?.object ?? {};
  const stripeInvoiceId = object.id;
  const stripePaymentIntentId = object.payment_intent ?? null;

  if (!stripeInvoiceId || typeof stripeInvoiceId !== "string") {
    console.log(
      JSON.stringify({
        event: "org.invoice.stripe.webhook.ignored",
        stripe_event_type: eventType,
        reason: "missing_invoice_id",
      }),
    );

    return {
      status: 200,
      json: { ok: true, ignored: true },
    };
  }

  if (eventType === "invoice.paid" || eventType === "invoice.payment_failed") {
    const paymentStatus = eventType === "invoice.paid" ? "paid" : "failed";

    const updatePayload = {
      payment_status: paymentStatus,
      stripe_payment_intent_id:
        typeof stripePaymentIntentId === "string"
          ? stripePaymentIntentId
          : null,
      paid_at: eventType === "invoice.paid" ? new Date().toISOString() : null,
    };

    const { error } = await supabase
      .from("gm_org_invoices")
      .update(updatePayload)
      .eq("stripe_invoice_id", stripeInvoiceId);

    if (error) {
      console.error(
        JSON.stringify({
          event: "org.invoice.stripe.webhook.update_failed",
          stripe_event_type: eventType,
          stripe_invoice_id: stripeInvoiceId,
          message: error.message,
        }),
      );

      return {
        status: 200,
        json: { ok: true, update_error: true },
      };
    }

    console.log(
      JSON.stringify({
        event: "org.invoice.stripe.webhook.updated",
        stripe_event_type: eventType,
        stripe_invoice_id: stripeInvoiceId,
        stripe_payment_intent_id:
          typeof stripePaymentIntentId === "string"
            ? stripePaymentIntentId
            : null,
        payment_status: paymentStatus,
      }),
    );

    return {
      status: 200,
      json: { ok: true },
    };
  }

  return {
    status: 200,
    json: { ok: true, ignored: true },
  };
}
