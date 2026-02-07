/**
 * Core Auth hook — Docker Core only (Keycloak + mock). 100% Docker, zero Supabase.
 */

import type { CoreAuthState } from "./useCoreAuth";
import { useCoreAuth } from "./useCoreAuth";

export type { CoreAuthState as AuthState };
export { useCoreAuth as useAuth };

/**
 * @deprecated Use `useAuth` from `core/auth/useAuth`. Kept for backward compat.
 */
export { useCoreAuth as useSupabaseAuth };
export type { CoreAuthState as SupabaseAuthState };
