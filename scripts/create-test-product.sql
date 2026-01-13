-- Script para criar produto de teste para TestSprite
-- Execute no Supabase SQL Editor ou via psql
-- Data: 2026-01-13

-- 1. Verificar se restaurante de teste existe
DO $$
DECLARE
    v_restaurant_id UUID;
    v_product_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
BEGIN
    -- Tentar usar WEB_MODULE_RESTAURANT_ID do env ou buscar primeiro restaurante
    SELECT id INTO v_restaurant_id
    FROM gm_restaurants
    LIMIT 1;
    
    IF v_restaurant_id IS NULL THEN
        RAISE EXCEPTION 'Nenhum restaurante encontrado. Execute seed primeiro.';
    END IF;
    
    -- Criar produto de teste se não existir
    INSERT INTO gm_products (
        id,
        restaurant_id,
        name,
        description,
        price_cents,
        currency,
        is_active,
        created_at,
        updated_at
    )
    VALUES (
        v_product_id,
        v_restaurant_id,
        'Test Product',
        'Produto de teste para TestSprite',
        1000,  -- 10.00 EUR
        'eur',
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        name = EXCLUDED.name,
        price_cents = EXCLUDED.price_cents,
        updated_at = NOW();
    
    RAISE NOTICE 'Produto de teste criado/atualizado: %', v_product_id;
    RAISE NOTICE 'Restaurant ID usado: %', v_restaurant_id;
END $$;

-- 2. Verificar produto criado
SELECT 
    id,
    restaurant_id,
    name,
    price_cents,
    currency,
    is_active
FROM gm_products
WHERE id = '00000000-0000-0000-0000-000000000001'::UUID;
