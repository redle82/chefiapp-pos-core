/**
 * SHOPPING LIST READER
 *
 * Lê lista de compras gerada automaticamente baseada em estoque abaixo do mínimo.
 */

const DOCKER_CORE_URL = import.meta.env.VITE_DOCKER_CORE_URL || "";
const DOCKER_CORE_ANON_KEY =
  import.meta.env.VITE_DOCKER_CORE_ANON_KEY ||
  "chefiapp-core-secret-key-min-32-chars-long";

export interface ShoppingListItem {
  ingredient_id: string;
  ingredient_name: string;
  unit: "g" | "kg" | "ml" | "l" | "unit";
  location_id: string;
  current_qty: number;
  min_qty: number;
  suggested_qty: number;
  urgency: "CRITICAL" | "HIGH" | "MEDIUM";
  deficit: number;
}

/**
 * Gera lista de compras para um restaurante.
 */
export async function generateShoppingList(
  restaurantId: string,
): Promise<ShoppingListItem[]> {
  const url = `${DOCKER_CORE_URL}/rest/v1/rpc/generate_shopping_list`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: DOCKER_CORE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_restaurant_id: restaurantId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to generate shopping list: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  const data = await response.json();

  return (data || []) as ShoppingListItem[];
}
