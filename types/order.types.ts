// types/order.types.ts

export type OrderStatus =
  | "pending"
  | "sent"
  | "in_kitchen"
  | "ready"
  | "delivered"
  | "closed";

export interface OrderItemModifier {
  id: string;
  name: string;
  price: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  modifiers?: OrderItemModifier[];
}

export interface Order {
  id: string;
  tableId?: string;
  serviceType: "dine_in" | "take_away" | "delivery";
  status: OrderStatus;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  orderStartTime: string;
  total: number;
  discount?: number;
  deliveryFee?: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
}
