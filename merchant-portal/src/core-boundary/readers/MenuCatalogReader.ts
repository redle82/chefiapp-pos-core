/**
 * MENU CATALOG READER — Leitura do catálogo visual (Docker Core)
 *
 * Schema: gm_restaurants.menu_catalog_enabled, gm_catalog_menus, gm_catalog_categories, gm_catalog_items
 * Spec: MENU_CATALOG_VISUAL_SPEC.md; Contrato: MENU_VISUAL_RUNTIME_CONTRACT.md
 */

import type {
  CatalogCategory,
  CatalogItem,
  MenuRestaurant,
} from "../../pages/MenuCatalog/types";
import { dockerCoreClient } from "../docker-core/connection";

interface GmRestaurant {
  id: string;
  name: string;
  menu_catalog_enabled?: boolean;
}

interface GmCatalogMenu {
  id: string;
  restaurant_id: string;
  name: string;
  language: string;
  is_active: boolean;
}

interface GmCatalogCategory {
  id: string;
  menu_id: string;
  title: string;
  sort_order: number;
}

interface GmCatalogItem {
  id: string;
  category_id: string;
  title: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  video_url: string | null;
  allergens: unknown;
  badges?: unknown;
  is_available: boolean;
  sort_order: number;
}

function parseAllergens(raw: unknown): string[] {
  if (Array.isArray(raw))
    return raw.map((a) => (a != null ? String(a) : "")).filter(Boolean);
  if (raw != null && typeof raw === "object" && "allergens" in (raw as object))
    return parseAllergens((raw as { allergens: unknown }).allergens);
  return [];
}

function parseBadges(raw: unknown): string[] {
  if (Array.isArray(raw))
    return raw.map((a) => (a != null ? String(a) : "")).filter(Boolean);
  return [];
}

function mapItem(row: GmCatalogItem): CatalogItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    priceCents: row.price_cents,
    imageUrl: row.image_url ?? "",
    allergens: parseAllergens(row.allergens),
    badges: row.badges != null ? parseBadges(row.badges) : undefined,
    mediaPreview: row.video_url ?? undefined,
    mediaFull: row.video_url ?? undefined,
  };
}

/**
 * Lê o catálogo visual do menu para um restaurante (Docker Core).
 * Usa select("id,name") na primeira query para evitar 400 quando a coluna
 * menu_catalog_enabled ainda não existe (migração não aplicada). Retorna null
 * se não existir menu ativo ou erro (tabelas do catálogo em falta).
 */
export async function readMenuCatalog(restaurantId: string): Promise<{
  restaurant: MenuRestaurant;
  categories: CatalogCategory[];
} | null> {
  try {
    // Apenas id,name para evitar 400 quando menu_catalog_enabled não existe (migração não aplicada)
    const restaurantRes = await dockerCoreClient
      .from("gm_restaurants")
      .select("id,name")
      .eq("id", restaurantId)
      .maybeSingle();

    if (restaurantRes.error || !restaurantRes.data) return null;
    const restaurantRow = restaurantRes.data as GmRestaurant;

    // Try ordering by updated_at first; fallback to no ordering if column
    // doesn't exist yet (migration not applied).
    let menuRes = await dockerCoreClient
      .from("gm_catalog_menus")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (menuRes.error?.code === "42703") {
      // column updated_at does not exist — retry without ordering
      menuRes = await dockerCoreClient
        .from("gm_catalog_menus")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
    }

    if (menuRes.error || !menuRes.data) return null;
    const menu = menuRes.data as GmCatalogMenu;

    const categoriesRes = await dockerCoreClient
      .from("gm_catalog_categories")
      .select("*")
      .eq("menu_id", menu.id)
      .order("sort_order", { ascending: true });

    if (categoriesRes.error || !categoriesRes.data) return null;
    const categoryRows = (categoriesRes.data as GmCatalogCategory[]).filter(
      Boolean,
    );
    if (categoryRows.length === 0) {
      return {
        restaurant: {
          name: restaurantRow.name,
          language: menu.language ?? undefined,
        },
        categories: [],
      };
    }

    const categoryIds = categoryRows.map((c) => c.id);
    const itemsRes = await dockerCoreClient
      .from("gm_catalog_items")
      .select("*")
      .in("category_id", categoryIds)
      .eq("is_available", true)
      .order("sort_order", { ascending: true });

    const itemRows: GmCatalogItem[] =
      itemsRes.error || !itemsRes.data
        ? []
        : (itemsRes.data as GmCatalogItem[]);
    const itemsByCategory = new Map<string, CatalogItem[]>();
    for (const item of itemRows) {
      const list = itemsByCategory.get(item.category_id) ?? [];
      list.push(mapItem(item));
      itemsByCategory.set(item.category_id, list);
    }

    const categories: CatalogCategory[] = categoryRows.map((c) => ({
      id: c.id,
      title: c.title,
      items: itemsByCategory.get(c.id) ?? [],
    }));

    const restaurant: MenuRestaurant = {
      name: restaurantRow.name,
      language: menu.language ?? undefined,
    };

    return { restaurant, categories };
  } catch {
    return null;
  }
}
