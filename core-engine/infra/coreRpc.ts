/**
 * RPC adapter: Core (Docker) only. Sem Supabase.
 *
 * getTableClient e invokeRpc usam apenas o cliente Docker (PostgREST).
 */

import { getDockerCoreFetchClient } from "./dockerCoreFetchClient";

export type RpcResult<T = unknown> = {
  data: T | null;
  error: { message: string; code?: string; details?: string } | null;
};

export type TableClientShape = ReturnType<typeof getDockerCoreFetchClient>;

/**
 * Cliente de tabela (PostgREST): Docker Core apenas.
 */
export function getTableClient(): TableClientShape {
  return getDockerCoreFetchClient();
}

/**
 * Invoca RPC no Core (Docker). Backend único: Docker Core.
 */
export async function invokeRpc<T = unknown>(
  fnName: string,
  params: Record<string, unknown> = {}
): Promise<RpcResult<T>> {
  const client = getDockerCoreFetchClient();
  return client.rpc(fnName, params) as Promise<RpcResult<T>>;
}
