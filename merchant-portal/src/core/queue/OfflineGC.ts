/**
 * Offline Garbage Collection
 * 
 * Cleans up processed items from IndexedDB efficiently.
 */
import { OfflineDB } from './db';
import { Logger } from '../logger';

const GC_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_QUEUE_SIZE = 1000;

export async function cleanupProcessedItems(): Promise<number> {
    const items = await OfflineDB.getAll();
    const now = Date.now();

    // 1. Clean old applied items
    const oldAppliedItems = items.filter(i => {
        if (i.status !== 'applied') return false;
        if (!i.appliedAt) return false;

        const age = now - i.appliedAt;
        return age > GC_TTL_MS;
    });

    let cleaned = 0;
    for (const item of oldAppliedItems) {
        try {
            await OfflineDB.remove(item.id);
            cleaned++;
        } catch (err) {
            Logger.warn(`Failed to remove item ${item.id}`, err);
        }
    }

    // 2. Enforce Size Limit
    const remainingItems = await OfflineDB.getAll();

    if (remainingItems.length > MAX_QUEUE_SIZE) {
        const priority = (status: string) => {
            if (status === 'failed') return 0;
            if (status === 'queued') return 1;
            if (status === 'syncing') return 2;
            return 3; // applied (lowest priority to keep)
        };

        const sorted = remainingItems.sort((a, b) => {
            const priorityDiff = priority(a.status) - priority(b.status);
            if (priorityDiff !== 0) return priorityDiff;
            return a.createdAt - b.createdAt;
        });

        const toRemove = sorted.slice(MAX_QUEUE_SIZE);
        for (const item of toRemove) {
            try {
                await OfflineDB.remove(item.id);
                cleaned++;
                Logger.warn(`Removed item ${item.id} to enforce limit`);
            } catch (err) {
                Logger.warn(`Failed to remove item ${item.id}`, err);
            }
        }
    }

    if (cleaned > 0) {
        Logger.info(`Garbage collection cleaned ${cleaned} items`);
    }

    return cleaned;
}

export function startGarbageCollection(): () => void {
    cleanupProcessedItems().catch(err => {
        Logger.error('Initial GC failed', err);
    });

    const interval = setInterval(() => {
        cleanupProcessedItems().catch(err => {
            Logger.error('Periodic GC failed', err);
        });
    }, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
}
