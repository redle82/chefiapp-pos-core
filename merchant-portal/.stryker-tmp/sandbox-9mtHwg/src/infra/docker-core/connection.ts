/**
 * Core Connection — Docker Core (Local PostgREST)
 *
 * Re-export do coreClient para compatibilidade com infra (RuntimeWriter, RuntimeReader, etc.).
 * Operações críticas usam sempre Docker Core.
 */

import { checkCoreHealth, coreClient } from "../../core/infra/coreClient";

/** Cliente canónico para operações críticas (sempre Docker Core). */
export const dockerCoreClient = coreClient;

/** Verifica se o Core está acessível. */
export async function checkDockerCoreHealth(): Promise<boolean> {
  return checkCoreHealth();
}
