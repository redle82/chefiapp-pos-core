/// <reference lib="dom" />
/**
 * TabIsolatedStorage - Isolated Storage per Browser Tab
 *
 * Prevents conflicts when multiple users or sessions are open in different tabs.
 * Uses sessionStorage (tab-scoped) instead of localStorage (shared across tabs).
 *
 * Migration Strategy:
 * - Read from localStorage on first access (backward compatibility)
 * - Write to sessionStorage (new behavior)
 * - Gradually migrate all consumers
 */

const STORAGE_PREFIX = "chefiapp_";
const MIGRATION_FLAG = "chefiapp_storage_migrated_v1";

/**
 * Check if migration has been done for this session
 */
function isMigrated(): boolean {
  return sessionStorage.getItem(MIGRATION_FLAG) === "true";
}

/**
 * Migrate data from localStorage to sessionStorage (one-time per tab)
 */
function migrateFromLocalStorage(): void {
  if (isMigrated()) return;

  const keysToMigrate = [
    "chefiapp_restaurant_id",
    "chefiapp_active_order_id",
    "chefiapp_active_tenant",
    "chefiapp_setup_status",
    "chefiapp_system_blueprint_v2",
    "chefiapp_trial_mode",
  ];

  keysToMigrate.forEach((key) => {
    const value = localStorage.getItem(key);
    if (value) {
      sessionStorage.setItem(key, value);
    }
  });

  sessionStorage.setItem(MIGRATION_FLAG, "true");
}

/**
 * Get value from sessionStorage (with localStorage fallback for migration)
 */
export function getTabIsolated(key: string): string | null {
  // Migrate on first access
  if (!isMigrated()) {
    migrateFromLocalStorage();
  }

  // Try sessionStorage first
  const sessionValue = sessionStorage.getItem(key);
  if (sessionValue !== null) {
    return sessionValue;
  }

  // Fallback to localStorage (for backward compatibility during migration)
  const localValue = localStorage.getItem(key);
  if (localValue !== null) {
    // Migrate to sessionStorage for next time
    sessionStorage.setItem(key, localValue);
    return localValue;
  }

  return null;
}

/**
 * Set value in sessionStorage (tab-isolated) AND localStorage (persist across refreshes)
 */
export function setTabIsolated(key: string, value: string): void {
  // Migrate on first write
  if (!isMigrated()) {
    migrateFromLocalStorage();
  }

  sessionStorage.setItem(key, value);
  // Also persist to localStorage so the value survives page refreshes
  // and can be picked up by new tabs
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage might be full or disabled — sessionStorage is enough
  }
}

/**
 * Remove value from sessionStorage
 */
export function removeTabIsolated(key: string): void {
  sessionStorage.removeItem(key);
  // Also remove from localStorage for cleanup (optional)
  localStorage.removeItem(key);
}

/**
 * Clear all tab-isolated storage
 */
export function clearTabIsolated(): void {
  const keys = Object.keys(sessionStorage);
  keys.forEach((key) => {
    if (key.startsWith(STORAGE_PREFIX)) {
      sessionStorage.removeItem(key);
    }
  });
}

/**
 * Get all keys with prefix (for debugging)
 */
export function getAllTabIsolatedKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      keys.push(key);
    }
  }
  return keys;
}
