/**
 * Auth hook — Core (Docker) only. Keycloak + mock (demo/pilot). No Supabase.
 */

import { useEffect, useRef, useState } from "react";
import { isDebugMode } from "../debugMode";
import {
  BackendType,
  getBackendConfigured,
  getBackendType,
} from "../infra/backendAdapter";
import type { CoreSession, CoreUser } from "./authTypes";

export interface CoreAuthState {
  session: CoreSession | null;
  user: CoreUser | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook unificado para autenticação. Backend único: Docker Core (Keycloak + mock demo/pilot).
 */
export function useCoreAuth(): CoreAuthState {
  const [session, setSession] = useState<CoreSession | null>(null);
  const [user, setUser] = useState<CoreUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    if (!getBackendConfigured()) {
      setSession(null);
      setUser(null);
      setLoading(false);
      initializedRef.current = true;
      return () => {
        mounted = false;
      };
    }

    // Mock session: demo/pilot mode (persisted or via URL)
    if (typeof window !== "undefined") {
      const isDemoUrl =
        new URLSearchParams(window.location.search).get("demo") === "true";
      const isDemoStored =
        sessionStorage.getItem("chefiapp_demo_mode") === "true" ||
        localStorage.getItem("chefiapp_demo_mode") === "true";
      const isPilot = localStorage.getItem("chefiapp_pilot_mode") === "true";

      if (isDemoUrl || isDemoStored || (isDebugMode() && isPilot)) {
        const PILOT_USER_UUID = "00000000-0000-0000-0000-000000000002";
        const mockUser: CoreUser = {
          id: PILOT_USER_UUID,
          aud: "authenticated",
          role: "authenticated",
          email: "pilot@chefiapp.com",
          phone: "",
          app_metadata: { provider: "email" },
          user_metadata: { name: "Pilot User" },
          created_at: new Date().toISOString(),
        };

        const mockSession: CoreSession = {
          access_token: "mock-pilot-token",
          refresh_token: "mock-pilot-refresh-token",
          expires_in: 3600,
          token_type: "bearer",
          user: mockUser,
        };

        setSession(mockSession);
        setUser(mockUser);
        setLoading(false);
        initializedRef.current = true;
        return;
      }
    }

    // Docker: Keycloak session
    if (getBackendType() === BackendType.docker) {
      import("./authKeycloak").then(({ getKeycloakSession }) => {
        getKeycloakSession()
          .then((state) => {
            if (!mounted) return;
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
            setLoading(false);
            initializedRef.current = true;
          })
          .catch(() => {
            if (mounted) {
              setSession(null);
              setUser(null);
              setLoading(false);
              initializedRef.current = true;
            }
          });
      });
      return () => {
        mounted = false;
      };
    }

    // Backend none (não configurado já retornou acima; este é fallback)
    setSession(null);
    setUser(null);
    setLoading(false);
    initializedRef.current = true;
    return () => {
      mounted = false;
    };
  }, []);

  return { session, user, loading, error };
}
