-- =============================================================================
-- gm_tasks: add MODO_INTERNO, PEDIDO_NOVO to task_type
-- Ref: docs/FLOW_KDS_TASKS_TABLES.md, OPERATIONAL_ORCHESTRATOR_CONTRACT
-- =============================================================================

-- Drop existing check and add extended task_type
ALTER TABLE public.gm_tasks DROP CONSTRAINT IF EXISTS gm_tasks_task_type_check;
ALTER TABLE public.gm_tasks ADD CONSTRAINT gm_tasks_task_type_check CHECK (task_type IN (
  'ATRASO_ITEM',
  'ACUMULO_BAR',
  'ENTREGA_PENDENTE',
  'ITEM_CRITICO',
  'PEDIDO_ESQUECIDO',
  'MODO_INTERNO',
  'PEDIDO_NOVO'
));

-- Optional zone_id for zone-scoped tasks (phase 2)
ALTER TABLE public.gm_tasks
  ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES public.gm_restaurant_zones(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_gm_tasks_zone_id ON public.gm_tasks(zone_id) WHERE zone_id IS NOT NULL;
COMMENT ON COLUMN public.gm_tasks.zone_id IS 'Zona da tarefa (para regras de elegibilidade por zona). Ref: FLOW_KDS_TASKS_TABLES.';
