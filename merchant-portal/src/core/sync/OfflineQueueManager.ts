/**
 * OfflineQueueManager — Priority queue with dead letter support for POS operations.
 *
 * Features:
 * - Priority ordering: payments > orders > stock > everything else
 * - Queue size limits: warn at 500, block non-critical at 800, hard max 1000
 * - Exponential backoff retry: 1s, 2s, 4s, 8s, 16s, max 60s
 * - Dead letter queue: items that fail 10 times require manual intervention
 * - Queue health monitoring for the system health dashboard
 * - Never silently drops data
 *
 * Wraps IndexedDBQueue with priority and dead-letter semantics.
 */

import { Logger } from '../logger';
import { IndexedDBQueue } from './IndexedDBQueue';
import type { OfflineQueueItem } from './types';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface QueueHealth {
  total: number;
  pending: number;
  syncing: number;
  failed: number;
  deadLetter: number;
  applied: number;
  oldestItemAge: number; // ms since oldest pending item was created
  capacityWarning: 'none' | 'warn' | 'critical' | 'blocked';
}

export interface DeadLetterItem extends OfflineQueueItem {
  status: 'dead_letter';
}

export type QueueItemType = OfflineQueueItem['type'];

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_QUEUE_SIZE = 1000;
const WARN_QUEUE_SIZE = 500;
const BLOCK_NON_CRITICAL_SIZE = 800;
const MAX_RETRIES = 10;

/**
 * Priority map: lower number = higher priority.
 * Payments must sync first (financial integrity), then orders, then everything else.
 */
const PRIORITY_MAP: Record<string, number> = {
  ORDER_PAY: 0,
  ORDER_CREATE: 1,
  ORDER_UPDATE: 2,
  ORDER_ADD_ITEM: 2,
  ORDER_UPDATE_ITEM_QTY: 2,
  ORDER_REMOVE_ITEM: 2,
  ORDER_CANCEL: 3,
  ORDER_CLOSE: 3,
};

const DEFAULT_PRIORITY = 5;

/** Types that are considered critical and allowed even when queue is near capacity. */
const CRITICAL_TYPES = new Set<string>(['ORDER_PAY', 'ORDER_CREATE']);

// ─── Retry ───────────────────────────────────────────────────────────────────

const MIN_RETRY_MS = 1000;
const MAX_RETRY_MS = 60_000;

function calculateRetryDelay(attempts: number): number {
  const exponential = MIN_RETRY_MS * Math.pow(2, attempts);
  const capped = Math.min(exponential, MAX_RETRY_MS);
  // Jitter: +/- 10%
  const jitter = capped * 0.1 * (Math.random() * 2 - 1);
  return Math.floor(capped + jitter);
}

// ─── Service ─────────────────────────────────────────────────────────────────

class OfflineQueueManagerClass {
  /**
   * Get the priority for a queue item type.
   */
  getPriority(type: string): number {
    return PRIORITY_MAP[type] ?? DEFAULT_PRIORITY;
  }

  /**
   * Enqueue an item with capacity checks.
   * Throws if queue is full and item is not critical.
   */
  async enqueue(item: OfflineQueueItem): Promise<void> {
    const health = await this.getQueueHealth();

    // Hard limit: reject everything at max
    if (health.total >= MAX_QUEUE_SIZE) {
      Logger.error(
        `[OfflineQueueManager] Queue FULL (${health.total}/${MAX_QUEUE_SIZE}). Rejecting item ${item.id} (${item.type}).`,
      );
      throw new Error(
        `QUEUE_FULL: Offline queue has reached maximum capacity (${MAX_QUEUE_SIZE}). ` +
          'Please check your network connection.',
      );
    }

    // Soft block: non-critical items blocked at 800+
    if (health.total >= BLOCK_NON_CRITICAL_SIZE && !CRITICAL_TYPES.has(item.type)) {
      Logger.warn(
        `[OfflineQueueManager] Queue near capacity (${health.total}/${MAX_QUEUE_SIZE}). ` +
          `Blocking non-critical item ${item.id} (${item.type}).`,
      );
      throw new Error(
        `QUEUE_NEAR_FULL: Only critical operations (payments, orders) are accepted. ` +
          `Queue: ${health.total}/${MAX_QUEUE_SIZE}.`,
      );
    }

    // Warning threshold
    if (health.total >= WARN_QUEUE_SIZE) {
      Logger.warn(
        `[OfflineQueueManager] Queue warning threshold (${health.total}/${MAX_QUEUE_SIZE}).`,
      );
    }

    await IndexedDBQueue.put(item);
    Logger.info(
      `[OfflineQueueManager] Enqueued ${item.type} (${item.id}), ` +
        `priority=${this.getPriority(item.type)}, queue_size=${health.total + 1}`,
    );
  }

  /**
   * Get pending items sorted by priority, then by creation time (FIFO within same priority).
   */
  async getPendingByPriority(): Promise<OfflineQueueItem[]> {
    const all = await IndexedDBQueue.getAll();
    const now = Date.now();

    return all
      .filter(
        (item) =>
          (item.status === 'queued' || item.status === 'failed') &&
          (!item.nextRetryAt || item.nextRetryAt <= now),
      )
      .sort((a, b) => {
        const priorityDiff = this.getPriority(a.type) - this.getPriority(b.type);
        if (priorityDiff !== 0) return priorityDiff;
        return a.createdAt - b.createdAt;
      });
  }

  /**
   * Drain the queue: get up to `batchSize` items in priority order.
   */
  async drainQueue(batchSize: number = 10): Promise<OfflineQueueItem[]> {
    const pending = await this.getPendingByPriority();
    return pending.slice(0, batchSize);
  }

  /**
   * Move an item to the dead letter queue after max retries.
   */
  async moveToDeadLetter(itemId: string, error: string): Promise<void> {
    await IndexedDBQueue.updateStatus(itemId, 'dead_letter', error);
    Logger.error(
      `[OfflineQueueManager] Item ${itemId} moved to dead letter queue: ${error}`,
    );
  }

  /**
   * Handle a failed item: increment retries, schedule next attempt, or dead-letter.
   */
  async handleFailure(itemId: string, error: string, currentAttempts: number): Promise<void> {
    const nextAttempts = currentAttempts + 1;

    if (nextAttempts >= MAX_RETRIES) {
      await this.moveToDeadLetter(
        itemId,
        `Max retries (${MAX_RETRIES}) exceeded. Last error: ${error}`,
      );
      return;
    }

    const delay = calculateRetryDelay(currentAttempts);
    const nextRetryAt = Date.now() + delay;

    await IndexedDBQueue.updateStatus(itemId, 'failed', error, nextRetryAt);

    Logger.warn(
      `[OfflineQueueManager] Item ${itemId} failed (attempt ${nextAttempts}/${MAX_RETRIES}). ` +
        `Retrying in ${Math.round(delay / 1000)}s`,
    );
  }

  /**
   * Get all items in the dead letter queue.
   */
  async getDeadLetterItems(): Promise<DeadLetterItem[]> {
    const all = await IndexedDBQueue.getAll();
    return all.filter(
      (item): item is DeadLetterItem => item.status === 'dead_letter',
    );
  }

  /**
   * Retry a specific dead letter item: reset its status and attempts.
   */
  async retryDeadLetterItem(itemId: string): Promise<void> {
    const all = await IndexedDBQueue.getAll();
    const item = all.find((i) => i.id === itemId && i.status === 'dead_letter');

    if (!item) {
      throw new Error(`Dead letter item ${itemId} not found`);
    }

    // Reset to queued with zero attempts
    const reset: OfflineQueueItem = {
      ...item,
      status: 'queued',
      attempts: 0,
      error: undefined,
      lastError: undefined,
      nextRetryAt: undefined,
    };

    await IndexedDBQueue.put(reset);
    Logger.info(
      `[OfflineQueueManager] Dead letter item ${itemId} reset for retry`,
    );
  }

  /**
   * Discard a dead letter item with an audit reason.
   */
  async discardDeadLetterItem(itemId: string, reason: string): Promise<void> {
    const all = await IndexedDBQueue.getAll();
    const item = all.find((i) => i.id === itemId && i.status === 'dead_letter');

    if (!item) {
      throw new Error(`Dead letter item ${itemId} not found`);
    }

    Logger.warn(
      `[OfflineQueueManager] DISCARDING dead letter item ${itemId} (${item.type}). ` +
        `Reason: ${reason}. Payload: ${JSON.stringify(item.payload)}`,
    );

    await IndexedDBQueue.remove(itemId);
  }

  /**
   * Get comprehensive queue health metrics.
   */
  async getQueueHealth(): Promise<QueueHealth> {
    const all = await IndexedDBQueue.getAll();
    const now = Date.now();

    const counts = {
      total: all.length,
      pending: 0,
      syncing: 0,
      failed: 0,
      deadLetter: 0,
      applied: 0,
    };

    let oldestPendingCreatedAt = now;

    for (const item of all) {
      switch (item.status) {
        case 'queued':
          counts.pending++;
          if (item.createdAt < oldestPendingCreatedAt) {
            oldestPendingCreatedAt = item.createdAt;
          }
          break;
        case 'syncing':
          counts.syncing++;
          break;
        case 'failed':
          counts.failed++;
          if (item.createdAt < oldestPendingCreatedAt) {
            oldestPendingCreatedAt = item.createdAt;
          }
          break;
        case 'dead_letter':
          counts.deadLetter++;
          break;
        case 'applied':
          counts.applied++;
          break;
      }
    }

    const activeCount = counts.pending + counts.failed + counts.syncing;
    const oldestItemAge = activeCount > 0 ? now - oldestPendingCreatedAt : 0;

    let capacityWarning: QueueHealth['capacityWarning'] = 'none';
    if (counts.total >= MAX_QUEUE_SIZE) {
      capacityWarning = 'blocked';
    } else if (counts.total >= BLOCK_NON_CRITICAL_SIZE) {
      capacityWarning = 'critical';
    } else if (counts.total >= WARN_QUEUE_SIZE) {
      capacityWarning = 'warn';
    }

    return {
      ...counts,
      oldestItemAge,
      capacityWarning,
    };
  }

  /**
   * Purge all applied items older than the given age (ms).
   * Default: 1 hour. Keeps the queue lean.
   */
  async purgeApplied(maxAgeMs: number = 60 * 60 * 1000): Promise<number> {
    const all = await IndexedDBQueue.getAll();
    const cutoff = Date.now() - maxAgeMs;
    let removed = 0;

    for (const item of all) {
      if (item.status === 'applied' && (item.appliedAt ?? item.createdAt) < cutoff) {
        await IndexedDBQueue.remove(item.id);
        removed++;
      }
    }

    if (removed > 0) {
      Logger.info(`[OfflineQueueManager] Purged ${removed} applied items`);
    }
    return removed;
  }
}

export const OfflineQueueManager = new OfflineQueueManagerClass();
