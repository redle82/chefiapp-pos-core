/**
 * Auth adapter Keycloak — substitui Supabase Auth em modo Docker.
 *
 * Fluxo completo OIDC Authorization Code:
 * 1. signInWithKeycloak() → redirect para Keycloak login
 * 2. Keycloak redirect de volta com ?code=
 * 3. getKeycloakSession() detecta o code, troca por token, guarda em sessionStorage
 * 4. Sessão fica disponível no hook useCoreAuth
 */

import { Logger } from "../logger";
import { removeTabIsolated } from "../storage/TabIsolatedStorage";

/** Flag para beforeunload: quando em logout, não mostrar "Leave site?" */
export const LOGOUT_IN_PROGRESS_KEY = "chefiapp_logout_in_progress";

/** Flag para AuthProvider/useCoreAuth: não re-seed AUTO-PILOT após redirect pós-logout. Persistida em session + local para sobreviver ao redirect. */
export const JUST_LOGGED_OUT_KEY = "chefiapp_just_logged_out";

export function isJustLoggedOut(): boolean {
  if (typeof window === "undefined" || typeof sessionStorage === "undefined") return false;
  return (
    sessionStorage.getItem(JUST_LOGGED_OUT_KEY) === "1" ||
    (typeof localStorage !== "undefined" && localStorage.getItem(JUST_LOGGED_OUT_KEY) === "1")
  );
}

/** Session-only flag: logout was done in this tab; do not AUTO-PILOT re-seed until next login. */
export const LOGOUT_DONE_KEY = "chefiapp_logout_done";

export function clearJustLoggedOut(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(JUST_LOGGED_OUT_KEY);
  try {
    localStorage.removeItem(JUST_LOGGED_OUT_KEY);
    sessionStorage.setItem(LOGOUT_DONE_KEY, "1");
  } catch {
    // ignore
  }
}

export function clearLogoutDone(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(LOGOUT_DONE_KEY);
}

export function isLogoutDone(): boolean {
  return typeof window !== "undefined" && sessionStorage.getItem(LOGOUT_DONE_KEY) === "1";
}

let logoutInProgressMemory = false;

export function isLogoutInProgress(): boolean {
  return (
    logoutInProgressMemory ||
    (typeof window !== "undefined" &&
      sessionStorage.getItem(LOGOUT_IN_PROGRESS_KEY) === "1")
  );
}

const DEFAULT_KEYCLOAK_BASE = "http://localhost:8080";
const DEFAULT_REALM = "chefiapp";
const DEFAULT_CLIENT_ID = "merchant-portal";
const SESSION_KEY = "chefiapp_keycloak_session";
const TOKEN_EXPIRY_KEY = "chefiapp_keycloak_expiry";

/** Lê env em Vite e Node (sem import.meta neste ficheiro para compilar no Jest). */
function getKeycloakEnv(key: string): string {
  const g = typeof globalThis !== "undefined" ? (globalThis as Record<string, unknown>) : null;
  const v = g?.[key];
  if (typeof v === "string" && v) return v;
  if (typeof process !== "undefined" && process.env?.[key]) return process.env[key] ?? "";
  return "";
}

function getKeycloakBase(): string {
  const url = getKeycloakEnv("VITE_KEYCLOAK_URL");
  if (url) return String(url).replace(/\/$/, "");
  return DEFAULT_KEYCLOAK_BASE;
}

function getRealm(): string {
  return getKeycloakEnv("VITE_KEYCLOAK_REALM") || DEFAULT_REALM;
}

function getClientId(): string {
  return getKeycloakEnv("VITE_KEYCLOAK_CLIENT_ID") || DEFAULT_CLIENT_ID;
}

function getRedirectUri(): string {
  if (typeof window !== "undefined") {
    // Use origin + pathname without query params
    return window.location.origin + window.location.pathname;
  }
  return "http://localhost:5175/";
}

/**
 * Estado de sessão compatível com o que o hook de auth espera (Session/User-like).
 */
export interface KeycloakAuthState {
  session: { access_token: string; refresh_token?: string } | null;
  user: { id: string; email?: string; name?: string; role?: string } | null;
}

/**
 * Decode JWT payload (sem verificar assinatura — Keycloak já validou).
 */
function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return {};
  }
}

/**
 * Exchange authorization code for tokens via Keycloak token endpoint.
 */
async function exchangeCodeForToken(code: string): Promise<KeycloakAuthState> {
  const base = getKeycloakBase();
  const realm = getRealm();
  const clientId = getClientId();
  const redirectUri = getRedirectUri();

  const tokenUrl = `${base}/realms/${realm}/protocol/openid-connect/token`;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    code,
    redirect_uri: redirectUri,
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    Logger.error("[Keycloak] Token exchange failed:", { status: res.status });
    return { session: null, user: null };
  }

  const data = await res.json();
  const accessToken = data.access_token as string;
  const refreshToken = data.refresh_token as string | undefined;
  const expiresIn = (data.expires_in as number) || 300;

  // Decode token to extract user info
  const payload = decodeJwtPayload(accessToken);
  const userId = (payload.sub as string) || "";
  const email = (payload.email as string) || undefined;
  const name =
    (payload.name as string) ||
    (payload.preferred_username as string) ||
    undefined;

  const state: KeycloakAuthState = {
    session: { access_token: accessToken, refresh_token: refreshToken },
    user: { id: userId, email, name },
  };

  // Persist session
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  sessionStorage.setItem(
    TOKEN_EXPIRY_KEY,
    String(Date.now() + expiresIn * 1000),
  );

  return state;
}

/**
 * Refresh access token using refresh_token grant.
 */
async function refreshAccessToken(
  refreshToken: string,
): Promise<KeycloakAuthState> {
  const base = getKeycloakBase();
  const realm = getRealm();
  const clientId = getClientId();

  const tokenUrl = `${base}/realms/${realm}/protocol/openid-connect/token`;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    refresh_token: refreshToken,
  });

  try {
    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) {
      // Refresh token expired — user needs to re-login
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
      return { session: null, user: null };
    }

    const data = await res.json();
    const accessToken = data.access_token as string;
    const newRefreshToken = (data.refresh_token as string) || refreshToken;
    const expiresIn = (data.expires_in as number) || 300;

    const payload = decodeJwtPayload(accessToken);

    const state: KeycloakAuthState = {
      session: { access_token: accessToken, refresh_token: newRefreshToken },
      user: {
        id: (payload.sub as string) || "",
        email: (payload.email as string) || undefined,
        name:
          (payload.name as string) ||
          (payload.preferred_username as string) ||
          undefined,
      },
    };

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
    sessionStorage.setItem(
      TOKEN_EXPIRY_KEY,
      String(Date.now() + expiresIn * 1000),
    );

    return state;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
    return { session: null, user: null };
  }
}

/**
 * Devolve sessão Keycloak. Fluxo completo:
 * 1. Se há ?code= na URL, troca por token (OIDC callback)
 * 2. Se há sessão guardada em sessionStorage, devolve-a (refresh se expirada)
 * 3. Senão, devolve null (utilizador precisa fazer login)
 */
export async function getKeycloakSession(): Promise<KeycloakAuthState> {
  if (typeof window === "undefined" || typeof sessionStorage === "undefined") {
    return { session: null, user: null };
  }

  sessionStorage.removeItem(LOGOUT_IN_PROGRESS_KEY);
  // Do NOT clear JUST_LOGGED_OUT_KEY here — AuthProvider/useCoreAuth must read it first
  // to skip AUTO-PILOT/mock; other callers (e.g. getCoreSessionAsync) must not clear it.

  // Step 1: Check for OIDC callback (?code=)
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  if (code) {
    // Clean URL (remove code & state from address bar)
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);

    return exchangeCodeForToken(code);
  }

  // Step 2: Check stored session
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as KeycloakAuthState;

      // Check if token is expired or about to expire (30s buffer)
      const expiry = Number(sessionStorage.getItem(TOKEN_EXPIRY_KEY) || "0");
      const isExpired = Date.now() > expiry - 30_000;

      if (isExpired && parsed.session?.refresh_token) {
        return refreshAccessToken(parsed.session.refresh_token);
      }

      return parsed;
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
    }
  }

  // Step 3: No session
  return { session: null, user: null };
}

/**
 * Redirecciona para login Keycloak (OIDC authorization code).
 */
export function signInWithKeycloak(): void {
  const base = getKeycloakBase();
  const realm = getRealm();
  const clientId = getClientId();
  const redirectUri = encodeURIComponent(getRedirectUri());
  const url = `${base}/realms/${realm}/protocol/openid-connect/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20profile%20email`;
  window.location.href = url;
}

/**
 * Redirecciona para logout Keycloak (OIDC).
 * URL deve ser path + ? + query (searchParams); concatenação manual sem ? causa "Route not found" no IdP.
 */
export function signOutKeycloak(): void {
  if (typeof window === "undefined") return;

  logoutInProgressMemory = true;
  sessionStorage.setItem(LOGOUT_IN_PROGRESS_KEY, "1");
  sessionStorage.setItem(JUST_LOGGED_OUT_KEY, "1");
  try {
    localStorage.setItem(JUST_LOGGED_OUT_KEY, "1");
  } catch {
    // ignore
  }

  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(TOKEN_EXPIRY_KEY);

  removeTabIsolated("chefiapp_restaurant_id");
  removeTabIsolated("chefiapp_trial_mode");
  try {
    sessionStorage.removeItem("chefiapp_pilot_mode");
    localStorage.removeItem("chefiapp_pilot_mode");
    sessionStorage.removeItem("chefiapp_trial_mode");
    localStorage.removeItem("chefiapp_trial_mode");
  } catch {
    // ignore
  }

  const rawBase = getKeycloakBase().replace(/\/$/, "");
  const origin = /^https?:\/\//i.test(rawBase) ? rawBase : `http://${rawBase}`;
  const realm = getRealm();
  const clientId = getClientId();
  // Redirect to auth area after logout so UX is clear (not /admin/modules).
  // Keycloak client must allow this URI in Post Logout Redirect URIs.
  const postLogoutPath = "/auth";
  const postLogoutRedirect =
    typeof window !== "undefined"
      ? `${window.location.origin}${postLogoutPath}`
      : `http://localhost:5175${postLogoutPath}`;

  const logoutUrl = new URL(
    `/realms/${realm}/protocol/openid-connect/logout`,
    `${origin}/`,
  );
  logoutUrl.searchParams.set("post_logout_redirect_uri", postLogoutRedirect);
  logoutUrl.searchParams.set("client_id", clientId);

  window.location.assign(logoutUrl.toString());
}

export function getKeycloakConfig(): {
  baseUrl: string;
  realm: string;
  clientId: string;
} {
  return {
    baseUrl: getKeycloakBase(),
    realm: getRealm(),
    clientId: getClientId(),
  };
}
