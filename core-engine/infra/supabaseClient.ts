/**
 * Supabase client — APENAS quando backendType === 'supabase'
 *
 * NÃO importar quando backend é Docker. Use dockerCoreClient (connection.ts).
 * Em modo Docker, connection.ts usa dockerCoreFetchClient (fetch direto PostgREST).
 * Este arquivo usa @supabase/supabase-js — não carregar em bundle Docker.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const DOCKER_CORE_URL =
  import.meta.env.VITE_SUPABASE_URL || "http://localhost:3001";
const DOCKER_CORE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "chefiapp-core-secret-key-min-32-chars-long";

const noOpStorage: Storage = {
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => {},
  removeItem: (_key: string) => {},
  clear: () => {},
  get length() {
    return 0;
  },
  key: (_index: number) => null,
};

function getStorageKey(): string {
  if (typeof window === "undefined") return "chefiapp_docker_core_ssr";
  const host = window.location.hostname || "localhost";
  const env = import.meta.env.DEV ? "dev" : "prod";
  return `chefiapp_docker_core_${host}_${env}`;
}

const customFetch: typeof fetch = async (input, init = {}) => {
  const url = typeof input === "string" ? input : String(input);
  const headers = new Headers();
  if (init.headers) {
    if (init.headers instanceof Headers) {
      init.headers.forEach((value, key) => headers.append(key, value));
    } else if (Array.isArray(init.headers)) {
      init.headers.forEach(([k, v]) => headers.append(k, String(v)));
    } else {
      Object.entries(init.headers).forEach(([k, v]) => {
        if (v) headers.append(k, String(v));
      });
    }
  }
  headers.delete("Authorization");
  headers.delete("authorization");
  if (!headers.has("apikey")) headers.set("apikey", DOCKER_CORE_ANON_KEY);
  const newInit: RequestInit = { ...init, headers };
  if (
    import.meta.env.DEV &&
    import.meta.env.VITE_DEBUG_DOCKER_FETCH === "true" &&
    url.includes("/rest/v1/")
  ) {
    console.log("[supabaseClient] Fetch:", url.substring(0, 80));
  }
  return fetch(input, newInit);
};

const GLOBAL_KEY = "__chefiapp_supabase_client";
type Win = Window & { [GLOBAL_KEY]?: SupabaseClient };

function createOnce(): SupabaseClient {
  return createClient(DOCKER_CORE_URL, DOCKER_CORE_ANON_KEY, {
    db: { schema: "public" },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: noOpStorage,
      storageKey: getStorageKey(),
    },
    global: {
      headers: { apikey: DOCKER_CORE_ANON_KEY },
      fetch: customFetch,
    },
  });
}

/**
 * Singleton do cliente Supabase (Docker Core / PostgREST).
 * Usar apenas este getter; não chamar createClient em outros arquivos.
 */
export function getSupabaseClient(): SupabaseClient {
  if (typeof window !== "undefined") {
    const win = window as Win;
    if (!win[GLOBAL_KEY]) win[GLOBAL_KEY] = createOnce();
    return win[GLOBAL_KEY];
  }
  return createOnce();
}
