/**
 * ConflictResolutionStrategy — Entity-aware conflict resolution for offline POS.
 *
 * Defines per-entity resolution rules:
 *   - Orders: server wins (fiscal source of truth)
 *   - Table status: last-write-wins with timestamp
 *   - Stock levels: server wins (prevents over-selling)
 *   - Shifts: merge (combine local breaks with server clock times)
 *   - Settings/Config: server wins
 *   - Receipts: client wins (local has the printed receipt data)
 *
 * Every conflict is logged for audit trail. Nothing is silently discarded.
 */

import { Logger } from '../logger';

// ─── Types ───────────────────────────────────────────────────────────────────

export type EntityType =
  | 'orders'
  | 'tables'
  | 'stock'
  | 'shifts'
  | 'settings'
  | 'receipts';

export type ResolutionStrategy =
  | 'server_wins'
  | 'client_wins'
  | 'last_write_wins'
  | 'merge';

export interface ConflictReport {
  id: string;
  entity: EntityType;
  entityId: string;
  field: string;
  localValue: unknown;
  serverValue: unknown;
  resolution: ResolutionStrategy;
  resolvedValue: unknown;
  timestamp: number;
}

export interface VersionedRecord {
  id: string;
  updated_at?: string;
  version?: number;
  [key: string]: unknown;
}

// ─── Resolution Rules ────────────────────────────────────────────────────────

const RESOLUTION_RULES: Record<EntityType, ResolutionStrategy> = {
  orders: 'server_wins',
  tables: 'last_write_wins',
  stock: 'server_wins',
  shifts: 'merge',
  settings: 'server_wins',
  receipts: 'client_wins',
};

// ─── Conflict Log (in-memory buffer, flushed to IndexedDB if needed) ─────────

const conflictLog: ConflictReport[] = [];
const MAX_CONFLICT_LOG = 500;

// ─── Service ─────────────────────────────────────────────────────────────────

class ConflictResolutionStrategyClass {
  /**
   * Get the resolution strategy for a given entity type.
   */
  getStrategy(entity: EntityType): ResolutionStrategy {
    return RESOLUTION_RULES[entity] ?? 'server_wins';
  }

  /**
   * Resolve a conflict between local and server versions of an entity.
   * Returns the merged/resolved record and logs the conflict.
   */
  resolveConflict(
    entity: EntityType,
    localVersion: VersionedRecord,
    serverVersion: VersionedRecord,
  ): VersionedRecord {
    const strategy = this.getStrategy(entity);

    Logger.info(
      `[ConflictResolution] Resolving ${entity}:${localVersion.id} with strategy: ${strategy}`,
    );

    switch (strategy) {
      case 'server_wins':
        return this.resolveServerWins(entity, localVersion, serverVersion);

      case 'client_wins':
        return this.resolveClientWins(entity, localVersion, serverVersion);

      case 'last_write_wins':
        return this.resolveLastWriteWins(entity, localVersion, serverVersion);

      case 'merge':
        return this.resolveMerge(entity, localVersion, serverVersion);

      default:
        Logger.warn(
          `[ConflictResolution] Unknown strategy '${strategy}', defaulting to server_wins`,
        );
        return this.resolveServerWins(entity, localVersion, serverVersion);
    }
  }

  /**
   * Server version takes precedence. Used for orders, stock, settings.
   */
  private resolveServerWins(
    entity: EntityType,
    localVersion: VersionedRecord,
    serverVersion: VersionedRecord,
  ): VersionedRecord {
    this.logFieldConflicts(entity, localVersion, serverVersion, 'server_wins', serverVersion);
    return { ...serverVersion };
  }

  /**
   * Client version takes precedence. Used for receipts.
   */
  private resolveClientWins(
    entity: EntityType,
    localVersion: VersionedRecord,
    serverVersion: VersionedRecord,
  ): VersionedRecord {
    this.logFieldConflicts(entity, localVersion, serverVersion, 'client_wins', localVersion);
    return { ...localVersion };
  }

  /**
   * Most recent write wins, based on updated_at timestamp.
   * Used for table status.
   */
  private resolveLastWriteWins(
    entity: EntityType,
    localVersion: VersionedRecord,
    serverVersion: VersionedRecord,
  ): VersionedRecord {
    const localTime = localVersion.updated_at
      ? new Date(localVersion.updated_at).getTime()
      : 0;
    const serverTime = serverVersion.updated_at
      ? new Date(serverVersion.updated_at).getTime()
      : 0;

    const winner = localTime >= serverTime ? localVersion : serverVersion;
    const strategy = localTime >= serverTime ? 'client_wins' : 'server_wins';

    this.logFieldConflicts(entity, localVersion, serverVersion, 'last_write_wins', winner);

    Logger.info(
      `[ConflictResolution] LWW winner for ${entity}:${localVersion.id}: ${
        localTime >= serverTime ? 'local' : 'server'
      } (local=${localTime}, server=${serverTime})`,
    );

    return { ...winner };
  }

  /**
   * Merge strategy: combine non-conflicting fields from both versions.
   * For truly conflicting fields, server wins (safety).
   * Used for shifts (combine local breaks with server clock times).
   */
  private resolveMerge(
    entity: EntityType,
    localVersion: VersionedRecord,
    serverVersion: VersionedRecord,
  ): VersionedRecord {
    const merged: VersionedRecord = { ...serverVersion };
    const allKeys = new Set([
      ...Object.keys(localVersion),
      ...Object.keys(serverVersion),
    ]);

    for (const key of allKeys) {
      if (key === 'id' || key === 'version' || key === 'updated_at') continue;

      const localVal = localVersion[key];
      const serverVal = serverVersion[key];

      // If only local has it (new field added offline), keep it
      if (localVal !== undefined && serverVal === undefined) {
        merged[key] = localVal;
        continue;
      }

      // If both have it and values differ, use merge logic
      if (
        localVal !== undefined &&
        serverVal !== undefined &&
        JSON.stringify(localVal) !== JSON.stringify(serverVal)
      ) {
        // For arrays (like breaks), concatenate and deduplicate by id
        if (Array.isArray(localVal) && Array.isArray(serverVal)) {
          const mergedArray = [...serverVal];
          const serverIds = new Set(
            serverVal
              .filter((item): item is Record<string, unknown> => item != null && typeof item === 'object')
              .map((item) => (item as Record<string, unknown>).id),
          );

          for (const item of localVal) {
            const itemId = item != null && typeof item === 'object'
              ? (item as Record<string, unknown>).id
              : undefined;
            if (itemId && !serverIds.has(itemId)) {
              mergedArray.push(item);
            }
          }
          merged[key] = mergedArray;
        }
        // For scalar conflicts, server wins (safety)
        // merged[key] already has serverVal

        this.addConflictReport({
          id: `${entity}-${localVersion.id}-${key}-${Date.now()}`,
          entity,
          entityId: localVersion.id,
          field: key,
          localValue: localVal,
          serverValue: serverVal,
          resolution: 'merge',
          resolvedValue: merged[key],
          timestamp: Date.now(),
        });
      }
    }

    return merged;
  }

  /**
   * Log field-level conflicts between two records.
   */
  private logFieldConflicts(
    entity: EntityType,
    localVersion: VersionedRecord,
    serverVersion: VersionedRecord,
    resolution: ResolutionStrategy,
    resolvedRecord: VersionedRecord,
  ): void {
    const allKeys = new Set([
      ...Object.keys(localVersion),
      ...Object.keys(serverVersion),
    ]);

    for (const key of allKeys) {
      if (key === 'id' || key === 'version') continue;

      const localVal = localVersion[key];
      const serverVal = serverVersion[key];

      if (
        localVal !== undefined &&
        serverVal !== undefined &&
        JSON.stringify(localVal) !== JSON.stringify(serverVal)
      ) {
        this.addConflictReport({
          id: `${entity}-${localVersion.id}-${key}-${Date.now()}`,
          entity,
          entityId: localVersion.id,
          field: key,
          localValue: localVal,
          serverValue: serverVal,
          resolution,
          resolvedValue: resolvedRecord[key],
          timestamp: Date.now(),
        });
      }
    }
  }

  private addConflictReport(report: ConflictReport): void {
    conflictLog.push(report);
    // Prevent unbounded growth
    if (conflictLog.length > MAX_CONFLICT_LOG) {
      conflictLog.splice(0, conflictLog.length - MAX_CONFLICT_LOG);
    }
    Logger.info(
      `[ConflictResolution] Conflict recorded: ${report.entity}:${report.entityId}.${report.field} ` +
        `(local=${JSON.stringify(report.localValue)}, server=${JSON.stringify(report.serverValue)}, ` +
        `resolved=${report.resolution})`,
    );
  }

  /**
   * Get all recorded conflict reports (for admin/audit).
   */
  getConflictLog(): ReadonlyArray<ConflictReport> {
    return [...conflictLog];
  }

  /**
   * Get conflicts for a specific entity.
   */
  getConflictsForEntity(entity: EntityType, entityId: string): ConflictReport[] {
    return conflictLog.filter(
      (r) => r.entity === entity && r.entityId === entityId,
    );
  }

  /**
   * Clear the conflict log (after admin review).
   */
  clearConflictLog(): void {
    conflictLog.length = 0;
    Logger.info('[ConflictResolution] Conflict log cleared');
  }
}

export const ConflictResolutionStrategy = new ConflictResolutionStrategyClass();
