-- PHASE 2: FIRST SHOCK SIMULATION
-- Run this in your Supabase SQL Editor to simulate activity
-- 1. Identify your restaurant (or use the one created during onboarding)
DO $$
DECLARE target_restaurant_id UUID;
BEGIN
SELECT id INTO target_restaurant_id
FROM gm_restaurants
LIMIT 1;
IF target_restaurant_id IS NULL THEN RAISE NOTICE 'Nenhum restaurante encontrado. Complete o onboarding primeiro.';
ELSE RAISE NOTICE 'Simulando 25 pedidos para o restaurante: %',
target_restaurant_id;
-- 2. Insert 25 pulses (To break the threshold of 20)
INSERT INTO empire_pulses (restaurant_id, type, payload, created_at)
SELECT target_restaurant_id,
    'ORDER_COMPLETED',
    jsonb_build_object(
        'source',
        'phase_2_simulation',
        'value_cents',
        1500
    ),
    now() - (n || ' minutes')::interval
FROM generate_series(1, 25) n;
RAISE NOTICE 'Pulsos inseridos com sucesso. Agora execute a function process_pulses.';
END IF;
END $$;