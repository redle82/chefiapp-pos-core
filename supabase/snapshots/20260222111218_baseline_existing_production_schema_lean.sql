-- Lean baseline snapshot (tables + constraints + indexes)
-- Source: supabase/migrations/20260222111218_baseline_existing_production_schema.sql
-- Generated at: 2026-02-22

CREATE TABLE IF NOT EXISTS public.billing_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  provider text NOT NULL,
  currency text NOT NULL DEFAULT 'EUR'::text,
  enabled boolean NOT NULL DEFAULT false,
  credentials_ref text,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_store (
  sequence_id bigint NOT NULL DEFAULT nextval('event_store_sequence_id_seq'::regclass),
  event_id uuid NOT NULL,
  stream_type text NOT NULL,
  stream_id text NOT NULL,
  stream_version integer NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  idempotency_key text
);

CREATE TABLE IF NOT EXISTS public.gm_cash_registers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Caixa Principal'::text,
  status text NOT NULL DEFAULT 'closed'::text,
  opened_at timestamp with time zone,
  closed_at timestamp with time zone,
  opened_by text,
  closed_by text,
  opening_balance_cents bigint DEFAULT 0,
  closing_balance_cents bigint,
  total_sales_cents bigint DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gm_catalog_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  menu_id uuid NOT NULL,
  title text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gm_catalog_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  price_cents integer NOT NULL DEFAULT 0,
  image_url text,
  video_url text,
  allergens jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_available boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gm_catalog_menus (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  name text NOT NULL,
  language text NOT NULL DEFAULT 'pt-BR'::text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gm_equipment (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  location_id uuid,
  name text NOT NULL,
  kind text NOT NULL,
  capacity_note text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gm_ingredients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  name text NOT NULL,
  unit text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gm_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  name text NOT NULL,
  kind text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gm_menu_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurant_id uuid,
  name text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gm_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  product_id uuid,
  name_snapshot text NOT NULL,
  price_snapshot integer NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  subtotal_cents integer NOT NULL,
  modifiers jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_by_user_id uuid,
  created_by_role text,
  device_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  prep_time_seconds integer,
  prep_category text,
  station text,
  ready_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.gm_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  table_id uuid,
  table_number integer,
  status text NOT NULL DEFAULT 'OPEN'::text,
  payment_status text NOT NULL DEFAULT 'PENDING'::text,
  total_cents integer DEFAULT 0,
  subtotal_cents integer DEFAULT 0,
  tax_cents integer DEFAULT 0,
  discount_cents integer DEFAULT 0,
  source text DEFAULT 'tpv'::text,
  operator_id uuid,
  cash_register_id uuid,
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  sync_metadata jsonb,
  origin text,
  in_prep_at timestamp with time zone,
  ready_at timestamp with time zone,
  served_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gm_payment_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  order_id uuid,
  operator_id uuid,
  amount_cents integer,
  method text,
  result text NOT NULL,
  error_code text,
  error_message text,
  idempotency_key text,
  payment_id uuid,
  duration_ms integer,
  client_info jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gm_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  order_id uuid NOT NULL,
  cash_register_id uuid,
  operator_id uuid,
  amount_cents bigint NOT NULL,
  currency text NOT NULL DEFAULT 'EUR'::text,
  payment_method text NOT NULL,
  status text NOT NULL DEFAULT 'paid'::text,
  idempotency_key text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  payment_provider text,
  external_checkout_id text,
  external_payment_id text,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.gm_product_bom (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  product_id uuid NOT NULL,
  ingredient_id uuid NOT NULL,
  qty_per_unit numeric NOT NULL,
  station text NOT NULL,
  preferred_location_kind text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gm_products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurant_id uuid,
  category_id uuid,
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL DEFAULT 0,
  photo_url text,
  available boolean DEFAULT true,
  track_stock boolean DEFAULT false,
  stock_quantity numeric DEFAULT 0,
  cost_price_cents integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  prep_time_seconds integer DEFAULT 300,
  prep_category text DEFAULT 'main'::text,
  station text DEFAULT 'KITCHEN'::text
);

CREATE TABLE IF NOT EXISTS public.gm_restaurant_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurant_id uuid,
  user_id uuid NOT NULL,
  role text DEFAULT 'staff'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gm_restaurants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid,
  name text NOT NULL,
  slug text,
  description text,
  owner_id uuid,
  status text NOT NULL DEFAULT 'draft'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  billing_status text DEFAULT 'trial'::text,
  product_mode text NOT NULL DEFAULT 'demo'::text,
  onboarding_completed_at timestamp with time zone,
  menu_catalog_enabled boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.gm_staff (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  name text NOT NULL,
  role text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gm_stock_ledger (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  location_id uuid NOT NULL,
  ingredient_id uuid NOT NULL,
  order_id uuid,
  order_item_id uuid,
  action text NOT NULL,
  qty numeric NOT NULL,
  reason text,
  created_by_role text,
  created_by_user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gm_stock_levels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  location_id uuid NOT NULL,
  ingredient_id uuid NOT NULL,
  qty numeric NOT NULL DEFAULT 0,
  min_qty numeric NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gm_tables (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurant_id uuid,
  number integer NOT NULL,
  qr_code text,
  status text DEFAULT 'closed'::text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gm_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  order_id uuid,
  order_item_id uuid,
  task_type text NOT NULL,
  station text,
  priority text NOT NULL DEFAULT 'MEDIA'::text,
  message text NOT NULL,
  context jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'OPEN'::text,
  assigned_to uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  acknowledged_at timestamp with time zone,
  resolved_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now(),
  auto_generated boolean DEFAULT true,
  source_event text
);

CREATE TABLE IF NOT EXISTS public.gm_terminals (
  id uuid NOT NULL,
  restaurant_id uuid NOT NULL,
  type text NOT NULL,
  name text NOT NULL,
  registered_at timestamp with time zone DEFAULT now(),
  last_heartbeat_at timestamp with time zone,
  last_seen_at timestamp with time zone,
  status text NOT NULL DEFAULT 'active'::text,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.installed_modules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  module_id character varying NOT NULL,
  module_name character varying NOT NULL,
  version character varying DEFAULT '1.0.0'::character varying,
  installed_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  status character varying DEFAULT 'active'::character varying,
  config jsonb DEFAULT '{}'::jsonb,
  dependencies text[] DEFAULT ARRAY[]::text[],
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.legal_seals (
  seal_id text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  legal_state text NOT NULL,
  seal_event_id uuid NOT NULL,
  stream_hash text NOT NULL,
  financial_state_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  sealed_at timestamp with time zone NOT NULL DEFAULT now(),
  legal_sequence_id integer NOT NULL DEFAULT nextval('legal_seals_legal_sequence_id_seq'::regclass)
);

CREATE TABLE IF NOT EXISTS public.module_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  module_id character varying NOT NULL,
  role character varying NOT NULL,
  permissions text[] NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.saas_tenants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shift_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  role text NOT NULL,
  start_time timestamp with time zone NOT NULL DEFAULT now(),
  end_time timestamp with time zone,
  duration_minutes integer,
  status text NOT NULL DEFAULT 'active'::text,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider character varying(50) NOT NULL,
  event_type character varying(100),
  event_id character varying(255) NOT NULL,
  raw_payload jsonb DEFAULT '{}'::jsonb,
  signature character varying(512),
  status character varying(20) DEFAULT 'PENDING'::character varying,
  merchant_code character varying(100),
  order_id character varying(255),
  payment_reference character varying(255),
  verified_at timestamp with time zone,
  processed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS billing_configs_restaurant_id_provider_key ON public.billing_configs USING btree (restaurant_id, provider);

CREATE UNIQUE INDEX IF NOT EXISTS event_store_stream_type_stream_id_stream_version_key ON public.event_store USING btree (stream_type, stream_id, stream_version);

CREATE UNIQUE INDEX IF NOT EXISTS gm_equipment_restaurant_id_name_key ON public.gm_equipment USING btree (restaurant_id, name);

CREATE UNIQUE INDEX IF NOT EXISTS gm_ingredients_restaurant_id_name_key ON public.gm_ingredients USING btree (restaurant_id, name);

CREATE UNIQUE INDEX IF NOT EXISTS gm_locations_restaurant_id_name_key ON public.gm_locations USING btree (restaurant_id, name);

CREATE UNIQUE INDEX IF NOT EXISTS gm_product_bom_restaurant_id_product_id_ingredient_id_key ON public.gm_product_bom USING btree (restaurant_id, product_id, ingredient_id);

CREATE UNIQUE INDEX IF NOT EXISTS gm_restaurants_slug_key ON public.gm_restaurants USING btree (slug);

CREATE UNIQUE INDEX IF NOT EXISTS gm_stock_levels_restaurant_id_location_id_ingredient_id_key ON public.gm_stock_levels USING btree (restaurant_id, location_id, ingredient_id);

CREATE UNIQUE INDEX IF NOT EXISTS gm_tables_restaurant_id_number_key ON public.gm_tables USING btree (restaurant_id, number);

CREATE INDEX IF NOT EXISTS idx_billing_configs_restaurant_id ON public.billing_configs USING btree (restaurant_id);

CREATE INDEX IF NOT EXISTS idx_bom_ingredient ON public.gm_product_bom USING btree (ingredient_id);

CREATE INDEX IF NOT EXISTS idx_bom_product ON public.gm_product_bom USING btree (product_id);

CREATE INDEX IF NOT EXISTS idx_bom_restaurant ON public.gm_product_bom USING btree (restaurant_id);

CREATE INDEX IF NOT EXISTS idx_equipment_location ON public.gm_equipment USING btree (location_id) WHERE (location_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_equipment_restaurant ON public.gm_equipment USING btree (restaurant_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_event_store_idempotency ON public.event_store USING btree (idempotency_key) WHERE (idempotency_key IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_event_store_stream ON public.event_store USING btree (stream_type, stream_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_gm_cash_registers_one_open ON public.gm_cash_registers USING btree (restaurant_id) WHERE (status = 'open'::text);

CREATE INDEX IF NOT EXISTS idx_gm_catalog_categories_menu ON public.gm_catalog_categories USING btree (menu_id);

CREATE INDEX IF NOT EXISTS idx_gm_catalog_items_available ON public.gm_catalog_items USING btree (category_id, is_available) WHERE (is_available = true);

CREATE INDEX IF NOT EXISTS idx_gm_catalog_items_category ON public.gm_catalog_items USING btree (category_id);

CREATE INDEX IF NOT EXISTS idx_gm_catalog_menus_active ON public.gm_catalog_menus USING btree (restaurant_id, is_active) WHERE (is_active = true);

CREATE INDEX IF NOT EXISTS idx_gm_catalog_menus_restaurant ON public.gm_catalog_menus USING btree (restaurant_id);

CREATE INDEX IF NOT EXISTS idx_gm_payments_external_checkout ON public.gm_payments USING btree (external_checkout_id) WHERE (external_checkout_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_gm_payments_external_payment ON public.gm_payments USING btree (external_payment_id) WHERE (external_payment_id IS NOT NULL);

CREATE UNIQUE INDEX IF NOT EXISTS idx_gm_payments_idempotency ON public.gm_payments USING btree (idempotency_key) WHERE (idempotency_key IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_gm_payments_provider ON public.gm_payments USING btree (payment_provider, created_at DESC) WHERE (payment_provider IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_gm_restaurant_members_restaurant ON public.gm_restaurant_members USING btree (restaurant_id);

CREATE INDEX IF NOT EXISTS idx_gm_restaurant_members_user ON public.gm_restaurant_members USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_gm_staff_restaurant ON public.gm_staff USING btree (restaurant_id);

CREATE INDEX IF NOT EXISTS idx_gm_terminals_restaurant ON public.gm_terminals USING btree (restaurant_id);

CREATE INDEX IF NOT EXISTS idx_gm_terminals_restaurant_type ON public.gm_terminals USING btree (restaurant_id, type);

CREATE INDEX IF NOT EXISTS idx_ingredients_restaurant ON public.gm_ingredients USING btree (restaurant_id);

CREATE INDEX IF NOT EXISTS idx_installed_modules_module_id ON public.installed_modules USING btree (module_id);

CREATE INDEX IF NOT EXISTS idx_installed_modules_restaurant ON public.installed_modules USING btree (restaurant_id);

CREATE INDEX IF NOT EXISTS idx_installed_modules_status ON public.installed_modules USING btree (status);

CREATE INDEX IF NOT EXISTS idx_ledger_ingredient ON public.gm_stock_ledger USING btree (ingredient_id);

CREATE INDEX IF NOT EXISTS idx_ledger_location ON public.gm_stock_ledger USING btree (location_id);

CREATE INDEX IF NOT EXISTS idx_ledger_order ON public.gm_stock_ledger USING btree (order_id) WHERE (order_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_ledger_restaurant_time ON public.gm_stock_ledger USING btree (restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_legal_seals_entity ON public.legal_seals USING btree (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_locations_kind ON public.gm_locations USING btree (restaurant_id, kind);

CREATE INDEX IF NOT EXISTS idx_locations_restaurant ON public.gm_locations USING btree (restaurant_id);

CREATE INDEX IF NOT EXISTS idx_module_permissions_module ON public.module_permissions USING btree (module_id);

CREATE INDEX IF NOT EXISTS idx_module_permissions_restaurant ON public.module_permissions USING btree (restaurant_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_open_order_per_table ON public.gm_orders USING btree (table_id) WHERE ((status = 'OPEN'::text) AND (table_id IS NOT NULL));

CREATE INDEX IF NOT EXISTS idx_order_items_author ON public.gm_order_items USING btree (order_id, created_by_user_id, created_by_role);

CREATE INDEX IF NOT EXISTS idx_order_items_device ON public.gm_order_items USING btree (device_id) WHERE (device_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.gm_order_items USING btree (order_id);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.gm_orders USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status ON public.gm_orders USING btree (restaurant_id, status);

CREATE INDEX IF NOT EXISTS idx_orders_table_id ON public.gm_orders USING btree (table_id) WHERE (table_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_payment_audit_restaurant_date ON public.gm_payment_audit_logs USING btree (restaurant_id, created_at);

CREATE INDEX IF NOT EXISTS idx_products_restaurant ON public.gm_products USING btree (restaurant_id);

CREATE INDEX IF NOT EXISTS idx_shift_logs_employee ON public.shift_logs USING btree (employee_id);

CREATE INDEX IF NOT EXISTS idx_shift_logs_restaurant_active ON public.shift_logs USING btree (restaurant_id) WHERE (status = 'active'::text);

CREATE INDEX IF NOT EXISTS idx_stock_ingredient ON public.gm_stock_levels USING btree (ingredient_id);

CREATE INDEX IF NOT EXISTS idx_stock_location ON public.gm_stock_levels USING btree (location_id);

CREATE INDEX IF NOT EXISTS idx_stock_low ON public.gm_stock_levels USING btree (restaurant_id, location_id) WHERE ((qty <= min_qty) AND (min_qty > (0)::numeric));

CREATE INDEX IF NOT EXISTS idx_stock_restaurant ON public.gm_stock_levels USING btree (restaurant_id);

CREATE INDEX IF NOT EXISTS idx_tables_restaurant ON public.gm_tables USING btree (restaurant_id);

CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.gm_tasks USING btree (created_at DESC) WHERE (status = 'OPEN'::text);

CREATE INDEX IF NOT EXISTS idx_tasks_order ON public.gm_tasks USING btree (order_id) WHERE (status = 'OPEN'::text);

CREATE INDEX IF NOT EXISTS idx_tasks_order_item ON public.gm_tasks USING btree (order_item_id) WHERE (status = 'OPEN'::text);

CREATE INDEX IF NOT EXISTS idx_tasks_restaurant_status ON public.gm_tasks USING btree (restaurant_id, status);

CREATE INDEX IF NOT EXISTS idx_tasks_station_priority ON public.gm_tasks USING btree (station, priority) WHERE (status = 'OPEN'::text);

CREATE UNIQUE INDEX IF NOT EXISTS installed_modules_restaurant_id_module_id_key ON public.installed_modules USING btree (restaurant_id, module_id);

CREATE UNIQUE INDEX IF NOT EXISTS legal_seals_entity_type_entity_id_legal_state_key ON public.legal_seals USING btree (entity_type, entity_id, legal_state);

CREATE UNIQUE INDEX IF NOT EXISTS module_permissions_restaurant_id_module_id_role_key ON public.module_permissions USING btree (restaurant_id, module_id, role);

CREATE UNIQUE INDEX IF NOT EXISTS saas_tenants_slug_key ON public.saas_tenants USING btree (slug);

CREATE UNIQUE INDEX IF NOT EXISTS webhook_events_provider_event_id_key ON public.webhook_events USING btree (provider, event_id);

CREATE OR REPLACE FUNCTION public.assign_task(p_task_id uuid, p_assigned_to uuid, p_restaurant_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_restaurant_id UUID;
