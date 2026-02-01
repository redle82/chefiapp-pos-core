/**
 * PURE DOCKER MODE — Supabase proibido quando backend = Docker
 *
 * Por que ainda existe "supabase" aqui?
 * - Muitos ficheiros ainda importam `supabase` deste módulo e chamam .from(), .auth, etc.
 * - Em modo Docker este export NÃO é o cliente real: é um SHIM que lança erro em qualquer uso.
 * - Objetivo: forçar migração para dockerCoreClient ou mock; evitar uso silencioso do Supabase em Docker.
 *
 * Quando backendType === 'docker': qualquer uso de `supabase` falha com
 * "Supabase client forbidden in Docker mode". Use dockerCoreClient (PostgREST fetch) ou mock.
 *
 * NÃO importar @supabase/supabase-js aqui. Ver docs/SUPABASE_EM_MODO_DOCKER.md.
 */

import { assertSupabaseAllowed } from "../infra/backendAdapter";

export type CoreClient = {
  kind: "docker-core";
};

export const coreClient: CoreClient = {
  kind: "docker-core",
};

/** Chainable query builder shim para compatibilidade de tipos com SupabaseClient. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryResult = { data: Record<string, any> | null; error: Record<string, any> | null };
type SupabaseQueryBuilder = {
  select(..._args: unknown[]): SupabaseQueryBuilder;
  eq(_column: string, _value: unknown): SupabaseQueryBuilder;
  order(_column: string, _opts?: { ascending?: boolean }): SupabaseQueryBuilder;
  limit(_n: number): SupabaseQueryBuilder;
  insert(_payload: unknown): SupabaseQueryBuilder;
  contains(_column: string, _value: unknown): SupabaseQueryBuilder;
  maybeSingle(): Promise<QueryResult>;
  single(): Promise<QueryResult>;
};

function createQueryBuilderShim(table: string): SupabaseQueryBuilder {
  const run = () => forbidden<QueryResult>(`supabase.from('${table}')`);
  return {
    select: () => createQueryBuilderShim(table),
    eq: () => createQueryBuilderShim(table),
    order: () => createQueryBuilderShim(table),
    limit: () => createQueryBuilderShim(table),
    insert: () => createQueryBuilderShim(table),
    contains: () => createQueryBuilderShim(table),
    maybeSingle: run,
    single: run,
  };
}

type RealtimeChannelShim = {
  on(_event: string, _filter?: unknown, _cb?: (payload: unknown) => void): RealtimeChannelShim;
  subscribe(_cb?: (status: string) => void): { unsubscribe: () => void };
};

type LegacySupabaseShim = {
  from: (table: string) => SupabaseQueryBuilder;
  rpc: (..._args: unknown[]) => Promise<never>;
  channel: (_name: string) => any; // RealtimeChannelShim; GlovoAdapter expects Supabase RealtimeChannel
  removeChannel: (_ch: any) => Promise<void>;
  functions: { invoke: (_name: string, _opts?: unknown) => Promise<{ data: Record<string, any>; error: unknown }> };
  auth: {
    getSession: () => Promise<{ data: { session: null }; error: null }>;
    onAuthStateChange: (
      _callback: (event: string, session: unknown) => void
    ) => { data: { subscription: { unsubscribe: () => void } } };
    getUser: (..._args: unknown[]) => Promise<never>;
    signInWithPassword: (..._args: unknown[]) => Promise<never>;
    signOut: (..._args: unknown[]) => Promise<never>;
  };
};

function forbidden<T = never>(feature: string): Promise<T> {
  assertSupabaseAllowed();
  console.warn(`[CORE TODO] ${feature} is not implemented yet`);
  return Promise.reject(new Error(`CORE TODO: ${feature}`));
}

/** No-op subscription para shim: onAuthStateChange não dispara eventos. */
const noopSubscription = { unsubscribe: () => {} };

const noopChannel: RealtimeChannelShim = {
  on: (_e: string, _f?: unknown, _cb?: (p: unknown) => void) => noopChannel,
  subscribe: () => ({ unsubscribe: () => {} }),
};

export const supabase: LegacySupabaseShim = {
  from: (table: string) => createQueryBuilderShim(table),
  rpc: (..._args: unknown[]) => forbidden("supabase.rpc"),
  channel: () => noopChannel,
  removeChannel: () => Promise.resolve(),
  functions: { invoke: () => forbidden("supabase.functions.invoke") },
  auth: {
    getSession: () =>
      Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: noopSubscription } }),
    getUser: (..._args: unknown[]) => forbidden("supabase.auth.getUser"),
    signInWithPassword: (..._args: unknown[]) =>
      forbidden("supabase.auth.signInWithPassword"),
    signOut: (..._args: unknown[]) => forbidden("supabase.auth.signOut"),
  },
};

export async function coreNotImplemented<T = unknown>(
  feature: string,
): Promise<T> {
  assertSupabaseAllowed();
  const isDev = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
  if (isDev) {
    console.error(
      "[supabase] Supabase client forbidden in Docker mode. Use dockerCoreClient or mock.",
    );
  }
  throw new Error(`CORE TODO: ${feature}`);
}
