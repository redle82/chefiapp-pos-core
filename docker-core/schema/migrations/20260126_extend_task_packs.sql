-- =============================================================================
-- TASK PACKS - Extensão: Contexto Operacional
-- =============================================================================
-- Data: 2026-01-26
-- Objetivo: Adicionar filtros de contexto aos Task Packs
-- =============================================================================

-- =============================================================================
-- 1. ADICIONAR CAMPOS DE CONTEXTO AOS PACKS
-- =============================================================================
ALTER TABLE public.gm_task_packs
ADD COLUMN IF NOT EXISTS min_team_size INTEGER,
ADD COLUMN IF NOT EXISTS max_team_size INTEGER,
ADD COLUMN IF NOT EXISTS min_tables INTEGER,
ADD COLUMN IF NOT EXISTS max_tables INTEGER,
ADD COLUMN IF NOT EXISTS operation_type TEXT CHECK (operation_type IN ('AMBULANTE', 'BAR', 'RESTAURANTE', 'RESTAURANTE_GRANDE', 'MULTIUNIDADE')) DEFAULT NULL;

-- =============================================================================
-- 2. ATUALIZAR PACKS EXISTENTES COM CONTEXTO
-- =============================================================================
UPDATE public.gm_task_packs
SET 
  min_team_size = 1,
  max_team_size = 10,
  min_tables = 0,
  max_tables = 20,
  operation_type = 'RESTAURANTE'
WHERE code IN ('ops.core.v1', 'ops.kitchen.v1', 'ops.bar.v1', 'compliance.eu.generic.v1')
  AND min_team_size IS NULL;

-- =============================================================================
-- 3. ÍNDICES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_task_packs_team_size ON public.gm_task_packs(min_team_size, max_team_size) WHERE min_team_size IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_packs_tables ON public.gm_task_packs(min_tables, max_tables) WHERE min_tables IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_packs_operation_type ON public.gm_task_packs(operation_type) WHERE operation_type IS NOT NULL;

-- =============================================================================
-- 4. COMENTÁRIOS
-- =============================================================================
COMMENT ON COLUMN public.gm_task_packs.min_team_size IS 'Tamanho mínimo da equipe para este pack ser relevante';
COMMENT ON COLUMN public.gm_task_packs.max_team_size IS 'Tamanho máximo da equipe para este pack ser relevante';
COMMENT ON COLUMN public.gm_task_packs.min_tables IS 'Número mínimo de mesas para este pack ser relevante';
COMMENT ON COLUMN public.gm_task_packs.max_tables IS 'Número máximo de mesas para este pack ser relevante';
COMMENT ON COLUMN public.gm_task_packs.operation_type IS 'Tipo de operação: AMBULANTE, BAR, RESTAURANTE, RESTAURANTE_GRANDE, MULTIUNIDADE';
