-- seed-fiscal-reconciliation.sql
-- Script de seed para testar reconciliação fiscal end-to-end.
-- Uso: psql -h localhost -p 5433 -U postgres -d postgres -f scripts/seed/seed-fiscal-reconciliation.sql

-- =============================================================================
-- 1. Selecionar/criar restaurant de teste
-- =============================================================================

DO $$
DECLARE
    v_restaurant_id UUID;
    v_shift_1 UUID := gen_random_uuid();
    v_shift_2 UUID := gen_random_uuid();
    v_shift_3 UUID := gen_random_uuid();
    v_snapshot_1 UUID;
    v_snapshot_2 UUID;
    v_snapshot_3 UUID;
    v_user_id UUID;
BEGIN
    -- Pegar primeiro restaurant ou criar um de teste
    SELECT id INTO v_restaurant_id FROM public.gm_restaurants LIMIT 1;

    IF v_restaurant_id IS NULL THEN
        RAISE NOTICE 'Nenhum restaurant encontrado. Criando restaurant de teste...';
        INSERT INTO public.gm_restaurants (name, slug, table_layout_config)
        VALUES ('Restaurante Exemplo Fiscal', 'exemplo-fiscal', '{}'::jsonb)
        RETURNING id INTO v_restaurant_id;
    END IF;

    RAISE NOTICE 'Usando restaurant_id: %', v_restaurant_id;

    -- Pegar um user_id para reconciled_by
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;

    -- =============================================================================
    -- 2. Criar snapshots fiscais de exemplo (últimos 3 turnos)
    -- =============================================================================

    -- Turno 1 (há 3 dias): OK - valores batem
    INSERT INTO public.gm_fiscal_snapshots (
        restaurant_id,
        shift_id,
        pos_system,
        source,
        payload,
        total_fiscal_cents,
        total_orders_fiscal,
        created_at
    ) VALUES (
        v_restaurant_id,
        v_shift_1,
        'exemplo_pos',
        'MANUAL',
        jsonb_build_object(
            'pos_session_id', 'SESSION_001',
            'operator', 'João Silva',
            'notes', 'Turno almoço'
        ),
        45000,  -- €450.00
        12,
        NOW() - INTERVAL '3 days'
    ) RETURNING id INTO v_snapshot_1;

    -- Turno 2 (há 2 dias): DIVERGENTE - ChefIApp tem mais €5
    INSERT INTO public.gm_fiscal_snapshots (
        restaurant_id,
        shift_id,
        pos_system,
        source,
        payload,
        total_fiscal_cents,
        total_orders_fiscal,
        created_at
    ) VALUES (
        v_restaurant_id,
        v_shift_2,
        'exemplo_pos',
        'API',
        jsonb_build_object(
            'pos_session_id', 'SESSION_002',
            'operator', 'Maria Costa',
            'sync_timestamp', '2026-02-10T21:30:00Z'
        ),
        38000,  -- €380.00 (mas ChefIApp tem €385)
        10,
        NOW() - INTERVAL '2 days'
    ) RETURNING id INTO v_snapshot_2;

    -- Turno 3 (ontem): PENDING_DATA - ainda não há snapshot fiscal
    -- (não criamos snapshot propositadamente)

    -- =============================================================================
    -- 3. Criar reconciliações correspondentes
    -- =============================================================================

    -- Reconciliação 1: OK
    INSERT INTO public.gm_reconciliations (
        restaurant_id,
        shift_id,
        fiscal_snapshot_id,
        total_operational_cents,
        total_fiscal_cents,
        difference_cents,
        status,
        reason_code,
        notes,
        reconciled_by,
        created_at
    ) VALUES (
        v_restaurant_id,
        v_shift_1,
        v_snapshot_1,
        45000,  -- ChefIApp
        45000,  -- POS Fiscal
        0,      -- Diferença
        'OK',
        NULL,
        'Reconciliação automática - valores batem',
        v_user_id,
        NOW() - INTERVAL '3 days'
    );

    -- Reconciliação 2: DIVERGENTE
    INSERT INTO public.gm_reconciliations (
        restaurant_id,
        shift_id,
        fiscal_snapshot_id,
        total_operational_cents,
        total_fiscal_cents,
        difference_cents,
        status,
        reason_code,
        notes,
        reconciled_by,
        created_at
    ) VALUES (
        v_restaurant_id,
        v_shift_2,
        v_snapshot_2,
        38500,  -- ChefIApp (€385.00)
        38000,  -- POS Fiscal (€380.00)
        500,    -- Diferença: +€5.00 no ChefIApp
        'DIVERGENT',
        'MISSING_FISCAL_CANCELLATION',
        'ChefIApp registou 1 cancelamento de €5 que não aparece no POS. Verificar se foi cancelado apenas no app sem passar pelo POS.',
        v_user_id,
        NOW() - INTERVAL '2 days'
    );

    -- Reconciliação 3: PENDING_DATA
    INSERT INTO public.gm_reconciliations (
        restaurant_id,
        shift_id,
        fiscal_snapshot_id,
        total_operational_cents,
        total_fiscal_cents,
        difference_cents,
        status,
        reason_code,
        notes,
        reconciled_by,
        created_at
    ) VALUES (
        v_restaurant_id,
        v_shift_3,
        NULL,  -- sem snapshot fiscal ainda
        42000,  -- ChefIApp
        0,      -- POS Fiscal (ausente)
        42000,  -- Diferença = total ChefIApp
        'PENDING_DATA',
        'AWAITING_FISCAL_SYNC',
        'Aguardando snapshot do POS fiscal para este turno',
        v_user_id,
        NOW() - INTERVAL '1 day'
    );

    RAISE NOTICE '✅ Seed concluído com sucesso!';
    RAISE NOTICE '   - Restaurant ID: %', v_restaurant_id;
    RAISE NOTICE '   - 3 snapshots fiscais criados';
    RAISE NOTICE '   - 3 reconciliações criadas (1 OK, 1 DIVERGENT, 1 PENDING_DATA)';
    RAISE NOTICE '';
    RAISE NOTICE 'Para verificar no portal, aceda ao Fecho Diário do restaurant: %', v_restaurant_id;

END $$;

-- =============================================================================
-- 4. Query de verificação
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== Resumo de Reconciliações ===';
END $$;

SELECT
    r.id,
    r.restaurant_id,
    r.shift_id,
    r.total_operational_cents / 100.0 AS chefiapp_euros,
    r.total_fiscal_cents / 100.0 AS pos_fiscal_euros,
    r.difference_cents / 100.0 AS diferenca_euros,
    r.status,
    r.reason_code,
    r.created_at
FROM public.gm_reconciliations r
ORDER BY r.created_at DESC
LIMIT 10;
