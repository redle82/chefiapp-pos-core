/**
 * Consumption Group Types
 * 
 * "Conta dividida não é uma ação. É um estado da mesa."
 */

export interface ConsumptionGroup {
    id: string;
    restaurant_id: string;
    order_id: string;
    label: string;
    color: string;
    position: number;
    status: 'active' | 'paid' | 'cancelled';
    paid_at?: string;
    paid_by?: string;
    participants?: Array<{ name: string; email?: string }>;
    created_at: string;
    updated_at: string;
    // Calculated fields
    total_amount?: number;
    items_count?: number;
}

export interface CreateConsumptionGroupInput {
    order_id: string;
    label: string;
    color?: string;
}

export interface UpdateConsumptionGroupInput {
    label?: string;
    color?: string;
    status?: 'active' | 'paid' | 'cancelled';
}

export interface PayConsumptionGroupInput {
    payment_method: string;
    amount_cents: number;
}
