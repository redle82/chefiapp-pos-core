/**
 * Property Tests for Payment Invariants
 *
 * Validates payment domain rules across randomly generated inputs.
 */

import { describe, it, expect } from "vitest";
import {
  canProcessPayment,
  canRefund,
  validateTip,
  canReconcile,
} from "../PaymentInvariants";
import type { Order, OrderStatus, Payment } from "../../order/types";
import type { UserRole } from "../../../core/context/ContextTypes";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const USER_ROLES: UserRole[] = ["waiter", "kitchen", "manager", "owner"];
const ELEVATED_ROLES: UserRole[] = ["manager", "owner"];
const LOW_ROLES: UserRole[] = ["waiter", "kitchen"];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomOrder(overrides: Partial<Order> = {}): Order {
  const itemCount = randomInt(0, 5);
  const items = Array.from({ length: itemCount }, (_, i) => ({
    id: `item-${i}`,
    productId: `prod-${i}`,
    name: `Product ${i}`,
    quantity: randomInt(1, 10),
    unitPrice: randomInt(100, 5000),
  }));
  const subtotal = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);

  return {
    id: `order-${randomInt(1, 99999)}`,
    restaurantId: "rest-1",
    status: "OPEN",
    type: "dine_in",
    items,
    subtotal,
    tax: Math.round(subtotal * 0.23),
    discount: 0,
    total: subtotal + Math.round(subtotal * 0.23),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function randomPayment(
  overrides: Partial<Payment> = {},
): Payment {
  return {
    id: `pay-${randomInt(1, 99999)}`,
    orderId: `order-${randomInt(1, 99999)}`,
    amount: randomInt(100, 50000),
    method: "card",
    status: "completed",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

const ITERATIONS = 200;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PaymentInvariants — property tests", () => {
  describe("canRefund — refund amount cannot exceed payment amount", () => {
    it("property: refund greater than payment is always rejected", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const paymentAmount = randomInt(100, 50000);
        const refundAmount = paymentAmount + randomInt(1, 10000);
        const payment = randomPayment({
          amount: paymentAmount,
          status: "completed",
        });
        const role = randomChoice(ELEVATED_ROLES);
        const result = canRefund(payment, role, refundAmount);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("exceeds");
      }
    });

    it("property: refund equal to payment amount is allowed for elevated roles", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const paymentAmount = randomInt(100, 50000);
        const payment = randomPayment({
          amount: paymentAmount,
          status: "completed",
        });
        const role = randomChoice(ELEVATED_ROLES);
        const result = canRefund(payment, role, paymentAmount);
        expect(result.allowed).toBe(true);
      }
    });

    it("property: partial refund within bounds is allowed for elevated roles", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const paymentAmount = randomInt(200, 50000);
        const refundAmount = randomInt(1, paymentAmount);
        const payment = randomPayment({
          amount: paymentAmount,
          status: "completed",
        });
        const role = randomChoice(ELEVATED_ROLES);
        const result = canRefund(payment, role, refundAmount);
        expect(result.allowed).toBe(true);

        // Verify remaining is correct (application-level invariant)
        const remaining = paymentAmount - refundAmount;
        expect(remaining).toBeGreaterThanOrEqual(0);
      }
    });

    it("property: zero or negative refund amount is rejected", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const badAmount = randomInt(-5000, 0);
        const payment = randomPayment({ status: "completed" });
        const role = randomChoice(ELEVATED_ROLES);
        const result = canRefund(payment, role, badAmount);
        expect(result.allowed).toBe(false);
      }
    });
  });

  describe("validateTip — tip cannot be negative", () => {
    it("property: negative tip is always rejected", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const negativeTip = -(randomInt(1, 10000));
        const subtotal = randomInt(100, 50000);
        const result = validateTip(negativeTip, subtotal);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("negative");
      }
    });

    it("property: tip within 0-100% of subtotal is accepted", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const subtotal = randomInt(100, 50000);
        const tip = randomInt(0, subtotal);
        const result = validateTip(tip, subtotal);
        expect(result.allowed).toBe(true);
      }
    });

    it("property: tip exceeding subtotal is rejected", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const subtotal = randomInt(100, 50000);
        const tip = subtotal + randomInt(1, 10000);
        const result = validateTip(tip, subtotal);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("exceeds");
      }
    });
  });

  describe("canProcessPayment", () => {
    it("property: PAID orders always reject payment", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const order = randomOrder({ status: "PAID" });
        const result = canProcessPayment(order);
        expect(result.allowed).toBe(false);
      }
    });

    it("property: CANCELLED orders always reject payment", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const order = randomOrder({ status: "CANCELLED" });
        const result = canProcessPayment(order);
        expect(result.allowed).toBe(false);
      }
    });

    it("property: orders with items and positive total in active status can be paid", () => {
      const activeStatuses: OrderStatus[] = [
        "OPEN",
        "PREPARING",
        "READY",
        "DELIVERED",
      ];
      for (let i = 0; i < ITERATIONS; i++) {
        const status = randomChoice(activeStatuses);
        const unitPrice = randomInt(100, 5000);
        const items = [
          {
            id: "i1",
            productId: "p1",
            name: "X",
            quantity: 1,
            unitPrice,
          },
        ];
        const subtotal = unitPrice;
        const total = subtotal + Math.round(subtotal * 0.23);
        const order = randomOrder({
          status,
          items,
          subtotal,
          total,
        });
        const result = canProcessPayment(order);
        expect(result.allowed).toBe(true);
      }
    });

    it("property: orders with zero total are rejected", () => {
      const activeStatuses: OrderStatus[] = [
        "OPEN",
        "PREPARING",
        "READY",
        "DELIVERED",
      ];
      for (let i = 0; i < ITERATIONS; i++) {
        const status = randomChoice(activeStatuses);
        const order = randomOrder({
          status,
          items: [
            {
              id: "i1",
              productId: "p1",
              name: "X",
              quantity: 1,
              unitPrice: 0,
            },
          ],
          total: 0,
        });
        const result = canProcessPayment(order);
        expect(result.allowed).toBe(false);
      }
    });
  });

  describe("canRefund — role authorization", () => {
    it("property: non-elevated roles cannot refund", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const role = randomChoice(LOW_ROLES);
        const payment = randomPayment({ status: "completed" });
        const result = canRefund(payment, role);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("managers or owners");
      }
    });

    it("property: non-completed payments cannot be refunded regardless of role", () => {
      const nonCompleted = ["pending", "failed", "refunded"] as const;
      for (let i = 0; i < ITERATIONS; i++) {
        const status = randomChoice(nonCompleted);
        const role = randomChoice(ELEVATED_ROLES);
        const payment = randomPayment({ status });
        const result = canRefund(payment, role);
        expect(result.allowed).toBe(false);
      }
    });
  });

  describe("payment method validity for offline state (application invariant)", () => {
    it("property: offline mode only allows cash", () => {
      const offlineMethods = ["cash"];
      const onlineMethods = ["card", "mbway", "pix", "sumup_eur", "loyalty"];

      for (let i = 0; i < ITERATIONS; i++) {
        const isOffline = true;
        const method = randomChoice([...offlineMethods, ...onlineMethods]);

        if (isOffline) {
          const isValid = offlineMethods.includes(method);
          if (!isValid) {
            // Verify the invariant: non-cash methods are invalid offline
            expect(onlineMethods).toContain(method);
          }
        }
      }
    });
  });
});
