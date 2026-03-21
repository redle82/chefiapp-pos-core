/**
 * OrderProjection — persistOrder, persistOrderItem error paths
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  persistOrder,
  persistOrderItem,
  persistOrderStatus,
  persistPayment,
} from "./OrderProjection";

vi.mock("../infra/CoreOrdersApi", () => ({
  createOrderAtomic: vi.fn(),
  addOrderItem: vi.fn(),
  removeOrderItem: vi.fn(),
  updateOrderItemQty: vi.fn(),
  updateOrderStatus: vi.fn(),
}));

vi.mock("../auth/getRequiredActorUserId", () => ({
  getRequiredActorUserId: vi.fn((id: string) => id || "default-actor"),
}));

vi.mock("../tpv/PaymentEngine", () => ({
  PaymentEngine: {
    processPayment: vi.fn().mockResolvedValue(undefined),
    processSplitPayment: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../logger", () => ({
  Logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import {
  addOrderItem,
  createOrderAtomic,
  updateOrderStatus,
} from "../infra/CoreOrdersApi";

describe("OrderProjection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("persistOrder", () => {
    it("throws when createOrderAtomic returns error", async () => {
      vi.mocked(createOrderAtomic).mockResolvedValue({
        data: null,
        error: { message: "Restaurant not found", code: "PGRST116" },
      });

      await expect(
        persistOrder({
          entityId: "e1",
          restaurantId: "r1",
          items: [
            {
              productId: "p1",
              name: "Item",
              quantity: 1,
              priceCents: 100,
            },
          ],
        } as any),
      ).rejects.toThrow("Projection Failed");
    });

    it("throws TABLE_HAS_ACTIVE_ORDER when constraint 23505 with idx_one_open_order_per_table", async () => {
      vi.mocked(createOrderAtomic).mockResolvedValue({
        data: null,
        error: {
          message: "duplicate key idx_one_open_order_per_table",
          code: "23505",
        },
      });

      const err = await persistOrder({
        entityId: "e1",
        restaurantId: "r1",
        items: [],
      } as any).catch((e) => e);

      expect(err.message).toContain("TABLE_HAS_ACTIVE_ORDER");
      expect((err as any).code).toBe("23505");
    });

    it("throws when createOrderAtomic returns no data", async () => {
      vi.mocked(createOrderAtomic).mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(
        persistOrder({
          entityId: "e1",
          restaurantId: "r1",
          items: [{ productId: "p1", name: "X", quantity: 1, priceCents: 50 }],
        } as any),
      ).rejects.toThrow("Projection returned no data");
    });

    it("resolves when createOrderAtomic succeeds", async () => {
      vi.mocked(createOrderAtomic).mockResolvedValue({
        data: { id: "order-1", total_cents: 100, status: "OPEN" },
        error: null,
      });

      await expect(
        persistOrder({
          entityId: "e1",
          restaurantId: "r1",
          items: [{ productId: "p1", name: "X", quantity: 1, priceCents: 100 }],
        } as any),
      ).resolves.toBeUndefined();
    });
  });

  describe("persistOrderItem", () => {
    it("throws when addOrderItem returns error", async () => {
      vi.mocked(addOrderItem).mockResolvedValue({
        data: null,
        error: { message: "Order not found", code: "PGRST116" },
      });

      await expect(
        persistOrderItem({
          entityId: "order-1",
          restaurantId: "r1",
          item: {
            productId: "p1",
            name: "Item",
            quantity: 1,
            priceCents: 100,
          },
        } as any),
      ).rejects.toThrow("Item Projection Failed");
    });

    it("resolves when addOrderItem succeeds", async () => {
      vi.mocked(addOrderItem).mockResolvedValue({
        data: { id: "item-1" },
        error: null,
      });

      await expect(
        persistOrderItem({
          entityId: "order-1",
          restaurantId: "r1",
          item: {
            productId: "p1",
            name: "Café",
            quantity: 2,
            priceCents: 250,
          },
        } as any),
      ).resolves.toBeUndefined();
    });
  });

  describe("persistOrderStatus", () => {
    it("throws when targetStatus is missing", async () => {
      await expect(
        persistOrderStatus({
          entityId: "order-1",
          restaurantId: "r1",
          targetStatus: undefined,
          actor_user_id: "user-1",
        } as any),
      ).rejects.toThrow("Missing targetStatus");
    });

    it("throws when updateOrderStatus returns error", async () => {
      vi.mocked(updateOrderStatus).mockResolvedValue({
        data: null,
        error: { message: "Order not found", code: "PGRST116" },
      });

      await expect(
        persistOrderStatus({
          entityId: "bad-order",
          restaurantId: "r1",
          targetStatus: "CLOSED",
          actor_user_id: "user-1",
        } as any),
      ).rejects.toThrow("Status Projection Failed");
    });
  });

  describe("persistPayment", () => {
    it("throws when required payment details are missing", async () => {
      await expect(
        persistPayment({
          entityId: "order-1",
          amountCents: 1000,
          method: "cash",
          restaurantId: "",
          cashRegisterId: "cr1",
        } as any),
      ).rejects.toThrow("Missing Payment Details");
    });
  });
});
