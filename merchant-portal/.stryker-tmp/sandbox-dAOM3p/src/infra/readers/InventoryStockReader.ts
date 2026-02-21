/**
 * InventoryStockReader — Leituras de inventário e estoque do Core.
 * gm_locations, gm_equipment, gm_ingredients, gm_stock_levels, gm_product_bom,
 * gm_equipment_ingredients.
 */
// @ts-nocheck


import { dockerCoreClient } from "../docker-core/connection";

export interface CoreLocation {
  id: string;
  restaurant_id: string;
  name: string;
  kind: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Categorias funcionais de equipamento.
 */
export type EquipmentCategory =
  | "COOKING"
  | "STORAGE"
  | "PREPARATION"
  | "BEVERAGE"
  | "CLEANING"
  | "SERVICE"
  | "SYSTEM"
  | "OTHER";

/**
 * Todos os kinds de equipamento suportados pelo DB.
 */
export type EquipmentKind =
  // Armazenamento (temperature-controlled)
  | "FRIDGE"
  | "FREEZER"
  | "WALK_IN_COOLER"
  | "WALK_IN_FREEZER"
  | "WINE_COOLER"
  // Cooking
  | "OVEN"
  | "CONVECTION_OVEN"
  | "PIZZA_OVEN"
  | "GRILL"
  | "CHARCOAL_GRILL"
  | "PLANCHA"
  | "FRYER"
  | "DEEP_FRYER"
  | "STEAM_OVEN"
  | "COMBI_OVEN"
  | "SALAMANDER"
  | "INDUCTION_COOKER"
  | "GAS_RANGE"
  | "WOK_BURNER"
  // Beverage
  | "COFFEE_MACHINE"
  | "ESPRESSO_MACHINE"
  | "ICE_MACHINE"
  | "KEG_SYSTEM"
  | "DRAFT_TOWER"
  | "BLENDER"
  | "JUICER"
  | "SODA_FOUNTAIN"
  // Preparation
  | "FOOD_PROCESSOR"
  | "MIXER"
  | "SLICER"
  | "VACUUM_SEALER"
  | "SOUS_VIDE"
  | "DOUGH_SHEETER"
  | "MEAT_GRINDER"
  | "SCALE"
  // Storage (non-temperature)
  | "SHELF"
  | "DRY_STORAGE"
  | "SPICE_RACK"
  | "CONTAINER"
  // Cleaning
  | "DISHWASHER"
  | "GLASS_WASHER"
  | "SINK"
  // Service
  | "WARMING_STATION"
  | "BAIN_MARIE"
  | "HOT_PLATE"
  | "DISPLAY_CASE"
  | "PASS_WINDOW"
  // System/Digital
  | "TPV"
  | "KDS"
  | "PRINTER"
  | "TABLET"
  // Generic
  | "OTHER";

export interface CoreEquipment {
  id: string;
  restaurant_id: string;
  location_id?: string | null;
  name: string;
  kind: EquipmentKind;
  category?: EquipmentCategory | null;
  description?: string | null;
  capacity_note?: string | null;
  ideal_temp_min?: number | null;
  ideal_temp_max?: number | null;
  brand?: string | null;
  model?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  // Joined data (optional)
  location?: CoreLocation | null;
  stored_ingredients?: EquipmentIngredientRow[];
}

/**
 * Mapa equipamento → ingrediente armazenado.
 */
export interface EquipmentIngredientRow {
  id: string;
  restaurant_id: string;
  equipment_id: string;
  ingredient_id: string;
  notes?: string | null;
  created_at?: string;
  // Joined
  ingredient?: CoreIngredient | null;
}

/**
 * Categorias de ingrediente — alinhadas com CHECK do DB.
 */
export type IngredientCategory =
  | "HORTALIÇA"
  | "PROTEÍNA"
  | "SECO"
  | "LATICÍNIO"
  | "BEBIDA"
  | "CONDIMENTO"
  | "CONGELADO"
  | "OUTRO";

export const INGREDIENT_CATEGORY_LABELS: Record<IngredientCategory, string> = {
  HORTALIÇA: "🥬 Hortaliças",
  PROTEÍNA: "🥩 Proteínas",
  SECO: "🌾 Secos",
  LATICÍNIO: "🧀 Laticínios",
  BEBIDA: "🍷 Bebidas",
  CONDIMENTO: "🧂 Condimentos",
  CONGELADO: "❄️ Congelados",
  OUTRO: "📦 Outro",
};

export const INGREDIENT_CATEGORY_OPTIONS: {
  value: IngredientCategory;
  label: string;
}[] = (Object.keys(INGREDIENT_CATEGORY_LABELS) as IngredientCategory[]).map(
  (cat) => ({ value: cat, label: INGREDIENT_CATEGORY_LABELS[cat] }),
);

export interface CoreIngredient {
  id: string;
  restaurant_id: string;
  name: string;
  unit: "g" | "kg" | "ml" | "l" | "unit";
  /** Categoria funcional do ingrediente */
  category?: IngredientCategory | null;
  /** Unidade de compra (ex: "caixa 10kg") */
  purchase_unit?: string | null;
  /** Fator de conversão purchase_unit → unit (default 1) */
  conversion_factor?: number;
  /** Ingrediente perecível? */
  perishable?: boolean;
  /** Prazo de validade em dias */
  shelf_life_days?: number | null;
  /** Código de barras EAN/UPC */
  barcode?: string | null;
  /** Código do fornecedor */
  supplier_code?: string | null;
  /** Custo médio ponderado por unit (€) */
  cost_per_unit?: number;
  created_at?: string;
  updated_at?: string;
}

export interface StockLevelRow {
  id: string;
  restaurant_id: string;
  location_id: string;
  ingredient_id: string;
  qty: number;
  min_qty: number;
  updated_at?: string;
}

export interface StockAlertRow {
  id: string;
  restaurant_id: string;
  location_id: string;
  ingredient_id: string;
  ingredient_name?: string;
  location_name?: string;
  qty: number;
  min_qty: number;
  updated_at?: string;
}

// ─── Labels legíveis ───

export const EQUIPMENT_KIND_LABELS: Record<EquipmentKind, string> = {
  FRIDGE: "Geladeira",
  FREEZER: "Congelador",
  WALK_IN_COOLER: "Câmara Fria",
  WALK_IN_FREEZER: "Câmara Congelada",
  WINE_COOLER: "Adega Climatizada",
  OVEN: "Forno",
  CONVECTION_OVEN: "Forno Convecção",
  PIZZA_OVEN: "Forno de Pizza",
  GRILL: "Grelha",
  CHARCOAL_GRILL: "Churrasqueira",
  PLANCHA: "Chapa/Plancha",
  FRYER: "Fritadeira",
  DEEP_FRYER: "Fritadeira Industrial",
  STEAM_OVEN: "Forno a Vapor",
  COMBI_OVEN: "Forno Combinado",
  SALAMANDER: "Salamandra",
  INDUCTION_COOKER: "Fogão Indução",
  GAS_RANGE: "Fogão a Gás",
  WOK_BURNER: "Queimador Wok",
  COFFEE_MACHINE: "Máquina Café",
  ESPRESSO_MACHINE: "Máquina Espresso",
  ICE_MACHINE: "Máquina de Gelo",
  KEG_SYSTEM: "Sistema de Barris",
  DRAFT_TOWER: "Torre de Chopp",
  BLENDER: "Liquidificador",
  JUICER: "Espremedor",
  SODA_FOUNTAIN: "Máquina de Refrigerante",
  FOOD_PROCESSOR: "Processador",
  MIXER: "Batedeira",
  SLICER: "Fatiadora",
  VACUUM_SEALER: "Seladora a Vácuo",
  SOUS_VIDE: "Sous Vide",
  DOUGH_SHEETER: "Laminadora de Massa",
  MEAT_GRINDER: "Moedor de Carne",
  SCALE: "Balança",
  SHELF: "Prateleira",
  DRY_STORAGE: "Estoque Seco",
  SPICE_RACK: "Porta-Temperos",
  CONTAINER: "Recipiente/Container",
  DISHWASHER: "Lava-Louças",
  GLASS_WASHER: "Lava-Copos",
  SINK: "Pia",
  WARMING_STATION: "Estação de Aquecimento",
  BAIN_MARIE: "Banho-Maria",
  HOT_PLATE: "Chapa Quente",
  DISPLAY_CASE: "Vitrine",
  PASS_WINDOW: "Passador",
  TPV: "Terminal de Venda (TPV)",
  KDS: "Ecrã Cozinha (KDS)",
  PRINTER: "Impressora",
  TABLET: "Tablet",
  OTHER: "Outro",
};

export const EQUIPMENT_CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  COOKING: "🔥 Cozinha",
  STORAGE: "❄️ Armazenamento",
  PREPARATION: "🔪 Preparação",
  BEVERAGE: "☕ Bebidas",
  CLEANING: "🧹 Limpeza",
  SERVICE: "🍽️ Serviço",
  SYSTEM: "💻 Sistema",
  OTHER: "📦 Outro",
};

/**
 * Opções de kind agrupadas por categoria (para select no form).
 */
export function getEquipmentKindOptions(): {
  value: EquipmentKind;
  label: string;
  category: EquipmentCategory;
}[] {
  const categoryForKind = (kind: EquipmentKind): EquipmentCategory => {
    if (
      [
        "FRIDGE",
        "FREEZER",
        "WALK_IN_COOLER",
        "WALK_IN_FREEZER",
        "WINE_COOLER",
        "SHELF",
        "DRY_STORAGE",
        "SPICE_RACK",
        "CONTAINER",
      ].includes(kind)
    )
      return "STORAGE";
    if (
      [
        "OVEN",
        "CONVECTION_OVEN",
        "PIZZA_OVEN",
        "GRILL",
        "CHARCOAL_GRILL",
        "PLANCHA",
        "FRYER",
        "DEEP_FRYER",
        "STEAM_OVEN",
        "COMBI_OVEN",
        "SALAMANDER",
        "INDUCTION_COOKER",
        "GAS_RANGE",
        "WOK_BURNER",
      ].includes(kind)
    )
      return "COOKING";
    if (
      [
        "COFFEE_MACHINE",
        "ESPRESSO_MACHINE",
        "ICE_MACHINE",
        "KEG_SYSTEM",
        "DRAFT_TOWER",
        "BLENDER",
        "JUICER",
        "SODA_FOUNTAIN",
      ].includes(kind)
    )
      return "BEVERAGE";
    if (
      [
        "FOOD_PROCESSOR",
        "MIXER",
        "SLICER",
        "VACUUM_SEALER",
        "SOUS_VIDE",
        "DOUGH_SHEETER",
        "MEAT_GRINDER",
        "SCALE",
      ].includes(kind)
    )
      return "PREPARATION";
    if (["DISHWASHER", "GLASS_WASHER", "SINK"].includes(kind))
      return "CLEANING";
    if (
      [
        "WARMING_STATION",
        "BAIN_MARIE",
        "HOT_PLATE",
        "DISPLAY_CASE",
        "PASS_WINDOW",
      ].includes(kind)
    )
      return "SERVICE";
    if (["TPV", "KDS", "PRINTER", "TABLET"].includes(kind)) return "SYSTEM";
    return "OTHER";
  };
  return (Object.keys(EQUIPMENT_KIND_LABELS) as EquipmentKind[]).map(
    (kind) => ({
      value: kind,
      label: EQUIPMENT_KIND_LABELS[kind],
      category: categoryForKind(kind),
    }),
  );
}

export async function readLocations(
  restaurantId: string,
): Promise<CoreLocation[]> {
  const { data, error } = await dockerCoreClient
    .from("gm_locations")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("name", { ascending: true });
  if (error) return [];
  return (data ?? []) as CoreLocation[];
}

export async function readEquipment(
  restaurantId: string,
): Promise<CoreEquipment[]> {
  const { data, error } = await dockerCoreClient
    .from("gm_equipment")
    .select(
      "id, restaurant_id, location_id, name, kind, category, description, capacity_note, ideal_temp_min, ideal_temp_max, brand, model, is_active, created_at, updated_at",
    )
    .eq("restaurant_id", restaurantId)
    .order("name", { ascending: true });
  if (error) return [];
  return (data ?? []) as CoreEquipment[];
}

/**
 * Lê os mapeamentos equipamento → ingrediente.
 */
export async function readEquipmentIngredients(
  restaurantId: string,
): Promise<EquipmentIngredientRow[]> {
  const { data, error } = await dockerCoreClient
    .from("gm_equipment_ingredients")
    .select("id, restaurant_id, equipment_id, ingredient_id, notes, created_at")
    .eq("restaurant_id", restaurantId);
  if (error) return [];
  return (data ?? []) as EquipmentIngredientRow[];
}

// ─── CRUD — Equipment ───

export interface EquipmentInput {
  restaurant_id: string;
  location_id?: string | null;
  name: string;
  kind: EquipmentKind;
  category?: EquipmentCategory | null;
  description?: string | null;
  capacity_note?: string | null;
  ideal_temp_min?: number | null;
  ideal_temp_max?: number | null;
  brand?: string | null;
  model?: string | null;
  is_active?: boolean;
}

export async function createEquipment(
  input: EquipmentInput,
): Promise<CoreEquipment | null> {
  const { data, error } = await dockerCoreClient
    .from("gm_equipment")
    .insert({ ...input, is_active: input.is_active ?? true })
    .select()
    .single();
  if (error) {
    console.error("[createEquipment]", error);
    return null;
  }
  return data as CoreEquipment;
}

export async function updateEquipment(
  id: string,
  updates: Partial<EquipmentInput>,
): Promise<CoreEquipment | null> {
  const { data, error } = await dockerCoreClient
    .from("gm_equipment")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    console.error("[updateEquipment]", error);
    return null;
  }
  return data as CoreEquipment;
}

export async function deleteEquipment(id: string): Promise<boolean> {
  const { error } = await dockerCoreClient
    .from("gm_equipment")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("[deleteEquipment]", error);
    return false;
  }
  return true;
}

// ─── CRUD — Equipment ↔ Ingredient mapping ───

export async function addIngredientToEquipment(
  restaurantId: string,
  equipmentId: string,
  ingredientId: string,
  notes?: string,
): Promise<EquipmentIngredientRow | null> {
  const { data, error } = await dockerCoreClient
    .from("gm_equipment_ingredients")
    .insert({
      restaurant_id: restaurantId,
      equipment_id: equipmentId,
      ingredient_id: ingredientId,
      notes: notes ?? null,
    })
    .select()
    .single();
  if (error) {
    console.error("[addIngredientToEquipment]", error);
    return null;
  }
  return data as EquipmentIngredientRow;
}

export async function removeIngredientFromEquipment(
  id: string,
): Promise<boolean> {
  const { error } = await dockerCoreClient
    .from("gm_equipment_ingredients")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("[removeIngredientFromEquipment]", error);
    return false;
  }
  return true;
}

export async function readIngredients(
  restaurantId: string,
): Promise<CoreIngredient[]> {
  const { data, error } = await dockerCoreClient
    .from("gm_ingredients")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("name", { ascending: true });
  if (error) return [];
  return (data ?? []) as CoreIngredient[];
}

export async function readStockLevels(
  restaurantId: string,
): Promise<StockLevelRow[]> {
  const { data, error } = await dockerCoreClient
    .from("gm_stock_levels")
    .select("*")
    .eq("restaurant_id", restaurantId);
  if (error) return [];
  return (data ?? []) as StockLevelRow[];
}

export async function readProductBOM(restaurantId: string): Promise<unknown[]> {
  const { data, error } = await dockerCoreClient
    .from("gm_product_bom")
    .select("*")
    .eq("restaurant_id", restaurantId);
  if (error) return [];
  return (data ?? []) as unknown[];
}

// ─── Barcode RPCs ───

export interface BarcodeLookupResult {
  found: boolean;
  ingredient_id?: string;
  name?: string;
  unit?: string;
  category?: IngredientCategory | null;
  cost_per_unit?: number;
}

/**
 * Procura um ingrediente pelo código de barras.
 */
export async function lookupIngredientByBarcode(
  restaurantId: string,
  barcode: string,
): Promise<BarcodeLookupResult> {
  const { data, error } = await dockerCoreClient.rpc(
    "lookup_ingredient_by_barcode",
    { p_restaurant_id: restaurantId, p_barcode: barcode },
  );
  if (error) {
    console.error("[lookupIngredientByBarcode]", error);
    return { found: false };
  }
  return (data as BarcodeLookupResult) ?? { found: false };
}

/**
 * Associa um barcode a um ingrediente existente.
 */
export async function associateBarcode(
  ingredientId: string,
  barcode: string,
): Promise<boolean> {
  const { error } = await dockerCoreClient.rpc("associate_barcode", {
    p_ingredient_id: ingredientId,
    p_barcode: barcode,
  });
  if (error) {
    console.error("[associateBarcode]", error);
    return false;
  }
  return true;
}

// ─── Preset Packs RPCs ───

export interface PresetPack {
  pack: string;
  count: number;
}

export interface ImportPackResult {
  imported: number;
  skipped: number;
  total_in_pack: number;
}

/**
 * Lista os packs de ingredientes pré-configurados.
 */
export async function listIngredientPacks(): Promise<PresetPack[]> {
  const { data, error } = await dockerCoreClient.rpc("list_ingredient_packs");
  if (error) {
    console.error("[listIngredientPacks]", error);
    return [];
  }
  return (data ?? []) as PresetPack[];
}

/**
 * Importa um pack de ingredientes para o restaurante.
 */
export async function importIngredientPack(
  restaurantId: string,
  pack: string,
): Promise<ImportPackResult | null> {
  const { data, error } = await dockerCoreClient.rpc("import_ingredient_pack", {
    p_restaurant_id: restaurantId,
    p_pack: pack,
  });
  if (error) {
    console.error("[importIngredientPack]", error);
    return null;
  }
  return data as ImportPackResult;
}

/**
 * Alertas de estoque (qty <= min_qty e min_qty > 0).
 */
export async function readStockAlerts(
  restaurantId: string,
): Promise<StockAlertRow[]> {
  const { data, error } = await dockerCoreClient
    .from("gm_stock_levels")
    .select(
      "id, restaurant_id, location_id, ingredient_id, qty, min_qty, updated_at",
    )
    .eq("restaurant_id", restaurantId)
    .filter("min_qty", "gt", 0);
  if (error) return [];
  const rows = (data ?? []) as StockLevelRow[];
  const low = rows.filter((r) => Number(r.qty) <= Number(r.min_qty));
  const ingredients = await readIngredients(restaurantId);
  const locations = await readLocations(restaurantId);
  const ingMap = new Map(ingredients.map((i) => [i.id, i.name]));
  const locMap = new Map(locations.map((l) => [l.id, l.name]));
  return low.map((r) => ({
    ...r,
    ingredient_name: ingMap.get(r.ingredient_id),
    location_name: locMap.get(r.location_id),
  })) as StockAlertRow[];
}
