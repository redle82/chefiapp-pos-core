/**
 * Contract Tests — PaymentUseCases
 *
 * Validates the application layer's orchestration of domain invariants,
 * payment provider calls, domain events, and metrics for payment operations.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockOrder, createMockPayment, ROLES } from "./helpers";

// ---------------------------------------------------------------------------
// Mock all external dependencies
// ---------------------------------------------------------------------------

vi.mock("../../core/payment/PaymentBroker", () => ({
  PaymentBroker: {
    createPaymentIntent: vi.fn(),
    createRefund: vi.fn(),
  },
}));

vi.mock("../../core/payment/TipService", () => ({
  saveTip: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../core/orders/SplitBillService", () => ({
  splitEqual: vi.fn().mockReturnValue([
    {
      partIndex: 0,
      label: "Person 1",
      items: [],
      subtotalCents: 500,
      taxCents: 50,
      totalCents: 550,
      paymentStatus: "pending",
    },
    {
      partIndex: 1,
      label: "Person 2",
      items: [],
      subtotalCents: 500,
      taxCents: 50,
      totalCents: 550,
      paymentStatus: "pending",
    },
  ]),
  splitByItems: vi.fn(),
  splitCustom: vi.fn(),
}));

vi.mock("../../core/payment/PaymentReconciler", () => ({
  reconcilePayments: vi.fn(),
}));

vi.mock("../../core/infra/CoreOrdersApi", () => ({
  updateOrderStatus: vi.fn().mockResolvedValue({ error: null }),
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

// Import after mocks
import {
  processPayment,
  refundPayment,
  splitBill,
} from "../PaymentUseCases";

import { PaymentBroker } from "../../core/payment/PaymentBroker";
import { saveTip } from "../../core/payment/TipService";

const mockedCreatePaymentIntent = vi.mocked(PaymentBroker.createPaymentIntent);
const mockedCreateRefund = vi.mocked(PaymentBroker.createRefund);
const mockedSaveTip = vi.mocked(saveTip);

// ---------------------------------------------------------------------------
// processPayment
// ---------------------------------------------------------------------------

describe("processPayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates canProcessPayment — succeeds for payable order", async () => {
    mockedCreatePaymentIntent.mockResolvedValue({
      id: "pi_1",
      clientSecret: "secret_1",
    } as any);

    const order = createMockOrder({
      status: "PREPARING",
      items: [{ id: "i1", productId: "p1", name: "X", quantity: 1, unitPrice: 1000 }],
      total: 1100,
      subtotal: 1000,
    });

    const result = await processPayment({
      orderId: "order_1",
      restaurantId: "rest_1",
      order,
      method: "card",
      amount: 1100,
      currency: "EUR",
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      paymentIntentId: "pi_1",
      clientSecret: "secret_1",
    });
  });

  it("fails on already-paid order", async () => {
    const order = createMockOrder({ status: "PAID" });
    const result = await processPayment({
      orderId: "order_1",
      restaurantId: "rest_1",
      order,
      method: "card",
      amount: 1100,
      currency: "EUR",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/already paid/i);
    expect(mockedCreatePaymentIntent).not.toHaveBeenCalled();
  });

  it("saves tip when tipCents > 0", async () => {
    mockedCreatePaymentIntent.mockResolvedValue({
      id: "pi_2",
      clientSecret: "secret_2",
    } as any);

    const order = createMockOrder({
      status: "OPEN",
      items: [{ id: "i1", productId: "p1", name: "X", quantity: 1, unitPrice: 1000 }],
      total: 1100,
      subtotal: 1000,
    });

    await processPayment({
      orderId: "order_1",
      restaurantId: "rest_1",
      order,
      method: "card",
      amount: 1100,
      currency: "EUR",
      tipCents: 200,
      tipType: "fixed",
      operatorId: "op_1",
    });

    expect(mockedSaveTip).toHaveBeenCalledWith(
      "rest_1",
      expect.objectContaining({
        orderId: "order_1",
        amountCents: 200,
        type: "fixed",
      }),
    );
  });

  it("fails on cancelled order", async () => {
    const order = createMockOrder({ status: "CANCELLED" });
    const result = await processPayment({
      orderId: "order_1",
      restaurantId: "rest_1",
      order,
      method: "card",
      amount: 1100,
      currency: "EUR",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/cancelled/i);
  });
});

// ---------------------------------------------------------------------------
// refundPayment
// ---------------------------------------------------------------------------

describe("refundPayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates canRefund — succeeds for completed payment with manager role", async () => {
    mockedCreateRefund.mockResolvedValue({
      refundId: "ref_1",
      status: "succeeded",
      amount: 1320,
    } as any);

    const payment = createMockPayment({ status: "completed", amount: 1320 });
    const result = await refundPayment({
      paymentId: "pay_1",
      paymentIntentId: "pi_1",
      payment,
      role: ROLES.manager,
      restaurantId: "rest_1",
    });

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty("refundId", "ref_1");
  });

  it("fails when refund amount exceeds original payment", async () => {
    const payment = createMockPayment({ status: "completed", amount: 1000 });
    const result = await refundPayment({
      paymentId: "pay_1",
      paymentIntentId: "pi_1",
      payment,
      role: ROLES.manager,
      amount: 1500,
      restaurantId: "rest_1",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/exceeds/i);
    expect(mockedCreateRefund).not.toHaveBeenCalled();
  });

  it("fails for non-elevated role (waiter)", async () => {
    const payment = createMockPayment({ status: "completed" });
    const result = await refundPayment({
      paymentId: "pay_1",
      paymentIntentId: "pi_1",
      payment,
      role: ROLES.waiter,
      restaurantId: "rest_1",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/managers or owners/i);
  });

  it("fails for pending payment", async () => {
    const payment = createMockPayment({ status: "pending" });
    const result = await refundPayment({
      paymentId: "pay_1",
      paymentIntentId: "pi_1",
      payment,
      role: ROLES.manager,
      restaurantId: "rest_1",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/completed/i);
  });
});

// ---------------------------------------------------------------------------
// splitBill
// ---------------------------------------------------------------------------

describe("splitBill", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns correct parts for equal split", () => {
    const order = createMockOrder({
      status: "PREPARING",
      items: [{ id: "i1", productId: "p1", name: "X", quantity: 1, unitPrice: 1000 }],
    });

    const result = splitBill({
      orderId: "order_1",
      order,
      mode: "equal",
      numberOfPeople: 2,
      totalCents: 1100,
      taxCents: 100,
    });

    expect(result.success).toBe(true);
    expect(result.data?.parts).toHaveLength(2);
  });

  it("validates parts sum to total (via splitEqual mock)", () => {
    const order = createMockOrder({
      status: "PREPARING",
      items: [{ id: "i1", productId: "p1", name: "X", quantity: 1, unitPrice: 1000 }],
    });

    const result = splitBill({
      orderId: "order_1",
      order,
      mode: "equal",
      numberOfPeople: 2,
      totalCents: 1100,
      taxCents: 100,
    });

    expect(result.success).toBe(true);
    const totalFromParts = result.data!.parts.reduce(
      (sum, p) => sum + p.totalCents,
      0,
    );
    expect(totalFromParts).toBe(1100);
  });

  it("fails on PAID order (cannot split)", () => {
    const order = createMockOrder({ status: "PAID" });
    const result = splitBill({
      orderId: "order_1",
      order,
      mode: "equal",
      numberOfPeople: 2,
      totalCents: 1100,
      taxCents: 100,
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/already paid/i);
  });

  it("fails on OPEN order (must be sent to kitchen first)", () => {
    const order = createMockOrder({
      status: "OPEN",
      items: [{ id: "i1", productId: "p1", name: "X", quantity: 1, unitPrice: 1000 }],
    });

    const result = splitBill({
      orderId: "order_1",
      order,
      mode: "equal",
      numberOfPeople: 2,
      totalCents: 1100,
      taxCents: 100,
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/kitchen/i);
  });

  it("requires at least 2 people for equal split", () => {
    const order = createMockOrder({
      status: "PREPARING",
      items: [{ id: "i1", productId: "p1", name: "X", quantity: 1, unitPrice: 1000 }],
    });

    const result = splitBill({
      orderId: "order_1",
      order,
      mode: "equal",
      numberOfPeople: 1,
      totalCents: 1100,
      taxCents: 100,
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/at least 2/i);
  });
});
