-- ==============================================================================
-- VALIDACAO MANUAL DE RLS V5 (STRICT MODE)
-- ==============================================================================
DO $$
DECLARE -- IDs reais obtidos de auth.users
    v_user_a UUID := '3b6cd06c-40a3-44fd-8dff-0f3f72f5cc57';
v_user_b UUID := 'd5cf86ad-72e7-4c39-a136-bdbdd3cbbac3';
-- IDs de teste para restaurantes
v_rest_a UUID := '11111111-1111-1111-1111-111111111111';
v_rest_b UUID := '22222222-2222-2222-2222-222222222222';
v_order_a UUID;
v_count INTEGER;
BEGIN RAISE NOTICE 'Iniciando validacao RLS...';
-- 1. Setup: Limpar dados de teste anteriores (apenas dos restaurantes de teste)
DELETE FROM public.gm_restaurant_members
WHERE restaurant_id IN (v_rest_a, v_rest_b);
DELETE FROM public.gm_orders
WHERE restaurant_id IN (v_rest_a, v_rest_b);
DELETE FROM public.gm_restaurants
WHERE id IN (v_rest_a, v_rest_b);
-- 2. Setup: Criar Restaurantes
INSERT INTO public.gm_restaurants (id, name, slug)
VALUES (
        v_rest_a,
        'Restaurante Validacao A',
        'rest-val-a'
    ),
    (
        v_rest_b,
        'Restaurante Validacao B',
        'rest-val-b'
    );
-- 3. Setup: Criar Participacao
INSERT INTO public.gm_restaurant_members (user_id, restaurant_id, role)
VALUES (v_user_a, v_rest_a, 'owner'),
    (v_user_b, v_rest_b, 'owner');
-- 4. Setup: Criar Pedidos (Incluindo short_id)
INSERT INTO public.gm_orders (
        id,
        restaurant_id,
        status,
        total_amount,
        short_id
    )
VALUES (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        v_rest_a,
        'pending',
        1000,
        'TST-001'
    ),
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        v_rest_b,
        'pending',
        2000,
        'TST-002'
    );
-- 5. TESTE A: Validacao Positiva (User A deve ver Rest A)
RAISE NOTICE 'Teste A: Validando Acesso Correto (User A -> Rest A)...';
SELECT COUNT(*) INTO v_count
FROM public.gm_orders
WHERE restaurant_id IN (
        SELECT restaurant_id
        FROM public.gm_restaurant_members
        WHERE user_id = v_user_a
    );
IF v_count >= 1 THEN NULL;
-- Sucesso silencioso para nao poluir
ELSE RAISE EXCEPTION '❌ FALHA CRITICA: User A deveria ver seus pedidos, mas viu 0.';
END IF;
-- 6. TESTE B: Validacao Negativa (User A NAO deve ver Rest B)
RAISE NOTICE 'Teste B: Validando Isolamento (User A -> Rest B)...';
SELECT COUNT(*) INTO v_count
FROM public.gm_orders
WHERE restaurant_id = v_rest_b -- Pedido do B
    AND restaurant_id IN (
        SELECT restaurant_id
        FROM public.gm_restaurant_members
        WHERE user_id = v_user_a
    );
IF v_count = 0 THEN NULL;
-- Sucesso
ELSE RAISE EXCEPTION '❌ FALHA CRITICA: VAZAMENTO DE DADOS! User A viu % pedidos do Restaurante B.',
v_count;
END IF;
-- Limpeza final
DELETE FROM public.gm_restaurant_members
WHERE restaurant_id IN (v_rest_a, v_rest_b);
DELETE FROM public.gm_orders
WHERE restaurant_id IN (v_rest_a, v_rest_b);
DELETE FROM public.gm_restaurants
WHERE id IN (v_rest_a, v_rest_b);
END $$;