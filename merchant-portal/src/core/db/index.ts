/**
 * Core DB client — Docker Core (PostgREST fetch). 100% Docker, zero Supabase.
 * Expõe db.from(), db.rpc(), db.channel(), db.auth (via getCoreSessionAsync).
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

const core = getDockerCoreFetchClient();

/** Canonical Core client (PostgREST fetch). */
export function getCoreClient() {
  return getDockerCoreFetchClient();
}

/** Core DB client — replaces all legacy Supabase references. */
export const db = {
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

/**
 * @deprecated Use `db` directly. Alias kept for backward compat during migration.
 */
export const supabase = db;

export async function coreNotImplemented<T = unknown>(
  feature: string
): Promise<T> {
  console.warn(`[CORE] Legacy: ${feature} not implemented. Use Core client.`);
  throw new Error(`CORE: ${feature} not implemented. Use Core client.`);
}
