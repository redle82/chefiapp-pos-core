import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyncEngine } from './SyncEngine';
import { IndexedDBQueue } from './IndexedDBQueue';
import { ConflictResolver } from './ConflictResolver';
import { supabase } from '../supabase';

// Mocks
vi.mock('../supabase', () => ({
    supabase: {
        rpc: vi.fn(),
        from: vi.fn()
    }
}));
vi.mock('./IndexedDBQueue');
vi.mock('./ConflictResolver');
vi.mock('../governance/DbWriteGate', () => ({
    DbWriteGate: {
        insert: vi.fn(),
        update: vi.fn()
    }
}));

vi.mock('../tpv/PaymentEngine', () => ({
    PaymentEngine: {
        processPayment: vi.fn(),
        processSplitPayment: vi.fn()
    }
}));

import { PaymentEngine } from '../tpv/PaymentEngine';

describe('Offline Stress Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset SyncEngine state if possible, or mock internal state?
        // SyncEngine is a singleton, so state persists. 
        // We can manipulate it via events.
    });

    it('should process a backlog of offline actions when network recovers', async () => {
        // 1. Simulate Offline
        const offlineEvent = new Event('offline');
        window.dispatchEvent(offlineEvent);

        // 2. Mock Queue having 5 items
        const mockItems = Array.from({ length: 5 }).map((_, i) => ({
            id: `item-${i}`,
            type: 'ORDER_UPDATE',
            payload: { orderId: '123', action: 'add_item', items: [], restaurantId: 'res-1' },
            createdAt: Date.now() - 1000 * (5 - i), // sequential timestamps
            attempts: 0,
            status: 'queued'
        }));

        (IndexedDBQueue.getPending as any).mockResolvedValue(mockItems);
        (ConflictResolver.shouldApplyUpdate as any).mockResolvedValue(true);

        // 3. Go Online
        const onlineEvent = new Event('online');
        window.dispatchEvent(onlineEvent);

        // Wait for processing (SyncEngine is async)
        // We can't await SyncEngine.processQueue directly easily as it is triggered by event.
        // But we can call it manually to ensure test waits.
        await SyncEngine.processQueue();

        // 4. Verify all items processed
        expect(IndexedDBQueue.getPending).toHaveBeenCalled();
        expect(ConflictResolver.shouldApplyUpdate).toHaveBeenCalledTimes(5);
        // Expect updateStatus to accept 'applied' for each
        expect(IndexedDBQueue.updateStatus).toHaveBeenCalledWith(expect.stringMatching(/item-\d/), 'applied');
    });

    it('should handle conflict by dropping stale item', async () => {
        // Mock Queue with 1 stale item
        const mockItem = {
            id: 'stale-item',
            type: 'ORDER_UPDATE',
            payload: { orderId: '123', action: 'update', restaurantId: 'res-1' },
            createdAt: 1000,
            attempts: 0,
            status: 'queued'
        };

        (IndexedDBQueue.getPending as any).mockResolvedValue([mockItem]);
        // Conflict Resolver says FALSE (stale)
        (ConflictResolver.shouldApplyUpdate as any).mockResolvedValue(false);

        await SyncEngine.processQueue();

        // Should check conflict
        expect(ConflictResolver.shouldApplyUpdate).toHaveBeenCalledWith('gm_orders', '123', 1000);

        // Should NOT mark as applied? 
        // Actually, logic says: "If !shouldApply, return."
        // But SyncEngine.processItem calls dispatch. 
        // If dispatch returns (void), processItem proceeds to `updateStatus(..., 'applied')`.
        // This means "Dropping" counts as "Processed successfully" (we don't want to retry stale items forever).

        expect(IndexedDBQueue.updateStatus).toHaveBeenCalledWith('stale-item', 'applied');
    });
    it('should process ORDER_PAY correctly', async () => {
        const mockPayItem = {
            id: 'pay-item',
            type: 'ORDER_PAY',
            payload: {
                orderId: 'order-1',
                restaurantId: 'res-1',
                amountCents: 1000,
                method: 'cash',
                cashRegisterId: 'reg-1',
                isPartial: false
            },
            createdAt: Date.now(),
            attempts: 0,
            status: 'queued'
        };

        (IndexedDBQueue.getPending as any).mockResolvedValue([mockPayItem]);
        (PaymentEngine.processPayment as any).mockResolvedValue({ id: 'pay-1', success: true });

        await SyncEngine.processQueue();

        expect(PaymentEngine.processPayment).toHaveBeenCalledWith(expect.objectContaining({
            orderId: 'order-1',
            amountCents: 1000,
            cashRegisterId: 'reg-1'
        }));

        expect(IndexedDBQueue.updateStatus).toHaveBeenCalledWith('pay-item', 'applied');
    });

    it('should move item to dead_letter if MAX_RETRIES exceeded', async () => {
        const deadItem = {
            id: 'dead-1',
            type: 'ORDER_CREATE',
            payload: { items: [{ id: 'p1' }] },
            createdAt: Date.now(),
            attempts: 10,
            status: 'queued'
        };

        (IndexedDBQueue.getPending as any).mockResolvedValue([deadItem]);
        (supabase.rpc as any).mockRejectedValue(new Error('Persistent Error'));

        await SyncEngine.processQueue();

        expect(IndexedDBQueue.updateStatus).toHaveBeenCalledWith(
            'dead-1',
            'dead_letter',
            expect.stringContaining('Persistent Error')
        );
    });
});
