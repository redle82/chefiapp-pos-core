import type { RestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import type { Restaurant } from "./restaurant.types";

/**
 * Adapter canónico: RestaurantRuntime → Restaurant (schema de readiness).
 *
 * NOTA:
 * - Este adapter existe para compatibilizar o runtime atual (setup_status, isPublished, etc.)
 *   com o novo schema config-first.
 * - Quando o Core expuser diretamente o schema definitivo, este ficheiro torna-se
 *   um simples mapper 1:1 (ou pode desaparecer).
 */

export function runtimeToRestaurant(params: {
  runtime: RestaurantRuntime;
  ownerUserId: string;
  ownerPhone: string;
}): Restaurant {
  const { runtime, ownerUserId, ownerPhone } = params;

  const identityStatus =
    runtime.setup_status?.identity === true ? "READY" : "INCOMPLETE";

  const localStatus =
    runtime.setup_status?.location === true &&
    Boolean(runtime.billing_status !== null) // proxy fraco para país/moeda vindo do Core
      ? "READY"
      : "INCOMPLETE";

  const menuDefined = runtime.setup_status?.menu === true;

  const menuStatus = menuDefined ? "READY" : "INCOMPLETE";

  const publicationStatus = runtime.isPublished ? "READY" : "INCOMPLETE";

  const nowIso = new Date().toISOString();

  return {
    id: runtime.restaurant_id ?? "unknown-restaurant-id",
    ownerUserId,
    ownerPhone,
    identity: {
      status: identityStatus,
      // O Runtime ainda não expõe campos de identidade ricos aqui;
      // estes virão de fontes dedicadas (ex.: useRestaurantIdentity/Core).
      name: undefined,
    },
    local: {
      status: localStatus,
      country: undefined,
      currency: undefined,
      timezone: undefined,
    },
    menu: {
      status: menuStatus,
      hasItems: menuDefined,
    },
    publication: {
      status: publicationStatus,
      isPublished: runtime.isPublished,
    },
    operation: {
      isTurnOpen: false,
    },
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

