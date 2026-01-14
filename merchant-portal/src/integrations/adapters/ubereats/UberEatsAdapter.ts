/**
 * UberEatsAdapter - Adapter para integração Uber Eats
 * 
 * FASE 3: Seguindo padrão Glovo
 */

// import { UberEatsOAuth } from './UberEatsOAuth'; // REMOVED: Security Hardening (Backend Only)
import type { UberEatsOrder, UberEatsOrderItem } from './UberEatsTypes';

const UBER_EATS_API_BASE = 'https://api.uber.com/v1/eats';

export interface UberEatsAdapterConfig {
    clientId: string;
    restaurantId: string;
}

export class UberEatsAdapter {
    // private oauth: UberEatsOAuth;

    constructor(config: UberEatsAdapterConfig) {
        // this.oauth = new UberEatsOAuth(config);
        console.warn('UberEatsAdapter (Frontend) is deprecated. Use Backend Webhooks.');
    }

    /**
     * Obter pedidos pendentes
     */
    async getPendingOrders(): Promise<UberEatsOrder[]> {
        /*
        const token = await this.oauth.getAccessToken();
        if (!token) {
            throw new Error('Uber Eats not authenticated');
        }

        const response = await fetch(`${UBER_EATS_API_BASE}/orders?status=PENDING`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Uber Eats API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.orders || [];
        */
        return [];
    }

    /**
     * Transformar pedido Uber Eats para formato interno
     */
    transformOrder(uberOrder: UberEatsOrder): {
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
            external_id: uberOrder.id,
            source: 'ubereats',
            restaurant_id: '', // Será preenchido pelo caller
            customer_name: `${uberOrder.customer.first_name} ${uberOrder.customer.last_name}`.trim(),
            customer_phone: uberOrder.customer.phone,
            customer_email: uberOrder.customer.email,
            delivery_address: uberOrder.delivery.address,
            items: uberOrder.items.map(item => ({
                product_id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                notes: item.notes,
            })),
            total_cents: Math.round(uberOrder.total * 100),
            currency: uberOrder.currency,
            status: uberOrder.status,
        };
    }

    /**
     * Aceitar pedido
     */
    async acceptOrder(orderId: string): Promise<void> {
        /*
        const token = await this.oauth.getAccessToken();
        if (!token) {
            throw new Error('Uber Eats not authenticated');
        }

        const response = await fetch(`${UBER_EATS_API_BASE}/orders/${orderId}/accept`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to accept order: ${response.statusText}`);
        }
        */
        throw new Error('Use Backend Integration');
    }

    /**
     * Health check
     */
    async healthCheck(): Promise<boolean> {
        return false;
    }
}
