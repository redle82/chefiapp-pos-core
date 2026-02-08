-- 1. Rules Table (The Brain's Memory)
create table if not exists rules (
    id text primary key,
    name text not null,
    description text,
    active boolean default true,
    scope text not null,
    trigger jsonb not null,
    condition jsonb not null,
    action jsonb not null,
    cooldown_minutes int default 0,
    version int default 1,
    created_at timestamptz default now()
);
-- 2. Alerts Table (The Nervous System)
create table if not exists alerts (
    id uuid primary key default gen_random_uuid(),
    restaurant_id uuid not null,
    rule_id text not null,
    alert_type text not null,
    severity text not null,
    message text,
    metadata jsonb,
    created_at timestamptz default now(),
    resolved_at timestamptz
);
-- 3. Performance Index
create index if not exists idx_empire_pulses_restaurant_created on empire_pulses (restaurant_id, created_at desc);
-- 4. Seed: Rule #1 "Silêncio Mortal"
insert into rules (
        id,
        name,
        description,
        active,
        scope,
        trigger,
        condition,
        action,
        cooldown_minutes
    )
values (
        'rule_silencio_mortal_v1',
        'Silêncio Mortal',
        'Detecta ausência total de pulsos operacionais por período crítico.',
        true,
        'restaurant',
        '{"type": "TIME_SINCE_LAST_PULSE", "threshold_minutes": 15}',
        '{"operator": "GREATER_THAN", "value": "threshold_minutes"}',
        '{"type": "CREATE_ALERT", "alert_type": "ALERT_NO_PULSE", "severity": "critical", "message": "Nenhuma atividade detectada nos últimos {{threshold_minutes}} minutos."}',
        30
    ) on conflict (id) do
update
set trigger = excluded.trigger,
    action = excluded.action,
    active = excluded.active;
-- 5. Cron Trigger (Needs pg_cron extension enabled in Supabase Dashboard)
-- select
--   cron.schedule(
--     'process_silence_rule',
--     '*/5 * * * *',
--     'select net.http_post(
--       url := ''https://YOUR_PROJECT.functions.supabase.co/process_pulses'',
--       headers := ''{"Authorization":"Bearer SERVICE_ROLE"}''
--     );'
--   );;
-- AIRLOCK PROTOCOL: The Customer Buffer Zone
-- Limits the contact surface between Public Actors and Sovereign Data.
-- Moved from 20260106 to 009 to ensure schema availability.
-- 1. Create the Request Table (The Queue)
CREATE TABLE IF NOT EXISTS public.gm_order_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.saas_tenants(id),
    -- Context
    table_id UUID REFERENCES public.gm_tables(id),
    customer_contact JSONB DEFAULT '{}'::jsonb,
    -- name, phone (volatile)
    -- Content (Denormalized)
    items JSONB NOT NULL,
    -- Array of requested items { product_id, quantity, notes }
    total_cents INTEGER NOT NULL,
    payment_method VARCHAR(50),
    -- 'CASH', 'PIX', 'CARD_MACHINE' (Intent)
    -- State
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    -- PENDING, ACCEPTED, REJECTED
    sovereign_order_id UUID REFERENCES public.gm_orders(id),
    -- Link to Order if Accepted
    -- Metadata
    request_source VARCHAR(50) DEFAULT 'PUBLIC_QR',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- 2. Security Policies (RLS)
-- A. PUBLIC ACCESS (The Void)
ALTER TABLE public.gm_order_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can insert requests" ON public.gm_order_requests;
CREATE POLICY "Public can insert requests" ON public.gm_order_requests FOR
INSERT TO anon,
    authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Public can view own" ON public.gm_order_requests;
CREATE POLICY "Public can view own" ON public.gm_order_requests FOR
SELECT TO anon,
    authenticated USING (true);
-- B. SOVEREIGN ACCESS (The Kernel)
DROP POLICY IF EXISTS "Sovereign can manage requests" ON public.gm_order_requests;
CREATE POLICY "Sovereign can manage requests" ON public.gm_order_requests FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.saas_tenants_members
        WHERE user_id = auth.uid()
            AND tenant_id = gm_order_requests.tenant_id
    )
);
-- 3. Indexes for TPV Polling
CREATE INDEX IF NOT EXISTS idx_requests_tenant_status ON public.gm_order_requests(tenant_id, status);;
-- Rule Engine v1 Core Rules Seed
-- 1. Atraso Operacional (ALERT)
INSERT INTO rules (id, name, description, active, scope, trigger, condition, action, cooldown_minutes)
VALUES (
    'rule_operational_delay_v1',
    'Atraso Operacional',
    'Detecta acúmulo de pedidos atrasados na cozinha.',
    true,
    'restaurant',
    '{"type": "PULSE_COUNT_WINDOW", "pulse_type": "ORDER_DELAYED", "threshold_count": 3, "window_minutes": 10}',
    '{"operator": "GREATER_THAN_OR_EQUAL", "value": "threshold_count"}',
    '{"type": "CREATE_ALERT", "alert_type": "OPERATIONAL_DELAY", "severity": "warning", "message": "Atenção: 3+ pedidos atrasados nos últimos 10 minutos."}',
    15
) ON CONFLICT (id) DO UPDATE SET 
    trigger = EXCLUDED.trigger,
    action = EXCLUDED.action,
    active = EXCLUDED.active;

-- 2. Padrão de Caos (INSIGHT/ALERT)
INSERT INTO rules (id, name, description, active, scope, trigger, condition, action, cooldown_minutes)
VALUES (
    'rule_chaos_pattern_v1',
    'Padrão de Caos',
    'Detecta picos de erro ou instabilidade operacional.',
    true,
    'restaurant',
    '{"type": "PULSE_COUNT_WINDOW", "pulse_type": "ERROR", "threshold_count": 5, "window_minutes": 5}',
    '{"operator": "GREATER_THAN_OR_EQUAL", "value": "threshold_count"}',
    '{"type": "CREATE_ALERT", "alert_type": "CHAOS_PATTERN", "severity": "critical", "message": "Padrão de Caos: Múltiplos erros detectados em curto intervalo."}',
    10
) ON CONFLICT (id) DO UPDATE SET 
    trigger = EXCLUDED.trigger,
    action = EXCLUDED.action,
    active = EXCLUDED.active;
;
