-- =============================================================================
-- Sofia E2E Product — Produto de teste para validar circuito Admin → superfícies
-- Date: 2026-04-15
-- Purpose: Inserir produto "SOFIA E2E PRODUCT" no restaurante Sofia (id 100)
--          para smoke: Admin, TPV, Web, QR Mesa, Comandeiro.
-- Runbook: docs/ops/SOFIA_GASTROBAR_CATALOGO_CIRCUITO.md
-- =============================================================================

-- migrate:up
-- ID fixo para fácil identificação e idempotência
INSERT INTO public.gm_products (
  id,
  restaurant_id,
  category_id,
  name,
  description,
  price_cents,
  available,
  station,
  prep_time_seconds,
  prep_category
)
SELECT
  'e0000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000100'::uuid,
  (SELECT id FROM public.gm_menu_categories
   WHERE restaurant_id = '00000000-0000-0000-0000-000000000100'
   ORDER BY sort_order ASC LIMIT 1),
  'SOFIA E2E PRODUCT',
  'Produto de validação do circuito de catálogo Sofia (Admin → TPV, Web, QR, Comandeiro).',
  100,
  true,
  'KITCHEN',
  300,
  'main'
WHERE NOT EXISTS (
  SELECT 1 FROM public.gm_products
  WHERE id = 'e0000000-0000-0000-0000-000000000001'::uuid
);

-- migrate:down
DELETE FROM public.gm_products WHERE id = 'e0000000-0000-0000-0000-000000000001'::uuid;
