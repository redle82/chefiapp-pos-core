/**
 * AuthProvider — Single Source of Truth for auth state.
 *
 * Wraps the entire app tree. All consumers use useAuth() which reads from this
 * context instead of each running their own Keycloak session check.
 *
 * Backend: Docker Core (Keycloak + mock) or Supabase (fluxo soberano P0: email/password).
 *
 * SECURITY: Mock/trial mode is BLOCKED in production builds.
 * Only available when import.meta.env.DEV === true (Vite dev server).
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CONFIG } from "../../config";
import { isDebugMode } from "../debugMode";
import {
  BackendType,
  getBackendConfigured,
  getBackendType,
} from "../infra/backendAdapter";
import { Logger } from "../logger";
import {
  SOFIA_RESTAURANT_ID,
  TRIAL_RESTAURANT_ID,
} from "../readiness/operationalRestaurant";
import type { CoreSession, CoreUser } from "./authTypes";
import {
  clearJustLoggedOut,
  clearLogoutDone,
  isJustLoggedOut,
  isLogoutDone,
} from "./authKeycloak";
import { isMockAuthEnabled } from "./mockAuthGate";
import {
  getSupabaseSession,
  onSupabaseAuthStateChange,
} from "./supabaseAuth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthState {
  session: CoreSession | null;
  user: CoreUser | null;
  loading: boolean;
  error: Error | null;
}

interface AuthContextType extends AuthState {
  /** Force re-check of session (e.g. after tab focus). */
  refresh: () => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextType | null>(null);

// ---------------------------------------------------------------------------
// Mock session helper (DEV only — requires explicit allow flag)
// ---------------------------------------------------------------------------

const PILOT_USER_UUID = "00000000-0000-0000-0000-000000000002";

function createMockSession(): { session: CoreSession; user: CoreUser } {
  const user: CoreUser = {
    id: PILOT_USER_UUID,
    aud: "authenticated",
    role: "authenticated",
    email: "pilot@chefiapp.com",
    phone: "",
    app_metadata: { provider: "email" },
    user_metadata: { name: "Pilot User" },
    created_at: new Date().toISOString(),
  };
  const session: CoreSession = {
    access_token: "mock-pilot-token",
    refresh_token: "mock-pilot-refresh-token",
    expires_in: 3600,
    token_type: "bearer",
    user,
  };
  return { session, user };
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<CoreSession | null>(null);
  const [user, setUser] = useState<CoreUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const checkSession = useCallback(async () => {
    // No backend configured
    if (!getBackendConfigured()) {
      if (mountedRef.current) {
        setSession(null);
        setUser(null);
        setLoading(false);
      }
      return;
    }

    // Trial / Pilot mock — ONLY when explicitly allowed in dev
    if (typeof window !== "undefined" && isMockAuthEnabled(import.meta.env)) {
      // After logout we set chefiapp_just_logged_out (session + local); do not re-seed
      if (isJustLoggedOut()) {
        clearJustLoggedOut();
        // Fall through to Keycloak path — no mock, no re-auth
      } else {
        // AUTO-PILOT: When DEBUG_DIRECT_FLOW + Docker (cenário Sofia) → garantir pilot_mode e restaurant_id
        // para que isPilot seja true e o mock ative. Ignorar skipAutoPilot para o seed: sem isto,
        // chefiapp_skip_auto_pilot ou isLogoutDone() impedem o menu de sessão de mostrar o dono.
        if (
          CONFIG.DEBUG_DIRECT_FLOW &&
          getBackendType() === BackendType.docker
        ) {
          if (!localStorage.getItem("chefiapp_pilot_mode")) {
            localStorage.setItem("chefiapp_pilot_mode", "true");
          }
          if (!localStorage.getItem("chefiapp_restaurant_id")) {
            localStorage.setItem("chefiapp_restaurant_id", SOFIA_RESTAURANT_ID);
          }
          if (!sessionStorage.getItem("chefiapp_debug")) {
            sessionStorage.setItem("chefiapp_debug", "1");
          }
          // Fechar modo trial: restaurante real = Sofia Gastrobar
          localStorage.removeItem("chefiapp_trial_mode");
          sessionStorage.removeItem("chefiapp_trial_mode");
        }

        const isTrialUrl =
          new URLSearchParams(window.location.search).get("mode") === "trial";
        const isTrialStored =
          sessionStorage.getItem("chefiapp_trial_mode") === "true" ||
          localStorage.getItem("chefiapp_trial_mode") === "true";
        const isPilot = localStorage.getItem("chefiapp_pilot_mode") === "true";

        // Modo trial: restaurante "Seu restaurante" (id 099)
        if (isTrialUrl) {
          localStorage.setItem("chefiapp_trial_mode", "true");
          sessionStorage.setItem("chefiapp_trial_mode", "true");
          localStorage.setItem("chefiapp_restaurant_id", TRIAL_RESTAURANT_ID);
        }
        if (isTrialStored) {
          localStorage.setItem("chefiapp_restaurant_id", TRIAL_RESTAURANT_ID);
        }

        // Pilot (Sofia): ativa mock com isPilot + (debug na URL ou DEBUG_DIRECT_FLOW já ativo)
        const pilotOk = isPilot && (isDebugMode() || CONFIG.DEBUG_DIRECT_FLOW);
        if (isTrialUrl || isTrialStored || pilotOk) {
          Logger.warn(
            "[AuthProvider] Mock auth activated (DEV only). This is BLOCKED in production builds.",
          );
          const mock = createMockSession();
          if (mountedRef.current) {
            setSession(mock.session);
            setUser(mock.user);
            setLoading(false);
          }
          return;
        }
      }
    }

    // Supabase: email/password session (fluxo soberano P0)
    if (CONFIG.isSupabaseBackend) {
      try {
        const core = await getSupabaseSession();
        if (!mountedRef.current) return;
        if (core) {
          clearLogoutDone();
          setSession(core);
          setUser(core.user);
        } else {
          setSession(null);
          setUser(null);
        }
      } catch (err) {
        if (mountedRef.current) {
          setSession(null);
          setUser(null);
          setError(err instanceof Error ? err : new Error("Auth check failed"));
        }
      }
      if (mountedRef.current) setLoading(false);
      return;
    }

    // Docker: Keycloak session
    if (getBackendType() === BackendType.docker) {
      try {
        const { getKeycloakSession } = await import("./authKeycloak");
        const state = await getKeycloakSession();
        if (!mountedRef.current) return;
        if (state.session && state.user) {
          clearLogoutDone();
          const userLike = state.user as CoreUser;
          const sessionLike: CoreSession = {
            access_token: state.session.access_token,
            user: userLike,
          };
          setSession(sessionLike);
          setUser(userLike);
        } else {
          setSession(null);
          setUser(null);
        }
      } catch (err) {
        if (mountedRef.current) {
          setSession(null);
          setUser(null);
          setError(err instanceof Error ? err : new Error("Auth check failed"));
        }
      }
    } else {
      // Fallback: no session
      if (mountedRef.current) {
        setSession(null);
        setUser(null);
      }
    }

    if (mountedRef.current) {
      setLoading(false);
    }
  }, []);

  // Initial check
  useEffect(() => {
    mountedRef.current = true;
    checkSession();
    return () => {
      mountedRef.current = false;
    };
  }, [checkSession]);

  // Re-check on tab focus (catches token refresh / external login)
  useEffect(() => {
    const onFocus = () => {
      checkSession();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [checkSession]);

  // Supabase: keep state in sync with auth changes (e.g. after signIn)
  useEffect(() => {
    if (!CONFIG.isSupabaseBackend) return;
    const unsubscribe = onSupabaseAuthStateChange((next) => {
      setSession(next);
      setUser(next?.user ?? null);
    });
    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    session,
    user,
    loading,
    error,
    refresh: checkSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useAuthContext — reads auth state from the nearest AuthProvider.
 * If no provider is found, falls back to independent session check
 * (backward-compat for tests or isolated renders).
 */
export function useAuthContext(): AuthState {
  const ctx = useContext(AuthContext);
  if (ctx) {
    return {
      session: ctx.session,
      user: ctx.user,
      loading: ctx.loading,
      error: ctx.error,
    };
  }
  // Fallback: no provider — return "not loaded" state for tests/isolated renders
  return { session: null, user: null, loading: true, error: null };
}
