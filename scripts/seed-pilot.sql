-- =============================================================================
-- CHEFIAPP CORE — Pilot Seed (v1.0.0-rc1)
-- =============================================================================
-- Seeds the minimum data for a real pilot restaurant deployment.
-- Run AFTER migrations have been applied.
--
-- Usage:
--   docker exec -i chefiapp-db psql -U $POSTGRES_USER -d $POSTGRES_DB < scripts/seed-pilot.sql
--   OR: psql $DATABASE_URL < scripts/seed-pilot.sql
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Tenant
-- ---------------------------------------------------------------------------
INSERT INTO public.saas_tenants (id, name, slug)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Restaurante Piloto',
    'restaurante-piloto'
)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Restaurant
-- ---------------------------------------------------------------------------
INSERT INTO public.gm_restaurants (
    id, tenant_id, name, slug,
    onboarding_complete, status, country
)
VALUES (
    'a0000000-0000-0000-0000-000000000100',
    'a0000000-0000-0000-0000-000000000001',
    'Restaurante Piloto',
    'restaurante-piloto',
    true,
    'active',
    'PT'
)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Merchant Subscription (free pilot)
-- ---------------------------------------------------------------------------
INSERT INTO public.merchant_subscriptions (
    merchant_id, business_name, plan_tier, status
)
VALUES (
    'a0000000-0000-0000-0000-000000000100',
    'Restaurante Piloto',
    'starter',
    'active'
)
ON CONFLICT (merchant_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Menu Categories
-- ---------------------------------------------------------------------------
INSERT INTO public.gm_menu_categories (id, restaurant_id, name, sort_order)
SELECT
    gen_random_uuid(),
    'a0000000-0000-0000-0000-000000000100',
    name, sort_order
FROM (VALUES
    ('Entradas', 1),
    ('Pratos Principais', 2),
    ('Bebidas', 3),
    ('Sobremesas', 4)
) AS c(name, sort_order)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Sample Products (real prices in cents EUR)
-- ---------------------------------------------------------------------------
INSERT INTO public.gm_products (id, restaurant_id, category_id, name, price_cents, available)
SELECT
    gen_random_uuid(),
    'a0000000-0000-0000-0000-000000000100',
    (SELECT id FROM public.gm_menu_categories
     WHERE restaurant_id = 'a0000000-0000-0000-0000-000000000100'
       AND name = cat LIMIT 1),
    name,
    price_cents,
    true
FROM (VALUES
    ('Entradas',           'Bruschetta Clássica',     850),
    ('Entradas',           'Sopa do Dia',             650),
    ('Pratos Principais',  'Frango Grelhado',        1490),
    ('Pratos Principais',  'Bacalhau à Brás',        1890),
    ('Pratos Principais',  'Hambúrguer Artesanal',   1380),
    ('Bebidas',            'Água 50cl',               200),
    ('Bebidas',            'Sumo Natural',            400),
    ('Bebidas',            'Cerveja Artesanal',       500),
    ('Sobremesas',         'Tiramisu',                750),
    ('Sobremesas',         'Bolo de Chocolate',       680)
) AS p(cat, name, price_cents)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. Tables (8 tables)
-- ---------------------------------------------------------------------------
INSERT INTO public.gm_tables (id, restaurant_id, number, status)
SELECT
    gen_random_uuid(),
    'a0000000-0000-0000-0000-000000000100',
    n,
    'closed'
FROM generate_series(1, 8) AS n
ON CONFLICT (restaurant_id, number) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7. Restaurant Web Profile (for customer-facing portal)
-- ---------------------------------------------------------------------------
INSERT INTO public.restaurant_web_profiles (
    restaurant_id, company_id, slug, status, theme, web_level,
    hero, highlights, contacts, delivery_zones
)
VALUES (
    'a0000000-0000-0000-0000-000000000100',
    'a0000000-0000-0000-0000-000000000001',
    'restaurante-piloto',
    'published',
    'minimal',
    'BASIC',
    '{"title": "Restaurante Piloto", "subtitle": "Comida artesanal"}'::jsonb,
    '[]'::jsonb,
    '{"phone": "+351900000000"}'::jsonb,
    '[]'::jsonb
)
ON CONFLICT (restaurant_id) DO UPDATE SET updated_at = NOW();

COMMIT;

-- =============================================================================
-- POST-SEED CHECKLIST
-- =============================================================================
-- 1. Set in .env: WEB_MODULE_RESTAURANT_ID=a0000000-0000-0000-0000-000000000100
-- 2. Create Keycloak user:
--    docker exec chefiapp-keycloak /opt/keycloak/bin/kcadm.sh \
--      config credentials --server http://localhost:8080 \
--      --realm master --user $KEYCLOAK_ADMIN --password $KEYCLOAK_ADMIN_PASSWORD
--    docker exec chefiapp-keycloak /opt/keycloak/bin/kcadm.sh \
--      create users -r chefiapp \
--      -s username=piloto@restaurante.pt \
--      -s enabled=true \
--      -s email=piloto@restaurante.pt \
--      -s "attributes.restaurant_id=[\"a0000000-0000-0000-0000-000000000100\"]"
--    docker exec chefiapp-keycloak /opt/keycloak/bin/kcadm.sh \
--      set-password -r chefiapp --username piloto@restaurante.pt --new-password piloto123
-- 3. Run smoke test: curl http://localhost:3001/gm_restaurants?slug=eq.restaurante-piloto
-- =============================================================================
