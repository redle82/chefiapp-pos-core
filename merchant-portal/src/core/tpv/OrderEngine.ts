/**
 * Order Engine - Núcleo do TPV Real
 * 
 * Gerencia pedidos como entidades vivas com estados controlados e persistência real.
 * 
 * Estados:
 * - OPEN: Pedido aberto, pode ser modificado
 * - IN_PREP: Pedido enviado para cozinha
 * - READY: Pedido pronto
 * - PAID: Pedido pago
 * - CANCELLED: Pedido cancelado
 */

import { supabase } from '../supabase';

import { CashRegisterEngine } from './CashRegister';
import { Logger } from '../logger';
import { logAuditEvent } from '../audit/logAuditEvent';

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'canceled';
export type PaymentStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'FAILED';
export type PaymentMethod = 'cash' | 'card' | 'pix';

export class OrderEngineError extends Error {
    constructor(message: string, public code: string) {
        super(message);
        this.name = 'OrderEngineError';
    }
}

export interface OrderItemInput {
    productId?: string;
    name: string;
    priceCents: number;
    quantity: number;
    modifiers?: any[];
    notes?: string;
    categoryName?: string;
    consumptionGroupId?: string | null; // Para divisão de conta
}

export interface OrderInput {
    restaurantId: string;
    tableNumber?: number;
    tableId?: string;
    operatorId?: string;
    cashRegisterId?: string;
    source?: 'tpv' | 'web' | 'app';
    notes?: string;
    items: OrderItemInput[];
    syncMetadata?: {
        localId: string;
        syncAttempts: number;
        lastSyncAt: string;
    };
}

export interface Order {
    id: string;
    restaurantId: string;
    tableNumber?: number;
    tableId?: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    totalCents: number;
    subtotalCents: number;
    taxCents: number;
    discountCents: number;
    source: 'tpv' | 'web' | 'app';
    operatorId?: string;
    cashRegisterId?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    items: OrderItem[];
}

export interface OrderItem {
    id: string;
    orderId: string;
    productId?: string;
    nameSnapshot: string;
    priceSnapshot: number; // em centavos
    quantity: number;
    subtotalCents: number;
    modifiers?: any[];
    notes?: string;
    categoryName?: string;
    createdAt: Date;
}

export class OrderEngine {
    /**
     * Criar novo pedido
     * 
     * REGRAS CRÍTICAS:
     * 1. Caixa deve estar aberto (gatekeeper)
     * 2. Mesa não pode ter pedido ativo (uma mesa = um pedido)
     * 3. Deve ter pelo menos 1 item
     */
    // --- WRITE METHODS REMOVED FOR SOVEREIGNTY (Phase 15) ---
    // createOrder has been migrated to Kernel.execute('CREATE', 'ORDER')
    // See: OfflineOrderContext.tsx
    // --------------------------------------------------------

    /**
     * Buscar pedido por ID
     */
    static async getOrderById(orderId: string): Promise<Order> {
        const { data: orderData, error } = await supabase
            .from('gm_orders')
            .select(`
                *,
                items:gm_order_items(*)
            `)
            .eq('id', orderId)
            .single();

        if (error) {
            Logger.error('ORDER_FETCH_FAILED', error, { orderId });
            throw new OrderEngineError(
                `Pedido não encontrado. Verifique se o ID está correto.`,
                'ORDER_NOT_FOUND'
            );
        }
        if (!orderData) {
            throw new OrderEngineError(
                'Pedido não encontrado. Ele pode ter sido cancelado ou já finalizado.',
                'ORDER_NOT_FOUND'
            );
        }

        return this.mapDbOrderToOrder(orderData);
    }

    /**
     * Atualizar status do pedido
     */
    // --- WRITE METHODS REMOVED FOR SOVEREIGNTY ---
    // All modifications must go through Kernel.execute()
    // createOrder() remains as it uses Atomic RPC (Server-Side Logic)


    /**
     * Buscar pedido ativo por mesa
     */
    static async getActiveOrderByTable(restaurantId: string, tableId: string): Promise<Order | null> {
        const { data, error } = await supabase
            .from('gm_orders')
            .select(`
                *,
                items:gm_order_items(*)
            `)
            .eq('restaurant_id', restaurantId)
            .eq('table_id', tableId)
            .in('status', ['pending', 'preparing', 'ready'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            Logger.error('ORDER_FETCH_BY_TABLE_FAILED', error, { restaurantId, tableId });
            throw new OrderEngineError(
                'Erro ao buscar pedido da mesa. Tente novamente.',
                'ORDER_FETCH_FAILED'
            );
        }
        if (!data) return null;

        return this.mapDbOrderToOrder(data);
    }

    /**
     * Buscar pedidos ativos do restaurante
     */
    static async getActiveOrders(restaurantId: string): Promise<Order[]> {
        const { data, error } = await supabase
            .from('gm_orders')
            .select(`
                *,
                items:gm_order_items(*)
            `)
            .eq('restaurant_id', restaurantId)
            .in('status', ['pending', 'preparing', 'ready'])
            .order('created_at', { ascending: false });

        if (error) {
            Logger.error('ACTIVE_ORDERS_FETCH_FAILED', error, { restaurantId });
            throw new OrderEngineError(
                'Erro ao buscar pedidos ativos. Tente novamente.',
                'ORDERS_FETCH_FAILED'
            );
        }

        return (data || []).map(this.mapDbOrderToOrder);
    }

    /**
     * Mapear dados do banco para Order
     */
    private static mapDbOrderToOrder(dbOrder: any): Order {
        return {
            id: dbOrder.id,
            restaurantId: dbOrder.restaurant_id,
            tableNumber: dbOrder.table_number || dbOrder.sync_metadata?.table_number,
            tableId: dbOrder.table_id,
            status: dbOrder.status as OrderStatus,
            paymentStatus: dbOrder.payment_status as PaymentStatus,
            totalCents: dbOrder.total_amount, // Schema uses total_amount
            subtotalCents: dbOrder.total_amount, // MVP: Subtotal = Total
            taxCents: 0,
            discountCents: 0,
            source: dbOrder.source || dbOrder.sync_metadata?.origin || 'tpv',
            operatorId: dbOrder.operator_id,
            cashRegisterId: dbOrder.cash_register_id,
            notes: dbOrder.notes || dbOrder.sync_metadata?.notes,
            createdAt: new Date(dbOrder.created_at),
            updatedAt: new Date(dbOrder.updated_at),
            items: (dbOrder.items || []).map((item: any) => ({
                id: item.id,
                orderId: item.order_id,
                productId: item.product_id,
                nameSnapshot: item.product_name, // Schema uses product_name
                priceSnapshot: item.unit_price, // Schema uses unit_price
                quantity: item.quantity,
                subtotalCents: item.total_price, // Schema uses total_price
                modifiers: item.modifiers || [],
                notes: item.notes,
                categoryName: item.category_name, // Map Category (Mission 55)
                createdAt: new Date(item.created_at || new Date()), // Item might not have created_at in schema? Checked: No created_at in gm_order_items definition!
            })),
        };
    }
}

