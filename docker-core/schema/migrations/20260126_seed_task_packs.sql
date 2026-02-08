-- =============================================================================
-- TASK PACKS - Seed: Packs Mínimos
-- =============================================================================
-- Data: 2026-01-26
-- Objetivo: Criar packs mínimos idempotentes
-- =============================================================================

-- =============================================================================
-- 1. OPS.CORE.V1 (Universal - 10 templates)
-- =============================================================================
INSERT INTO public.gm_task_packs (code, name, version, description, country_code, org_mode, is_active)
VALUES ('ops.core.v1', 'Operações Core', '1.0.0', 'Templates universais de operações básicas', NULL, 'SOLO', true)
ON CONFLICT (code, version) DO NOTHING;

-- Templates OPS.CORE.V1
WITH pack AS (
  SELECT id FROM public.gm_task_packs WHERE code = 'ops.core.v1' AND version = '1.0.0'
)
INSERT INTO public.gm_task_templates (
  pack_id, code, title, description, category, department, station,
  schedule_cron, event_trigger, required_evidence, legal_weight, role_targets
)
SELECT 
  pack.id,
  template_data.code,
  template_data.title,
  template_data.description,
  template_data.category,
  template_data.department,
  template_data.station,
  template_data.schedule_cron,
  template_data.event_trigger,
  template_data.required_evidence,
  template_data.legal_weight,
  template_data.role_targets::jsonb
FROM pack,
(VALUES
  ('daily_open', 'Abertura Diária', 'Verificar equipamentos, estoque inicial, limpeza', 'OPS', 'MANAGEMENT', 'MANAGEMENT', '0 8 * * *', NULL, 'NONE', 'NONE', '["manager", "owner"]'),
  ('daily_close', 'Fechamento Diário', 'Fechamento de caixa, limpeza final, segurança', 'OPS', 'MANAGEMENT', 'MANAGEMENT', '0 22 * * *', NULL, 'NONE', 'NONE', '["manager", "owner"]'),
  ('shift_handover', 'Passagem de Turno', 'Transferência de informações entre turnos', 'OPS', 'MANAGEMENT', 'MANAGEMENT', NULL, NULL, 'TEXT', 'RECOMMENDED', '["manager", "supervisor"]'),
  ('clean_kitchen', 'Limpeza Cozinha', 'Limpeza geral da cozinha', 'OPS', 'KITCHEN', 'KITCHEN', '0 14 * * *', NULL, 'PHOTO', 'RECOMMENDED', '["chef", "cook"]'),
  ('clean_bar', 'Limpeza Bar', 'Limpeza geral do bar', 'OPS', 'BAR', 'BAR', '0 14 * * *', NULL, 'PHOTO', 'RECOMMENDED', '["bartender"]'),
  ('restock_kitchen', 'Reposição Cozinha', 'Verificar e repor estoque da cozinha', 'OPS', 'KITCHEN', 'KITCHEN', '0 9 * * *', NULL, 'NONE', 'NONE', '["chef", "cook"]'),
  ('restock_bar', 'Reposição Bar', 'Verificar e repor estoque do bar', 'OPS', 'BAR', 'BAR', '0 9 * * *', NULL, 'NONE', 'NONE', '["bartender"]'),
  ('equipment_check', 'Verificação de Equipamentos', 'Verificar funcionamento de equipamentos', 'OPS', 'MANAGEMENT', 'MANAGEMENT', '0 8 * * 1', NULL, 'TEXT', 'RECOMMENDED', '["manager", "technician"]'),
  ('waste_log', 'Registro de Desperdício', 'Registrar desperdício do dia', 'OPS', 'MANAGEMENT', 'MANAGEMENT', '0 23 * * *', NULL, 'TEXT', 'RECOMMENDED', '["manager", "chef"]'),
  ('staff_briefing', 'Briefing da Equipe', 'Reunião pré-turno com equipe', 'OPS', 'MANAGEMENT', 'MANAGEMENT', '0 8 * * *', NULL, 'NONE', 'NONE', '["manager", "supervisor"]')
) AS template_data(code, title, description, category, department, station, schedule_cron, event_trigger, required_evidence, legal_weight, role_targets)
ON CONFLICT (pack_id, code) DO NOTHING;

-- =============================================================================
-- 2. OPS.KITCHEN.V1 (5 templates)
-- =============================================================================
INSERT INTO public.gm_task_packs (code, name, version, description, country_code, org_mode, is_active)
VALUES ('ops.kitchen.v1', 'Operações Cozinha', '1.0.0', 'Templates específicos para cozinha', NULL, 'SOLO', true)
ON CONFLICT (code, version) DO NOTHING;

WITH pack AS (
  SELECT id FROM public.gm_task_packs WHERE code = 'ops.kitchen.v1' AND version = '1.0.0'
)
INSERT INTO public.gm_task_templates (
  pack_id, code, title, description, category, department, station,
  schedule_cron, event_trigger, required_evidence, legal_weight, role_targets
)
SELECT 
  pack.id,
  template_data.code,
  template_data.title,
  template_data.description,
  template_data.category,
  template_data.department,
  template_data.station,
  template_data.schedule_cron,
  template_data.event_trigger,
  template_data.required_evidence,
  template_data.legal_weight,
  template_data.role_targets::jsonb
FROM pack,
(VALUES
  ('temp_check_fridge', 'Verificação Temperatura Geladeira', 'Verificar temperatura de geladeiras e freezers', 'COMPLIANCE', 'KITCHEN', 'KITCHEN', '0 8,14,20 * * *', NULL, 'TEMP_LOG', 'REQUIRED', '["chef", "cook"]'),
  ('mise_en_place', 'Mise-en-Place', 'Preparação prévia de ingredientes', 'OPS', 'KITCHEN', 'KITCHEN', '0 9 * * *', NULL, 'PHOTO', 'RECOMMENDED', '["chef", "cook"]'),
  ('expiry_check', 'Verificação de Validade', 'Verificar validade de produtos perecíveis', 'COMPLIANCE', 'KITCHEN', 'KITCHEN', '0 8 * * *', NULL, 'TEXT', 'REQUIRED', '["chef", "cook"]'),
  ('clean_deep', 'Limpeza Profunda Cozinha', 'Limpeza profunda semanal da cozinha', 'OPS', 'KITCHEN', 'KITCHEN', '0 14 * * 0', NULL, 'PHOTO', 'RECOMMENDED', '["chef", "cook"]'),
  ('equipment_maintenance', 'Manutenção Equipamentos Cozinha', 'Manutenção preventiva de equipamentos', 'OPS', 'KITCHEN', 'KITCHEN', '0 8 * * 0', NULL, 'TEXT', 'RECOMMENDED', '["chef", "technician"]')
) AS template_data(code, title, description, category, department, station, schedule_cron, event_trigger, required_evidence, legal_weight, role_targets)
ON CONFLICT (pack_id, code) DO NOTHING;

-- =============================================================================
-- 3. OPS.BAR.V1 (5 templates)
-- =============================================================================
INSERT INTO public.gm_task_packs (code, name, version, description, country_code, org_mode, is_active)
VALUES ('ops.bar.v1', 'Operações Bar', '1.0.0', 'Templates específicos para bar', NULL, 'SOLO', true)
ON CONFLICT (code, version) DO NOTHING;

WITH pack AS (
  SELECT id FROM public.gm_task_packs WHERE code = 'ops.bar.v1' AND version = '1.0.0'
)
INSERT INTO public.gm_task_templates (
  pack_id, code, title, description, category, department, station,
  schedule_cron, event_trigger, required_evidence, legal_weight, role_targets
)
SELECT 
  pack.id,
  template_data.code,
  template_data.title,
  template_data.description,
  template_data.category,
  template_data.department,
  template_data.station,
  template_data.schedule_cron,
  template_data.event_trigger,
  template_data.required_evidence,
  template_data.legal_weight,
  template_data.role_targets::jsonb
FROM pack,
(VALUES
  ('temp_check_bar_fridge', 'Verificação Temperatura Bar', 'Verificar temperatura de geladeiras do bar', 'COMPLIANCE', 'BAR', 'BAR', '0 8,14,20 * * *', NULL, 'TEMP_LOG', 'REQUIRED', '["bartender"]'),
  ('bar_setup', 'Preparação do Bar', 'Preparação e organização do bar para serviço', 'OPS', 'BAR', 'BAR', '0 9 * * *', NULL, 'PHOTO', 'RECOMMENDED', '["bartender"]'),
  ('stock_check_bar', 'Verificação Estoque Bar', 'Verificar estoque de bebidas e ingredientes', 'OPS', 'BAR', 'BAR', '0 8 * * *', NULL, 'TEXT', 'NONE', '["bartender", "manager"]'),
  ('clean_bar_deep', 'Limpeza Profunda Bar', 'Limpeza profunda semanal do bar', 'OPS', 'BAR', 'BAR', '0 14 * * 0', NULL, 'PHOTO', 'RECOMMENDED', '["bartender"]'),
  ('glassware_check', 'Verificação Vidraria', 'Verificar limpeza e estoque de vidraria', 'OPS', 'BAR', 'BAR', '0 8 * * *', NULL, 'PHOTO', 'RECOMMENDED', '["bartender"]')
) AS template_data(code, title, description, category, department, station, schedule_cron, event_trigger, required_evidence, legal_weight, role_targets)
ON CONFLICT (pack_id, code) DO NOTHING;

-- =============================================================================
-- 4. COMPLIANCE.EU.GENERIC.V1 (5 templates genéricos)
-- =============================================================================
INSERT INTO public.gm_task_packs (code, name, version, description, country_code, org_mode, is_active)
VALUES ('compliance.eu.generic.v1', 'Compliance EU Genérico', '1.0.0', 'Templates genéricos de compliance (sem prometer lei específica)', 'EU', 'SOLO', true)
ON CONFLICT (code, version) DO NOTHING;

WITH pack AS (
  SELECT id FROM public.gm_task_packs WHERE code = 'compliance.eu.generic.v1' AND version = '1.0.0'
)
INSERT INTO public.gm_task_templates (
  pack_id, code, title, description, category, department, station,
  schedule_cron, event_trigger, required_evidence, legal_weight, role_targets
)
SELECT 
  pack.id,
  template_data.code,
  template_data.title,
  template_data.description,
  template_data.category,
  template_data.department,
  template_data.station,
  template_data.schedule_cron,
  template_data.event_trigger,
  template_data.required_evidence,
  template_data.legal_weight,
  template_data.role_targets::jsonb
FROM pack,
(VALUES
  ('temp_log_daily', 'Registro Diário de Temperaturas', 'Registrar temperaturas de equipamentos (quando aplicável)', 'COMPLIANCE', 'KITCHEN', 'KITCHEN', '0 8,14,20 * * *', NULL, 'TEMP_LOG', 'AUDIT_CRITICAL', '["chef", "cook"]'),
  ('allergen_log', 'Registro de Alergénios', 'Registrar informações sobre alergénios (quando aplicável)', 'COMPLIANCE', 'KITCHEN', 'KITCHEN', '0 8 * * *', NULL, 'TEXT', 'AUDIT_CRITICAL', '["chef", "manager"]'),
  ('deep_clean_log', 'Registro de Limpeza Profunda', 'Registrar limpeza profunda realizada (quando aplicável)', 'COMPLIANCE', 'KITCHEN', 'KITCHEN', '0 14 * * 0', NULL, 'PHOTO', 'AUDIT_CRITICAL', '["chef", "cook"]'),
  ('batch_trace', 'Rastreio de Lote', 'Registrar rastreio de lote de produtos (quando aplicável)', 'COMPLIANCE', 'KITCHEN', 'KITCHEN', NULL, NULL, 'TEXT', 'AUDIT_CRITICAL', '["chef", "manager"]'),
  ('haccp_check', 'Verificação HACCP Genérica', 'Verificação genérica de pontos críticos (quando aplicável)', 'COMPLIANCE', 'KITCHEN', 'KITCHEN', '0 8 * * *', NULL, 'TEXT', 'AUDIT_CRITICAL', '["chef", "manager"]')
) AS template_data(code, title, description, category, department, station, schedule_cron, event_trigger, required_evidence, legal_weight, role_targets)
ON CONFLICT (pack_id, code) DO NOTHING;

-- =============================================================================
-- 5. ATIVAR PACKS NO RESTAURANTE PILOTO
-- =============================================================================
-- Assumindo que o restaurante piloto tem ID 'bbce08c7-63c0-473d-b693-ec2997f73a68'
WITH restaurant AS (
  SELECT 'bbce08c7-63c0-473d-b693-ec2997f73a68'::UUID AS id
),
packs AS (
  SELECT id, code FROM public.gm_task_packs 
  WHERE code IN ('ops.core.v1', 'ops.kitchen.v1', 'ops.bar.v1', 'compliance.eu.generic.v1')
)
INSERT INTO public.gm_restaurant_packs (restaurant_id, pack_id, enabled, version_locked)
SELECT 
  restaurant.id,
  packs.id,
  true,
  NULL -- Sempre última versão
FROM restaurant, packs
ON CONFLICT (restaurant_id, pack_id) DO UPDATE
SET enabled = true, updated_at = NOW();
