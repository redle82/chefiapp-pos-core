/**
 * Barrel file for offline subsystem.
 *
 * Re-exports all offline-related modules for convenient consumption:
 *   import { OfflineCatalogCache, useOfflineOrders } from 'core/sync/offline';
 */

// ─── Sync/Offline Infrastructure ─────────────────────────────────────────────

export { ConflictResolutionStrategy } from './ConflictResolutionStrategy';
export { IdempotencyService } from './IdempotencyService';
export { NetworkStateMachine } from './NetworkStateMachine';
export { OfflineOperationRules } from './OfflineOperationRules';
export { OfflineQueueManager } from './OfflineQueueManager';
export { ReconnectReconciler } from './ReconnectReconciler';

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

// ─── Sync/Offline Infrastructure Types ──────────────────────────────────────

export type {
  ConflictReport,
  EntityType,
  ResolutionStrategy,
  VersionedRecord,
} from './ConflictResolutionStrategy';

export type { ProcessedEntry } from './IdempotencyService';

export type {
  NetworkQuality,
  NetworkState,
  NetworkStateListener,
} from './NetworkStateMachine';

export type {
  OfflineAction,
  OfflineCapability,
} from './OfflineOperationRules';

export type {
  DeadLetterItem,
  QueueHealth,
} from './OfflineQueueManager';

export type {
  ReconciliationEvent,
  ReconciliationListener,
  ReconciliationProgress,
  ReconciliationResult,
} from './ReconnectReconciler';
