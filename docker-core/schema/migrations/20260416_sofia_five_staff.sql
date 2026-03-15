-- =============================================================================
-- Sofia Gastrobar — Completar equipe a 5 funcionários (Fase 2 passo 3)
-- =============================================================================
-- Pré-requisitos: 20260207_seed_sofia_gastrobar (3 pessoas em gm_restaurant_people e gm_staff).
-- Objetivo: Adicionar 2 pessoas para total de 5 no restaurante 100.
-- Runbook: docs/ops/SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md, SOFIA_GASTROBAR_FASE2_AMBIENTE_VIVO.md
-- =============================================================================

-- migrate:up

-- 1. gm_restaurant_people — 2 novas pessoas (código/QR, check-in AppStaff)
INSERT INTO public.gm_restaurant_people (restaurant_id, name, role, staff_code, qr_token)
VALUES
  ('00000000-0000-0000-0000-000000000100', 'Bruno', 'staff', 'BRUNO', NULL),
  ('00000000-0000-0000-0000-000000000100', 'Carla', 'staff', 'CARLA', NULL)
ON CONFLICT (restaurant_id, staff_code) DO NOTHING;

-- 2. gm_staff — 2 novos (waiter/kitchen para shift_logs e KDS)
INSERT INTO public.gm_staff (id, restaurant_id, name, role, active)
VALUES
  ('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000100', 'Bruno', 'waiter', true),
  ('a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000100', 'Carla', 'kitchen', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, active = EXCLUDED.active;

-- migrate:down
DELETE FROM public.gm_staff WHERE id IN ('a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000005');
DELETE FROM public.gm_restaurant_people WHERE restaurant_id = '00000000-0000-0000-0000-000000000100' AND staff_code IN ('BRUNO', 'CARLA');
