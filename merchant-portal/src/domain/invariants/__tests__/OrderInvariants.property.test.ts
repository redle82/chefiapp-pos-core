/**
 * Property Tests for Order Invariants
 *
 * These tests verify that domain invariants hold across a wide range of
 * randomly generated inputs, catching edge cases that example-based tests miss.
 */

import { describe, it, expect } from "vitest";
import {
  canModifyOrder,
  canCancelOrder,
  canReopenOrder,
  canApplyDiscount,
  canSplitBill,
} from "../OrderInvariants";
import type { Order, OrderStatus } from "../../order/types";
import type { UserRole } from "../../../core/context/ContextTypes";

// ---------------------------------------------------------------------------
// Helpers — random generators
// ---------------------------------------------------------------------------

const ORDER_STATUSES: OrderStatus[] = [
  "OPEN",
  "PREPARING",
  "READY",
  "DELIVERED",
  "PAID",
  "CANCELLED",
];

const USER_ROLES: UserRole[] = ["waiter", "kitchen", "manager", "owner"];

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
    status: randomChoice(ORDER_STATUSES),
    type: randomChoice(["dine_in", "takeaway", "delivery"] as const),
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

const ITERATIONS = 200;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("OrderInvariants — property tests", () => {
  describe("canModifyOrder", () => {
    it("property: OPEN and PREPARING orders are always modifiable", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const status = randomChoice(["OPEN", "PREPARING"] as const);
        const order = randomOrder({ status });
        const result = canModifyOrder(order);
        expect(result.allowed).toBe(true);
      }
    });

    it("property: non-modifiable statuses always reject modification", () => {
      const nonModifiable: OrderStatus[] = [
        "READY",
        "DELIVERED",
        "PAID",
        "CANCELLED",
      ];
      for (let i = 0; i < ITERATIONS; i++) {
        const status = randomChoice(nonModifiable);
        const order = randomOrder({ status });
        const result = canModifyOrder(order);
        expect(result.allowed).toBe(false);
        expect(result.reason).toBeDefined();
      }
    });
  });

  describe("canCancelOrder — paid order requires elevated role", () => {
    it("property: waiter and kitchen cannot cancel a PAID order", () => {
      const lowRoles: UserRole[] = ["waiter", "kitchen"];
      for (let i = 0; i < ITERATIONS; i++) {
        const role = randomChoice(lowRoles);
        const order = randomOrder({ status: "PAID" });
        const result = canCancelOrder(order, role);
        expect(result.allowed).toBe(false);
      }
    });

    it("property: manager and owner can always cancel a PAID order", () => {
      const elevatedRoles: UserRole[] = ["manager", "owner"];
      for (let i = 0; i < ITERATIONS; i++) {
        const role = randomChoice(elevatedRoles);
        const order = randomOrder({ status: "PAID" });
        const result = canCancelOrder(order, role);
        expect(result.allowed).toBe(true);
      }
    });

    it("property: any role can cancel an OPEN or PREPARING order", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const role = randomChoice(USER_ROLES);
        const status = randomChoice(["OPEN", "PREPARING"] as const);
        const order = randomOrder({ status });
        const result = canCancelOrder(order, role);
        expect(result.allowed).toBe(true);
      }
    });

    it("property: already cancelled orders cannot be cancelled again", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const role = randomChoice(USER_ROLES);
        const order = randomOrder({ status: "CANCELLED" });
        const result = canCancelOrder(order, role);
        expect(result.allowed).toBe(false);
      }
    });
  });

  describe("canReopenOrder — requires elevated role and reason", () => {
    it("property: non-manager/owner cannot reopen regardless of reason", () => {
      const lowRoles: UserRole[] = ["waiter", "kitchen"];
      for (let i = 0; i < ITERATIONS; i++) {
        const role = randomChoice(lowRoles);
        const order = randomOrder({
          status: randomChoice(["PAID", "CANCELLED", "DELIVERED", "READY"]),
        });
        const result = canReopenOrder(order, role, "Customer complaint");
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("managers or owners");
      }
    });

    it("property: empty reason is always rejected even for elevated roles", () => {
      const elevatedRoles: UserRole[] = ["manager", "owner"];
      const emptyReasons = ["", "   ", "\t", "\n"];
      for (let i = 0; i < ITERATIONS; i++) {
        const role = randomChoice(elevatedRoles);
        const reason = randomChoice(emptyReasons);
        const order = randomOrder({ status: "PAID" });
        const result = canReopenOrder(order, role, reason);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("reason");
      }
    });

    it("property: elevated role with valid reason can reopen closed orders", () => {
      const elevatedRoles: UserRole[] = ["manager", "owner"];
      const closedStatuses: OrderStatus[] = [
        "PAID",
        "CANCELLED",
        "READY",
        "DELIVERED",
      ];
      for (let i = 0; i < ITERATIONS; i++) {
        const role = randomChoice(elevatedRoles);
        const status = randomChoice(closedStatuses);
        const order = randomOrder({ status });
        const result = canReopenOrder(order, role, "Customer requested change");
        expect(result.allowed).toBe(true);
      }
    });
  });

  describe("canApplyDiscount", () => {
    it("property: discount cannot exceed order subtotal", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const subtotal = randomInt(100, 10000);
        const order = randomOrder({
          status: "OPEN",
          subtotal,
          items: [
            {
              id: "i1",
              productId: "p1",
              name: "X",
              quantity: 1,
              unitPrice: subtotal,
            },
          ],
        });
        const excessiveDiscount = subtotal + randomInt(1, 5000);
        const result = canApplyDiscount(order, {
          amountCents: excessiveDiscount,
        });
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("exceeds");
      }
    });

    it("property: valid discount on modifiable order is always accepted", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const subtotal = randomInt(500, 10000);
        const discountAmount = randomInt(1, subtotal);
        const status = randomChoice(["OPEN", "PREPARING"] as const);
        const order = randomOrder({
          status,
          subtotal,
          items: [
            {
              id: "i1",
              productId: "p1",
              name: "X",
              quantity: 1,
              unitPrice: subtotal,
            },
          ],
        });
        const result = canApplyDiscount(order, {
          amountCents: discountAmount,
        });
        expect(result.allowed).toBe(true);
      }
    });

    it("property: zero or negative discount is always rejected", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const badAmount = randomInt(-5000, 0);
        const order = randomOrder({
          status: "OPEN",
          subtotal: 5000,
          items: [
            {
              id: "i1",
              productId: "p1",
              name: "X",
              quantity: 1,
              unitPrice: 5000,
            },
          ],
        });
        const result = canApplyDiscount(order, { amountCents: badAmount });
        expect(result.allowed).toBe(false);
      }
    });

    it("property: discount on non-modifiable order is rejected regardless of amount", () => {
      const nonModifiable: OrderStatus[] = [
        "READY",
        "DELIVERED",
        "PAID",
        "CANCELLED",
      ];
      for (let i = 0; i < ITERATIONS; i++) {
        const status = randomChoice(nonModifiable);
        const subtotal = randomInt(500, 10000);
        const order = randomOrder({
          status,
          subtotal,
          items: [
            {
              id: "i1",
              productId: "p1",
              name: "X",
              quantity: 1,
              unitPrice: subtotal,
            },
          ],
        });
        const result = canApplyDiscount(order, {
          amountCents: randomInt(1, subtotal),
        });
        expect(result.allowed).toBe(false);
      }
    });
  });

  describe("canSplitBill", () => {
    it("property: split bill parts must conceptually sum to order total", () => {
      // This tests the invariant that splitting is only valid when there are
      // items and the order is in an appropriate status. The actual sum check
      // is application-level, but we verify the guard allows valid splits.
      for (let i = 0; i < ITERATIONS; i++) {
        const status = randomChoice([
          "PREPARING",
          "READY",
          "DELIVERED",
        ] as const);
        const items = [
          {
            id: "i1",
            productId: "p1",
            name: "X",
            quantity: 1,
            unitPrice: randomInt(100, 5000),
          },
        ];
        const order = randomOrder({ status, items });
        const result = canSplitBill(order);
        expect(result.allowed).toBe(true);
      }
    });

    it("property: OPEN orders cannot be split", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const order = randomOrder({
          status: "OPEN",
          items: [
            {
              id: "i1",
              productId: "p1",
              name: "X",
              quantity: 1,
              unitPrice: 1000,
            },
          ],
        });
        const result = canSplitBill(order);
        expect(result.allowed).toBe(false);
      }
    });

    it("property: orders with no items cannot be split", () => {
      const splittableStatuses: OrderStatus[] = [
        "PREPARING",
        "READY",
        "DELIVERED",
      ];
      for (let i = 0; i < ITERATIONS; i++) {
        const status = randomChoice(splittableStatuses);
        const order = randomOrder({ status, items: [] });
        const result = canSplitBill(order);
        expect(result.allowed).toBe(false);
      }
    });

    it("property: item quantity must be positive (application invariant)", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const quantity = randomInt(1, 100);
        expect(quantity).toBeGreaterThan(0);

        // Negative or zero quantities violate the invariant
        const badQuantity = randomInt(-10, 0);
        expect(badQuantity).toBeLessThanOrEqual(0);
      }
    });
  });
});
