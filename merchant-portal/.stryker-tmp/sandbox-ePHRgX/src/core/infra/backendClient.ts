/**
 * Backend Client (DEPRECATED — Use coreClient ou analyticsClient)
 *
 * ⚠️ ATENÇÃO: Este arquivo está deprecated.
 *
 * Nova arquitetura híbrida:
 * - Operações críticas (orders, payments) → import { coreClient } from './coreClient'
 * - Leituras/Analytics → import { analyticsClient } from './analyticsClient'
 *
 * Porquê da mudança:
 * - Operações críticas não podem depender de backends remotos (offline-first)
 * - InsForge é satélite cognitivo, não espinha dorsal operacional
 * - Separação clara entre critical path e analytics path
 *
 * Este arquivo é mantido temporariamente para compatibilidade.
 * Migrações futuras devem usar coreClient/analyticsClient diretamente.
 *
 * Decisão: docs/architecture/ADR_HYBRID_BACKEND.md
 */
// @ts-nocheck


import { CONFIG } from "../../config";
import { getDockerCoreFetchClient } from "./dockerCoreFetchClient";
import { checkInsforgeHealth, insforge } from "./insforgeClient";

/** True when InsForge is the active backend (VITE_INSFORGE_URL configured). */
export const isInsforge = Boolean(CONFIG.INSFORGE_URL);

/** True when local Docker Core is the active backend. */
export const isDockerCore = !isInsforge;

/**
 * Canonical backend client.
 *
 * Returns the InsForge database client or Docker Core PostgREST client
 * based on environment configuration. Both API surfaces are compatible.
 */
export const backendClient = isInsforge
  ? insforge.database
  : getDockerCoreFetchClient();

export async function getBackendClient() {
  return backendClient;
}

/**
 * Health check — tests whichever backend is active.
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    if (isInsforge) {
      return checkInsforgeHealth();
    }
    const client = getDockerCoreFetchClient();
    const res = await client.from("gm_restaurants").select("id").limit(1);
    return !res.error;
  } catch {
    return false;
  }
}

/**
 * Auth client — only available when InsForge is active.
 * Returns null for Docker Core (uses Keycloak instead).
 */
export async function getAuthClient() {
  if (!isInsforge) return null;
  return insforge.auth;
}

/**
 * Storage client — only available when InsForge is active.
 * Returns null for Docker Core (uses MinIO directly).
 */
export async function getStorageClient() {
  if (!isInsforge) return null;
  return insforge.storage;
}

/**
 * Realtime client — only available when InsForge is active.
 * Docker Core uses its own noop channel stubs.
 */
export async function getRealtimeClient() {
  if (!isInsforge) return null;
  return insforge.realtime;
}
