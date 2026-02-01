-- =============================================================================
-- CHEFIAPP CORE - Seeds para Desenvolvimento
-- =============================================================================
-- Dados mínimos para desenvolvimento local.
-- Não inclui dados de produção ou históricos.
-- =============================================================================

-- 1. Tenant de Teste
INSERT INTO public.saas_tenants (id, name, slug)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Tenant Dev', 'tenant-dev')
ON CONFLICT (slug) DO NOTHING;

-- 2. Restaurante Piloto
INSERT INTO public.gm_restaurants (id, tenant_id, name, slug)
VALUES 
    ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000001', 'Restaurante Piloto', 'restaurante-piloto')
ON CONFLICT (slug) DO NOTHING;

-- 3. Categorias de Menu
INSERT INTO public.gm_menu_categories (id, restaurant_id, name, sort_order)
SELECT 
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000100',
    name,
    sort_order
FROM (VALUES
    ('Entradas', 1),
    ('Pratos Principais', 2),
    ('Bebidas', 3),
    ('Sobremesas', 4)
) AS categories(name, sort_order)
ON CONFLICT DO NOTHING;

-- 4. Produtos (exemplo mínimo)
INSERT INTO public.gm_products (id, restaurant_id, category_id, name, price_cents, available)
SELECT 
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000100',
    (SELECT id FROM public.gm_menu_categories WHERE restaurant_id = '00000000-0000-0000-0000-000000000100' AND name = category_name LIMIT 1),
    name,
    price_cents,
    true
FROM (VALUES
    ('Entradas', 'Bruschetta', 850),
    ('Entradas', 'Nachos', 1200),
    ('Pratos Principais', 'Hambúrguer Artesanal', 1800),
    ('Pratos Principais', 'Pizza Margherita', 1600),
    ('Bebidas', 'Água', 200),
    ('Bebidas', 'Refrigerante', 350),
    ('Sobremesas', 'Tiramisú', 800)
) AS products(category_name, name, price_cents)
ON CONFLICT DO NOTHING;

-- 5. Mesas (10 mesas)
INSERT INTO public.gm_tables (id, restaurant_id, number, status)
SELECT 
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000100',
    number,
    'closed'
FROM generate_series(1, 10) AS number
ON CONFLICT (restaurant_id, number) DO NOTHING;
