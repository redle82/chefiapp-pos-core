/**
 * Menu pilot fallback — quando o Core não responde, usa localStorage para
 * listar/guardar produtos (TPV, Menu Builder, useDynamicMenu).
 */

export const pilotMenuKey = "chefiapp_pilot_menu";

export interface PilotProductStored {
  id: string;
  name: string;
  price_cents: number;
  description?: string;
  category_id?: string | null;
  available?: boolean;
  restaurant_id?: string;
  station?: "BAR" | "KITCHEN";
  prep_time_seconds?: number;
  prep_category?: string;
}

const storageKey = (restaurantId: string) => `${pilotMenuKey}_${restaurantId}`;

export function getPilotProducts(restaurantId: string): PilotProductStored[] {
  try {
    const raw =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(storageKey(restaurantId))
        : null;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addPilotProduct(
  restaurantId: string,
  product: PilotProductStored,
): void {
  const list = getPilotProducts(restaurantId);
  const exists = list.some((p) => p.id === product.id);
  const next = exists
    ? list.map((p) => (p.id === product.id ? { ...p, ...product } : p))
    : [...list, { ...product, restaurant_id: restaurantId }];
  try {
    if (typeof localStorage !== "undefined")
      localStorage.setItem(storageKey(restaurantId), JSON.stringify(next));
  } catch (_) {}
}

/**
 * Retorna mensagem amigável se o erro for de backend indisponível; false caso contrário.
 */
export function isBackendUnavailable(err: unknown): string | false {
  if (err == null) return false;
  if (typeof err === "object" && err !== null && "message" in err) {
    const msg = String((err as { message: unknown }).message);
    if (
      /network|failed to fetch|load failed|ECONNREFUSED|ETIMEDOUT|502|503|504/i.test(
        msg,
      )
    )
      return msg || "Ligação indisponível";
  }
  if (isNetworkError(err)) return "Ligação indisponível";
  return false;
}

/**
 * True se o erro for de rede (fetch/connect/timeout).
 */
export function isNetworkError(err: unknown): boolean {
  if (err == null) return false;
  if (
    err instanceof TypeError &&
    (err.message === "Failed to fetch" || err.message?.includes("fetch"))
  )
    return true;
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = (err as { code: string }).code;
    if (
      ["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "ERR_NETWORK"].includes(code)
    )
      return true;
  }
  const msg = err instanceof Error ? err.message : String(err);
  return /network|failed to fetch|load failed|timeout|ECONNREFUSED|ETIMEDOUT/i.test(
    msg,
  );
}
