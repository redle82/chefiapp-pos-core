/**
 * RUNTIME WRITER — Persiste estado do restaurante no Core (PostgREST)
 *
 * Usado por RestaurantRuntimeContext quando backend é Docker.
 */

import { dockerCoreClient } from "../docker-core/connection";

/**
 * Atualiza ou insere status do onboarding (sections) no Core.
 */
export async function upsertSetupStatus(
  restaurantId: string,
  sections: Record<string, boolean>,
): Promise<{ error: string | null }> {
  const body = {
    restaurant_id: restaurantId,
    sections,
    updated_at: new Date().toISOString(),
  };
  const { error } = await dockerCoreClient
    .from("restaurant_setup_status")
    .upsert(body, { onConflict: "restaurant_id" })
    .then((r) => r);

  return { error: error?.message ?? null };
}

/**
 * Atualiza status do restaurante (draft | active | paused).
 */
export async function setRestaurantStatus(
  restaurantId: string,
  status: "draft" | "active" | "paused",
): Promise<{ error: string | null }> {
  const res = await dockerCoreClient
    .from("gm_restaurants")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", restaurantId)
    .then((r) => r);
  const error = res.error;

  return { error: error?.message ?? null };
}

/**
 * Atualiza product_mode do restaurante (trial | pilot | live).
 * Transições são raras e contratuais; persistência no Core para sobreviver a refresh.
 */
export async function setProductMode(
  restaurantId: string,
  productMode: "trial" | "pilot" | "live",
): Promise<{ error: string | null }> {
  const res = await dockerCoreClient
    .from("gm_restaurants")
    .update({
      product_mode: productMode,
      updated_at: new Date().toISOString(),
    })
    .eq("id", restaurantId)
    .then((r) => r);
  return { error: res.error?.message ?? null };
}

/**
 * Insere módulo instalado no Core. Se já existir (UNIQUE restaurant_id, module_id), ignora.
 */
export async function insertInstalledModule(
  restaurantId: string,
  moduleId: string,
  moduleName: string = moduleId,
): Promise<{ error: string | null }> {
  const body = {
    restaurant_id: restaurantId,
    module_id: moduleId,
    module_name: moduleName,
    status: "active",
  };
  const { error } = await dockerCoreClient
    .from("installed_modules")
    // upsert torna a operação idempotente e evita 409 (conflict) no PostgREST.
    .upsert(body, { onConflict: "restaurant_id,module_id" })
    .then((r) => r);

  return { error: error?.message ?? null };
}
