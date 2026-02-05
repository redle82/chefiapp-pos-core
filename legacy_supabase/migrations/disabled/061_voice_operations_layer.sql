-- Migration: 061_voice_operations_layer.sql
-- Purpose: Voice Operations Layer (VOL) - Alexa como atuador operacional por voz
-- Date: 2025-01-02
-- Note: "Alexa não decide. Ela sinaliza. ChefIApp governa."

-- 1. Voice Devices (Dispositivos de Voz)
CREATE TABLE IF NOT EXISTS public.voice_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    
    -- Device Identity
    device_name TEXT NOT NULL, -- Ex: "Cozinha Principal", "Bar", "Sala"
    device_type TEXT NOT NULL DEFAULT 'alexa' CHECK (device_type IN ('alexa', 'google_home', 'custom')),
    device_id TEXT NOT NULL, -- ID do dispositivo (Alexa Device ID)
    location TEXT NOT NULL, -- 'kitchen', 'bar', 'dining_room', 'storage'
    
    -- Configuration
    enabled BOOLEAN DEFAULT true,
    volume INTEGER DEFAULT 50 CHECK (volume >= 0 AND volume <= 100),
    language TEXT DEFAULT 'pt-BR',
    
    -- Metadata
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(restaurant_id, device_id)
);

-- 2. Voice Events (Eventos de Voz)
CREATE TABLE IF NOT EXISTS public.voice_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    device_id UUID REFERENCES public.voice_devices(id) ON DELETE SET NULL,
    
    -- Event Type
    event_type TEXT NOT NULL CHECK (event_type IN (
        -- Time-based (cronológicos)
        'shift_opening_time',
        'hand_hygiene_interval',
        'equipment_cleaning_time',
        'shift_closing_time',
        'break_time',
        
        -- Checklist
        'checklist_pending',
        'checklist_item_missing',
        
        -- Manual triggers (voz → sistema)
        'manual_cleaning_trigger',
        'manual_equipment_check',
        'manual_stock_check',
        'manual_temperature_check',
        
        -- Acknowledgment (sistema → voz)
        'reminder_acknowledged',
        'task_completed_voice',
        'status_request'
    )),
    
    -- Direction
    direction TEXT NOT NULL CHECK (direction IN ('system_to_voice', 'voice_to_system')),
    
    -- Content
    intent TEXT, -- Alexa intent (ex: "TriggerCleaning", "AcknowledgeReminder")
    spoken_text TEXT, -- Texto falado (transcrição)
    response_text TEXT, -- Resposta do sistema (o que Alexa vai falar)
    
    -- Context
    context JSONB DEFAULT '{}'::jsonb, -- {equipment: "trituradeira", location: "kitchen", etc.}
    
    -- Integration
    operational_event_id UUID REFERENCES public.operational_events(id), -- Link com Event Bus
    task_id UUID, -- Link com AppStaff task (se criada)
    decision_id UUID REFERENCES public.govern_decisions(id), -- Link com Decision History
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'acknowledged', 'failed')),
    processed_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) -- Se foi trigger manual
);

-- 3. Voice Routines (Rotinas de Voz - Rituais Fixos)
CREATE TABLE IF NOT EXISTS public.voice_routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    device_id UUID REFERENCES public.voice_devices(id) ON DELETE SET NULL,
    
    -- Routine Identity
    routine_name TEXT NOT NULL, -- Ex: "Abertura de Turno", "Higienização Recorrente"
    routine_type TEXT NOT NULL CHECK (routine_type IN (
        'shift_opening',
        'hand_hygiene',
        'equipment_cleaning',
        'shift_closing',
        'checklist',
        'prevention_meeting',
        'custom'
    )),
    
    -- Schedule
    schedule_type TEXT NOT NULL CHECK (schedule_type IN ('time', 'interval', 'event_triggered')),
    schedule_config JSONB NOT NULL, -- {time: "08:00", interval_minutes: 30, trigger_event: "order_completed"}
    
    -- Voice Content
    announcement_text TEXT NOT NULL, -- O que Alexa vai falar
    reminder_text TEXT, -- Texto de lembrete (se necessário)
    
    -- Actions (o que acontece quando a rotina é executada)
    actions JSONB DEFAULT '[]'::jsonb, -- [{type: "create_task", config: {...}}, {type: "emit_event", config: {...}}]
    
    -- Status
    enabled BOOLEAN DEFAULT true,
    last_executed_at TIMESTAMPTZ,
    next_execution_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Voice Acknowledgment Log (Log de Confirmações)
CREATE TABLE IF NOT EXISTS public.voice_acknowledgments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    voice_event_id UUID NOT NULL REFERENCES public.voice_events(id) ON DELETE CASCADE,
    device_id UUID REFERENCES public.voice_devices(id) ON DELETE SET NULL,
    
    -- Acknowledgment
    acknowledged_by UUID REFERENCES auth.users(id), -- Quem confirmou (se manual)
    acknowledgment_type TEXT NOT NULL CHECK (acknowledgment_type IN ('voice', 'manual', 'automatic')),
    acknowledgment_text TEXT, -- O que foi dito/falado
    
    -- Metadata
    acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_voice_devices_restaurant ON public.voice_devices(restaurant_id, enabled);
CREATE INDEX IF NOT EXISTS idx_voice_devices_location ON public.voice_devices(location);
CREATE INDEX IF NOT EXISTS idx_voice_events_restaurant ON public.voice_events(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_events_device ON public.voice_events(device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_events_type ON public.voice_events(event_type, status);
CREATE INDEX IF NOT EXISTS idx_voice_events_operational ON public.voice_events(operational_event_id);
CREATE INDEX IF NOT EXISTS idx_voice_routines_restaurant ON public.voice_routines(restaurant_id, enabled);
CREATE INDEX IF NOT EXISTS idx_voice_routines_schedule ON public.voice_routines(next_execution_at) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_voice_acknowledgments_event ON public.voice_acknowledgments(voice_event_id);

-- 6. RLS Policies
ALTER TABLE public.voice_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_acknowledgments ENABLE ROW LEVEL SECURITY;

-- Policy: Restaurant members can view voice devices
CREATE POLICY "Restaurant members can view voice devices"
ON public.voice_devices FOR SELECT
USING (
    restaurant_id IN (
        SELECT restaurant_id FROM public.restaurant_members
        WHERE user_id = auth.uid()
    )
    OR
    restaurant_id IN (
        SELECT id FROM public.gm_restaurants
        WHERE owner_id = auth.uid()
    )
);

-- Policy: Restaurant members can manage voice devices
CREATE POLICY "Restaurant members can manage voice devices"
ON public.voice_devices FOR ALL
USING (
    restaurant_id IN (
        SELECT restaurant_id FROM public.restaurant_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'manager')
    )
    OR
    restaurant_id IN (
        SELECT id FROM public.gm_restaurants
        WHERE owner_id = auth.uid()
    )
);

-- Policy: Restaurant members can view voice events
CREATE POLICY "Restaurant members can view voice events"
ON public.voice_events FOR SELECT
USING (
    restaurant_id IN (
        SELECT restaurant_id FROM public.restaurant_members
        WHERE user_id = auth.uid()
    )
    OR
    restaurant_id IN (
        SELECT id FROM public.gm_restaurants
        WHERE owner_id = auth.uid()
    )
);

-- Policy: System can create voice events (via service role)
-- Policy: Restaurant members can view voice routines
CREATE POLICY "Restaurant members can view voice routines"
ON public.voice_routines FOR SELECT
USING (
    restaurant_id IN (
        SELECT restaurant_id FROM public.restaurant_members
        WHERE user_id = auth.uid()
    )
    OR
    restaurant_id IN (
        SELECT id FROM public.gm_restaurants
        WHERE owner_id = auth.uid()
    )
);

-- Policy: Restaurant members can manage voice routines
CREATE POLICY "Restaurant members can manage voice routines"
ON public.voice_routines FOR ALL
USING (
    restaurant_id IN (
        SELECT restaurant_id FROM public.restaurant_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'manager')
    )
    OR
    restaurant_id IN (
        SELECT id FROM public.gm_restaurants
        WHERE owner_id = auth.uid()
    )
);

-- Policy: Restaurant members can view voice acknowledgments
CREATE POLICY "Restaurant members can view voice acknowledgments"
ON public.voice_acknowledgments FOR SELECT
USING (
    restaurant_id IN (
        SELECT restaurant_id FROM public.restaurant_members
        WHERE user_id = auth.uid()
    )
    OR
    restaurant_id IN (
        SELECT id FROM public.gm_restaurants
        WHERE owner_id = auth.uid()
    )
);

-- 7. Add new event types to operational_event_type enum
DO $$
BEGIN
    -- Adicionar novos tipos de evento se não existirem
    IF EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'operational_event_type'
    ) THEN
        ALTER TYPE operational_event_type ADD VALUE IF NOT EXISTS 'voice_reminder';
        ALTER TYPE operational_event_type ADD VALUE IF NOT EXISTS 'voice_trigger';
        ALTER TYPE operational_event_type ADD VALUE IF NOT EXISTS 'voice_acknowledged';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN OTHERS THEN NULL;
END $$;

-- 8. Feature Flag (GovernManage)
INSERT INTO public.govern_feature_flags (restaurant_id, feature_key, enabled, metadata)
SELECT 
    id,
    'voice_operations_enabled',
    false, -- Desabilitado por padrão
    '{"description": "Voice Operations Layer - Alexa como atuador operacional por voz", "requires_hardware": true, "requires_alexa_skill": true}'::jsonb
FROM public.gm_restaurants
ON CONFLICT (restaurant_id, feature_key) DO NOTHING;

-- 9. Seed: Default Routines (Rotinas Padrão)
-- Abertura de Turno
INSERT INTO public.voice_routines (restaurant_id, routine_name, routine_type, schedule_type, schedule_config, announcement_text, actions, enabled)
SELECT 
    r.id as restaurant_id,
    'Abertura de Turno' as routine_name,
    'shift_opening' as routine_type,
    'time' as schedule_type,
    '{"time": "08:00"}'::jsonb as schedule_config,
    'Atenção equipe. Hora de iniciar o turno. Verifique checklist de abertura.' as announcement_text,
    '[
        {"type": "create_task", "target": "appstaff", "config": {"task_type": "checklist", "priority": "P1", "title": "Checklist de abertura"}},
        {"type": "emit_event", "config": {"event_type": "shift_opening_time"}}
    ]'::jsonb as actions,
    false as enabled -- Desabilitado por padrão, usuário ativa
FROM public.gm_restaurants r
ON CONFLICT DO NOTHING;

-- Higienização Recorrente
INSERT INTO public.voice_routines (restaurant_id, routine_name, routine_type, schedule_type, schedule_config, announcement_text, actions, enabled)
SELECT 
    r.id as restaurant_id,
    'Higienização Recorrente' as routine_name,
    'hand_hygiene' as routine_type,
    'interval' as schedule_type,
    '{"interval_minutes": 30}'::jsonb as schedule_config,
    'Atenção cozinha. Hora de higienizar as mãos.' as announcement_text,
    '[
        {"type": "emit_event", "config": {"event_type": "hand_hygiene_interval"}}
    ]'::jsonb as actions,
    false as enabled
FROM public.gm_restaurants r
ON CONFLICT DO NOTHING;

-- Limpeza de Equipamentos
INSERT INTO public.voice_routines (restaurant_id, routine_name, routine_type, schedule_type, schedule_config, announcement_text, actions, enabled)
SELECT 
    r.id as restaurant_id,
    'Limpeza de Equipamentos' as routine_name,
    'equipment_cleaning' as routine_type,
    'time' as schedule_type,
    '{"time": "17:00"}'::jsonb as schedule_config,
    'Atenção cozinha. Hora de limpar equipamentos.' as announcement_text,
    '[
        {"type": "create_task", "target": "appstaff", "config": {"task_type": "cleaning", "priority": "P1", "title": "Limpeza de equipamentos"}},
        {"type": "emit_event", "config": {"event_type": "equipment_cleaning_time"}}
    ]'::jsonb as actions,
    false as enabled
FROM public.gm_restaurants r
ON CONFLICT DO NOTHING;

-- 10. Comments (Documentação)
COMMENT ON TABLE public.voice_devices IS 'Dispositivos de voz (Alexa, Google Home) registrados no sistema';
COMMENT ON TABLE public.voice_events IS 'Eventos de voz: sistema → voz (anúncios) e voz → sistema (comandos)';
COMMENT ON TABLE public.voice_routines IS 'Rotinas de voz: rituais fixos da cozinha (abertura, higienização, limpeza)';
COMMENT ON TABLE public.voice_acknowledgments IS 'Log de confirmações de eventos de voz';
COMMENT ON COLUMN public.voice_events.direction IS 'Direção: system_to_voice (anúncio) ou voice_to_system (comando)';
COMMENT ON COLUMN public.voice_events.operational_event_id IS 'Link com Event Bus para rastreabilidade total';
COMMENT ON COLUMN public.voice_events.decision_id IS 'Link com Decision History para auditoria';

