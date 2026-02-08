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
