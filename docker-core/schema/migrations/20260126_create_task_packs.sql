-- =============================================================================
-- TASK PACKS - Migration 01: Packs + Templates
-- =============================================================================
-- Data: 2026-01-26
-- Objetivo: Sistema de Task Packs (OPS + COMPLIANCE) por país/região/organização
-- =============================================================================

-- =============================================================================
-- 1. TASK PACKS (Catálogo de Packs)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.gm_task_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE, -- Ex: 'ops.core.v1', 'compliance.eu.generic.v1'
  name TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  description TEXT,
  country_code TEXT, -- NULL = universal, 'BR', 'PT', 'US', etc
  region_code TEXT, -- NULL = todo país, 'SP', 'RJ', etc
  org_mode TEXT CHECK (org_mode IN ('SOLO', 'SMB', 'ENTERPRISE')) DEFAULT 'SOLO',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(code, version)
);

-- =============================================================================
-- 2. TASK TEMPLATES (Templates dentro de Packs)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.gm_task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES public.gm_task_packs(id) ON DELETE CASCADE,
  code TEXT NOT NULL, -- Ex: 'daily_open', 'temp_log', 'item_delay'
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'OPS', 'COMPLIANCE', 'MAINTENANCE', etc
  department TEXT, -- 'KITCHEN', 'BAR', 'SERVICE', 'MANAGEMENT'
  station TEXT CHECK (station IN ('BAR', 'KITCHEN', 'SERVICE', 'MANAGEMENT')) DEFAULT NULL,
  role_targets JSONB DEFAULT '[]'::jsonb, -- ['chef', 'waiter', 'manager']
  
  -- Agendamento
  schedule_cron TEXT, -- NULL = não agendado, '0 8 * * *' = diário 8h
  event_trigger TEXT, -- NULL = não por evento, 'item_delay', 'order_ready_no_delivery'
  
  -- Compliance
  required_evidence TEXT, -- 'NONE', 'TEMP_LOG', 'PHOTO', 'SIGNATURE', 'TEXT'
  legal_weight TEXT, -- 'NONE', 'RECOMMENDED', 'REQUIRED', 'AUDIT_CRITICAL'
  
  -- Schema de contexto (JSON Schema)
  context_schema JSONB DEFAULT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(pack_id, code)
);

-- =============================================================================
-- 3. RESTAURANT PACKS (Ativação de Packs por Restaurante)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.gm_restaurant_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  pack_id UUID NOT NULL REFERENCES public.gm_task_packs(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  version_locked TEXT, -- NULL = sempre última versão, '1.0.0' = versão fixa
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(restaurant_id, pack_id)
);

-- =============================================================================
-- 4. ATUALIZAR gm_tasks para linkar com templates
-- =============================================================================
ALTER TABLE public.gm_tasks
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.gm_task_templates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS evidence_json JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS date_bucket DATE; -- Para idempotência de tarefas agendadas

-- =============================================================================
-- 5. ÍNDICES
-- =============================================================================

-- Task Packs
CREATE INDEX IF NOT EXISTS idx_task_packs_code ON public.gm_task_packs(code);
CREATE INDEX IF NOT EXISTS idx_task_packs_country ON public.gm_task_packs(country_code) WHERE country_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_packs_org_mode ON public.gm_task_packs(org_mode);
CREATE INDEX IF NOT EXISTS idx_task_packs_active ON public.gm_task_packs(is_active) WHERE is_active = true;

-- Task Templates
CREATE INDEX IF NOT EXISTS idx_task_templates_pack ON public.gm_task_templates(pack_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_category ON public.gm_task_templates(category);
CREATE INDEX IF NOT EXISTS idx_task_templates_department ON public.gm_task_templates(department) WHERE department IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_templates_station ON public.gm_task_templates(station) WHERE station IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_templates_schedule ON public.gm_task_templates(schedule_cron) WHERE schedule_cron IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_templates_event ON public.gm_task_templates(event_trigger) WHERE event_trigger IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_templates_active ON public.gm_task_templates(is_active) WHERE is_active = true;

-- Restaurant Packs
CREATE INDEX IF NOT EXISTS idx_restaurant_packs_restaurant ON public.gm_restaurant_packs(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_packs_pack ON public.gm_restaurant_packs(pack_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_packs_enabled ON public.gm_restaurant_packs(restaurant_id, enabled) WHERE enabled = true;

-- Tasks (atualizados)
CREATE INDEX IF NOT EXISTS idx_tasks_template ON public.gm_tasks(template_id) WHERE template_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_date_bucket ON public.gm_tasks(restaurant_id, template_id, date_bucket) WHERE date_bucket IS NOT NULL;

-- =============================================================================
-- 6. COMENTÁRIOS
-- =============================================================================
COMMENT ON TABLE public.gm_task_packs IS 'Catálogo de Task Packs (OPS + COMPLIANCE) por país/região/organização';
COMMENT ON TABLE public.gm_task_templates IS 'Templates de tarefas dentro de packs (agendadas ou por evento)';
COMMENT ON TABLE public.gm_restaurant_packs IS 'Ativação de packs por restaurante';
COMMENT ON COLUMN public.gm_task_templates.schedule_cron IS 'Cron expression para tarefas agendadas (NULL = não agendado)';
COMMENT ON COLUMN public.gm_task_templates.event_trigger IS 'Evento que dispara tarefa (NULL = não por evento)';
COMMENT ON COLUMN public.gm_task_templates.required_evidence IS 'Tipo de evidência requerida: NONE, TEMP_LOG, PHOTO, SIGNATURE, TEXT';
COMMENT ON COLUMN public.gm_task_templates.legal_weight IS 'Peso legal: NONE, RECOMMENDED, REQUIRED, AUDIT_CRITICAL';
COMMENT ON COLUMN public.gm_tasks.date_bucket IS 'Data bucket para idempotência de tarefas agendadas (YYYY-MM-DD)';
COMMENT ON COLUMN public.gm_tasks.evidence_json IS 'Evidência coletada (temperatura, foto, texto, etc)';
