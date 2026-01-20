-- 🧪 SEED: TEST PRODUCT (FIXTURE OFICIAL)
-- Purpose: Garantir que existe um produto válido para testes automatizados
-- Date: 2026-01-13
DO $$
DECLARE v_restaurant_id UUID;
v_product_id UUID;
v_category_id UUID;
-- If categories are separate, but schema showed 'category' as text in gm_products
BEGIN -- 1. Identificar Restaurante Alvo (Sofia Gastrobar)
-- Pegamos o mais recente ou um específico se preferir
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
-- 2. Inserir/Atualizar Produto de Teste
-- Usamos um nome distinto para facilitar busca
-- Check uniqueness by name for this restaurant to avoid dupes
SELECT id INTO v_product_id
FROM gm_products
WHERE restaurant_id = v_restaurant_id
    AND name = 'Test Product (Coca-Cola)';
IF v_product_id IS NOT NULL THEN RAISE NOTICE '✅ Produto de Teste já existe (ID: %)',
v_product_id;
-- Opcional: Atualizar para garantir estado
UPDATE gm_products
SET status = 'available',
    price_cents = 250
WHERE id = v_product_id;
ELSE
INSERT INTO gm_products (
        restaurant_id,
        name,
        price_cents,
        category,
        status,
        origin
    )
VALUES (
        v_restaurant_id,
        'Test Product (Coca-Cola)',
        250,
        -- 2.50
        'beverages',
        'available',
        'test_fixture'
    )
RETURNING id INTO v_product_id;
RAISE NOTICE '✨ Produto de Teste Criado (ID: %)',
v_product_id;
END IF;
END $$;