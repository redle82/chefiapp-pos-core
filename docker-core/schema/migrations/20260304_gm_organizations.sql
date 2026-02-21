-- =============================================================================
-- GM_ORGANIZATIONS — SaaS Organizational Layer
-- =============================================================================
-- Date: 2026-03-04
-- Purpose: Create the Organization entity that owns restaurants.
--          Replaces the dropped saas_tenants table with a proper SaaS structure.
--
-- Model:
--   Organization (1) ──► (N) Restaurants
--   Organization (1) ──► (N) Org Members (owner, admin, billing)
--   Organization (1) ──► (1) Merchant Subscription (billing at org level)
--
-- Backfill: Creates 1 organization per distinct owner_id in gm_restaurants,
--           and links each restaurant via the org_id column.
-- =============================================================================

-- 1. Organizations table
CREATE TABLE IF NOT EXISTS public.gm_organizations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    slug            TEXT UNIQUE NOT NULL,
    owner_id        UUID NOT NULL,                -- Keycloak user ID of the org creator
    billing_email   TEXT,
    country         TEXT NOT NULL DEFAULT 'PT',    -- ISO 3166-1 alpha-2
    tax_id          TEXT,                          -- NIF / VAT number
    logo_url        TEXT,
    plan_tier       TEXT NOT NULL DEFAULT 'trial'
        CHECK (plan_tier IN ('free', 'trial', 'starter', 'pro', 'enterprise')),
    max_restaurants INTEGER NOT NULL DEFAULT 1,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gm_organizations_owner ON public.gm_organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_gm_organizations_slug ON public.gm_organizations(slug);

COMMENT ON TABLE public.gm_organizations IS
  'SaaS organization entity. Owns restaurants, holds billing context. Replaces legacy saas_tenants.';

-- 2. Organization members (org-level roles: owner, admin, billing)
CREATE TABLE IF NOT EXISTS public.gm_org_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES public.gm_organizations(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL,                -- Keycloak user ID
    role            TEXT NOT NULL DEFAULT 'admin'
        CHECK (role IN ('owner', 'admin', 'billing', 'viewer')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_gm_org_members_user ON public.gm_org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_gm_org_members_org ON public.gm_org_members(org_id);

COMMENT ON TABLE public.gm_org_members IS
  'Organization-level membership. Grants access to the org admin panel (billing, restaurant management).';

-- 3. Add org_id column to gm_restaurants (nullable for backward compat)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gm_restaurants' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE public.gm_restaurants
      ADD COLUMN org_id UUID REFERENCES public.gm_organizations(id) ON DELETE SET NULL;
    CREATE INDEX idx_gm_restaurants_org ON public.gm_restaurants(org_id);
    COMMENT ON COLUMN public.gm_restaurants.org_id IS
      'Organization that owns this restaurant. NULL = legacy/unlinked.';
  END IF;
END $$;

-- 4. Auto-update timestamps
CREATE OR REPLACE FUNCTION update_gm_organizations_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_gm_organizations_updated ON public.gm_organizations;
CREATE TRIGGER trg_gm_organizations_updated
  BEFORE UPDATE ON public.gm_organizations
  FOR EACH ROW EXECUTE FUNCTION update_gm_organizations_timestamp();

CREATE OR REPLACE FUNCTION update_gm_org_members_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_gm_org_members_updated ON public.gm_org_members;
CREATE TRIGGER trg_gm_org_members_updated
  BEFORE UPDATE ON public.gm_org_members
  FOR EACH ROW EXECUTE FUNCTION update_gm_org_members_timestamp();

-- 5. Backfill: Create 1 organization per distinct owner_id in gm_restaurants
--    Only runs if there are restaurants without org_id
DO $$
DECLARE
  rec RECORD;
  new_org_id UUID;
  slug_base TEXT;
  slug_candidate TEXT;
  suffix INT := 0;
BEGIN
  -- For each distinct owner_id that has restaurants without org_id
  FOR rec IN
    SELECT DISTINCT owner_id, MIN(name) as first_name
    FROM public.gm_restaurants
    WHERE owner_id IS NOT NULL AND org_id IS NULL
    GROUP BY owner_id
  LOOP
    -- Generate a slug from the first restaurant name
    slug_base := lower(regexp_replace(rec.first_name, '[^a-zA-Z0-9]+', '-', 'g'));
    slug_base := trim(both '-' from slug_base);
    IF slug_base = '' OR slug_base IS NULL THEN
      slug_base := 'org';
    END IF;

    -- Ensure slug uniqueness
    slug_candidate := slug_base;
    suffix := 0;
    WHILE EXISTS (SELECT 1 FROM public.gm_organizations WHERE slug = slug_candidate) LOOP
      suffix := suffix + 1;
      slug_candidate := slug_base || '-' || suffix;
    END LOOP;

    -- Create the organization
    INSERT INTO public.gm_organizations (name, slug, owner_id, plan_tier)
    VALUES (
      rec.first_name || ' (Organização)',
      slug_candidate,
      rec.owner_id,
      'trial'
    )
    RETURNING id INTO new_org_id;

    -- Link all restaurants of this owner to the new org
    UPDATE public.gm_restaurants
    SET org_id = new_org_id, updated_at = NOW()
    WHERE owner_id = rec.owner_id AND org_id IS NULL;

    -- Create org member entry for the owner
    INSERT INTO public.gm_org_members (org_id, user_id, role)
    VALUES (new_org_id, rec.owner_id, 'owner')
    ON CONFLICT (org_id, user_id) DO NOTHING;
  END LOOP;
END $$;

-- 6. RLS (relaxed for dev — tighten for production)
ALTER TABLE public.gm_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_org_members ENABLE ROW LEVEL SECURITY;

-- Dev-mode policies: allow all via anon/authenticated
CREATE POLICY "org_read_all" ON public.gm_organizations FOR SELECT USING (true);
CREATE POLICY "org_insert_all" ON public.gm_organizations FOR INSERT WITH CHECK (true);
CREATE POLICY "org_update_all" ON public.gm_organizations FOR UPDATE USING (true);

CREATE POLICY "org_member_read_all" ON public.gm_org_members FOR SELECT USING (true);
CREATE POLICY "org_member_insert_all" ON public.gm_org_members FOR INSERT WITH CHECK (true);
CREATE POLICY "org_member_update_all" ON public.gm_org_members FOR UPDATE USING (true);

-- 7. Grant PostgREST access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gm_organizations TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gm_org_members TO anon, authenticated;
