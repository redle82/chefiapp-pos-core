-- =============================================================================
-- TASK ENGINE - Schema e Estrutura Base
-- =============================================================================
-- Data: 2026-01-26
-- Objetivo: Sistema de tarefas automáticas baseado em eventos operacionais
-- =============================================================================

-- Tabela de tarefas
CREATE TABLE IF NOT EXISTS public.gm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.gm_orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES public.gm_order_items(id) ON DELETE CASCADE,
  
  -- Tipo e contexto
  task_type TEXT NOT NULL CHECK (task_type IN (
    'ATRASO_ITEM',
    'ACUMULO_BAR',
    'ENTREGA_PENDENTE',
    'ITEM_CRITICO',
    'PEDIDO_ESQUECIDO'
  )),
  station TEXT CHECK (station IN ('BAR', 'KITCHEN', 'SERVICE')),
  priority TEXT NOT NULL CHECK (priority IN ('LOW', 'MEDIA', 'ALTA', 'CRITICA')) DEFAULT 'MEDIA',
  
  -- Mensagem e contexto
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb, -- Dados adicionais (tempo, itens, etc)
  
  -- Estado
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED')),
  assigned_to UUID, -- ID do usuário/staff (futuro)
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadados
  auto_generated BOOLEAN DEFAULT true,
  source_event TEXT -- Ex: 'item_delay', 'order_ready', etc
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tasks_restaurant_status ON public.gm_tasks(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_station_priority ON public.gm_tasks(station, priority) WHERE status = 'OPEN';
CREATE INDEX IF NOT EXISTS idx_tasks_order ON public.gm_tasks(order_id) WHERE status = 'OPEN';
CREATE INDEX IF NOT EXISTS idx_tasks_order_item ON public.gm_tasks(order_item_id) WHERE status = 'OPEN';
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.gm_tasks(created_at DESC) WHERE status = 'OPEN';

-- Comentários
COMMENT ON TABLE public.gm_tasks IS 'Tarefas automáticas geradas a partir de eventos operacionais';
COMMENT ON COLUMN public.gm_tasks.task_type IS 'Tipo de tarefa: ATRASO_ITEM, ACUMULO_BAR, ENTREGA_PENDENTE, etc';
COMMENT ON COLUMN public.gm_tasks.context IS 'Contexto JSONB com dados adicionais (tempo, itens, etc)';
COMMENT ON COLUMN public.gm_tasks.auto_generated IS 'Se true, tarefa foi gerada automaticamente pelo sistema';
COMMENT ON COLUMN public.gm_tasks.source_event IS 'Evento que gerou a tarefa (item_delay, order_ready, etc)';
