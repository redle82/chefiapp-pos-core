/**
 * Core Client (server-side)
 *
 * Permite que o backend (ex.: billing webhook) atualize o Core (PostgREST)
 * sem depender do merchant-portal. Usado para: product_mode ao confirmar assinatura.
 *
 * Env: DOCKER_CORE_URL (default http://localhost:3001), DOCKER_CORE_SERVICE_KEY (apikey PostgREST).
 */

const DOCKER_CORE_URL = process.env.DOCKER_CORE_URL || "http://localhost:3001";
const SERVICE_KEY =
  process.env.DOCKER_CORE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "chefiapp-core-secret-key-min-32-chars-long";

const REST = `${DOCKER_CORE_URL.replace(/\/$/, "")}/rest/v1`;

export type ProductMode = "demo" | "pilot" | "live";

/**
 * Atualiza product_mode do restaurante no Core.
 * Retorna { error: null } em sucesso ou { error: string } em falha.
 */
export async function setProductMode(
  restaurantId: string,
  productMode: ProductMode,
): Promise<{ error: string | null }> {
  try {
    const res = await fetch(
      `${REST}/gm_restaurants?id=eq.${encodeURIComponent(restaurantId)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          product_mode: productMode,
          updated_at: new Date().toISOString(),
        }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      return { error: `Core PATCH failed ${res.status}: ${text}` };
    }
    return { error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: msg };
  }
}
