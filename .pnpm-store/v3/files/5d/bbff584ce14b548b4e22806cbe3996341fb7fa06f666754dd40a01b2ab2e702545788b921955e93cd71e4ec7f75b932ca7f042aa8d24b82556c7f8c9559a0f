// src/types.ts
var InsForgeError = class _InsForgeError extends Error {
  constructor(message, statusCode, error, nextActions) {
    super(message);
    this.name = "InsForgeError";
    this.statusCode = statusCode;
    this.error = error;
    this.nextActions = nextActions;
  }
  static fromApiError(apiError) {
    return new _InsForgeError(
      apiError.message,
      apiError.statusCode,
      apiError.error,
      apiError.nextActions
    );
  }
};

// src/lib/http-client.ts
var HttpClient = class {
  constructor(config) {
    this.userToken = null;
    this.baseUrl = config.baseUrl || "http://localhost:7130";
    this.fetch = config.fetch || (globalThis.fetch ? globalThis.fetch.bind(globalThis) : void 0);
    this.anonKey = config.anonKey;
    this.defaultHeaders = {
      ...config.headers
    };
    if (!this.fetch) {
      throw new Error(
        "Fetch is not available. Please provide a fetch implementation in the config."
      );
    }
  }
  buildUrl(path, params) {
    const url = new URL(path, this.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (key === "select") {
          let normalizedValue = value.replace(/\s+/g, " ").trim();
          normalizedValue = normalizedValue.replace(/\s*\(\s*/g, "(").replace(/\s*\)\s*/g, ")").replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").replace(/,\s+(?=[^()]*\))/g, ",");
          url.searchParams.append(key, normalizedValue);
        } else {
          url.searchParams.append(key, value);
        }
      });
    }
    return url.toString();
  }
  async request(method, path, options = {}) {
    const { params, headers = {}, body, ...fetchOptions } = options;
    const url = this.buildUrl(path, params);
    const requestHeaders = {
      ...this.defaultHeaders
    };
    const authToken = this.userToken || this.anonKey;
    if (authToken) {
      requestHeaders["Authorization"] = `Bearer ${authToken}`;
    }
    let processedBody;
    if (body !== void 0) {
      if (typeof FormData !== "undefined" && body instanceof FormData) {
        processedBody = body;
      } else {
        if (method !== "GET") {
          requestHeaders["Content-Type"] = "application/json;charset=UTF-8";
        }
        processedBody = JSON.stringify(body);
      }
    }
    Object.assign(requestHeaders, headers);
    const response = await this.fetch(url, {
      method,
      headers: requestHeaders,
      body: processedBody,
      ...fetchOptions
    });
    if (response.status === 204) {
      return void 0;
    }
    let data;
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    if (!response.ok) {
      if (data && typeof data === "object" && "error" in data) {
        if (!data.statusCode && !data.status) {
          data.statusCode = response.status;
        }
        const error = InsForgeError.fromApiError(data);
        Object.keys(data).forEach((key) => {
          if (key !== "error" && key !== "message" && key !== "statusCode") {
            error[key] = data[key];
          }
        });
        throw error;
      }
      throw new InsForgeError(
        `Request failed: ${response.statusText}`,
        response.status,
        "REQUEST_FAILED"
      );
    }
    return data;
  }
  get(path, options) {
    return this.request("GET", path, options);
  }
  post(path, body, options) {
    return this.request("POST", path, { ...options, body });
  }
  put(path, body, options) {
    return this.request("PUT", path, { ...options, body });
  }
  patch(path, body, options) {
    return this.request("PATCH", path, { ...options, body });
  }
  delete(path, options) {
    return this.request("DELETE", path, options);
  }
  setAuthToken(token) {
    this.userToken = token;
  }
  getHeaders() {
    const headers = { ...this.defaultHeaders };
    const authToken = this.userToken || this.anonKey;
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }
    return headers;
  }
};

// src/lib/token-manager.ts
var TOKEN_KEY = "insforge-auth-token";
var USER_KEY = "insforge-auth-user";
var CSRF_TOKEN_COOKIE = "insforge_csrf_token";
function getCsrfToken() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split(";").find((c) => c.trim().startsWith(`${CSRF_TOKEN_COOKIE}=`));
  if (!match) return null;
  return match.split("=")[1] || null;
}
function setCsrfToken(token) {
  if (typeof document === "undefined") return;
  const maxAge = 7 * 24 * 60 * 60;
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CSRF_TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}
function clearCsrfToken() {
  if (typeof document === "undefined") return;
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CSRF_TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax${secure}`;
}
var TokenManager = class {
  constructor(storage) {
    // In-memory storage
    this.accessToken = null;
    this.user = null;
    // Mode: 'memory' (new backend) or 'storage' (legacy backend, default)
    this._mode = "storage";
    // Callback for token changes (used by realtime to reconnect with new token)
    this.onTokenChange = null;
    if (storage) {
      this.storage = storage;
    } else if (typeof window !== "undefined" && window.localStorage) {
      this.storage = window.localStorage;
    } else {
      const store = /* @__PURE__ */ new Map();
      this.storage = {
        getItem: (key) => store.get(key) || null,
        setItem: (key, value) => {
          store.set(key, value);
        },
        removeItem: (key) => {
          store.delete(key);
        }
      };
    }
  }
  /**
   * Get current mode
   */
  get mode() {
    return this._mode;
  }
  /**
   * Set mode to memory (new backend with cookies + memory)
   */
  setMemoryMode() {
    if (this._mode === "storage") {
      this.storage.removeItem(TOKEN_KEY);
      this.storage.removeItem(USER_KEY);
    }
    this._mode = "memory";
  }
  /**
   * Set mode to storage (legacy backend with localStorage)
   * Also loads existing session from localStorage
   */
  setStorageMode() {
    this._mode = "storage";
    this.loadFromStorage();
  }
  /**
   * Load session from localStorage
   */
  loadFromStorage() {
    const token = this.storage.getItem(TOKEN_KEY);
    const userStr = this.storage.getItem(USER_KEY);
    if (token && userStr) {
      try {
        this.accessToken = token;
        this.user = JSON.parse(userStr);
      } catch {
        this.clearSession();
      }
    }
  }
  /**
   * Save session (memory always, localStorage only in storage mode)
   */
  saveSession(session) {
    const tokenChanged = session.accessToken !== this.accessToken;
    this.accessToken = session.accessToken;
    this.user = session.user;
    if (this._mode === "storage") {
      this.storage.setItem(TOKEN_KEY, session.accessToken);
      this.storage.setItem(USER_KEY, JSON.stringify(session.user));
    }
    if (tokenChanged && this.onTokenChange) {
      this.onTokenChange();
    }
  }
  /**
   * Get current session
   */
  getSession() {
    this.loadFromStorage();
    if (!this.accessToken || !this.user) return null;
    return {
      accessToken: this.accessToken,
      user: this.user
    };
  }
  /**
   * Get access token
   */
  getAccessToken() {
    this.loadFromStorage();
    return this.accessToken;
  }
  /**
   * Set access token
   */
  setAccessToken(token) {
    const tokenChanged = token !== this.accessToken;
    this.accessToken = token;
    if (this._mode === "storage") {
      this.storage.setItem(TOKEN_KEY, token);
    }
    if (tokenChanged && this.onTokenChange) {
      this.onTokenChange();
    }
  }
  /**
   * Get user
   */
  getUser() {
    return this.user;
  }
  /**
   * Set user
   */
  setUser(user) {
    this.user = user;
    if (this._mode === "storage") {
      this.storage.setItem(USER_KEY, JSON.stringify(user));
    }
  }
  /**
   * Clear session (both memory and localStorage)
   */
  clearSession() {
    const hadToken = this.accessToken !== null;
    this.accessToken = null;
    this.user = null;
    this.storage.removeItem(TOKEN_KEY);
    this.storage.removeItem(USER_KEY);
    if (hadToken && this.onTokenChange) {
      this.onTokenChange();
    }
  }
  /**
   * Check if there's a session in localStorage (for legacy detection)
   */
  hasStoredSession() {
    const token = this.storage.getItem(TOKEN_KEY);
    return !!token;
  }
};

// src/modules/auth/helpers.ts
var PKCE_VERIFIER_KEY = "insforge_pkce_verifier";
function base64UrlEncode(buffer) {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}
async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(hash));
}
function storePkceVerifier(verifier) {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  }
}
function retrievePkceVerifier() {
  if (typeof sessionStorage === "undefined") {
    return null;
  }
  const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
  if (verifier) {
    sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  }
  return verifier;
}
function isHostedAuthEnvironment() {
  if (typeof window === "undefined") {
    return false;
  }
  const { hostname, port, protocol } = window.location;
  if (hostname === "localhost" && port === "7130") {
    return true;
  }
  if (protocol === "https:" && hostname.endsWith(".insforge.app")) {
    return true;
  }
  return false;
}
function wrapError(error, fallbackMessage) {
  if (error instanceof InsForgeError) {
    return { data: null, error };
  }
  return {
    data: null,
    error: new InsForgeError(
      error instanceof Error ? error.message : fallbackMessage,
      500,
      "UNEXPECTED_ERROR"
    )
  };
}
function cleanUrlParams(...params) {
  if (typeof window === "undefined") {
    return;
  }
  const url = new URL(window.location.href);
  params.forEach((p) => url.searchParams.delete(p));
  window.history.replaceState({}, document.title, url.toString());
}

// src/modules/auth/auth.ts
var Auth = class {
  constructor(http, tokenManager) {
    this.http = http;
    this.tokenManager = tokenManager;
    this.authCallbackHandled = this.detectAuthCallback();
  }
  /**
   * Save session from API response
   * Handles token storage, CSRF token, and HTTP client auth header
   */
  saveSessionFromResponse(response) {
    if (!response.accessToken || !response.user) {
      return false;
    }
    const session = {
      accessToken: response.accessToken,
      user: response.user
    };
    if (response.csrfToken) {
      this.tokenManager.setMemoryMode();
      setCsrfToken(response.csrfToken);
    }
    this.tokenManager.saveSession(session);
    this.http.setAuthToken(response.accessToken);
    return true;
  }
  // ============================================================================
  // OAuth Callback Detection (runs on initialization)
  // ============================================================================
  /**
   * Detect and handle OAuth callback parameters in URL
   * Supports PKCE flow (insforge_code) and legacy flow (access_token in URL)
   */
  async detectAuthCallback() {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const error = params.get("error");
      if (error) {
        cleanUrlParams("error");
        console.debug("OAuth callback error:", error);
        return;
      }
      const code = params.get("insforge_code");
      if (code) {
        cleanUrlParams("insforge_code");
        const { error: exchangeError } = await this.exchangeOAuthCode(code);
        if (exchangeError) {
          console.debug("OAuth code exchange failed:", exchangeError.message);
        }
        return;
      }
      const accessToken = params.get("access_token");
      const userId = params.get("user_id");
      const email = params.get("email");
      if (accessToken && userId && email) {
        const csrfToken = params.get("csrf_token");
        const name = params.get("name");
        if (csrfToken) {
          this.tokenManager.setMemoryMode();
          setCsrfToken(csrfToken);
        }
        const session = {
          accessToken,
          user: {
            id: userId,
            email,
            profile: { name: name || "" },
            metadata: null,
            emailVerified: false,
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        };
        this.tokenManager.saveSession(session);
        this.http.setAuthToken(accessToken);
        cleanUrlParams("access_token", "user_id", "email", "name", "csrf_token");
      }
    } catch (error) {
      console.debug("OAuth callback detection skipped:", error);
    }
  }
  // ============================================================================
  // Sign Up / Sign In / Sign Out
  // ============================================================================
  async signUp(request) {
    try {
      const response = await this.http.post(
        "/api/auth/users",
        request,
        { credentials: "include" }
      );
      if (response.accessToken && response.user) {
        this.saveSessionFromResponse(response);
      }
      return { data: response, error: null };
    } catch (error) {
      return wrapError(error, "An unexpected error occurred during sign up");
    }
  }
  async signInWithPassword(request) {
    try {
      const response = await this.http.post(
        "/api/auth/sessions",
        request,
        { credentials: "include" }
      );
      this.saveSessionFromResponse(response);
      return { data: response, error: null };
    } catch (error) {
      return wrapError(error, "An unexpected error occurred during sign in");
    }
  }
  async signOut() {
    try {
      try {
        await this.http.post("/api/auth/logout", void 0, { credentials: "include" });
      } catch {
      }
      this.tokenManager.clearSession();
      this.http.setAuthToken(null);
      clearCsrfToken();
      return { error: null };
    } catch {
      return { error: new InsForgeError("Failed to sign out", 500, "SIGNOUT_ERROR") };
    }
  }
  // ============================================================================
  // OAuth Authentication
  // ============================================================================
  /**
   * Sign in with OAuth provider using PKCE flow
   */
  async signInWithOAuth(options) {
    try {
      const { provider, redirectTo, skipBrowserRedirect } = options;
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      storePkceVerifier(codeVerifier);
      const params = { code_challenge: codeChallenge };
      if (redirectTo) params.redirect_uri = redirectTo;
      const response = await this.http.get(
        `/api/auth/oauth/${provider}`,
        { params }
      );
      if (typeof window !== "undefined" && !skipBrowserRedirect) {
        window.location.href = response.authUrl;
        return { data: {}, error: null };
      }
      return {
        data: { url: response.authUrl, provider, codeVerifier },
        error: null
      };
    } catch (error) {
      if (error instanceof InsForgeError) {
        return { data: {}, error };
      }
      return {
        data: {},
        error: new InsForgeError(
          "An unexpected error occurred during OAuth initialization",
          500,
          "UNEXPECTED_ERROR"
        )
      };
    }
  }
  /**
   * Exchange OAuth authorization code for tokens (PKCE flow)
   * Called automatically on initialization when insforge_code is in URL
   */
  async exchangeOAuthCode(code, codeVerifier) {
    try {
      const verifier = codeVerifier ?? retrievePkceVerifier();
      if (!verifier) {
        return {
          data: null,
          error: new InsForgeError(
            "PKCE code verifier not found. Ensure signInWithOAuth was called in the same browser session.",
            400,
            "PKCE_VERIFIER_MISSING"
          )
        };
      }
      const request = { code, code_verifier: verifier };
      const response = await this.http.post("/api/auth/oauth/exchange", request, { credentials: "include" });
      this.saveSessionFromResponse(response);
      return {
        data: {
          accessToken: response.accessToken,
          user: response.user,
          redirectTo: response.redirectTo
        },
        error: null
      };
    } catch (error) {
      return wrapError(error, "An unexpected error occurred during OAuth code exchange");
    }
  }
  /**
   * Sign in with an ID token from a native SDK (Google One Tap, etc.)
   * Use this for native mobile apps or Google One Tap on web.
   *
   * @param credentials.provider - The identity provider (currently only 'google' is supported)
   * @param credentials.token - The ID token from the native SDK
   */
  async signInWithIdToken(credentials) {
    try {
      const { provider, token } = credentials;
      const response = await this.http.post("/api/auth/id-token?client_type=mobile", { provider, token }, { credentials: "include" });
      this.saveSessionFromResponse(response);
      return {
        data: {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          user: response.user
        },
        error: null
      };
    } catch (error) {
      return wrapError(error, "An unexpected error occurred during ID token sign in");
    }
  }
  // ============================================================================
  // Session Management
  // ============================================================================
  /**
   * Get current session, automatically waits for pending OAuth callback
   * @deprecated Use `getCurrentUser` instead
   */
  async getCurrentSession() {
    await this.authCallbackHandled;
    try {
      const session = this.tokenManager.getSession();
      if (session) {
        this.http.setAuthToken(session.accessToken);
        return { data: { session }, error: null };
      }
      if (typeof window !== "undefined") {
        try {
          const csrfToken = getCsrfToken();
          const response = await this.http.post("/api/auth/refresh", void 0, {
            headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {},
            credentials: "include"
          });
          if (response.accessToken) {
            this.tokenManager.setMemoryMode();
            this.tokenManager.setAccessToken(response.accessToken);
            this.http.setAuthToken(response.accessToken);
            if (response.user) this.tokenManager.setUser(response.user);
            if (response.csrfToken) setCsrfToken(response.csrfToken);
            return { data: { session: this.tokenManager.getSession() }, error: null };
          }
        } catch (error) {
          if (error instanceof InsForgeError) {
            if (error.statusCode === 404) {
              this.tokenManager.setStorageMode();
              const session2 = this.tokenManager.getSession();
              if (session2?.accessToken) {
                +this.http.setAuthToken(session2.accessToken);
              }
              return { data: { session: session2 }, error: null };
            }
            return { data: { session: null }, error };
          }
        }
      }
      return { data: { session: null }, error: null };
    } catch (error) {
      if (error instanceof InsForgeError) {
        return { data: { session: null }, error };
      }
      return {
        data: { session: null },
        error: new InsForgeError(
          "An unexpected error occurred while getting session",
          500,
          "UNEXPECTED_ERROR"
        )
      };
    }
  }
  /**
  * Get current user, automatically waits for pending OAuth callback
  */
  async getCurrentUser() {
    await this.authCallbackHandled;
    if (isHostedAuthEnvironment()) {
      return { data: { user: null }, error: null };
    }
    try {
      const session = this.tokenManager.getSession();
      if (session) {
        this.http.setAuthToken(session.accessToken);
        return { data: { user: session.user }, error: null };
      }
      if (typeof window !== "undefined") {
        try {
          const csrfToken = getCsrfToken();
          const response = await this.http.post("/api/auth/refresh", void 0, {
            headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {},
            credentials: "include"
          });
          if (response.accessToken) {
            this.tokenManager.setMemoryMode();
            this.tokenManager.setAccessToken(response.accessToken);
            this.http.setAuthToken(response.accessToken);
            if (response.user) this.tokenManager.setUser(response.user);
            if (response.csrfToken) setCsrfToken(response.csrfToken);
            return { data: { user: response.user ?? null }, error: null };
          }
        } catch (error) {
          if (error instanceof InsForgeError) {
            if (error.statusCode === 404) {
              this.tokenManager.setStorageMode();
              const session2 = this.tokenManager.getSession();
              if (session2?.accessToken) {
                +this.http.setAuthToken(session2.accessToken);
              }
              return { data: { user: session2?.user ?? null }, error: null };
            }
            return { data: { user: null }, error };
          }
        }
      }
      return { data: { user: null }, error: null };
    } catch (error) {
      if (error instanceof InsForgeError) {
        return { data: { user: null }, error };
      }
      return {
        data: { user: null },
        error: new InsForgeError(
          "An unexpected error occurred while getting user",
          500,
          "UNEXPECTED_ERROR"
        )
      };
    }
  }
  // ============================================================================
  // Profile Management
  // ============================================================================
  async getProfile(userId) {
    try {
      const response = await this.http.get(`/api/auth/profiles/${userId}`);
      return { data: response, error: null };
    } catch (error) {
      return wrapError(error, "An unexpected error occurred while fetching user profile");
    }
  }
  async setProfile(profile) {
    try {
      const response = await this.http.patch(
        "/api/auth/profiles/current",
        { profile }
      );
      const currentUser = this.tokenManager.getUser();
      if (currentUser && response.profile !== void 0) {
        this.tokenManager.setUser({ ...currentUser, profile: response.profile });
      }
      return { data: response, error: null };
    } catch (error) {
      return wrapError(error, "An unexpected error occurred while updating user profile");
    }
  }
  // ============================================================================
  // Email Verification
  // ============================================================================
  async resendVerificationEmail(request) {
    try {
      const response = await this.http.post(
        "/api/auth/email/send-verification",
        request
      );
      return { data: response, error: null };
    } catch (error) {
      return wrapError(error, "An unexpected error occurred while sending verification code");
    }
  }
  /** @deprecated Use `resendVerificationEmail` instead */
  async sendVerificationEmail(request) {
    return this.resendVerificationEmail(request);
  }
  async verifyEmail(request) {
    try {
      const response = await this.http.post(
        "/api/auth/email/verify",
        request,
        { credentials: "include" }
      );
      this.saveSessionFromResponse(response);
      return { data: response, error: null };
    } catch (error) {
      return wrapError(error, "An unexpected error occurred while verifying email");
    }
  }
  // ============================================================================
  // Password Reset
  // ============================================================================
  async sendResetPasswordEmail(request) {
    try {
      const response = await this.http.post(
        "/api/auth/email/send-reset-password",
        request
      );
      return { data: response, error: null };
    } catch (error) {
      return wrapError(error, "An unexpected error occurred while sending password reset code");
    }
  }
  async exchangeResetPasswordToken(request) {
    try {
      const response = await this.http.post(
        "/api/auth/email/exchange-reset-password-token",
        request
      );
      return { data: response, error: null };
    } catch (error) {
      return wrapError(error, "An unexpected error occurred while verifying reset code");
    }
  }
  async resetPassword(request) {
    try {
      const response = await this.http.post(
        "/api/auth/email/reset-password",
        request
      );
      return { data: response, error: null };
    } catch (error) {
      return wrapError(error, "An unexpected error occurred while resetting password");
    }
  }
  // ============================================================================
  // Configuration
  // ============================================================================
  async getPublicAuthConfig() {
    try {
      const response = await this.http.get("/api/auth/public-config");
      return { data: response, error: null };
    } catch (error) {
      return wrapError(error, "An unexpected error occurred while fetching auth configuration");
    }
  }
};

// src/modules/database-postgrest.ts
import { PostgrestClient } from "@supabase/postgrest-js";
function createInsForgePostgrestFetch(httpClient, tokenManager) {
  return async (input, init) => {
    const url = typeof input === "string" ? input : input.toString();
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.slice(1);
    const rpcMatch = pathname.match(/^rpc\/(.+)$/);
    const endpoint = rpcMatch ? `/api/database/rpc/${rpcMatch[1]}` : `/api/database/records/${pathname}`;
    const insforgeUrl = `${httpClient.baseUrl}${endpoint}${urlObj.search}`;
    const token = tokenManager.getAccessToken();
    const httpHeaders = httpClient.getHeaders();
    const authToken = token || httpHeaders["Authorization"]?.replace("Bearer ", "");
    const headers = new Headers(init?.headers);
    if (authToken && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${authToken}`);
    }
    const response = await fetch(insforgeUrl, {
      ...init,
      headers
    });
    return response;
  };
}
var Database = class {
  constructor(httpClient, tokenManager) {
    this.postgrest = new PostgrestClient("http://dummy", {
      fetch: createInsForgePostgrestFetch(httpClient, tokenManager),
      headers: {}
    });
  }
  /**
   * Create a query builder for a table
   * 
   * @example
   * // Basic query
   * const { data, error } = await client.database
   *   .from('posts')
   *   .select('*')
   *   .eq('user_id', userId);
   * 
   * // With count (Supabase style!)
   * const { data, error, count } = await client.database
   *   .from('posts')
   *   .select('*', { count: 'exact' })
   *   .range(0, 9);
   * 
   * // Just get count, no data
   * const { count } = await client.database
   *   .from('posts')
   *   .select('*', { count: 'exact', head: true });
   * 
   * // Complex queries with OR
   * const { data } = await client.database
   *   .from('posts')
   *   .select('*, users!inner(*)')
   *   .or('status.eq.active,status.eq.pending');
   * 
   * // All features work:
   * - Nested selects
   * - Foreign key expansion  
   * - OR/AND/NOT conditions
   * - Count with head
   * - Range pagination
   * - Upserts
   */
  from(table) {
    return this.postgrest.from(table);
  }
  /**
   * Call a PostgreSQL function (RPC)
   *
   * @example
   * // Call a function with parameters
   * const { data, error } = await client.database
   *   .rpc('get_user_stats', { user_id: 123 });
   *
   * // Call a function with no parameters
   * const { data, error } = await client.database
   *   .rpc('get_all_active_users');
   *
   * // With options (head, count, get)
   * const { data, count } = await client.database
   *   .rpc('search_posts', { query: 'hello' }, { count: 'exact' });
   */
  rpc(fn, args, options) {
    return this.postgrest.rpc(fn, args, options);
  }
};

// src/modules/storage.ts
var StorageBucket = class {
  constructor(bucketName, http) {
    this.bucketName = bucketName;
    this.http = http;
  }
  /**
   * Upload a file with a specific key
   * Uses the upload strategy from backend (direct or presigned)
   * @param path - The object key/path
   * @param file - File or Blob to upload
   */
  async upload(path, file) {
    try {
      const strategyResponse = await this.http.post(
        `/api/storage/buckets/${this.bucketName}/upload-strategy`,
        {
          filename: path,
          contentType: file.type || "application/octet-stream",
          size: file.size
        }
      );
      if (strategyResponse.method === "presigned") {
        return await this.uploadWithPresignedUrl(strategyResponse, file);
      }
      if (strategyResponse.method === "direct") {
        const formData = new FormData();
        formData.append("file", file);
        const response = await this.http.request(
          "PUT",
          `/api/storage/buckets/${this.bucketName}/objects/${encodeURIComponent(path)}`,
          {
            body: formData,
            headers: {
              // Don't set Content-Type, let browser set multipart boundary
            }
          }
        );
        return { data: response, error: null };
      }
      throw new InsForgeError(
        `Unsupported upload method: ${strategyResponse.method}`,
        500,
        "STORAGE_ERROR"
      );
    } catch (error) {
      return {
        data: null,
        error: error instanceof InsForgeError ? error : new InsForgeError(
          "Upload failed",
          500,
          "STORAGE_ERROR"
        )
      };
    }
  }
  /**
   * Upload a file with auto-generated key
   * Uses the upload strategy from backend (direct or presigned)
   * @param file - File or Blob to upload
   */
  async uploadAuto(file) {
    try {
      const filename = file instanceof File ? file.name : "file";
      const strategyResponse = await this.http.post(
        `/api/storage/buckets/${this.bucketName}/upload-strategy`,
        {
          filename,
          contentType: file.type || "application/octet-stream",
          size: file.size
        }
      );
      if (strategyResponse.method === "presigned") {
        return await this.uploadWithPresignedUrl(strategyResponse, file);
      }
      if (strategyResponse.method === "direct") {
        const formData = new FormData();
        formData.append("file", file);
        const response = await this.http.request(
          "POST",
          `/api/storage/buckets/${this.bucketName}/objects`,
          {
            body: formData,
            headers: {
              // Don't set Content-Type, let browser set multipart boundary
            }
          }
        );
        return { data: response, error: null };
      }
      throw new InsForgeError(
        `Unsupported upload method: ${strategyResponse.method}`,
        500,
        "STORAGE_ERROR"
      );
    } catch (error) {
      return {
        data: null,
        error: error instanceof InsForgeError ? error : new InsForgeError(
          "Upload failed",
          500,
          "STORAGE_ERROR"
        )
      };
    }
  }
  /**
   * Internal method to handle presigned URL uploads
   */
  async uploadWithPresignedUrl(strategy, file) {
    try {
      const formData = new FormData();
      if (strategy.fields) {
        Object.entries(strategy.fields).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }
      formData.append("file", file);
      const uploadResponse = await fetch(strategy.uploadUrl, {
        method: "POST",
        body: formData
      });
      if (!uploadResponse.ok) {
        throw new InsForgeError(
          `Upload to storage failed: ${uploadResponse.statusText}`,
          uploadResponse.status,
          "STORAGE_ERROR"
        );
      }
      if (strategy.confirmRequired && strategy.confirmUrl) {
        const confirmResponse = await this.http.post(
          strategy.confirmUrl,
          {
            size: file.size,
            contentType: file.type || "application/octet-stream"
          }
        );
        return { data: confirmResponse, error: null };
      }
      return {
        data: {
          key: strategy.key,
          bucket: this.bucketName,
          size: file.size,
          mimeType: file.type || "application/octet-stream",
          uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
          url: this.getPublicUrl(strategy.key)
        },
        error: null
      };
    } catch (error) {
      throw error instanceof InsForgeError ? error : new InsForgeError(
        "Presigned upload failed",
        500,
        "STORAGE_ERROR"
      );
    }
  }
  /**
   * Download a file
   * Uses the download strategy from backend (direct or presigned)
   * @param path - The object key/path
   * Returns the file as a Blob
   */
  async download(path) {
    try {
      const strategyResponse = await this.http.post(
        `/api/storage/buckets/${this.bucketName}/objects/${encodeURIComponent(path)}/download-strategy`,
        { expiresIn: 3600 }
      );
      const downloadUrl = strategyResponse.url;
      const headers = {};
      if (strategyResponse.method === "direct") {
        Object.assign(headers, this.http.getHeaders());
      }
      const response = await fetch(downloadUrl, {
        method: "GET",
        headers
      });
      if (!response.ok) {
        try {
          const error = await response.json();
          throw InsForgeError.fromApiError(error);
        } catch {
          throw new InsForgeError(
            `Download failed: ${response.statusText}`,
            response.status,
            "STORAGE_ERROR"
          );
        }
      }
      const blob = await response.blob();
      return { data: blob, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof InsForgeError ? error : new InsForgeError(
          "Download failed",
          500,
          "STORAGE_ERROR"
        )
      };
    }
  }
  /**
   * Get public URL for a file
   * @param path - The object key/path
   */
  getPublicUrl(path) {
    return `${this.http.baseUrl}/api/storage/buckets/${this.bucketName}/objects/${encodeURIComponent(path)}`;
  }
  /**
   * List objects in the bucket
   * @param prefix - Filter by key prefix
   * @param search - Search in file names
   * @param limit - Maximum number of results (default: 100, max: 1000)
   * @param offset - Number of results to skip
   */
  async list(options) {
    try {
      const params = {};
      if (options?.prefix) params.prefix = options.prefix;
      if (options?.search) params.search = options.search;
      if (options?.limit) params.limit = options.limit.toString();
      if (options?.offset) params.offset = options.offset.toString();
      const response = await this.http.get(
        `/api/storage/buckets/${this.bucketName}/objects`,
        { params }
      );
      return { data: response, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof InsForgeError ? error : new InsForgeError(
          "List failed",
          500,
          "STORAGE_ERROR"
        )
      };
    }
  }
  /**
   * Delete a file
   * @param path - The object key/path
   */
  async remove(path) {
    try {
      const response = await this.http.delete(
        `/api/storage/buckets/${this.bucketName}/objects/${encodeURIComponent(path)}`
      );
      return { data: response, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof InsForgeError ? error : new InsForgeError(
          "Delete failed",
          500,
          "STORAGE_ERROR"
        )
      };
    }
  }
};
var Storage = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Get a bucket instance for operations
   * @param bucketName - Name of the bucket
   */
  from(bucketName) {
    return new StorageBucket(bucketName, this.http);
  }
};

// src/modules/ai.ts
var AI = class {
  constructor(http) {
    this.http = http;
    this.chat = new Chat(http);
    this.images = new Images(http);
    this.embeddings = new Embeddings(http);
  }
};
var Chat = class {
  constructor(http) {
    this.completions = new ChatCompletions(http);
  }
};
var ChatCompletions = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Create a chat completion - OpenAI-like response format
   *
   * @example
   * ```typescript
   * // Non-streaming
   * const completion = await client.ai.chat.completions.create({
   *   model: 'gpt-4',
   *   messages: [{ role: 'user', content: 'Hello!' }]
   * });
   * console.log(completion.choices[0].message.content);
   *
   * // With images (OpenAI-compatible format)
   * const response = await client.ai.chat.completions.create({
   *   model: 'gpt-4-vision',
   *   messages: [{
   *     role: 'user',
   *     content: [
   *       { type: 'text', text: 'What is in this image?' },
   *       { type: 'image_url', image_url: { url: 'https://example.com/image.jpg' } }
   *     ]
   *   }]
   * });
   *
   * // With PDF files
   * const pdfResponse = await client.ai.chat.completions.create({
   *   model: 'anthropic/claude-3.5-sonnet',
   *   messages: [{
   *     role: 'user',
   *     content: [
   *       { type: 'text', text: 'Summarize this document' },
   *       { type: 'file', file: { filename: 'doc.pdf', file_data: 'https://example.com/doc.pdf' } }
   *     ]
   *   }],
   *   fileParser: { enabled: true, pdf: { engine: 'mistral-ocr' } }
   * });
   *
   * // With web search
   * const searchResponse = await client.ai.chat.completions.create({
   *   model: 'openai/gpt-4',
   *   messages: [{ role: 'user', content: 'What are the latest news about AI?' }],
   *   webSearch: { enabled: true, maxResults: 5 }
   * });
   * // Access citations from response.choices[0].message.annotations
   *
   * // With thinking/reasoning mode (Anthropic models)
   * const thinkingResponse = await client.ai.chat.completions.create({
   *   model: 'anthropic/claude-3.5-sonnet',
   *   messages: [{ role: 'user', content: 'Solve this complex math problem...' }],
   *   thinking: true
   * });
   *
   * // Streaming - returns async iterable
   * const stream = await client.ai.chat.completions.create({
   *   model: 'gpt-4',
   *   messages: [{ role: 'user', content: 'Tell me a story' }],
   *   stream: true
   * });
   *
   * for await (const chunk of stream) {
   *   if (chunk.choices[0]?.delta?.content) {
   *     process.stdout.write(chunk.choices[0].delta.content);
   *   }
   * }
   * ```
   */
  async create(params) {
    const backendParams = {
      model: params.model,
      messages: params.messages,
      temperature: params.temperature,
      maxTokens: params.maxTokens,
      topP: params.topP,
      stream: params.stream,
      // New plugin options
      webSearch: params.webSearch,
      fileParser: params.fileParser,
      thinking: params.thinking
    };
    if (params.stream) {
      const headers = this.http.getHeaders();
      headers["Content-Type"] = "application/json";
      const response2 = await this.http.fetch(
        `${this.http.baseUrl}/api/ai/chat/completion`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(backendParams)
        }
      );
      if (!response2.ok) {
        const error = await response2.json();
        throw new Error(error.error || "Stream request failed");
      }
      return this.parseSSEStream(response2, params.model);
    }
    const response = await this.http.post(
      "/api/ai/chat/completion",
      backendParams
    );
    const content = response.text || "";
    return {
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1e3),
      model: response.metadata?.model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content,
            // Include annotations if present (from web search or file parsing)
            ...response.annotations && { annotations: response.annotations }
          },
          finish_reason: "stop"
        }
      ],
      usage: response.metadata?.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    };
  }
  /**
   * Parse SSE stream into async iterable of OpenAI-like chunks
   */
  async *parseSSEStream(response, model) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr) {
              try {
                const data = JSON.parse(dataStr);
                if (data.chunk || data.content) {
                  yield {
                    id: `chatcmpl-${Date.now()}`,
                    object: "chat.completion.chunk",
                    created: Math.floor(Date.now() / 1e3),
                    model,
                    choices: [
                      {
                        index: 0,
                        delta: {
                          content: data.chunk || data.content
                        },
                        finish_reason: data.done ? "stop" : null
                      }
                    ]
                  };
                }
                if (data.done) {
                  reader.releaseLock();
                  return;
                }
              } catch (e) {
                console.warn("Failed to parse SSE data:", dataStr);
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
};
var Embeddings = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Create embeddings for text input - OpenAI-like response format
   *
   * @example
   * ```typescript
   * // Single text input
   * const response = await client.ai.embeddings.create({
   *   model: 'openai/text-embedding-3-small',
   *   input: 'Hello world'
   * });
   * console.log(response.data[0].embedding); // number[]
   *
   * // Multiple text inputs
   * const response = await client.ai.embeddings.create({
   *   model: 'openai/text-embedding-3-small',
   *   input: ['Hello world', 'Goodbye world']
   * });
   * response.data.forEach((item, i) => {
   *   console.log(`Embedding ${i}:`, item.embedding.slice(0, 5)); // First 5 dimensions
   * });
   *
   * // With custom dimensions (if supported by model)
   * const response = await client.ai.embeddings.create({
   *   model: 'openai/text-embedding-3-small',
   *   input: 'Hello world',
   *   dimensions: 256
   * });
   *
   * // With base64 encoding format
   * const response = await client.ai.embeddings.create({
   *   model: 'openai/text-embedding-3-small',
   *   input: 'Hello world',
   *   encoding_format: 'base64'
   * });
   * ```
   */
  async create(params) {
    const response = await this.http.post(
      "/api/ai/embeddings",
      params
    );
    return {
      object: response.object,
      data: response.data,
      model: response.metadata?.model,
      usage: response.metadata?.usage ? {
        prompt_tokens: response.metadata.usage.promptTokens || 0,
        total_tokens: response.metadata.usage.totalTokens || 0
      } : {
        prompt_tokens: 0,
        total_tokens: 0
      }
    };
  }
};
var Images = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Generate images - OpenAI-like response format
   *
   * @example
   * ```typescript
   * // Text-to-image
   * const response = await client.ai.images.generate({
   *   model: 'dall-e-3',
   *   prompt: 'A sunset over mountains',
   * });
   * console.log(response.images[0].url);
   *
   * // Image-to-image (with input images)
   * const response = await client.ai.images.generate({
   *   model: 'stable-diffusion-xl',
   *   prompt: 'Transform this into a watercolor painting',
   *   images: [
   *     { url: 'https://example.com/input.jpg' },
   *     // or base64-encoded Data URI:
   *     { url: 'data:image/jpeg;base64,/9j/4AAQ...' }
   *   ]
   * });
   * ```
   */
  async generate(params) {
    const response = await this.http.post(
      "/api/ai/image/generation",
      params
    );
    let data = [];
    if (response.images && response.images.length > 0) {
      data = response.images.map((img) => ({
        b64_json: img.imageUrl.replace(/^data:image\/\w+;base64,/, ""),
        content: response.text
      }));
    } else if (response.text) {
      data = [{ content: response.text }];
    }
    return {
      created: Math.floor(Date.now() / 1e3),
      data,
      ...response.metadata?.usage && {
        usage: {
          total_tokens: response.metadata.usage.totalTokens || 0,
          input_tokens: response.metadata.usage.promptTokens || 0,
          output_tokens: response.metadata.usage.completionTokens || 0
        }
      }
    };
  }
};

// src/modules/functions.ts
var Functions = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Invokes an Edge Function
   * @param slug The function slug to invoke
   * @param options Request options
   */
  async invoke(slug, options = {}) {
    try {
      const { method = "POST", body, headers = {} } = options;
      const path = `/functions/${slug}`;
      const data = await this.http.request(
        method,
        path,
        { body, headers }
      );
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error
        // Pass through the full error object with all properties
      };
    }
  }
};

// src/modules/realtime.ts
import { io } from "socket.io-client";
var CONNECT_TIMEOUT = 1e4;
var Realtime = class {
  constructor(baseUrl, tokenManager, anonKey) {
    this.socket = null;
    this.connectPromise = null;
    this.subscribedChannels = /* @__PURE__ */ new Set();
    this.eventListeners = /* @__PURE__ */ new Map();
    this.baseUrl = baseUrl;
    this.tokenManager = tokenManager;
    this.anonKey = anonKey;
    this.tokenManager.onTokenChange = () => this.onTokenChange();
  }
  notifyListeners(event, payload) {
    const listeners = this.eventListeners.get(event);
    if (!listeners) return;
    for (const cb of listeners) {
      try {
        cb(payload);
      } catch (err) {
        console.error(`Error in ${event} callback:`, err);
      }
    }
  }
  /**
   * Connect to the realtime server
   * @returns Promise that resolves when connected
   */
  connect() {
    if (this.socket?.connected) {
      return Promise.resolve();
    }
    if (this.connectPromise) {
      return this.connectPromise;
    }
    this.connectPromise = new Promise((resolve, reject) => {
      const session = this.tokenManager.getSession();
      const token = session?.accessToken ?? this.anonKey;
      this.socket = io(this.baseUrl, {
        transports: ["websocket"],
        auth: token ? { token } : void 0
      });
      let initialConnection = true;
      let timeoutId = null;
      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      };
      timeoutId = setTimeout(() => {
        if (initialConnection) {
          initialConnection = false;
          this.connectPromise = null;
          this.socket?.disconnect();
          this.socket = null;
          reject(new Error(`Connection timeout after ${CONNECT_TIMEOUT}ms`));
        }
      }, CONNECT_TIMEOUT);
      this.socket.on("connect", () => {
        cleanup();
        for (const channel of this.subscribedChannels) {
          this.socket.emit("realtime:subscribe", { channel });
        }
        this.notifyListeners("connect");
        if (initialConnection) {
          initialConnection = false;
          this.connectPromise = null;
          resolve();
        }
      });
      this.socket.on("connect_error", (error) => {
        cleanup();
        this.notifyListeners("connect_error", error);
        if (initialConnection) {
          initialConnection = false;
          this.connectPromise = null;
          reject(error);
        }
      });
      this.socket.on("disconnect", (reason) => {
        this.notifyListeners("disconnect", reason);
      });
      this.socket.on("realtime:error", (error) => {
        this.notifyListeners("error", error);
      });
      this.socket.onAny((event, message) => {
        if (event === "realtime:error") return;
        this.notifyListeners(event, message);
      });
    });
    return this.connectPromise;
  }
  /**
   * Disconnect from the realtime server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.subscribedChannels.clear();
  }
  /**
   * Handle token changes (e.g., after auth refresh)
   * Updates socket auth so reconnects use the new token
   * If connected, triggers reconnect to apply new token immediately
   */
  onTokenChange() {
    const token = this.tokenManager.getAccessToken() ?? this.anonKey;
    if (this.socket) {
      this.socket.auth = token ? { token } : {};
    }
    if (this.socket && (this.socket.connected || this.connectPromise)) {
      this.socket.disconnect();
      this.socket.connect();
    }
  }
  /**
   * Check if connected to the realtime server
   */
  get isConnected() {
    return this.socket?.connected ?? false;
  }
  /**
   * Get the current connection state
   */
  get connectionState() {
    if (!this.socket) return "disconnected";
    if (this.socket.connected) return "connected";
    return "connecting";
  }
  /**
   * Get the socket ID (if connected)
   */
  get socketId() {
    return this.socket?.id;
  }
  /**
   * Subscribe to a channel
   *
   * Automatically connects if not already connected.
   *
   * @param channel - Channel name (e.g., 'orders:123', 'broadcast')
   * @returns Promise with the subscription response
   */
  async subscribe(channel) {
    if (this.subscribedChannels.has(channel)) {
      return { ok: true, channel };
    }
    if (!this.socket?.connected) {
      try {
        await this.connect();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Connection failed";
        return { ok: false, channel, error: { code: "CONNECTION_FAILED", message } };
      }
    }
    return new Promise((resolve) => {
      this.socket.emit("realtime:subscribe", { channel }, (response) => {
        if (response.ok) {
          this.subscribedChannels.add(channel);
        }
        resolve(response);
      });
    });
  }
  /**
   * Unsubscribe from a channel (fire-and-forget)
   *
   * @param channel - Channel name to unsubscribe from
   */
  unsubscribe(channel) {
    this.subscribedChannels.delete(channel);
    if (this.socket?.connected) {
      this.socket.emit("realtime:unsubscribe", { channel });
    }
  }
  /**
   * Publish a message to a channel
   *
   * @param channel - Channel name
   * @param event - Event name
   * @param payload - Message payload
   */
  async publish(channel, event, payload) {
    if (!this.socket?.connected) {
      throw new Error("Not connected to realtime server. Call connect() first.");
    }
    this.socket.emit("realtime:publish", { channel, event, payload });
  }
  /**
   * Listen for events
   *
   * Reserved event names:
   * - 'connect' - Fired when connected to the server
   * - 'connect_error' - Fired when connection fails (payload: Error)
   * - 'disconnect' - Fired when disconnected (payload: reason string)
   * - 'error' - Fired when a realtime error occurs (payload: RealtimeErrorPayload)
   *
   * All other events receive a `SocketMessage` payload with metadata.
   *
   * @param event - Event name to listen for
   * @param callback - Callback function when event is received
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, /* @__PURE__ */ new Set());
    }
    this.eventListeners.get(event).add(callback);
  }
  /**
   * Remove a listener for a specific event
   *
   * @param event - Event name
   * @param callback - The callback function to remove
   */
  off(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.eventListeners.delete(event);
      }
    }
  }
  /**
   * Listen for an event only once, then automatically remove the listener
   *
   * @param event - Event name to listen for
   * @param callback - Callback function when event is received
   */
  once(event, callback) {
    const wrapper = (payload) => {
      this.off(event, wrapper);
      callback(payload);
    };
    this.on(event, wrapper);
  }
  /**
   * Get all currently subscribed channels
   *
   * @returns Array of channel names
   */
  getSubscribedChannels() {
    return Array.from(this.subscribedChannels);
  }
};

// src/modules/email.ts
var Emails = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Send a custom HTML email
   * @param options Email options including recipients, subject, and HTML content
   */
  async send(options) {
    try {
      const data = await this.http.post(
        "/api/email/send-raw",
        options
      );
      return { data, error: null };
    } catch (error) {
      const normalizedError = error instanceof Error ? error : new Error(String(error));
      return { data: null, error: normalizedError };
    }
  }
};

// src/client.ts
var InsForgeClient = class {
  constructor(config = {}) {
    this.http = new HttpClient(config);
    this.tokenManager = new TokenManager(config.storage);
    if (config.edgeFunctionToken) {
      this.http.setAuthToken(config.edgeFunctionToken);
      this.tokenManager.saveSession({
        accessToken: config.edgeFunctionToken,
        user: {}
      });
    }
    const existingSession = this.tokenManager.getSession();
    if (existingSession?.accessToken) {
      this.http.setAuthToken(existingSession.accessToken);
    }
    this.auth = new Auth(this.http, this.tokenManager);
    this.database = new Database(this.http, this.tokenManager);
    this.storage = new Storage(this.http);
    this.ai = new AI(this.http);
    this.functions = new Functions(this.http);
    this.realtime = new Realtime(this.http.baseUrl, this.tokenManager, config.anonKey);
    this.emails = new Emails(this.http);
  }
  /**
   * Get the underlying HTTP client for custom requests
   * 
   * @example
   * ```typescript
   * const httpClient = client.getHttpClient();
   * const customData = await httpClient.get('/api/custom-endpoint');
   * ```
   */
  getHttpClient() {
    return this.http;
  }
  /**
   * Future modules will be added here:
   * - database: Database operations
   * - storage: File storage operations
   * - functions: Serverless functions
   * - tables: Table management
   * - metadata: Backend metadata
   */
};

// src/index.ts
function createClient(config) {
  return new InsForgeClient(config);
}
var index_default = InsForgeClient;
export {
  AI,
  Auth,
  Database,
  Emails,
  Functions,
  HttpClient,
  InsForgeClient,
  InsForgeError,
  Realtime,
  Storage,
  StorageBucket,
  TokenManager,
  createClient,
  index_default as default
};
//# sourceMappingURL=index.mjs.map