import { db } from "../../../../core/db";
import { Logger } from "../../../../core/logger/Logger";

export interface CatalogItem {
  id: string;
  restaurant_id: string;
  name: string;
  price_cents: number;
  category?: string;
  active: boolean;
}

export class CatalogService {
  static async listProducts(restaurantId: string): Promise<CatalogItem[]> {
    const { data, error } = await db
      .from("gm_catalog_items")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("name");

    if (error) {
      Logger.error("[CatalogService] listProducts failed", error);
      return [];
    }
    return (data as CatalogItem[]) ?? [];
  }

  static async getProduct(id: string): Promise<CatalogItem | null> {
    const { data, error } = await db
      .from("gm_catalog_items")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      Logger.error("[CatalogService] getProduct failed", error);
      return null;
    }
    return data as CatalogItem;
  }

  static async updateProduct(
    id: string,
    updates: Partial<Pick<CatalogItem, "name" | "price_cents" | "category" | "active">>,
  ): Promise<{ success: boolean; error?: string }> {
    const { error } = await db
      .from("gm_catalog_items")
      .update(updates)
      .eq("id", id);

    if (error) {
      Logger.error("[CatalogService] updateProduct failed", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  static async toggleProductActive(
    id: string,
    active: boolean,
  ): Promise<{ success: boolean; error?: string }> {
    return this.updateProduct(id, { active });
  }
}
