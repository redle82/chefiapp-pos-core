-- Migration: 058_govern_manage_layer.sql
-- Purpose: GovernManage as Sovereign Layer - System that governs other systems
-- Date: 2025-01-02
-- Note: NOT a module, but a LAYER that orchestrates everything

-- 1. Feature Flags (Flags de Features)
CREATE TABLE IF NOT EXISTS public.govern_feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    feature_key TEXT NOT NULL, -- 'fast_mode', 'auto_stock_ordering', 'review_auto_response', etc.
    enabled BOOLEAN DEFAULT false,
    enabled_at TIMESTAMPTZ,
    enabled_by UUID REFERENCES auth.users(id),
    conditions JSONB DEFAULT '{}'::jsonb, -- Conditions for auto-enable/disable
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id, feature_key)
);

-- 2. Governance Rules (Regras de Governança)
CREATE TABLE IF NOT EXISTS public.govern_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    rule_name TEXT NOT NULL,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('event_trigger', 'signal_cross', 'pattern_detection', 'auto_action')),
    
    -- Trigger Conditions
    trigger_events TEXT[] DEFAULT '{}', -- Event types that trigger this rule
    trigger_conditions JSONB DEFAULT '{}'::jsonb, -- Additional conditions
    
    -- Signal Cross-Analysis
    cross_signals JSONB DEFAULT '[]'::jsonb, -- Signals to cross-check: [{"source": "stock", "field": "current_stock", "operator": "<", "value": 10}, ...]
    
    -- Pattern Detection
    pattern_type TEXT, -- 'recurring', 'anomaly', 'trend', 'correlation'
    pattern_config JSONB DEFAULT '{}'::jsonb,
    
    -- Actions
    actions JSONB DEFAULT '[]'::jsonb, -- [{"type": "create_task", "target": "appstaff", "config": {...}}, ...]
    
    -- Priority & Escalation
    priority TEXT DEFAULT 'P2' CHECK (priority IN ('P0', 'P1', 'P2', 'P3')),
    escalation_rules JSONB DEFAULT '[]'::jsonb,
    
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Signal Cross-Analysis Cache (Cache de Análise de Sinais)
CREATE TABLE IF NOT EXISTS public.govern_signal_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    signal_key TEXT NOT NULL, -- Composite key: 'stock:product_123', 'review:cleaning:last_7d', etc.
    signal_type TEXT NOT NULL, -- 'stock', 'review', 'order', 'staff', 'time'
    signal_value JSONB NOT NULL, -- Current signal value
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- Cache expiration
    UNIQUE(restaurant_id, signal_key)
);

-- 4. Governance Decisions (Decisões de Governança)
CREATE TABLE IF NOT EXISTS public.govern_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES public.govern_rules(id),
    decision_type TEXT NOT NULL CHECK (decision_type IN ('enable_feature', 'create_task', 'send_alert', 'generate_insight', 'disable_feature')),
    
    -- Context
    trigger_event_id UUID REFERENCES public.operational_events(id),
    cross_signals_used JSONB DEFAULT '[]'::jsonb, -- Signals that influenced the decision
    reasoning TEXT, -- Human-readable reasoning
    
    -- Action Result
    action_taken JSONB DEFAULT '{}'::jsonb, -- What was actually done
    action_result TEXT, -- 'success', 'failed', 'pending'
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    executed_at TIMESTAMPTZ
);

-- 5. Pattern Detection (Detecção de Padrões)
CREATE TABLE IF NOT EXISTS public.govern_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    pattern_type TEXT NOT NULL CHECK (pattern_type IN ('recurring', 'anomaly', 'trend', 'correlation')),
    pattern_key TEXT NOT NULL, -- 'review_negative_cleaning_friday_night', 'stock_low_before_weekend', etc.
    pattern_data JSONB NOT NULL, -- Pattern details
    confidence DECIMAL(3,2) DEFAULT 0.0, -- 0.00 to 1.00
    first_detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    occurrence_count INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(restaurant_id, pattern_key)
);

-- 6. Auto-Actions History (Histórico de Ações Automáticas)
CREATE TABLE IF NOT EXISTS public.govern_auto_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    decision_id UUID REFERENCES public.govern_decisions(id),
    action_type TEXT NOT NULL,
    action_target TEXT, -- 'appstaff', 'stock', 'reviews', 'tpv', etc.
    action_config JSONB NOT NULL,
    action_result JSONB,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    success BOOLEAN DEFAULT false
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_govern_feature_flags_restaurant ON public.govern_feature_flags(restaurant_id, enabled);
CREATE INDEX IF NOT EXISTS idx_govern_rules_restaurant_enabled ON public.govern_rules(restaurant_id, enabled, rule_type);
CREATE INDEX IF NOT EXISTS idx_govern_rules_trigger_events ON public.govern_rules USING GIN(trigger_events);
CREATE INDEX IF NOT EXISTS idx_govern_signal_cache_restaurant ON public.govern_signal_cache(restaurant_id, signal_type, expires_at);
CREATE INDEX IF NOT EXISTS idx_govern_decisions_restaurant ON public.govern_decisions(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_govern_patterns_restaurant_active ON public.govern_patterns(restaurant_id, is_active, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_govern_auto_actions_restaurant ON public.govern_auto_actions(restaurant_id, executed_at DESC);

-- RLS Policies
ALTER TABLE public.govern_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.govern_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.govern_signal_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.govern_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.govern_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.govern_auto_actions ENABLE ROW LEVEL SECURITY;

-- Members can view feature flags
CREATE POLICY "Members can view feature flags" ON public.govern_feature_flags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = govern_feature_flags.restaurant_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

-- Owners/Managers can manage feature flags
CREATE POLICY "Owners can manage feature flags" ON public.govern_feature_flags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = govern_feature_flags.restaurant_id
            AND restaurant_members.user_id = auth.uid()
            AND restaurant_members.role IN ('owner', 'manager')
        )
    );

-- Members can view rules
CREATE POLICY "Members can view rules" ON public.govern_rules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = govern_rules.restaurant_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

-- Owners/Managers can manage rules
CREATE POLICY "Owners can manage rules" ON public.govern_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = govern_rules.restaurant_id
            AND restaurant_members.user_id = auth.uid()
            AND restaurant_members.role IN ('owner', 'manager')
        )
    );

-- Members can view decisions
CREATE POLICY "Members can view decisions" ON public.govern_decisions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = govern_decisions.restaurant_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

-- Members can view patterns
CREATE POLICY "Members can view patterns" ON public.govern_patterns
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = govern_patterns.restaurant_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

-- System can insert signal cache (via service role)
-- System can insert decisions (via service role)
-- System can insert auto-actions (via service role)

-- Comments
COMMENT ON TABLE public.govern_feature_flags IS 'Feature flags controlled by GovernManage layer';
COMMENT ON TABLE public.govern_rules IS 'Governance rules that orchestrate system behavior';
COMMENT ON TABLE public.govern_signal_cache IS 'Cache for cross-signal analysis';
COMMENT ON TABLE public.govern_decisions IS 'Decisions made by GovernManage layer';
COMMENT ON TABLE public.govern_patterns IS 'Detected patterns (recurring, anomalies, trends)';
COMMENT ON TABLE public.govern_auto_actions IS 'History of automatic actions taken';

-- Seed: Default Rules (Regras Padrão)

-- Rule 1: Review Negative + Cleaning → Create Task + Check Stock
INSERT INTO public.govern_rules (restaurant_id, rule_name, rule_type, trigger_events, cross_signals, actions, priority)
SELECT 
    r.id as restaurant_id,
    'Review Negative Cleaning → Auto Action' as rule_name,
    'signal_cross' as rule_type,
    ARRAY['review_negative', 'review_mention_cleanliness']::TEXT[],
    '[
        {"source": "reviews", "field": "rating", "operator": "<=", "value": 2},
        {"source": "reviews", "field": "topics", "operator": "contains", "value": "cleanliness"},
        {"source": "stock", "field": "cleaning_products_stock", "operator": "<", "value": 20}
    ]'::jsonb,
    '[
        {"type": "create_task", "target": "appstaff", "config": {"task_type": "cleaning", "priority": "P1", "title": "Limpeza urgente - review negativo recebido"}},
        {"type": "create_task", "target": "appstaff", "config": {"task_type": "stock_check", "priority": "P2", "title": "Verificar estoque de produtos de limpeza"}},
        {"type": "generate_insight", "target": "owner", "config": {"type": "review_impact", "message": "Review negativo sobre limpeza pode impactar €X/mês"}}
    ]'::jsonb,
    'P1' as priority
FROM public.gm_restaurants r
ON CONFLICT DO NOTHING;

-- Rule 2: Stock Low + Peak Hour → Auto-Order Suggestion
INSERT INTO public.govern_rules (restaurant_id, rule_name, rule_type, trigger_events, cross_signals, actions, priority)
SELECT 
    r.id as restaurant_id,
    'Stock Low + Peak Hour → Auto-Order' as rule_name,
    'signal_cross' as rule_type,
    ARRAY['stock_low', 'peak_hour_detected']::TEXT[],
    '[
        {"source": "stock", "field": "current_stock", "operator": "<=", "value": "min_stock"},
        {"source": "analytics", "field": "is_peak_hour", "operator": "==", "value": true}
    ]'::jsonb,
    '[
        {"type": "send_alert", "target": "manager", "config": {"priority": "P0", "message": "Estoque baixo durante pico - ação imediata necessária"}},
        {"type": "generate_insight", "target": "owner", "config": {"type": "stock_optimization", "message": "Sugestão: aumentar estoque antes de picos"}}
    ]'::jsonb,
    'P0' as priority
FROM public.gm_restaurants r
ON CONFLICT DO NOTHING;

-- Rule 3: Waiter Call Repeated + Kitchen Delay → Escalate
INSERT INTO public.govern_rules (restaurant_id, rule_name, rule_type, trigger_events, cross_signals, actions, priority)
SELECT 
    r.id as restaurant_id,
    'Waiter Call + Kitchen Delay → Escalate' as rule_name,
    'signal_cross' as rule_type,
    ARRAY['waiter_call_repeated', 'kitchen_delay']::TEXT[],
    '[
        {"source": "staff", "field": "call_count", "operator": ">=", "value": 3},
        {"source": "operational", "field": "kitchen_delay_minutes", "operator": ">", "value": 20}
    ]'::jsonb,
    '[
        {"type": "create_task", "target": "appstaff", "config": {"task_type": "kitchen_urgent", "priority": "P0", "title": "URGENTE: Atraso na cozinha + cliente chamando"}},
        {"type": "send_alert", "target": "manager", "config": {"priority": "P0", "message": "Situação crítica: cozinha atrasada + cliente insatisfeito"}}
    ]'::jsonb,
    'P0' as priority
FROM public.gm_restaurants r
ON CONFLICT DO NOTHING;

