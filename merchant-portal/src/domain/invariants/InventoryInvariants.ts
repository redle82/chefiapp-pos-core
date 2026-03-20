/**
 * Inventory Invariants
 *
 * Pure business rules for waste recording and stock transfers.
 * No side effects, no DB calls, no React dependencies.
 *
 * Bounded Context: Inventory & Stock
 */

import type { InvariantResult } from "./OrderInvariants";

// ---------------------------------------------------------------------------
// Lightweight types consumed by invariants
// ---------------------------------------------------------------------------

export interface InventoryItemSnapshot {
  id: string;
  name: string;
  /** Current stock quantity (units). */
  currentStock: number;
}

export interface StockLocationSnapshot {
  id: string;
  name: string;
  /** Current stock for the specific product at this location. */
  availableQuantity: number;
}

// ---------------------------------------------------------------------------
// Invariants
// ---------------------------------------------------------------------------

/**
 * Waste can be recorded when:
 *  - The quantity is a positive number.
 *  - The item reference is valid (non-null).
 */
export function canRecordWaste(
  item: InventoryItemSnapshot | null | undefined,
  quantity: number,
): InvariantResult {
  if (!item) {
    return { allowed: false, reason: "Item does not exist." };
  }

  if (quantity <= 0) {
    return { allowed: false, reason: "Waste quantity must be greater than zero." };
  }

  if (!Number.isFinite(quantity)) {
    return { allowed: false, reason: "Waste quantity must be a finite number." };
  }

  return { allowed: true };
}

/**
 * Stock can be transferred between locations when:
 *  - The source and destination are different locations.
 *  - The source location has sufficient stock.
 *  - The quantity is a positive number.
 */
export function canTransferStock(
  from: StockLocationSnapshot,
  to: StockLocationSnapshot,
  quantity: number,
): InvariantResult {
  if (from.id === to.id) {
    return {
      allowed: false,
      reason: "Source and destination locations must be different.",
    };
  }

  if (quantity <= 0) {
    return {
      allowed: false,
      reason: "Transfer quantity must be greater than zero.",
    };
  }

  if (!Number.isFinite(quantity)) {
    return {
      allowed: false,
      reason: "Transfer quantity must be a finite number.",
    };
  }

  if (from.availableQuantity < quantity) {
    return {
      allowed: false,
      reason: `Insufficient stock at "${from.name}": available ${from.availableQuantity}, requested ${quantity}.`,
    };
  }

  return { allowed: true };
}
