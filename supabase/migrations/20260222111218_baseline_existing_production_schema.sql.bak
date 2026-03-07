-- Baseline snapshot generated from production schema
-- Generated at: 2026-02-22 11:15:12.505006+00

CREATE SEQUENCE IF NOT EXISTS public.event_store_sequence_id_seq AS bigint START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807;

CREATE SEQUENCE IF NOT EXISTS public.legal_seals_legal_sequence_id_seq AS bigint START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807;

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

ALTER TABLE public.billing_configs ADD CONSTRAINT billing_configs_currency_check CHECK (currency = ANY (ARRAY['EUR'::text, 'USD'::text, 'BRL'::text]));

ALTER TABLE public.billing_configs ADD CONSTRAINT billing_configs_pkey PRIMARY KEY (id);

ALTER TABLE public.billing_configs ADD CONSTRAINT billing_configs_provider_check CHECK (provider = ANY (ARRAY['stripe'::text, 'sumup'::text, 'pix'::text, 'custom'::text]));

ALTER TABLE public.billing_configs ADD CONSTRAINT billing_configs_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;

ALTER TABLE public.billing_configs ADD CONSTRAINT billing_configs_restaurant_id_provider_key UNIQUE (restaurant_id, provider);

ALTER TABLE public.event_store ADD CONSTRAINT event_store_pkey PRIMARY KEY (event_id);

ALTER TABLE public.event_store ADD CONSTRAINT event_store_stream_type_stream_id_stream_version_key UNIQUE (stream_type, stream_id, stream_version);

ALTER TABLE public.gm_cash_registers ADD CONSTRAINT gm_cash_registers_pkey PRIMARY KEY (id);

ALTER TABLE public.gm_cash_registers ADD CONSTRAINT gm_cash_registers_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;

ALTER TABLE public.gm_cash_registers ADD CONSTRAINT gm_cash_registers_status_check CHECK (status = ANY (ARRAY['open'::text, 'closed'::text]));

ALTER TABLE public.gm_catalog_categories ADD CONSTRAINT gm_catalog_categories_menu_id_fkey FOREIGN KEY (menu_id) REFERENCES gm_catalog_menus(id) ON DELETE CASCADE;

ALTER TABLE public.gm_catalog_categories ADD CONSTRAINT gm_catalog_categories_pkey PRIMARY KEY (id);

ALTER TABLE public.gm_catalog_items ADD CONSTRAINT gm_catalog_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES gm_catalog_categories(id) ON DELETE CASCADE;

ALTER TABLE public.gm_catalog_items ADD CONSTRAINT gm_catalog_items_pkey PRIMARY KEY (id);

ALTER TABLE public.gm_catalog_menus ADD CONSTRAINT gm_catalog_menus_pkey PRIMARY KEY (id);

ALTER TABLE public.gm_catalog_menus ADD CONSTRAINT gm_catalog_menus_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;

ALTER TABLE public.gm_equipment ADD CONSTRAINT gm_equipment_kind_check CHECK (kind = ANY (ARRAY['FRIDGE'::text, 'FREEZER'::text, 'OVEN'::text, 'GRILL'::text, 'PLANCHA'::text, 'COFFEE_MACHINE'::text, 'ICE_MACHINE'::text, 'KEG_SYSTEM'::text, 'SHELF'::text, 'OTHER'::text]));

ALTER TABLE public.gm_equipment ADD CONSTRAINT gm_equipment_location_id_fkey FOREIGN KEY (location_id) REFERENCES gm_locations(id) ON DELETE SET NULL;

ALTER TABLE public.gm_equipment ADD CONSTRAINT gm_equipment_pkey PRIMARY KEY (id);

ALTER TABLE public.gm_equipment ADD CONSTRAINT gm_equipment_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;

ALTER TABLE public.gm_equipment ADD CONSTRAINT gm_equipment_restaurant_id_name_key UNIQUE (restaurant_id, name);

ALTER TABLE public.gm_ingredients ADD CONSTRAINT gm_ingredients_pkey PRIMARY KEY (id);

ALTER TABLE public.gm_ingredients ADD CONSTRAINT gm_ingredients_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;

ALTER TABLE public.gm_ingredients ADD CONSTRAINT gm_ingredients_restaurant_id_name_key UNIQUE (restaurant_id, name);

ALTER TABLE public.gm_ingredients ADD CONSTRAINT gm_ingredients_unit_check CHECK (unit = ANY (ARRAY['g'::text, 'kg'::text, 'ml'::text, 'l'::text, 'unit'::text]));

ALTER TABLE public.gm_locations ADD CONSTRAINT gm_locations_kind_check CHECK (kind = ANY (ARRAY['KITCHEN'::text, 'BAR'::text, 'STORAGE'::text, 'SERVICE'::text, 'OTHER'::text]));

ALTER TABLE public.gm_locations ADD CONSTRAINT gm_locations_pkey PRIMARY KEY (id);

ALTER TABLE public.gm_locations ADD CONSTRAINT gm_locations_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;

ALTER TABLE public.gm_locations ADD CONSTRAINT gm_locations_restaurant_id_name_key UNIQUE (restaurant_id, name);

ALTER TABLE public.gm_menu_categories ADD CONSTRAINT gm_menu_categories_pkey PRIMARY KEY (id);

ALTER TABLE public.gm_menu_categories ADD CONSTRAINT gm_menu_categories_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;

ALTER TABLE public.gm_order_items ADD CONSTRAINT gm_order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES gm_orders(id) ON DELETE CASCADE;

ALTER TABLE public.gm_order_items ADD CONSTRAINT gm_order_items_pkey PRIMARY KEY (id);

ALTER TABLE public.gm_order_items ADD CONSTRAINT gm_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES gm_products(id);

ALTER TABLE public.gm_order_items ADD CONSTRAINT gm_order_items_station_check CHECK (station = ANY (ARRAY['BAR'::text, 'KITCHEN'::text]));

ALTER TABLE public.gm_orders ADD CONSTRAINT gm_orders_pkey PRIMARY KEY (id);

ALTER TABLE public.gm_orders ADD CONSTRAINT gm_orders_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;

ALTER TABLE public.gm_orders ADD CONSTRAINT gm_orders_table_id_fkey FOREIGN KEY (table_id) REFERENCES gm_tables(id);

ALTER TABLE public.gm_payment_audit_logs ADD CONSTRAINT gm_payment_audit_logs_pkey PRIMARY KEY (id);

ALTER TABLE public.gm_payment_audit_logs ADD CONSTRAINT gm_payment_audit_logs_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;

ALTER TABLE public.gm_payments ADD CONSTRAINT gm_payments_cash_register_id_fkey FOREIGN KEY (cash_register_id) REFERENCES gm_cash_registers(id);

ALTER TABLE public.gm_payments ADD CONSTRAINT gm_payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES gm_orders(id) ON DELETE CASCADE;

ALTER TABLE public.gm_payments ADD CONSTRAINT gm_payments_pkey PRIMARY KEY (id);

ALTER TABLE public.gm_payments ADD CONSTRAINT gm_payments_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;

ALTER TABLE public.gm_payments ADD CONSTRAINT gm_payments_status_check CHECK (status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text, 'refunded'::text]));

ALTER TABLE public.gm_product_bom ADD CONSTRAINT gm_product_bom_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES gm_ingredients(id) ON DELETE CASCADE;

ALTER TABLE public.gm_product_bom ADD CONSTRAINT gm_product_bom_pkey PRIMARY KEY (id);

ALTER TABLE public.gm_product_bom ADD CONSTRAINT gm_product_bom_product_id_fkey FOREIGN KEY (product_id) REFERENCES gm_products(id) ON DELETE CASCADE;

ALTER TABLE public.gm_product_bom ADD CONSTRAINT gm_product_bom_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;

ALTER TABLE public.gm_product_bom ADD CONSTRAINT gm_product_bom_restaurant_id_product_id_ingredient_id_key UNIQUE (restaurant_id, product_id, ingredient_id);

ALTER TABLE public.gm_product_bom ADD CONSTRAINT gm_product_bom_station_check CHECK (station = ANY (ARRAY['KITCHEN'::text, 'BAR'::text]));

ALTER TABLE public.gm_products ADD CONSTRAINT gm_products_category_id_fkey FOREIGN KEY (category_id) REFERENCES gm_menu_categories(id);

ALTER TABLE public.gm_products ADD CONSTRAINT gm_products_pkey PRIMARY KEY (id);

ALTER TABLE public.gm_products ADD CONSTRAINT gm_products_prep_category_check CHECK (prep_category = ANY (ARRAY['drink'::text, 'starter'::text, 'main'::text, 'dessert'::text]));

ALTER TABLE public.gm_products ADD CONSTRAINT gm_products_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;

ALTER TABLE public.gm_products ADD CONSTRAINT gm_products_station_check CHECK (station = ANY (ARRAY['BAR'::text, 'KITCHEN'::text]));

ALTER TABLE public.gm_restaurant_members ADD CONSTRAINT gm_restaurant_members_pkey PRIMARY KEY (id);

ALTER TABLE public.gm_restaurant_members ADD CONSTRAINT gm_restaurant_members_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;

ALTER TABLE public.gm_restaurants ADD CONSTRAINT gm_restaurants_billing_status_check CHECK (billing_status = ANY (ARRAY['trial'::text, 'active'::text, 'past_due'::text, 'canceled'::text]));

ALTER TABLE public.gm_restaurants ADD CONSTRAINT gm_restaurants_pkey PRIMARY KEY (id);

ALTER TABLE public.gm_restaurants ADD CONSTRAINT gm_restaurants_product_mode_check CHECK (product_mode = ANY (ARRAY['demo'::text, 'pilot'::text, 'live'::text]));

ALTER TABLE public.gm_restaurants ADD CONSTRAINT gm_restaurants_slug_key UNIQUE (slug);

ALTER TABLE public.gm_restaurants ADD CONSTRAINT gm_restaurants_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES saas_tenants(id);

ALTER TABLE public.gm_staff ADD CONSTRAINT gm_staff_pkey PRIMARY KEY (id);

ALTER TABLE public.gm_staff ADD CONSTRAINT gm_staff_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;

ALTER TABLE public.gm_staff ADD CONSTRAINT gm_staff_role_check CHECK (role = ANY (ARRAY['waiter'::text, 'kitchen'::text, 'manager'::text]));

ALTER TABLE public.gm_stock_ledger ADD CONSTRAINT gm_stock_ledger_action_check CHECK (action = ANY (ARRAY['IN'::text, 'OUT'::text, 'RESERVE'::text, 'RELEASE'::text, 'CONSUME'::text, 'ADJUST'::text]));

ALTER TABLE public.gm_stock_ledger ADD CONSTRAINT gm_stock_ledger_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES gm_ingredients(id) ON DELETE CASCADE;

ALTER TABLE public.gm_stock_ledger ADD CONSTRAINT gm_stock_ledger_location_id_fkey FOREIGN KEY (location_id) REFERENCES gm_locations(id) ON DELETE CASCADE;

ALTER TABLE public.gm_stock_ledger ADD CONSTRAINT gm_stock_ledger_order_id_fkey FOREIGN KEY (order_id) REFERENCES gm_orders(id) ON DELETE SET NULL;

ALTER TABLE public.gm_stock_ledger ADD CONSTRAINT gm_stock_ledger_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES gm_order_items(id) ON DELETE SET NULL;

ALTER TABLE public.gm_stock_ledger ADD CONSTRAINT gm_stock_ledger_pkey PRIMARY KEY (id);

ALTER TABLE public.gm_stock_ledger ADD CONSTRAINT gm_stock_ledger_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;

ALTER TABLE public.gm_stock_levels ADD CONSTRAINT gm_stock_levels_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES gm_ingredients(id) ON DELETE CASCADE;

ALTER TABLE public.gm_stock_levels ADD CONSTRAINT gm_stock_levels_location_id_fkey FOREIGN KEY (location_id) REFERENCES gm_locations(id) ON DELETE CASCADE;

ALTER TABLE public.gm_stock_levels ADD CONSTRAINT gm_stock_levels_pkey PRIMARY KEY (id);

ALTER TABLE public.gm_stock_levels ADD CONSTRAINT gm_stock_levels_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;

ALTER TABLE public.gm_stock_levels ADD CONSTRAINT gm_stock_levels_restaurant_id_location_id_ingredient_id_key UNIQUE (restaurant_id, location_id, ingredient_id);

ALTER TABLE public.gm_tables ADD CONSTRAINT gm_tables_pkey PRIMARY KEY (id);

ALTER TABLE public.gm_tables ADD CONSTRAINT gm_tables_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;

ALTER TABLE public.gm_tables ADD CONSTRAINT gm_tables_restaurant_id_number_key UNIQUE (restaurant_id, number);

ALTER TABLE public.gm_tasks ADD CONSTRAINT gm_tasks_order_id_fkey FOREIGN KEY (order_id) REFERENCES gm_orders(id) ON DELETE CASCADE;

ALTER TABLE public.gm_tasks ADD CONSTRAINT gm_tasks_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES gm_order_items(id) ON DELETE CASCADE;

ALTER TABLE public.gm_tasks ADD CONSTRAINT gm_tasks_pkey PRIMARY KEY (id);

ALTER TABLE public.gm_tasks ADD CONSTRAINT gm_tasks_priority_check CHECK (priority = ANY (ARRAY['LOW'::text, 'MEDIA'::text, 'ALTA'::text, 'CRITICA'::text]));

ALTER TABLE public.gm_tasks ADD CONSTRAINT gm_tasks_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;

ALTER TABLE public.gm_tasks ADD CONSTRAINT gm_tasks_station_check CHECK (station = ANY (ARRAY['BAR'::text, 'KITCHEN'::text, 'SERVICE'::text]));

ALTER TABLE public.gm_tasks ADD CONSTRAINT gm_tasks_status_check CHECK (status = ANY (ARRAY['OPEN'::text, 'ACKNOWLEDGED'::text, 'RESOLVED'::text, 'DISMISSED'::text]));

ALTER TABLE public.gm_tasks ADD CONSTRAINT gm_tasks_task_type_check CHECK (task_type = ANY (ARRAY['ATRASO_ITEM'::text, 'ACUMULO_BAR'::text, 'ENTREGA_PENDENTE'::text, 'ITEM_CRITICO'::text, 'PEDIDO_ESQUECIDO'::text, 'ESTOQUE_CRITICO'::text, 'RUPTURA_PREVISTA'::text, 'EQUIPAMENTO_CHECK'::text, 'PEDIDO_NOVO'::text, 'MODO_INTERNO'::text]));

ALTER TABLE public.gm_terminals ADD CONSTRAINT gm_terminals_pkey PRIMARY KEY (id);

ALTER TABLE public.gm_terminals ADD CONSTRAINT gm_terminals_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;

ALTER TABLE public.gm_terminals ADD CONSTRAINT gm_terminals_status_check CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'revoked'::text]));

ALTER TABLE public.gm_terminals ADD CONSTRAINT gm_terminals_type_check CHECK (type = ANY (ARRAY['TPV'::text, 'KDS'::text, 'APPSTAFF'::text, 'WEB'::text, 'WAITER'::text, 'BACKOFFICE'::text, 'ADMIN'::text]));

ALTER TABLE public.installed_modules ADD CONSTRAINT installed_modules_pkey PRIMARY KEY (id);

ALTER TABLE public.installed_modules ADD CONSTRAINT installed_modules_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;

ALTER TABLE public.installed_modules ADD CONSTRAINT installed_modules_restaurant_id_module_id_key UNIQUE (restaurant_id, module_id);

ALTER TABLE public.installed_modules ADD CONSTRAINT installed_modules_status_check CHECK (status::text = ANY (ARRAY['active'::character varying, 'inactive'::character varying, 'error'::character varying]::text[]));

ALTER TABLE public.legal_seals ADD CONSTRAINT legal_seals_entity_type_entity_id_legal_state_key UNIQUE (entity_type, entity_id, legal_state);

ALTER TABLE public.legal_seals ADD CONSTRAINT legal_seals_pkey PRIMARY KEY (seal_id);

ALTER TABLE public.module_permissions ADD CONSTRAINT module_permissions_pkey PRIMARY KEY (id);

ALTER TABLE public.module_permissions ADD CONSTRAINT module_permissions_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;

ALTER TABLE public.module_permissions ADD CONSTRAINT module_permissions_restaurant_id_module_id_role_key UNIQUE (restaurant_id, module_id, role);

ALTER TABLE public.gm_order_items ADD CONSTRAINT order_items_quantity_check CHECK (quantity > 0);

ALTER TABLE public.gm_orders ADD CONSTRAINT orders_payment_status_check CHECK (payment_status = ANY (ARRAY['PENDING'::text, 'PAID'::text, 'PARTIALLY_PAID'::text, 'FAILED'::text, 'REFUNDED'::text]));

ALTER TABLE public.gm_orders ADD CONSTRAINT orders_status_check CHECK (status = ANY (ARRAY['OPEN'::text, 'PREPARING'::text, 'IN_PREP'::text, 'READY'::text, 'CLOSED'::text, 'CANCELLED'::text]));

ALTER TABLE public.saas_tenants ADD CONSTRAINT saas_tenants_pkey PRIMARY KEY (id);

ALTER TABLE public.saas_tenants ADD CONSTRAINT saas_tenants_slug_key UNIQUE (slug);

ALTER TABLE public.shift_logs ADD CONSTRAINT shift_logs_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES gm_staff(id) ON DELETE CASCADE;

ALTER TABLE public.shift_logs ADD CONSTRAINT shift_logs_pkey PRIMARY KEY (id);

ALTER TABLE public.shift_logs ADD CONSTRAINT shift_logs_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;

ALTER TABLE public.shift_logs ADD CONSTRAINT shift_logs_status_check CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'cancelled'::text]));

ALTER TABLE public.webhook_events ADD CONSTRAINT webhook_events_pkey PRIMARY KEY (id);

ALTER TABLE public.webhook_events ADD CONSTRAINT webhook_events_provider_event_id_key UNIQUE (provider, event_id);

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
BEGIN
  SELECT restaurant_id INTO v_restaurant_id FROM public.gm_tasks WHERE id = p_task_id;
  IF v_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'Task not found: %', p_task_id;
  END IF;
  IF p_restaurant_id IS NOT NULL AND v_restaurant_id != p_restaurant_id THEN
    RAISE EXCEPTION 'Task does not belong to restaurant %', p_restaurant_id;
  END IF;
  UPDATE public.gm_tasks
  SET assigned_to = p_assigned_to, updated_at = NOW()
  WHERE id = p_task_id AND status = 'OPEN';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task % not found or not in OPEN status', p_task_id;
  END IF;
END;
$function$


CREATE OR REPLACE FUNCTION public.complete_task(p_task_id uuid, p_actor_id uuid DEFAULT NULL::uuid, p_restaurant_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_restaurant_id UUID;
BEGIN
  SELECT restaurant_id INTO v_restaurant_id FROM public.gm_tasks WHERE id = p_task_id;
  IF v_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'Task not found: %', p_task_id;
  END IF;
  IF p_restaurant_id IS NOT NULL AND v_restaurant_id != p_restaurant_id THEN
    RAISE EXCEPTION 'Task does not belong to restaurant %', p_restaurant_id;
  END IF;
  UPDATE public.gm_tasks
  SET status = 'RESOLVED', resolved_at = COALESCE(resolved_at, NOW()), updated_at = NOW()
  WHERE id = p_task_id AND status IN ('OPEN', 'ACKNOWLEDGED');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task % not found or already terminal', p_task_id;
  END IF;
END;
$function$


CREATE OR REPLACE FUNCTION public.create_order_atomic(p_restaurant_id uuid, p_items jsonb, p_payment_method text DEFAULT 'cash'::text, p_sync_metadata jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_order_id UUID;
    v_total_cents INTEGER := 0;
    v_item JSONB;
    v_item_total INTEGER;
    v_prod_id UUID;
    v_qty INTEGER;
    v_prod_name TEXT;
    v_unit_price INTEGER;
    v_table_id UUID;
    v_table_number INTEGER;
    v_prep_time_seconds INTEGER;
    v_prep_category TEXT;
    v_station TEXT;
BEGIN
    -- Extract table info from sync_metadata if provided
    IF p_sync_metadata IS NOT NULL THEN
        v_table_id := (p_sync_metadata->>'table_id')::UUID;
        v_table_number := (p_sync_metadata->>'table_number')::INTEGER;
    END IF;

    -- 1. Calculate Total Amount
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_item_total := (v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::INTEGER;
        v_total_cents := v_total_cents + v_item_total;
    END LOOP;

    -- 2. Insert Order (Atomic) - Constraint idx_one_open_order_per_table será aplicada automaticamente
    INSERT INTO public.gm_orders (
        restaurant_id,
        table_id,
        table_number,
        status,
        total_cents,
        subtotal_cents,
        payment_status,
        sync_metadata,
        origin,
        metadata
    )
    VALUES (
        p_restaurant_id,
        v_table_id,
        v_table_number,
        'OPEN',
        v_total_cents,
        v_total_cents,
        'PENDING',
        p_sync_metadata,
        COALESCE((p_sync_metadata->>'origin')::TEXT, 'CAIXA'),
        jsonb_build_object('payment_method', p_payment_method)
    )
    RETURNING id INTO v_order_id;

    -- 3. Insert Order Items (com autoria para divisão de conta + prep_time snapshot)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_prod_id := (v_item->>'product_id')::UUID;
        v_prod_name := v_item->>'name';
        v_qty := (v_item->>'quantity')::INTEGER;
        v_unit_price := (v_item->>'unit_price')::INTEGER;

        -- Buscar prep_time e station do produto (snapshot no momento do pedido)
        SELECT prep_time_seconds, prep_category, station
        INTO v_prep_time_seconds, v_prep_category, v_station
        FROM public.gm_products
        WHERE id = v_prod_id;

        -- Valores padrão se produto não encontrado ou sem prep_time
        v_prep_time_seconds := COALESCE(v_prep_time_seconds, 300); -- 5 min padrão
        v_prep_category := COALESCE(v_prep_category, 'main');
        v_station := COALESCE(v_station, 'KITCHEN');

        INSERT INTO public.gm_order_items (
            order_id,
            product_id,
            name_snapshot,
            price_snapshot,
            quantity,
            subtotal_cents,
            -- Prep time snapshot (para timer por item)
            prep_time_seconds,
            prep_category,
            -- Station snapshot (BAR vs KITCHEN)
            station,
            -- Autoria do item (para divisão de conta)
            created_by_user_id,
            created_by_role,
            device_id
        )
        VALUES (
            v_order_id,
            v_prod_id,
            v_prod_name,
            v_unit_price,
            v_qty,
            v_unit_price * v_qty,
            -- Prep time snapshot (para timer por item)
            v_prep_time_seconds,
            v_prep_category,
            -- Station snapshot (BAR vs KITCHEN)
            v_station,
            -- Extrair autoria do item (se presente)
            (v_item->>'created_by_user_id')::UUID,
            v_item->>'created_by_role',
            v_item->>'device_id'
        );
    END LOOP;

    -- 4. Return Created Order
    RETURN jsonb_build_object(
        'id', v_order_id,
        'total_cents', v_total_cents,
        'status', 'OPEN'
    );
EXCEPTION
    WHEN unique_violation THEN
        -- Constraint idx_one_open_order_per_table violada
        RAISE EXCEPTION 'TABLE_HAS_ACTIVE_ORDER: Esta mesa já possui um pedido aberto';
END;
$function$


CREATE OR REPLACE FUNCTION public.create_task(p_restaurant_id uuid, p_task_type text, p_message text, p_station text DEFAULT NULL::text, p_priority text DEFAULT 'MEDIA'::text, p_order_id uuid DEFAULT NULL::uuid, p_order_item_id uuid DEFAULT NULL::uuid, p_context jsonb DEFAULT '{}'::jsonb, p_auto_generated boolean DEFAULT false)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.gm_tasks (
    restaurant_id, task_type, message, station, priority,
    order_id, order_item_id, context, status, auto_generated
  ) VALUES (
    p_restaurant_id, p_task_type, p_message,
    NULLIF(p_station, '')::TEXT,
    COALESCE(NULLIF(p_priority, ''), 'MEDIA'),
    p_order_id, p_order_item_id, COALESCE(p_context, '{}'::jsonb),
    'OPEN', p_auto_generated
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$


CREATE OR REPLACE FUNCTION public.fn_log_payment_attempt(p_order_id uuid, p_restaurant_id uuid, p_operator_id uuid, p_amount_cents integer, p_method text, p_result text, p_error_code text DEFAULT NULL::text, p_error_message text DEFAULT NULL::text, p_idempotency_key text DEFAULT NULL::text, p_payment_id uuid DEFAULT NULL::uuid, p_duration_ms integer DEFAULT NULL::integer, p_client_info text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE v_log_id UUID;
BEGIN
    INSERT INTO public.gm_payment_audit_logs (
        order_id, restaurant_id, operator_id, amount_cents, method, result,
        error_code, error_message, idempotency_key, payment_id, duration_ms, client_info
    ) VALUES (
        p_order_id, p_restaurant_id, p_operator_id, p_amount_cents, p_method, p_result,
        p_error_code, p_error_message, p_idempotency_key, p_payment_id, p_duration_ms,
        CASE WHEN p_client_info IS NOT NULL AND TRIM(p_client_info) != '' THEN (p_client_info::jsonb) ELSE NULL END
    )
    RETURNING id INTO v_log_id;
    RETURN jsonb_build_object('success', true, 'log_id', v_log_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$


CREATE OR REPLACE FUNCTION public.get_operational_metrics(p_restaurant_id uuid, p_from timestamp with time zone, p_to timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_tenant_id UUID;
    v_orders_created_total INTEGER;
    v_orders_cancelled_total INTEGER;
    v_payments_recorded_total INTEGER;
    v_payments_amount_cents BIGINT;
    v_active_shifts_count INTEGER;
    v_daily_revenue_cents BIGINT;
    v_daily_orders_count INTEGER;
    v_avg_order_value_cents INTEGER;
BEGIN
    SELECT tenant_id INTO v_tenant_id
    FROM public.gm_restaurants
    WHERE id = p_restaurant_id;
    IF v_tenant_id IS NULL THEN
        RETURN jsonb_build_object(
            'schema_version', '1',
            'tenant_id', '',
            'period', jsonb_build_object('start', p_from, 'end', p_to),
            'orders_created_total', 0,
            'orders_cancelled_total', 0,
            'payments_recorded_total', 0,
            'payments_amount_cents', 0,
            'active_shifts_count', 0,
            'export_requested_count', 0,
            'daily_revenue_cents', 0,
            'daily_orders_count', 0,
            'avg_order_value_cents', 0
        );
    END IF;

    SELECT COUNT(*)::INTEGER INTO v_orders_created_total
    FROM public.gm_orders
    WHERE restaurant_id = p_restaurant_id
      AND created_at >= p_from AND created_at <= p_to;

    SELECT COUNT(*)::INTEGER INTO v_orders_cancelled_total
    FROM public.gm_orders
    WHERE restaurant_id = p_restaurant_id
      AND status = 'CANCELLED'
      AND created_at >= p_from AND created_at <= p_to;

    SELECT COUNT(*)::INTEGER, COALESCE(SUM(amount_cents), 0)::BIGINT
    INTO v_payments_recorded_total, v_payments_amount_cents
    FROM public.gm_payments
    WHERE restaurant_id = p_restaurant_id
      AND status = 'paid'
      AND created_at >= p_from AND created_at <= p_to;

    SELECT COUNT(*)::INTEGER INTO v_active_shifts_count
    FROM public.gm_cash_registers
    WHERE restaurant_id = p_restaurant_id AND status = 'open';

    SELECT COUNT(*)::INTEGER INTO v_daily_orders_count
    FROM public.gm_orders
    WHERE restaurant_id = p_restaurant_id
      AND status = 'CLOSED'
      AND payment_status IN ('PAID', 'PARTIALLY_PAID')
      AND updated_at >= p_from AND updated_at <= p_to;

    v_daily_revenue_cents := COALESCE(v_payments_amount_cents, 0);
    v_avg_order_value_cents := CASE
        WHEN v_daily_orders_count > 0 THEN (v_daily_revenue_cents / v_daily_orders_count)::INTEGER
        ELSE 0
    END;

    RETURN jsonb_build_object(
        'schema_version', '1',
        'tenant_id', v_tenant_id,
        'period', jsonb_build_object('start', p_from, 'end', p_to),
        'orders_created_total', v_orders_created_total,
        'orders_cancelled_total', v_orders_cancelled_total,
        'payments_recorded_total', v_payments_recorded_total,
        'payments_amount_cents', v_payments_amount_cents,
        'active_shifts_count', v_active_shifts_count,
        'export_requested_count', 0,
        'daily_revenue_cents', v_daily_revenue_cents,
        'daily_orders_count', v_daily_orders_count,
        'avg_order_value_cents', v_avg_order_value_cents
    );
END;
$function$


CREATE OR REPLACE FUNCTION public.get_payment_health(p_restaurant_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_attempts_24h INTEGER;
    v_success_24h INTEGER;
    v_fail_24h INTEGER;
    v_avg_duration_ms NUMERIC;
    v_total_processed_cents BIGINT;
    v_most_common_error TEXT;
    v_success_rate NUMERIC;
BEGIN
    WITH window_stats AS (
        SELECT result, duration_ms, amount_cents, error_code
        FROM public.gm_payment_audit_logs
        WHERE restaurant_id = p_restaurant_id AND created_at >= NOW() - INTERVAL '24 hours'
    )
    SELECT
        COUNT(*)::INTEGER,
        COUNT(*) FILTER (WHERE result = 'success')::INTEGER,
        COUNT(*) FILTER (WHERE result != 'success')::INTEGER,
        AVG(duration_ms) FILTER (WHERE result = 'success')::NUMERIC(10,2),
        COALESCE(SUM(amount_cents) FILTER (WHERE result = 'success'), 0)::BIGINT,
        (array_agg(error_code) FILTER (WHERE result != 'success' AND error_code IS NOT NULL))[1]
    INTO v_attempts_24h, v_success_24h, v_fail_24h, v_avg_duration_ms, v_total_processed_cents, v_most_common_error
    FROM window_stats;
    IF v_attempts_24h > 0 THEN
        v_success_rate := (v_success_24h::NUMERIC / v_attempts_24h::NUMERIC) * 100;
    ELSE
        v_success_rate := 100;
    END IF;
    RETURN jsonb_build_object(
        'attempts_24h', COALESCE(v_attempts_24h, 0),
        'success_24h', COALESCE(v_success_24h, 0),
        'fail_24h', COALESCE(v_fail_24h, 0),
        'success_rate', TRUNC(v_success_rate, 2),
        'avg_duration_ms', COALESCE(v_avg_duration_ms, 0),
        'total_processed_cents', COALESCE(v_total_processed_cents, 0),
        'most_common_error', v_most_common_error
    );
END;
$function$


CREATE OR REPLACE FUNCTION public.get_shift_history(p_restaurant_id uuid, p_from timestamp with time zone, p_to timestamp with time zone)
 RETURNS TABLE(shift_id uuid, opened_at timestamp with time zone, closed_at timestamp with time zone, total_sales_cents bigint, orders_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        cr.id AS shift_id,
        cr.opened_at AS opened_at,
        cr.closed_at AS closed_at,
        COALESCE(cr.total_sales_cents, 0)::BIGINT AS total_sales_cents,
        (SELECT COUNT(*)::BIGINT
         FROM public.gm_orders o
         WHERE o.cash_register_id = cr.id AND o.status = 'CLOSED') AS orders_count
    FROM public.gm_cash_registers cr
    WHERE cr.restaurant_id = p_restaurant_id
      AND cr.opened_at IS NOT NULL
      AND cr.opened_at <= p_to
      AND (cr.closed_at IS NULL OR cr.closed_at >= p_from)
    ORDER BY cr.opened_at DESC;
END;
$function$


CREATE OR REPLACE FUNCTION public.mark_item_ready(p_item_id uuid, p_restaurant_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_item_order_id UUID;
    v_all_items_ready BOOLEAN;
    v_updated_order_id UUID;
BEGIN
    UPDATE public.gm_order_items
    SET ready_at = NOW(), updated_at = NOW()
    WHERE id = p_item_id
      AND EXISTS (
          SELECT 1
          FROM public.gm_orders o
          WHERE o.id = gm_order_items.order_id
            AND o.restaurant_id = p_restaurant_id
      )
    RETURNING order_id INTO v_item_order_id;

    IF v_item_order_id IS NULL THEN
        RAISE EXCEPTION 'ITEM_NOT_FOUND: Item não encontrado ou não pertence ao restaurante';
    END IF;

    SELECT COUNT(*) = COUNT(CASE WHEN ready_at IS NOT NULL THEN 1 END)
    INTO v_all_items_ready
    FROM public.gm_order_items
    WHERE order_id = v_item_order_id;

    IF v_all_items_ready THEN
        UPDATE public.gm_orders
        SET status = 'READY',
            ready_at = CASE WHEN ready_at IS NULL THEN NOW() ELSE ready_at END,
            updated_at = NOW()
        WHERE id = v_item_order_id
          AND restaurant_id = p_restaurant_id
        RETURNING id INTO v_updated_order_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'item_id', p_item_id,
        'order_id', v_item_order_id,
        'all_items_ready', v_all_items_ready,
        'order_status_updated', v_updated_order_id IS NOT NULL
    );
END;
$function$


CREATE OR REPLACE FUNCTION public.mark_webhook_processed(p_event_uuid uuid, p_status character varying DEFAULT 'PROCESSED'::character varying)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE webhook_events
    SET status = p_status, processed_at = NOW(), updated_at = NOW()
    WHERE id = p_event_uuid;
END;
$function$


CREATE OR REPLACE FUNCTION public.open_cash_register_atomic(p_restaurant_id uuid, p_name text DEFAULT 'Caixa Principal'::text, p_opened_by text DEFAULT NULL::text, p_opening_balance_cents bigint DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE v_id UUID;
BEGIN
    IF EXISTS (SELECT 1 FROM public.gm_cash_registers WHERE restaurant_id = p_restaurant_id AND status = 'open') THEN
        RAISE EXCEPTION 'CASH_REGISTER_ALREADY_OPEN';
    END IF;
    INSERT INTO public.gm_cash_registers (restaurant_id, name, status, opened_at, opened_by, opening_balance_cents, updated_at)
    VALUES (p_restaurant_id, COALESCE(NULLIF(TRIM(p_name), ''), 'Caixa Principal'), 'open', NOW(), p_opened_by, COALESCE(p_opening_balance_cents, 0), NOW())
    RETURNING id INTO v_id;
    RETURN jsonb_build_object('id', v_id, 'status', 'open');
END;
$function$


CREATE OR REPLACE FUNCTION public.process_inventory_deduction(p_order_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_item RECORD;
    v_updated INTEGER := 0;
BEGIN
    FOR v_item IN
        SELECT oi.product_id, oi.quantity
        FROM public.gm_order_items oi
        WHERE oi.order_id = p_order_id AND oi.product_id IS NOT NULL
    LOOP
        UPDATE public.gm_products
        SET stock_quantity = GREATEST(0, COALESCE(stock_quantity, 0) - v_item.quantity),
            updated_at = NOW()
        WHERE id = v_item.product_id AND track_stock = true;
        IF FOUND THEN
            v_updated := v_updated + 1;
        END IF;
    END LOOP;
    RETURN jsonb_build_object('success', true, 'items_updated', v_updated);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$


CREATE OR REPLACE FUNCTION public.process_order_payment(p_order_id uuid, p_restaurant_id uuid, p_cash_register_id uuid, p_method text, p_amount_cents integer, p_operator_id uuid DEFAULT NULL::uuid, p_idempotency_key text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_order_status TEXT;
    v_order_total INTEGER;
    v_register_status TEXT;
    v_total_paid INTEGER := 0;
    v_new_total_paid INTEGER;
    v_order_payment_status TEXT;
    v_order_final_status TEXT;
    v_payment_id UUID;
BEGIN
    SELECT status INTO v_register_status
    FROM public.gm_cash_registers
    WHERE id = p_cash_register_id AND restaurant_id = p_restaurant_id;
    IF v_register_status IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cash Register not found');
    END IF;
    IF v_register_status != 'open' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cash Register must be OPEN to process payments');
    END IF;

    SELECT status, total_cents INTO v_order_status, v_order_total
    FROM public.gm_orders
    WHERE id = p_order_id AND restaurant_id = p_restaurant_id
    FOR UPDATE;
    IF v_order_status IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;
    IF v_order_status IN ('CLOSED', 'CANCELLED') OR v_order_status = 'paid' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order is already final (' || COALESCE(v_order_status, '') || ')');
    END IF;

    SELECT COALESCE(SUM(amount_cents), 0) INTO v_total_paid
    FROM public.gm_payments
    WHERE order_id = p_order_id AND status = 'paid';
    v_new_total_paid := v_total_paid + p_amount_cents;
    IF v_new_total_paid > v_order_total THEN
        RETURN jsonb_build_object('success', false, 'error', 'Payment amount exceeds remaining balance');
    END IF;

    INSERT INTO public.gm_payments (
        restaurant_id, order_id, cash_register_id, operator_id, amount_cents, currency, payment_method, status, idempotency_key, updated_at
    ) VALUES (
        p_restaurant_id, p_order_id, p_cash_register_id, p_operator_id, p_amount_cents, 'EUR', p_method, 'paid', p_idempotency_key, NOW()
    )
    RETURNING id INTO v_payment_id;

    IF v_new_total_paid >= v_order_total THEN
        v_order_payment_status := 'PAID';
        v_order_final_status := 'CLOSED';
    ELSE
        v_order_payment_status := 'PARTIALLY_PAID';
        v_order_final_status := 'OPEN';
    END IF;

    UPDATE public.gm_orders
    SET status = v_order_final_status, payment_status = v_order_payment_status, updated_at = NOW()
    WHERE id = p_order_id;

    UPDATE public.gm_cash_registers
    SET total_sales_cents = COALESCE(total_sales_cents, 0) + p_amount_cents, updated_at = NOW()
    WHERE id = p_cash_register_id;

    PERFORM public.fn_log_payment_attempt(
        p_order_id, p_restaurant_id, p_operator_id, p_amount_cents, p_method, 'success',
        NULL, NULL, p_idempotency_key, v_payment_id, NULL, NULL
    );

    RETURN jsonb_build_object(
        'success', true,
        'payment_id', v_payment_id,
        'payment_status', v_order_payment_status,
        'total_paid', v_new_total_paid,
        'remaining', v_order_total - v_new_total_paid
    );
EXCEPTION
    WHEN unique_violation THEN
        PERFORM public.fn_log_payment_attempt(
            p_order_id, p_restaurant_id, p_operator_id, p_amount_cents, p_method, 'fail',
            'IDEMPOTENCY', 'Duplicate Transaction', p_idempotency_key, NULL, NULL, NULL
        );
        RETURN jsonb_build_object('success', false, 'error', 'Duplicate transaction (Idempotency Key used)');
    WHEN OTHERS THEN
        PERFORM public.fn_log_payment_attempt(
            p_order_id, p_restaurant_id, p_operator_id, p_amount_cents, p_method, 'fail',
            'UNKNOWN', SQLERRM, p_idempotency_key, NULL, NULL, NULL
        );
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$


CREATE OR REPLACE FUNCTION public.process_split_payment_atomic(p_order_id uuid, p_restaurant_id uuid, p_cash_register_id uuid, p_method text, p_amount_cents integer, p_operator_id uuid DEFAULT NULL::uuid, p_idempotency_key text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN public.process_order_payment(
        p_order_id, p_restaurant_id, p_cash_register_id, p_method, p_amount_cents, p_operator_id, p_idempotency_key
    );
END;
$function$


CREATE OR REPLACE FUNCTION public.process_webhook_event(p_provider character varying, p_event_type character varying, p_event_id character varying, p_payload jsonb, p_signature character varying)
 RETURNS TABLE(id uuid, status character varying)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    INSERT INTO webhook_events (
        provider, event_type, event_id, raw_payload, signature, status
    ) VALUES (
        p_provider, p_event_type, p_event_id, p_payload, p_signature, 'PENDING'
    )
    ON CONFLICT (provider, event_id) DO UPDATE
    SET status = 'PENDING', verified_at = NOW(), updated_at = NOW()
    RETURNING webhook_events.id, webhook_events.status;
END;
$function$


CREATE OR REPLACE FUNCTION public.reject_task(p_task_id uuid, p_reason text DEFAULT NULL::text, p_actor_id uuid DEFAULT NULL::uuid, p_restaurant_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_restaurant_id UUID;
  v_context JSONB;
BEGIN
  SELECT restaurant_id, context INTO v_restaurant_id, v_context FROM public.gm_tasks WHERE id = p_task_id;
  IF v_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'Task not found: %', p_task_id;
  END IF;
  IF p_restaurant_id IS NOT NULL AND v_restaurant_id != p_restaurant_id THEN
    RAISE EXCEPTION 'Task does not belong to restaurant %', p_restaurant_id;
  END IF;
  UPDATE public.gm_tasks
  SET
    status = 'DISMISSED',
    resolved_at = COALESCE(resolved_at, NOW()),
    updated_at = NOW(),
    context = jsonb_set(COALESCE(context, '{}'::jsonb), '{reject_reason}', to_jsonb(COALESCE(p_reason, '')::TEXT))
  WHERE id = p_task_id AND status IN ('OPEN', 'ACKNOWLEDGED');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task % not found or already terminal', p_task_id;
  END IF;
END;
$function$


CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$


CREATE OR REPLACE FUNCTION public.simulate_order_stock_impact(p_restaurant_id uuid, p_items jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  WITH req AS (
    SELECT
      (i->>'product_id')::UUID AS product_id,
      COALESCE((i->>'quantity')::INT, 1) AS qty
    FROM jsonb_array_elements(p_items) i
  ),
  needed AS (
    SELECT
      b.ingredient_id,
      b.station,
      SUM(b.qty_per_unit * r.qty) AS needed_qty
    FROM req r
    JOIN public.gm_product_bom b
      ON b.product_id = r.product_id AND b.restaurant_id = p_restaurant_id
    GROUP BY b.ingredient_id, b.station
  ),
  stock AS (
    SELECT
      sl.ingredient_id,
      SUM(sl.qty) AS available_qty,
      SUM(sl.min_qty) AS min_total
    FROM public.gm_stock_levels sl
    WHERE sl.restaurant_id = p_restaurant_id
    GROUP BY sl.ingredient_id
  )
  SELECT jsonb_agg(jsonb_build_object(
    'ingredient_id', n.ingredient_id,
    'needed_qty', n.needed_qty,
    'available_qty', COALESCE(s.available_qty, 0),
    'will_be', COALESCE(s.available_qty, 0) - n.needed_qty,
    'below_min', (COALESCE(s.available_qty, 0) - n.needed_qty) < COALESCE(s.min_total, 0),
    'station', n.station
  ))
  INTO v_result
  FROM needed n
  LEFT JOIN stock s ON s.ingredient_id = n.ingredient_id;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$function$


CREATE OR REPLACE FUNCTION public.start_task(p_task_id uuid, p_actor_id uuid DEFAULT NULL::uuid, p_restaurant_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_restaurant_id UUID;
BEGIN
  SELECT restaurant_id INTO v_restaurant_id FROM public.gm_tasks WHERE id = p_task_id;
  IF v_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'Task not found: %', p_task_id;
  END IF;
  IF p_restaurant_id IS NOT NULL AND v_restaurant_id != p_restaurant_id THEN
    RAISE EXCEPTION 'Task does not belong to restaurant %', p_restaurant_id;
  END IF;
  UPDATE public.gm_tasks
  SET status = 'ACKNOWLEDGED', acknowledged_at = NOW(), updated_at = NOW()
  WHERE id = p_task_id AND status = 'OPEN';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task % not found or not in OPEN status', p_task_id;
  END IF;
END;
$function$


CREATE OR REPLACE FUNCTION public.update_order_from_payment_event(p_webhook_event_id uuid, p_payment_status character varying, p_payment_amount bigint DEFAULT NULL::bigint)
 RETURNS TABLE(payment_id uuid, order_id uuid, old_status character varying, new_status character varying, order_payment_status character varying)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
#variable_conflict use_column
DECLARE
    v_checkout_id text;
    v_payment_id uuid;
    v_order_id uuid;
    v_old_status text;
    v_mapped_status text;
    v_order_pay_status text;
BEGIN
    -- Map the incoming status to our constraint values
    v_mapped_status := CASE
        WHEN p_payment_status IN ('PAID', 'SUCCESSFUL', 'paid', 'successful') THEN 'paid'
        WHEN p_payment_status IN ('FAILED', 'EXPIRED', 'failed', 'expired') THEN 'failed'
        WHEN p_payment_status IN ('REFUNDED', 'refunded') THEN 'refunded'
        WHEN p_payment_status IN ('PENDING', 'pending') THEN 'pending'
        ELSE 'pending'
    END;

    -- Find the checkout_id from the webhook event's raw_payload
    SELECT
        COALESCE(
            we.raw_payload->>'id',
            we.raw_payload->>'checkout_id'
        )
    INTO v_checkout_id
    FROM webhook_events we
    WHERE we.id = p_webhook_event_id;

    IF v_checkout_id IS NULL THEN
        RAISE NOTICE 'No checkout_id found in webhook event %', p_webhook_event_id;
        RETURN;
    END IF;

    -- Find the payment by external_checkout_id
    SELECT p.id, p.order_id, p.status
    INTO v_payment_id, v_order_id, v_old_status
    FROM gm_payments p
    WHERE p.external_checkout_id = v_checkout_id;

    IF v_payment_id IS NULL THEN
        RAISE NOTICE 'No payment found for checkout_id %', v_checkout_id;
        RETURN;
    END IF;

    -- Update gm_payments
    UPDATE gm_payments
    SET status = v_mapped_status,
        updated_at = NOW(),
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
            'webhook_event_id', p_webhook_event_id::text,
            'status_updated_at', NOW()::text,
            'previous_status', v_old_status
        )
    WHERE id = v_payment_id;

    -- Update amount if provided
    IF p_payment_amount IS NOT NULL AND p_payment_amount > 0 THEN
        UPDATE gm_payments
        SET amount_cents = p_payment_amount
        WHERE id = v_payment_id;
    END IF;

    -- Map to order payment_status
    v_order_pay_status := CASE
        WHEN v_mapped_status = 'paid' THEN 'PAID'
        WHEN v_mapped_status = 'failed' THEN 'FAILED'
        WHEN v_mapped_status = 'refunded' THEN 'REFUNDED'
        ELSE 'PENDING'
    END;

    -- Update gm_orders payment_status
    UPDATE gm_orders
    SET payment_status = v_order_pay_status,
        updated_at = NOW()
    WHERE id = v_order_id;

    -- Mark webhook as processed
    UPDATE webhook_events
    SET status = 'PROCESSED',
        processed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_webhook_event_id;

    -- Return result
    RETURN QUERY
    SELECT v_payment_id, v_order_id, v_old_status::varchar, v_mapped_status::varchar, v_order_pay_status::varchar;
END;
$function$


CREATE OR REPLACE FUNCTION public.update_order_status(p_order_id uuid, p_restaurant_id uuid, p_new_status text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_updated_id UUID;
BEGIN
    IF p_new_status NOT IN ('OPEN', 'IN_PREP', 'READY', 'CLOSED', 'CANCELLED') THEN
        RAISE EXCEPTION 'INVALID_STATUS: Status inválido: %', p_new_status;
    END IF;

    UPDATE public.gm_orders
    SET
        status = p_new_status,
        updated_at = NOW(),
        in_prep_at = CASE WHEN p_new_status = 'IN_PREP' AND in_prep_at IS NULL THEN NOW() ELSE in_prep_at END,
        ready_at = CASE WHEN p_new_status = 'READY' AND ready_at IS NULL THEN NOW() ELSE ready_at END
    WHERE id = p_order_id
      AND restaurant_id = p_restaurant_id
    RETURNING id INTO v_updated_id;

    IF v_updated_id IS NULL THEN
        RAISE EXCEPTION 'ORDER_NOT_FOUND: Pedido não encontrado ou não pertence ao restaurante';
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_updated_id,
        'new_status', p_new_status
    );
END;
$function$


CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$


CREATE TRIGGER update_gm_catalog_items_updated_at BEFORE UPDATE ON gm_catalog_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gm_catalog_menus_updated_at BEFORE UPDATE ON gm_catalog_menus FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE EVENT TRIGGER ensure_rls ON ddl_command_end EXECUTE FUNCTION rls_auto_enable();









ALTER TABLE public.billing_configs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.event_store ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.gm_cash_registers ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.gm_catalog_categories ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.gm_catalog_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.gm_catalog_menus ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.gm_equipment ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.gm_ingredients ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.gm_locations ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.gm_menu_categories ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.gm_order_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.gm_orders ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.gm_payment_audit_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.gm_payments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.gm_product_bom ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.gm_products ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.gm_restaurant_members ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.gm_restaurants ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.gm_staff ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.gm_stock_ledger ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.gm_stock_levels ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.gm_tables ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.gm_tasks ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.gm_terminals ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.installed_modules ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.legal_seals ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.module_permissions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.saas_tenants ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.shift_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
