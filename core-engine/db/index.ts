/**
 * Core DB client — Docker Core (PostgREST fetch). 100% Docker, zero Supabase.
 */

import { getDockerCoreFetchClient } from "../infra/dockerCoreFetchClient";

const client = getDockerCoreFetchClient();

const noopSubscription = { unsubscribe: () => {} };

export type CoreClient = {
  kind: "docker-core";
};

export const coreClient: CoreClient = {
  kind: "docker-core",
};

export const db = {
  from: client.from.bind(client),
  rpc: client.rpc.bind(client),
  channel: client.channel.bind(client),
  removeChannel: (_ch: unknown) => Promise.resolve(),
  functions: {
    invoke: (_name: string, _opts?: unknown) =>
      Promise.reject(new Error("Use Core endpoint for serverless functions.")),
  },
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: noopSubscription } }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signInWithPassword: () => Promise.reject(new Error("Use Core auth.")),
    signOut: () => Promise.resolve(),
  },
};

/** @deprecated Use `db` directly. */
export const supabase = db;

export async function coreNotImplemented<T = unknown>(
  feature: string,
): Promise<T> {
  throw new Error(`CORE TODO: ${feature}`);
}
