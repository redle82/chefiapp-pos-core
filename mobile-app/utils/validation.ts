/**
 * Utilitários de validação
 */

export interface ValidationResult {
    valid: boolean;
    error?: string;
}

/**
 * Valida valor monetário
 */
export const validateAmount = (value: string): ValidationResult => {
    const num = parseFloat(value.replace(',', '.'));

    if (isNaN(num)) {
        return { valid: false, error: 'Valor inválido' };
    }

    if (num < 0) {
        return { valid: false, error: 'Valor não pode ser negativo' };
    }

    if (num > 100000) {
        return { valid: false, error: 'Valor muito alto (máximo: €100.000)' };
    }

    return { valid: true };
};

/**
 * Valida se pedido pode ser pago
 */
export const canPayOrder = (order: { status: string; items?: any[] }): ValidationResult => {
    // Validar que não está já pago
    if (order.status === 'paid') {
        return {
            valid: false,
            error: 'Pedido já foi pago'
        };
    }

    // Validar que pedido está entregue
    if (order.status !== 'delivered') {
        return {
            valid: false,
            error: 'Pedido deve estar entregue antes de pagar'
        };
    }

    return { valid: true };
};
