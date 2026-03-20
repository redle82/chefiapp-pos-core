/**
 * Contract Tests — OrderUseCases
 *
 * Validates the application layer's orchestration of domain invariants,
 * service calls, domain events, and metrics for order operations.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockOrder, ROLES } from "./helpers";

// ---------------------------------------------------------------------------
// Mock all external dependencies before importing the module under test
// ---------------------------------------------------------------------------

vi.mock("../../core/infra/CoreOrdersApi", () => ({
  createOrderAtomic: vi.fn(),
  addOrderItem: vi.fn(),
  removeOrderItem: vi.fn(),
  updateOrderStatus: vi.fn(),
}));

vi.mock("../../domain/events/DomainEvents", () => ({
  emitDomainEvent: vi.fn(),
}));

vi.mock("../../core/audit/AuditService", () => ({
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../analytics/track", () => ({
  track: vi.fn(),
}));

vi.mock("../../core/logger", () => ({
  Logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock("../../domain/order/calculateOrderTotals", () => ({
  calculateOrderTotals: vi.fn().mockReturnValue({
    subtotal: 1000,
    tax: 100,
    discount: 200,
    total: 900,
    itemCount: 1,
  }),
}));

// Import after mocks are registered
import {
  createOrder,
  addItemToOrder,
  applyDiscount,
  cancelOrder,
  reopenOrder,
} from "../OrderUseCases";

import { createOrderAtomic, addOrderItem, updateOrderStatus } from "../../core/infra/CoreOrdersApi";

const mockedCreateOrderAtomic = vi.mocked(createOrderAtomic);
const mockedAddOrderItem = vi.mocked(addOrderItem);
const mockedUpdateOrderStatus = vi.mocked(updateOrderStatus);

// ---------------------------------------------------------------------------
// createOrder
// ---------------------------------------------------------------------------

describe("createOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success with valid items", async () => {
    mockedCreateOrderAtomic.mockResolvedValue({
      data: { id: "order_new", total_cents: 1200 },
      error: null,
    } as any);

    const result = await createOrder({
      restaurantId: "rest_1",
      items: [
        { productId: "prod_1", name: "Pizza", quantity: 1, unitPrice: 1200 },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ orderId: "order_new", totalCents: 1200 });
  });

  it("returns error with empty items", async () => {
    const result = await createOrder({
      restaurantId: "rest_1",
      items: [],
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/at least one item/i);
    expect(mockedCreateOrderAtomic).not.toHaveBeenCalled();
  });

  it("returns error when restaurantId is missing", async () => {
    const result = await createOrder({
      restaurantId: "",
      items: [
        { productId: "prod_1", name: "Pizza", quantity: 1, unitPrice: 1200 },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/restaurant id/i);
  });
});

// ---------------------------------------------------------------------------
// addItemToOrder
// ---------------------------------------------------------------------------

describe("addItemToOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates canModifyOrder invariant — allows OPEN orders", async () => {
    mockedAddOrderItem.mockResolvedValue({
      data: { id: "item_new" },
      error: null,
    } as any);

    const order = createMockOrder({ status: "OPEN" });
    const result = await addItemToOrder({
      orderId: "order_1",
      restaurantId: "rest_1",
      order,
      item: { productId: "prod_2", name: "Salad", unitPrice: 800, quantity: 1 },
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ itemId: "item_new" });
  });

  it("fails on closed (PAID) order", async () => {
    const order = createMockOrder({ status: "PAID" });
    const result = await addItemToOrder({
      orderId: "order_1",
      restaurantId: "rest_1",
      order,
      item: { productId: "prod_2", name: "Salad", unitPrice: 800, quantity: 1 },
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/cannot be modified/i);
    expect(mockedAddOrderItem).not.toHaveBeenCalled();
  });

  it("fails on CANCELLED order", async () => {
    const order = createMockOrder({ status: "CANCELLED" });
    const result = await addItemToOrder({
      orderId: "order_1",
      restaurantId: "rest_1",
      order,
      item: { productId: "prod_2", name: "Salad", unitPrice: 800, quantity: 1 },
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/cannot be modified/i);
  });
});

// ---------------------------------------------------------------------------
// applyDiscount
// ---------------------------------------------------------------------------

describe("applyDiscount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates canApplyDiscount — succeeds on OPEN order with valid discount", async () => {
    const order = createMockOrder({ status: "OPEN", subtotal: 1200 });
    const result = await applyDiscount({
      orderId: "order_1",
      restaurantId: "rest_1",
      order,
      discount: { amountCents: 200 },
      discountId: "disc_1",
      role: ROLES.manager,
    });

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty("newTotal");
  });

  it("fails when discount exceeds order subtotal", async () => {
    const order = createMockOrder({ status: "OPEN", subtotal: 500 });
    const result = await applyDiscount({
      orderId: "order_1",
      restaurantId: "rest_1",
      order,
      discount: { amountCents: 600 },
      discountId: "disc_1",
      role: ROLES.manager,
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/exceeds/i);
  });

  it("fails on non-modifiable order (PAID)", async () => {
    const order = createMockOrder({ status: "PAID", subtotal: 1200 });
    const result = await applyDiscount({
      orderId: "order_1",
      restaurantId: "rest_1",
      order,
      discount: { amountCents: 200 },
      discountId: "disc_1",
      role: ROLES.manager,
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/cannot apply discount/i);
  });

  it("fails with zero discount amount", async () => {
    const order = createMockOrder({ status: "OPEN", subtotal: 1200 });
    const result = await applyDiscount({
      orderId: "order_1",
      restaurantId: "rest_1",
      order,
      discount: { amountCents: 0 },
      discountId: "disc_1",
      role: ROLES.manager,
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/greater than zero/i);
  });
});

// ---------------------------------------------------------------------------
// cancelOrder
// ---------------------------------------------------------------------------

describe("cancelOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates canCancelOrder — succeeds for OPEN order", async () => {
    mockedUpdateOrderStatus.mockResolvedValue({ error: null } as any);

    const order = createMockOrder({ status: "OPEN" });
    const result = await cancelOrder({
      orderId: "order_1",
      restaurantId: "rest_1",
      order,
      reason: "Customer left",
      role: ROLES.waiter,
    });

    expect(result.success).toBe(true);
  });

  it("fails without elevated role on PAID order", async () => {
    const order = createMockOrder({ status: "PAID" });
    const result = await cancelOrder({
      orderId: "order_1",
      restaurantId: "rest_1",
      order,
      reason: "Wrong order",
      role: ROLES.waiter,
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/managers or owners/i);
    expect(mockedUpdateOrderStatus).not.toHaveBeenCalled();
  });

  it("fails on already cancelled order", async () => {
    const order = createMockOrder({ status: "CANCELLED" });
    const result = await cancelOrder({
      orderId: "order_1",
      restaurantId: "rest_1",
      order,
      reason: "Duplicate",
      role: ROLES.manager,
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/already cancelled/i);
  });
});

// ---------------------------------------------------------------------------
// reopenOrder
// ---------------------------------------------------------------------------

describe("reopenOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates canReopenOrder — succeeds for PAID order by manager with reason", async () => {
    mockedUpdateOrderStatus.mockResolvedValue({ error: null } as any);

    const order = createMockOrder({ status: "PAID" });
    const result = await reopenOrder({
      orderId: "order_1",
      restaurantId: "rest_1",
      order,
      reason: "Adjustment needed",
      role: ROLES.manager,
      operatorId: "op_1",
      operatorName: "John",
    });

    expect(result.success).toBe(true);
  });

  it("requires manager or owner role", async () => {
    const order = createMockOrder({ status: "PAID" });
    const result = await reopenOrder({
      orderId: "order_1",
      restaurantId: "rest_1",
      order,
      reason: "Adjustment needed",
      role: ROLES.waiter,
      operatorId: "op_1",
      operatorName: "John",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/managers or owners/i);
  });

  it("requires a non-empty reason (audit mandatory)", async () => {
    const order = createMockOrder({ status: "PAID" });
    const result = await reopenOrder({
      orderId: "order_1",
      restaurantId: "rest_1",
      order,
      reason: "",
      role: ROLES.manager,
      operatorId: "op_1",
      operatorName: "John",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/reason must be provided/i);
  });

  it("fails on already OPEN order (unnecessary reopen)", async () => {
    const order = createMockOrder({ status: "OPEN" });
    const result = await reopenOrder({
      orderId: "order_1",
      restaurantId: "rest_1",
      order,
      reason: "Some reason",
      role: ROLES.manager,
      operatorId: "op_1",
      operatorName: "John",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/unnecessary/i);
  });
});
