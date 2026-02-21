/**
 * MenuPresetReader — Presets de menu por tipo de negócio (exemplos para Menu Builder).
 */

import type { MenuItemInput } from "../../core/contracts/Menu";

export type BusinessType =
  | "cafe_bar"
  | "restaurant"
  | "bar"
  | "cafe"
  | "retail"
  | "fast_food";

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  cafe_bar: "Café / Bar",
  restaurant: "Restaurante",
  bar: "Bar",
  cafe: "Café",
  retail: "Retalho",
  fast_food: "Fast Food",
};

const PRESETS: Record<BusinessType, MenuItemInput[]> = {
  cafe_bar: [
    { name: "Café", description: "", price_cents: 120, station: "BAR", prep_time_minutes: 2, prep_category: "drink", available: true },
    { name: "Sumo Laranja", description: "", price_cents: 250, station: "BAR", prep_time_minutes: 2, prep_category: "drink", available: true },
    { name: "Tosta Mista", description: "", price_cents: 350, station: "KITCHEN", prep_time_minutes: 5, prep_category: "main", available: true },
  ],
  restaurant: [
    { name: "Sopa do Dia", description: "", price_cents: 350, station: "KITCHEN", prep_time_minutes: 10, prep_category: "starter", available: true },
    { name: "Bife à Marrare", description: "", price_cents: 1450, station: "KITCHEN", prep_time_minutes: 15, prep_category: "main", available: true },
    { name: "Água 33cl", description: "", price_cents: 150, station: "BAR", prep_time_minutes: 1, prep_category: "drink", available: true },
  ],
  bar: [
    { name: "Cerveja 33cl", description: "", price_cents: 200, station: "BAR", prep_time_minutes: 1, prep_category: "drink", available: true },
    { name: "Vinho Tinto Copo", description: "", price_cents: 350, station: "BAR", prep_time_minutes: 1, prep_category: "drink", available: true },
  ],
  cafe: [
    { name: "Café", description: "", price_cents: 120, station: "BAR", prep_time_minutes: 2, prep_category: "drink", available: true },
    { name: "Croissant", description: "", price_cents: 220, station: "KITCHEN", prep_time_minutes: 2, prep_category: "main", available: true },
  ],
  retail: [],
  fast_food: [
    { name: "Hambúrguer", description: "", price_cents: 650, station: "KITCHEN", prep_time_minutes: 8, prep_category: "main", available: true },
    { name: "Batatas Fritas", description: "", price_cents: 250, station: "KITCHEN", prep_time_minutes: 5, prep_category: "main", available: true },
  ],
};

export function getMenuPresetByBusinessType(
  businessType: BusinessType
): MenuItemInput[] {
  return PRESETS[businessType] ?? [];
}
