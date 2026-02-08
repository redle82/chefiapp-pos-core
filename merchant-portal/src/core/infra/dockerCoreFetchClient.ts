/**
 * Docker Core client — PostgREST via fetch (ZERO @supabase/supabase-js)
 *
 * Usado quando backendType === 'docker'. Garante nenhuma instância de GoTrueClient.
 * API compatível com o que o código usa: .from(), .select(), .eq(), .rpc(), .channel().
 */

import { CONFIG } from "../../config";

const BASE_URL =
  CONFIG.CORE_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");
const ANON_KEY =
  CONFIG.CORE_ANON_KEY || "chefiapp-core-secret-key-min-32-chars-long";

// Ensure REST is PostgREST base: .../rest/v1 (evita rest/rest/v1 quando client usa /rest/v1/table)
const REST_BASE = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
const REST = REST_BASE.endsWith("/rest/v1")
  ? REST_BASE
  : REST_BASE.endsWith("/rest")
  ? `${REST_BASE}/v1`
  : REST_BASE
  ? `${REST_BASE}/rest/v1`
  : "/rest/v1";

function headers(extra: Record<string, string> = {}): Headers {
  const h = new Headers({
    "Content-Type": "application/json",
    Accept: "application/json",
    apikey: ANON_KEY,
    ...extra,
  });
  return h;
}

export type PostgrestError = {
  message: string;
  code?: string;
  details?: string;
};
export type PostgrestResponse<T = unknown> = {
  data: T | null;
  error: PostgrestError | null;
};

type QueryParams = Record<string, string>;

interface FilterBuilder {
  select(columns?: string): FilterBuilder;
  insert(body: object | object[]): FilterBuilder;
  upsert(
    body: object | object[],
    opts?: { onConflict?: string }
  ): FilterBuilder;
  update(body: object): FilterBuilder;
  delete(): FilterBuilder;
  eq(column: string, value: unknown): FilterBuilder;
  in(column: string, values: unknown[]): FilterBuilder;
  or(filter: string): FilterBuilder;
  order(column: string, opts?: { ascending?: boolean }): FilterBuilder;
  limit(n: number): FilterBuilder;
  range(from: number, to: number): FilterBuilder;
  single(): Promise<PostgrestResponse>;
  maybeSingle(): Promise<PostgrestResponse>;
  then<T>(
    onfulfilled?: (value: PostgrestResponse) => T | PromiseLike<T>,
    onrejected?: (reason: unknown) => never
  ): Promise<T>;
}

function buildFilterBuilder(table: string): FilterBuilder {
  const state: {
    selectCols: string;
    method: "GET" | "POST" | "PATCH" | "DELETE";
    body?: object | object[];
    params: QueryParams;
    single: boolean;
    maybeSingle: boolean;
    rangeFrom?: number;
    rangeTo?: number;
    upsertOpts?: { onConflict?: string };
  } = {
    selectCols: "*",
    method: "GET",
    params: {},
    single: false,
    maybeSingle: false,
  };

  const run = async (): Promise<PostgrestResponse> => {
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:5175";

    let url: URL;
    try {
      // If REST is relative, use current origin as base
      url = new URL(`${REST}/${table}`, baseUrl);
    } catch (e) {
      console.error("[DockerCore] Critical: Failed to construct URL", {
        REST,
        table,
        baseUrl,
      });
      // Fallback to a safe but likely failing URL to prevent crash
      url = new URL("/error-invalid-url", baseUrl);
    }
    if (state.method === "GET") {
      url.searchParams.set("select", state.selectCols);
      Object.entries(state.params).forEach(([k, v]) =>
        url.searchParams.set(k, v)
      );
      if (state.single || state.maybeSingle) url.searchParams.set("limit", "1");
    } else {
      // POST/PATCH: select limita colunas retornadas (return=representation)
      if (state.selectCols && state.selectCols !== "*") {
        url.searchParams.set("select", state.selectCols);
      }
      Object.entries(state.params).forEach(([k, v]) =>
        url.searchParams.set(k, v)
      );
      // PostgREST: on_conflict é query param (não header) para upsert em UNIQUE.
      if (state.method === "POST" && state.upsertOpts?.onConflict) {
        url.searchParams.set("on_conflict", state.upsertOpts.onConflict);
      }
    }
    const init: RequestInit = {
      method: state.method,
      headers: headers(),
    };
    if (
      state.method === "GET" &&
      state.rangeFrom != null &&
      state.rangeTo != null
    ) {
      (init.headers as Headers).set(
        "Range",
        `${state.rangeFrom}-${state.rangeTo}`
      );
    }
    if (state.method === "POST" && state.body !== undefined) {
      init.body = JSON.stringify(state.body);
      const prefer: string[] = ["return=representation"];
      if (state.upsertOpts?.onConflict) {
        prefer.push("resolution=merge-duplicates");
      }
      (init.headers as Headers).set("Prefer", prefer.join(", "));
    }
    if (state.method === "PATCH" && state.body !== undefined) {
      init.body = JSON.stringify(state.body);
    }
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(url.toString(), {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(id);
      const text = await res.text();
      // API_ERROR_CONTRACT: se resposta não é JSON (ex.: HTML 404), não fazer parse; devolver erro tipado.
      const ct = res.headers.get("Content-Type")?.toLowerCase() ?? "";
      const isJson = ct.includes("application/json");
      if (text.trim() && !isJson) {
        return {
          data: null,
          error: {
            message: "Backend indisponível",
            code: "BACKEND_UNAVAILABLE",
          },
        };
      }
      // Upsert idempotente: 409 Conflict = linha já existe (ex.: installed_modules), tratar como sucesso.
      if (
        res.status === 409 &&
        state.method === "POST" &&
        state.upsertOpts?.onConflict
      ) {
        return { data: null, error: null };
      }
      if (!res.ok) {
        let err: PostgrestError;
        try {
          const j = JSON.parse(text);
          err = {
            message: j.message || res.statusText,
            code: j.code,
            details: j.details,
          };
        } catch {
          err = { message: text || res.statusText };
        }
        return { data: null, error: err };
      }
      if (text === "" || state.method === "DELETE") {
        return { data: state.method === "DELETE" ? null : [], error: null };
      }
      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        // API_ERROR_CONTRACT: corpo não-JSON (ex.: HTML) mesmo com Content-Type enganador
        return {
          data: null,
          error: {
            message: "Backend indisponível",
            code: "BACKEND_UNAVAILABLE",
          },
        };
      }
      if (state.single && Array.isArray(data)) {
        if (data.length === 0)
          return {
            data: null,
            error: { message: "No rows found for single()" },
          };
        return { data: data[0], error: null };
      }
      if (state.maybeSingle && Array.isArray(data)) {
        return { data: data.length ? data[0] : null, error: null };
      }
      if (state.method === "POST" && Array.isArray(data) && data.length === 1) {
        return { data: data[0], error: null };
      }
      return { data, error: null };
    } catch (e: any) {
      return {
        data: null,
        error: { message: e?.message ?? String(e) },
      };
    }
  };

  const chain: FilterBuilder = {
    select(columns = "*") {
      state.selectCols = columns;
      return chain;
    },
    insert(body: object | object[]) {
      state.method = "POST";
      state.body = body;
      return chain;
    },
    upsert(body: object | object[], opts?: { onConflict?: string }) {
      state.method = "POST";
      state.body = body;
      state.upsertOpts = opts;
      return chain;
    },
    update(body: object) {
      state.method = "PATCH";
      state.body = body;
      return chain;
    },
    delete() {
      state.method = "DELETE";
      return chain;
    },
    eq(column: string, value: unknown) {
      state.params[column] = `eq.${value}`;
      return chain;
    },
    in(column: string, values: unknown[]) {
      state.params[column] = `in.(${values.map((v) => String(v)).join(",")})`;
      return chain;
    },
    or(filter: string) {
      state.params["or"] = filter;
      return chain;
    },
    order(column: string, opts?: { ascending?: boolean }) {
      const dir = opts?.ascending !== false ? "asc" : "desc";
      const existing = state.params["order"] || "";
      state.params["order"] = existing
        ? `${existing},${column}.${dir}`
        : `${column}.${dir}`;
      return chain;
    },
    limit(n: number) {
      state.params["limit"] = String(n);
      return chain;
    },
    range(from: number, to: number) {
      state.rangeFrom = from;
      state.rangeTo = to;
      return chain;
    },
    single() {
      state.single = true;
      return run();
    },
    maybeSingle() {
      state.maybeSingle = true;
      return run();
    },
    then(onfulfilled, onrejected) {
      return run().then(onfulfilled, onrejected);
    },
  };
  return chain;
}

export interface DockerCoreClientShape {
  from(table: string): FilterBuilder;
  rpc(fnName: string, params?: object): Promise<PostgrestResponse>;
  channel(_topic: string): RealtimeChannelStub;
}

export interface RealtimeChannelStub {
  subscribe(_cb?: (payload: unknown) => void): RealtimeChannelStub;
  unsubscribe(): void;
  on(
    event: string,
    filter: object,
    callback: (payload: any) => void
  ): RealtimeChannelStub;
}

const noopChannel: RealtimeChannelStub = {
  subscribe() {
    return noopChannel;
  },
  unsubscribe() {},
  on(_event: string, _filter: object, _callback: (payload: any) => void) {
    return noopChannel;
  },
};

let clientInstance: DockerCoreClientShape | null = null;

export function getDockerCoreFetchClient(): DockerCoreClientShape {
  if (clientInstance) return clientInstance;
  clientInstance = {
    from(table: string) {
      return buildFilterBuilder(table);
    },
    async rpc(fnName: string, params: object = {}) {
      try {
        const res = await fetch(`${REST}/rpc/${fnName}`, {
          method: "POST",
          headers: headers(),
          body: JSON.stringify(params),
        });
        const text = await res.text();
        // API_ERROR_CONTRACT: se resposta não é JSON, não fazer parse; devolver erro tipado.
        const ct = res.headers.get("Content-Type")?.toLowerCase() ?? "";
        const isJson = ct.includes("application/json");
        if (text.trim() && !isJson) {
          return {
            data: null,
            error: {
              message: "Backend indisponível",
              code: "BACKEND_UNAVAILABLE",
            },
          };
        }
        if (!res.ok) {
          let err: PostgrestError;
          try {
            const j = JSON.parse(text);
            err = { message: j.message || res.statusText, code: j.code };
          } catch {
            err = { message: text || res.statusText };
          }
          return { data: null, error: err };
        }
        if (text === "") return { data: null, error: null };
        try {
          const data = JSON.parse(text);
          return { data, error: null };
        } catch {
          // API_ERROR_CONTRACT: corpo não-JSON
          return {
            data: null,
            error: {
              message: "Backend indisponível",
              code: "BACKEND_UNAVAILABLE",
            },
          };
        }
      } catch (e: any) {
        return {
          data: null,
          error: { message: e?.message ?? String(e) },
        };
      }
    },
    channel(_topic: string) {
      return noopChannel;
    },
  };
  return clientInstance;
}
