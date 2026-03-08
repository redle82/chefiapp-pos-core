/**
 * Menu Domain Types
 *
 * Tipos para o domínio de menu (catálogo operacional).
 * Sem dependências de React ou infraestrutura.
 * Ref: docs/architecture/MENU_BUILDER_CONTRACT_V1.md
 */

export type MenuType = "RESTAURANT" | "BAR" | "CAFE";

export type MenuStation = "BAR" | "KITCHEN";

export type PrepCategory =
  | "drink"
  | "starter"
  | "main"
  | "dessert"
  | null
  | undefined;

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description?: string | null;
  price_cents: number;
  station: MenuStation;
  prep_time_seconds: number;
  prep_category?: PrepCategory;
  available: boolean;
  canon_id?: string | null;
  system_provided?: boolean;
  brand_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface Menu {
  restaurant_id: string;
  categories: MenuCategory[];
  items: MenuItem[];
}

export interface MenuItemInput {
  id?: string;
  name: string;
  description?: string | null;
  price_cents: number;
  category_id?: string | null;
  station: MenuStation;
  prep_time_minutes: number;
  prep_category?: "drink" | "starter" | "main" | "dessert";
  available?: boolean;
  canon_id?: string | null;
  system_provided?: boolean;
  brand_id?: string | null;
}
