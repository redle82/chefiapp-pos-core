import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { GlobalEventStore } from '../../../core/events/EventStore';
import { IndexedDBQueue } from '../../../core/sync/IndexedDBQueue';
import { SyncEngine } from '../../../core/sync/SyncEngine';
import type { OfflineQueueItem } from '../../../core/sync/types';
// import type { EventEnvelope } from '../../../core/events/SystemEvents';
import type { EventEnvelope } from '../../../core/events/SystemEvents';
import { DbWriteGate } from '../../../core/governance/DbWriteGate';
import { isDevStableMode } from '../../../core/runtime/devStableMode';
import { getTabIsolated } from '../../../core/storage/TabIsolatedStorage';
import { supabase } from '../../../core/supabase';
import { tpvEventBus, type DecisionMadePayload, type OrderExceptionPayload } from '../../../core/tpv/TPVCentralEvents';

// --- Types (SAFE IMPORT) ---
import type { Order, OrderItem } from './OrderTypes';
export type { Order, OrderItem };

// --- Currency Helpers (New Contract) ---
const toCents = (amount: number): number => Math.round(amount * 100);
const fromCents = (cents: number): number => (cents || 0) / 100;

interface OrderContextType {
    orders: Order[];
    addOrder: (order: Order) => void;
    updateOrderStatus: (orderId: string, status: Order['status']) => void;
    createOrder: (order: Partial<Order>) => Promise<Order>;
    addItemToOrder: (orderId: string, item: any) => Promise<void>;
    removeItemFromOrder: (orderId: string, itemId: string) => Promise<void>;
    updateItemQuantity: (orderId: string, itemId: string, quantity: number) => Promise<void>;
    performOrderAction: (orderId: string, action: string, payload?: any) => Promise<void>;
    resetOrders: () => void;
    pendingExceptions: (OrderExceptionPayload & { eventId: string })[];

    // Extended Context Interface
    loading: boolean;
    isConnected: boolean;
    isOffline: boolean;
    realtimeStatus: string;
    lastRealtimeEvent: Date | null;
    syncNow: () => Promise<void>;

    attachCustomer: (orderId: string, customerId: string) => Promise<void>;
    getActiveOrders: () => Promise<void>;
    openCashRegister: (balance: number) => Promise<void>;
    closeCashRegister: (balance: number) => Promise<void>;
    getOpenCashRegister: () => Promise<any | null>; // Using any to avoid circular dependency with CashRegisterType for now
    getDailyTotal: () => Promise<number>;
}

export const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [pendingExceptions, setPendingExceptions] = useState<(OrderExceptionPayload & { eventId: string })[]>([]);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [isDemo, setIsDemo] = useState(false);

    // Enqueue Helper (Inlined from useOfflineQueue)
    const enqueue = useCallback(async (item: OfflineQueueItem) => {
        try {
            await IndexedDBQueue.put(item);
            console.log('Queued offline item', { id: item.id, type: item.type });
            // Trigger background sync
            SyncEngine.processQueue().catch(err => {
                console.debug('[OrderContext] Background sync trigger failed', err);
            });
        } catch (e) {
            console.error('Failed to enqueue item', e);
            throw e;
        }
    }, []);

    // Safety: Idempotency keys persistent per session
    const idempotencyKeys = useRef<Map<string, string>>(new Map());

    // Initial Load Logic
    useEffect(() => {
        const stored = getTabIsolated('chefiapp_restaurant_id');
        if (stored) setRestaurantId(stored);

        const demoMode = getTabIsolated('chefiapp_demo_mode') === 'true';
        setIsDemo(demoMode);
    }, []);

    // Helper Implementations
    const addOrder = (order: Order) => {
        setOrders(prev => [...prev, order]);
    };

    const updateOrderStatus = (orderId: string, status: Order['status']) => {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    };

    // 4. NERVOUS SYSTEM CONNECTIVITY (Safe Realtime)
    const fetchOrders = useCallback(async () => {
        if (!restaurantId || isDemo) return;

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const { data: initialOrders, error } = await supabase
            .from('gm_orders')
            .select(`
                id, table_number, status, total_amount, created_at,
                items:gm_order_items(id, name:name_snapshot, price:price_snapshot, quantity)
            `) // NOTE: 'quantity' is correct now
            .eq('restaurant_id', restaurantId)
            .gte('created_at', startOfDay.toISOString());

        if (error) {
            console.error('[OrderContext] Fetch failed:', error);
            return;
        }

        if (initialOrders) {
            const mappedOrders: Order[] = initialOrders.map(io => ({
                id: io.id,
                status: (io.status === 'IN_PREP' || io.status === 'in_prep') ? 'preparing' :
                    (io.status === 'COMPLETED' || io.status === 'completed') ? 'served' :
                        (io.status === 'PAID' || io.status === 'paid') ? 'paid' :
                            (io.status === 'CANCELLED' || io.status === 'cancelled') ? 'cancelled' : 'new',
                total: fromCents(io.total_amount || 0),
                tableNumber: io.table_number,
                createdAt: new Date(io.created_at),
                updatedAt: new Date(io.created_at), // Default to createdAt if missing
                items: io.items.map((i: any) => ({
                    id: i.id,
                    name: i.name,
                    price: fromCents(i.price),
                    quantity: i.quantity // Mapped correctly
                }))
            }));
            setOrders(mappedOrders);
        }
    }, [restaurantId, isDemo]);

    useEffect(() => {
        if (!restaurantId || isDemo) return;

        // STEP 6: DEV_STABLE_MODE - one-shot load only, no realtime
        if (isDevStableMode()) {
            fetchOrders();
            return;
        }

        // Initial Fetch
        fetchOrders();

        // Realtime Synapse (No Recursion loop)
        // CRITICAL: fetchOrders is already stable (useCallback), but use ref to be extra safe
        const fetchOrdersRef = fetchOrders;
        const channel = supabase.channel('nervous_system_orders')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'gm_orders',
                filter: `restaurant_id=eq.${restaurantId}`
            }, (payload) => {
                // Just refetch, SAFE now (fetchOrders is stable via useCallback)
                fetchOrdersRef();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [restaurantId, isDemo, fetchOrders]); // fetchOrders is stable (useCallback)

    const resetOrders = () => {
        setOrders([]);
        setPendingExceptions([]);
    };

    // --- Exception Persistence (Verification & Robustness) ---
    useEffect(() => {
        // Listen for new exceptions
        const unsubscribeException = tpvEventBus.on<OrderExceptionPayload>('order.exception', (event) => {
            console.log('[OrderContext] Caught Exception:', event.payload);
            setPendingExceptions(prev => {
                // Check if already exists by eventId or orderId+type
                if (prev.some(e => e.eventId === event.id)) return prev;
                return [...prev, { ...event.payload, eventId: event.id }];
            });
        });

        // Listen for decisions to clear exceptions
        const unsubscribeDecision = tpvEventBus.on<DecisionMadePayload>('order.decision_made', (event) => {
            console.log('[OrderContext] Caught Decision:', event.payload);
            setPendingExceptions(prev => prev.filter(e =>
                // Remove exception if it matches the decision's orderId (and maybe type/item?)
                // For now, assume decision resolves the pending exception for that order
                e.orderId !== event.payload.orderId
            ));
        });

        return () => {
            unsubscribeException();
            unsubscribeDecision();
        };
    }, []);

    const createOrder = async (orderInput: Partial<Order>) => {
        // Safe casting with defaults
        const order: Order = {
            id: orderInput.id || crypto.randomUUID(),
            status: orderInput.status || 'new',
            total: orderInput.total || 0,
            items: orderInput.items || [],
            createdAt: orderInput.createdAt || new Date(),
            updatedAt: new Date(),
            tableNumber: orderInput.tableNumber,
            tableId: orderInput.tableId
        };

        // 1. Optimistic Local Update
        setOrders(prev => [...prev, order]);

        const rId = restaurantId || getTabIsolated('chefiapp_restaurant_id');
        const demo = isDemo || getTabIsolated('chefiapp_demo_mode') === 'true';

        // 3. Sovereign Sync
        if (rId && !demo) {
            try {
                // A. Header (gm_orders)
                const { error: headerError } = await DbWriteGate.insert(
                    'OrderContext',
                    'gm_orders',
                    {
                        id: order.id,
                        restaurant_id: rId,
                        table_number: typeof order.tableNumber === 'number' ? order.tableNumber : 0,
                        status: 'preparing',
                        total_cents: toCents(order.total),
                        source: 'tpv'
                    },
                    { tenantId: rId }
                );

                if (headerError) {
                    // T3: Handle "one open order per table" constraint violation
                    if (headerError.code === '23505' && headerError.message?.includes('idx_one_open_order_per_table')) {
                        // Rollback optimistic update
                        setOrders(prev => prev.filter(o => o.id !== order.id));
                        throw new Error('Já existe um pedido ativo para esta mesa. Feche ou pague o pedido existente primeiro.');
                    }
                    throw headerError;
                }

                // B. Items (gm_order_items)
                if (order.items && order.items.length > 0) {
                    const dbItems = order.items.map(item => ({
                        order_id: order.id,
                        product_id: item.id && item.id.length > 10 ? item.id : null,
                        name_snapshot: item.name,
                        price_snapshot: toCents(item.price),
                        quantity: item.quantity, // CORRECT COLUMN: quantity
                        subtotal_cents: toCents(item.price * item.quantity) // REQUIRED FOR TRIGGER
                    }));

                    const { error: itemsError } = await DbWriteGate.insert(
                        'OrderContext',
                        'gm_order_items',
                        dbItems,
                        { tenantId: rId }
                    );
                    if (itemsError) throw itemsError;
                }

                console.log('[Sovereign] Order Created:', order.id);

            } catch (err: any) {
                console.error('[Sovereign] Create Failed, Queueing:', err);
                await enqueue({
                    id: order.id,
                    type: 'ORDER_CREATE',
                    payload: order,
                    createdAt: Date.now(),
                    attempts: 0,
                    status: 'queued'
                });
            }
        }
        return order;
    };

    const performOrderAction = async (orderId: string, action: string, payload?: any) => {
        // Handle add_item action locally first (optimistic update)
        if (action === 'add_item' && payload?.items && payload?.total !== undefined) {
            setOrders(prev => prev.map(o => {
                if (o.id !== orderId) return o;
                return {
                    ...o,
                    items: payload.items,
                    total: payload.total,
                    updatedAt: new Date()
                };
            }));
        }

        // Optimistic Cancel
        if (action === 'cancel') {
            setOrders(prev => prev.filter(o => o.id !== orderId)); // Or move to cancelled list logic
        }

        const eventTypeMapping: Record<string, string> = {
            'pay': 'ORDER_PAID',
            'close': 'ORDER_COMPLETED',
            'serve': 'ORDER_COMPLETED',
            'add_item': 'ORDER_UPDATED',
            'cancel': 'ORDER_CANCELLED',
            'send': 'ORDER_UPDATED',
            'ready': 'ORDER_UPDATED'
        };

        const event: EventEnvelope = {
            eventId: crypto.randomUUID(),
            type: eventTypeMapping[action] || 'ORDER_UPDATED',
            payload: { orderId, action, ...payload },
            meta: { timestamp: Date.now(), actorId: 'user', sessionId: 'session_1', version: 1 }
        };

        // Note: GlobalEventStore logic kept as is for local reduces
        await GlobalEventStore.append(event);

        const rId = restaurantId || getTabIsolated('chefiapp_restaurant_id');
        const demo = isDemo || getTabIsolated('chefiapp_demo_mode') === 'true';

        if (rId && !demo) {
            try {
                // SOVEREIGN TPV LOGIC: 'pay' creates a Payment Record via Secure RPC
                if (action === 'pay') {
                    // Refetch latest order state from server (Single Source of Truth) or allow optimistically
                    // We'll trust local state for amount, but RPC validates it.
                    const currentOrder = orders.find(o => o.id === orderId);
                    if (!currentOrder) throw new Error("Order not found");

                    const amountCents = toCents(currentOrder.total);

                    // IDEMPOTENCY KEY: Enforce exactly-once processing per session attempt
                    let key = idempotencyKeys.current.get(orderId);
                    if (!key) {
                        key = `${orderId}_${Date.now()}_root`;
                        idempotencyKeys.current.set(orderId, key);
                    }

                    const { data: payResult, error: payError } = await supabase.rpc('process_order_payment', {
                        p_order_id: orderId,
                        p_restaurant_id: rId,
                        p_method: payload?.method || 'cash',
                        p_amount_cents: amountCents,
                        p_operator_id: (await supabase.auth.getUser()).data.user?.id || null,
                        p_idempotency_key: key
                    });

                    if (payError) {
                        console.error('[Payment] RPC Failed:', payError);
                        // If error is not "already processed", maybe clear key to allow retry?
                        // For now, keep key safe.
                        throw payError;
                    }

                    console.log('[Payment] Secure Receipt:', payResult);
                    // Success! Remove key so future payments (if re-opened) get new key
                    idempotencyKeys.current.delete(orderId);
                    return;
                }

                if (action === 'add_item' && payload?.items) {
                    const newTotalCents = toCents(payload.total);

                    await DbWriteGate.update(
                        'OrderContext',
                        'gm_orders',
                        {
                            total_cents: newTotalCents,
                            updated_at: new Date().toISOString()
                        },
                        { id: orderId, restaurant_id: rId },
                        { tenantId: rId }
                    );

                    await DbWriteGate.delete(
                        'OrderContext',
                        'gm_order_items',
                        { order_id: orderId },
                        { tenantId: rId }
                    );

                    if (payload.items.length > 0) {
                        const dbItems = payload.items.map((item: any) => ({
                            order_id: orderId,
                            product_id: item.id && item.id.length > 10 ? item.id : null,
                            name_snapshot: item.name,
                            price_snapshot: toCents(item.price),
                            quantity: item.quantity,
                            subtotal_cents: toCents(item.price * item.quantity) // REQUIRED FOR TRIGGER
                        }));

                        await DbWriteGate.insert('OrderContext', 'gm_order_items', dbItems, { tenantId: rId });
                    }
                    return;
                }

                // LEGACY / STANDARD UPDATE PATH
                const updatePayload: any = { updated_at: new Date().toISOString() };
                if (action === 'send' || action === 'prepare') updatePayload.status = 'preparing';
                if (action === 'ready') updatePayload.status = 'ready';
                if (action === 'serve' || action === 'close') updatePayload.status = 'delivered';
                if (action === 'cancel') updatePayload.status = 'canceled';

                if (Object.keys(updatePayload).length > 1) {
                    await DbWriteGate.update(
                        'OrderContext',
                        'gm_orders',
                        updatePayload,
                        { id: orderId, restaurant_id: rId },
                        { tenantId: rId }
                    );
                }
            } catch (err) {
                console.error('[Supabase] Action Sync Failed, Queueing:', err);
                await enqueue({
                    id: event.eventId,
                    type: 'ORDER_UPDATE',
                    payload: event.payload,
                    createdAt: event.meta.timestamp,
                    attempts: 0,
                    status: 'queued'
                });
            }
        }
    };

    return (
        <OrderContext.Provider value={{
            orders,
            addOrder,
            updateOrderStatus,
            createOrder,
            addItemToOrder: async (orderId, item) => performOrderAction(orderId, 'add_item', { items: [item] }),
            removeItemFromOrder: async (orderId, itemId) => performOrderAction(orderId, 'remove_item', { itemId }),
            updateItemQuantity: async (orderId, itemId, quantity) => performOrderAction(orderId, 'update_quantity', { itemId, quantity }),
            performOrderAction,
            resetOrders,
            pendingExceptions,
            // Extended Interface Defaults
            loading: false,
            isConnected: true,
            isOffline: false,
            realtimeStatus: 'SUBSCRIBED',
            lastRealtimeEvent: null,
            syncNow: async () => { },
            attachCustomer: async () => { },
            getActiveOrders: async () => { },
            openCashRegister: async () => { },
            closeCashRegister: async () => { },
            getOpenCashRegister: async () => null,
            getDailyTotal: async () => 0,
        }}>
            {children}
        </OrderContext.Provider>
    );
}

export function useOrders() {
    const context = useContext(OrderContext);
    if (!context) throw new Error('useOrders must be used within an OrderProvider');

    const sendOrderToKitchen = (id: string) => context.performOrderAction(id, 'send');
    const markOrderReady = (id: string) => context.performOrderAction(id, 'ready');
    const closeOrder = (id: string) => context.performOrderAction(id, 'close');
    const retryOrder = (id: string) => context.performOrderAction(id, 'retry');

    const updateOrder = (id: string, updates: any) => console.log('Update not impl yet', id, updates);

    // Helpers to match OrderContextReal interface
    const addItemToOrder = (orderId: string, item: any) => context.performOrderAction(orderId, 'add_item', { items: [item] });
    const removeItemFromOrder = (orderId: string, itemId: string) => context.performOrderAction(orderId, 'remove_item', { itemId });
    const updateItemQuantity = (orderId: string, itemId: string, quantity: number) => context.performOrderAction(orderId, 'update_quantity', { itemId, quantity });
    const cancelOrder = (orderId: string, reason?: string) => context.performOrderAction(orderId, 'cancel', { reason });

    const attachCustomer = async (orderId: string, customerId: string) => console.log('Attach customer not impl', orderId, customerId);
    const getActiveOrders = async () => console.log('Get Active Orders not impl');
    const openCashRegister = async (balance: number) => console.log('Open Cash not impl', balance);
    const closeCashRegister = async (balance: number) => console.log('Close Cash not impl', balance);
    const getOpenCashRegister = async () => null;
    const getDailyTotal = async () => 0;
    const syncNow = async () => console.log('Sync not impl');

    return {
        ...context,
        loading: false,
        // Connection placeholders
        isConnected: true,
        isOffline: false,
        realtimeStatus: 'SUBSCRIBED',
        lastRealtimeEvent: null,

        sendOrderToKitchen,
        markOrderReady,
        closeOrder,
        retryOrder,
        updateOrder,
        addItemToOrder,
        removeItemFromOrder,
        updateItemQuantity,
        cancelOrder,
        attachCustomer,
        getActiveOrders,
        openCashRegister,
        closeCashRegister,
        getOpenCashRegister,
        getDailyTotal,
        syncNow
    };
}
