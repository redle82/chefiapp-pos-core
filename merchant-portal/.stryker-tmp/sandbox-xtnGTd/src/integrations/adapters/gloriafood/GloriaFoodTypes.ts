/**
 * GloriaFood Webhook Types
 * 
 * Baseado no formato padrão do GloriaFood (Oracle Food Delivery Cloud)
 * Ref: https://www.gloriafood.com/
 * 
 * Este módulo define os tipos do payload recebido via webhook.
 */

// ─────────────────────────────────────────────────────────────
// WEBHOOK EVENT TYPES
// ─────────────────────────────────────────────────────────────

export type GloriaFoodEventType = 
  | 'order.placed'
  | 'order.accepted'
  | 'order.rejected'
  | 'order.cancelled'
  | 'order.ready'
  | 'order.picked_up'
  | 'order.delivered';

// ─────────────────────────────────────────────────────────────
// ORDER PAYLOAD
// ─────────────────────────────────────────────────────────────

export interface GloriaFoodOrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;         // Preço unitário em centavos
  total_item_price: number;
  instructions?: string; // "Sem cebola", "Bem passado"
  options?: GloriaFoodItemOption[];
}

export interface GloriaFoodItemOption {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface GloriaFoodCustomer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address?: GloriaFoodAddress;
}

export interface GloriaFoodAddress {
  street: string;
  city: string;
  state?: string;
  postal_code?: string;
  country?: string;
  instructions?: string; // "Portão azul", "Interfone 12"
  latitude?: number;
  longitude?: number;
}

export interface GloriaFoodPayment {
  method: 'online' | 'cash' | 'card_on_delivery';
  status: 'paid' | 'pending' | 'failed';
  total: number;           // Total em centavos
  currency: string;        // 'BRL', 'USD', etc.
  tip?: number;
  delivery_fee?: number;
  discount?: number;
}

export interface GloriaFoodDelivery {
  type: 'delivery' | 'pickup' | 'dine_in';
  estimated_time?: number; // Minutos
  scheduled_for?: string;  // ISO timestamp se agendado
  driver?: {
    name: string;
    phone?: string;
  };
}

export interface GloriaFoodOrder {
  id: string;
  reference: string;       // Código curto para cliente (ex: "GF-1234")
  restaurant_id: string;
  created_at: string;      // ISO timestamp
  updated_at: string;
  
  status: 'new' | 'accepted' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled' | 'rejected';
  
  customer: GloriaFoodCustomer;
  items: GloriaFoodOrderItem[];
  payment: GloriaFoodPayment;
  delivery: GloriaFoodDelivery;
  
  instructions?: string;   // Instruções gerais do pedido
  source?: string;         // 'website', 'app', 'facebook', etc.
  
  // Metadata
  pos_id?: string;         // Se já vinculado a um POS
  external_id?: string;    // ID externo se repassado
}

// ─────────────────────────────────────────────────────────────
// WEBHOOK ENVELOPE
// ─────────────────────────────────────────────────────────────

export interface GloriaFoodWebhookPayload {
  event: GloriaFoodEventType;
  timestamp: string;       // ISO timestamp
  signature?: string;      // HMAC para validação
  data: {
    order: GloriaFoodOrder;
  };
}

// ─────────────────────────────────────────────────────────────
// VALIDATION HELPERS
// ─────────────────────────────────────────────────────────────

export const isValidGloriaFoodPayload = (payload: unknown): payload is GloriaFoodWebhookPayload => {
  if (!payload || typeof payload !== 'object') return false;
  
  const p = payload as Record<string, unknown>;
  
  return (
    typeof p.event === 'string' &&
    typeof p.timestamp === 'string' &&
    p.data !== null &&
    typeof p.data === 'object' &&
    (p.data as Record<string, unknown>).order !== undefined
  );
};

export const isNewOrderEvent = (payload: GloriaFoodWebhookPayload): boolean => {
  return payload.event === 'order.placed' && payload.data.order.status === 'new';
};

export const isCancellationEvent = (payload: GloriaFoodWebhookPayload): boolean => {
  return payload.event === 'order.cancelled' || payload.data.order.status === 'cancelled';
};
