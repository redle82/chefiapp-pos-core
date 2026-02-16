-- =============================================================================
-- Forçar fotos de comida por categoria (gm_catalog_items + gm_products)
-- Date: 2026-02-28
-- Purpose: Eliminar paisagens/placeholders; garantir apenas imagens de comida
--          no catálogo e nos produtos do TPV (URLs Unsplash verificadas).
-- =============================================================================

-- URLs de comida por tipo de categoria (Unsplash)
-- Tapas/Entradas: batatas fritas
-- Burgers: hambúrguer
-- Pizzas: pizza
-- Platos: carne grelhada
-- Ensaladas: salada
-- Zumos/Bowls: sumo / açaí
-- Postres: bolo
-- Bebidas: cocktail
-- Vinos: vinho
-- Cervezas: cerveja
-- Tostadas/Croissants: torrada
-- Cafés: café

-- 1) Atualizar gm_catalog_items.image_url por categoria
UPDATE public.gm_catalog_items ci
SET image_url = CASE
  WHEN cc.title ILIKE '%Tapas%' OR cc.title ILIKE '%Entrada%' THEN 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&q=80'
  WHEN cc.title ILIKE '%Gastroburger%' OR cc.title ILIKE '%Burger%' THEN 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80'
  WHEN cc.title ILIKE '%Pizza%' THEN 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80'
  WHEN cc.title ILIKE '%Plato%' OR cc.title ILIKE '%Principal%' THEN 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80'
  WHEN cc.title ILIKE '%Ensalada%' THEN 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80'
  WHEN cc.title ILIKE '%Zumo%' OR cc.title ILIKE '%Bowl%' THEN 'https://images.unsplash.com/photo-1621506283937-042d5ffd308b?w=800&q=80'
  WHEN cc.title ILIKE '%Postre%' THEN 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80'
  WHEN cc.title ILIKE '%Sangría%' OR cc.title ILIKE '%Coctel%' OR cc.title ILIKE '%Copa%' OR cc.title ILIKE '%Chupito%' OR cc.title ILIKE '%Licor%' THEN 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80'
  WHEN cc.title ILIKE '%Vino%' OR cc.title ILIKE '%Espumante%' THEN 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80'
  WHEN cc.title ILIKE '%Cerveza%' OR cc.title ILIKE '%Refresco%' THEN 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800&q=80'
  WHEN cc.title ILIKE '%Tostada%' OR cc.title ILIKE '%Croissant%' THEN 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80'
  WHEN cc.title ILIKE '%Café%' OR cc.title ILIKE '%Infusion%' THEN 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80'
  WHEN cc.title ILIKE '%VIP%' OR cc.title ILIKE '%Party%' THEN 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80'
  ELSE 'https://images.unsplash.com/photo-1565299505197-2ab0d9a65e2a?w=800&q=80'
END
FROM public.gm_catalog_categories cc
WHERE cc.id = ci.category_id;

-- 2) Sincronizar gm_products.photo_url a partir do catálogo (por nome)
UPDATE public.gm_products
SET photo_url = sub.image_url
FROM (
  SELECT ci.title AS item_name, ci.image_url, cm.restaurant_id, mc.id AS category_id
  FROM public.gm_catalog_items ci
  JOIN public.gm_catalog_categories cc ON cc.id = ci.category_id
  JOIN public.gm_catalog_menus cm ON cm.id = cc.menu_id
  JOIN public.gm_menu_categories mc ON mc.restaurant_id = cm.restaurant_id AND mc.name = cc.title
) sub
WHERE gm_products.category_id = sub.category_id
  AND gm_products.restaurant_id = sub.restaurant_id
  AND gm_products.name = sub.item_name;

-- 3) Catch-all: substituir quaisquer URLs picsum.photos restantes
UPDATE public.gm_products
SET photo_url = 'https://images.unsplash.com/photo-1565299505197-2ab0d9a65e2a?w=800&q=80'
WHERE photo_url LIKE '%picsum.photos%';
