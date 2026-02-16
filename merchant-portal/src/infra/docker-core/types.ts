/**
 * Tipos canónicos para entidades do Core (gm_orders, gm_order_items, gm_tasks).
 * Alinhado com docker-core/schema (core_schema.sql, migrations).
 */

export interface CoreOrder {
  id: string;
  restaurant_id: string;
  table_id?: string | null;
  table_number?: number | null;
  status: string;
  payment_status: string;
  total_cents?: number | null;
  subtotal_cents?: number | null;
  tax_cents?: number | null;
  discount_cents?: number | null;
  source?: string | null;
  operator_id?: string | null;
  cash_register_id?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  sync_metadata?: Record<string, unknown> | null;
  origin?: string | null;
  in_prep_at?: string | null;
  ready_at?: string | null;
  served_at?: string | null;
  created_at: string;
  updated_at?: string | null;
  number?: string | null;
  short_id?: string | null;
}

export interface CoreOrderItem {
  id: string;
  order_id: string;
  product_id?: string | null;
  name_snapshot: string;
  price_snapshot: number;
  quantity: number;
  subtotal_cents: number;
  modifiers?: unknown[] | null;
  notes?: string | null;
  created_by_user_id?: string | null;
  created_by_role?: string | null;
  device_id?: string | null;
  created_at?: string | null;
  ready_at?: string | null;
  prep_time_seconds?: number | null;
  prep_category?: string | null;
  station?: string | null;
}

/** Mesa (gm_tables). Alias para uso em MapBuilder. */
export interface CoreRestaurantTable {
  id: string;
  restaurant_id: string;
  number: number;
  qr_code?: string | null;
  status?: string | null;
  zone_id?: string | null;
  pos_x?: number | null;
  pos_y?: number | null;
  created_at?: string;
}

/** Zona do mapa (gm_locations ou tabela de zonas). */
export interface CoreRestaurantZone {
  id: string;
  restaurant_id: string;
  code?: string | null;
  name: string;
  kind?: string | null;
  created_at?: string;
}

export interface CoreTask {
  id: string;
  restaurant_id: string;
  order_id?: string | null;
  order_item_id?: string | null;
  type?: string;
  task_type?: string;
  status: string;
  source_event?: string | null;
  payload?: Record<string, unknown> | null;
  context?: Record<string, unknown> | null;
  message?: string | null;
  priority?: string | null;
  station?: string | null;
  auto_generated?: boolean;
  created_at: string;
  updated_at?: string | null;
  acknowledged_at?: string | null;
  completed_at?: string | null;
  resolved_at?: string | null;
}
