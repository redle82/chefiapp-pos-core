/**
 * Docker Core client for React Native/Expo — PostgREST via fetch (no @supabase/supabase-js).
 * Same API surface as Supabase client: .from(), .rpc(), .channel(), .auth, .functions.
 */

const BASE_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_CORE_URL) ||
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SUPABASE_URL) ||
  '';
const ANON_KEY =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_CORE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY) ||
  'chefiapp-core-secret-key-min-32-chars-long';

const REST_BASE = BASE_URL.replace(/\/$/, '');
const REST = REST_BASE.endsWith('/rest/v1')
  ? REST_BASE
  : REST_BASE.endsWith('/rest')
    ? `${REST_BASE}/v1`
    : REST_BASE
      ? `${REST_BASE}/rest/v1`
      : '';

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    apikey: ANON_KEY,
    ...extra,
  };
}

export type PostgrestError = { message: string; code?: string; details?: string };
export type PostgrestResponse<T = unknown> = { data: T | null; error: PostgrestError | null };

type QueryParams = Record<string, string>;

interface FilterBuilder {
  select(columns?: string, _opts?: { count?: string; head?: boolean }): FilterBuilder;
  insert(body: object | object[]): FilterBuilder;
  upsert(body: object | object[], opts?: { onConflict?: string }): FilterBuilder;
  update(body: object): FilterBuilder;
  delete(): FilterBuilder;
  eq(column: string, value: unknown): FilterBuilder;
  gte(column: string, value: unknown): FilterBuilder;
  in(column: string, values: unknown[]): FilterBuilder;
  order(column: string, opts?: { ascending?: boolean }): FilterBuilder;
  limit(n: number): FilterBuilder;
  range(from: number, to: number): FilterBuilder;
  single(): Promise<PostgrestResponse>;
  maybeSingle(): Promise<PostgrestResponse>;
  then<T>(onfulfilled?: (value: PostgrestResponse) => T | PromiseLike<T>, onrejected?: (reason: unknown) => never): Promise<T>;
}

function buildFilterBuilder(table: string): FilterBuilder {
  const state: {
    selectCols: string;
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: object | object[];
    params: QueryParams;
    single: boolean;
    maybeSingle: boolean;
    rangeFrom?: number;
    rangeTo?: number;
    upsertOpts?: { onConflict?: string };
  } = {
    selectCols: '*',
    method: 'GET',
    params: {},
    single: false,
    maybeSingle: false,
  };

  const run = async (): Promise<PostgrestResponse> => {
    if (!REST) {
      return { data: null, error: { message: 'EXPO_PUBLIC_CORE_URL or EXPO_PUBLIC_SUPABASE_URL required' } };
    }
    const url = `${REST}/${table}`;
    const urlObj = new URL(url, BASE_URL || 'http://localhost:3001');
    if (state.method === 'GET') {
      urlObj.searchParams.set('select', state.selectCols);
      Object.entries(state.params).forEach(([k, v]) => urlObj.searchParams.set(k, String(v)));
      if (state.single || state.maybeSingle) urlObj.searchParams.set('limit', '1');
    } else {
      if (state.selectCols && state.selectCols !== '*') urlObj.searchParams.set('select', state.selectCols);
      Object.entries(state.params).forEach(([k, v]) => urlObj.searchParams.set(k, String(v)));
      if (state.method === 'POST' && state.upsertOpts?.onConflict) {
        urlObj.searchParams.set('on_conflict', state.upsertOpts.onConflict);
      }
    }
    const init: RequestInit = {
      method: state.method,
      headers: headers() as HeadersInit,
    };
    if (state.method === 'GET' && state.rangeFrom != null && state.rangeTo != null) {
      (init.headers as Headers).set('Range', `${state.rangeFrom}-${state.rangeTo}`);
    }
    if (state.method === 'POST' && state.body !== undefined) {
      init.body = JSON.stringify(state.body);
      const prefer = state.upsertOpts?.onConflict ? ['return=representation', 'resolution=merge-duplicates'] : ['return=representation'];
      (init.headers as Headers).set('Prefer', prefer.join(', '));
    }
    if (state.method === 'PATCH' && state.body !== undefined) {
      init.body = JSON.stringify(state.body);
    }
    try {
      const res = await fetch(urlObj.toString(), init);
      const text = await res.text();
      if (res.status === 409 && state.method === 'POST' && state.upsertOpts?.onConflict) {
        return { data: null, error: null };
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
      if (text === '' || state.method === 'DELETE') {
        return { data: state.method === 'DELETE' ? null : [], error: null };
      }
      const data = JSON.parse(text);
      if (state.single && Array.isArray(data)) {
        if (data.length === 0) return { data: null, error: { message: 'No rows found for single()' } };
        return { data: data[0], error: null };
      }
      if (state.maybeSingle && Array.isArray(data)) {
        return { data: data.length ? data[0] : null, error: null };
      }
      if (state.method === 'POST' && Array.isArray(data) && data.length === 1) {
        return { data: data[0], error: null };
      }
      return { data, error: null };
    } catch (e: unknown) {
      return {
        data: null,
        error: { message: e instanceof Error ? e.message : String(e) },
      };
    }
  };

  const chain: FilterBuilder = {
    select(columns = '*') {
      state.selectCols = columns;
      return chain;
    },
    insert(body: object | object[]) {
      state.method = 'POST';
      state.body = body;
      return chain;
    },
    upsert(body: object | object[], opts?: { onConflict?: string }) {
      state.method = 'POST';
      state.body = body;
      state.upsertOpts = opts;
      return chain;
    },
    update(body: object) {
      state.method = 'PATCH';
      state.body = body;
      return chain;
    },
    delete() {
      state.method = 'DELETE';
      return chain;
    },
    eq(column: string, value: unknown) {
      state.params[column] = `eq.${value}`;
      return chain;
    },
    gte(column: string, value: unknown) {
      state.params[column] = `gte.${value}`;
      return chain;
    },
    in(column: string, values: unknown[]) {
      state.params[column] = `in.(${values.map((v) => String(v)).join(',')})`;
      return chain;
    },
    order(column: string, opts?: { ascending?: boolean }) {
      const dir = opts?.ascending !== false ? 'asc' : 'desc';
      const existing = state.params['order'] || '';
      state.params['order'] = existing ? `${existing},${column}.${dir}` : `${column}.${dir}`;
      return chain;
    },
    limit(n: number) {
      state.params['limit'] = String(n);
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

const noopChannel = {
  on: () => noopChannel,
  subscribe: () => ({ unsubscribe: () => {} }),
  unsubscribe: () => {},
};

const noopSubscription = { unsubscribe: () => {} };

/** Demo session when EXPO_PUBLIC_DEMO_AUTH=true or email is demo@demo (no Supabase). */
const DEMO_AUTH =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_DEMO_AUTH === 'true') || false;
function createDemoSession(email: string): { user: { id: string; email?: string }; access_token?: string } {
  return {
    user: { id: 'demo-user', email },
    access_token: 'demo-token',
  };
}

export const coreClient = {
  from(table: string) {
    return buildFilterBuilder(table);
  },
  async rpc(fnName: string, params: object = {}) {
    if (!REST) {
      return { data: null, error: { message: 'EXPO_PUBLIC_CORE_URL required' } };
    }
    try {
      const res = await fetch(`${REST.replace(/\/v1$/, '')}/rpc/${fnName}`, {
        method: 'POST',
        headers: headers() as HeadersInit,
        body: JSON.stringify(params),
      });
      const text = await res.text();
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
      const data = text === '' ? null : JSON.parse(text);
      return { data, error: null };
    } catch (e: unknown) {
      return {
        data: null,
        error: { message: e instanceof Error ? e.message : String(e) },
      };
    }
  },
  channel(_topic: string) {
    return noopChannel;
  },
  removeChannel(_ch: unknown) {
    return Promise.resolve();
  },
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signInWithPassword: (opts: { email?: string; password?: string }) => {
      const email = opts?.email ?? '';
      if (DEMO_AUTH || email === 'demo@demo') {
        const session = createDemoSession(email || 'demo@demo');
        return Promise.resolve({ data: { session, user: session.user }, error: null });
      }
      return Promise.reject(new Error('Auth via Supabase removed. Use Core auth or set EXPO_PUBLIC_DEMO_AUTH=true for demo.'));
    },
    signUp: (opts: { email?: string; password?: string }) => {
      const email = opts?.email ?? '';
      if (DEMO_AUTH || email === 'demo@demo') {
        const session = createDemoSession(email || 'demo@demo');
        return Promise.resolve({ data: { session, user: session.user }, error: null });
      }
      return Promise.reject(new Error('Auth via Supabase removed. Use Core auth or set EXPO_PUBLIC_DEMO_AUTH=true for demo.'));
    },
    signOut: () => Promise.resolve(),
    onAuthStateChange: () => ({ data: { subscription: noopSubscription } }),
    startAutoRefresh: () => {},
    stopAutoRefresh: () => {},
  },
  functions: {
    invoke: (name: string, opts?: { body?: object }) => {
      const baseUrl = REST_BASE || BASE_URL;
      if (!baseUrl) return Promise.reject(new Error('CORE_URL required for functions'));
      const url = `${baseUrl}/functions/v1/${name}`;
      return fetch(url, {
        method: 'POST',
        headers: headers() as HeadersInit,
        body: opts?.body ? JSON.stringify(opts.body) : undefined,
      }).then((r) => (r.ok ? r.json() : r.text().then((t) => Promise.reject(new Error(t)))));
    },
  },
};
