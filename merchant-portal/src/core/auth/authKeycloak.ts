/**
 * Auth adapter Keycloak — substitui Supabase Auth em modo Docker.
 *
 * Interface mínima: getSession, signIn, signOut.
 * Actualmente: redirects para login/logout; getSession devolve null até existir troca código→token.
 */

const DEFAULT_KEYCLOAK_BASE = "http://localhost:8080";
const DEFAULT_REALM = "chefiapp";
const DEFAULT_CLIENT_ID = "merchant-portal";

function getKeycloakBase(): string {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_KEYCLOAK_URL) {
    return String(import.meta.env.VITE_KEYCLOAK_URL).replace(/\/$/, "");
  }
  return DEFAULT_KEYCLOAK_BASE;
}

function getRedirectUri(): string {
  if (typeof window !== "undefined") {
    return window.location.origin + window.location.pathname;
  }
  return "http://localhost:5175/";
}

/**
 * Estado de sessão compatível com o que o hook de auth espera (Session/User-like).
 */
export interface KeycloakAuthState {
  session: { access_token: string } | null;
  user: { id: string; email?: string } | null;
}

/**
 * Devolve sessão Keycloak. Por agora devolve null (sem troca código→token).
 * Pode ser estendido para ler token de sessionStorage após OIDC redirect.
 */
export async function getKeycloakSession(): Promise<KeycloakAuthState> {
  if (typeof window === "undefined") {
    return { session: null, user: null };
  }
  // TODO: após redirect, ler ?code=, trocar por token, guardar em sessionStorage e devolver aqui
  const stored = sessionStorage.getItem("chefiapp_keycloak_session");
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as KeycloakAuthState;
      return parsed;
    } catch {
      sessionStorage.removeItem("chefiapp_keycloak_session");
    }
  }
  return { session: null, user: null };
}

/**
 * Redirecciona para login Keycloak (OIDC authorization code).
 */
export function signInWithKeycloak(): void {
  const base = getKeycloakBase();
  const realm = import.meta.env?.VITE_KEYCLOAK_REALM ?? DEFAULT_REALM;
  const clientId = import.meta.env?.VITE_KEYCLOAK_CLIENT_ID ?? DEFAULT_CLIENT_ID;
  const redirectUri = encodeURIComponent(getRedirectUri());
  const url = `${base}/realms/${realm}/protocol/openid-connect/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid`;
  window.location.href = url;
}

/**
 * Redirecciona para logout Keycloak.
 */
export function signOutKeycloak(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("chefiapp_keycloak_session");
  const base = getKeycloakBase();
  const realm = import.meta.env?.VITE_KEYCLOAK_REALM ?? DEFAULT_REALM;
  const redirectUri = encodeURIComponent(getRedirectUri());
  const url = `${base}/realms/${realm}/protocol/openid-connect/logout?post_logout_redirect_uri=${redirectUri}`;
  window.location.href = url;
}

export function getKeycloakConfig(): {
  baseUrl: string;
  realm: string;
  clientId: string;
} {
  return {
    baseUrl: getKeycloakBase(),
    realm: import.meta.env?.VITE_KEYCLOAK_REALM ?? DEFAULT_REALM,
    clientId: import.meta.env?.VITE_KEYCLOAK_CLIENT_ID ?? DEFAULT_CLIENT_ID,
  };
}
