/**
 * RPC adapter: Core (Docker) quando backend = Docker, Supabase quando não.
 *
 * FINANCIAL_CORE_VIOLATION_AUDIT / Roadmap Fase 4.
 * Permite que callers usem um único ponto: quando o Core expuser os mesmos RPCs,
 * o tráfego vai automaticamente para o Core em modo Docker.
 */

import { BackendType, getBackendType } from "./backendAdapter";
import { getDockerCoreFetchClient } from "./dockerCoreFetchClient";

export type RpcResult<T = unknown> = {
  data: T | null;
  error: { message: string; code?: string; details?: string } | null;
};

/** Cliente PostgREST (.from/.select/.eq/.update/etc.) — Core quando Docker, Supabase quando não. */
type TableClientShape = ReturnType<typeof getDockerCoreFetchClient>;

/**
 * Cliente de tabela (PostgREST): Core quando Docker, Supabase quando não.
 * Usar para leituras/escritas em gm_payments, gm_cash_registers, etc.
 * FINANCIAL_CORE_VIOLATION_AUDIT Fase 4 — leituras pós-pagamento e caixa via Core.
 */
export async function getTableClient(): Promise<TableClientShape> {
  if (getBackendType() === BackendType.docker) {
    return getDockerCoreFetchClient();
  }
  const { supabase } = await import("../supabase");
  return supabase as unknown as TableClientShape;
}

/**
 * Invoca RPC no Core (Docker) ou no Supabase conforme backend.
 * Quando backend = Docker → PostgREST Core (getDockerCoreFetchClient().rpc).
 * Caso contrário → supabase.rpc (technical debt).
 */
export async function invokeRpc<T = unknown>(
  fnName: string,
  params: Record<string, unknown> = {}
): Promise<RpcResult<T>> {
  if (getBackendType() === BackendType.docker) {
    const client = getDockerCoreFetchClient();
    return client.rpc(fnName, params) as Promise<RpcResult<T>>;
  }
  const { supabase } = await import("../supabase");
  const raw = await supabase.rpc(fnName, params) as { data: T | null; error: { message?: string; code?: string; details?: unknown } | null };
  const { data, error } = raw;
  return {
    data: data as T | null,
    error: error
      ? {
          message: error.message ?? 'Unknown error',
          code: error.code,
          details: error.details != null ? String(error.details) : undefined,
        }
      : null,
  };
}
