/**
 * OrderReader — tests with mocked dockerCoreClient.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CoreOrder } from "../docker-core/types";

const mockFrom = vi.fn();
vi.mock("../docker-core/connection", () => ({
  dockerCoreClient: { from: (table: string) => mockFrom(table) },
}));

function createMockChain<T>(result: { data: T | null; error: unknown }) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    not: () => chain,
    order: () => chain,
    limit: () => chain,
    maybeSingle: () => Promise.resolve(result),
  };
  (chain as any).then = (fn: (r: typeof result) => any) =>
    Promise.resolve(result).then(fn);
  return chain;
}

describe("OrderReader", () => {
  beforeEach(() => {
    mockFrom.mockClear();
  });

  it("readActiveOrders returns [] on error", async () => {
    mockFrom.mockReturnValue(
      createMockChain({ data: null, error: { message: "fetch failed" } })
    );
    const { readActiveOrders } = await import("./OrderReader");
    const out = await readActiveOrders("r1");
    expect(out).toEqual([]);
    expect(mockFrom).toHaveBeenCalledWith("gm_orders");
  });

  it("readActiveOrders returns data on success", async () => {
    const rows: CoreOrder[] = [
      {
        id: "o1",
        restaurant_id: "r1",
        status: "OPEN",
        payment_status: "PENDING",
        created_at: "2026-01-01T00:00:00Z",
      } as CoreOrder,
    ];
    mockFrom.mockReturnValue(createMockChain({ data: rows, error: null }));
    const { readActiveOrders } = await import("./OrderReader");
    const out = await readActiveOrders("r1");
    expect(out).toEqual(rows);
  });

  it("readOrderItems returns [] on error", async () => {
    mockFrom.mockReturnValue(createMockChain({ data: null, error: {} }));
    const { readOrderItems } = await import("./OrderReader");
    const out = await readOrderItems("order-1");
    expect(out).toEqual([]);
    expect(mockFrom).toHaveBeenCalledWith("gm_order_items");
  });

  it("readOrderItems maps station BAR from product", async () => {
    const rows = [
      {
        id: "i1",
        order_id: "o1",
        name_snapshot: "Beer",
        price_snapshot: 300,
        quantity: 1,
        subtotal_cents: 300,
        station: null,
        gm_products: { station: "BAR" },
      },
    ];
    mockFrom.mockReturnValue(createMockChain({ data: rows, error: null }));
    const { readOrderItems } = await import("./OrderReader");
    const out = await readOrderItems("o1");
    expect(out).toHaveLength(1);
    expect(out[0].station).toBe("BAR");
  });

  it("readOrderItems maps station KITCHEN when not BAR", async () => {
    const rows = [
      {
        id: "i1",
        order_id: "o1",
        name_snapshot: "Soup",
        price_snapshot: 400,
        quantity: 1,
        subtotal_cents: 400,
        station: "KITCHEN",
        gm_products: null,
      },
    ];
    mockFrom.mockReturnValue(createMockChain({ data: rows, error: null }));
    const { readOrderItems } = await import("./OrderReader");
    const out = await readOrderItems("o1");
    expect(out[0].station).toBe("KITCHEN");
  });

  it("getLastOrderCreatedAt returns null on error", async () => {
    mockFrom.mockReturnValue(createMockChain({ data: null, error: {} }));
    const { getLastOrderCreatedAt } = await import("./OrderReader");
    const out = await getLastOrderCreatedAt("r1");
    expect(out).toBeNull();
  });

  it("getLastOrderCreatedAt returns created_at on success", async () => {
    mockFrom.mockReturnValue(
      createMockChain({
        data: { created_at: "2026-01-15T12:00:00Z" },
        error: null,
      })
    );
    const { getLastOrderCreatedAt } = await import("./OrderReader");
    const out = await getLastOrderCreatedAt("r1");
    expect(out).toBe("2026-01-15T12:00:00Z");
  });

  it("readOrderById returns null on error", async () => {
    mockFrom.mockReturnValue(createMockChain({ data: null, error: {} }));
    const { readOrderById } = await import("./OrderReader");
    const out = await readOrderById("o1");
    expect(out).toBeNull();
  });

  it("readOrderById returns order on success", async () => {
    const order: CoreOrder = {
      id: "o1",
      restaurant_id: "r1",
      status: "PAID",
      payment_status: "PAID",
      created_at: "2026-01-01T00:00:00Z",
    } as CoreOrder;
    mockFrom.mockReturnValue(createMockChain({ data: order, error: null }));
    const { readOrderById } = await import("./OrderReader");
    const out = await readOrderById("o1");
    expect(out).toEqual(order);
  });

  it("readReadyOrders returns [] on error", async () => {
    mockFrom.mockReturnValue(createMockChain({ data: null, error: {} }));
    const { readReadyOrders } = await import("./OrderReader");
    const out = await readReadyOrders("r1");
    expect(out).toEqual([]);
  });

  it("readOrdersForAnalytics returns [] on error", async () => {
    mockFrom.mockReturnValue(createMockChain({ data: null, error: {} }));
    const { readOrdersForAnalytics } = await import("./OrderReader");
    const out = await readOrdersForAnalytics("r1", 100);
    expect(out).toEqual([]);
  });

  it("readOrdersForAnalytics returns data with default limit", async () => {
    const rows: CoreOrder[] = [];
    mockFrom.mockReturnValue(createMockChain({ data: rows, error: null }));
    const { readOrdersForAnalytics } = await import("./OrderReader");
    await readOrdersForAnalytics("r1");
    expect(mockFrom).toHaveBeenCalled();
  });
});
