/**
 * @deprecated Use useCoreAuth. Re-export para compatibilidade durante migração.
 * Auth: Core (Docker) only — Keycloak + mock. Sem Supabase.
 */

import type { CoreAuthState } from "./useCoreAuth";
import { useCoreAuth } from "./useCoreAuth";

export type { CoreAuthState as SupabaseAuthState };
export { useCoreAuth as useSupabaseAuth };
