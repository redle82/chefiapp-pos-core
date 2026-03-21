/**
 * Tests for core/catalog/catalogApi.ts — mock/in-memory path
 *
 * Tests the full CRUD lifecycle using the in-memory mock state
 * (when backendType is not docker). Covers catalogs, categories,
 * products, modifiers, combos, translations, and assignments.
 */
import { describe, expect, it, vi } from "vitest";

// Force non-docker backend so catalogApi uses mock/in-memory state
vi.mock("../infra/backendAdapter", () => ({
  BackendType: { docker: "docker", none: "none" },
  getBackendType: () => "none",
}));

// Mock reader/writer - not needed for mock path but must exist
vi.mock("../../infra/readers/RestaurantReader", () => ({
  readMenuCategories: vi.fn(),
  readProducts: vi.fn(),
}));
vi.mock("../../infra/writers/MenuWriter", () => ({
  createMenuItem: vi.fn(),
  updateMenuItem: vi.fn(),
}));

import {
  duplicateCatalog,
  listCatalogAssignments,
  listCatalogs,
  listCategories,
  listCombos,
  listModifierGroups,
  listModifiers,
  listProducts,
  listTranslations,
  saveCatalog,
  saveCombo,
  saveModifier,
  saveModifierGroup,
  saveProduct,
  saveTranslation,
  setCatalogActive,
  toggleComboActive,
  toggleProductActive,
  upsertCatalogAssignment,
} from "./catalogApi";

describe("catalogApi — mock/in-memory path", () => {
  // Note: catalogApi uses module-level state. Tests within a single run
  // share state, so we test in a sequence that builds on previous data.

  // ── Catalogs ──────────────────────────────────────────────────────
  describe("catalogs", () => {
    it("seeds data on first listCatalogs call", async () => {
      const catalogs = await listCatalogs();
      expect(catalogs.length).toBeGreaterThanOrEqual(1);
      expect(catalogs[0].name).toBe("Catálogo Principal");
    });

    it("creates a new catalog", async () => {
      const catalog = await saveCatalog({
        name: "Menu Almoço",
        brandId: null,
        destinations: ["LOCAL"],
        isActive: true,
      });
      expect(catalog.id).toBeTruthy();
      expect(catalog.name).toBe("Menu Almoço");
      expect(catalog.destinations).toEqual(["LOCAL"]);
    });

    it("updates an existing catalog", async () => {
      const list = await listCatalogs();
      const first = list[0];
      const updated = await saveCatalog({
        id: first.id,
        name: "Catálogo Atualizado",
        brandId: null,
        destinations: ["DELIVERY"],
        isActive: false,
      });
      expect(updated.id).toBe(first.id);
      expect(updated.name).toBe("Catálogo Atualizado");
    });

    it("duplicates a catalog", async () => {
      const list = await listCatalogs();
      const copy = await duplicateCatalog(list[0].id, {
        name: "Copy Catálogo",
      });
      expect(copy).not.toBeNull();
      expect(copy!.name).toBe("Copy Catálogo");
      expect(copy!.id).not.toBe(list[0].id);
    });

    it("returns null when duplicating non-existent catalog", async () => {
      const result = await duplicateCatalog("non-existent-id");
      expect(result).toBeNull();
    });

    it("toggles catalog active state", async () => {
      const list = await listCatalogs();
      await setCatalogActive(list[0].id, false);
      const updated = await listCatalogs();
      const found = updated.find((c) => c.id === list[0].id);
      expect(found?.isActive).toBe(false);
    });
  });

  // ── Assignments ──────────────────────────────────────────────────
  describe("assignments", () => {
    it("starts empty", async () => {
      const assignments = await listCatalogAssignments();
      expect(Array.isArray(assignments)).toBe(true);
    });

    it("creates an assignment", async () => {
      const catalogs = await listCatalogs();
      const assignment = await upsertCatalogAssignment({
        brandId: "brand-1",
        channel: "LOCAL",
        catalogId: catalogs[0].id,
      });
      expect(assignment.id).toBeTruthy();
      expect(assignment.channel).toBe("LOCAL");
    });

    it("updates an existing assignment", async () => {
      const list = await listCatalogAssignments();
      const existing = list[0];
      const updated = await upsertCatalogAssignment({
        id: existing.id,
        brandId: "brand-2",
        channel: "DELIVERY",
        catalogId: existing.catalogId,
      });
      expect(updated.id).toBe(existing.id);
      expect(updated.channel).toBe("DELIVERY");
    });
  });

  // ── Categories (mock path) ──────────────────────────────────────
  describe("categories", () => {
    it("returns seed categories for mock path", async () => {
      const cats = await listCategories(null);
      expect(cats.length).toBeGreaterThanOrEqual(1);
      expect(cats[0].name).toBe("Bebidas");
    });

    it("returns seed categories when no restaurantId", async () => {
      const cats = await listCategories();
      expect(cats.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Products (mock path) ────────────────────────────────────────
  describe("products", () => {
    it("returns seed products for mock path", async () => {
      const prods = await listProducts(null);
      expect(prods.length).toBeGreaterThanOrEqual(2);
    });

    it("creates a new product (mock path)", async () => {
      const product = await saveProduct(
        {
          name: "Cerveja Artesanal",
          categoryId: null,
          basePriceCents: 450,
          isActive: true,
          printerId: null,
          modifierGroupIds: [],
        },
        null,
      );
      expect(product.id).toBeTruthy();
      expect(product.name).toBe("Cerveja Artesanal");
    });

    it("updates an existing product (mock path)", async () => {
      const prods = await listProducts(null);
      const first = prods[0];
      const updated = await saveProduct(
        {
          id: first.id,
          name: "Café cortado",
          categoryId: first.categoryId,
          basePriceCents: 300,
          isActive: true,
          printerId: null,
          modifierGroupIds: [],
        },
        null,
      );
      expect(updated.id).toBe(first.id);
      expect(updated.name).toBe("Café cortado");
    });

    it("toggles product active (mock path)", async () => {
      const prods = await listProducts(null);
      await toggleProductActive(prods[0].id, false, null);
      const updated = await listProducts(null);
      const found = updated.find((p) => p.id === prods[0].id);
      expect(found?.isActive).toBe(false);
    });
  });

  // ── Modifiers ─────────────────────────────────────────────────────
  describe("modifiers", () => {
    let groupId: string;

    it("creates a modifier group", async () => {
      const group = await saveModifierGroup({
        name: "Tamanho",
        min: 1,
        max: 1,
      });
      expect(group.id).toBeTruthy();
      groupId = group.id;
    });

    it("updates a modifier group", async () => {
      const groups = await listModifierGroups();
      const updated = await saveModifierGroup({
        id: groups[0].id,
        name: "Tamanho (atualizado)",
        min: 0,
        max: 2,
      });
      expect(updated.name).toBe("Tamanho (atualizado)");
    });

    it("creates a modifier", async () => {
      const groups = await listModifierGroups();
      const modifier = await saveModifier({
        groupId: groups[0].id,
        name: "Grande",
        priceDeltaCents: 100,
        isActive: true,
      });
      expect(modifier.id).toBeTruthy();
      expect(modifier.priceDeltaCents).toBe(100);
    });

    it("updates a modifier", async () => {
      const mods = await listModifiers();
      const updated = await saveModifier({
        id: mods[0].id,
        groupId: mods[0].groupId,
        name: "Extra Grande",
        priceDeltaCents: 200,
        isActive: true,
      });
      expect(updated.name).toBe("Extra Grande");
    });
  });

  // ── Combos ────────────────────────────────────────────────────────
  describe("combos", () => {
    it("creates a combo", async () => {
      const combo = await saveCombo({
        name: "Combo Almoço",
        priceCents: 1200,
        isActive: true,
        items: [{ productId: "p1", qty: 1 }],
      });
      expect(combo.id).toBeTruthy();
      expect(combo.priceCents).toBe(1200);
    });

    it("updates a combo", async () => {
      const combos = await listCombos();
      const updated = await saveCombo({
        id: combos[0].id,
        name: "Combo Premium",
        priceCents: 1500,
        isActive: true,
        items: [],
      });
      expect(updated.name).toBe("Combo Premium");
    });

    it("toggles combo active", async () => {
      const combos = await listCombos();
      await toggleComboActive(combos[0].id, false);
      const updated = await listCombos();
      expect(updated[0].isActive).toBe(false);
    });
  });

  // ── Translations ──────────────────────────────────────────────────
  describe("translations", () => {
    it("starts empty", async () => {
      const list = await listTranslations();
      expect(Array.isArray(list)).toBe(true);
    });

    it("creates a translation", async () => {
      const t = await saveTranslation({
        entityType: "product",
        entityId: "p1",
        locale: "en",
        field: "name",
        value: "Solo Coffee",
      });
      expect(t.id).toBeTruthy();
      expect(t.value).toBe("Solo Coffee");
    });

    it("updates a translation", async () => {
      const list = await listTranslations();
      const updated = await saveTranslation({
        id: list[0].id,
        entityType: "product",
        entityId: "p1",
        locale: "en",
        field: "name",
        value: "Espresso Coffee",
      });
      expect(updated.value).toBe("Espresso Coffee");
    });
  });
});
