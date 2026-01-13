-- 🧪 SEED: TEST PRODUCT VALIDATED
-- Purpose: Garantir que existe um produto válido para testes automatizados (TestSprite)
-- Date: 2026-01-13
-- Target: 'Sofia Gastrobar'
-- Schema: gm_products (id, restaurant_id, name, price_cents, category [text], status [text])
DO $$
DECLARE v_restaurant_id UUID;
v_product_id UUID := '00000000-0000-0000-0000-000000000001';
-- ID Fixo para testes
BEGIN -- 1. Identificar Restaurante Alvo (Sofia Gastrobar)
SELECT id INTO v_restaurant_id
FROM gm_restaurants
WHERE name = 'Sofia Gastrobar'
ORDER BY created_at DESC
LIMIT 1;
-- Safety check
IF v_restaurant_id IS NULL THEN RAISE EXCEPTION 'Restaurante Sofia Gastrobar não encontrado!';
END IF;
RAISE NOTICE '🎯 Alvo: Sofia Gastrobar (ID: %)',
v_restaurant_id;
-- 2. Upsert do Produto de Teste
-- Garantimos que o ID fixo existe com os dados corretos
INSERT INTO gm_products (
        id,
        restaurant_id,
        name,
        price_cents,
        category,
        status,
        origin
    )
VALUES (
        v_product_id,
        v_restaurant_id,
        'Test Product (Automated)',
        1000,
        -- 10.00
        'tests',
        -- Categoria simples (texto) conforme schema atual
        'available',
        'test_fixture'
    ) ON CONFLICT (id) DO
UPDATE
SET restaurant_id = EXCLUDED.restaurant_id,
    name = EXCLUDED.name,
    price_cents = EXCLUDED.price_cents,
    category = EXCLUDED.category,
    status = EXCLUDED.status,
    origin = EXCLUDED.origin,
    last_used_at = NOW();
RAISE NOTICE '✨ Produto de Teste (ID Fixo) Validado: %',
v_product_id;
END $$;