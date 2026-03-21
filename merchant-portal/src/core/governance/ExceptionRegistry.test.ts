/**
 * ExceptionRegistry — isAuthorized negative paths
 */

import { describe, expect, it } from "vitest";
import {
  EXCEPTION_REGISTRY,
  isAuthorized,
  type CallerTag,
} from "./ExceptionRegistry";

describe("ExceptionRegistry", () => {
  describe("isAuthorized — negative paths", () => {
    it("returns false when caller is not in registry", () => {
      expect(isAuthorized("UnknownCaller" as CallerTag, "gm_products", "INSERT")).toBe(false);
      expect(isAuthorized("RandomTag" as CallerTag, "gm_orders", "UPDATE")).toBe(false);
    });

    it("returns false when table is not in caller allowedTables", () => {
      // GenesisKernel does not have gm_orders
      expect(isAuthorized("GenesisKernel", "gm_orders", "INSERT")).toBe(false);
      // MenuAuthority does not have gm_restaurants
      expect(isAuthorized("MenuAuthority", "gm_restaurants", "INSERT")).toBe(false);
      // OrderContext does not have gm_restaurants
      expect(isAuthorized("OrderContext", "gm_restaurants", "INSERT")).toBe(false);
    });

    it("returns false when operation is not in caller allowedOperations", () => {
      // GenesisKernel has INSERT, UPDATE — not DELETE
      expect(isAuthorized("GenesisKernel", "gm_restaurants", "DELETE")).toBe(false);
      // BootstrapPage has INSERT only — not UPDATE
      expect(isAuthorized("BootstrapPage", "gm_restaurants", "UPDATE")).toBe(false);
      // MenuAuthority has INSERT, UPDATE, DELETE — not UPSERT
      expect(isAuthorized("MenuAuthority", "gm_products", "UPSERT")).toBe(false);
    });

    it("returns true when caller, table and operation match", () => {
      expect(isAuthorized("GenesisKernel", "gm_restaurants", "INSERT")).toBe(true);
      expect(isAuthorized("MenuAuthority", "gm_products", "INSERT")).toBe(true);
      expect(isAuthorized("OrderContext", "gm_orders", "INSERT")).toBe(true);
    });
  });

  describe("EXCEPTION_REGISTRY", () => {
    it("contains all expected caller tags", () => {
      const expected: CallerTag[] = [
        "GenesisKernel",
        "MenuAuthority",
        "TableAuthority",
        "BootstrapPage",
        "OnboardingQuick",
        "PublicPages",
        "WebOrderingService",
        "OrderIngestionPipeline",
        "OrderContext",
        "OrderProcessingService",
      ];
      for (const tag of expected) {
        expect(EXCEPTION_REGISTRY[tag]).toBeDefined();
        expect(EXCEPTION_REGISTRY[tag].reason).toBeTruthy();
        expect(Array.isArray(EXCEPTION_REGISTRY[tag].allowedTables)).toBe(true);
        expect(Array.isArray(EXCEPTION_REGISTRY[tag].allowedOperations)).toBe(true);
      }
    });
  });
});
