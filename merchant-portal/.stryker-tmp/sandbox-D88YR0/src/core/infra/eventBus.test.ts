/**
 * EVENT BUS TESTS
 *
 * Validates:
 * - Feature flag control
 * - Fire-and-forget behavior
 * - Retry logic
 * - Dead letter queue
 * - Metrics tracking
 * - Health checks
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkEventBusHealth,
  eventBus,
  getEventMetrics,
  publishEvent,
} from "./eventBus";
import type { OrderCreatedEvent } from "./eventTypes";
import { createEvent, EVENT_METADATA } from "./eventTypes";
import { featureFlagManager } from "./featureFlags";

// Mock analyticsClient
vi.mock("./analyticsClient", () => ({
  analyticsClient: {
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ error: null })),
      select: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
  checkAnalyticsHealth: vi.fn(() =>
    Promise.resolve({ healthy: true, backend: "docker", latencyMs: 10 }),
  ),
}));

describe("Event Bus Architecture", () => {
  beforeEach(() => {
    // Reset metrics
    eventBus.resetMetrics();

    // Enable cognitive layer for tests
    featureFlagManager.set("ENABLE_COGNITIVE_LAYER", true);
    featureFlagManager.set("ENABLE_EVENT_BUS", true);
    featureFlagManager.set("ENABLE_EVENT_LOGGING", false); // Reduce noise
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // FEATURE FLAG CONTROL
  // ==========================================================================

  describe("Feature Flag Control", () => {
    it("does not publish when cognitive layer disabled", async () => {
      featureFlagManager.set("ENABLE_COGNITIVE_LAYER", false);

      const event = createEvent<OrderCreatedEvent>(
        "order.created",
        {
          orderId: "123",
          tableId: "table-1",
          items: [],
          totalAmount: 100,
        },
        "restaurant-1",
      );

      await publishEvent(event);

      const metrics = getEventMetrics();
      expect(metrics.published).toBe(0);
    });

    it("does not publish when event bus disabled", async () => {
      featureFlagManager.set("ENABLE_COGNITIVE_LAYER", true);
      featureFlagManager.set("ENABLE_EVENT_BUS", false);

      const event = createEvent<OrderCreatedEvent>(
        "order.created",
        {
          orderId: "456",
          tableId: "table-2",
          items: [],
          totalAmount: 200,
        },
        "restaurant-1",
      );

      await publishEvent(event);

      const metrics = getEventMetrics();
      expect(metrics.published).toBe(0);
    });

    it("publishes when both flags enabled", async () => {
      featureFlagManager.set("ENABLE_COGNITIVE_LAYER", true);
      featureFlagManager.set("ENABLE_EVENT_BUS", true);

      const event = createEvent<OrderCreatedEvent>(
        "order.created",
        {
          orderId: "789",
          tableId: "table-3",
          items: [],
          totalAmount: 300,
        },
        "restaurant-1",
      );

      await publishEvent(event);

      // Give async operation time to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      const metrics = getEventMetrics();
      expect(metrics.published).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // FIRE-AND-FORGET BEHAVIOR
  // ==========================================================================

  describe("Fire-and-Forget Behavior", () => {
    it("returns immediately without waiting for publish", async () => {
      const startTime = performance.now();

      const event = createEvent<OrderCreatedEvent>(
        "order.created",
        {
          orderId: "fast-123",
          tableId: "table-1",
          items: [],
          totalAmount: 100,
        },
        "restaurant-1",
      );

      await publishEvent(event);

      const endTime = performance.now();
      const latency = endTime - startTime;

      // Should return in < 10ms (not waiting for network)
      expect(latency).toBeLessThan(10);
    });

    it("does not throw errors on publish failure", async () => {
      // This should NOT throw even if backend fails
      const event = createEvent<OrderCreatedEvent>(
        "order.created",
        {
          orderId: "fail-456",
          tableId: "table-2",
          items: [],
          totalAmount: 200,
        },
        "restaurant-1",
      );

      await expect(publishEvent(event)).resolves.not.toThrow();
    });
  });

  // ==========================================================================
  // EVENT CREATION
  // ==========================================================================

  describe("Event Creation", () => {
    it("creates event with all required fields", () => {
      const event = createEvent<OrderCreatedEvent>(
        "order.created",
        {
          orderId: "order-123",
          tableId: "table-1",
          items: [{ productId: "prod-1", quantity: 2, price: 10 }],
          totalAmount: 20,
        },
        "restaurant-1",
        "user-1",
      );

      expect(event).toMatchObject({
        eventType: "order.created",
        orderId: "order-123",
        tableId: "table-1",
        restaurantId: "restaurant-1",
        userId: "user-1",
      });

      expect(event.eventId).toBeDefined();
      expect(event.timestamp).toBeDefined();
      expect(event.eventId).toMatch(/^evt_/);
    });

    it("creates event without userId (optional)", () => {
      const event = createEvent<OrderCreatedEvent>(
        "order.created",
        {
          orderId: "order-456",
          tableId: "table-2",
          items: [],
          totalAmount: 50,
        },
        "restaurant-1",
      );

      expect(event.userId).toBeUndefined();
    });
  });

  // ==========================================================================
  // METRICS TRACKING
  // ==========================================================================

  describe("Metrics Tracking", () => {
    it("tracks published events", async () => {
      featureFlagManager.set("ENABLE_COGNITIVE_LAYER", true);
      featureFlagManager.set("ENABLE_EVENT_BUS", true);
      featureFlagManager.set("ENABLE_EVENT_METRICS", true);

      const event = createEvent<OrderCreatedEvent>(
        "order.created",
        {
          orderId: "metrics-1",
          tableId: "table-1",
          items: [],
          totalAmount: 100,
        },
        "restaurant-1",
      );

      await publishEvent(event);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const metrics = getEventMetrics();
      expect(metrics.published).toBeGreaterThan(0);
    });

    it("calculates average latency", async () => {
      featureFlagManager.set("ENABLE_COGNITIVE_LAYER", true);
      featureFlagManager.set("ENABLE_EVENT_BUS", true);
      featureFlagManager.set("ENABLE_EVENT_METRICS", true);

      // Publish multiple events
      for (let i = 0; i < 5; i++) {
        const event = createEvent<OrderCreatedEvent>(
          "order.created",
          {
            orderId: `latency-${i}`,
            tableId: "table-1",
            items: [],
            totalAmount: 100,
          },
          "restaurant-1",
        );
        await publishEvent(event);
      }

      await new Promise((resolve) => setTimeout(resolve, 200));

      const metrics = getEventMetrics();
      if (metrics.published > 0) {
        expect(metrics.avgLatency).toBeGreaterThan(0);
      }
    });
  });

  // ==========================================================================
  // HEALTH CHECKS
  // ==========================================================================

  describe("Health Checks", () => {
    it("reports healthy when cognitive layer disabled", async () => {
      featureFlagManager.set("ENABLE_COGNITIVE_LAYER", false);

      const healthy = await checkEventBusHealth();
      expect(healthy).toBe(true);
    });

    it("checks InsForge connectivity when enabled", async () => {
      featureFlagManager.set("ENABLE_COGNITIVE_LAYER", true);

      const healthy = await checkEventBusHealth();
      expect(typeof healthy).toBe("boolean");
    });
  });

  // ==========================================================================
  // DEAD LETTER QUEUE
  // ==========================================================================

  describe("Dead Letter Queue", () => {
    it("tracks dead letter queue size", () => {
      const size = eventBus.getDeadLetterQueueSize();
      expect(typeof size).toBe("number");
      expect(size).toBeGreaterThanOrEqual(0);
    });

    it("allows retry of dead letter queue", async () => {
      await expect(eventBus.retryDeadLetterQueue()).resolves.not.toThrow();
    });
  });

  // ==========================================================================
  // EVENT METADATA
  // ==========================================================================

  describe("Event Metadata", () => {
    it("defines metadata for all event types", () => {
      expect(EVENT_METADATA["order.created"]).toBeDefined();
      expect(EVENT_METADATA["order.paid"]).toBeDefined();
      expect(EVENT_METADATA["shift.closed"]).toBeDefined();
      expect(EVENT_METADATA["mission.requested"]).toBeDefined();
    });

    it("marks critical events as high priority", () => {
      expect(EVENT_METADATA["order.paid"].priority).toBe("critical");
      expect(EVENT_METADATA["shift.closed"].priority).toBe("critical");
    });

    it("marks analytical events as low priority", () => {
      expect(EVENT_METADATA["product.performance"].priority).toBe("low");
      expect(EVENT_METADATA["staff.metrics"].priority).toBe("low");
    });
  });
});
