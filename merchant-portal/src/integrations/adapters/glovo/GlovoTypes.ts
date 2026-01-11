/**
 * Glovo API Types
 * 
 * Baseado na API oficial do Glovo
 * Ref: https://open-api.glovoapp.com/
 * 
 * Este módulo define os tipos da API do Glovo.
 */

// ─────────────────────────────────────────────────────────────
// ORDER STATUS
// ─────────────────────────────────────────────────────────────

export type GlovoOrderStatus = 
  | 'PENDING'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

// ─────────────────────────────────────────────────────────────
// ORDER ITEM
// ─────────────────────────────────────────────────────────────

export interface GlovoOrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;         // Preço unitário
  total: number;         // Preço total (price * quantity)
  notes?: string;        // Observações do item
  modifiers?: GlovoItemModifier[];
}

export interface GlovoItemModifier {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

// ─────────────────────────────────────────────────────────────
// CUSTOMER
// ─────────────────────────────────────────────────────────────

export interface GlovoCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

// ─────────────────────────────────────────────────────────────
// DELIVERY ADDRESS
// ─────────────────────────────────────────────────────────────

export interface GlovoDeliveryAddress {
  address: string;
  city: string;
  postal_code?: string;
  country?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  instructions?: string; // Instruções de entrega
}

// ─────────────────────────────────────────────────────────────
// ORDER
// ─────────────────────────────────────────────────────────────

export interface GlovoOrder {
  id: string;
  status: GlovoOrderStatus;
  customer: GlovoCustomer;
  delivery: {
    address: GlovoDeliveryAddress;
    estimated_time?: number; // Minutos estimados
    scheduled_time?: string; // ISO timestamp se agendado
  };
  items: GlovoOrderItem[];
  total: number;         // Total do pedido
  currency: string;      // 'EUR', 'BRL', etc.
  created_at: string;    // ISO timestamp
  updated_at?: string;   // ISO timestamp
  instructions?: string; // Instruções gerais do pedido
  restaurant_id?: string; // ID do restaurante no Glovo
}

// ─────────────────────────────────────────────────────────────
// API RESPONSES
// ─────────────────────────────────────────────────────────────

export interface GlovoOrdersResponse {
  orders: GlovoOrder[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface GlovoOrderResponse {
  order: GlovoOrder;
}

// ─────────────────────────────────────────────────────────────
// OAUTH
// ─────────────────────────────────────────────────────────────

export interface GlovoOAuthTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;    // Segundos até expirar
  refresh_token?: string;
  scope?: string;
}

export interface GlovoOAuthError {
  error: string;
  error_description?: string;
}

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────

export interface GlovoConfig {
  restaurantId: string;
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  enabled?: boolean;
  webhookSecret?: string; // Para validação de webhooks
}

// ─────────────────────────────────────────────────────────────
// VALIDATION HELPERS
// ─────────────────────────────────────────────────────────────

export const isValidGlovoOrder = (order: unknown): order is GlovoOrder => {
  if (!order || typeof order !== 'object') return false;
  
  const o = order as Record<string, unknown>;
  
  return (
    typeof o.id === 'string' &&
    typeof o.status === 'string' &&
    typeof o.customer === 'object' &&
    typeof o.delivery === 'object' &&
    Array.isArray(o.items) &&
    typeof o.total === 'number' &&
    typeof o.currency === 'string' &&
    typeof o.created_at === 'string'
  );
};

export const isPendingOrder = (order: GlovoOrder): boolean => {
  return order.status === 'PENDING';
};

export const isCancelledOrder = (order: GlovoOrder): boolean => {
  return order.status === 'CANCELLED';
};
