/**
 * RUNTIME WRITER — Persiste estado do restaurante no Core (PostgREST)
 *
 * Usado por RestaurantRuntimeContext quando backend é Docker.
 */
// @ts-nocheck


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
 * Atualiza perfil base do restaurante (nome, país, tipo). Usado pelo Onboarding assistente.
 */
export async function updateRestaurantProfile(
  restaurantId: string,
  profile: { name?: string; country?: string; type?: string },
): Promise<{ error: string | null }> {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (profile.name != null) payload.name = profile.name;
  if (profile.country != null) payload.country = profile.country;
  if (profile.type != null) payload.type = profile.type;
  if (Object.keys(payload).length <= 1) return { error: null };
  const res = await dockerCoreClient
    .from("gm_restaurants")
    .update(payload)
    .eq("id", restaurantId)
    .then((r) => r);
  return { error: res.error?.message ?? null };
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
 * Insere módulo instalado no Core.
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
    .upsert(body, { onConflict: "restaurant_id,module_id" })
    .then((r) => r);

  return { error: error?.message ?? null };
}
