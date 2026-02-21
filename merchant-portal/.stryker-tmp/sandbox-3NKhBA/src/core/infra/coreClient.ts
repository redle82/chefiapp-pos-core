/**
 * Core Client — Espinha Dorsal (Operações Críticas)
 *
 * Este cliente é SEMPRE Docker Core (local PostgREST).
 * Nunca usa InsForge ou qualquer backend remoto externo.
 *
 * Porquê:
 * - Operações críticas (orders, payments, tables) não podem depender de internet
 * - Latência de rede é perceptível em POS (> 300ms degrada UX)
 * - Restaurante cheio não pode parar por cloud down
 * - Garantia de disponibilidade 99.9% offline-first
 *
 * Usa este cliente para:
 * ✅ create_order_atomic (pedidos)
 * ✅ process_order_payment (pagamentos)
 * ✅ update_order_status (transições de estado)
 * ✅ add_order_item, remove_order_item (modificações)
 * ✅ manage_shift (turnos de caixa)
 * ✅ gm_tables, gm_cash_registers (operação em tempo real)
 *
 * NÃO usa este cliente para:
 * ❌ Analytics/reports (use analyticsClient)
 * ❌ AI/Insights (use InsForge AI ou mock local)
 * ❌ Leituras históricas (use analyticsClient com fallback)
 *
 * Arquitetura: CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md
 * Decisão: docs/architecture/ADR_HYBRID_BACKEND.md
 */
// @ts-nocheck


import { Logger } from "../logger";
import { getDockerCoreFetchClient } from "./dockerCoreFetchClient";

/**
 * Cliente canônico para operações críticas.
 * SEMPRE retorna Docker Core, independente de env vars.
 */
export function getCoreClient() {
  return getDockerCoreFetchClient();
}

/**
 * Health check do Core (Docker local).
 * Usado para validar que o POS pode operar.
 */
export async function checkCoreHealth(): Promise<boolean> {
  try {
    const client = getCoreClient();
    const { error } = await client.from("gm_restaurants").select("id").limit(1);
    return !error;
  } catch (error) {
    Logger.error("[CORE_HEALTH] Docker Core unreachable", { error });
    return false;
  }
}

/**
 * Singleton: cliente do Core sempre disponível.
 * Use este export para operações críticas.
 */
export const coreClient = getCoreClient();

// Export type for compatibility
export type CoreClient = ReturnType<typeof getCoreClient>;
