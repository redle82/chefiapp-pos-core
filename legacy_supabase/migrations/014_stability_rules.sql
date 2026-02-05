-- 014_stability_rules.sql
-- Purpose: Seed the first stability-based revenue accelerator rule.
INSERT INTO rules (
        id,
        name,
        description,
        active,
        scope,
        trigger,
        condition,
        action,
        cooldown_minutes,
        version
    )
VALUES (
        'rule_stability_reward_v1',
        'Stability Reward (Momentum)',
        'Detecta alta performance operacional para disparar gatilhos de reputação externa.',
        true,
        'restaurant',
        '{"type": "PULSE_COUNT_WINDOW", "pulse_type": "ORDER_COMPLETED", "threshold_count": 20, "window_minutes": 30}',
        '{"operator": "GREATER_THAN_OR_EQUAL", "value": "threshold_count"}',
        '{"type": "EXTERNAL_LOOP", "loop_type": "REPUTATION_BOOST", "severity": "info", "message": "Sistema operando em alta performance ({{count}} pedidos/30min). Momento ideal para solicitar reviews."}',
        120,
        -- 2 hour cooldown to avoid spamming customers
        1
    ) ON CONFLICT (id) DO
UPDATE
SET trigger = EXCLUDED.trigger,
    action = EXCLUDED.action,
    active = EXCLUDED.active;