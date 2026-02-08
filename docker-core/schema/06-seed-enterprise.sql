-- =============================================================================
-- CHEFIAPP CORE - Seed ENTERPRISE (ambiente local real)
-- =============================================================================
-- Aplicado após 05-device-kinds.sql.
-- Transforma o restaurante piloto (seeds_dev) em restaurante ENTERPRISE funcional:
--   status=active, product_mode=live, caixa aberto, módulos TPV/KDS instalados,
--   setup_status completo. Nenhum mock; tudo observável no Core.
-- =============================================================================

-- ID do restaurante piloto (02-seeds-dev.sql)
-- 00000000-0000-0000-0000-000000000100

-- =============================================================================
-- 1. Restaurante ENTERPRISE (status, modo, faturação, identidade)
-- =============================================================================
UPDATE public.gm_restaurants
SET
  status = 'active',
  product_mode = 'live',
  billing_status = 'trial',
  country = 'Portugal',
  timezone = 'Europe/Lisbon',
  currency = 'EUR',
  locale = 'pt-PT',
  type = 'Restaurante',
  updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000100';

-- =============================================================================
-- 2. Caixa aberto (turno iniciado) — uma única autoridade por restaurante
-- =============================================================================
INSERT INTO public.gm_cash_registers (
  restaurant_id,
  name,
  status,
  opened_at,
  opened_by,
  opening_balance_cents,
  updated_at
)
SELECT
  '00000000-0000-0000-0000-000000000100'::uuid,
  'Caixa Principal',
  'open',
  NOW(),
  'seed-enterprise',
  0,
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.gm_cash_registers
  WHERE restaurant_id = '00000000-0000-0000-0000-000000000100'::uuid AND status = 'open'
);

-- =============================================================================
-- 3. Módulos instalados (TPV, KDS, tasks, config, etc.) — Core como autoridade
-- =============================================================================
INSERT INTO public.installed_modules (restaurant_id, module_id, module_name, status)
VALUES
  ('00000000-0000-0000-0000-000000000100'::uuid, 'tpv', 'TPV (Point of Sale)', 'active'),
  ('00000000-0000-0000-0000-000000000100'::uuid, 'kds', 'KDS (Kitchen Display)', 'active'),
  ('00000000-0000-0000-0000-000000000100'::uuid, 'tasks', 'Tarefas', 'active'),
  ('00000000-0000-0000-0000-000000000100'::uuid, 'appstaff', 'AppStaff', 'active'),
  ('00000000-0000-0000-0000-000000000100'::uuid, 'health', 'Saúde', 'active'),
  ('00000000-0000-0000-0000-000000000100'::uuid, 'alerts', 'Alertas', 'active'),
  ('00000000-0000-0000-0000-000000000100'::uuid, 'config', 'Configurar restaurante', 'active'),
  ('00000000-0000-0000-0000-000000000100'::uuid, 'dashboard', 'Dashboard', 'active'),
  ('00000000-0000-0000-0000-000000000100'::uuid, 'restaurant-web', 'Presença Online', 'active'),
  ('00000000-0000-0000-0000-000000000100'::uuid, 'menu', 'Cardápio', 'active'),
  ('00000000-0000-0000-0000-000000000100'::uuid, 'system-tree', 'Entender o sistema', 'active')
ON CONFLICT (restaurant_id, module_id) DO UPDATE SET
  status = 'active',
  updated_at = NOW();

-- =============================================================================
-- 4. Setup status (onboarding completo — reflete no dashboard)
-- =============================================================================
INSERT INTO public.restaurant_setup_status (restaurant_id, sections, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000100'::uuid,
  '{"identity":true,"location":true,"menu":true,"schedule":true,"people":true,"payments":true,"publish":true}'::jsonb,
  NOW()
)
ON CONFLICT (restaurant_id) DO UPDATE SET
  sections = EXCLUDED.sections,
  updated_at = NOW();

-- =============================================================================
-- 5. Horários de funcionamento (Segunda a Sábado 09:00–22:00)
-- =============================================================================
INSERT INTO public.restaurant_schedules (restaurant_id, day_of_week, open, start_time, end_time, updated_at)
SELECT
  '00000000-0000-0000-0000-000000000100'::uuid,
  d,
  true,
  '09:00'::time,
  '22:00'::time,
  NOW()
FROM generate_series(1, 6) AS d
ON CONFLICT (restaurant_id, day_of_week) DO UPDATE SET
  open = true,
  start_time = '09:00'::time,
  end_time = '22:00'::time,
  updated_at = NOW();

INSERT INTO public.restaurant_schedules (restaurant_id, day_of_week, open, start_time, end_time, updated_at)
VALUES ('00000000-0000-0000-0000-000000000100'::uuid, 0, false, '00:00'::time, '00:00'::time, NOW())
ON CONFLICT (restaurant_id, day_of_week) DO UPDATE SET
  open = false,
  updated_at = NOW();

-- =============================================================================
-- 6. Funcionário mínimo (owner) — Bootstrap/FlowGate exigem membership
-- =============================================================================
-- user_id fixo para demo local: usar auth com este UUID ou criar user com este id.
INSERT INTO public.gm_restaurant_members (restaurant_id, user_id, role, updated_at)
SELECT
  '00000000-0000-0000-0000-000000000100'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  'owner',
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.gm_restaurant_members
  WHERE restaurant_id = '00000000-0000-0000-0000-000000000100'::uuid AND user_id = '00000000-0000-0000-0000-000000000002'::uuid
);

-- =============================================================================
-- Nota: Menu, categorias e produtos já vêm de 02-seeds-dev.sql.
-- Colunas station e prep_time_seconds são preenchidas por 03-migrations-consolidated.sql.
-- Nenhuma escrita direta fora do contrato; caixa e “turno” = gm_cash_registers (open).
-- =============================================================================
