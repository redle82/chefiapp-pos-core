/**
 * Auth adapter — SSOT para signIn/signOut.
 * Backend único: Docker Core (Keycloak + mock). Sem Supabase.
 */
// @ts-nocheck


import { BackendType, getBackendType } from "../infra/backendAdapter";
import { signInWithKeycloak, signOutKeycloak } from "./authKeycloak";

export interface AuthActions {
  signIn: (email?: string, password?: string) => void | Promise<void>;
  signOut: () => void | Promise<void>;
}

const noOpActions: AuthActions = {
  signIn: () => {},
  signOut: () => {},
};

/**
 * Retorna acções de auth. Docker => Keycloak; none => no-op.
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
