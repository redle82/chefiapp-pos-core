/**
 * ReconnectReconciler — Orchestrates data reconciliation when connection restores.
 *
 * Sequence on reconnect:
 *   1. Pause new operations briefly (500ms)
 *   2. Pull server state for critical entities (orders, tables)
 *   3. Compare with local state
 *   4. Apply conflict resolution
 *   5. Drain offline queue in priority order
 *   6. Resume normal operations
 *
 * Emits events for UI progress: "Syncing 12 items... (3/12)"
 */

import { Logger } from '../logger';
import {
  ConflictResolutionStrategy,
  type EntityType,
  type VersionedRecord,
} from './ConflictResolutionStrategy';
import { NetworkStateMachine } from './NetworkStateMachine';
import { OfflineQueueManager } from './OfflineQueueManager';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ReconciliationEvent =
  | 'RECONCILIATION_STARTED'
  | 'RECONCILIATION_PROGRESS'
  | 'RECONCILIATION_CONFLICT'
  | 'RECONCILIATION_COMPLETED'
  | 'RECONCILIATION_FAILED';

export interface ReconciliationProgress {
  event: ReconciliationEvent;
  total: number;
  processed: number;
  conflicts: number;
  errors: number;
  message: string;
}

export type ReconciliationListener = (progress: ReconciliationProgress) => void;

export interface ReconciliationResult {
  success: boolean;
  total: number;
  synced: number;
  conflicts: number;
  errors: number;
  durationMs: number;
}

/**
 * Server data fetcher: consumers must provide this to fetch server state.
 * Returns an array of records for the given entity type and IDs.
 */
export type ServerFetcher = (
  entity: EntityType,
  ids: string[],
) => Promise<VersionedRecord[]>;

/**
 * Local data provider: consumers must provide this to get local state.
 * Returns an array of locally-modified records for the entity type.
 */
export type LocalDataProvider = (
  entity: EntityType,
) => Promise<VersionedRecord[]>;

/**
 * Local data updater: consumers provide this to apply resolved records locally.
 */
export type LocalDataUpdater = (
  entity: EntityType,
  record: VersionedRecord,
) => Promise<void>;

// ─── Configuration ───────────────────────────────────────────────────────────

/** Entity types to reconcile on reconnect, in priority order. */
const RECONCILE_ENTITIES: EntityType[] = ['orders', 'tables', 'stock'];

const PAUSE_BEFORE_RECONCILE_MS = 500;
const QUEUE_DRAIN_BATCH_SIZE = 5;

// ─── Service ─────────────────────────────────────────────────────────────────

class ReconnectReconcilerClass {
  private listeners: ReconciliationListener[] = [];
  private isReconciling = false;
  private serverFetcher: ServerFetcher | null = null;
  private localDataProvider: LocalDataProvider | null = null;
  private localDataUpdater: LocalDataUpdater | null = null;
  private processQueueFn: (() => Promise<void>) | null = null;

  /**
   * Configure the reconciler with data access functions.
   * Must be called before reconcileOnReconnect().
   */
  configure(options: {
    serverFetcher: ServerFetcher;
    localDataProvider: LocalDataProvider;
    localDataUpdater: LocalDataUpdater;
    processQueue: () => Promise<void>;
  }): void {
    this.serverFetcher = options.serverFetcher;
    this.localDataProvider = options.localDataProvider;
    this.localDataUpdater = options.localDataUpdater;
    this.processQueueFn = options.processQueue;
  }

  /**
   * Subscribe to reconciliation progress events.
   */
  subscribe(listener: ReconciliationListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit(progress: ReconciliationProgress): void {
    for (const listener of this.listeners) {
      try {
        listener(progress);
      } catch (err) {
        Logger.error('[ReconnectReconciler] Listener error', err);
      }
    }
  }

  /**
   * Check if reconciliation is currently in progress.
   */
  isInProgress(): boolean {
    return this.isReconciling;
  }

  /**
   * Main reconciliation orchestrator. Called when network transitions from
   * OFFLINE/DEGRADED to RECONNECTING.
   */
  async reconcileOnReconnect(): Promise<ReconciliationResult> {
    if (this.isReconciling) {
      Logger.warn('[ReconnectReconciler] Already reconciling, skipping');
      return {
        success: false,
        total: 0,
        synced: 0,
        conflicts: 0,
        errors: 0,
        durationMs: 0,
      };
    }

    this.isReconciling = true;
    const startTime = Date.now();
    const result: ReconciliationResult = {
      success: true,
      total: 0,
      synced: 0,
      conflicts: 0,
      errors: 0,
      durationMs: 0,
    };

    Logger.info('[ReconnectReconciler] Starting reconciliation...');
    this.emit({
      event: 'RECONCILIATION_STARTED',
      total: 0,
      processed: 0,
      conflicts: 0,
      errors: 0,
      message: 'Starting synchronization...',
    });

    try {
      // Step 1: Brief pause to let network stabilize
      await this.pause(PAUSE_BEFORE_RECONCILE_MS);

      // Verify still connected
      if (!NetworkStateMachine.canSync()) {
        Logger.warn('[ReconnectReconciler] Network lost during pause, aborting');
        result.success = false;
        return result;
      }

      // Step 2-4: Reconcile entities (only if providers are configured)
      if (this.serverFetcher && this.localDataProvider && this.localDataUpdater) {
        for (const entity of RECONCILE_ENTITIES) {
          try {
            const entityResult = await this.reconcileEntity(entity, result);
            result.synced += entityResult.synced;
            result.conflicts += entityResult.conflicts;
            result.errors += entityResult.errors;
          } catch (err) {
            Logger.error(
              `[ReconnectReconciler] Entity reconciliation failed for ${entity}`,
              err,
            );
            result.errors++;
          }
        }
      }

      // Step 5: Drain the offline queue in priority order
      await this.drainOfflineQueue(result);

      // Step 6: Mark reconnection complete
      NetworkStateMachine.markReconnectionComplete();

      Logger.info(
        `[ReconnectReconciler] Reconciliation complete: ` +
          `${result.synced} synced, ${result.conflicts} conflicts, ${result.errors} errors`,
      );
    } catch (err) {
      Logger.error('[ReconnectReconciler] Critical reconciliation error', err);
      result.success = false;
      result.errors++;

      this.emit({
        event: 'RECONCILIATION_FAILED',
        total: result.total,
        processed: result.synced,
        conflicts: result.conflicts,
        errors: result.errors,
        message: `Reconciliation failed: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      this.isReconciling = false;
      result.durationMs = Date.now() - startTime;

      this.emit({
        event: 'RECONCILIATION_COMPLETED',
        total: result.total,
        processed: result.synced,
        conflicts: result.conflicts,
        errors: result.errors,
        message: `Synchronization complete (${result.synced}/${result.total} items)`,
      });
    }

    return result;
  }

  /**
   * Reconcile a single entity type: fetch server state, compare, resolve conflicts.
   */
  private async reconcileEntity(
    entity: EntityType,
    overallResult: ReconciliationResult,
  ): Promise<{ synced: number; conflicts: number; errors: number }> {
    const entityResult = { synced: 0, conflicts: 0, errors: 0 };

    if (!this.localDataProvider || !this.serverFetcher || !this.localDataUpdater) {
      return entityResult;
    }

    // Get locally modified records
    const localRecords = await this.localDataProvider(entity);
    if (localRecords.length === 0) return entityResult;

    overallResult.total += localRecords.length;

    // Fetch server state for these records
    const localIds = localRecords.map((r) => r.id);
    let serverRecords: VersionedRecord[];

    try {
      serverRecords = await this.serverFetcher(entity, localIds);
    } catch (err) {
      Logger.error(
        `[ReconnectReconciler] Failed to fetch server state for ${entity}`,
        err,
      );
      entityResult.errors += localRecords.length;
      return entityResult;
    }

    // Build server lookup
    const serverMap = new Map<string, VersionedRecord>();
    for (const record of serverRecords) {
      serverMap.set(record.id, record);
    }

    // Compare and resolve each record
    for (const localRecord of localRecords) {
      try {
        const serverRecord = serverMap.get(localRecord.id);

        if (!serverRecord) {
          // Record doesn't exist on server — local is authoritative, just sync it
          entityResult.synced++;
          continue;
        }

        // Check if there's actually a conflict
        const localUpdated = localRecord.updated_at
          ? new Date(localRecord.updated_at).getTime()
          : 0;
        const serverUpdated = serverRecord.updated_at
          ? new Date(serverRecord.updated_at).getTime()
          : 0;

        if (localUpdated === serverUpdated) {
          // No conflict, already in sync
          entityResult.synced++;
          continue;
        }

        // Conflict detected — resolve it
        const resolved = ConflictResolutionStrategy.resolveConflict(
          entity,
          localRecord,
          serverRecord,
        );

        await this.localDataUpdater(entity, resolved);
        entityResult.conflicts++;

        this.emit({
          event: 'RECONCILIATION_CONFLICT',
          total: overallResult.total,
          processed: entityResult.synced + entityResult.conflicts,
          conflicts: entityResult.conflicts,
          errors: entityResult.errors,
          message: `Conflict resolved for ${entity}:${localRecord.id}`,
        });
      } catch (err) {
        Logger.error(
          `[ReconnectReconciler] Failed to reconcile ${entity}:${localRecord.id}`,
          err,
        );
        entityResult.errors++;
      }

      // Progress update
      const processed = entityResult.synced + entityResult.conflicts + entityResult.errors;
      this.emit({
        event: 'RECONCILIATION_PROGRESS',
        total: overallResult.total,
        processed,
        conflicts: entityResult.conflicts,
        errors: entityResult.errors,
        message: `Syncing ${entity}... (${processed}/${localRecords.length})`,
      });
    }

    return entityResult;
  }

  /**
   * Drain the offline queue in batches with priority ordering.
   */
  private async drainOfflineQueue(result: ReconciliationResult): Promise<void> {
    const health = await OfflineQueueManager.getQueueHealth();
    const pendingCount = health.pending + health.failed;

    if (pendingCount === 0) {
      Logger.info('[ReconnectReconciler] No pending queue items to drain');
      return;
    }

    result.total += pendingCount;

    Logger.info(
      `[ReconnectReconciler] Draining ${pendingCount} queued items...`,
    );

    this.emit({
      event: 'RECONCILIATION_PROGRESS',
      total: result.total,
      processed: result.synced,
      conflicts: result.conflicts,
      errors: result.errors,
      message: `Syncing ${pendingCount} queued operations...`,
    });

    // Use the SyncEngine's processQueue if configured, otherwise drain manually
    if (this.processQueueFn) {
      try {
        await this.processQueueFn();
        result.synced += pendingCount;
      } catch (err) {
        Logger.error('[ReconnectReconciler] Queue drain failed', err);
        result.errors++;
      }
    } else {
      // Fallback: drain in batches (items will be processed by SyncEngine later)
      let processed = 0;
      while (processed < pendingCount) {
        if (!NetworkStateMachine.canSync()) {
          Logger.warn(
            '[ReconnectReconciler] Network lost during queue drain, stopping',
          );
          break;
        }

        const batch = await OfflineQueueManager.drainQueue(
          QUEUE_DRAIN_BATCH_SIZE,
        );
        if (batch.length === 0) break;

        processed += batch.length;
        result.synced += batch.length;

        this.emit({
          event: 'RECONCILIATION_PROGRESS',
          total: result.total,
          processed: result.synced,
          conflicts: result.conflicts,
          errors: result.errors,
          message: `Syncing queued operations... (${processed}/${pendingCount})`,
        });
      }
    }
  }

  private pause(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const ReconnectReconciler = new ReconnectReconcilerClass();
