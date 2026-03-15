/**
 * Auth adapter — SSOT para signIn/signOut.
 * Supabase (fluxo soberano P0): email/password. Docker: Keycloak.
 */

import { CONFIG } from "../../config";
import { BackendType, getBackendType } from "../infra/backendAdapter";
import { signInWithKeycloak, signOutKeycloak } from "./authKeycloak";
import { signInWithPasswordSupabase, signOutSupabase } from "./supabaseAuth";

export interface AuthActions {
  signIn: (email?: string, password?: string) => void | Promise<void>;
  signOut: () => void | Promise<void>;
}

const noOpActions: AuthActions = {
  signIn: () => {},
  signOut: () => {},
};

/**
 * Retorna acções de auth. Supabase => email/password; Docker => Keycloak; none => no-op.
 */
export function getAuthActions(): AuthActions {
  if (CONFIG.isSupabaseBackend) {
    return {
      signIn: (email?: string, password?: string) => {
        if (email && password) {
          return signInWithPasswordSupabase(email, password).then((out) => {
            if ("error" in out) throw out.error;
          });
        }
      },
      signOut: () => signOutSupabase(),
    };
  }
  if (getBackendType() === BackendType.docker) {
    return {
      signIn: () => signInWithKeycloak(),
      signOut: () => signOutKeycloak(),
    };
  }
  return noOpActions;
}
