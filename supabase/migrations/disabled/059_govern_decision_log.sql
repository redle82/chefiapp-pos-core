-- Migration: 059_govern_decision_log.sql
-- Purpose: Decision History (Audit Log) for GovernManage
-- Date: 2025-01-02
-- Note: Audit trail of all decisions made by the governance system

-- 1. Decision Log (Histórico de Decisões)
CREATE TABLE IF NOT EXISTS public.govern_decision_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    
    -- Event Context
    event_id UUID NOT NULL REFERENCES public.operational_events(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_priority TEXT NOT NULL,
    
    -- Rule Context (nullable if decision was made without explicit rule)
    rule_id UUID REFERENCES public.operational_event_routing_rules(id) ON DELETE SET NULL,
    rule_name TEXT,
    
    -- Decision Details
    action_type TEXT NOT NULL, -- 'create_task', 'escalate_priority', 'notify_manager', 'ignore', 'enable_feature', 'disable_feature'
    action_target TEXT, -- 'appstaff', 'manager', 'owner', 'system'
    payload JSONB NOT NULL, -- Snapshot completo da decisão
    
    -- Deduplication Info (quando aplicável)
    dedupe_key TEXT,
    dedupe_count INTEGER DEFAULT 1, -- Quantas vezes o mesmo evento foi deduplicado
    
    -- Resolution
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'failed', 'ignored')),
    executed_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_govern_decision_log_restaurant ON public.govern_decision_log(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_govern_decision_log_event ON public.govern_decision_log(event_id);
CREATE INDEX IF NOT EXISTS idx_govern_decision_log_rule ON public.govern_decision_log(rule_id);
CREATE INDEX IF NOT EXISTS idx_govern_decision_log_status ON public.govern_decision_log(restaurant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_govern_decision_log_type_priority ON public.govern_decision_log(restaurant_id, event_type, event_priority, created_at DESC);

-- RLS Policies
ALTER TABLE public.govern_decision_log ENABLE ROW LEVEL SECURITY;

-- Members can view decision log
CREATE POLICY "Members can view decision log" ON public.govern_decision_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_members
            WHERE restaurant_members.restaurant_id = govern_decision_log.restaurant_id
            AND restaurant_members.user_id = auth.uid()
        )
    );

-- System can insert decisions (via service role)
-- Note: In production, use service role for decision insertion

-- Comments
COMMENT ON TABLE public.govern_decision_log IS 'Audit log of all decisions made by GovernManage layer';
COMMENT ON COLUMN public.govern_decision_log.payload IS 'Complete snapshot of decision context and action taken';
COMMENT ON COLUMN public.govern_decision_log.dedupe_count IS 'Number of times this event was deduplicated before decision';

