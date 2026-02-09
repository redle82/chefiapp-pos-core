/**
 * Core Auth hook — Docker Core only (Keycloak + mock). 100% Docker, zero Supabase.
 *
 * Reads from the shared AuthProvider context (single session check for the whole tree).
 * Falls back to independent check if no AuthProvider is mounted (tests, isolated renders).
 */

import { useAuthContext, type AuthState } from "./AuthProvider";
import type { CoreAuthState } from "./useCoreAuth";

export { useAuthContext as useAuth };
export type { AuthState };

/**
 * @deprecated Use `useAuth` from `core/auth/useAuth`. Kept for backward compat.
 */
export { useAuthContext as useSupabaseAuth };
export type { CoreAuthState as SupabaseAuthState };
