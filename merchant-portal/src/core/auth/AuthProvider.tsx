/**
 * AuthProvider — Single Source of Truth for auth state.
 *
 * Wraps the entire app tree. All consumers use useAuth() which reads from this
 * context instead of each running their own Keycloak session check.
 *
 * Backend: Docker Core (Keycloak + mock demo/pilot). Zero Supabase.
 *
 * SECURITY: Mock/demo mode is BLOCKED in production builds.
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
import { isDebugMode } from "../debugMode";
import {
  BackendType,
  getBackendConfigured,
  getBackendType,
} from "../infra/backendAdapter";
import type { CoreSession, CoreUser } from "./authTypes";

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
// Mock session helper (DEV only — blocked in production builds)
// ---------------------------------------------------------------------------

/**
 * Returns true if mock/demo auth is ALLOWED in this environment.
 * Production builds (import.meta.env.PROD === true) NEVER allow mock auth.
 */
function isMockAuthAllowed(): boolean {
  // Vite injects import.meta.env.DEV at build time.
  // In production builds, this is always false — never allow mock.
  return import.meta.env.DEV === true;
}

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

    // Demo / Pilot mock — ONLY in development builds (blocked in production)
    if (typeof window !== "undefined" && isMockAuthAllowed()) {
      const isDemoUrl =
        new URLSearchParams(window.location.search).get("demo") === "true";
      const isDemoStored =
        sessionStorage.getItem("chefiapp_demo_mode") === "true" ||
        localStorage.getItem("chefiapp_demo_mode") === "true";
      const isPilot = localStorage.getItem("chefiapp_pilot_mode") === "true";

      if (isDemoUrl || isDemoStored || (isDebugMode() && isPilot)) {
        console.warn(
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

    // Docker: Keycloak session
    if (getBackendType() === BackendType.docker) {
      try {
        const { getKeycloakSession } = await import("./authKeycloak");
        const state = await getKeycloakSession();
        if (!mountedRef.current) return;
        if (state.session && state.user) {
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
