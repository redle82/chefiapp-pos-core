import type { Order } from '../../pages/TPV/context/OrderContext';

export type ValidationResult = {
    allowed: boolean;
    reason?: string;
    code?: 'EMPTY_ORDER' | 'ALREADY_SENT' | 'PAYMENT_PENDING' | 'ALREADY_PAID';
};

export const canSendToKitchen = (order: Order): ValidationResult => {
    if (!order) return { allowed: false, reason: 'Pedido inválido' };

    if (order.items.length === 0) {
        return { allowed: false, reason: 'Pedido vazio', code: 'EMPTY_ORDER' };
    }

    if (order.status !== 'new') {
        return { allowed: false, reason: 'Pedido já enviado para cozinha', code: 'ALREADY_SENT' };
    }

    return { allowed: true };
};

export const canStartCheckout = (order: Order): ValidationResult => {
    if (!order) return { allowed: false, reason: 'Pedido inválido' };

    if (order.items.length === 0) {
        return { allowed: false, reason: 'Pedido vazio', code: 'EMPTY_ORDER' };
    }

    // In H2, we might allow checking out 'new' orders (skipping kitchen for drinks?)
    // But usually we expect flow: new -> kitchen -> served -> paid.
    // For now, permissive but sanity checked.

    if (order.status === 'served' || order.status === 'paid') { // assuming 'paid' exists or will exist
        return { allowed: false, reason: 'Pedido já finalizado', code: 'ALREADY_PAID' };
    }

    return { allowed: true };
};

export const canCloseTable = (order: Order): ValidationResult => {
    // Alias for checkout completion
    if (order.status === 'served') return { allowed: false, reason: 'Já fechada' };
    return { allowed: true };
};
