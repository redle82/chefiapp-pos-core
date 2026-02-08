/**
 * Menu Preset Reader — Presets por tipo de negócio (ORE-governado).
 * Ver docs/architecture/MENU_BUILDER_CONTRACT_V1.md.
 * Quando existir endpoint ORE/Core para preset, este reader passará a fazer fetch.
 */

import type { MenuItemInput } from "../../core/contracts/Menu";

export type BusinessType =
  | "cafe_bar"
  | "restaurante"
  | "fast_food"
  | "pizzaria"
  | "bar_noturno"
  | "padaria"
  | "outro";

function item(
  name: string,
  price_cents: number,
  station: "BAR" | "KITCHEN",
  prep_min: number,
  prep_category: "drink" | "starter" | "main" | "dessert" = "main"
): MenuItemInput {
  return {
    name,
    description: null,
    price_cents,
    category_id: null,
    station,
    prep_time_minutes: prep_min,
    prep_category,
    available: true,
  };
}

const PRESET_CAFE_BAR: MenuItemInput[] = [
  item("Café", 180, "BAR", 2, "drink"),
  item("Água", 150, "BAR", 1, "drink"),
  item("Água com gás", 170, "BAR", 1, "drink"),
  item("Refrigerante", 250, "BAR", 1, "drink"),
  item("Cerveja", 300, "BAR", 1, "drink"),
];

const PRESET_RESTAURANTE: MenuItemInput[] = [
  item("Água", 150, "BAR", 1, "drink"),
  item("Vinho tinto (copa)", 350, "BAR", 1, "drink"),
  item("Vinho branco (copa)", 350, "BAR", 1, "drink"),
  item("Cerveja", 300, "BAR", 1, "drink"),
  item("Entrada do dia", 650, "KITCHEN", 10, "starter"),
  item("Prato do dia", 1200, "KITCHEN", 15, "main"),
  item("Sobremesa", 450, "KITCHEN", 5, "dessert"),
];

const PRESET_FAST_FOOD: MenuItemInput[] = [
  item("Refrigerante", 250, "BAR", 1, "drink"),
  item("Água", 150, "BAR", 1, "drink"),
  item("Hambúrguer simples", 650, "KITCHEN", 8, "main"),
  item("Batatas fritas", 250, "KITCHEN", 5, "main"),
  item("Menu combo", 850, "KITCHEN", 10, "main"),
];

const PRESET_PIZZARIA: MenuItemInput[] = [
  item("Refrigerante", 250, "BAR", 1, "drink"),
  item("Cerveja", 300, "BAR", 1, "drink"),
  item("Pizza Margherita", 850, "KITCHEN", 12, "main"),
  item("Pizza Pepperoni", 950, "KITCHEN", 12, "main"),
  item("Salada", 450, "KITCHEN", 5, "starter"),
];

const PRESET_BAR_NOTURNO: MenuItemInput[] = [
  item("Cerveja", 300, "BAR", 1, "drink"),
  item("Vinho (copa)", 350, "BAR", 1, "drink"),
  item("Destilado", 500, "BAR", 1, "drink"),
  item("Cocktail", 800, "BAR", 3, "drink"),
  item("Água", 150, "BAR", 1, "drink"),
];

const PRESET_PADARIA: MenuItemInput[] = [
  item("Café", 180, "BAR", 2, "drink"),
  item("Água", 150, "BAR", 1, "drink"),
  item("Sumo", 350, "BAR", 1, "drink"),
  item("Croissant", 250, "KITCHEN", 0, "main"),
  item("Sandes", 450, "KITCHEN", 5, "main"),
];

const PRESET_OUTRO: MenuItemInput[] = [
  item("Água", 150, "BAR", 1, "drink"),
  item("Café", 180, "BAR", 2, "drink"),
  item("Refrigerante", 250, "BAR", 1, "drink"),
  item("Item 1", 500, "KITCHEN", 5, "main"),
  item("Item 2", 750, "KITCHEN", 8, "main"),
];

/**
 * Devolve o preset de itens para o tipo de negócio.
 * Fonte = ORE/Core quando existir endpoint; até lá lista estática por contrato.
 */
export function getMenuPresetByBusinessType(
  businessType: BusinessType
): MenuItemInput[] {
  switch (businessType) {
    case "cafe_bar":
      return [...PRESET_CAFE_BAR];
    case "restaurante":
      return [...PRESET_RESTAURANTE];
    case "fast_food":
      return [...PRESET_FAST_FOOD];
    case "pizzaria":
      return [...PRESET_PIZZARIA];
    case "bar_noturno":
      return [...PRESET_BAR_NOTURNO];
    case "padaria":
      return [...PRESET_PADARIA];
    case "outro":
    default:
      return [...PRESET_OUTRO];
  }
}

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  cafe_bar: "Café / Bar",
  restaurante: "Restaurante",
  fast_food: "Fast food",
  pizzaria: "Pizzaria",
  bar_noturno: "Bar noturno",
  padaria: "Padaria",
  outro: "Outro",
};
