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

// Allow process.env for Jest/Node environments without creating type errors in Vite
declare const process: {
  env: Record<string, string | undefined>;
  NODE_ENV: string;
};

const DOCKER_INDICATORS = ["localhost:3001", "127.0.0.1:3001", "/rest"];

function getUrl(): string {
  let url = "";

  // Vite (Browser)
  if (
    typeof import.meta !== "undefined" &&
    import.meta.env?.VITE_SUPABASE_URL
  ) {
    url = import.meta.env.VITE_SUPABASE_URL;
  }
  // Jest / Node
  else if (typeof process !== "undefined" && process.env?.VITE_SUPABASE_URL) {
    url = process.env.VITE_SUPABASE_URL;
  }

  if (!url) {
    const isProd =
      typeof process !== "undefined" && process.env.NODE_ENV === "production";
    if (isProd) {
      throw new Error(
        "CRITICAL: VITE_SUPABASE_URL is missing. Core connectivity impossible.",
      );
    }
    return "/rest";
  }

  return url.replace(/https?:\/\/(localhost|127\.0\.0\.1):3001/, "/rest");
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
    const isDev =
      typeof process !== "undefined" && process.env.NODE_ENV === "development";
    if (isDev) {
      console.error("[BackendAdapter]", msg);
    }
    throw new Error(msg);
  }
}
