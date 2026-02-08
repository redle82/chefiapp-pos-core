import type { EventEnvelope } from './SealTypes';
import type { Order } from '../contracts';
import type { InventoryItem } from '../inventory/InventoryTypes';
import { calculateOrderConsumption } from '../inventory/RecipeMapping';

// 🏛️ THE SYSTEM STATE
// This is the "Juridical Reality" derived from the Event Log.
export interface SystemState {
    orders: Order[];
    inventory: Record<string, InventoryItem>;
}

export const INITIAL_STATE: SystemState = {
    orders: [],
    inventory: {}
};

// 🏛️ THE EXECUTOR
// "Events are facts. State is a deduction."

export const CoreExecutor = {

    // TPV_CORE_V1_FROZEN
    reduce(state: SystemState, event: EventEnvelope): SystemState {
        // 🔒 CORE HARDENING: MUTATION FIX (Phase 3.1)
        // Use structuredClone to guarantee deep immutability.
        // This prevents "Reference Leak" where modifying nextState accidentally mutates logic history.
        const nextState: SystemState = structuredClone(state);

        const payload = event.payload;

        // 🔒 CORE HARDENING: OPTIMISTIC CONCURRENCY (Phase 3.2)
        // If an event declares a stream_version, it MUST implicitly follow the known state.
        // NOTE: This usually requires 'state' to track a version. 
        // Since 'SystemState' currently doesn't track version, we are injecting this logic
        // but it will only be fully effective when SystemState adopts a '_version' field.
        // For now, we respect the 'stream_version' if it exists on the event as a safeguard.
        if (event.stream_version && (event.stream_version < 0)) {
            // Placeholder for future strict check:
            // if (event.stream_version !== state._version + 1) throw new Error('Concurrency Conflict');
            console.warn(`[CoreExecutor] Stream Version ${event.stream_version} observed but strict check pending State Schema migration.`);
        }

        switch (event.type) {
            case 'ORDER_CREATED': {
                if (nextState.orders.find(o => o.id === payload.id)) return state;

                const newOrder: Order = {
                    id: payload.id,
                    tableNumber: payload.tableNumber || 99,
                    status: 'new',
                    items: payload.items || [],
                    total: payload.totalCents || payload.total || 0,
                    createdAt: new Date(event.meta.timestamp),
                    updatedAt: new Date(event.meta.timestamp),
                    isWebOrder: true,
                    origin: 'web',
                    customerName: payload.customerName || 'Cliente'
                };
                nextState.orders.push(newOrder);

                // Metabolic Loop
                const consumption = calculateOrderConsumption(payload.items || []);
                consumption.forEach((qty, itemId) => {
                    const item = nextState.inventory[itemId];
                    if (item) {
                        nextState.inventory[itemId] = { ...item, currentStock: item.currentStock - qty, lastUpdated: new Date(event.meta.timestamp) };
                    }
                });
                break;
            }

            case 'ORDER_UPDATED': {
                const targetIndex = nextState.orders.findIndex(o => o.id === payload.orderId);
                if (targetIndex === -1) return state;

                const target = nextState.orders[targetIndex]; // Direct ref is safe now because nextState is a Deep Clone

                // IMMUTABILITY GUARD
                if (target.status === 'cancelled') break;
                if (target.status === 'paid') break; // Paid orders shouldn't regress via simple update

                const action = (payload.action || '').toLowerCase();

                if (['send', 'preparing'].includes(action)) target.status = 'preparing';
                else if (['ready', 'done'].includes(action)) target.status = 'ready';
                else if (['close', 'served'].includes(action)) target.status = 'served';
                else if (['pay', 'paid'].includes(action)) target.status = 'paid';
                else if (['cancel', 'void'].includes(action)) target.status = 'cancelled';

                target.updatedAt = new Date(event.meta.timestamp);
                // nextState.orders[targetIndex] = target; // Not needed, target is a reference to inside nextState
                break;
            }

            case 'ORDER_PAID': {
                const targetIndex = nextState.orders.findIndex(o => o.id === payload.orderId);
                if (targetIndex !== -1) {
                    const current = nextState.orders[targetIndex];
                    // IMMUTABILITY GUARD: Dead orders stay dead
                    if (current.status === 'cancelled') break;

                    current.status = 'paid';
                    current.updatedAt = new Date(event.meta.timestamp);
                }
                break;
            }

            case 'ORDER_COMPLETED': {
                const targetIndex = nextState.orders.findIndex(o => o.id === payload.orderId);
                if (targetIndex !== -1) {
                    const current = nextState.orders[targetIndex];
                    // IMMUTABILITY GUARD: Dead orders stay dead
                    if (current.status === 'cancelled') break;

                    current.status = 'served';
                    current.updatedAt = new Date(event.meta.timestamp);
                }
                break;
            }

            // 📦 INVENTORY EVENTS

            case 'INVENTORY_CONSUMED': {
                // Explicit consumption (e.g. spillage, manual adjustment)
                const { itemId, quantity } = payload;
                const item = nextState.inventory[itemId];
                if (item) {
                    item.currentStock -= quantity;
                    item.lastUpdated = new Date(event.meta.timestamp);
                }
                break;
            }

            case 'INVENTORY_RESTOCKED': {
                const { itemId, quantity } = payload;
                const item = nextState.inventory[itemId];
                if (item) {
                    item.currentStock += quantity;
                    item.lastUpdated = new Date(event.meta.timestamp);
                }
                break;
            }

            case 'INVENTORY_ADJUSTED': {
                // Absolute set or delta? Assume payload has 'newLevel' or 'delta'
                // For safety, let's assume 'newLevel' for an audit/count event.
                const { itemId, newLevel } = payload;
                const item = nextState.inventory[itemId];
                if (item) {
                    item.currentStock = newLevel;
                    item.lastUpdated = new Date(event.meta.timestamp);
                }
                break;
            }
        }

        return nextState;
    },

    // Batch Processing
    reduceAll(events: EventEnvelope[], initialState = INITIAL_STATE): SystemState {
        // Sort by Causation/Time
        const sorted = [...events].sort((a, b) => a.meta.timestamp - b.meta.timestamp);
        return sorted.reduce((state, event) => this.reduce(state, event), initialState);
    }
};
