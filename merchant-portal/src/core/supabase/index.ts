/**
 * @deprecated Use `core/db` instead. Re-export barrel for backward compat.
 */
export {
  coreClient,
  coreNotImplemented,
  db,
  getCoreClient,
  db as supabase,
} from "../db";
export type { CoreClient } from "../db";
