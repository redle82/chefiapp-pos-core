/**
 * B1 48h — Fallback localStorage quando o Core não responde (cardápio).
 * Ver docs/product/B1_MENU_CONTENCAO.md. Remover quando fluxo feliz estável com Core.
 */

const KEY_PREFIX = 'chefiapp_menu_pilot_';

export function pilotMenuKey(restaurantId: string): string {
  return `${KEY_PREFIX}${restaurantId}`;
}

export interface PilotProductStored {
  id: string;
  restaurant_id: string;
  name: string;
  price_cents: number;
  available: boolean;
  station: 'BAR' | 'KITCHEN';
  prep_time_seconds: number;
  prep_category?: string | null;
  category_id?: string | null;
  created_at: string;
  updated_at: string;
}

export function getPilotProducts(restaurantId: string): PilotProductStored[] {
  try {
    const raw = localStorage.getItem(pilotMenuKey(restaurantId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addPilotProduct(restaurantId: string, product: PilotProductStored): void {
  const list = getPilotProducts(restaurantId);
  list.push(product);
  localStorage.setItem(pilotMenuKey(restaurantId), JSON.stringify(list));
}

export function isNetworkError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const s = msg.toLowerCase();
  return s.includes('failed to fetch') || s.includes('network') || s.includes('load failed');
}
