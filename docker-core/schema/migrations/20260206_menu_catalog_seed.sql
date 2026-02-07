-- =============================================================================
-- Seed opcional: catálogo visual (menu digital) — dados de exemplo
-- =============================================================================
-- Pré-requisito: 20260206_menu_catalog.sql aplicada e gm_restaurants com pelo menos um registo.
-- Objetivo: ativar menu_catalog_enabled no primeiro restaurante e inserir menu + categorias + itens
-- para testar /menu-v2 com dados reais (MenuCatalogReader).
-- =============================================================================

-- 1. Ativar catálogo no primeiro restaurante
-- =============================================================================
UPDATE public.gm_restaurants
SET menu_catalog_enabled = true
WHERE id = (SELECT id FROM public.gm_restaurants ORDER BY created_at ASC LIMIT 1)
  AND menu_catalog_enabled = false;

-- 2. Inserir menu ativo (um por restaurante com flag ativa)
-- =============================================================================
INSERT INTO public.gm_catalog_menus (restaurant_id, name, language, is_active)
SELECT r.id, 'Catálogo principal', 'pt', true
FROM public.gm_restaurants r
WHERE r.menu_catalog_enabled = true
  AND NOT EXISTS (SELECT 1 FROM public.gm_catalog_menus m WHERE m.restaurant_id = r.id AND m.is_active = true)
LIMIT 1;

-- 3. Inserir categorias (para o menu acabado de criar ou já existente)
-- =============================================================================
INSERT INTO public.gm_catalog_categories (menu_id, title, sort_order)
SELECT m.id, c.title, c.sort_order
FROM public.gm_catalog_menus m
JOIN public.gm_restaurants r ON r.id = m.restaurant_id AND r.menu_catalog_enabled = true
CROSS JOIN (VALUES
  ('Entrantes', 0),
  ('Pratos principais', 1),
  ('Sobremesas', 2)
) AS c(title, sort_order)
WHERE m.is_active = true
  AND NOT EXISTS (SELECT 1 FROM public.gm_catalog_categories cat WHERE cat.menu_id = m.id)
LIMIT 3;

-- 4. Inserir itens de exemplo (categoria Entrantes)
-- =============================================================================
INSERT INTO public.gm_catalog_items (category_id, title, description, price_cents, image_url, allergens, is_available, sort_order)
SELECT cat.id, i.title, i.description, i.price_cents, i.image_url, i.allergens, true, i.sort_order
FROM public.gm_catalog_categories cat
JOIN public.gm_catalog_menus m ON m.id = cat.menu_id
JOIN public.gm_restaurants r ON r.id = m.restaurant_id AND r.menu_catalog_enabled = true
CROSS JOIN (VALUES
  ('Tabla de quesos', 'Selección de quesos nacionales.', 2200, 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=800&q=80', '["lacteos"]'::jsonb, 0),
  ('Gambas al ajillo', 'Gambas frescas al ajillo con aceite de oliva.', 1290, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', '["crustaceos"]'::jsonb, 1)
) AS i(title, description, price_cents, image_url, allergens, sort_order)
WHERE cat.title = 'Entrantes'
  AND m.is_active = true
  AND NOT EXISTS (SELECT 1 FROM public.gm_catalog_items it WHERE it.category_id = cat.id)
LIMIT 2;
