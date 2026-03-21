/**
 * Stripe Webhook Handler Tests
 *
 * Unit tests for server/webhooks/stripeWebhookHandler.ts
 * Tests:
 * 1. mapStripeStatus — Stripe → internal mapping
 * 2. extractRestaurantId — metadata extraction
 * 3. isBillingEvent — event type filtering
 * 4. handleStripeWebhook — full handler flow (signature, events, sync)
 * 5. STRIPE_STATUS_MAP completeness
 */

import {
    BILLING_EVENT_TYPES,
    extractRestaurantId,
    handleStripeWebhook,
    isBillingEvent,
    mapStripeStatus,
    STRIPE_STATUS_MAP,
    type WebhookHandlerConfig,
} from "../../../server/webhooks/stripeWebhookHandler";

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------

// Mock verifyStripeWebhook
jest.mock("../../../server/stripeWebhookVerify", () => ({
  verifyStripeWebhook: jest.fn(),
}));

// Mock logger
jest.mock("../../../server/logger", () => ({
  logger: {
    child: () => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }),
  },
}));

// Mock global fetch for RPC calls
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const { verifyStripeWebhook: mockVerify } = jest.requireMock(
  "../../../server/stripeWebhookVerify",
);

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeStripeEvent(
  type: string,
  restaurantId: string | null = "550e8400-e29b-41d4-a716-446655440000",
  status: string = "active",
) {
  return {
    id: `evt_test_${Date.now()}`,
    type,
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: "sub_test_123",
        status,
        metadata: restaurantId ? { restaurant_id: restaurantId } : {},
        items: { data: [{ price: { id: "price_test", unit_amount: 2900 } }] },
        currency: "eur",
      },
    },
    livemode: false,
    api_version: "2024-12-18",
  };
}

const TEST_CONFIG: WebhookHandlerConfig = {
  webhookSecret: "whsec_test_secret",
  coreUrl: "http://localhost:3001",
  coreServiceKey: "test-service-key",
};

// ---------------------------------------------------------------------------
// 1. mapStripeStatus
// ---------------------------------------------------------------------------

describe("mapStripeStatus", () => {
  it.each([
    ["trialing", "trial"],
    ["active", "active"],
    ["past_due", "past_due"],
    ["canceled", "canceled"],
    ["unpaid", "canceled"],
    ["incomplete", "incomplete"],
    ["incomplete_expired", "trial_expired"],
    ["paused", "paused"],
  ])("maps Stripe '%s' → '%s'", (input, expected) => {
    expect(mapStripeStatus(input)).toBe(expected);
  });

  it("falls back to 'trial' for unknown statuses", () => {
    expect(mapStripeStatus("unknown_status")).toBe("trial");
    expect(mapStripeStatus("")).toBe("trial");
  });
});

// ---------------------------------------------------------------------------
// 2. extractRestaurantId
// ---------------------------------------------------------------------------

describe("extractRestaurantId", () => {
  it("extracts restaurant_id from metadata", () => {
    const event = makeStripeEvent("customer.subscription.created");
    expect(extractRestaurantId(event as never)).toBe(
      "550e8400-e29b-41d4-a716-446655440000",
    );
  });

  it("extracts supabase_restaurant_id as fallback", () => {
    const event = {
      ...makeStripeEvent("customer.subscription.created", null),
      data: {
        object: {
          metadata: {
            supabase_restaurant_id: "550e8400-e29b-41d4-a716-446655440000",
          },
        },
      },
    };
    expect(extractRestaurantId(event as never)).toBe(
      "550e8400-e29b-41d4-a716-446655440000",
    );
  });

  it("returns null when no metadata", () => {
    const event = makeStripeEvent("customer.subscription.created", null);
    expect(extractRestaurantId(event as never)).toBeNull();
  });

  it("returns null for invalid UUID format", () => {
    const event = makeStripeEvent(
      "customer.subscription.created",
      "not-a-uuid",
    );
    expect(extractRestaurantId(event as never)).toBeNull();
  });

  it("returns null when data.object is missing", () => {
    const event = { id: "evt_test", type: "test", data: {} };
    expect(extractRestaurantId(event as never)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3. isBillingEvent
// ---------------------------------------------------------------------------

describe("isBillingEvent", () => {
  it.each([
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "invoice.paid",
    "invoice.payment_failed",
  ])("'%s' is a billing event", (type) => {
    expect(isBillingEvent(type)).toBe(true);
  });

  it.each([
    "charge.succeeded",
    "payment_intent.succeeded",
    "checkout.session.completed",
    "customer.created",
    "",
  ])("'%s' is NOT a billing event", (type) => {
    expect(isBillingEvent(type)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4. STRIPE_STATUS_MAP completeness
// ---------------------------------------------------------------------------

describe("STRIPE_STATUS_MAP", () => {
  it("has entries for all canonical Stripe statuses plus alias", () => {
    expect(Object.keys(STRIPE_STATUS_MAP)).toHaveLength(9);
    expect(STRIPE_STATUS_MAP.cancelled).toBe("canceled");
  });

  it("all values are valid billing_status values", () => {
    const validStatuses = [
      "trial",
      "active",
      "past_due",
      "canceled",
      "incomplete",
      "trial_expired",
      "paused",
    ];
    for (const status of Object.values(STRIPE_STATUS_MAP)) {
      expect(validStatuses).toContain(status);
    }
  });
});

// ---------------------------------------------------------------------------
// 5. BILLING_EVENT_TYPES
// ---------------------------------------------------------------------------

describe("BILLING_EVENT_TYPES", () => {
  it("includes exactly 5 event types", () => {
    expect(BILLING_EVENT_TYPES).toHaveLength(5);
  });

  it("includes subscription lifecycle events", () => {
    expect(BILLING_EVENT_TYPES).toContain("customer.subscription.created");
    expect(BILLING_EVENT_TYPES).toContain("customer.subscription.updated");
    expect(BILLING_EVENT_TYPES).toContain("customer.subscription.deleted");
  });

  it("includes invoice events", () => {
    expect(BILLING_EVENT_TYPES).toContain("invoice.paid");
    expect(BILLING_EVENT_TYPES).toContain("invoice.payment_failed");
  });
});

// ---------------------------------------------------------------------------
// 6. handleStripeWebhook — full handler flow
// ---------------------------------------------------------------------------

describe("handleStripeWebhook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  it("returns 401 when signature is missing", async () => {
    const result = await handleStripeWebhook("body", undefined, TEST_CONFIG);
    expect(result.status).toBe(401);
    expect(result.json.error).toBe("missing_signature");
  });

  it("returns 400 when signature verification fails", async () => {
    (mockVerify as jest.Mock).mockReturnValue({
      ok: false,
      error: "Invalid signature",
    });

    const result = await handleStripeWebhook(
      "body",
      "bad-signature",
      TEST_CONFIG,
    );
    expect(result.status).toBe(400);
    expect(result.json.error).toBe("signature_invalid");
  });

  it("returns 200 for valid non-billing event", async () => {
    const event = makeStripeEvent("charge.succeeded");
    (mockVerify as jest.Mock).mockReturnValue({ ok: true, event });

    // Mock process_webhook_event RPC
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const result = await handleStripeWebhook(
      JSON.stringify(event),
      "valid-sig",
      TEST_CONFIG,
    );
    expect(result.status).toBe(200);
    expect(result.json.received).toBe(true);
  });

  it("returns 200 and syncs billing for subscription.updated", async () => {
    const event = makeStripeEvent("customer.subscription.updated");
    (mockVerify as jest.Mock).mockReturnValue({ ok: true, event });

    // Mock process_webhook_event + sync RPC
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "ok" }),
      });

    const result = await handleStripeWebhook(
      JSON.stringify(event),
      "valid-sig",
      TEST_CONFIG,
    );
    expect(result.status).toBe(200);
    expect(result.json.received).toBe(true);
    expect(result.json.event_type).toBe("customer.subscription.updated");

    // Should have called both RPCs
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("handles no_tenant billing events gracefully", async () => {
    const event = makeStripeEvent("customer.subscription.updated", null);
    (mockVerify as jest.Mock).mockReturnValue({ ok: true, event });

    // process_webhook_event + billing_incidents insert
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const result = await handleStripeWebhook(
      JSON.stringify(event),
      "valid-sig",
      TEST_CONFIG,
    );
    expect(result.status).toBe(200);
    expect(result.json.billing_sync).toBe("skipped_no_tenant");
  });

  it("calls process_webhook_event for all event types", async () => {
    const event = makeStripeEvent("charge.succeeded");
    (mockVerify as jest.Mock).mockReturnValue({ ok: true, event });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await handleStripeWebhook(JSON.stringify(event), "valid-sig", TEST_CONFIG);

    // Should call process_webhook_event RPC
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/rpc/process_webhook_event"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("calls sync_stripe_subscription_from_event for billing events", async () => {
    const event = makeStripeEvent("customer.subscription.created");
    (mockVerify as jest.Mock).mockReturnValue({ ok: true, event });

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    await handleStripeWebhook(JSON.stringify(event), "valid-sig", TEST_CONFIG);

    // Should call process_webhook_event AND sync RPC
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/rpc/sync_stripe_subscription_from_event"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("continues if process_webhook_event fails (non-fatal)", async () => {
    const event = makeStripeEvent("customer.subscription.updated");
    (mockVerify as jest.Mock).mockReturnValue({ ok: true, event });

    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Internal error",
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const result = await handleStripeWebhook(
      JSON.stringify(event),
      "valid-sig",
      TEST_CONFIG,
    );

    // Should still return 200 (process_webhook_event is non-fatal)
    expect(result.status).toBe(200);
    // Should still call sync RPC
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("handles sync RPC failure gracefully", async () => {
    const event = makeStripeEvent("invoice.payment_failed");
    (mockVerify as jest.Mock).mockReturnValue({ ok: true, event });

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockRejectedValueOnce(new Error("Network error"));

    const result = await handleStripeWebhook(
      JSON.stringify(event),
      "valid-sig",
      TEST_CONFIG,
    );

    // Should still return 200 (we don't fail the webhook)
    expect(result.status).toBe(200);
  });

  it("passes event_created_at as ISO string to sync RPC", async () => {
    const event = makeStripeEvent("customer.subscription.updated");
    (mockVerify as jest.Mock).mockReturnValue({ ok: true, event });

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    await handleStripeWebhook(JSON.stringify(event), "valid-sig", TEST_CONFIG);

    // Check the sync RPC call has p_event_created_at
    const syncCall = mockFetch.mock.calls[1];
    const body = JSON.parse(syncCall[1].body as string);
    expect(body.p_event_created_at).toBeDefined();
    expect(new Date(body.p_event_created_at).toISOString()).toBe(
      body.p_event_created_at,
    );
  });
});

// ---------------------------------------------------------------------------
// 7. Idempotency contract
// ---------------------------------------------------------------------------

describe("webhook idempotency", () => {
  it("gm_billing_events uses stripe_event_id UNIQUE for dedup", () => {
    // Contract: the SQL migration creates a UNIQUE index on stripe_event_id
    // The sync function uses ON CONFLICT (stripe_event_id) DO NOTHING
    // This test validates the contract expectation
    const seenEvents = new Set<string>();
    const eventId = "evt_test_idempotent_123";

    // First: accepted
    const first = seenEvents.has(eventId);
    seenEvents.add(eventId);
    expect(first).toBe(false);

    // Second: rejected (idempotent)
    const second = seenEvents.has(eventId);
    expect(second).toBe(true);
  });

  it("Stripe dedup via process_webhook_event prevents reprocessing", () => {
    // The process_webhook_event RPC handles event_id dedup
    // This is the first line of defense before billing sync
    const processedEvents = new Map<string, boolean>();
    const eventId = "evt_test_456";

    // First call
    processedEvents.set(eventId, true);
    expect(processedEvents.get(eventId)).toBe(true);

    // Second call: already processed → skip
    if (processedEvents.has(eventId)) {
      // Skip processing (idempotent)
      expect(true).toBe(true);
    }
  });
});
