/**
 * Docker Core client — PostgREST via fetch (ZERO @supabase/supabase-js)
 *
 * Usado quando backendType === 'docker'. Garante nenhuma instância de GoTrueClient.
 * API compatível com o que o código usa: .from(), .select(), .eq(), .is(), .rpc(), .channel().
 */

import { CONFIG } from "../../config";
import { Logger } from "../logger";

// BASE URL: Em DEV (browser) CORE_URL é "" → URLs relativas (/rest/v1/...) vão
// para o origin (ex. localhost:5175). O Vite proxy (vite.config: /rest → 3001)
// encaminha para o Core. O pedido CHEGA ao PostgREST em 3001; 404 = tabela
// inexistente no schema, não "URL errada". Para usar 3001 direto: VITE_CORE_URL=http://localhost:3001.
const BASE_URL_RAW =
  CONFIG.CORE_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");

const META_ENV = (globalThis as any)?.import?.meta?.env;
const IS_DEV = (() => {
  if (typeof META_ENV?.DEV !== "undefined") {
    return Boolean(META_ENV.DEV);
  }
  if (typeof process !== "undefined" && process.env) {
    return process.env.NODE_ENV === "development";
  }
  return false;
})();

// DEV browser: route through Vite proxy (same-origin) to avoid cross-origin
// preflight overhead and potential connection timeouts to localhost:3001.
// In production or SSR, keep the absolute URL as-is.
const BASE_URL =
  typeof window !== "undefined" && IS_DEV
    ? BASE_URL_RAW.replace(/https?:\/\/(localhost|127\.0\.0\.1):3001/, "")
    : BASE_URL_RAW;

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

/** After first 404 (table does not exist), skip further requests for a short window to avoid console noise.
 *  TTL = 30 s — allows recovery when migrations are applied while the app is running.
 *  In DEV we use a long TTL for optional tables so we never probe (no 404 in console). */
const tableUnavailableUntil = new Map<string, number>();
const TABLE_UNAVAILABLE_TTL_MS = 30_000;
/** In DEV, optional tables are marked unavailable for 24h so we never hit the network (no 404). */
const OPTIONAL_TABLES_TTL_DEV_MS = 24 * 60 * 60 * 1000;

/** Canonical list of optional Core tables; see docs/architecture/OPTIONAL_FEATURE_TABLES_CONTRACT.md.
 * api_keys, webhook_out_*: ver docker-core/schema/migrations/20260301_*.sql
 * merchant_subscriptions: faturação; ver docker-core/schema/migrations/20260222_merchant_subscriptions.sql
 * gm_audit_logs: trilha de auditoria e eventos fiscais; ver docker-core/schema/migrations/20260211_core_audit_logs.sql */
const OPTIONAL_TABLES = [
  "gm_reservations",
  "gm_customers",
  // gm_terminals removed: table is now deployed and required for device provisioning
  "api_keys",
  "webhook_out_config",
  "webhook_out_delivery_log",
  "merchant_subscriptions",
  "gm_audit_logs",
] as const;

/** RPCs opcionais: se a migração não estiver aplicada (404), não repetir o pedido durante TTL para evitar ruído na consola.
 * get_multiunit_overview: ver docker-core/schema/migrations/20260221_multiunit_aggregate_views.sql */
const OPTIONAL_RPCS = ["get_multiunit_overview"] as const;
const rpcUnavailableUntil = new Map<string, number>();
const RPC_UNAVAILABLE_TTL_MS = 30_000;
const RPC_UNAVAILABLE_TTL_DEV_MS = 24 * 60 * 60 * 1000;

function isRpcUnavailable(fnName: string): boolean {
  const until = rpcUnavailableUntil.get(fnName);
  if (until === undefined) return false;
  if (Date.now() > until) {
    rpcUnavailableUntil.delete(fnName);
    return false;
  }
  return true;
}

function markRpcUnavailable(fnName: string): void {
  const ttl =
    typeof window !== "undefined" && IS_DEV
      ? RPC_UNAVAILABLE_TTL_DEV_MS
      : RPC_UNAVAILABLE_TTL_MS;
  rpcUnavailableUntil.set(fnName, Date.now() + ttl);
}

/** Log once per session when code hits an optional table that is unavailable (DEV only). */
const optionalTableLoggedThisSession = new Set<string>();

function isTableUnavailable(table: string): boolean {
  const until = tableUnavailableUntil.get(table);
  if (until === undefined) return false;
  if (Date.now() > until) {
    tableUnavailableUntil.delete(table);
    return false;
  }
  return true;
}

function markTableUnavailable(table: string): void {
  tableUnavailableUntil.set(table, Date.now() + TABLE_UNAVAILABLE_TTL_MS);
}

function markTableAvailable(table: string): void {
  tableUnavailableUntil.delete(table);
}

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
  hint?: string;
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
    opts?: { onConflict?: string },
  ): FilterBuilder;
  update(body: object): FilterBuilder;
  delete(): FilterBuilder;
  eq(column: string, value: unknown): FilterBuilder;
  is(column: string, value: null | unknown): FilterBuilder;
  gte(column: string, value: unknown): FilterBuilder;
  in(column: string, values: unknown[]): FilterBuilder;
  not(
    column: string,
    op: string,
    value: string | null | undefined,
  ): FilterBuilder;
  or(filter: string): FilterBuilder;
  order(column: string, opts?: { ascending?: boolean }): FilterBuilder;
  limit(n: number): FilterBuilder;
  range(from: number, to: number): FilterBuilder;
  single(): Promise<PostgrestResponse>;
  maybeSingle(): Promise<PostgrestResponse>;
  then<T>(
    onfulfilled?: (value: PostgrestResponse) => T | PromiseLike<T>,
    onrejected?: (reason: unknown) => never,
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
    if (isTableUnavailable(table)) {
      if (
        typeof window !== "undefined" &&
        IS_DEV &&
        (OPTIONAL_TABLES as readonly string[]).includes(table) &&
        !optionalTableLoggedThisSession.has(table)
      ) {
        optionalTableLoggedThisSession.add(table);
        const hint =
          table === "gm_audit_logs"
            ? "dbmate up ou psql -f schema/migrations/20260211_core_audit_logs.sql"
            : "ver docker-core/Makefile ou docs/architecture/OPTIONAL_FEATURE_TABLES_CONTRACT.md";
        Logger.debug(
          `[DEV] ${table} indisponível (opcional). Para ativar: ${hint}`,
        );
      }
      return {
        data: null,
        error: { message: "Table unavailable", code: "42P01" },
      };
    }

    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:5175";

    let url: URL;
    try {
      // If REST is relative, use current origin as base
      url = new URL(`${REST}/${table}`, baseUrl);
    } catch (e) {
      Logger.error("[DockerCore] Critical: Failed to construct URL", null, {
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
        url.searchParams.set(k, v),
      );
      if (state.single || state.maybeSingle) url.searchParams.set("limit", "1");
    } else {
      // POST/PATCH: select limita colunas retornadas (return=representation)
      if (state.selectCols && state.selectCols !== "*") {
        url.searchParams.set("select", state.selectCols);
      }
      Object.entries(state.params).forEach(([k, v]) =>
        url.searchParams.set(k, v),
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
        `${state.rangeFrom}-${state.rangeTo}`,
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
    const id = setTimeout(
      () => controller.abort("PostgREST request timeout (5s)"),
      5000,
    );
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
        if (res.status === 404) markTableUnavailable(table);
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
        if (
          res.status === 404 &&
          (err.code === "42P01" ||
            /does not exist|relation.*does not exist/.test(
              (err.message ?? "").toLowerCase(),
            ))
        ) {
          markTableUnavailable(table);
        }
        return { data: null, error: err };
      }
      if (text === "" || state.method === "DELETE") {
        markTableAvailable(table);
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
        markTableAvailable(table);
        return { data: data[0], error: null };
      }
      if (state.maybeSingle && Array.isArray(data)) {
        markTableAvailable(table);
        return { data: data.length ? data[0] : null, error: null };
      }
      if (state.method === "POST" && Array.isArray(data) && data.length === 1) {
        markTableAvailable(table);
        return { data: data[0], error: null };
      }
      markTableAvailable(table);
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
      // PostgREST doesn't accept spaces in select; sanitize "id, name" → "id,name"
      state.selectCols = columns.replace(/,\s+/g, ",");
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
    is(column: string, value: null | unknown) {
      if (value === null || value === undefined) {
        state.params[column] = "is.null";
      } else {
        state.params[column] = `eq.${value}`;
      }
      return chain;
    },
    gte(column: string, value: unknown) {
      state.params[column] = `gte.${value}`;
      return chain;
    },
    in(column: string, values: unknown[]) {
      state.params[column] = `in.(${values.map((v) => String(v)).join(",")})`;
      return chain;
    },
    not(column: string, op: string, value: string | null | undefined) {
      const v = value === null || value === undefined ? "null" : String(value);
      state.params[column] = `not.${op}.${v}`;
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
  removeChannel(channel: RealtimeChannelStub): void;
}

export interface RealtimeChannelStub {
  subscribe(_cb?: (payload: unknown) => void): RealtimeChannelStub;
  unsubscribe(): void;
  on(
    event: string,
    filter: object,
    callback: (payload: any) => void,
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

/**
 * Probes optional tables (gm_reservations, gm_customers). On 404, run() adds
 * them to tableUnavailable so subsequent requests are short-circuited (1 network 404 per table).
 * Call before first render to avoid duplicate 404s from Strict Mode double-mount.
 *
 * In DEV (browser), skip the probe and mark these tables unavailable so we never hit 404
 * when the migration was not applied yet; console stays clean. To enable the tables,
 * run ./scripts/core/apply-missing-migrations.sh. See docs/architecture/OPTIONAL_FEATURE_TABLES_CONTRACT.md.
 */
export async function probeOptionalTables(): Promise<void> {
  if (typeof window !== "undefined" && IS_DEV) {
    const ttl = OPTIONAL_TABLES_TTL_DEV_MS;
    OPTIONAL_TABLES.forEach((table) =>
      tableUnavailableUntil.set(table, Date.now() + ttl),
    );
    return;
  }
  const core = getDockerCoreFetchClient();
  await Promise.all(
    OPTIONAL_TABLES.map((table) => core.from(table).select("id").limit(0)),
  ).catch(() => {
    // Non-fatal: Core may be down or not reachable
  });
}

export function getDockerCoreFetchClient(): DockerCoreClientShape {
  if (clientInstance) return clientInstance;
  clientInstance = {
    from(table: string) {
      return buildFilterBuilder(table);
    },
    async rpc(fnName: string, params: object = {}) {
      try {
        if (
          (OPTIONAL_RPCS as readonly string[]).includes(fnName) &&
          isRpcUnavailable(fnName)
        ) {
          return {
            data: null,
            error: {
              message: "Function not available",
              code: "FUNCTION_UNAVAILABLE",
            },
          };
        }
        const rpcUrl = `${REST}/rpc/${fnName}`;
        if (IS_DEV) {
          Logger.debug(`[CoreRPC] POST ${rpcUrl}`, {
            fnName,
            paramsKeys: Object.keys(params),
          });
        }
        const res = await fetch(rpcUrl, {
          method: "POST",
          headers: headers(),
          body: JSON.stringify(params),
        });
        const text = await res.text();
        if (IS_DEV) {
          Logger.debug(`[CoreRPC] ${fnName} → ${res.status}`, {
            preview: text.substring(0, 200),
          });
        }
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
          if (
            res.status === 404 &&
            (OPTIONAL_RPCS as readonly string[]).includes(fnName)
          ) {
            markRpcUnavailable(fnName);
          }
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
    removeChannel(channel: RealtimeChannelStub) {
      try {
        channel.unsubscribe();
      } catch {
        // no-op: channel may already be removed
      }
    },
  };
  return clientInstance;
}
