
export interface InventoryItem {
    id: string;
    restaurant_id: string;
    name: string;
    unit: 'kg' | 'g' | 'lt' | 'ml' | 'unit';
    stock_quantity: number;
    cost_per_unit: number; // In cents
    updated_at: string;
}

export interface Recipe {
    id: string;
    menu_item_id: string;
    inventory_item_id: string;
    quantity: number;
    inventory_item?: InventoryItem; // Joined
}

export interface StockMovement {
    id: string;
    inventory_item_id: string;
    type: 'IN' | 'OUT' | 'WASTE' | 'SALE';
    quantity: number;
    reason?: string;
    created_at: string;
    created_by?: string;
}
