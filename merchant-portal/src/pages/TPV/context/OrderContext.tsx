import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { useOfflineQueue } from '../../../core/queue/useOfflineQueue';
import { GlobalEventStore } from '../../../core/events/EventStore';
import { CoreExecutor } from '../../../core/events/CoreExecutor';
import type { EventEnvelope } from '../../../core/events/SystemEvents';
import { supabase } from '../../../core/supabase';
import { getTabIsolated } from '../../../core/storage/TabIsolatedStorage';

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
    createOrder: (order: Order) => Promise<void>;
    performOrderAction: (orderId: string, action: string, payload?: any) => Promise<void>;
    resetOrders: () => void;
}

export const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
    const [orders, setOrders] = useState<Order[]>([]);
    const { enqueue } = useOfflineQueue();
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [isDemo, setIsDemo] = useState(false);

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
                id, table_number, status, total_cents, created_at,
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
                total: fromCents(io.total_cents),
                tableNumber: io.table_number,
                createdAt: new Date(io.created_at),
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
    };

    const createOrder = async (order: Order) => {
        // 1. Optimistic Local Update
        setOrders(prev => [...prev, order]);

        const rId = restaurantId || getTabIsolated('chefiapp_restaurant_id');
        const demo = isDemo || getTabIsolated('chefiapp_demo_mode') === 'true';

        // 3. Sovereign Sync
        if (rId && !demo) {
            try {
                // A. Header (gm_orders)
                const { error: headerError } = await supabase.from('gm_orders').insert({
                    id: order.id,
                    restaurant_id: rId,
                    table_number: typeof order.tableNumber === 'number' ? order.tableNumber : 0,
                    status: 'IN_PREP',
                    total_cents: toCents(order.total),
                    source: 'tpv'
                });

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

                    const { error: itemsError } = await supabase.from('gm_order_items').insert(dbItems);
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

                    await supabase.from('gm_orders')
                        .update({
                            total_cents: newTotalCents,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', orderId)
                        .eq('restaurant_id', rId);

                    await supabase.from('gm_order_items')
                        .delete()
                        .eq('order_id', orderId);

                    if (payload.items.length > 0) {
                        const dbItems = payload.items.map((item: any) => ({
                            order_id: orderId,
                            product_id: item.id && item.id.length > 10 ? item.id : null,
                            name_snapshot: item.name,
                            price_snapshot: toCents(item.price),
                            quantity: item.quantity,
                            subtotal_cents: toCents(item.price * item.quantity) // REQUIRED FOR TRIGGER
                        }));

                        await supabase.from('gm_order_items').insert(dbItems);
                    }
                    return;
                }

                // LEGACY / STANDARD UPDATE PATH
                const updatePayload: any = { updated_at: new Date().toISOString() };
                if (action === 'send' || action === 'prepare') updatePayload.status = 'IN_PREP';
                if (action === 'ready') updatePayload.status = 'READY';
                if (action === 'serve' || action === 'close') updatePayload.status = 'COMPLETED';
                if (action === 'cancel') updatePayload.status = 'CANCELLED';

                if (Object.keys(updatePayload).length > 1) {
                    await supabase.from('gm_orders').update(updatePayload).eq('id', orderId).eq('restaurant_id', rId);
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
            performOrderAction,
            resetOrders,
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

    return {
        ...context,
        sendOrderToKitchen,
        markOrderReady,
        closeOrder,
        retryOrder,
        updateOrder,
        loading: false
    };
}
