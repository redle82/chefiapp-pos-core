/**
 * B1 48h — Fallback localStorage quando o Core não responde (cardápio).
 * Ver docs/product/B1_MENU_CONTENCAO.md. Remover quando fluxo feliz estável com Core.
 */

const KEY_PREFIX = "chefiapp_menu_pilot_";

export function pilotMenuKey(restaurantId: string): string {
  return `${KEY_PREFIX}${restaurantId}`;
}

export interface PilotProductStored {
  id: string;
  restaurant_id: string;
  name: string;
  price_cents: number;
  available: boolean;
  station: "BAR" | "KITCHEN";
  prep_time_seconds: number;
  prep_category?: string | null;
  category_id?: string | null;
  created_at: string;
  updated_at: string;
}

export function getPilotProducts(restaurantId: string): PilotProductStored[] {
  try {
    const raw = localStorage.getItem(pilotMenuKey(restaurantId));
    let products: PilotProductStored[] = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) products = parsed;
    }

    // Merge from DbWriteGate mock writes (onboarding survival)
    const mockRaw = localStorage.getItem("chefiapp_pilot_mock_products");
    if (mockRaw) {
      const mockParsed = JSON.parse(mockRaw);
      if (Array.isArray(mockParsed)) {
        // Map gm_products structure to PilotProductStored structure if needed
        const mappedMocks = mockParsed.map((p) => ({
          ...p,
          price_cents:
            p.price_cents ||
            (p.price ? Math.round(parseFloat(p.price) * 100) : 0),
          available: p.available ?? true,
          station: p.station || "KITCHEN",
          prep_time_seconds: p.prep_time_seconds || 300,
        }));
        products = [...products, ...mappedMocks];
      }
    }

    // Deduplicate by ID
    const unique = new Map<string, PilotProductStored>();
    products.forEach((p) => unique.set(p.id, p));
    return Array.from(unique.values());
  } catch {
    return [];
  }
}

export function addPilotProduct(
  restaurantId: string,
  product: PilotProductStored
): void {
  const list = getPilotProducts(restaurantId);
  list.push(product);
  localStorage.setItem(pilotMenuKey(restaurantId), JSON.stringify(list));
}

export function isNetworkError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const s = msg.toLowerCase();
  return (
    s.includes("failed to fetch") ||
    s.includes("network") ||
    s.includes("load failed")
  );
}

/** Resposta não-JSON (ex.: HTML 404) — tratar como backend indisponível (API_ERROR_CONTRACT). */
export function isNonJsonResponse(err: unknown): boolean {
  if (err instanceof SyntaxError) return true;
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("Unexpected token") ||
    msg.includes("is not valid JSON") ||
    msg.includes("JSON.parse")
  );
}

/**
 * Erro que indica backend indisponível: rede, resposta não-JSON (HTML) ou mensagem explícita.
 * API_ERROR_CONTRACT + MENU_FALLBACK_CONTRACT: UI trata como "dados indisponíveis" (fallback local).
 */
export function isBackendUnavailable(err: unknown): boolean {
  if (isNetworkError(err) || isNonJsonResponse(err)) return true;
  const msg = err instanceof Error ? err.message : String(err);
  return msg.toLowerCase().includes("backend indisponível");
}
