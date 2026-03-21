import { CONFIG } from "../../config";
import { isDockerBackend } from "../infra/backendAdapter";

export const SEED_ACTOR_USER_ID = "00000000-0000-0000-0000-000000000002";

/**
 * Retorna actor_user_id para RPCs RBAC.
 * - Local/Docker: permite fallback para SEED_ACTOR_USER_ID
 * - Produção: exige sessionUserId; sem ele, lança (não inventa owner)
 */
export function getRequiredActorUserId(
  sessionUserId: string | null | undefined,
): string {
  if (sessionUserId) return sessionUserId;
  if (isDockerBackend() || !CONFIG.IS_PROD) {
    return SEED_ACTOR_USER_ID;
  }
  throw new Error(
    "ACTOR_REQUIRED: Actor user ID is required in production. Session may be invalid.",
  );
}
