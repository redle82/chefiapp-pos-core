export interface OrderItem {
    id: string;
    productId?: string;
    name: string;
    quantity: number;
    price: number; // In Cents (Integer)
    priceFormatted?: string;
    notes?: string;
    categoryName?: string; // Phase 55: Station Intelligence
    consumptionGroupId?: string | null;
    // KDS Phase 2.2
    status?: 'pending' | 'preparing' | 'ready' | 'voided';
    startedAt?: Date;
    completedAt?: Date;
    stationId?: string;
}

export interface Order {
    id: string;
    tableNumber?: number;
    tableId?: string;
    status: 'new' | 'preparing' | 'ready' | 'served' | 'paid' | 'partially_paid' | 'cancelled';
    items: OrderItem[];
    total: number; // In Cents (Integer)
    createdAt: Date;
    updatedAt: Date;
    // Core 5 -> Core 2 Flags
    isWebOrder?: boolean;
    origin?: 'web' | 'local' | 'external';
    service_source?: 'ubereats' | 'glovo' | 'deliveroo' | 'other';
    external_reference?: string;
    customerName?: string;
    transaction_id?: string; // Add transaction_id for consistency
    customerId?: string; // Sprint 12: Loyalty
}
