-- Migration: 057_operational_event_bus.sql
-- Purpose: Operational Event Bus - Core que conecta todos os módulos
-- Date: 2025-01-02
-- Note: Sistema nervoso que liga OperationalHub + AppStaff + ReputationHub + TPV

-- 1. Event Types (Tipos de Eventos)
CREATE TYPE operational_event_type AS ENUM (
  -- TPV Events
  'order_created',
  'order_updated',
  'order_paid',
  'order_cancelled',
  'item_added',
  'item_removed',
  
  -- Stock Events
  'stock_low',
  'stock_critical',
  'stock_restocked',
  'stock_movement',
  
  -- Staff Events
  'waiter_call',
  'waiter_call_repeated',
  'shift_started',
  'shift_ended',
  'break_started',
  'break_ended',
  
  -- Review Events
  'review_received',
  'review_negative',
  'review_positive',
  'review_mention_cleanliness',
  'review_mention_service',
  'review_mention_price',
  'review_mention_food',
  
  -- Delivery Events
  'delivery_order_received',
  'delivery_order_delayed',
  'delivery_order_ready',
  
  -- Operational Events
  'peak_hour_detected',
  'table_turnover_slow',
  'kitchen_delay',
  'payment_failed',
  'system_error'
);

-- 2. Event Priority (Prioridade)
CREATE TYPE operational_event_priority AS ENUM (
  'P0', -- Crítico (vermelho)
  'P1', -- Alto (laranja)
  'P2', -- Médio (azul)
  'P3'  -- Baixo (cinza)
);

-- 3. Event Status (Status do Evento)
CREATE TYPE operational_event_status AS ENUM (
  'pending',    -- Aguardando processamento
  'processing', -- Em processamento
  'routed',     -- Roteado (virou tarefa/notificação)
  'acknowledged', -- Reconhecido
  'resolved',   -- Resolvido
  'ignored'     -- Ignorado
);

-- 4. Operational Events (Eventos Operacionais)
CREATE TABLE IF NOT EXISTS public.operational_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    event_type operational_event_type NOT NULL,
    priority operational_event_priority NOT NULL DEFAULT 'P2',
    status operational_event_status NOT NULL DEFAULT 'pending',
    
    -- Context (Contexto do Evento)
    source_module TEXT NOT NULL, -- 'tpv', 'stock', 'staff', 'reviews', 'delivery', 'analytics'
    source_id UUID, -- ID do objeto que gerou o evento (order_id, stock_item_id, etc.)
    context JSONB DEFAULT '{}'::jsonb, -- Dados adicionais do evento
    
    -- Routing (Roteamento)
    target_roles TEXT[] DEFAULT '{}', -- Roles que devem receber (['waiter', 'kitchen', 'manager'])
    target_user_id UUID REFERENCES auth.users(id), -- Usuário específico (opcional)
    auto_route BOOLEAN DEFAULT true, -- Roteamento automático para AppStaff
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    
    -- Deduplication (Deduplicação)
    dedupe_key TEXT, -- Chave para evitar duplicatas (ex: "waiter_call_table_7_2025-01-02")
    dedupe_window_minutes INTEGER DEFAULT 5 -- Janela de deduplicação em minutos
);

-- 5. Event Routing Rules (Regras de Roteamento)
CREATE TABLE IF NOT EXISTS public.operational_event_routing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    event_type operational_event_type NOT NULL,
    priority operational_event_priority NOT NULL,
    
    -- Routing Logic
    target_roles TEXT[] NOT NULL, -- Roles que recebem
    target_conditions JSONB DEFAULT '{}'::jsonb, -- Condições adicionais (ex: {"area": "sala", "shift": "dinner"})
    
    -- Action (Ação)
    action_type TEXT NOT NULL CHECK (action_type IN ('create_task', 'send_notification', 'update_dashboard', 'trigger_workflow')),
    action_config JSONB DEFAULT '{}'::jsonb, -- Configuração da ação
    
    -- Priority Escalation (Escalação de Prioridade)
    escalation_rules JSONB DEFAULT '[]'::jsonb, -- Regras de escalação (ex: após 3 chamados, vira P0)
    
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(restaurant_id, event_type, priority)
);

-- 6. Event → Task Mapping (Mapeamento Evento → Tarefa)
CREATE TABLE IF NOT EXISTS public.operational_event_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.operational_events(id) ON DELETE CASCADE,
    task_id UUID, -- Reference to AppStaff task (se aplicável)
    task_type TEXT, -- Tipo de tarefa criada
    task_title TEXT,
    task_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_operational_events_restaurant_status ON public.operational_events(restaurant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_operational_events_type_priority ON public.operational_events(event_type, priority, status);
CREATE INDEX IF NOT EXISTS idx_operational_events_dedupe ON public.operational_events(restaurant_id, dedupe_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_operational_events_source ON public.operational_events(restaurant_id, source_module, source_id);
CREATE INDEX IF NOT EXISTS idx_operational_event_routing_restaurant ON public.operational_event_routing_rules(restaurant_id, enabled);
CREATE INDEX IF NOT EXISTS idx_operational_event_tasks_event ON public.operational_event_tasks(event_id);

-- RLS Policies
ALTER TABLE public.operational_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_event_routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_event_tasks ENABLE ROW LEVEL SECURITY;

-- Members can view events
CREATE POLICY "Members can view events" ON public.operational_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = operational_events.restaurant_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

-- Members can view routing rules
CREATE POLICY "Members can view routing rules" ON public.operational_event_routing_rules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = operational_event_routing_rules.restaurant_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

-- Members can view event tasks
CREATE POLICY "Members can view event tasks" ON public.operational_event_tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.operational_events
            JOIN public.restaurant_members ON restaurant_members.restaurant_id = operational_events.restaurant_id
            WHERE operational_events.id = operational_event_tasks.event_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

-- Owners/Managers can manage routing rules
CREATE POLICY "Owners can manage routing rules" ON public.operational_event_routing_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = operational_event_routing_rules.restaurant_id
            AND restaurant_members.user_id = auth.uid()
            AND restaurant_members.role IN ('owner', 'manager')
        )
    );

-- System can insert events (via service role)
-- Note: In production, use service role for event insertion

-- Comments
COMMENT ON TABLE public.operational_events IS 'Event Bus - Eventos operacionais que conectam todos os módulos';
COMMENT ON TABLE public.operational_event_routing_rules IS 'Regras de roteamento de eventos para roles/ações';
COMMENT ON TABLE public.operational_event_tasks IS 'Mapeamento de eventos para tarefas do AppStaff';

-- Seed: Default Routing Rules (Regras Padrão)
INSERT INTO public.operational_event_routing_rules (restaurant_id, event_type, priority, target_roles, action_type, action_config)
SELECT 
    r.id as restaurant_id,
    'stock_low'::operational_event_type,
    'P1'::operational_event_priority,
    ARRAY['manager', 'stock']::TEXT[],
    'create_task'::TEXT,
    '{"task_type": "stock_check", "title_template": "Estoque baixo: {product_name}"}'::jsonb
FROM public.gm_restaurants r
ON CONFLICT DO NOTHING;

INSERT INTO public.operational_event_routing_rules (restaurant_id, event_type, priority, target_roles, action_type, action_config)
SELECT 
    r.id as restaurant_id,
    'waiter_call'::operational_event_type,
    'P1'::operational_event_priority,
    ARRAY['waiter']::TEXT[],
    'create_task'::TEXT,
    '{"task_type": "waiter_call", "title_template": "Mesa {table_number} chamando"}'::jsonb
FROM public.gm_restaurants r
ON CONFLICT DO NOTHING;

INSERT INTO public.operational_event_routing_rules (restaurant_id, event_type, priority, target_roles, action_type, action_config)
SELECT 
    r.id as restaurant_id,
    'waiter_call_repeated'::operational_event_type,
    'P0'::operational_event_priority,
    ARRAY['waiter', 'manager']::TEXT[],
    'create_task'::TEXT,
    '{"task_type": "waiter_call_urgent", "title_template": "URGENTE: Mesa {table_number} chamando repetidamente"}'::jsonb
FROM public.gm_restaurants r
ON CONFLICT DO NOTHING;

INSERT INTO public.operational_event_routing_rules (restaurant_id, event_type, priority, target_roles, action_type, action_config)
SELECT 
    r.id as restaurant_id,
    'review_negative'::operational_event_type,
    'P1'::operational_event_priority,
    ARRAY['manager', 'owner']::TEXT[],
    'create_task'::TEXT,
    '{"task_type": "review_followup", "title_template": "Review negativo recebido - ação necessária"}'::jsonb
FROM public.gm_restaurants r
ON CONFLICT DO NOTHING;

INSERT INTO public.operational_event_routing_rules (restaurant_id, event_type, priority, target_roles, action_type, action_config)
SELECT 
    r.id as restaurant_id,
    'kitchen_delay'::operational_event_type,
    'P1'::operational_event_priority,
    ARRAY['kitchen', 'chef', 'manager']::TEXT[],
    'create_task'::TEXT,
    '{"task_type": "kitchen_delay", "title_template": "Atraso na cozinha detectado"}'::jsonb
FROM public.gm_restaurants r
ON CONFLICT DO NOTHING;

