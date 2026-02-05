/**
 * Supabase client — REMOVIDO. Backend único: Docker Core.
 *
 * Não usar. Use getDockerCoreFetchClient() de dockerCoreFetchClient.ts
 * ou o export "supabase" de ../supabase/index.ts (alias do cliente Docker).
 */

export function getSupabaseClient(): never {
  throw new Error(
    "Supabase client removed. Use Docker Core: getDockerCoreFetchClient() from ./dockerCoreFetchClient or supabase from ../supabase."
  );
}
