-- =============================================================================
-- TIPOS DE TAREFA: PEDIDO_NOVO (cada pedido = tarefa) e MODO_INTERNO (ocioso)
-- =============================================================================
-- Data: 2026-02-03
-- Objetivo: Cada pedido que aparece gera uma tarefa; sem pedidos = tarefas de
--           exemplar, limpeza e cuidado do restaurante (CONTRATO_DE_ATIVIDADE_OPERACIONAL).
-- =============================================================================

-- Estender constraint de task_type em gm_tasks
ALTER TABLE public.gm_tasks
  DROP CONSTRAINT IF EXISTS gm_tasks_task_type_check;

ALTER TABLE public.gm_tasks
  ADD CONSTRAINT gm_tasks_task_type_check CHECK (task_type IN (
    'ATRASO_ITEM',
    'ACUMULO_BAR',
    'ENTREGA_PENDENTE',
    'ITEM_CRITICO',
    'PEDIDO_ESQUECIDO',
    'ESTOQUE_CRITICO',
    'RUPTURA_PREVISTA',
    'EQUIPAMENTO_CHECK',
    'PEDIDO_NOVO',   -- Cada pedido criado → tarefa "Preparar pedido #X"
    'MODO_INTERNO'   -- Restaurante ocioso → tarefas de limpeza, checklist, cuidado
  ));

COMMENT ON COLUMN public.gm_tasks.task_type IS 'Tipo de tarefa: PEDIDO_NOVO (novo pedido), MODO_INTERNO (ocioso/limpeza), ATRASO_ITEM, etc';
