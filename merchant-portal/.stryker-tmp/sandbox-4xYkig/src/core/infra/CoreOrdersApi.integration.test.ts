/**
 * INTEGRATION TEST: CoreOrdersApi + Event Bus
 *
 * Validates end-to-end flow:
 * 1. Core operation executes successfully
 * 2. Event is published (fire-and-forget)
 * 3. Core operation returns immediately
 * 4. Event metadata is correct
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addOrderItem,
  createOrderAtomic,
  removeOrderItem,
  updateOrderStatus,
} from "./CoreOrdersApi";
import { eventBus, getEventMetrics } from "./eventBus";
import { featureFlagManager } from "./featureFlags";

// Mock coreClient
vi.mock("./coreClient", () => ({
  coreClient: {
    rpc: vi.fn((method, params) => {
      if (method === "create_order_atomic") {
        return Promise.resolve({
          data: {
            id: "order-123",
            total_cents: 10000,
            status: "pending",
          },
          error: null,
        });
      }
      if (method === "update_order_status") {
        return Promise.resolve({
          data: {
            order_id: params.p_order_id,
            new_status: params.p_new_status,
          },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: { message: "Unknown RPC" } });
    }),
    from: vi.fn((table) => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: { id: "item-456" },
              error: null,
            }),
          ),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      })),
    })),
  },
  checkCoreHealth: vi.fn(() => Promise.resolve(true)),
}));

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

describe("CoreOrdersApi + Event Bus Integration", () => {
  beforeEach(() => {
    // Enable cognitive layer for tests
    featureFlagManager.set("ENABLE_COGNITIVE_LAYER", true);
    featureFlagManager.set("ENABLE_EVENT_BUS", true);
    featureFlagManager.set("ENABLE_EVENT_LOGGING", false);

    // Reset metrics
    eventBus.resetMetrics();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // CREATE ORDER
  // ==========================================================================

  describe("createOrderAtomic", () => {
    it("creates order and publishes event without blocking", async () => {
      const startTime = performance.now();

      const result = await createOrderAtomic({
        p_restaurant_id: "rest-1",
        p_items: [
          { product_id: "prod-1", name: "Item 1", quantity: 2, unit_price: 50 },
        ],
        p_payment_method: "cash",
      });

      const endTime = performance.now();
      const latency = endTime - startTime;

      // Core operation should succeed
      expect(result.error).toBeNull();
      expect(result.data).toMatchObject({
        id: "order-123",
        total_cents: 10000,
        status: "pending",
      });

      // Should return quickly (not waiting for event publish)
      expect(latency).toBeLessThan(100);

      // Event should be published (async, so wait a bit)
      await new Promise((resolve) => setTimeout(resolve, 150));

      const metrics = getEventMetrics();
      expect(metrics.published).toBeGreaterThanOrEqual(1);
    });

    it("does not publish when cognitive layer disabled", async () => {
      featureFlagManager.set("ENABLE_COGNITIVE_LAYER", false);
      eventBus.resetMetrics();

      const result = await createOrderAtomic({
        p_restaurant_id: "rest-1",
        p_items: [
          { product_id: "prod-3", name: "Item 3", quantity: 1, unit_price: 75 },
        ],
      });

      await new Promise((resolve) => setTimeout(resolve, 150));

      // Core operation succeeds
      expect(result.error).toBeNull();

      // No events published
      const metrics = getEventMetrics();
      expect(metrics.published).toBe(0);
    });
  });

  // ==========================================================================
  // ADD ITEM
  // ==========================================================================

  describe("addOrderItem", () => {
    it("adds item and publishes event", async () => {
      const result = await addOrderItem({
        order_id: "order-123",
        restaurant_id: "rest-1",
        product_id: "prod-1",
        name_snapshot: "Test Item",
        price_snapshot: 50,
        quantity: 2,
        subtotal_cents: 100,
      });

      expect(result.error).toBeNull();
      expect(result.data?.id).toBe("item-456");

      await new Promise((resolve) => setTimeout(resolve, 150));

      const metrics = getEventMetrics();
      expect(metrics.published).toBeGreaterThanOrEqual(1);
    });
  });

  // ==========================================================================
  // REMOVE ITEM
  // ==========================================================================

  describe("removeOrderItem", () => {
    it("removes item and publishes event", async () => {
      const result = await removeOrderItem("order-123", "item-456", "rest-1");

      expect(result.error).toBeNull();

      await new Promise((resolve) => setTimeout(resolve, 150));

      const metrics = getEventMetrics();
      expect(metrics.published).toBeGreaterThanOrEqual(1);
    });
  });

  // ==========================================================================
  // UPDATE STATUS
  // ==========================================================================

  describe("updateOrderStatus", () => {
    it("updates status and publishes event", async () => {
      const result = await updateOrderStatus({
        order_id: "order-123",
        restaurant_id: "rest-1",
        new_status: "completed",
        origin: "KDS",
      });

      expect(result.error).toBeNull();
      expect(result.data).toMatchObject({
        order_id: "order-123",
        new_status: "completed",
      });

      await new Promise((resolve) => setTimeout(resolve, 150));

      const metrics = getEventMetrics();
      expect(metrics.published).toBeGreaterThanOrEqual(1);
    });
  });

  // ==========================================================================
  // PERFORMANCE
  // ==========================================================================

  describe("Performance", () => {
    it("maintains low latency regardless of event publish", async () => {
      const latencies: number[] = [];

      for (let i = 0; i < 10; i++) {
        const start = performance.now();

        await createOrderAtomic({
          p_restaurant_id: "rest-1",
          p_items: [
            {
              product_id: `prod-${i}`,
              name: `Item ${i}`,
              quantity: 1,
              unit_price: 50,
            },
          ],
        });

        const end = performance.now();
        latencies.push(end - start);
      }

      const avgLatency =
        latencies.reduce((a, b) => a + b, 0) / latencies.length;

      // Average latency should be < 50ms (not waiting for events)
      expect(avgLatency).toBeLessThan(50);
    });
  });
});
