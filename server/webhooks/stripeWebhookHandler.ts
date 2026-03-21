/**
 * server/webhooks/stripeWebhookHandler.ts
 *
 * Stripe billing webhook handler for the integration-gateway (local dev)
 * and as reusable logic for Edge Functions.
 *
 * Handles:
 *   - customer.subscription.created / updated / deleted
 *   - invoice.paid / invoice.payment_failed
 *
 * Flow:
 *   1. Verify signature via verifyStripeWebhook()
 *   2. Extract restaurant_id from metadata
 *   3. Forward to sync_stripe_subscription_from_event RPC (Core)
 *   4. Log to gm_billing_events (via the RPC)
 *
 * Ref: supabase/functions/webhook-stripe/index.ts (Edge equivalent)
 */

import type Stripe from "stripe";
import {
    STRIPE_STATUS_MAP as CENTRAL_STRIPE_STATUS_MAP,
    mapStripeStatus as mapStripeStatusCentral
} from "../../billing-core/billingStateMachine";
import { logger } from "../logger";
import { verifyStripeWebhook } from "../stripeWebhookVerify";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WebhookHandlerConfig {
  /** Stripe webhook signing secret (whsec_...) */
  webhookSecret: string;
  /** Core URL (Supabase REST endpoint) */
  coreUrl: string;
  /** Core service key (service_role or anon) */
  coreServiceKey: string;
}

export interface WebhookResult {
  status: number;
  json: Record<string, unknown>;
}

/**
 * Stripe status → internal billing_status mapping.
 * Re-exports from the central billing state machine.
 * @see billing-core/billingStateMachine.ts
 */
export const STRIPE_STATUS_MAP: Record<string, string> = {
  ...CENTRAL_STRIPE_STATUS_MAP,
};

/** Stripe events that trigger billing sync */
export const BILLING_EVENT_TYPES = [
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
] as const;

export type BillingEventType = (typeof BILLING_EVENT_TYPES)[number];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Map a Stripe subscription status to our internal billing_status.
 * Delegates to the central billing state machine.
 */
export function mapStripeStatus(stripeStatus: string): string {
  return mapStripeStatusCentral(stripeStatus);
}

/**
 * Extract restaurant_id from Stripe event metadata.
 * Checks data.object.metadata.restaurant_id and supabase_restaurant_id.
 */
export function extractRestaurantId(event: Stripe.Event): string | null {
  const obj = (event.data as unknown as Record<string, unknown>)?.object as
    | Record<string, unknown>
    | undefined;
  const metadata = (obj as Record<string, unknown>)?.metadata as
    | Record<string, unknown>
    | undefined;

  const rawId =
    (metadata?.restaurant_id as string | undefined) ??
    (metadata?.supabase_restaurant_id as string | undefined) ??
    null;

  if (!rawId) return null;

  // Validate UUID format
  const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return UUID_REGEX.test(rawId) ? rawId : null;
}

/**
 * Check if a Stripe event type is a billing-relevant event.
 */
export function isBillingEvent(eventType: string): boolean {
  return (BILLING_EVENT_TYPES as readonly string[]).includes(eventType);
}

// ---------------------------------------------------------------------------
// Core handler
// ---------------------------------------------------------------------------

/**
 * Handle an incoming Stripe webhook request.
 *
 * @param rawBody   - Raw request body (Buffer or string, NOT parsed JSON)
 * @param signature - Stripe-Signature header value
 * @param config    - Handler configuration (secrets + Core connection)
 * @returns { status, json } response for the HTTP layer
 */
export async function handleStripeWebhook(
  rawBody: Buffer | string,
  signature: string | undefined,
  config: WebhookHandlerConfig,
): Promise<WebhookResult> {
  const child = logger.child({ handler: "stripe-webhook" });

  // 1. Signature verification
  if (!signature) {
    child.warn("Missing Stripe-Signature header");
    return {
      status: 401,
      json: {
        error: "missing_signature",
        message: "Missing Stripe-Signature header",
      },
    };
  }

  const verifyResult = verifyStripeWebhook(
    rawBody,
    signature,
    config.webhookSecret,
  );
  if (verifyResult.ok === false) {
    child.error("Stripe signature verification failed", {
      error: verifyResult.error,
    });
    return {
      status: 400,
      json: { error: "signature_invalid", message: verifyResult.error },
    };
  }

  const event = verifyResult.event;
  child.info("Stripe webhook received", {
    event_id: event.id,
    event_type: event.type,
    created: event.created,
  });

  // 2. Forward to process_webhook_event RPC (general event log)
  try {
    const processResult = await callCoreRpc(config, "process_webhook_event", {
      p_provider: "stripe",
      p_event_type: event.type,
      p_event_id: event.id,
      p_payload: event as unknown as Record<string, unknown>,
      p_signature: signature,
    });

    if (processResult.error) {
      child.error("process_webhook_event failed", {
        error: processResult.error,
        event_id: event.id,
      });
      // Non-fatal: continue to billing sync even if general log fails
    }
  } catch (err) {
    child.error("process_webhook_event RPC call failed", {
      error: err instanceof Error ? err.message : String(err),
      event_id: event.id,
    });
  }

  // 3. Billing sync for relevant events
  if (isBillingEvent(event.type)) {
    const restaurantId = extractRestaurantId(event);

    if (!restaurantId) {
      child.warn("Billing event skipped: no valid restaurant_id in metadata", {
        event_id: event.id,
        event_type: event.type,
      });

      // Persist incident for audit (same as Edge Function)
      try {
        await callCoreInsert(config, "billing_incidents", {
          restaurant_id: null,
          provider: "stripe",
          event_id: event.id,
          event_type: event.type,
          reason: "no_tenant",
          payload: {
            has_metadata: !!(event.data as unknown as Record<string, unknown>)
              ?.object,
          },
        });
      } catch {
        // Ignore insert failures (dedup or missing table)
      }

      return {
        status: 200,
        json: {
          received: true,
          event_id: event.id,
          billing_sync: "skipped_no_tenant",
        },
      };
    }

    // Call sync_stripe_subscription_from_event RPC
    const eventCreatedAt = new Date(event.created * 1000).toISOString();
    try {
      const syncResult = await callCoreRpc(
        config,
        "sync_stripe_subscription_from_event",
        {
          p_event_type: event.type,
          p_payload: event as unknown as Record<string, unknown>,
          p_event_created_at: eventCreatedAt,
        },
      );

      if (syncResult.error) {
        child.warn("sync_stripe_subscription_from_event failed (non-fatal)", {
          error: syncResult.error,
          event_id: event.id,
          restaurant_id: restaurantId,
        });
      } else {
        child.info("Billing sync applied", {
          event_id: event.id,
          event_type: event.type,
          restaurant_id: restaurantId,
          result: syncResult.data,
        });
      }
    } catch (err) {
      child.error("sync RPC call failed", {
        error: err instanceof Error ? err.message : String(err),
        event_id: event.id,
        restaurant_id: restaurantId,
      });
    }
  }

  return {
    status: 200,
    json: {
      received: true,
      event_id: event.id,
      event_type: event.type,
      timestamp: new Date().toISOString(),
    },
  };
}

// ---------------------------------------------------------------------------
// Supabase Core RPC helper
// ---------------------------------------------------------------------------

interface RpcResult {
  data: unknown;
  error: string | null;
}

/**
 * Call a Supabase RPC via REST endpoint.
 */
async function callCoreRpc(
  config: WebhookHandlerConfig,
  functionName: string,
  params: Record<string, unknown>,
): Promise<RpcResult> {
  const url = `${config.coreUrl}/rest/v1/rpc/${functionName}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: config.coreServiceKey,
      Authorization: `Bearer ${config.coreServiceKey}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const text = await response.text();
    return { data: null, error: `${response.status}: ${text}` };
  }

  const data = await response.json();
  return { data, error: null };
}

/**
 * Insert a row via Supabase REST endpoint (for billing_incidents).
 */
async function callCoreInsert(
  config: WebhookHandlerConfig,
  table: string,
  row: Record<string, unknown>,
): Promise<void> {
  const url = `${config.coreUrl}/rest/v1/${table}`;

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: config.coreServiceKey,
      Authorization: `Bearer ${config.coreServiceKey}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(row),
  });
}
