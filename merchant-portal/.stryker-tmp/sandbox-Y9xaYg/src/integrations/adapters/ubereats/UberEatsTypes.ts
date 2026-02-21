/**
 * UberEatsTypes - Tipos TypeScript para API Uber Eats
 * 
 * FASE 3: Integração Uber Eats
 */

export interface UberEatsOrder {
    id: string;
    status: 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'CANCELLED';
    customer: {
        first_name: string;
        last_name: string;
        phone: string;
        email?: string;
    };
    delivery: {
        address: string;
        city: string;
        postal_code?: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
    items: UberEatsOrderItem[];
    total: number;
    currency: string;
    created_at: string;
    scheduled_time?: string;
}

export interface UberEatsOrderItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
}

export interface UberEatsOAuthToken {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
}
