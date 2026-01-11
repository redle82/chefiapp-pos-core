-- Passo G+ (Company-first tenancy)
-- Introduce company_id as the economic/legal tenant root.

create extension if not exists pgcrypto;

create table if not exists companies (
  company_id uuid primary key default gen_random_uuid(),
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Restaurant belongs to a company (nullable for backward-compat; backfilled below)
alter table restaurant_web_profiles
  add column if not exists company_id uuid;

-- Web orders: always carry both restaurant_id + company_id (nullable for backward-compat)
alter table web_orders
  add column if not exists company_id uuid;

-- Audit logs: company_id for legal/tenant clarity
alter table audit_logs
  add column if not exists company_id uuid;

-- Backfill company_id for existing restaurants by creating one company per restaurant (safe default)
with inserted as (
  insert into companies(company_id, name)
  select r.restaurant_id, coalesce(nullif(r.slug,''), 'company')
  from restaurant_web_profiles r
  where r.company_id is null
  on conflict (company_id) do nothing
  returning company_id
)
update restaurant_web_profiles r
set company_id = r.restaurant_id
where r.company_id is null;

-- Backfill web_orders.company_id using restaurant mapping (fallback to restaurant_id)
update web_orders o
set company_id = coalesce(r.company_id, o.restaurant_id)
from restaurant_web_profiles r
where o.company_id is null
  and r.restaurant_id = o.restaurant_id;

-- Backfill audit_logs.company_id when restaurant_id exists
update audit_logs a
set company_id = coalesce(r.company_id, a.restaurant_id)
from restaurant_web_profiles r
where a.company_id is null
  and a.restaurant_id is not null
  and r.restaurant_id = a.restaurant_id;

create index if not exists idx_restaurant_web_profiles_company on restaurant_web_profiles(company_id);
create index if not exists idx_web_orders_company on web_orders(company_id, created_at desc);
create index if not exists idx_audit_logs_company on audit_logs(company_id, created_at desc);
