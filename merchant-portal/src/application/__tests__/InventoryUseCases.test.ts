/**
 * Contract Tests — InventoryUseCases
 *
 * Validates the application layer's orchestration of domain invariants,
 * service calls, domain events, and metrics for inventory operations.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockStockLocation } from "./helpers";

// ---------------------------------------------------------------------------
// Mock all external dependencies
// ---------------------------------------------------------------------------

const { mockRecordWasteFn } = vi.hoisted(() => ({
  mockRecordWasteFn: vi.fn(),
}));

vi.mock("../../core/inventory/WasteTrackingService", () => ({
  WasteTrackingService: class {
    recordWaste = mockRecordWasteFn;
  },
}));

vi.mock("../../core/multi-location/MultiLocationService", () => ({
  transferStock: vi.fn(),
}));

vi.mock("../../domain/events/DomainEvents", () => ({
  emitDomainEvent: vi.fn(),
}));

vi.mock("../../analytics/track", () => ({
  track: vi.fn(),
}));

vi.mock("../../core/logger", () => ({
  Logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

// Import after mocks
import { recordWaste, transferStock } from "../InventoryUseCases";
import { transferStock as transferStockService } from "../../core/multi-location/MultiLocationService";

const mockedTransferStockService = vi.mocked(transferStockService);

// ---------------------------------------------------------------------------
// recordWaste
// ---------------------------------------------------------------------------

describe("recordWaste", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates canRecordWaste — succeeds with valid data", async () => {
    mockRecordWasteFn.mockResolvedValue({
      id: "waste_1",
      ingredientId: "ingredient_1",
      quantity: 5,
      reason: "expired",
      costCents: 500,
      createdAt: "2026-01-01T12:00:00Z",
    });

    const result = await recordWaste({
      restaurantId: "rest_1",
      ingredientId: "ingredient_1",
      ingredientName: "Tomato",
      quantity: 5,
      unit: "kg",
      reason: "expired" as any,
      costCents: 500,
      currentStock: 100,
    });

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty("id", "waste_1");
  });

  it("fails with zero quantity", async () => {
    const result = await recordWaste({
      restaurantId: "rest_1",
      ingredientId: "ingredient_1",
      ingredientName: "Tomato",
      quantity: 0,
      unit: "kg",
      reason: "expired" as any,
      costCents: 0,
      currentStock: 100,
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/greater than zero/i);
    expect(mockRecordWasteFn).not.toHaveBeenCalled();
  });

  it("fails with negative quantity", async () => {
    const result = await recordWaste({
      restaurantId: "rest_1",
      ingredientId: "ingredient_1",
      ingredientName: "Tomato",
      quantity: -3,
      unit: "kg",
      reason: "expired" as any,
      costCents: 0,
      currentStock: 100,
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/greater than zero/i);
  });
});

// ---------------------------------------------------------------------------
// transferStock
// ---------------------------------------------------------------------------

describe("transferStock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates canTransferStock — succeeds with different locations and sufficient stock", async () => {
    mockedTransferStockService.mockResolvedValue(true as any);

    const result = await transferStock({
      fromLocationId: "loc_1",
      fromLocationName: "Main Kitchen",
      fromAvailableQuantity: 50,
      toLocationId: "loc_2",
      toLocationName: "Bar",
      toAvailableQuantity: 10,
      productId: "prod_1",
      quantity: 5,
      restaurantId: "rest_1",
    });

    expect(result.success).toBe(true);
  });

  it("fails when source equals destination", async () => {
    const result = await transferStock({
      fromLocationId: "loc_1",
      fromLocationName: "Main Kitchen",
      fromAvailableQuantity: 50,
      toLocationId: "loc_1",
      toLocationName: "Main Kitchen",
      toAvailableQuantity: 50,
      productId: "prod_1",
      quantity: 5,
      restaurantId: "rest_1",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/different/i);
    expect(mockedTransferStockService).not.toHaveBeenCalled();
  });

  it("fails when source has insufficient stock", async () => {
    const result = await transferStock({
      fromLocationId: "loc_1",
      fromLocationName: "Main Kitchen",
      fromAvailableQuantity: 3,
      toLocationId: "loc_2",
      toLocationName: "Bar",
      toAvailableQuantity: 10,
      productId: "prod_1",
      quantity: 5,
      restaurantId: "rest_1",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/insufficient/i);
  });

  it("fails with zero quantity", async () => {
    const result = await transferStock({
      fromLocationId: "loc_1",
      fromLocationName: "Main Kitchen",
      fromAvailableQuantity: 50,
      toLocationId: "loc_2",
      toLocationName: "Bar",
      toAvailableQuantity: 10,
      productId: "prod_1",
      quantity: 0,
      restaurantId: "rest_1",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/greater than zero/i);
  });
});
