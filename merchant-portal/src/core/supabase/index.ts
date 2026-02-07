/**
 * @deprecated Use `core/db` instead. Re-export barrel for backward compat.
 */
export { db, db as supabase, coreClient, getCoreClient, coreNotImplemented } from "../db";
export type { CoreClient } from "../db";
