/**
 * Order Validation - Regras de negócio para pedidos
 * 
 * Bug #4 Fix: Validação obrigatória antes de permitir pagamento
 */

import { Order, OrderItem } from '@/context/OrderContext';

/**
 * canPayOrder - Regra de ouro: NUNCA pode pagar um pedido com itens != delivered
 * 
 * Validação estrutural:
 * - Pedido deve estar em status 'delivered'
 * - Todos os itens devem estar entregues (verificado via status do pedido)
 * - Pedido não pode estar já pago
 * 
 * @param order - Pedido a ser validado
 * @returns { canPay: boolean, reason?: string }
 */
export function canPayOrder(order: Order): { canPay: boolean; reason?: string } {
    // 1. Pedido não pode estar já pago
    if (order.status === 'paid') {
        return {
            canPay: false,
            reason: 'Pedido já foi pago.'
        };
    }

    // 2. Pedido deve estar em status 'delivered'
    // Nota: Se o pedido está 'delivered', assumimos que todos os itens foram entregues
    // Isso é garantido pelo fluxo: itens entregues → pedido marcado como 'delivered'
    if (order.status !== 'delivered') {
        return {
            canPay: false,
            reason: `Pedido está com status '${order.status}'. Deve estar entregue para pagar.`
        };
    }

    // 3. Validação adicional: verificar se há itens no pedido
    if (!order.items || order.items.length === 0) {
        return {
            canPay: false,
            reason: 'Pedido não possui itens.'
        };
    }

    return { canPay: true };
}

/**
 * getUndeliveredItems - Retorna lista de itens não entregues
 * Nota: Como OrderItem não tem status, verificamos via status do pedido
 */
export function getUndeliveredItems(order: Order): OrderItem[] {
    // Se pedido não está delivered, todos os itens não entregues
    if (order.status !== 'delivered') {
        return order.items;
    }
    // Se está delivered, nenhum item não entregue
    return [];
}
