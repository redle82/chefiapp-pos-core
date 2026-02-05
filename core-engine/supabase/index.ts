/**
 * Core client — alias do Docker Core (PostgREST). Sem Supabase BaaS.
 *
 * Exporta "supabase" como alias de getDockerCoreFetchClient() para compatibilidade
 * com código que importa deste módulo. .from(), .rpc(), .channel() usam o Core.
 * .auth e .functions são no-op ou rejeitam (use useCoreAuth / endpoints Core).
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

export const supabase = {
  from: client.from.bind(client),
  rpc: client.rpc.bind(client),
  channel: client.channel.bind(client),
  removeChannel: (_ch: unknown) => Promise.resolve(),
  functions: {
    invoke: (_name: string, _opts?: unknown) =>
      Promise.reject(
        new Error("Use Core endpoint for serverless functions. supabase.functions.invoke is not available.")
      ),
  },
  auth: {
    getSession: () =>
      Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: noopSubscription } }),
    getUser: () =>
      Promise.resolve({ data: { user: null }, error: null }),
    signInWithPassword: () =>
      Promise.reject(new Error("Use Core auth. supabase.auth is not available.")),
    signOut: () => Promise.resolve(),
  },
};

export async function coreNotImplemented<T = unknown>(feature: string): Promise<T> {
  throw new Error(`CORE TODO: ${feature}`);
}
