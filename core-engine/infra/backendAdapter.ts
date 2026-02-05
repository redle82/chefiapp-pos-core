/**
 * BackendAdapter — SSOT do backend ativo
 *
 * Backend único: Docker Core (PostgREST). Sem Supabase.
 * Em modo Docker: ZERO instâncias de Supabase/GoTrueClient.
 *
 * IMPORTANT: Do not use import.meta here. This file is loaded by Jest (commonjs);
 * use process.env only so core-engine tests compile.
 */

export enum BackendType {
  docker = "docker",
  none = "none",
}

declare const process: {
  env: Record<string, string | undefined>;
  NODE_ENV: string;
};

const DOCKER_INDICATORS = ["localhost:3001", "127.0.0.1:3001", "/rest"];

function getRawBaseUrl(): string {
  let url = "";
  if (typeof process !== "undefined" && process.env?.VITE_CORE_URL) {
    url = process.env.VITE_CORE_URL;
  } else if (typeof process !== "undefined" && process.env?.VITE_SUPABASE_URL) {
    url = process.env.VITE_SUPABASE_URL;
  }
  return (url || "").replace(/\/$/, "");
}

function getUrl(): string {
  const url = getRawBaseUrl();
  if (!url) {
    const isProd =
      typeof process !== "undefined" && process.env.NODE_ENV === "production";
    if (isProd) return "";
    return "/rest";
  }
  return url.replace(/https?:\/\/(localhost|127\.0\.0\.1):3001/, "/rest");
}

/**
 * Retorna o backend ativo. Único backend: Docker Core.
 * URL configurada => docker; sem URL => none.
 */
export function getBackendType(): BackendType {
  const url = getUrl();
  if (url.includes("/rest") || DOCKER_INDICATORS.some((h) => url.includes(h))) {
    return BackendType.docker;
  }
  return url ? BackendType.docker : BackendType.none;
}

export function isDockerBackend(): boolean {
  return getBackendType() === BackendType.docker;
}

export function isBackendNone(): boolean {
  return getBackendType() === BackendType.none;
}
