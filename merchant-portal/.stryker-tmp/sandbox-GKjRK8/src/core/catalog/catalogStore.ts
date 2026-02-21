import { create } from "zustand";

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
  setCatalogActive as apiSetCatalogActive,
  toggleComboActive as apiToggleComboActive,
  toggleProductActive as apiToggleProductActive,
  upsertCatalogAssignment,
} from "./catalogApi";
import {
  type CatalogAssignment,
  type CatalogContext,
  type CatalogProduct,
  type Combo,
  type Modifier,
  type ModifierGroup,
  type ProductCategory,
  type TranslationItem,
} from "./catalogTypes";

interface CatalogState {
  loading: boolean;
  error: string | null;
  /** Quando definido e backend Docker: produtos/categorias vêm do Core (gm_products). */
  restaurantId: string | null;

  catalogs: CatalogContext[];
  assignments: CatalogAssignment[];
  categories: ProductCategory[];
  products: CatalogProduct[];
  modifierGroups: ModifierGroup[];
  modifiers: Modifier[];
  combos: Combo[];
  translations: TranslationItem[];

  // Loaders (restaurantId = Core; sem restaurantId = mock)
  loadAll: (restaurantId?: string | null) => Promise<void>;
  reloadCatalogs: () => Promise<void>;
  reloadProducts: (restaurantId?: string | null) => Promise<void>;
  setRestaurantId: (id: string | null) => void;

  // Catalog actions
  upsertCatalog: (
    input: Omit<CatalogContext, "createdAt" | "updatedAt"> & { id?: string },
  ) => Promise<CatalogContext>;
  duplicateCatalog: (catalogId: string) => Promise<CatalogContext | null>;
  setCatalogActive: (catalogId: string, isActive: boolean) => Promise<void>;

  // Assignment actions
  upsertAssignment: (assignment: {
    id?: string;
    brandId: string;
    channel: CatalogAssignment["channel"];
    platform?: CatalogAssignment["platform"];
    catalogId: string | null;
  }) => Promise<CatalogAssignment>;

  // Product actions (restaurantId para persistir no Core)
  upsertProduct: (
    input: Omit<CatalogProduct, "createdAt" | "updatedAt"> & { id?: string },
    restaurantId?: string | null,
  ) => Promise<CatalogProduct>;
  toggleProductActive: (
    productId: string,
    isActive: boolean,
    restaurantId?: string | null,
  ) => Promise<void>;

  // Modifier actions
  upsertModifierGroup: (
    input: Omit<ModifierGroup, "createdAt" | "updatedAt"> & { id?: string },
  ) => Promise<ModifierGroup>;
  upsertModifier: (
    input: Omit<Modifier, "createdAt" | "updatedAt"> & { id?: string },
  ) => Promise<Modifier>;

  // Combo actions
  upsertCombo: (
    input: Omit<Combo, "createdAt" | "updatedAt"> & { id?: string },
  ) => Promise<Combo>;
  toggleComboActive: (comboId: string, isActive: boolean) => Promise<void>;

  // Translation actions
  upsertTranslation: (
    input: Omit<TranslationItem, "createdAt" | "updatedAt"> & { id?: string },
  ) => Promise<TranslationItem>;
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  loading: false,
  error: null,
  restaurantId: null,

  catalogs: [],
  assignments: [],
  categories: [],
  products: [],
  modifierGroups: [],
  modifiers: [],
  combos: [],
  translations: [],

  setRestaurantId(id) {
    set({ restaurantId: id });
  },

  async loadAll(restaurantId) {
    const rid = restaurantId ?? get().restaurantId;
    if (rid) set({ restaurantId: rid });
    try {
      set({ loading: true, error: null });
      const [
        catalogsData,
        assignmentsData,
        categoriesData,
        productsData,
        groupsData,
        modifiersData,
        combosData,
        translationsData,
      ] = await Promise.all([
        listCatalogs(),
        listCatalogAssignments(),
        listCategories(rid ?? undefined),
        listProducts(rid ?? undefined),
        listModifierGroups(),
        listModifiers(),
        listCombos(),
        listTranslations(),
      ]);

      set({
        catalogs: catalogsData,
        assignments: assignmentsData,
        categories: categoriesData,
        products: productsData,
        modifierGroups: groupsData,
        modifiers: modifiersData,
        combos: combosData,
        translations: translationsData,
        loading: false,
        error: null,
      });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Erro ao carregar dados de catálogo";
      set({ error: message, loading: false });
    }
  },

  async reloadCatalogs() {
    try {
      const [catalogsData, assignmentsData] = await Promise.all([
        listCatalogs(),
        listCatalogAssignments(),
      ]);
      set({ catalogs: catalogsData, assignments: assignmentsData });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Erro ao recarregar catálogos";
      set({ error: message });
    }
  },

  async reloadProducts(restaurantId) {
    const rid = restaurantId ?? get().restaurantId;
    try {
      const [productsData, categoriesData] = await Promise.all([
        listProducts(rid ?? undefined),
        listCategories(rid ?? undefined),
      ]);
      set({ products: productsData, categories: categoriesData });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Erro ao recarregar produtos";
      set({ error: message });
    }
  },

  async upsertCatalog(input) {
    const saved = await saveCatalog(input);
    const catalogsData = await listCatalogs();
    set({ catalogs: catalogsData });
    return saved;
  },

  async duplicateCatalog(catalogId) {
    const copy = await duplicateCatalog(catalogId);
    if (copy) {
      const catalogsData = await listCatalogs();
      set({ catalogs: catalogsData });
    }
    return copy;
  },

  async setCatalogActive(catalogId, isActive) {
    await apiSetCatalogActive(catalogId, isActive);
    const catalogsData = await listCatalogs();
    set({ catalogs: catalogsData });
  },

  async upsertAssignment(params) {
    const saved = await upsertCatalogAssignment(params);
    const assignmentsData = await listCatalogAssignments();
    set({ assignments: assignmentsData });
    return saved;
  },

  async upsertProduct(input, restaurantId) {
    const rid = restaurantId ?? get().restaurantId;
    const saved = await saveProduct(input, rid ?? undefined);
    const productsData = await listProducts(rid ?? undefined);
    set({ products: productsData });
    return saved;
  },

  async toggleProductActive(productId, isActive, restaurantId) {
    const rid = restaurantId ?? get().restaurantId;
    await apiToggleProductActive(productId, isActive, rid ?? undefined);
    const productsData = await listProducts(rid ?? undefined);
    set({ products: productsData });
  },

  async upsertModifierGroup(input) {
    const saved = await saveModifierGroup(input);
    const groupsData = await listModifierGroups();
    set({ modifierGroups: groupsData });
    return saved;
  },

  async upsertModifier(input) {
    const saved = await saveModifier(input);
    const modifiersData = await listModifiers();
    set({ modifiers: modifiersData });
    return saved;
  },

  async upsertCombo(input) {
    const saved = await saveCombo(input);
    const combosData = await listCombos();
    set({ combos: combosData });
    return saved;
  },

  async toggleComboActive(comboId, isActive) {
    await apiToggleComboActive(comboId, isActive);
    const combosData = await listCombos();
    set({ combos: combosData });
  },

  async upsertTranslation(input) {
    const saved = await saveTranslation(input);
    const translationsData = await listTranslations();
    set({ translations: translationsData });
    return saved;
  },
}));
