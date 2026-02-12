/**
 * DOCKER CORE TYPES
 *
 * Tipos TypeScript que refletem o schema congelado do Core.
 *
 * Estes tipos são a fonte de verdade para a UI.
 * Qualquer mudança aqui deve refletir uma mudança no schema do Core.
 */

/**
 * Status de pedido conforme definido no Core.
 */
export type OrderStatus = "OPEN" | "IN_PREP" | "READY" | "PAID" | "CANCELLED";

/**
 * Status de pagamento conforme definido no Core.
 */
export type PaymentStatus = "PENDING" | "PAID" | "PARTIALLY_PAID" | "REFUNDED";

/**
 * Origem do pedido conforme definido no Core.
 *
 * FASE 3.2: Re-exporta do contrato centralizado para manter compatibilidade.
 * O contrato centralizado inclui todos os valores usados no sistema.
 */
import type { OrderOrigin } from "../../core/contracts";
export type { OrderOrigin } from "../../core/contracts";

/**
 * Método de pagamento conforme definido no Core.
 */
export type PaymentMethod = "cash" | "card" | "loyalty" | "other";

/**
 * Pedido conforme schema do Core (gm_orders).
 */
export interface CoreOrder {
  id: string;
  restaurant_id: string;
  table_id: string | null;
  table_number: number | null;
  status: OrderStatus;
  payment_status: PaymentStatus | null;
  total_cents: number;
  created_at: string;
  updated_at: string;
  short_id: string | null;
  number: number | null;
  sync_metadata: {
    origin?: OrderOrigin;
    [key: string]: any;
  } | null;
}

/**
 * Item de pedido conforme schema do Core (gm_order_items).
 */
export interface CoreOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  name_snapshot: string;
  price_snapshot: number; // em centavos
  quantity: number;
  subtotal_cents: number;
  notes: string | null;
  // Prep time snapshot (para timer por item, não por pedido)
  prep_time_seconds: number | null; // Snapshot do prep_time do produto no momento do pedido
  prep_category: "drink" | "starter" | "main" | "dessert" | null; // Snapshot da categoria
  // Station snapshot (BAR vs KITCHEN)
  station: "BAR" | "KITCHEN" | null; // Snapshot do station do produto no momento do pedido
  // FASE 1: Fechamento operacional
  ready_at: string | null; // Timestamp quando o item foi marcado como pronto
  created_at: string;
  updated_at: string;
}

/**
 * Mesa conforme schema do Core (gm_tables).
 */
export interface CoreTable {
  id: string;
  restaurant_id: string;
  number: number;
  status: "free" | "occupied" | "reserved";
  seats: number;
  x: number | null;
  y: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Tarefa conforme schema do Core (gm_tasks).
 * TASK ENGINE: Tarefas automáticas baseadas em eventos operacionais.
 * TASK PACKS: Suporte para templates e evidências.
 */
export interface CoreTask {
  id: string;
  restaurant_id: string;
  order_id: string | null;
  order_item_id: string | null;
  template_id: string | null; // Link para template (TASK PACKS)
  task_type:
    | "ATRASO_ITEM"
    | "ACUMULO_BAR"
    | "ENTREGA_PENDENTE"
    | "ITEM_CRITICO"
    | "PEDIDO_ESQUECIDO"
    | "ESTOQUE_CRITICO"
    | "RUPTURA_PREVISTA"
    | "EQUIPAMENTO_CHECK"
    | "PEDIDO_NOVO"
    | "MODO_INTERNO";
  station: "BAR" | "KITCHEN" | "SERVICE" | null;
  priority: "LOW" | "MEDIA" | "ALTA" | "CRITICA";
  message: string;
  context: {
    item_name?: string;
    item_id?: string;
    expected_seconds?: number;
    elapsed_seconds?: number;
    delay_seconds?: number;
    delay_ratio?: number;
    table_number?: number;
    order_id?: string;
    order_number?: number;
    template_code?: string;
    pack_code?: string;
    category?: string;
    department?: string;
    required_evidence?: string;
    legal_weight?: string;
    role_targets?: string[];
    scheduled_for?: string;
    [key: string]: any;
  };
  evidence_json: {
    temperature?: number;
    photo_url?: string;
    signature?: string;
    text?: string;
    [key: string]: any;
  };
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "DISMISSED";
  assigned_to: string | null;
  created_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  updated_at: string;
  auto_generated: boolean;
  source_event: string | null;
  date_bucket: string | null; // Para idempotência de tarefas agendadas
  turn_session_id?: string | null; // FASE 3 Passo 2: tarefas no contexto do turno
}

/**
 * Task Template conforme schema do Core (gm_task_templates).
 */
export interface CoreTaskTemplate {
  id: string;
  pack_id: string;
  code: string;
  title: string;
  description: string | null;
  category: string;
  department: string | null;
  station: "BAR" | "KITCHEN" | "SERVICE" | null;
  role_targets: string[];
  schedule_cron: string | null;
  event_trigger: string | null;
  required_evidence: "NONE" | "TEMP_LOG" | "PHOTO" | "SIGNATURE" | "TEXT";
  legal_weight: "NONE" | "RECOMMENDED" | "REQUIRED" | "AUDIT_CRITICAL";
  context_schema: Record<string, any> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Task Pack conforme schema do Core (gm_task_packs).
 * OPERACAO: Extendido com contexto operacional.
 */
export interface CoreTaskPack {
  id: string;
  code: string;
  name: string;
  version: string;
  description: string | null;
  country_code: string | null;
  region_code: string | null;
  org_mode: "SOLO" | "SMB" | "ENTERPRISE";
  min_team_size: number | null;
  max_team_size: number | null;
  min_tables: number | null;
  max_tables: number | null;
  operation_type:
    | "AMBULANTE"
    | "BAR"
    | "RESTAURANTE"
    | "RESTAURANTE_GRANDE"
    | "MULTIUNIDADE"
    | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Restaurant Zone conforme schema do Core (gm_restaurant_zones).
 */
export interface CoreRestaurantZone {
  id: string;
  restaurant_id: string;
  code: string; // 'BAR', 'KITCHEN', 'PASS', 'SERVICE', 'CASHIER', etc
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Restaurant Table conforme schema do Core (gm_restaurant_tables).
 */
export interface CoreRestaurantTable {
  id: string;
  restaurant_id: string;
  zone_id: string | null;
  number: number;
  name: string | null;
  capacity: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Operation Version conforme schema do Core (gm_operation_versions).
 */
export interface CoreOperationVersion {
  id: string;
  restaurant_id: string;
  menu_version: string;
  task_version: string;
  map_version: string;
  is_active: boolean;
  is_draft: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  published_by: string | null;
  notes: string | null;
}
