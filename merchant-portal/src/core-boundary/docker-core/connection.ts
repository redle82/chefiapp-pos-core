/**
 * Core Connection — Docker Core (Local PostgREST)
 *
 * IMPORTANTE: Este cliente é SEMPRE Docker Core local.
 * Operações críticas (orders, payments) não dependem de backends remotos.
 *
 * Arquitetura Híbrida:
 * - dockerCoreClient → coreClient (sempre Docker, operações críticas)
 * - Para analytics/reports → use analyticsClient (InsForge com fallback)
 *
 * Decisão: docs/architecture/ADR_HYBRID_BACKEND.md
 */
import { checkCoreHealth, coreClient } from "../../core/infra/coreClient";

/** Cliente canônico para operações críticas (sempre Docker Core). */
export const dockerCoreClient = coreClient;

/**
 * Verifica se o Core está acessível.
 */
export async function checkDockerCoreHealth(): Promise<boolean> {
  return checkCoreHealth();
}
