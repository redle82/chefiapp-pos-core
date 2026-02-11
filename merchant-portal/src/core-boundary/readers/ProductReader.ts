/**
 * PRODUCT READER — Adaptador de Leitura de Produtos (Read-Only)
 *
 * FASE 3.5: Padronização de Acesso ao Core
 *
 * REGRAS:
 * - Apenas leitura (read-only)
 * - Não cria nada
 * - Não altera estado
 * - Usa core-boundary/docker-core/connection.ts
 */

import { dockerCoreClient } from "../docker-core/connection";
import { getPilotProducts, isBackendUnavailable } from "../menuPilotFallback";

export interface CoreProduct {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string | null;
  price_cents: number;
  photo_url?: string | null;
  available: boolean;
  track_stock?: boolean;
  stock_quantity?: number;
  category_id?: string;
  // Prep time (para timer por item, não por pedido)
  prep_time_seconds?: number | null; // Tempo esperado de preparo em segundos
  prep_category?: "drink" | "starter" | "main" | "dessert" | null; // Categoria de preparo
  // Station (BAR vs KITCHEN)
  station?: "BAR" | "KITCHEN" | null; // Estação de preparo
  created_at: string;
  updated_at: string;
}

export interface CoreProductWithCategory extends CoreProduct {
  gm_menu_categories?: {
    name: string;
  } | null;
}

/**
 * Lê produtos de um restaurante.
 *
 * @param restaurantId ID do restaurante
 * @param includeCategory Se true, inclui join com categoria
 * @returns Lista de produtos disponíveis
 */
export async function readProductsByRestaurant(
  restaurantId: string,
  includeCategory: boolean = true,
  onlyAvailable: boolean = true,
): Promise<CoreProductWithCategory[]> {
  try {
    let query = dockerCoreClient
      .from("gm_products")
      .select(includeCategory ? "*, gm_menu_categories(name)" : "*")
      .eq("restaurant_id", restaurantId);

    if (onlyAvailable) {
      query = query.eq("available", true);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to read products: ${error.message}`);
    }

    return (data || []) as CoreProductWithCategory[];
  } catch (err) {
    // B1 48h + API_ERROR_CONTRACT: fallback quando Core não responde ou devolve HTML (Unexpected token '<')
    if (isBackendUnavailable(err)) {
      const pilot = getPilotProducts(restaurantId);
      let list = pilot.map((p) => ({
        ...p,
        description: null,
        gm_menu_categories: null as { name: string } | null,
      }));
      if (onlyAvailable) {
        list = list.filter((p) => p.available);
      }
      return list as CoreProductWithCategory[];
    }
    throw err;
  }
}

/**
 * Lê um produto específico por ID.
 * API_ERROR_CONTRACT: se backend devolver HTML (ex.: proxy 502), não expõe "Unexpected token '<'"; devolve null.
 *
 * @param productId ID do produto
 * @returns Produto ou null se não encontrado / backend indisponível
 */
export async function readProductById(
  productId: string,
): Promise<CoreProduct | null> {
  try {
    const { data, error } = await dockerCoreClient
      .from("gm_products")
      .select("*")
      .eq("id", productId)
      .single();

    if (error) {
      // PGRST116: no rows found (produto não existe)
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to read product: ${error.message}`);
    }

    return data as CoreProduct;
  } catch (err) {
    // B1 48h + API_ERROR_CONTRACT: quando Core não responde ou devolve HTML (Unexpected token '<')
    if (isBackendUnavailable(err)) {
      return null;
    }
    throw err;
  }
}
