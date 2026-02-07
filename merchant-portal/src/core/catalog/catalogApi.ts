import { v4 as uuidv4 } from "uuid";
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
 * Implementação inicial: in-memory mock, pronta para ser trocada
 * por chamadas reais ao Core / Supabase quando o backend estiver pronto.
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

  const demoCatalogId = uuidv4();
  const demoCategoryId = uuidv4();

  catalogs = [
    {
      id: demoCatalogId,
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
      id: demoCategoryId,
      name: "Bebidas",
      sortOrder: 1,
      createdAt: now(),
    },
  ];

  products = [
    {
      id: uuidv4(),
      name: "Café solo",
      categoryId: demoCategoryId,
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
      categoryId: demoCategoryId,
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
// Categorias & Produtos
// ---------------------------------------------------------------------------

export async function listCategories(): Promise<ProductCategory[]> {
  ensureSeedData();
  return categories;
}

export async function listProducts(): Promise<CatalogProduct[]> {
  ensureSeedData();
  return products;
}

export async function saveProduct(
  input: Omit<CatalogProduct, "createdAt" | "updatedAt"> & { id?: string },
): Promise<CatalogProduct> {
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
): Promise<void> {
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
