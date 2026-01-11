/**
 * OrderContext Real - Usando OrderEngine
 * 
 * Substitui o mock por implementação real com persistência.
 * REALTIME-RELIABLE: Implementa Throttling, Polling Defensivo e Auto-Heal na reconexão.
 * ONLINE-ONLY: Modo offline apenas notifica visualmente. Operações de escrita requerem conexão.
 */

import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { OrderEngine, type Order as RealOrder, type OrderItemInput } from '../../../core/tpv/OrderEngine';
import { PaymentEngine, type PaymentMethod } from '../../../core/tpv/PaymentEngine';
import { CashRegisterEngine, type CashRegister } from '../../../core/tpv/CashRegister';
import { supabase } from '../../../core/supabase';
import { useNetworkStatus } from '../../../core/queue/useNetworkStatus';
import { Logger } from '../../../core/logger/Logger'; // Opus 6.0 Logger
import type { Order, OrderItem } from './OrderTypes';
import { useOfflineOrder } from './OfflineOrderContext';
import { v4 as uuidv4 } from 'uuid';
import { getTabIsolated, setTabIsolated, removeTabIsolated } from '../../../core/storage/TabIsolatedStorage';
import { ReconnectManager } from '../../../core/realtime/ReconnectManager';

interface OrderContextType {
    orders: Order[];
    loading: boolean;
    createOrder: (order: Partial<Order>) => Promise<Order>;
    addItemToOrder: (orderId: string, item: OrderItemInput) => Promise<void>;
    removeItemFromOrder: (orderId: string, itemId: string) => Promise<void>;
    updateItemQuantity: (orderId: string, itemId: string, quantity: number) => Promise<void>;
    performOrderAction: (orderId: string, action: string, payload?: any) => Promise<void>;
    getActiveOrders: () => Promise<void>;
    // Cash Register
    openCashRegister: (openingBalanceCents: number) => Promise<void>;
    closeCashRegister: (closingBalanceCents: number) => Promise<void>;
    getOpenCashRegister: () => Promise<CashRegister | null>;
    // Daily totals
    getDailyTotal: () => Promise<number>;
    // Connection status (for KDS and TPV)
    isConnected: boolean;           // Network connectivity
    isOffline: boolean;             // Network offline
    realtimeStatus: string;         // Supabase realtime: 'SUBSCRIBED' | 'CLOSED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'SUBSCRIBING'
    lastRealtimeEvent: Date | null; // Timestamp do último evento realtime recebido

    syncNow: () => Promise<void>;   // Forçar sync manual
}

export const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Mapear status do OrderEngine para Order local
// Mapear Order do Engine (backend) para Order local (frontend)
// CRÍTICO: Alinhar estados frontend ↔ backend
// Backend usa: status='PAID' OU payment_status='PAID'
// Frontend usa: status='paid'
function mapRealOrderToLocalOrder(realOrder: RealOrder): Order {
    return {
        id: realOrder.id,
        tableNumber: realOrder.tableNumber,
        tableId: realOrder.tableId,
        // CRÍTICO: Verificar payment_status primeiro (fonte soberana)
        status: mapStatusToLocal(realOrder.status, realOrder.paymentStatus),
        items: realOrder.items.map(item => ({
            id: item.id,
            productId: item.productId,
            name: item.nameSnapshot,
            price: item.priceSnapshot, // já em centavos
            quantity: item.quantity,
            notes: item.notes,
        })),
        total: realOrder.totalCents, // já em centavos
        createdAt: realOrder.createdAt,
        updatedAt: realOrder.updatedAt,
    };
}

// Mapear status considerando payment_status (fonte soberana)
function mapStatusToLocal(status: string, paymentStatus?: string): Order['status'] {
    // PRIORIDADE 1: Se payment_status = 'PAID', order está pago
    if (paymentStatus === 'PAID') {
        return 'paid';
    }

    // PRIORIDADE 2: Se status = 'PAID', order está pago
    if (status === 'PAID') {
        return 'paid';
    }

    // PRIORIDADE 3: Mapear outros status
    switch (status) {
        case 'OPEN': return 'new';
        case 'IN_PREP': return 'preparing';
        case 'READY': return 'ready';
        case 'CANCELLED': return 'cancelled';
        default: return 'new';
    }
}

function mapLocalStatusToReal(status: Order['status']): RealOrder['status'] {
    switch (status) {
        case 'new': return 'OPEN';
        case 'preparing': return 'IN_PREP';
        case 'ready': return 'READY';
        case 'served': return 'READY';
        case 'paid': return 'PAID';
        case 'cancelled': return 'CANCELLED';
        default: return 'OPEN';
    }
}

export function OrderProvider({ children }: { children: ReactNode }) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [operatorId, setOperatorId] = useState<string | null>(null);
    const [cashRegisterId, setCashRegisterId] = useState<string | null>(null);


    // === KDS HARDENING: Estado do Realtime ===
    // MOTIVO: KDS precisa saber se está "cego" (sem eventos realtime)
    const [realtimeStatus, setRealtimeStatus] = useState<string>('SUBSCRIBING');
    const [lastRealtimeEvent, setLastRealtimeEvent] = useState<Date | null>(null);
    const wasDisconnectedRef = useRef(false); // Para detectar reconexão

    // Network status hook
    // const { isOnline, isOffline } = useNetworkStatus(); // Replacing with OfflineContext
    const { isOffline, addToQueue, updateOfflineOrder, queue: offlineQueue } = useOfflineOrder();
    const isOnline = !isOffline;

    // SAFETY: Chaves de idempotência persistentes por sessão
    const idempotencyKeys = useRef<Map<string, string>>(new Map());

    // === KDS HARDENING: Refetch Strategy (Debounce + Polling) ===
    const fetchDebounceRef = useRef<NodeJS.Timeout | null>(null);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    // === REALTIME RECONNECT: Exponential Backoff ===
    const reconnectManagerRef = useRef(new ReconnectManager());
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const channelRef = useRef<any>(null);

    // Initial fetch
    useEffect(() => {
        const storedRestaurantId = getTabIsolated('chefiapp_restaurant_id');
        if (storedRestaurantId) {
            setRestaurantId(storedRestaurantId);
        }

        // ... (Maintain existing user fetch logic) ...
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setOperatorId(user.id);
        });

        if (storedRestaurantId) {
            CashRegisterEngine.getOpenCashRegister(storedRestaurantId)
                .then(register => {
                    if (register) setCashRegisterId(register.id);
                })
                .catch(() => { });
        }
    }, []);

    // Core Fetch Logic
    const getActiveOrdersInternal = async (restId: string, isBackground = false) => {
        // Only show loading on explicit big actions, not on background syncs
        if (!isBackground) setLoading(true);
        try {
            const realOrders = await OrderEngine.getActiveOrders(restId);
            setOrders(realOrders.map(mapRealOrderToLocalOrder));
        } catch (err) {
            Logger.error('Failed to load orders', err, { context: 'OrderContext', tenantId: restId });
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    const getActiveOrders = async (isBackground = false) => {
        if (!restaurantId) return;
        await getActiveOrdersInternal(restaurantId, isBackground);
    };

    // Setup Realtime Subscription (extracted for reuse)
    const setupRealtimeSubscription = useCallback(() => {
        if (!restaurantId) return null;

        Logger.info('Setting up Realtime subscription', { context: 'OrderContext', tenantId: restaurantId });

        const channel = supabase
            .channel(`orders_realtime_${restaurantId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'gm_orders',
                filter: `restaurant_id=eq.${restaurantId}`,
            }, (payload) => {
                Logger.info('Realtime event received', { context: 'OrderContext', eventType: payload.eventType, tenantId: restaurantId });
                setLastRealtimeEvent(new Date());

                // DEBOUNCE: Avoid refetch storm on bursts
                if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
                fetchDebounceRef.current = setTimeout(() => {
                    getActiveOrders(true); // Background fetch
                }, 500);
            })
            .subscribe((status) => {
                setRealtimeStatus(status);
                if (status === 'SUBSCRIBED') {
                    // Reset reconnect manager on success
                    reconnectManagerRef.current.reset();
                    if (reconnectTimeoutRef.current) {
                        clearTimeout(reconnectTimeoutRef.current);
                        reconnectTimeoutRef.current = null;
                    }

                    if (wasDisconnectedRef.current) {
                        Logger.info('🔄 RECONNECTED - Syncing', { context: 'OrderContext', tenantId: restaurantId });
                        getActiveOrders(true);
                        wasDisconnectedRef.current = false;
                    }
                } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    wasDisconnectedRef.current = true;
                }
            });

        channelRef.current = channel;
        return channel;
    }, [restaurantId]);

    // Subscription & Polling
    useEffect(() => {
        if (restaurantId) {
            Logger.info('Setting up Realtime & Polling', { context: 'OrderContext', tenantId: restaurantId });
            getActiveOrders(false); // Initial load (with spinner)

            // 1. SAFETY NET: Defensive Polling (30s)
            // 🔴 RISK: Se Supabase Realtime falhar silenciosamente, este é o único fallback.
            // Intervalo de 30s é um trade-off entre carga no servidor e latência máxima de pedidos.
            // TODO: Considerar reduzir para 15s em horário de pico se necessário.
            pollingRef.current = setInterval(() => {
                Logger.info('🛡️ Defensive Polling (30s interval)', { context: 'OrderContext', tenantId: restaurantId });
                getActiveOrders(true);
            }, 30000);

            // 2. REALTIME SUBSCRIPTION
            const channel = setupRealtimeSubscription();

            return () => {
                Logger.info('Cleanup OrderContext subscriptions', { context: 'OrderContext', tenantId: restaurantId });
                if (channel) {
                    supabase.removeChannel(channel);
                }
                if (pollingRef.current) clearInterval(pollingRef.current);
                if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
                if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            };
        }
    }, [restaurantId, setupRealtimeSubscription]);

    // Auto-Reconnect Logic (exponential backoff)
    useEffect(() => {
        if (!restaurantId) return;

        // Detect disconnection and trigger reconnect
        if (realtimeStatus === 'CLOSED' || realtimeStatus === 'CHANNEL_ERROR' || realtimeStatus === 'TIMED_OUT') {
            if (reconnectManagerRef.current.shouldRetry()) {
                const delay = reconnectManagerRef.current.getDelay();
                const attempts = reconnectManagerRef.current.getAttempts() + 1;

                Logger.warn(`[Realtime] Connection lost. Reconnecting in ${reconnectManagerRef.current.getDelayFormatted()} (attempt ${attempts})`, {
                    context: 'OrderContext',
                    tenantId: restaurantId,
                    status: realtimeStatus,
                });

                reconnectTimeoutRef.current = setTimeout(() => {
                    reconnectManagerRef.current.increment();

                    // Unsubscribe old channel
                    if (channelRef.current) {
                        supabase.removeChannel(channelRef.current);
                        channelRef.current = null;
                    }

                    // Re-subscribe
                    setupRealtimeSubscription();
                }, delay);
            } else {
                Logger.error('[Realtime] Max reconnection attempts reached. Using polling fallback only.', {
                    context: 'OrderContext',
                    tenantId: restaurantId,
                });
            }
        }

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        };
    }, [realtimeStatus, restaurantId, setupRealtimeSubscription]);

    // Criar pedido
    const createOrder = async (orderInput: Partial<Order>): Promise<Order> => {
        if (!restaurantId) throw new Error('Restaurant ID not set');



        // Check Offline Mode (Hard Check)
        if (isOffline) {
            Logger.warn('⚠️ Offline Mode detected. Creating local order.', { context: 'OrderContext', tenantId: restaurantId });

            // 1. Get cash register ID if available
            let cashRegisterId: string | undefined;
            try {
                const openRegister = await CashRegisterEngine.getOpenCashRegister(restaurantId);
                cashRegisterId = openRegister?.id;
            } catch (e) {
                Logger.warn('Could not get cash register for offline order', { error: e });
            }

            // 2. Create Local Payload (Format for OrderEngine)
            const localId = uuidv4();
            const now = new Date().toISOString();

            const payload = {
                restaurant_id: restaurantId,
                table_number: orderInput.tableNumber,
                table_id: orderInput.tableId,
                operator_id: operatorId,
                cash_register_id: cashRegisterId,
                items: (orderInput.items || []).map(item => ({
                    product_id: item.productId,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    notes: item.notes
                })),
                id: localId // Critical for ID Mapping in Sync
            };

            // 3. Add to Offline Queue (IndexedDB)
            await addToQueue(payload);

            // 4. Optimistic UI Update
            const totalCents = (orderInput.items || []).reduce((sum, i) => sum + (i.price * i.quantity), 0);
            const localOrder: Order = {
                id: localId,
                tableNumber: orderInput.tableNumber,
                tableId: orderInput.tableId,
                status: 'new',
                items: (orderInput.items || []).map(item => ({
                    id: uuidv4(), // Temp ID
                    productId: item.productId,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    notes: item.notes
                })),
                total: totalCents,
                createdAt: now,
                updatedAt: now
            };

            setOrders(prev => [...prev, localOrder]);

            // Persist active order (Tab-Isolated)
            const { setTabIsolated } = await import('../../../core/storage/TabIsolatedStorage');
            setTabIsolated('chefiapp_active_order_id', localOrder.id);

            Logger.info('Local order created (offline)', { localId, tableNumber: orderInput.tableNumber });
            return localOrder;
        }

        // ONLINE MODE: Fluxo normal
        // Verificar caixa aberto (gatekeeper)
        if (!cashRegisterId) {
            const openRegister = await CashRegisterEngine.getOpenCashRegister(restaurantId);
            if (!openRegister) {
                throw new Error('CASH_REGISTER_CLOSED: Abra o caixa antes de criar vendas.');
            }
            setCashRegisterId(openRegister.id);
        }

        // Verificar se mesa já tem pedido ativo
        if (orderInput.tableId) {
            try {
                const existingOrder = await OrderEngine.getActiveOrderByTable(restaurantId, orderInput.tableId);
                if (existingOrder) {
                    const localOrder = mapRealOrderToLocalOrder(existingOrder);
                    // Salvar como pedido ativo
                    setTabIsolated('chefiapp_active_order_id', localOrder.id);
                    await getActiveOrders();
                    return localOrder;
                }
            } catch (err) {
                // Se não encontrar, continua criando novo
            }
        }

        // Criar novo pedido (já valida caixa e mesa no OrderEngine)
        const realOrder = await OrderEngine.createOrder({
            restaurantId,
            tableNumber: orderInput.tableNumber,
            tableId: orderInput.tableId,
            operatorId: operatorId || undefined,
            cashRegisterId: cashRegisterId || undefined,
            notes: orderInput.items?.find(i => i.notes)?.notes,
            items: (orderInput.items || []).map(item => ({
                productId: item.productId,
                name: item.name,
                priceCents: item.price,
                quantity: item.quantity,
                notes: item.notes,
            })),
        });

        const localOrder = mapRealOrderToLocalOrder(realOrder);

        // HARD RULE 4: Persistir pedido ativo (Tab-Isolated)
        const { setTabIsolated } = require('../../../core/storage/TabIsolatedStorage');
        setTabIsolated('chefiapp_active_order_id', localOrder.id);

        await getActiveOrders(); // Refresh
        return localOrder;
    };

    // Adicionar item
    const addItemToOrder = async (orderId: string, item: OrderItemInput): Promise<void> => {
        if (!restaurantId) throw new Error('Restaurant ID not set');

        if (isOffline) {
            Logger.info('Offline Mode: Adding item locally', { orderId, item });
            await updateOfflineOrder(orderId, 'ADD_ITEM', {
                ...item,
                restaurantId // Vital for sync
            });

            // Optimistic UI Update (Local Memory)
            // We need to update `orders` state manually since there's no DB fetch.
            setOrders(prev => prev.map(order => {
                if (order.id === orderId) {
                    const newItem: OrderItem = {
                        id: uuidv4(), // Temp local ID
                        productId: item.productId,
                        name: item.name,
                        price: item.priceCents,
                        quantity: item.quantity,
                        notes: item.notes
                    };
                    const updatedItems = [...order.items, newItem];
                    const newTotal = updatedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
                    return { ...order, items: updatedItems, total: newTotal, updatedAt: new Date() };
                }
                return order;
            }));
            return;
        }

        await OrderEngine.addItemToOrder(orderId, item, restaurantId);
        await getActiveOrders(); // Refresh
    };

    // Remover item
    const removeItemFromOrder = async (orderId: string, itemId: string): Promise<void> => {
        if (!restaurantId) throw new Error('Restaurant ID not set');

        if (isOffline) {
            Logger.info('Offline Mode: Removing item locally', { orderId, itemId });
            await updateOfflineOrder(orderId, 'REMOVE_ITEM', {
                itemId,
                restaurantId
            });

            // Optimistic UI Update
            setOrders(prev => prev.map(order => {
                if (order.id === orderId) {
                    const updatedItems = order.items.filter(i => i.id !== itemId);
                    const newTotal = updatedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
                    return { ...order, items: updatedItems, total: newTotal, updatedAt: new Date() };
                }
                return order;
            }));
            return;
        }

        await OrderEngine.removeItemFromOrder(orderId, itemId, restaurantId);
        await getActiveOrders(); // Refresh
    };

    // Atualizar quantidade
    const updateItemQuantity = async (orderId: string, itemId: string, quantity: number): Promise<void> => {
        if (!restaurantId) throw new Error('Restaurant ID not set');

        if (isOffline) {
            Logger.info('Offline Mode: Updating item quantity locally', { orderId, itemId, quantity });
            await updateOfflineOrder(orderId, 'UPDATE_QTY', {
                itemId,
                quantity,
                restaurantId
            });

            // Optimistic UI Update
            setOrders(prev => prev.map(order => {
                if (order.id === orderId) {
                    const updatedItems = order.items.map(i => {
                        if (i.id === itemId) return { ...i, quantity };
                        return i;
                    });
                    const newTotal = updatedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
                    return { ...order, items: updatedItems, total: newTotal, updatedAt: new Date() };
                }
                return order;
            }));
            return;
        }

        await OrderEngine.updateItemQuantity(orderId, itemId, quantity, restaurantId);
        await getActiveOrders(); // Refresh
    };

    // Ações do pedido
    const performOrderAction = async (orderId: string, action: string, payload?: any): Promise<void> => {
        if (!restaurantId) throw new Error('Restaurant ID not set');

        try {
            switch (action) {
                case 'send':
                case 'prepare':
                    await OrderEngine.updateOrderStatus(orderId, 'IN_PREP', restaurantId);
                    break;

                case 'ready':
                    await OrderEngine.updateOrderStatus(orderId, 'READY', restaurantId);
                    break;

                case 'serve':
                    // Update to SERVED (Final Kitchen/Table State)
                    const nowServed = new Date().toISOString();
                    await supabase.from('gm_orders').update({
                        status: 'served',
                        served_at: nowServed
                    }).eq('id', orderId);
                    break;

                case 'pay':
                    // HARD RULE 2: Pagar = Fechar pedido (TRANSACTION ATOMICA)
                    // CRÍTICO: Re-fetch order do DB e recalcular total (nunca confiar no frontend)

                    // 1. Re-fetch order do DB (fonte soberana)
                    const dbOrder = await OrderEngine.getOrderById(orderId);

                    // 2. Recalcular total baseado em items (double-check contra tampering)
                    const { data: items, error: itemsError } = await supabase
                        .from('gm_order_items')
                        .select('price_snapshot, quantity')
                        .eq('order_id', orderId);

                    if (itemsError) {
                        throw new Error(`Failed to fetch order items: ${itemsError.message}`);
                    }

                    if (!items || items.length === 0) {
                        throw new Error('Order has no items');
                    }

                    const calculatedTotal = items.reduce(
                        (sum, i) => sum + (i.price_snapshot * i.quantity),
                        0
                    );

                    // 3. Validar que total do DB = total calculado (proteção contra tampering)
                    if (calculatedTotal !== dbOrder.totalCents) {
                        Logger.critical('Total mismatch detected during payment', null, {
                            context: 'OrderContext',
                            dbTotal: dbOrder.totalCents,
                            calculatedTotal,
                            orderId
                        });
                        throw new Error('Total mismatch - possible tampering detected. Please refresh and try again.');
                    }

                    // IDEMPOTENCY SAFETY: Recuperar key da sessão ou gerar nova
                    let key = idempotencyKeys.current.get(orderId);
                    if (!key) {
                        key = `${orderId}_${Date.now()}_secure`;
                        idempotencyKeys.current.set(orderId, key);
                    }

                    // 0. Enforce Open Cash Register (Sovereign Rule)
                    if (!cashRegisterId) {
                        // Double check DB
                        const openRegister = await CashRegisterEngine.getOpenCashRegister(restaurantId);
                        if (!openRegister) {
                            throw new Error('CASH_REGISTER_CLOSED: Abra o caixa antes de receber pagamentos.');
                        }
                        setCashRegisterId(openRegister.id);
                        // Use fetched ID for this transaction to avoid state lag
                    }
                    const activeRegisterId = cashRegisterId || (await CashRegisterEngine.getOpenCashRegister(restaurantId))?.id;

                    if (!activeRegisterId) {
                        throw new Error('CASH_REGISTER_CLOSED: Abra o caixa antes de receber pagamentos.');
                    }

                    // 4. Processar pagamento (transação atômica: paga + fecha)
                    // SEMPRE usar valor do DB, nunca do estado React
                    await PaymentEngine.processPayment({
                        orderId,
                        restaurantId,
                        cashRegisterId: activeRegisterId,
                        amountCents: dbOrder.totalCents, // SEMPRE do DB
                        method: (payload?.method || 'cash') as PaymentMethod,
                        metadata: {
                            operatorId: operatorId || undefined,
                        },
                        idempotencyKey: key
                    });

                    // Cleanup key on success (allows new payment if order re-opened later)
                    idempotencyKeys.current.delete(orderId);

                    // FASE 3: Integração CRM e Loyalty (não bloqueia pagamento se falhar)
                    try {
                        const { CustomerService } = await import('../../../core/crm/CustomerService');
                        const { LoyaltyService } = await import('../../../core/loyalty/LoyaltyService');

                        // Buscar dados do pedido para CRM/Loyalty
                        const orderForCRM = await OrderEngine.getOrder(orderId, restaurantId);
                        if (orderForCRM) {
                            // Extrair dados do cliente (se disponível)
                            const customerPhone = orderForCRM.metadata?.customer_phone;
                            const customerEmail = orderForCRM.metadata?.customer_email;
                            const customerName = orderForCRM.metadata?.customer_name;

                            // Atualizar CRM
                            if (customerPhone || customerEmail) {
                                const customer = await CustomerService.findOrCreateCustomer(restaurantId, {
                                    email: customerEmail,
                                    phone: customerPhone,
                                    full_name: customerName,
                                });

                                await CustomerService.updateAfterOrder(customer.id, dbOrder.totalCents / 100);

                                // Adicionar pontos de fidelidade
                                await LoyaltyService.awardPointsForOrder(
                                    restaurantId,
                                    orderId,
                                    dbOrder.totalCents,
                                    customer.id,
                                    customerPhone,
                                    customerEmail
                                );
                            }
                        }
                    } catch (crmError) {
                        // Log mas não bloqueia pagamento
                        console.warn('[TPV] CRM/Loyalty processing failed (non-blocking):', crmError);
                    }

                    // Limpar pedido ativo após pagamento
                    const currentActive = getTabIsolated('chefiapp_active_order_id');
                    if (currentActive === orderId) {
                        removeTabIsolated('chefiapp_active_order_id');
                    }
                    break;

                case 'close':
                    // HARD RULE: 'close' foi eliminado
                    // Pagamento já fecha o pedido automaticamente (transação atômica)
                    // Esta ação não deve mais existir, mas mantemos para compatibilidade
                    const orderToClose = await OrderEngine.getOrderById(orderId);
                    if (orderToClose.paymentStatus !== 'PAID') {
                        throw new Error('Pedido deve ser pago antes de fechar. Use "Cobrar" primeiro.');
                    }
                    // Se já está pago, apenas atualizar status (redundante, mas seguro)
                    await OrderEngine.updateOrderStatus(orderId, 'PAID', restaurantId);
                    break;

                case 'cancel':
                    await OrderEngine.updateOrderStatus(orderId, 'CANCELLED', restaurantId);
                    // Limpar pedido ativo se cancelado
                    const currentActiveCancel = getTabIsolated('chefiapp_active_order_id');
                    if (currentActiveCancel === orderId) {
                        removeTabIsolated('chefiapp_active_order_id');
                    }
                    break;

                default:
                    Logger.warn('Unknown action', { context: 'OrderContext', action, orderId });
            }

            await getActiveOrders(); // Refresh
        } catch (err: any) {
            Logger.error('Action failed', err, { context: 'OrderContext', action, orderId });
            throw err;
        }
    };

    // Abrir caixa
    const openCashRegister = async (openingBalanceCents: number): Promise<void> => {
        // LAZY LOAD: If operatorId is missing, try to fetch it one last time
        let currentOperatorId = operatorId;
        if (!currentOperatorId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                currentOperatorId = user.id;
                setOperatorId(user.id);
            }
        }

        if (!restaurantId || !currentOperatorId) {
            Logger.error('Missing IDs for OpenCashRegister', null, { restaurantId, operatorId: currentOperatorId });
            throw new Error('Restaurant ID or Operator ID not set');
        }

        try {
            const register = await CashRegisterEngine.openCashRegister({
                restaurantId,
                openingBalanceCents,
                openedBy: currentOperatorId,
            });

            setCashRegisterId(register.id);
        } catch (err: any) {
            // Robustness: If already open, just recover the ID and proceed
            if (err.message?.includes('already open') || err.message?.includes('já está aberto')) {
                Logger.warn('Register already open. recovering...', { context: 'OrderContext', tenantId: restaurantId });
                const existing = await CashRegisterEngine.getOpenCashRegister(restaurantId);
                if (existing) {
                    setCashRegisterId(existing.id);
                    return; // Treat as success
                }
            }
            throw err;
        }
    };

    // Fechar caixa
    const closeCashRegister = async (closingBalanceCents: number): Promise<void> => {
        if (!restaurantId || !operatorId || !cashRegisterId) {
            throw new Error('Missing required IDs');
        }

        await CashRegisterEngine.closeCashRegister({
            cashRegisterId,
            restaurantId,
            closingBalanceCents,
            closedBy: operatorId,
        });

        setCashRegisterId(null);
    };

    // Buscar caixa aberto
    const getOpenCashRegister = async (): Promise<CashRegister | null> => {
        if (!restaurantId) return null;
        return CashRegisterEngine.getOpenCashRegister(restaurantId);
    };

    // Total do dia
    const getDailyTotal = async (): Promise<number> => {
        if (!restaurantId) return 0;

        const payments = await PaymentEngine.getTodayPayments(restaurantId);
        return payments.reduce((sum, p) => sum + p.amountCents, 0);
    };

    return (
        <OrderContext.Provider value={{
            orders,
            loading,
            // === KDS HARDENING: Expor todos os estados de conexão ===
            isConnected: isOnline,
            isOffline,
            realtimeStatus,       // 'SUBSCRIBED' | 'CLOSED' | 'CHANNEL_ERROR' | etc
            lastRealtimeEvent,    // Timestamp do último evento

            syncNow: async () => await getActiveOrders(false), // Manual sync shows spinner
            createOrder,
            addItemToOrder,
            removeItemFromOrder,
            updateItemQuantity,
            performOrderAction,
            getActiveOrders,
            openCashRegister,
            closeCashRegister,
            getOpenCashRegister,
            getDailyTotal,
        }}>
            {children}
        </OrderContext.Provider>
    );
}

export function useOrders() {
    const context = useContext(OrderContext);
    if (!context) throw new Error('useOrders must be used within an OrderProvider');
    return context;
}

