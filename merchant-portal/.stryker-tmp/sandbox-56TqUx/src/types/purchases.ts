/**
 * Purchase Types - Supply Loop
 */
// @ts-nocheck


export interface Supplier {
  id: string;
  restaurant_id: string;
  name: string;
  category: 'HORTIFRUTI' | 'CARNES' | 'BEBIDAS' | 'LIMPEZA' | 'OUTROS';
  contact_phone?: string;
  contact_email?: string;
  lead_time_days: number; // Dias para entrega
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export interface ShoppingListItem {
  id: string;
  restaurant_id: string;
  ingredient_id: string;
  ingredient_name: string;
  quantity: number;
  unit: string;
  reason: 'STOCK_CRITICAL' | 'DEMAND_FORECAST' | 'MANUAL';
  supplier_id?: string;
  estimated_cost?: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  restaurant_id: string;
  supplier_id: string;
  items: PurchaseOrderItem[];
  total_cost: number;
  status: 'DRAFT' | 'SENT' | 'RECEIVED' | 'CANCELLED';
  expected_delivery_date?: string;
  received_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  ingredient_id: string;
  ingredient_name: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  received_quantity?: number;
  notes?: string;
}
