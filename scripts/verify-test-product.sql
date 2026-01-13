-- Script para verificar se produto de teste existe
-- Execute no Supabase SQL Editor ou via psql
-- Data: 2026-01-13

-- Verificar produto de teste
SELECT 
    id,
    restaurant_id,
    name,
    price_cents,
    currency,
    is_active,
    created_at
FROM gm_products
WHERE id = '00000000-0000-0000-0000-000000000001'::UUID;

-- Se não existir, criar
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
SELECT 
    '00000000-0000-0000-0000-000000000001'::UUID,
    (SELECT id FROM gm_restaurants LIMIT 1),
    'Test Product',
    'Produto de teste para TestSprite',
    1000,
    'eur',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM gm_products 
    WHERE id = '00000000-0000-0000-0000-000000000001'::UUID
)
RETURNING id, name, price_cents;
