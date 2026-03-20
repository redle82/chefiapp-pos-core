/**
 * Property Tests for Inventory Invariants
 *
 * Validates inventory domain rules across randomly generated inputs.
 */

import { describe, it, expect } from "vitest";
import { canRecordWaste, canTransferStock } from "../InventoryInvariants";
import type {
  InventoryItemSnapshot,
  StockLocationSnapshot,
} from "../InventoryInvariants";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(
  overrides: Partial<InventoryItemSnapshot> = {},
): InventoryItemSnapshot {
  return {
    id: `item-${randomInt(1, 99999)}`,
    name: `Item ${randomInt(1, 100)}`,
    currentStock: randomInt(0, 1000),
    ...overrides,
  };
}

function randomLocation(
  overrides: Partial<StockLocationSnapshot> = {},
): StockLocationSnapshot {
  return {
    id: `loc-${randomInt(1, 99999)}`,
    name: `Location ${randomInt(1, 100)}`,
    availableQuantity: randomInt(0, 1000),
    ...overrides,
  };
}

const ITERATIONS = 200;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("InventoryInvariants — property tests", () => {
  describe("canRecordWaste — waste quantity must be positive", () => {
    it("property: positive finite quantity with valid item is always accepted", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const item = randomItem();
        const quantity = randomInt(1, 500);
        const result = canRecordWaste(item, quantity);
        expect(result.allowed).toBe(true);
      }
    });

    it("property: zero quantity is always rejected", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const item = randomItem();
        const result = canRecordWaste(item, 0);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("greater than zero");
      }
    });

    it("property: negative quantity is always rejected", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const item = randomItem();
        const quantity = -(randomInt(1, 500));
        const result = canRecordWaste(item, quantity);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("greater than zero");
      }
    });

    it("property: null item is always rejected", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const quantity = randomInt(1, 500);
        const result = canRecordWaste(null, quantity);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("does not exist");
      }
    });

    it("property: non-finite quantity is always rejected", () => {
      const nonFinite = [Infinity, -Infinity, NaN];
      for (const q of nonFinite) {
        const item = randomItem();
        const result = canRecordWaste(item, q);
        // NaN and -Infinity fail the > 0 check; Infinity fails the isFinite check
        expect(result.allowed).toBe(false);
      }
    });
  });

  describe("canTransferStock — stock cannot go negative after deduction", () => {
    it("property: transfer exceeding available stock is always rejected", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const available = randomInt(1, 100);
        const from = randomLocation({
          id: "loc-source",
          availableQuantity: available,
        });
        const to = randomLocation({ id: "loc-dest" });
        const quantity = available + randomInt(1, 100);
        const result = canTransferStock(from, to, quantity);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("Insufficient stock");
      }
    });

    it("property: transfer exactly equal to available stock is accepted", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const available = randomInt(1, 1000);
        const from = randomLocation({
          id: "loc-source",
          availableQuantity: available,
        });
        const to = randomLocation({ id: "loc-dest" });
        const result = canTransferStock(from, to, available);
        expect(result.allowed).toBe(true);
      }
    });

    it("property: transfer within available stock is accepted", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const available = randomInt(10, 1000);
        const quantity = randomInt(1, available);
        const from = randomLocation({
          id: "loc-source",
          availableQuantity: available,
        });
        const to = randomLocation({ id: "loc-dest" });
        const result = canTransferStock(from, to, quantity);
        expect(result.allowed).toBe(true);

        // Verify stock does not go negative
        const remaining = available - quantity;
        expect(remaining).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("canTransferStock — source and destination must differ", () => {
    it("property: same source and destination is always rejected", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const locationId = `loc-${randomInt(1, 100)}`;
        const from = randomLocation({
          id: locationId,
          availableQuantity: randomInt(10, 1000),
        });
        const to = randomLocation({ id: locationId });
        const quantity = randomInt(1, from.availableQuantity);
        const result = canTransferStock(from, to, quantity);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("different");
      }
    });

    it("property: different source and destination with valid quantity is accepted", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const fromId = `loc-${randomInt(1, 50)}`;
        const toId = `loc-${randomInt(51, 100)}`; // guaranteed different range
        const available = randomInt(10, 1000);
        const quantity = randomInt(1, available);
        const from = randomLocation({
          id: fromId,
          availableQuantity: available,
        });
        const to = randomLocation({ id: toId });
        const result = canTransferStock(from, to, quantity);
        expect(result.allowed).toBe(true);
      }
    });
  });

  describe("transfer quantity invariants", () => {
    it("property: zero transfer quantity is rejected", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const from = randomLocation({
          id: "loc-1",
          availableQuantity: randomInt(10, 1000),
        });
        const to = randomLocation({ id: "loc-2" });
        const result = canTransferStock(from, to, 0);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("greater than zero");
      }
    });

    it("property: negative transfer quantity is rejected", () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const from = randomLocation({
          id: "loc-1",
          availableQuantity: randomInt(10, 1000),
        });
        const to = randomLocation({ id: "loc-2" });
        const quantity = -(randomInt(1, 500));
        const result = canTransferStock(from, to, quantity);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("greater than zero");
      }
    });

    it("property: non-finite transfer quantity is rejected", () => {
      const nonFinite = [Infinity, -Infinity, NaN];
      for (const q of nonFinite) {
        const from = randomLocation({
          id: "loc-1",
          availableQuantity: 100,
        });
        const to = randomLocation({ id: "loc-2" });
        const result = canTransferStock(from, to, q);
        expect(result.allowed).toBe(false);
      }
    });
  });
});
