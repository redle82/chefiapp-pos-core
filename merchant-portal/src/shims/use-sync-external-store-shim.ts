/**
 * Shim that re-exports useSyncExternalStore from React 19.
 * React 19 includes useSyncExternalStore natively, so the legacy
 * use-sync-external-store package is unnecessary and causes CJS/ESM
 * bundling issues (the shim's exports object is undefined in ESM chunks).
 */
export { useSyncExternalStore } from "react";
