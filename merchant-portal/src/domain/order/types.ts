/**
 * Order Domain Types
 *
 * Tipos finitos para o domínio de pedidos.
 * Sem dependências de React ou infraestrutura.
 */

/** Status de um pedido */
export type OrderStatus =
  | "OPEN"
  | "PREPARING"
  | "READY"
  | "DELIVERED"
  | "PAID"
  | "CANCELLED";

/** Status de pagamento de um pedido */
export type OrderPaymentStatus = "unpaid" | "partial" | "paid";

/** Tipo de pedido */
export type OrderType = "dine_in" | "takeaway" | "delivery";

/** Item de um pedido */
export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  modifiers?: OrderItemModifier[];
  notes?: string;
}

/** Modificador de item */
export interface OrderItemModifier {
  id: string;
  name: string;
  price: number;
}

/** Pedido completo */
export interface Order {
  id: string;
  restaurantId: string;
  status: OrderStatus;
  type: OrderType;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  tableNumber?: string;
  customerName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/** Pagamento associado a um pedido */
export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: string;
  status: "pending" | "completed" | "failed" | "refunded";
  createdAt: string;
}

/** Resumo de totais do pedido */
export interface OrderTotals {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  itemCount: number;
}
