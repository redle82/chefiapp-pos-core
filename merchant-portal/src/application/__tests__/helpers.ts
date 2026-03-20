/**
 * Test Helpers — Factory functions and mocks for application layer tests.
 *
 * Provides deterministic test data builders and mock implementations
 * for all external services consumed by the use cases.
 */

import type { Order, OrderItem, Payment } from "../../domain/order/types";
import type { ShiftSnapshot } from "../../domain/invariants/StaffInvariants";
import type {
  ReservationSnapshot,
  CreateReservationData,
} from "../../domain/invariants/ReservationInvariants";
import type { DiscountDescriptor } from "../../domain/invariants/OrderInvariants";
import type {
  InventoryItemSnapshot,
  StockLocationSnapshot,
} from "../../domain/invariants/InventoryInvariants";
import type { UserRole } from "../../core/context/ContextTypes";

// ---------------------------------------------------------------------------
// Order factories
// ---------------------------------------------------------------------------

const DEFAULT_ITEM: OrderItem = {
  id: "item_1",
  productId: "prod_1",
  name: "Margherita Pizza",
  quantity: 1,
  unitPrice: 1200,
};

export function createMockOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "order_1",
    restaurantId: "rest_1",
    status: "OPEN",
    type: "dine_in",
    items: [{ ...DEFAULT_ITEM }],
    subtotal: 1200,
    tax: 120,
    discount: 0,
    total: 1320,
    createdAt: "2026-01-01T12:00:00Z",
    updatedAt: "2026-01-01T12:00:00Z",
    ...overrides,
  };
}

export function createMockOrderItem(
  overrides: Partial<OrderItem> = {},
): OrderItem {
  return { ...DEFAULT_ITEM, ...overrides };
}

// ---------------------------------------------------------------------------
// Payment factories
// ---------------------------------------------------------------------------

export function createMockPayment(
  overrides: Partial<Payment> = {},
): Payment {
  return {
    id: "pay_1",
    orderId: "order_1",
    amount: 1320,
    method: "card",
    status: "completed",
    createdAt: "2026-01-01T12:05:00Z",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Discount factories
// ---------------------------------------------------------------------------

export function createMockDiscount(
  overrides: Partial<DiscountDescriptor> = {},
): DiscountDescriptor {
  return {
    amountCents: 200,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Shift / Staff factories
// ---------------------------------------------------------------------------

export function createMockShift(
  overrides: Partial<ShiftSnapshot> = {},
): ShiftSnapshot {
  return {
    id: "shift_1",
    operator_id: "op_1",
    status: "active",
    clock_in: "2026-01-01T08:00:00Z",
    clock_out: null,
    breaks: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Inventory factories
// ---------------------------------------------------------------------------

export function createMockInventoryItem(
  overrides: Partial<InventoryItemSnapshot> = {},
): InventoryItemSnapshot {
  return {
    id: "ingredient_1",
    name: "Tomato",
    currentStock: 100,
    ...overrides,
  };
}

export function createMockStockLocation(
  overrides: Partial<StockLocationSnapshot> = {},
): StockLocationSnapshot {
  return {
    id: "loc_1",
    name: "Main Kitchen",
    availableQuantity: 50,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Reservation factories
// ---------------------------------------------------------------------------

export function createMockReservation(
  overrides: Partial<ReservationSnapshot> = {},
): ReservationSnapshot {
  return {
    id: "res_1",
    status: "confirmed",
    dateTime: "2026-06-15T19:00:00Z",
    partySize: 4,
    ...overrides,
  };
}

export function createMockReservationData(
  overrides: Partial<CreateReservationData> = {},
): CreateReservationData {
  return {
    dateTime: new Date(Date.now() + 86400000).toISOString(), // tomorrow
    partySize: 4,
    slotAvailable: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Roles helper
// ---------------------------------------------------------------------------

export const ROLES = {
  waiter: "waiter" as UserRole,
  kitchen: "kitchen" as UserRole,
  manager: "manager" as UserRole,
  owner: "owner" as UserRole,
};
