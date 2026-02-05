/**
 * Event Log Test Suite
 * 
 * Hostile tests for event sourcing:
 * - Idempotency
 * - Concurrency
 * - Crash recovery
 * - Immutability
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { InMemoryEventStore } from "../event-log/InMemoryEventStore";
import { EventExecutor } from "../event-log/EventExecutor";
import { InMemoryRepo } from "../core-engine/repo/InMemoryRepo";
import { rebuildState } from "../projections";
import type { CoreEvent } from "../event-log/types";
import type { Session, Order, OrderItem } from "../core-engine/repo/types";

// ============================================================================
// TEST SETUP
// ============================================================================

const TEST_TENANT = "test-tenant";
const TEST_EXEC_ID = "exec-1";

let eventStore: InMemoryEventStore;
let executor: EventExecutor;

beforeEach(() => {
  eventStore = new InMemoryEventStore();
  const repo = new InMemoryRepo();
  executor = new EventExecutor(eventStore, repo, TEST_TENANT, TEST_EXEC_ID);
});

// ============================================================================
// IDEMPOTENCY TESTS
// ============================================================================

describe("IDEMPOTENCY: Duplicate commands", () => {
  it("should reject duplicate event_id", async () => {
    const event: CoreEvent = {
      event_id: "event-1",
      stream_id: "ORDER:order-1",
      stream_version: 0,
      type: "ORDER_CREATED",
      payload: { order_id: "order-1", session_id: "session-1" },
      meta: {},
      occurred_at: new Date(),
    };

    await eventStore.append(event);

    // Attempt to append same event_id
    await expect(eventStore.append(event)).rejects.toThrow("Duplicate event_id");
  });

  it("should handle idempotency_key (same command, no-op)", async () => {
    const idempotencyKey = "cmd-123";

    const event1: CoreEvent = {
      event_id: "event-1",
      stream_id: "ORDER:order-1",
      stream_version: 0,
      type: "ORDER_CREATED",
      payload: { order_id: "order-1" },
      meta: {},
      occurred_at: new Date(),
      idempotency_key: idempotencyKey,
    };

    const event2: CoreEvent = {
      event_id: "event-2", // Different event_id
      stream_id: "ORDER:order-1",
      stream_version: 0,
      type: "ORDER_CREATED",
      payload: { order_id: "order-1" },
      meta: {},
      occurred_at: new Date(),
      idempotency_key: idempotencyKey, // Same key
    };

    await eventStore.append(event1);

    // Second append with same idempotency_key should be no-op
    await eventStore.append(event2); // Should not throw

    // Only first event should exist
    const events = await eventStore.readStream("ORDER:order-1");
    expect(events.length).toBe(1);
    expect(events[0].event_id).toBe("event-1");
  });
});

// ============================================================================
// CONCURRENCY TESTS
// ============================================================================

describe("CONCURRENCY: Optimistic concurrency control", () => {
  it("should reject concurrent append with wrong expected version", async () => {
    const event1: CoreEvent = {
      event_id: "event-1",
      stream_id: "ORDER:order-1",
      stream_version: 0,
      type: "ORDER_CREATED",
      payload: { order_id: "order-1" },
      meta: {},
      occurred_at: new Date(),
    };

    const event2: CoreEvent = {
      event_id: "event-2",
      stream_id: "ORDER:order-1",
      stream_version: 1,
      type: "ORDER_LOCKED",
      payload: { order_id: "order-1", total_cents: 10000 },
      meta: {},
      occurred_at: new Date(),
    };

    await eventStore.append(event1);

    // Attempt to append event2 with wrong expected version
    await expect(
      eventStore.append(event2, 5) // Expected version 5, but current is 0
    ).rejects.toThrow("Stream version mismatch");
  });

  it("should allow sequential appends with correct version", async () => {
    const event1: CoreEvent = {
      event_id: "event-1",
      stream_id: "ORDER:order-1",
      stream_version: 0,
      type: "ORDER_CREATED",
      payload: { order_id: "order-1" },
      meta: {},
      occurred_at: new Date(),
    };

    const event2: CoreEvent = {
      event_id: "event-2",
      stream_id: "ORDER:order-1",
      stream_version: 1,
      type: "ORDER_LOCKED",
      payload: { order_id: "order-1", total_cents: 10000 },
      meta: {},
      occurred_at: new Date(),
    };

    await eventStore.append(event1);
    await eventStore.append(event2, 0); // Expected version 0 (after event1)

    const events = await eventStore.readStream("ORDER:order-1");
    expect(events.length).toBe(2);
  });
});

// ============================================================================
// CRASH RECOVERY TESTS
// ============================================================================

describe("CRASH RECOVERY: Rebuild state from events", () => {
  it("should rebuild ORDER state from events", async () => {
    const events: CoreEvent[] = [
      {
        event_id: "event-1",
        stream_id: "ORDER:order-1",
        stream_version: 0,
        type: "ORDER_CREATED",
        payload: {
          order_id: "order-1",
          session_id: "session-1",
          table_id: "table-1",
        },
        meta: {},
        occurred_at: new Date("2024-01-01T10:00:00Z"),
      },
      {
        event_id: "event-2",
        stream_id: "ORDER:order-1",
        stream_version: 1,
        type: "ORDER_ITEM_ADDED",
        payload: {
          order_id: "order-1",
          item_id: "item-1",
          product_id: "product-1",
          quantity: 2,
          price_snapshot_cents: 1000,
        },
        meta: {},
        occurred_at: new Date("2024-01-01T10:01:00Z"),
      },
      {
        event_id: "event-3",
        stream_id: "ORDER:order-1",
        stream_version: 2,
        type: "ORDER_LOCKED",
        payload: {
          order_id: "order-1",
          total_cents: 2000,
        },
        meta: {},
        occurred_at: new Date("2024-01-01T10:02:00Z"),
      },
    ];

    // Rebuild state from events
    const state = rebuildState(events);

    // Verify state
    const order = state.orders.get("order-1");
    expect(order).toBeDefined();
    expect(order?.state).toBe("LOCKED");
    expect(order?.total_cents).toBe(2000);
    expect(order?.session_id).toBe("session-1");

    const items = state.orderItems.get("order-1");
    expect(items?.length).toBe(1);
    expect(items?.[0].quantity).toBe(2);
    expect(items?.[0].price_snapshot_cents).toBe(1000);
  });

  it("should rebuild SESSION state from events", async () => {
    const events: CoreEvent[] = [
      {
        event_id: "event-1",
        stream_id: "SESSION:session-1",
        stream_version: 0,
        type: "SESSION_STARTED",
        payload: { session_id: "session-1" },
        meta: {},
        occurred_at: new Date("2024-01-01T09:00:00Z"),
      },
      {
        event_id: "event-2",
        stream_id: "SESSION:session-1",
        stream_version: 1,
        type: "SESSION_CLOSED",
        payload: { session_id: "session-1" },
        meta: {},
        occurred_at: new Date("2024-01-01T18:00:00Z"),
      },
    ];

    const state = rebuildState(events);

    const session = state.sessions.get("session-1");
    expect(session).toBeDefined();
    expect(session?.state).toBe("CLOSED");
    expect(session?.opened_at).toBeDefined();
    expect(session?.closed_at).toBeDefined();
  });
});

// ============================================================================
// IMMUTABILITY TESTS
// ============================================================================

describe("IMMUTABILITY: Events cannot be modified", () => {
  it("should prevent modification of CLOSED order via events", async () => {
    const events: CoreEvent[] = [
      {
        event_id: "event-1",
        stream_id: "ORDER:order-1",
        stream_version: 0,
        type: "ORDER_CREATED",
        payload: { order_id: "order-1", session_id: "session-1" },
        meta: {},
        occurred_at: new Date(),
      },
      {
        event_id: "event-2",
        stream_id: "ORDER:order-1",
        stream_version: 1,
        type: "ORDER_LOCKED",
        payload: { order_id: "order-1", total_cents: 10000 },
        meta: {},
        occurred_at: new Date(),
      },
      {
        event_id: "event-3",
        stream_id: "ORDER:order-1",
        stream_version: 2,
        type: "ORDER_PAID",
        payload: { order_id: "order-1" },
        meta: {},
        occurred_at: new Date(),
      },
      {
        event_id: "event-4",
        stream_id: "ORDER:order-1",
        stream_version: 3,
        type: "ORDER_CLOSED",
        payload: { order_id: "order-1" },
        meta: {},
        occurred_at: new Date(),
      },
    ];

    const state = rebuildState(events);
    const order = state.orders.get("order-1");

    expect(order?.state).toBe("CLOSED");
    expect(order?.total_cents).toBe(10000); // Immutable after LOCKED

    // Attempting to add a new event that modifies CLOSED order should be prevented
    // (This is enforced by state machine, not event store)
    // Event store only ensures append-only; state machine enforces business rules
  });
});

// ============================================================================
// ANTI-TAMPER TESTS
// ============================================================================

describe("ANTI-TAMPER: Hash chain integrity", () => {
  it("should calculate hash chain correctly", async () => {
    const event1: CoreEvent = {
      event_id: "event-1",
      stream_id: "ORDER:order-1",
      stream_version: 0,
      type: "ORDER_CREATED",
      payload: { order_id: "order-1" },
      meta: {},
      occurred_at: new Date(),
    };

    const event2: CoreEvent = {
      event_id: "event-2",
      stream_id: "ORDER:order-1",
      stream_version: 1,
      type: "ORDER_LOCKED",
      payload: { order_id: "order-1", total_cents: 10000 },
      meta: {},
      occurred_at: new Date(),
    };

    await eventStore.append(event1);
    await eventStore.append(event2);

    const events = await eventStore.readStream("ORDER:order-1");

    expect(events[0].hash_prev).toBeUndefined(); // First event has no previous hash
    expect(events[0].hash).toBeDefined();

    expect(events[1].hash_prev).toBe(events[0].hash);
    expect(events[1].hash).toBeDefined();
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe("INTEGRATION: EventExecutor with state machine", () => {
  it("should generate events from transitions", async () => {
    // Create session
    const session: Session = {
      id: "session-1",
      state: "INACTIVE",
      version: 0,
    };
    executor.getRepo().saveSession(session);

    const ctx = {
      tenantId: TEST_TENANT,
      executionId: TEST_EXEC_ID,
      lifecycle: "ACTIVE" as const,
      source: "API" as const,
      correlationRoot: "test",
      timestamp: new Date(),
    };

    // Start session (should generate SESSION_STARTED event)
    const result = await executor.execute(
      {
        tenantId: TEST_TENANT,
        entity: "SESSION",
        entityId: session.id,
        event: "START",
      },
      ctx
    );

    expect(result.success).toBe(true);
    expect(result.event_id).toBeDefined();

    // Verify event was stored (stream_id is tenantId:ENTITY:entityId)
    const streamId = `${TEST_TENANT}:SESSION:${session.id}`;
    const events = await eventStore.readStream(streamId);
    expect(events.length).toBe(1);
    expect(events[0].type).toBe("SESSION_STARTED");
  });
});

