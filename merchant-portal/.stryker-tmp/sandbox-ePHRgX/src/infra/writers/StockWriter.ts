/**
 * StockWriter — Confirmação de compra / entrada de estoque.
 */
// @ts-nocheck


import { dockerCoreClient } from "../docker-core/connection";

/**
 * Regista entrada de estoque (confirmPurchase). Insere em gm_stock_ledger e atualiza gm_stock_levels.
 */
export async function confirmPurchase(
  restaurantId: string,
  ingredientId: string,
  locationId: string,
  qty: number,
  _reason?: string
): Promise<{ tasks_closed: number }> {
  if (qty <= 0) throw new Error("Quantidade deve ser positiva");
  const { error } = await dockerCoreClient
    .from("gm_stock_ledger")
    .insert({
      restaurant_id: restaurantId,
      location_id: locationId,
      ingredient_id: ingredientId,
      action: "IN",
      qty,
      reason: _reason ?? "Compra confirmada",
    });
  if (error) throw new Error(error.message ?? "Falha ao confirmar compra");
  return { tasks_closed: 0 };
}
