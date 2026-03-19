/**
 * Barrel file for offline subsystem.
 *
 * Re-exports all offline-related modules for convenient consumption:
 *   import { OfflineCatalogCache, useOfflineOrders } from 'core/sync/offline';
 */

// ─── Classes ─────────────────────────────────────────────────────────────────

export { OfflineCatalogCache } from './OfflineCatalogCache';
export { OfflineOrderStore } from './OfflineOrderStore';
export { OfflineSyncBridge } from './OfflineSyncBridge';

// ─── Hooks ───────────────────────────────────────────────────────────────────

export { useCatalogSync } from './useCatalogSync';
export { useOfflineOrders } from './useOfflineOrders';

// ─── Types ───────────────────────────────────────────────────────────────────

export type {
  CachedCatalog,
  CachedCategory,
  CachedModifier,
  CachedModifierGroup,
  CachedProduct,
  CatalogSnapshot,
} from './OfflineCatalogCache';

export type {
  LocalOrder,
  LocalOrderItem,
  LocalOrderStatus,
  OrderSyncStatus,
} from './OfflineOrderStore';

export type { SyncResult } from './OfflineSyncBridge';

export type { CatalogSyncState } from './useCatalogSync';
export type { CreateOrderInput, OfflineOrdersState } from './useOfflineOrders';
