/**
 * Core DB client — Docker Core (PostgREST fetch). 100% Docker, zero Supabase.
 * Expõe db.from(), db.rpc(), db.channel(), db.auth (via getCoreSessionAsync).
 *
 * Guard defensivo: em ambientes onde o core não existe (ex.: testes), exporta
 * um db stub que falha explicitamente quando usado, em vez de lançar ao import.
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

const DB_UNAVAILABLE_MSG =
  "db is not available in this environment (e.g. test).";

function getCoreSafe(): ReturnType<typeof getDockerCoreFetchClient> | null {
  try {
    const core = getDockerCoreFetchClient();
    if (
      core &&
      typeof (core as any).from === "function" &&
      typeof (core as any).rpc === "function" &&
      typeof (core as any).channel === "function"
    ) {
      return core;
    }
  } catch {
    // getDockerCoreFetchClient threw or core incomplete
  }
  return null;
}

const core = getCoreSafe();

/** Canonical Core client (PostgREST fetch). */
export function getCoreClient() {
  return getDockerCoreFetchClient();
}

function stubReject(): Promise<never> {
  return Promise.reject(new Error(DB_UNAVAILABLE_MSG));
}

/** Core DB client — replaces all legacy Supabase references. */
export const db = core
  ? {
      from: core.from.bind(core),
      rpc: core.rpc.bind(core),
      channel: core.channel.bind(core),
      removeChannel: () => Promise.resolve(),
      functions: {
        invoke: (_name: string) =>
          Promise.resolve({
            data: {} as Record<string, unknown>,
            error: null,
          }),
      },
      auth: {
        getSession: () =>
          getCoreSessionAsync().then((session) => ({
            data: { session },
            error: null,
          })),
        getUser: () =>
          getCoreSessionAsync().then((session) => ({
            data: { user: session?.user ?? null },
            error: null,
          })),
        onAuthStateChange: () => ({
          data: { subscription: noopSubscription },
        }),
        signInWithPassword: () =>
          Promise.reject(new Error("Use getAuthActions().signIn()")),
        signOut: () =>
          Promise.reject(new Error("Use getAuthActions().signOut()")),
      },
    }
  : {
      from: () => {
        throw new Error(DB_UNAVAILABLE_MSG);
      },
      rpc: () => stubReject(),
      channel: () => {
        throw new Error(DB_UNAVAILABLE_MSG);
      },
      removeChannel: () => Promise.resolve(),
      functions: {
        invoke: () => stubReject(),
      },
      auth: {
        getSession: () => stubReject(),
        getUser: () => stubReject(),
        onAuthStateChange: () => ({
          data: { subscription: noopSubscription },
        }),
        signInWithPassword: () =>
          Promise.reject(new Error("Use getAuthActions().signIn()")),
        signOut: () =>
          Promise.reject(new Error("Use getAuthActions().signOut()")),
      },
    };

/**
 * @deprecated Use `db` directly. Alias kept for backward compat during migration.
 */
export const supabase = db;

export async function coreNotImplemented<T = unknown>(
  feature: string,
): Promise<T> {
  console.warn(`[CORE] Legacy: ${feature} not implemented. Use Core client.`);
  throw new Error(`CORE: ${feature} not implemented. Use Core client.`);
}
