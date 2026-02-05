/**
 * Core client — reexport do Docker Core (PostgREST fetch). Sem Supabase BaaS.
 * "supabase" é alias para compatibilidade com imports existentes; auth delega em getCoreSessionAsync.
 */

import { getCoreSessionAsync } from "../auth/getCoreSession";
import { getDockerCoreFetchClient } from "../infra/dockerCoreFetchClient";

export type CoreClient = {
  kind: "docker-core";
};

export const coreClient: CoreClient = {
  kind: "docker-core",
};

const noopSubscription = { unsubscribe: () => {} };

/** Cliente Core com API compatível (from, rpc, channel, auth via Core). */
const core = getDockerCoreFetchClient();

/** Cliente canónico Core (PostgREST fetch). Preferir sobre o alias "supabase". */
export function getCoreClient() {
  return getDockerCoreFetchClient();
}

export const supabase = {
  from: core.from.bind(core),
  rpc: core.rpc.bind(core),
  channel: core.channel.bind(core),
  removeChannel: () => Promise.resolve(),
  functions: {
    invoke: (_name: string) =>
      Promise.resolve({ data: {} as Record<string, unknown>, error: null }),
  },
  auth: {
    getSession: () =>
      getCoreSessionAsync().then((session) => ({ data: { session }, error: null })),
    getUser: () =>
      getCoreSessionAsync().then((session) => ({
        data: { user: session?.user ?? null },
        error: null,
      })),
    onAuthStateChange: () => ({ data: { subscription: noopSubscription } }),
    signInWithPassword: () =>
      Promise.reject(new Error("Use getAuthActions().signIn()")),
    signOut: () => Promise.reject(new Error("Use getAuthActions().signOut()")),
  },
};

export async function coreNotImplemented<T = unknown>(
  feature: string
): Promise<T> {
  console.warn(`[CORE] Legacy: ${feature} not implemented. Use Core client.`);
  throw new Error(`CORE: ${feature} not implemented. Use Core client.`);
}
