/**
 * Sessão Core (Docker). Única fonte para getSession/getUser.
 * Usado por core/supabase stub e por useCoreAuth. Sem Supabase.
 */

import { isDebugMode } from "../debugMode";
import {
  BackendType,
  getBackendConfigured,
  getBackendType,
} from "../infra/backendAdapter";
import { getKeycloakSession } from "./authKeycloak";
import type { CoreSession, CoreUser } from "./authTypes";

const PILOT_USER_UUID = "00000000-0000-0000-0000-000000000002";

function mockSession(): CoreSession {
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
  return {
    access_token: "mock-pilot-token",
    refresh_token: "mock-pilot-refresh-token",
    expires_in: 3600,
    token_type: "bearer",
    user: mockUser,
  };
}

/**
 * Devolve sessão Core (mock em trial/pilot, Keycloak em Docker). Sem Supabase.
 */
export async function getCoreSessionAsync(): Promise<CoreSession | null> {
  if (!getBackendConfigured()) return null;
  if (typeof window === "undefined") return null;

  const isTrial =
    new URLSearchParams(window.location.search).get("mode") === "trial";
  const isPilot = localStorage.getItem("chefiapp_pilot_mode") === "true";
  if (isDebugMode() && (isTrial || isPilot)) return mockSession();

  if (getBackendType() === BackendType.docker) {
    const state = await getKeycloakSession();
    if (state.session && state.user) {
      const userLike = state.user as CoreUser;
      return {
        access_token: state.session.access_token,
        user: userLike,
      };
    }
  }
  return null;
}
