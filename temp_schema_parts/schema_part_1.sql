-- GENESIS RECOVERY V2
-- Recreating missing core tables inferred from codebase usage.
-- 1. Tenants (SaaS Foundation)
CREATE TABLE IF NOT EXISTS public.saas_tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- 2. Restaurants (The Core Entity)
CREATE TABLE IF NOT EXISTS public.gm_restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.saas_tenants(id),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    owner_id UUID,
    -- References auth.users implicitly or explicitly
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- 3. Users/Members (Simplified)
CREATE TABLE IF NOT EXISTS public.saas_tenants_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.saas_tenants(id),
    user_id UUID NOT NULL,
    -- References auth.users implicitly
    role TEXT DEFAULT 'staff',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 4. Menu System
CREATE TABLE IF NOT EXISTS public.gm_menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.gm_restaurants(id),
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.gm_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.gm_restaurants(id),
    category_id UUID REFERENCES public.gm_menu_categories(id),
    name TEXT NOT NULL,
    description TEXT,
    price_cents INTEGER NOT NULL DEFAULT 0,
    photo_url TEXT,
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- 5. Tables (Physical)
CREATE TABLE IF NOT EXISTS public.gm_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.gm_restaurants(id),
    number INTEGER NOT NULL,
    qr_code TEXT,
    status TEXT DEFAULT 'closed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 6. Orders (Sovereign Ledger)
CREATE TABLE IF NOT EXISTS public.gm_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.gm_restaurants(id),
    table_id UUID REFERENCES public.gm_tables(id),
    table_number INTEGER,
    status TEXT NOT NULL DEFAULT 'OPEN',
    payment_status TEXT NOT NULL DEFAULT 'PENDING',
    total_cents INTEGER DEFAULT 0,
    subtotal_cents INTEGER DEFAULT 0,
    tax_cents INTEGER DEFAULT 0,
    discount_cents INTEGER DEFAULT 0,
    source TEXT DEFAULT 'tpv',
    operator_id UUID,
    cash_register_id UUID,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.gm_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.gm_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.gm_products(id),
    name_snapshot TEXT NOT NULL,
    price_snapshot INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    subtotal_cents INTEGER NOT NULL,
    modifiers JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 7. Empire Telemetry (The Eye)
CREATE TABLE IF NOT EXISTS public.empire_pulses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_slug TEXT NOT NULL,
    tenant_slug TEXT NOT NULL,
    restaurant_id UUID,
    -- For legacy indexing compatibility
    heartbeat TIMESTAMPTZ NOT NULL,
    metrics JSONB DEFAULT '{}'::jsonb,
    events JSONB DEFAULT '[]'::jsonb,
    risk JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 8. Onboarding Telemetry (The Path)
CREATE TABLE IF NOT EXISTS public.onboarding_events (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    -- References auth.users implicitly
    restaurant_id UUID,
    event_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 9. Legacy Views (Compatibility Layer)
CREATE OR REPLACE VIEW public.restaurant_members AS
SELECT *
FROM public.saas_tenants_members;;
-- Supabase Migration: Legal Profiles & Compliance

-- Country Legal Profiles (optional cache; profiles also live as JSON)
CREATE TABLE IF NOT EXISTS legal_profiles (
  iso CHAR(2) PRIMARY KEY,
  country VARCHAR NOT NULL,
  languages JSONB NOT NULL,
  currency CHAR(3) NOT NULL,
  labor_laws JSONB NOT NULL,
  data_protection JSONB NOT NULL,
  hygiene_regulations JSONB NOT NULL,
  penalties JSONB
);

-- Company compliance config
CREATE TABLE IF NOT EXISTS company_legal_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  iso CHAR(2) NOT NULL,
  enabled_features JSONB NOT NULL,
  warnings JSONB NOT NULL,
  required_actions JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee certifications (e.g., HACCP)
CREATE TABLE IF NOT EXISTS employee_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  company_id UUID NOT NULL,
  certification_type VARCHAR NOT NULL, -- e.g., 'HACCP'
  issued_at DATE NOT NULL,
  expires_at DATE,
  document_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance audits (immutable log)
CREATE TABLE IF NOT EXISTS compliance_audits (
  id BIGSERIAL PRIMARY KEY,
  company_id UUID NOT NULL,
  iso CHAR(2) NOT NULL,
  event_type VARCHAR NOT NULL, -- e.g., 'VALIDATE_OPERATION', 'CONFIG_UPDATE'
  payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legal violations
CREATE TABLE IF NOT EXISTS legal_violations (
  id BIGSERIAL PRIMARY KEY,
  company_id UUID NOT NULL,
  iso CHAR(2) NOT NULL,
  violation_code VARCHAR NOT NULL,
  message TEXT NOT NULL,
  operation_type VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HACCP logs (temperature, etc.)
CREATE TABLE IF NOT EXISTS haccp_logs (
  id BIGSERIAL PRIMARY KEY,
  company_id UUID NOT NULL,
  iso CHAR(2) NOT NULL,
  log_type VARCHAR NOT NULL, -- 'temperature', 'cleaning', 'inspection'
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
;
-- 004_active_invites.sql
-- BRIDGE: Enables "Connect via QR" (Mode B)
create table if not exists public.active_invites (
    id uuid primary key default gen_random_uuid(),
    restaurant_id text not null,
    -- Links to the "Mother" company
    code text not null unique,
    -- The human-readable code (e.g., CHEF-8829-XJ)
    qr_payload text not null,
    -- The scanning payload (e.g., chefi://connect?t=...)
    -- The Contract granted by this invite
    role_granted text not null default 'worker',
    -- 'worker' or 'manager'
    expires_at timestamptz not null default (now() + interval '24 hours'),
    redeemed_at timestamptz,
    redeemed_by_device_id text,
    created_at timestamptz default now()
);
-- RLS: Only authenticated managers can create invites
alter table public.active_invites enable row level security;
-- Policy: Managers can view/create invites for their restaurant
create policy "Managers can view invites" on public.active_invites for
select using (true);
-- Simplified for MVP (In prod: check restaurant_id match)
create policy "Managers can insert invites" on public.active_invites for
insert with check (true);
-- Simplified for MVP
-- Policy: Public (Staff App) can read invites ONLY by exact code match (Security by Obscurity + Expiration)
-- Note: In Supabase, we might use a function 'redeem_invite(code)' instead of direct select to hide the table.
-- For MVP, we'll allow select if they know the ID (unlikely) or valid code.;
