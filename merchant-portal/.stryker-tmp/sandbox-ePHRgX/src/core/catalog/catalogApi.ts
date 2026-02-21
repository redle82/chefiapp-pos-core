// @ts-nocheck
import { v4 as uuidv4 } from "uuid";
import { BackendType, getBackendType } from "../infra/backendAdapter";
import {
  readMenuCategories,
  readProducts,
  type CoreMenuCategory,
  type CoreProduct,
} from "../../infra/readers/RestaurantReader";
import {
  createMenuItem,
  updateMenuItem,
} from "../../infra/writers/MenuWriter";
import {
  type CatalogAssignment,
  type CatalogContext,
  type CatalogProduct,
  type Combo,
  type ExternalPlatform,
  type Modifier,
  type ModifierGroup,
  type ProductCategory,
  type SalesChannel,
  type TranslationItem,
} from "./catalogTypes";

/**
 * API de Catálogo (camada de boundary para o Admin).
 *
 * Quando restaurantId é passado e backend é Docker: produtos e categorias
 * vêm do Core (gm_products, gm_menu_categories) — mesma fonte que Menu Builder,
 * web do restaurante e TPV. Sem restaurantId ou backend não-Docker: fallback mock.
 */

// ---------------------------------------------------------------------------
// Mock state (in-memory) — fonte de verdade temporária
// ---------------------------------------------------------------------------

let catalogs: CatalogContext[] = [];
let assignments: CatalogAssignment[] = [];
let categories: ProductCategory[] = [];
let products: CatalogProduct[] = [];
let modifierGroups: ModifierGroup[] = [];
let modifiers: Modifier[] = [];
let combos: Combo[] = [];
let translations: TranslationItem[] = [];

function now() {
  return new Date().toISOString();
}

// Seed mínimo para não ficar tudo vazio em DEV
function ensureSeedData() {
  if (catalogs.length > 0) return;

  const trialCatalogId = uuidv4();
  const trialCategoryId = uuidv4();

  catalogs = [
    {
      id: trialCatalogId,
      name: "Catálogo Principal",
      brandId: null,
      destinations: ["LOCAL", "TAKEAWAY", "DELIVERY"],
      isActive: true,
      createdAt: now(),
      updatedAt: now(),
    },
  ];

  categories = [
    {
      id: trialCategoryId,
      name: "Bebidas",
      sortOrder: 1,
      createdAt: now(),
    },
  ];

  products = [
    {
      id: uuidv4(),
      name: "Café solo",
      categoryId: trialCategoryId,
      basePriceCents: 250,
      isActive: true,
      printerId: null,
      modifierGroupIds: [],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: uuidv4(),
      name: "Agua con gas 33cl",
      categoryId: trialCategoryId,
      basePriceCents: 320,
      isActive: true,
      printerId: null,
      modifierGroupIds: [],
      createdAt: now(),
      updatedAt: now(),
    },
  ];
}

// ---------------------------------------------------------------------------
// Catálogos
// ---------------------------------------------------------------------------

export async function listCatalogs(): Promise<CatalogContext[]> {
  ensureSeedData();
  return catalogs;
}

export async function saveCatalog(
  input: Omit<CatalogContext, "createdAt" | "updatedAt"> & {
    id?: string;
  },
): Promise<CatalogContext> {
  ensureSeedData();
  const id = input.id ?? uuidv4();
  const existing = catalogs.find((c) => c.id === id);

  if (existing) {
    const updated: CatalogContext = {
      ...existing,
      ...input,
      id,
      updatedAt: now(),
    };
    catalogs = catalogs.map((c) => (c.id === id ? updated : c));
    return updated;
  }

  const created: CatalogContext = {
    id,
    name: input.name,
    brandId: input.brandId ?? null,
    destinations: input.destinations ?? [],
    isActive: input.isActive ?? true,
    createdAt: now(),
    updatedAt: now(),
  };
  catalogs = [...catalogs, created];
  return created;
}

export async function duplicateCatalog(
  catalogId: string,
  overrides?: Partial<
    Pick<CatalogContext, "name" | "brandId" | "destinations">
  >,
): Promise<CatalogContext | null> {
  ensureSeedData();
  const base = catalogs.find((c) => c.id === catalogId);
  if (!base) return null;

  const copy: CatalogContext = {
    ...base,
    id: uuidv4(),
    name: overrides?.name ?? `${base.name} Copy`,
    brandId: overrides?.brandId ?? base.brandId,
    destinations: overrides?.destinations ?? base.destinations,
    isActive: base.isActive,
    createdAt: now(),
    updatedAt: now(),
  };
  catalogs = [...catalogs, copy];
  return copy;
}

export async function setCatalogActive(
  catalogId: string,
  isActive: boolean,
): Promise<void> {
  catalogs = catalogs.map((c) =>
    c.id === catalogId ? { ...c, isActive, updatedAt: now() } : c,
  );
}

// ---------------------------------------------------------------------------
// Atribuições
// ---------------------------------------------------------------------------

export async function listCatalogAssignments(): Promise<CatalogAssignment[]> {
  ensureSeedData();
  return assignments;
}

export async function upsertCatalogAssignment(params: {
  id?: string;
  brandId: string;
  channel: SalesChannel;
  platform?: ExternalPlatform;
  catalogId: string | null;
}): Promise<CatalogAssignment> {
  ensureSeedData();
  const id = params.id ?? uuidv4();
  const existing = assignments.find((a) => a.id === id);
  if (existing) {
    const updated: CatalogAssignment = {
      ...existing,
      ...params,
      id,
    };
    assignments = assignments.map((a) => (a.id === id ? updated : a));
    return updated;
  }

  const created: CatalogAssignment = {
    id,
    brandId: params.brandId,
    channel: params.channel,
    platform: params.platform,
    catalogId: params.catalogId,
  };
  assignments = [...assignments, created];
  return created;
}

// ---------------------------------------------------------------------------
// Categorias & Produtos (Core = gm_products + gm_menu_categories quando restaurantId + Docker)
// ---------------------------------------------------------------------------

function mapCoreCategoryToProductCategory(c: CoreMenuCategory): ProductCategory {
  return {
    id: c.id,
    name: c.name,
    sortOrder: (c as { sort_order?: number }).sort_order ?? 0,
    createdAt: (c as { created_at?: string }).created_at ?? now(),
  };
}

function mapCoreProductToCatalogProduct(p: CoreProduct): CatalogProduct {
  return {
    id: p.id,
    name: p.name,
    categoryId: p.category_id ?? null,
    basePriceCents: p.price_cents,
    isActive: p.available ?? true,
    station: p.station === "BAR" ? "BAR" : "KITCHEN",
    printerId: null,
    modifierGroupIds: [],
    createdAt: (p as { created_at?: string }).created_at ?? now(),
    updatedAt: (p as { updated_at?: string }).updated_at ?? now(),
  };
}

export async function listCategories(
  restaurantId?: string | null,
): Promise<ProductCategory[]> {
  if (restaurantId && getBackendType() === BackendType.docker) {
    const coreCats = await readMenuCategories(restaurantId);
    return coreCats.map(mapCoreCategoryToProductCategory);
  }
  ensureSeedData();
  return categories;
}

export async function listProducts(
  restaurantId?: string | null,
): Promise<CatalogProduct[]> {
  if (restaurantId && getBackendType() === BackendType.docker) {
    const coreProducts = await readProducts(restaurantId);
    return coreProducts.map(mapCoreProductToCatalogProduct);
  }
  ensureSeedData();
  return products;
}

export async function saveProduct(
  input: Omit<CatalogProduct, "createdAt" | "updatedAt"> & { id?: string },
  restaurantId?: string | null,
): Promise<CatalogProduct> {
  if (restaurantId && getBackendType() === BackendType.docker) {
    const id = input.id;
    const station =
      input.station === "BAR" || input.station === "KITCHEN"
        ? input.station
        : "KITCHEN";
    let payload = {
      category_id: input.categoryId ?? null,
      name: input.name,
      description: null as string | null,
      price_cents: input.basePriceCents,
      available: input.isActive ?? true,
      station: station as "BAR" | "KITCHEN",
      prep_time_minutes: 5,
      prep_category: "main" as const,
    };
    if (id) {
      const existing = await listProducts(restaurantId).then((list) =>
        list.find((p) => p.id === id),
      );
      payload = {
        ...payload,
        station: (input.station ?? existing?.station ?? "KITCHEN") as "BAR" | "KITCHEN",
      };
      await updateMenuItem(id, restaurantId, payload);
      return {
        ...input,
        station: payload.station,
        id,
        createdAt: (input as CatalogProduct).createdAt ?? now(),
        updatedAt: now(),
      };
    }
    const { id: newId } = await createMenuItem(restaurantId, payload);
    return {
      ...input,
      station: payload.station,
      id: newId,
      createdAt: now(),
      updatedAt: now(),
    };
  }
  ensureSeedData();
  const id = input.id ?? uuidv4();
  const existing = products.find((p) => p.id === id);
  const base: CatalogProduct = {
    id,
    name: input.name,
    categoryId: input.categoryId ?? null,
    basePriceCents: input.basePriceCents,
    isActive: input.isActive ?? true,
    printerId: input.printerId ?? null,
    modifierGroupIds: input.modifierGroupIds ?? [],
    createdAt: existing?.createdAt ?? now(),
    updatedAt: now(),
  };

  if (existing) {
    products = products.map((p) => (p.id === id ? base : p));
  } else {
    products = [...products, base];
  }

  return base;
}

export async function toggleProductActive(
  productId: string,
  isActive: boolean,
  restaurantId?: string | null,
): Promise<void> {
  if (restaurantId && getBackendType() === BackendType.docker) {
    const all = await readProducts(restaurantId);
    const p = all.find((x) => x.id === productId);
    if (!p) return;
    const core = p as CoreProduct & { station?: string; prep_category?: string };
    await updateMenuItem(productId, restaurantId, {
      name: p.name,
      description: p.description ?? null,
      price_cents: p.price_cents,
      category_id: p.category_id ?? null,
      available: isActive,
      station: (core.station === "BAR" ? "BAR" : "KITCHEN") as "BAR" | "KITCHEN",
      prep_time_minutes: 5,
      prep_category: (core.prep_category as "drink" | "starter" | "main" | "dessert") ?? "main",
    });
    return;
  }
  products = products.map((p) =>
    p.id === productId ? { ...p, isActive, updatedAt: now() } : p,
  );
}

// ---------------------------------------------------------------------------
// Modificadores
// ---------------------------------------------------------------------------

export async function listModifierGroups(): Promise<ModifierGroup[]> {
  return modifierGroups;
}

export async function listModifiers(): Promise<Modifier[]> {
  return modifiers;
}

export async function saveModifierGroup(
  input: Omit<ModifierGroup, "createdAt" | "updatedAt"> & { id?: string },
): Promise<ModifierGroup> {
  const id = input.id ?? uuidv4();
  const existing = modifierGroups.find((g) => g.id === id);
  const base: ModifierGroup = {
    id,
    name: input.name,
    min: input.min,
    max: input.max,
    createdAt: existing?.createdAt ?? now(),
    updatedAt: now(),
  };
  if (existing) {
    modifierGroups = modifierGroups.map((g) => (g.id === id ? base : g));
  } else {
    modifierGroups = [...modifierGroups, base];
  }
  return base;
}

export async function saveModifier(
  input: Omit<Modifier, "createdAt" | "updatedAt"> & { id?: string },
): Promise<Modifier> {
  const id = input.id ?? uuidv4();
  const existing = modifiers.find((m) => m.id === id);
  const base: Modifier = {
    id,
    groupId: input.groupId,
    name: input.name,
    priceDeltaCents: input.priceDeltaCents,
    isActive: input.isActive ?? true,
    createdAt: existing?.createdAt ?? now(),
    updatedAt: now(),
  };
  if (existing) {
    modifiers = modifiers.map((m) => (m.id === id ? base : m));
  } else {
    modifiers = [...modifiers, base];
  }
  return base;
}

// ---------------------------------------------------------------------------
// Combos
// ---------------------------------------------------------------------------

export async function listCombos(): Promise<Combo[]> {
  return combos;
}

export async function saveCombo(
  input: Omit<Combo, "createdAt" | "updatedAt"> & { id?: string },
): Promise<Combo> {
  const id = input.id ?? uuidv4();
  const existing = combos.find((c) => c.id === id);
  const base: Combo = {
    id,
    name: input.name,
    priceCents: input.priceCents,
    isActive: input.isActive ?? true,
    items: input.items ?? [],
    createdAt: existing?.createdAt ?? now(),
    updatedAt: now(),
  };
  if (existing) {
    combos = combos.map((c) => (c.id === id ? base : c));
  } else {
    combos = [...combos, base];
  }
  return base;
}

export async function toggleComboActive(
  comboId: string,
  isActive: boolean,
): Promise<void> {
  combos = combos.map((c) =>
    c.id === comboId ? { ...c, isActive, updatedAt: now() } : c,
  );
}

// ---------------------------------------------------------------------------
// Traduções
// ---------------------------------------------------------------------------

export async function listTranslations(): Promise<TranslationItem[]> {
  return translations;
}

export async function saveTranslation(
  input: Omit<TranslationItem, "createdAt" | "updatedAt"> & { id?: string },
): Promise<TranslationItem> {
  const id = input.id ?? uuidv4();
  const existing = translations.find((t) => t.id === id);
  const base: TranslationItem = {
    id,
    ...input,
    createdAt: existing?.createdAt ?? now(),
    updatedAt: now(),
  };
  if (existing) {
    translations = translations.map((t) => (t.id === id ? base : t));
  } else {
    translations = [...translations, base];
  }
  return base;
}
