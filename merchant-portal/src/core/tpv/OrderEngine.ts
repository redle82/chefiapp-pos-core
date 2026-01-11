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
import { Logger } from '../logger/Logger';
import { logAuditEvent } from '../audit/logAuditEvent';

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'canceled';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED';
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
    static async createOrder(input: OrderInput): Promise<Order> {
        // HARD RULE 1: Caixa deve estar aberto (Exceto para Web/App que entram automaticamente)
        let cashRegisterId: string | null = null;
        if (input.source === 'tpv') {
            const openCashRegister = await CashRegisterEngine.getOpenCashRegister(input.restaurantId);
            if (!openCashRegister) {
                throw new OrderEngineError(
                    'Caixa não está aberto. Abra o caixa antes de criar vendas.',
                    'CASH_REGISTER_CLOSED'
                );
            }
            cashRegisterId = openCashRegister.id;
        }

        // HARD RULE 2: Mesa não pode ter pedido ativo
        if (input.tableId) {
            const existingOrder = await this.getActiveOrderByTable(input.restaurantId, input.tableId);
            if (existingOrder) {
                throw new OrderEngineError(
                    `Mesa ${input.tableNumber || input.tableId} já possui pedido ativo. Use o pedido existente.`,
                    'TABLE_HAS_ACTIVE_ORDER'
                );
            }
        }

        // HARD RULE 3: Deve ter pelo menos 1 item
        if (!input.items || input.items.length === 0) {
            throw new OrderEngineError(
                'Pedido deve ter pelo menos 1 item.',
                'EMPTY_ORDER'
            );
        }

        // Prepare RPC items payload
        const rpcItems = input.items.map(item => ({
            product_id: item.productId,
            name: item.name,
            quantity: item.quantity,
            unit_price: item.priceCents
        }));

        // Call RPC
        const { data: orderData, error } = await supabase.rpc('create_order_atomic', {
            p_restaurant_id: input.restaurantId,
            p_items: rpcItems,
            p_payment_method: 'cash' // Default, will be updated on payment
        });

        if (error) {
            Logger.error('OrderEngine: create_order_atomic failed', error, { input });
            
            // CRITICAL: Handle race condition (unique constraint violation)
            // PostgreSQL error code 23505 = unique_violation
            // Check for both possible index names (old and new)
            if (error.code === '23505' && (
                error.message?.includes('idx_gm_orders_active_table') ||
                error.message?.includes('idx_one_open_order_per_table')
            )) {
                throw new OrderEngineError(
                    `Mesa ${input.tableNumber || input.tableId || 'N/A'} já possui pedido ativo. Use o pedido existente.`,
                    'TABLE_HAS_ACTIVE_ORDER'
                );
            }
            
            if (error.code === '23503') {
                throw new OrderEngineError(
                    'Dados inválidos. Verifique se todos os produtos existem no menu.',
                    'INVALID_DATA'
                );
            }
            
            throw new OrderEngineError(
                `Erro ao criar pedido: ${error.message}`,
                'ORDER_CREATION_FAILED'
            );
        }

        Logger.info('OrderEngine: Order Created', { orderId: orderData.id, total: orderData.total_amount });

        // Audit log
        await logAuditEvent({
            action: 'order_created',
            resourceEntity: 'gm_orders',
            resourceId: orderData.id,
            metadata: {
                restaurant_id: input.restaurantId,
                table_number: input.tableNumber,
                table_id: input.tableId,
                items_count: input.items.length,
                total_cents: orderData.total_amount,
                cash_register_id: cashRegisterId,
            },
        });

        // Return full order object by fetching it
        return this.getOrderById(orderData.id);
    }

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
    static async updateOrderStatus(
        orderId: string,
        status: OrderStatus,
        restaurantId: string
    ): Promise<void> {
        // Buscar status anterior para log
        const { data: currentOrder } = await supabase
            .from('gm_orders')
            .select('status')
            .eq('id', orderId)
            .eq('restaurant_id', restaurantId)
            .single();

        const previousStatus = currentOrder?.status || 'unknown';

        const { error } = await supabase
            .from('gm_orders')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', orderId)
            .eq('restaurant_id', restaurantId);

        if (error) {
            // Log erro
            Logger.error('ORDER_STATUS_UPDATE_FAILED', error, {
                orderId,
                restaurantId,
                previousStatus,
                newStatus: status
            });
            throw new OrderEngineError(
                `Erro ao atualizar status do pedido: ${error.message}`,
                'ORDER_STATUS_UPDATE_FAILED'
            );
        }

        // Log sucesso (especialmente para ações KDS: preparing, ready)
        if (status === 'preparing' || status === 'ready') {
            Logger.info('ORDER_STATUS_UPDATED', {
                orderId,
                restaurantId,
                previousStatus,
                newStatus: status,
                source: 'KDS',
                action: status === 'preparing' ? 'prepare' : 'ready'
            });
        }

        // Audit log
        await logAuditEvent({
            action: 'order_status_changed',
            resourceEntity: 'gm_orders',
            resourceId: orderId,
            metadata: {
                restaurant_id: restaurantId,
                old_status: previousStatus,
                new_status: status,
                source: status === 'preparing' || status === 'ready' ? 'KDS' : 'TPV',
            },
        });
    }

    /**
     * Adicionar item ao pedido
     * 
     * HARD RULE 5: Lock otimista básico
     * Verifica se pedido ainda está no estado esperado antes de modificar.
     */
    static async addItemToOrder(
        orderId: string,
        item: OrderItemInput,
        restaurantId: string
    ): Promise<Order> {
        // Verificar se pedido está aberto
        const order = await this.getOrderById(orderId);
        if (order.status !== 'pending') {
            throw new OrderEngineError('Cannot add items to a closed order', 'ORDER_CLOSED');
        }
        if (order.restaurantId !== restaurantId) {
            throw new OrderEngineError('Order does not belong to restaurant', 'UNAUTHORIZED');
        }

        // HARD RULE 5: Verificar se pedido ainda está aberto (lock otimista)
        // Re-fetch para garantir que não foi modificado por outro operador
        const currentOrder = await this.getOrderById(orderId);
        if (currentOrder.status !== 'pending') {
            throw new OrderEngineError(
                'Pedido foi modificado por outro operador. Recarregue e tente novamente.',
                'CONCURRENT_MODIFICATION'
            );
        }

        // Criar item
        const { data: itemData, error } = await supabase
            .from('gm_order_items')
            .insert({
                order_id: orderId,
                product_id: item.productId || null,
                product_name: item.name, // Schema: product_name
                unit_price: item.priceCents, // Schema: unit_price
                quantity: item.quantity,
                total_price: item.priceCents * item.quantity, // Schema: total_price
                modifiers: item.modifiers || [],
                notes: item.notes || null,
                consumption_group_id: item.consumptionGroupId || null, // Para divisão de conta
            })
            .select()
            .single();

        if (error) {
            Logger.error('ORDER_ITEM_ADD_FAILED', error, { orderId, item, restaurantId });
            throw new OrderEngineError(
                'Erro ao adicionar item ao pedido. Verifique se o produto existe no menu.',
                'ITEM_ADD_FAILED'
            );
        }

        // Audit log
        if (itemData) {
            await logAuditEvent({
                action: 'order_item_added',
                resourceEntity: 'gm_order_items',
                resourceId: itemData.id,
                metadata: {
                    order_id: orderId,
                    restaurant_id: restaurantId,
                    product_id: item.productId,
                    quantity: item.quantity,
                    price_cents: item.priceCents,
                    consumption_group_id: item.consumptionGroupId,
                },
            });
        }

        // Trigger vai recalcular total automaticamente
        return this.getOrderById(orderId);
    }

    /**
     * Remover item do pedido
     */
    static async removeItemFromOrder(
        orderId: string,
        itemId: string,
        restaurantId: string
    ): Promise<Order> {
        // Verificar se pedido está aberto
        const order = await this.getOrderById(orderId);
        if (order.status !== 'pending') {
            throw new OrderEngineError(
                'Não é possível remover itens de um pedido fechado.',
                'ORDER_CLOSED'
            );
        }
        if (order.restaurantId !== restaurantId) {
            throw new OrderEngineError(
                'Pedido não pertence a este restaurante.',
                'UNAUTHORIZED'
            );
        }

        // Remover item
        const { error } = await supabase
            .from('gm_order_items')
            .delete()
            .eq('id', itemId)
            .eq('order_id', orderId);

        if (error) {
            Logger.error('ORDER_ITEM_REMOVE_FAILED', error, { orderId, itemId, restaurantId });
            throw new OrderEngineError(
                'Erro ao remover item do pedido. Tente novamente.',
                'ITEM_REMOVE_FAILED'
            );
        }

        // Audit log
        await logAuditEvent({
            action: 'order_item_removed',
            resourceEntity: 'gm_order_items',
            resourceId: itemId,
            metadata: {
                order_id: orderId,
                restaurant_id: restaurantId,
            },
        });

        // Trigger vai recalcular total automaticamente
        return this.getOrderById(orderId);
    }

    /**
     * Atualizar quantidade de item
     */
    static async updateItemQuantity(
        orderId: string,
        itemId: string,
        quantity: number,
        restaurantId: string
    ): Promise<Order> {
        if (quantity <= 0) {
            return this.removeItemFromOrder(orderId, itemId, restaurantId);
        }

        // Verificar se pedido está aberto
        const order = await this.getOrderById(orderId);
        if (order.status !== 'pending') {
            throw new OrderEngineError('Cannot update items in a closed order', 'ORDER_CLOSED');
        }
        if (order.restaurantId !== restaurantId) {
            throw new OrderEngineError('Order does not belong to restaurant', 'UNAUTHORIZED');
        }

        // HARD RULE 5: Lock otimista
        const currentOrder = await this.getOrderById(orderId);
        if (currentOrder.status !== 'pending') {
            throw new OrderEngineError(
                'Pedido foi modificado por outro operador. Recarregue e tente novamente.',
                'CONCURRENT_MODIFICATION'
            );
        }

        // Buscar item atual
        const item = order.items.find(i => i.id === itemId);
        if (!item) {
            throw new OrderEngineError(
                'Item não encontrado no pedido. Recarregue o pedido e tente novamente.',
                'ITEM_NOT_FOUND'
            );
        }

        // Atualizar quantidade e subtotal
        const { error } = await supabase
            .from('gm_order_items')
            .update({
                quantity,
                total_price: item.priceSnapshot * quantity, // Schema: total_price (and local item uses mapped property)
            })
            .eq('id', itemId)
            .eq('order_id', orderId);

        if (error) {
            Logger.error('ORDER_ITEM_UPDATE_FAILED', error, { orderId, itemId, quantity, restaurantId });
            throw new OrderEngineError(
                'Erro ao atualizar quantidade do item. Tente novamente.',
                'ITEM_UPDATE_FAILED'
            );
        }

        // Trigger vai recalcular total automaticamente
        return this.getOrderById(orderId);
    }

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
            tableNumber: dbOrder.table_number,
            tableId: dbOrder.table_id,
            status: dbOrder.status as OrderStatus,
            paymentStatus: dbOrder.payment_status as PaymentStatus,
            totalCents: dbOrder.total_amount, // Schema uses total_amount
            subtotalCents: dbOrder.total_amount, // MVP: Subtotal = Total
            taxCents: 0,
            discountCents: 0,
            source: dbOrder.source || 'tpv',
            operatorId: dbOrder.operator_id,
            cashRegisterId: dbOrder.cash_register_id,
            notes: dbOrder.notes,
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
                createdAt: new Date(item.created_at || new Date()), // Item might not have created_at in schema? Checked: No created_at in gm_order_items definition!
            })),
        };
    }
}

