import { useCallback } from 'react';
import { OfflineDB } from './db';
import { type OfflineQueueItem } from './types';
import { Logger } from '../logger';

export function useOfflineQueue() {
    const enqueue = useCallback(async (item: OfflineQueueItem) => {
        try {
            await OfflineDB.put(item);
            Logger.info('Queued offline item', { id: item.id, type: item.type });
        } catch (e) {
            Logger.error('Failed to enqueue item', e);
            throw e;
        }
    }, []);

    return { enqueue };
}
