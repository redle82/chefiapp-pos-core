// import type { EventEnvelope } from '../events/SealTypes';
import type { Order } from '../../pages/TPV/context/OrderContext';
export type ReplayEvent = {
    type: 'ORDER_CREATE' | 'ORDER_UPDATE' | 'ORDER_CLOSE';
    payload: any;
    createdAt: number;
    status: 'queued' | 'syncing' | 'failed' | 'applied';
};

export const computeOrderState = (
    baseOrders: Order[],
    events: ReplayEvent[]
): Order[] => {
    // 1. Deep clone to avoid mutation
    // In a high-perf scenario, use Immer. For now, JSON clone is safe enough for <100 orders.
    const nextState = JSON.parse(JSON.stringify(baseOrders)) as Order[];

    // 2. Sort events chronologically
    const sortedEvents = [...events].sort((a, b) => a.createdAt - b.createdAt);

    for (const event of sortedEvents) {
        const payload = event.payload;

        try {
            // REPLAY: CREATE
            if (event.type === 'ORDER_CREATE') {
                if (!payload || !payload.id) continue; // Skip malformed

                // Idempotency Check
                if (!nextState.find(o => o.id === payload.id)) {
                    const newOrder: Order = {
                        id: payload.id,
                        tableNumber: payload.tableNumber || 99,
                        status: 'new',
                        items: payload.items || [],
                        total: payload.total || 0,
                        createdAt: new Date(event.createdAt),
                        updatedAt: new Date(event.createdAt),
                        isWebOrder: true,
                        origin: 'web',
                        customerName: payload.customerName || 'Cliente Web'
                    };
                    nextState.push(newOrder);
                }
            }

            // REPLAY: UPDATE
            if (event.type === 'ORDER_UPDATE') {
                if (!payload || !payload.orderId) continue;

                const target = nextState.find(o => o.id === payload.orderId);
                if (target) {
                    let newStatus = target.status;
                    // Strict Action Mapping
                    // Case-insensitive check to fix "Send" vs "send" risk
                    const action = (payload.action || '').toLowerCase();

                    if (['send', 'preparing'].includes(action)) newStatus = 'preparing';
                    else if (['ready', 'done'].includes(action)) newStatus = 'ready';
                    else if (['close', 'served'].includes(action)) newStatus = 'served';
                    else if (['pay', 'paid'].includes(action)) newStatus = 'paid';

                    target.status = newStatus;
                    target.updatedAt = new Date(event.createdAt);
                }
            }

            // REPLAY: CLOSE
            if (event.type === 'ORDER_CLOSE') {
                if (!payload || !payload.orderId) continue;

                const target = nextState.find(o => o.id === payload.orderId);
                if (target) {
                    target.status = 'paid';
                    target.updatedAt = new Date(event.createdAt);
                }
            }
        } catch (err) {
            console.error(`[ReplayEngine] Failed to replay event ${event.type}`, err);
            // Continue replay, do not crash app
        }
    }

    return nextState;
};
