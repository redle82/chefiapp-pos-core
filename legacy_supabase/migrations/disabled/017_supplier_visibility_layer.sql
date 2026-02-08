-- 017_supplier_visibility_layer.sql
-- 1. Suppliers Table (Global partners or tenant-specific)
create table if not exists public.suppliers (
    id uuid not null default gen_random_uuid() primary key,
    created_at timestamptz default now(),
    name text not null,
    slug text not null unique,
    -- e.g., 'estrella-galicia'
    logo_url text,
    -- Main logo
    brand_color text,
    -- For UI tinting
    is_active boolean default true,
    metadata jsonb default '{}'::jsonb -- Contact info, deals, etc.
);
-- 2. Campaigns (A specific marketing push from a supplier)
create table if not exists public.campaigns (
    id uuid not null default gen_random_uuid() primary key,
    supplier_id uuid references public.suppliers(id) on delete cascade,
    name text not null,
    -- e.g., "Summer 2025"
    type text not null check (
        type in ('BRANDING', 'PRODUCT_FOCUS', 'SPONSORSHIP')
    ),
    start_date date,
    end_date date,
    is_active boolean default true,
    assets jsonb default '{}'::jsonb,
    -- Store specific images { "banner_desktop": "...", "badge": "..." }
    created_at timestamptz default now()
);
-- 3. Placements (Where a campaign actually runs for a specific restaurant)
create table if not exists public.campaign_placements (
    id uuid not null default gen_random_uuid() primary key,
    campaign_id uuid references public.campaigns(id) on delete cascade,
    tenant_id uuid references public.gm_restaurants(id) on delete cascade,
    -- The restaurant
    location text not null check (
        location in (
            'MENU_HEADER',
            'CATEGORY_BADGE',
            'PRODUCT_SUGGESTION',
            'DIGITAL_COASTER'
        )
    ),
    context_id text,
    -- Optional: ID of the category or product if location is specific
    status text default 'ACTIVE' check (status in ('ACTIVE', 'PAUSED', 'REJECTED')),
    created_at timestamptz default now()
);
-- 4. Impressions (Lightweight analytics)
create table if not exists public.analytics_impressions (
    id uuid not null default gen_random_uuid() primary key,
    placement_id uuid references public.campaign_placements(id) on delete cascade,
    tenant_id uuid,
    -- Denormalized for query speed
    event_type text default 'VIEW' check (event_type in ('VIEW', 'CLICK', 'CONVERSION')),
    created_at timestamptz default now()
);
-- Indexes
create index idx_placements_tenant on public.campaign_placements(tenant_id);
create index idx_placements_location on public.campaign_placements(location);
create index idx_impressions_placement on public.analytics_impressions(placement_id);
-- RLS Policies
-- Public read access for rendering menus
alter table public.suppliers enable row level security;
create policy "Suppliers are viewable by everyone" on public.suppliers for
select using (true);
alter table public.campaigns enable row level security;
create policy "Campaigns are viewable by everyone" on public.campaigns for
select using (true);
alter table public.campaign_placements enable row level security;
create policy "Placements are viewable by everyone" on public.campaign_placements for
select using (true);
-- Analytics insert public (or anon)
alter table public.analytics_impressions enable row level security;
create policy "Anyone can insert impressions" on public.analytics_impressions for
insert with check (true);