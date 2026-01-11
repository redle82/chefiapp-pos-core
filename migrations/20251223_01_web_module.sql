-- Web Module (GloriaFood-killer core)
-- Date: 2025-12-23
-- Notes:
-- - Snapshot de itens em `web_order_items` (name_snapshot + price_cents)
-- - payment_intent_refs possui unique(provider, intent_id) para idempotência

-- Required for gen_random_uuid() on vanilla Postgres:
create extension if not exists pgcrypto;

-- 1) Restaurant web profile
create table if not exists restaurant_web_profiles (
  restaurant_id uuid primary key,
  slug text unique not null,
  domain text unique,
  status text not null default 'draft' check (status in ('draft','published')),
  theme text not null default 'minimal' check (theme in ('light','dark','minimal')),
  hero jsonb,
  highlights jsonb,
  contacts jsonb,
  delivery_zones jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Menu categories
create table if not exists menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurant_web_profiles(restaurant_id) on delete cascade,
  name text not null,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_menu_categories_restaurant on menu_categories(restaurant_id, position);

-- 3) Menu items
create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references menu_categories(id) on delete cascade,
  restaurant_id uuid not null,
  name text not null,
  description text,
  price_cents int not null check (price_cents >= 0),
  currency text not null default 'eur',
  photo_url text,
  tags text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_menu_items_restaurant on menu_items(restaurant_id);
create index if not exists idx_menu_items_category on menu_items(category_id);

-- 4) Web orders
create table if not exists web_orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null,
  source text not null default 'WEB' check (source in ('WEB')),
  status text not null default 'PLACED'
    check (status in ('PLACED','ACCEPTED','IN_PREP','READY','COMPLETED','CANCELLED')),
  payment_status text not null default 'REQUIRES_PAYMENT'
    check (payment_status in ('REQUIRES_PAYMENT','PAID','FAILED')),
  pickup_type text not null default 'TAKEAWAY'
    check (pickup_type in ('TAKEAWAY','DELIVERY','DINEIN')),
  table_ref text,
  customer_contact jsonb,
  delivery_address jsonb,
  notes text,
  currency text not null default 'eur',
  total_cents int not null check (total_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_web_orders_restaurant on web_orders(restaurant_id, created_at desc);
create index if not exists idx_web_orders_status on web_orders(restaurant_id, status, created_at desc);

-- 5) Web order items (snapshot)
create table if not exists web_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references web_orders(id) on delete cascade,
  menu_item_id uuid not null references menu_items(id),
  qty int not null check (qty > 0),
  price_cents int not null check (price_cents >= 0),
  name_snapshot text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_web_order_items_order on web_order_items(order_id);

-- 6) Payment intent refs (idempotência + auditoria)
create table if not exists payment_intent_refs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references web_orders(id) on delete cascade,
  provider text not null check (provider in ('STRIPE','SUMUP')),
  intent_id text not null,
  client_secret text,
  status text not null default 'CREATED',
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, intent_id)
);

create index if not exists idx_payment_intent_refs_order on payment_intent_refs(order_id);

-- 7) Audit log (genérico)
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  actor_type text not null default 'SYSTEM',
  actor_id text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_restaurant on audit_logs(restaurant_id, created_at desc);
