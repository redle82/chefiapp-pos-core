/**
 * Auth adapter — SSOT para signIn/signOut.
 * Backend único: Docker Core (Keycloak + mock). Sem Supabase.
 */

import { BackendType, getBackendType } from "../infra/backendAdapter";
import { signInWithKeycloak, signOutKeycloak } from "./authKeycloak";

export interface AuthActions {
  signIn: (email?: string, password?: string) => void | Promise<void>;
  signOut: () => void | Promise<void>;
}

/**
 * Fallback signOut for non-Docker (production trial).
 * Sets a "logged_out" flag so the trial auto-persist doesn't
 * immediately re-create the restaurant_id. Clears session-related
 * state and redirects to the landing page.
 *
 * The flag is cleared when the user explicitly re-enters the app
 * (FlowGate operational fast-path).
 */
function signOutFallback(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("chefiapp_logged_out", "true");
  localStorage.removeItem("chefiapp_restaurant_id");
  localStorage.removeItem("chefiapp_session");
  sessionStorage.clear();
  window.location.href = "/";
}

const noOpActions: AuthActions = {
  signIn: () => {},
  signOut: () => signOutFallback(),
};

/**
 * Retorna acções de auth. Docker => Keycloak; none => fallback (clear + redirect).
 */
export function getAuthActions(): AuthActions {
  if (getBackendType() === BackendType.docker) {
    return {
      signIn: () => signInWithKeycloak(),
      signOut: () => signOutKeycloak(),
    };
  }
  return noOpActions;
}
