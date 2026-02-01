/**
 * Types - Contratos explícitos entre UI e Core
 *
 * Define os tipos que a UI v2 espera do Core.
 * Se o Core mudar, estes tipos quebram aqui primeiro.
 */

export interface Order {
  id: string;
  restaurant_id: string;
  table_id?: string;
  table_number?: number;
  status: string;
  payment_status: string;
  total_cents: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Table {
  id: string;
  restaurant_id: string;
  number: number;
  status: string;
  qr_code?: string;
}

export interface Product {
  id: string;
  restaurant_id: string;
  name: string;
  price_cents: number;
  available: boolean;
  category_id?: string;
}

export interface CoreState {
  restaurantId: string;
  activeOrders: Order[];
  tables: Table[];
  products: Product[];
  issues: ActiveIssue[];
  health: 'healthy' | 'warning' | 'error';
}

export interface ActiveIssue {
  type: 'delayed' | 'blocked' | 'error' | 'offline';
  message: string;
  orderId?: string;
  tableId?: string;
  severity: 'low' | 'medium' | 'high';
}

export interface CreateOrderInput {
  restaurantId: string;
  tableId: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  paymentMethod?: string;
}
