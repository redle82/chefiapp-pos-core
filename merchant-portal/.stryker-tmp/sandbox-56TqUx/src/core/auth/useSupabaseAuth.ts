/**
 * @deprecated Use `useAuth` from `core/auth/useAuth`. Re-export barrel.
 */
// @ts-nocheck

export {
  useAuth as useSupabaseAuth,
  type AuthState as SupabaseAuthState,
} from "./useAuth";
