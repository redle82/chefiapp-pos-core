/**
 * BackendAdapter — SSOT do backend ativo
 *
 * Backend único: Docker Core (PostgREST). Sem Supabase.
 * Domínio (pedidos, menu, restaurantes, billing, etc.) usa apenas Core.
 *
 * IMPORTANT: Do not use import.meta here. This file is loaded by Jest (commonjs);
 * use process.env only so core-engine tests compile.
 */

export enum BackendType {
  docker = "docker",
  none = "none",
}

// Allow process.env for Jest/Node environments without creating type errors in Vite
declare const process: {
  env: Record<string, string | undefined>;
  NODE_ENV: string;
};

const DOCKER_INDICATORS = ["localhost:3001", "127.0.0.1:3001", "/rest"];

/** Raw base URL from env. VITE_CORE_URL canónico; VITE_SUPABASE_URL fallback @legacy-remove */
function getRawBaseUrl(): string {
  let url = "";
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_CORE_URL) {
    url = import.meta.env.VITE_CORE_URL;
  } else if (
    typeof import.meta !== "undefined" &&
    import.meta.env?.VITE_SUPABASE_URL
  ) {
    url = import.meta.env.VITE_SUPABASE_URL;
  } else if (typeof process !== "undefined" && process.env?.VITE_CORE_URL) {
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
 * Base URL for health check when backend is Docker (e.g. http://localhost:3001).
 * No browser: sempre usar proxy (window.location.origin) para evitar CORS quando
 * o frontend está em 5175 e o Core em 3001.
 */
export function getBackendHealthCheckBaseUrl(): string {
  // No browser: health deve ir via proxy (same-origin) para não disparar CORS
  if (
    getBackendType() === BackendType.docker &&
    typeof window !== "undefined"
  ) {
    return window.location.origin;
  }
  const url = getRawBaseUrl();
  if (
    url &&
    (url.includes("localhost:3001") || url.includes("127.0.0.1:3001"))
  ) {
    return url;
  }
  return "";
}

/**
 * True when Docker Core is configured; false when VITE_CORE_URL is missing (landing/trial only).
 */
export function getBackendConfigured(): boolean {
  return getUrl() !== "";
}

/**
 * Retorna o backend ativo. Único backend: Docker Core.
 * URL configurada => docker; sem URL => none (landing/trial).
 */
export function getBackendType(): BackendType {
  const url = getUrl();

  if (url.includes("/rest") || DOCKER_INDICATORS.some((h) => url.includes(h))) {
    return BackendType.docker;
  }

  if (
    typeof window !== "undefined" &&
    url &&
    (url.includes(":5175") || url === window.location.origin)
  ) {
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
