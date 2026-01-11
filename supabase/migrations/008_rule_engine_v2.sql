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
--   );