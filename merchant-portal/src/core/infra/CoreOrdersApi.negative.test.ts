/**
 * CoreOrdersApi — negative paths & error handling
 *
 * Covers: createOrderAtomic error/null/throw, addOrderItem error/BLOCK_DIRECT_WRITES/params,
 * updateOrderStatus ACTOR_REQUIRED/invalid_status/throw, removeOrderItem/updateOrderItemQty
 * BLOCK_DIRECT_WRITES, orderExistsInCore false, coreClient throwing.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addOrderItem,
  createOrderAtomic,
  orderExistsInCore,
  removeOrderItem,
  updateOrderItemQty,
  updateOrderStatus,
} from "./CoreOrdersApi";
import { coreClient } from "./coreClient";

vi.mock("./coreClient", () => ({
  coreClient: {
    rpc: vi.fn(),
    from: vi.fn(),
  },
}));

vi.mock("../../config", () => ({
  CONFIG: {
    get BLOCK_DIRECT_WRITES() {
      return (globalThis as any).__BLOCK_DIRECT_WRITES ?? false;
    },
  },
}));

describe("CoreOrdersApi — negative paths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).__BLOCK_DIRECT_WRITES = false;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("createOrderAtomic", () => {
    it("returns error when RPC returns error", async () => {
      vi.mocked(coreClient.rpc).mockResolvedValue({
        data: null,
        error: { message: "Restaurant not found", code: "PGRST116" },
      });

      const result = await createOrderAtomic({
        p_restaurant_id: "bad-rest",
        p_items: [
          { product_id: "p1", name: "Item", quantity: 1, unit_price: 100 },
        ],
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("Restaurant not found");
      expect(result.data).toBeNull();
    });

    it("returns error when RPC returns data without id", async () => {
      vi.mocked(coreClient.rpc).mockResolvedValue({
        data: { total_cents: 1000, status: "OPEN" } as any,
        error: null,
      });

      const result = await createOrderAtomic({
        p_restaurant_id: "r1",
        p_items: [
          { product_id: "p1", name: "Item", quantity: 1, unit_price: 100 },
        ],
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("did not return order id");
      expect(result.data).toBeNull();
    });

    it("returns INVALID_RPC_RESPONSE when RPC returns null data without error", async () => {
      vi.mocked(coreClient.rpc).mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await createOrderAtomic({
        p_restaurant_id: "r1",
        p_items: [
          { product_id: "p1", name: "Item", quantity: 1, unit_price: 100 },
        ],
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe("INVALID_RPC_RESPONSE");
      expect(result.error?.message).toContain("null data");
      expect(result.data).toBeNull();
    });

    it("returns CORE_RPC_ERROR when coreClient.rpc throws", async () => {
      vi.mocked(coreClient.rpc).mockRejectedValue(new Error("db timeout"));

      const result = await createOrderAtomic({
        p_restaurant_id: "r1",
        p_items: [
          { product_id: "p1", name: "Item", quantity: 1, unit_price: 100 },
        ],
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe("CORE_RPC_ERROR");
      expect(result.error?.message).toContain("db timeout");
      expect(result.data).toBeNull();
    });

    it("normaliza throw não-Error em CORE_RPC_ERROR", async () => {
      vi.mocked(coreClient.rpc).mockRejectedValue(null as any);

      const result = await createOrderAtomic({
        p_restaurant_id: "r1",
        p_items: [
          { product_id: "p1", name: "Item", quantity: 1, unit_price: 100 },
        ],
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe("CORE_RPC_ERROR");
      expect(result.error?.message).toContain("Core RPC threw: unknown");
      expect(result.data).toBeNull();
    });

    it("faz fallback para CORE_RPC_ERROR quando out.error.code é undefined", async () => {
      vi.mocked(coreClient.rpc).mockResolvedValue({
        data: null,
        error: { message: "generic rpc error" },
      });

      const result = await createOrderAtomic({
        p_restaurant_id: "r1",
        p_items: [
          { product_id: "p1", name: "Item", quantity: 1, unit_price: 100 },
        ],
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe("CORE_RPC_ERROR");
      expect(result.error?.message).toBe("generic rpc error");
      expect(result.data).toBeNull();
    });
  });

  describe("addOrderItem", () => {
    it("returns error when RPC returns error", async () => {
      vi.mocked(coreClient.rpc).mockResolvedValue({
        data: null,
        error: { message: "Order not found", code: "PGRST116" },
      });

      const result = await addOrderItem({
        order_id: "bad-order",
        restaurant_id: "r1",
        product_id: "p1",
        name_snapshot: "Item",
        price_snapshot: 100,
        quantity: 1,
        subtotal_cents: 100,
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("Order not found");
      expect(result.data).toBeNull();
    });

    it("returns error when RPC returns data without id", async () => {
      vi.mocked(coreClient.rpc).mockResolvedValue({
        data: { total_cents: 200 } as any,
        error: null,
      });

      const result = await addOrderItem({
        order_id: "o1",
        restaurant_id: "r1",
        product_id: "p1",
        name_snapshot: "Item",
        price_snapshot: 100,
        quantity: 1,
        subtotal_cents: 100,
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("did not return item id");
      expect(result.data).toBeNull();
    });

    it("throws DirectWriteBlockedError when BLOCK_DIRECT_WRITES is true", async () => {
      (globalThis as any).__BLOCK_DIRECT_WRITES = true;

      const { DirectWriteBlockedError } = await import(
        "../governance/DbWriteGate"
      );

      await expect(
        addOrderItem({
          order_id: "o1",
          restaurant_id: "r1",
          product_id: "p1",
          name_snapshot: "Item",
          price_snapshot: 100,
          quantity: 1,
          subtotal_cents: 100,
        }),
      ).rejects.toThrow(DirectWriteBlockedError);

      expect(coreClient.rpc).not.toHaveBeenCalled();
    });

    it("returns INVALID_PARAMS when quantity <= 0", async () => {
      const result = await addOrderItem({
        order_id: "o1",
        restaurant_id: "r1",
        product_id: "p1",
        name_snapshot: "Item",
        price_snapshot: 100,
        quantity: 0,
        subtotal_cents: 0,
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe("INVALID_PARAMS");
      expect(result.error?.message).toContain("positive integer");
      expect(result.data).toBeNull();
      expect(coreClient.rpc).not.toHaveBeenCalled();
    });

    it("returns INVALID_PARAMS when quantity is float (não inteiro)", async () => {
      const result = await addOrderItem({
        order_id: "o1",
        restaurant_id: "r1",
        product_id: "p1",
        name_snapshot: "Item",
        price_snapshot: 100,
        quantity: 1.5,
        subtotal_cents: 150,
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe("INVALID_PARAMS");
      expect(result.error?.message).toContain("positive integer");
      expect(coreClient.rpc).not.toHaveBeenCalled();
    });

    it("returns INVALID_RPC_RESPONSE when RPC returns null data without error", async () => {
      vi.mocked(coreClient.rpc).mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await addOrderItem({
        order_id: "o1",
        restaurant_id: "r1",
        product_id: "p1",
        name_snapshot: "Item",
        price_snapshot: 100,
        quantity: 1,
        subtotal_cents: 100,
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe("INVALID_RPC_RESPONSE");
      expect(result.data).toBeNull();
    });

    it("returns CORE_RPC_ERROR when coreClient.rpc throws", async () => {
      vi.mocked(coreClient.rpc).mockRejectedValue(new Error("fetch failed"));

      const result = await addOrderItem({
        order_id: "o1",
        restaurant_id: "r1",
        product_id: "p1",
        name_snapshot: "Item",
        price_snapshot: 100,
        quantity: 1,
        subtotal_cents: 100,
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe("CORE_RPC_ERROR");
      expect(result.error?.message).toContain("fetch failed");
      expect(result.data).toBeNull();
    });

    it("normaliza payload opcional para null/[] ao chamar RPC", async () => {
      vi.mocked(coreClient.rpc).mockResolvedValue({
        data: { id: "item-ok" },
        error: null,
      });

      const result = await addOrderItem({
        order_id: "o1",
        restaurant_id: "r1",
        product_id: null,
        name_snapshot: "Item",
        price_snapshot: 100,
        quantity: 1,
        subtotal_cents: 100,
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual({ id: "item-ok" });
      expect(coreClient.rpc).toHaveBeenCalledWith(
        "add_order_item_atomic",
        expect.objectContaining({
          p_product_id: null,
          p_idempotency_key: null,
          p_created_by_user_id: null,
          p_created_by_role: null,
          p_device_id: null,
          p_modifiers: [],
          p_notes: null,
        }),
      );
    });
  });

  describe("updateOrderStatus", () => {
    it("returns ACTOR_REQUIRED when actor_user_id is empty", async () => {
      const result = await updateOrderStatus({
        order_id: "o1",
        restaurant_id: "r1",
        new_status: "CLOSED",
        actor_user_id: "",
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("ACTOR_REQUIRED");
      expect(result.data).toBeNull();
      expect(coreClient.rpc).not.toHaveBeenCalled();
    });

    it("returns error when RPC returns error", async () => {
      vi.mocked(coreClient.rpc).mockResolvedValue({
        data: null,
        error: { message: "Order not found", code: "PGRST116" },
      });

      const result = await updateOrderStatus({
        order_id: "bad-order",
        restaurant_id: "r1",
        new_status: "CLOSED",
        actor_user_id: "user-1",
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("Order not found");
      expect(result.data).toBeNull();
    });

    it("returns error when RPC returns data without order_id", async () => {
      vi.mocked(coreClient.rpc).mockResolvedValue({
        data: { new_status: "CLOSED" } as any,
        error: null,
      });

      const result = await updateOrderStatus({
        order_id: "o1",
        restaurant_id: "r1",
        new_status: "CLOSED",
        actor_user_id: "user-1",
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain("order_id");
      expect(result.data).toBeNull();
    });

    it("returns INVALID_ORDER_STATUS when new_status is invalid", async () => {
      const result = await updateOrderStatus({
        order_id: "o1",
        restaurant_id: "r1",
        new_status: "INVALID_STATUS" as any,
        actor_user_id: "user-1",
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe("INVALID_ORDER_STATUS");
      expect(result.error?.message).toContain("Invalid new_status");
      expect(result.data).toBeNull();
      expect(coreClient.rpc).not.toHaveBeenCalled();
    });

    it("returns CORE_RPC_ERROR when coreClient.rpc throws", async () => {
      vi.mocked(coreClient.rpc).mockRejectedValue(new Error("timeout"));

      const result = await updateOrderStatus({
        order_id: "o1",
        restaurant_id: "r1",
        new_status: "CLOSED",
        actor_user_id: "user-1",
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe("CORE_RPC_ERROR");
      expect(result.error?.message).toContain("timeout");
      expect(result.data).toBeNull();
    });
  });

  describe("updateOrderItemQty", () => {
    it("returns INVALID_PARAMS when quantity <= 0", async () => {
      const result = await updateOrderItemQty({
        order_id: "o1",
        item_id: "item-1",
        restaurant_id: "r1",
        quantity: 0,
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe("INVALID_PARAMS");
      expect(result.error?.message).toContain("positive integer");
      expect(result.data).toBeNull();
      expect(coreClient.from).not.toHaveBeenCalled();
    });

    it("returns INVALID_PARAMS when quantity is float (não inteiro)", async () => {
      const result = await updateOrderItemQty({
        order_id: "o1",
        item_id: "item-1",
        restaurant_id: "r1",
        quantity: 2.25,
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe("INVALID_PARAMS");
      expect(result.error?.message).toContain("positive integer");
      expect(result.data).toBeNull();
      expect(coreClient.from).not.toHaveBeenCalled();
    });

    it("throws DirectWriteBlockedError when BLOCK_DIRECT_WRITES is true", async () => {
      (globalThis as any).__BLOCK_DIRECT_WRITES = true;

      const { DirectWriteBlockedError } = await import(
        "../governance/DbWriteGate"
      );

      await expect(
        updateOrderItemQty({
          order_id: "o1",
          item_id: "item-1",
          restaurant_id: "r1",
          quantity: 2,
        }),
      ).rejects.toThrow(DirectWriteBlockedError);

      expect(coreClient.from).not.toHaveBeenCalled();
    });
  });

  describe("removeOrderItem", () => {
    it("throws DirectWriteBlockedError when BLOCK_DIRECT_WRITES is true", async () => {
      (globalThis as any).__BLOCK_DIRECT_WRITES = true;

      const { DirectWriteBlockedError } = await import(
        "../governance/DbWriteGate"
      );

      await expect(removeOrderItem("o1", "item-1", "r1")).rejects.toThrow(
        DirectWriteBlockedError,
      );

      expect(coreClient.from).not.toHaveBeenCalled();
    });

    it("returns CORE_RPC_ERROR when coreClient.delete throws", async () => {
      vi.mocked(coreClient.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockRejectedValue(new Error("network error")),
          }),
        }),
      } as any);

      const result = await removeOrderItem("o1", "item-1", "r1");

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe("CORE_RPC_ERROR");
      expect(result.error?.message).toContain("network error");
      expect(result.data).toBeNull();
    });
  });

  describe("orderExistsInCore", () => {
    it("returns false when core returns error", async () => {
      vi.mocked(coreClient.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Network error" },
            }),
          }),
        }),
      } as any);

      const result = await orderExistsInCore("order-1");

      expect(result).toBe(false);
    });

    it("returns false when data is null", async () => {
      vi.mocked(coreClient.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await orderExistsInCore("order-1");

      expect(result).toBe(false);
    });

    it("returns true when data exists", async () => {
      vi.mocked(coreClient.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: "order-1" },
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await orderExistsInCore("order-1");

      expect(result).toBe(true);
    });
  });
});
