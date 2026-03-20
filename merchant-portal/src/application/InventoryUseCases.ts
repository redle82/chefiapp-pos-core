/**
 * Inventory Use Cases
 *
 * Application Layer facade for inventory-related operations.
 * Orchestrates: domain invariants -> services -> domain events -> metrics.
 *
 * NO React imports. Pure TypeScript orchestration.
 *
 * Bounded Context: Inventory & Stock
 */

import {
  canRecordWaste,
  canTransferStock,
  type InventoryItemSnapshot,
  type StockLocationSnapshot,
} from "../domain/invariants/InventoryInvariants";
import {
  WasteTrackingService,
  type RecordWasteInput,
  type WasteLogEntry,
  type WasteReason,
} from "../core/inventory/WasteTrackingService";
import { transferStock as transferStockService } from "../core/multi-location/MultiLocationService";
import { emitDomainEvent } from "../domain/events/DomainEvents";
import { track } from "../analytics/track";
import { Logger } from "../core/logger";

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ---------------------------------------------------------------------------
// Param types
// ---------------------------------------------------------------------------

export interface RecordWasteParams {
  restaurantId: string;
  ingredientId: string;
  ingredientName: string;
  locationId?: string;
  quantity: number;
  unit: string;
  reason: WasteReason;
  costCents: number;
  notes?: string;
  operatorId?: string;
  operatorName?: string;
  /** Current stock for the ingredient (used for invariant check). */
  currentStock?: number;
}

export interface TransferStockParams {
  fromLocationId: string;
  fromLocationName: string;
  fromAvailableQuantity: number;
  toLocationId: string;
  toLocationName: string;
  toAvailableQuantity: number;
  productId: string;
  quantity: number;
  restaurantId: string;
  operatorId?: string;
}

// ---------------------------------------------------------------------------
// Service singleton
// ---------------------------------------------------------------------------

const wasteService = new WasteTrackingService();

// ---------------------------------------------------------------------------
// Use Cases
// ---------------------------------------------------------------------------

/**
 * Record a waste event and deduct from stock.
 *
 * 1. Validate canRecordWaste invariant.
 * 2. Record waste via WasteTrackingService.
 * 3. Emit WASTE_RECORDED domain event.
 * 4. Track metrics.
 */
export async function recordWaste(
  params: RecordWasteParams,
): Promise<Result<WasteLogEntry>> {
  // 1. Validate
  const itemSnapshot: InventoryItemSnapshot = {
    id: params.ingredientId,
    name: params.ingredientName,
    currentStock: params.currentStock ?? 0,
  };

  const check = canRecordWaste(itemSnapshot, params.quantity);
  if (!check.allowed) {
    return { success: false, error: check.reason };
  }

  // 2. Execute
  try {
    const input: RecordWasteInput = {
      restaurantId: params.restaurantId,
      ingredientId: params.ingredientId,
      locationId: params.locationId,
      quantity: params.quantity,
      unit: params.unit,
      reason: params.reason,
      costCents: params.costCents,
      notes: params.notes,
      operatorId: params.operatorId,
      operatorName: params.operatorName,
    };

    const entry = await wasteService.recordWaste(input);

    // 3. Emit domain event
    emitDomainEvent(
      {
        type: "WASTE_RECORDED",
        productId: params.ingredientId,
        quantity: params.quantity,
        reason: params.reason,
      },
      params.restaurantId,
      params.operatorId,
    );

    // 4. Metrics
    track("inventory.waste_recorded", {
      ingredientId: params.ingredientId,
      quantity: params.quantity,
      reason: params.reason,
      costCents: params.costCents,
      restaurantId: params.restaurantId,
    });

    return { success: true, data: entry };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error recording waste";
    Logger.error("[InventoryUseCases.recordWaste]", { error: message });
    return { success: false, error: message };
  }
}

/**
 * Transfer stock between two locations.
 *
 * 1. Validate canTransferStock invariant.
 * 2. Execute transfer via MultiLocationService.
 * 3. Emit STOCK_MOVEMENT domain events (out + in).
 * 4. Track metrics.
 */
export async function transferStock(
  params: TransferStockParams,
): Promise<Result<null>> {
  // 1. Validate
  const fromSnapshot: StockLocationSnapshot = {
    id: params.fromLocationId,
    name: params.fromLocationName,
    availableQuantity: params.fromAvailableQuantity,
  };

  const toSnapshot: StockLocationSnapshot = {
    id: params.toLocationId,
    name: params.toLocationName,
    availableQuantity: params.toAvailableQuantity,
  };

  const check = canTransferStock(fromSnapshot, toSnapshot, params.quantity);
  if (!check.allowed) {
    return { success: false, error: check.reason };
  }

  // 2. Execute
  try {
    const transferred = await transferStockService(
      params.fromLocationId,
      params.toLocationId,
      [{ ingredientId: params.productId, quantity: params.quantity }],
    );

    if (!transferred) {
      return { success: false, error: "Stock transfer failed." };
    }

    // 3. Emit domain events
    emitDomainEvent(
      {
        type: "STOCK_MOVEMENT",
        productId: params.productId,
        quantity: params.quantity,
        direction: "out",
      },
      params.restaurantId,
      params.operatorId,
    );

    emitDomainEvent(
      {
        type: "STOCK_MOVEMENT",
        productId: params.productId,
        quantity: params.quantity,
        direction: "in",
      },
      params.restaurantId,
      params.operatorId,
    );

    // 4. Metrics
    track("inventory.stock_transferred", {
      from: params.fromLocationId,
      to: params.toLocationId,
      productId: params.productId,
      quantity: params.quantity,
    });

    return { success: true, data: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error transferring stock";
    Logger.error("[InventoryUseCases.transferStock]", { error: message });
    return { success: false, error: message };
  }
}
