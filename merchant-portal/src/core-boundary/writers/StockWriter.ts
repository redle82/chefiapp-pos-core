/**
 * STOCK WRITER
 *
 * Escreve/atualiza estoque no Core (gm_stock_levels, gm_stock_ledger).
 */

const DOCKER_CORE_URL = import.meta.env.VITE_DOCKER_CORE_URL || "";
const DOCKER_CORE_ANON_KEY =
  import.meta.env.VITE_DOCKER_CORE_ANON_KEY ||
  "chefiapp-core-secret-key-min-32-chars-long";

export interface ConfirmPurchaseResult {
  success: boolean;
  new_qty: number;
  tasks_closed: number;
  ingredient_id: string;
  location_id: string;
}

/**
 * Confirma compra de ingrediente.
 * Atualiza estoque, registra no ledger e fecha tarefas relacionadas.
 */
export async function confirmPurchase(
  restaurantId: string,
  ingredientId: string,
  locationId: string,
  qtyReceived: number,
  purchasePriceCents?: number,
): Promise<ConfirmPurchaseResult> {
  const url = `${DOCKER_CORE_URL}/rest/v1/rpc/confirm_purchase`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: DOCKER_CORE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_restaurant_id: restaurantId,
      p_ingredient_id: ingredientId,
      p_location_id: locationId,
      p_qty_received: qtyReceived,
      p_purchase_price_cents: purchasePriceCents || null,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to confirm purchase: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  const data = await response.json();

  if (!data || !data.success) {
    throw new Error(
      `Purchase confirmation failed: ${data?.error || "Unknown error"}`,
    );
  }

  return data as ConfirmPurchaseResult;
}
