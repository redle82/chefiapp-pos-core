/**
 * BackendAdapter — SSOT do backend ativo
 *
 * Define qual infraestrutura está em uso (Docker Core vs Supabase).
 * Em modo Docker: ZERO instâncias de Supabase/GoTrueClient.
 *
 * IMPORTANT: Do not use import.meta here. This file is loaded by Jest (commonjs);
 * use process.env only so core-engine tests compile.
 */

export enum BackendType {
  docker = "docker",
  supabase = "supabase",
}

const DOCKER_INDICATORS = ["localhost:3001", "127.0.0.1:3001"];

function getUrl(): string {
  if (typeof process !== "undefined" && process.env?.VITE_SUPABASE_URL) {
    return process.env.VITE_SUPABASE_URL;
  }
  return "";
}

/**
 * Retorna o backend ativo com base na config.
 * localhost:3001 / 127.0.0.1:3001 => docker (PostgREST direto).
 */
export function getBackendType(): BackendType {
  const url = getUrl();
  if (DOCKER_INDICATORS.some((h) => url.includes(h))) return BackendType.docker;
  return BackendType.supabase;
}

export function isDockerBackend(): boolean {
  return getBackendType() === BackendType.docker;
}

export function isSupabaseBackend(): boolean {
  return getBackendType() === BackendType.supabase;
}

/**
 * Em DEV: se alguém tentar usar Supabase em modo Docker, falhar alto.
 */
export function assertSupabaseAllowed(): void {
  if (getBackendType() === BackendType.docker) {
    const msg =
      "Supabase client forbidden in Docker mode. Use dockerCoreClient (PostgREST fetch) or mock.";
    const isDev = typeof process !== "undefined" && process.env.NODE_ENV === "development";
    if (isDev) {
      console.error("[BackendAdapter]", msg);
    }
    throw new Error(msg);
  }
}
