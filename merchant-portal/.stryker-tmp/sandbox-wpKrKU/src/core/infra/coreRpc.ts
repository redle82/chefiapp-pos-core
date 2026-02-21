/**
 * RPC / table adapter: Core (Docker) only.
 *
 * Domain operations require Docker Core. Throws when backend is not configured (none).
 */

import { BackendType, getBackendType } from "./backendAdapter";
import { getDockerCoreFetchClient } from "./dockerCoreFetchClient";

const DOMAIN_FORBIDDEN_MSG =
  "Domain operations require Docker Core. Backend not configured or not Docker.";

export type RpcResult<T = unknown> = {
  data: T | null;
  error: { message: string; code?: string; details?: string } | null;
};

/** Cliente PostgREST (.from/.select/.eq/.update/etc.) — Core only. */
type TableClientShape = ReturnType<typeof getDockerCoreFetchClient>;

/**
 * Cliente de tabela (PostgREST): Core (Docker) only.
 * Throws if backend is not Docker.
 */
export async function getTableClient(): Promise<TableClientShape> {
  if (getBackendType() !== BackendType.docker) {
    throw new Error(DOMAIN_FORBIDDEN_MSG);
  }
  return getDockerCoreFetchClient();
}

/**
 * Invoca RPC no Core (Docker) only. Throws if backend is not Docker.
 */
export async function invokeRpc<T = unknown>(
  fnName: string,
  params: Record<string, unknown> = {}
): Promise<RpcResult<T>> {
  if (getBackendType() !== BackendType.docker) {
    throw new Error(DOMAIN_FORBIDDEN_MSG);
  }
  const client = getDockerCoreFetchClient();
  return client.rpc(fnName, params) as Promise<RpcResult<T>>;
}
