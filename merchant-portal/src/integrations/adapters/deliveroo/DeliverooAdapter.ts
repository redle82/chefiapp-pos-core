/**
 * DeliverooAdapter - Adapter para integração Deliveroo
 * 
 * FASE 3: Seguindo padrão Glovo/Uber Eats
 */

import { DeliverooOAuth } from './DeliverooOAuth';
import type { DeliverooOrder, DeliverooOrderItem } from './DeliverooTypes';

const DELIVEROO_API_BASE = 'https://api.deliveroo.com/v1';

export interface DeliverooAdapterConfig {
    clientId: string;
    restaurantId: string;
}

export class DeliverooAdapter {
    private oauth: DeliverooOAuth;

    constructor(config: DeliverooAdapterConfig) {
        this.oauth = new DeliverooOAuth(config);
    }

    /**
     * Obter pedidos pendentes
     */
    async getPendingOrders(): Promise<DeliverooOrder[]> {
        const token = await this.oauth.getAccessToken();
        if (!token) {
            throw new Error('Deliveroo not authenticated');
        }

        const response = await fetch(`${DELIVEROO_API_BASE}/orders?status=PENDING`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Deliveroo API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.orders || [];
    }

    /**
     * Transformar pedido Deliveroo para formato interno
     */
    transformOrder(deliverooOrder: DeliverooOrder): {
        external_id: string;
        source: string;
        restaurant_id: string;
        customer_name: string;
        customer_phone: string;
        customer_email?: string;
        delivery_address: string;
        items: any[];
        total_cents: number;
        currency: string;
        status: string;
    } {
        return {
            external_id: deliverooOrder.id,
            source: 'deliveroo',
            restaurant_id: '', // Será preenchido pelo caller
            customer_name: `${deliverooOrder.customer.first_name} ${deliverooOrder.customer.last_name}`.trim(),
            customer_phone: deliverooOrder.customer.phone,
            customer_email: deliverooOrder.customer.email,
            delivery_address: deliverooOrder.delivery.address,
            items: deliverooOrder.items.map(item => ({
                product_id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                notes: item.notes,
            })),
            total_cents: Math.round(deliverooOrder.total * 100),
            currency: deliverooOrder.currency,
            status: deliverooOrder.status,
        };
    }

    /**
     * Aceitar pedido
     */
    async acceptOrder(orderId: string): Promise<void> {
        const token = await this.oauth.getAccessToken();
        if (!token) {
            throw new Error('Deliveroo not authenticated');
        }

        const response = await fetch(`${DELIVEROO_API_BASE}/orders/${orderId}/accept`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to accept order: ${response.statusText}`);
        }
    }

    /**
     * Health check
     */
    async healthCheck(): Promise<boolean> {
        try {
            const token = await this.oauth.getAccessToken();
            return !!token;
        } catch {
            return false;
        }
    }
}
