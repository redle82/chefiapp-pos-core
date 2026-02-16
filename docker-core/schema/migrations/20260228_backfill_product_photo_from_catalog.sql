-- =============================================================================
-- Backfill gm_products.photo_url from gm_catalog_items.image_url
-- Date: 2026-02-28
-- Purpose: Garantir que produtos no TPV mostram imagens de comida (do catálogo)
--          em vez de placeholders ou URLs incorretas (paisagens/pessoas).
-- =============================================================================

UPDATE public.gm_products
SET photo_url = sub.image_url
FROM (
  SELECT ci.title AS item_name, ci.image_url, cm.restaurant_id
  FROM public.gm_catalog_items ci
  JOIN public.gm_catalog_categories cc ON cc.id = ci.category_id
  JOIN public.gm_catalog_menus cm ON cm.id = cc.menu_id
) sub
WHERE sub.item_name = gm_products.name
  AND sub.restaurant_id = gm_products.restaurant_id
  AND (gm_products.photo_url IS NULL OR gm_products.photo_url = '');
