/**
 * Repository Types
 *
 * Core entity types for in-memory repository.
 *
 * MONETARY VALUES: All monetary fields use CENTS (integers).
 * - €12.34 → 1234
 * - $100.00 → 10000
 * This prevents floating-point precision errors in financial calculations.
 */

export interface Session {
  id: string;
  state: "INACTIVE" | "ACTIVE" | "CLOSED";
  opened_at?: Date;
  closed_at?: Date;
  version: number; // Optimistic concurrency
}

export interface Order {
  id: string;
  table_id?: string;
  session_id: string;
  state: "OPEN" | "LOCKED" | "PAID" | "CLOSED" | "CANCELED";
  total_cents?: number; // Set when LOCKED, immutable after. In CENTS.
  version: number; // Optimistic concurrency
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string; // External reference
  name: string; // Snapshot of product name
  quantity: number;
  price_snapshot_cents: number; // Immutable after creation. In CENTS.
  subtotal_cents: number; // Calculated: quantity × price_snapshot_cents. In CENTS.
}

export interface Payment {
  id: string;
  order_id: string;
  session_id: string;
  method: string; // External enum
  amount_cents: number; // In CENTS
  state: "PENDING" | "CONFIRMED" | "FAILED" | "CANCELED";
  version: number; // Optimistic concurrency
}

export interface CashRegister {
  id: string;
  restaurant_id: string;
  name: string;
  state: "CLOSED" | "OPEN";
  opening_balance_cents: number;
  current_balance_cents: number; // Dynamic: opening + adds - drops
  total_sales_cents: number;
  opened_by?: string;
  opened_at?: Date;
  version: number;
}

export interface Transaction {
  id: string;
  snapshot: Map<string, any>; // Snapshot of entities before transaction
  changes: Map<string, any>; // Changes to be applied
}
