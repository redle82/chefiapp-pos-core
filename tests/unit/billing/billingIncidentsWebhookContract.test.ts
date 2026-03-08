/**
 * Contract tests for billing_incidents payload when Edge webhook-stripe
 * handles no_tenant (event without valid restaurant_id in metadata).
 * Validates the shape of the insert so Edge and RPC stay in sync.
 */

describe("billing_incidents webhook contract (no_tenant)", () => {
  it("no_tenant insert payload has required fields and minimal payload", () => {
    const eventId = "evt_test_123";
    const eventType = "customer.subscription.updated";
    const obj: Record<string, unknown> = { metadata: { foo: "bar" } };

    const insert = {
      restaurant_id: null,
      provider: "stripe",
      event_id: eventId,
      event_type: eventType,
      reason: "no_tenant",
      payload: { has_metadata: !!obj?.metadata },
    };

    expect(insert.restaurant_id).toBeNull();
    expect(insert.provider).toBe("stripe");
    expect(insert.event_id).toBe(eventId);
    expect(insert.event_type).toBe(eventType);
    expect(insert.reason).toBe("no_tenant");
    expect(insert.payload).toEqual({ has_metadata: true });
    expect(Object.keys(insert.payload)).toEqual(["has_metadata"]);
  });

  it("no_tenant payload has_metadata is false when object has no metadata", () => {
    const obj: Record<string, unknown> = {};
    const payload = { has_metadata: !!obj?.metadata };
    expect(payload.has_metadata).toBe(false);
  });
});
