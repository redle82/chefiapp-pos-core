-- =============================================================================
-- TAREFAS GERADAS AUTOMATICAMENTE - Teste Humano
-- =============================================================================
-- 
-- Este script gera tarefas no formato AppStaff para correções identificadas
-- no teste humano completo.
--
-- Executar no Supabase SQL Editor após revisão.
-- =============================================================================

-- TAREFAS CRÍTICAS (Prioridade: critical)

INSERT INTO public.gm_tasks (
    id,
    restaurant_id,
    title,
    priority,
    status,
    assigned_roles,
    category,
    created_at
) VALUES
-- ERRO-001: Cliente não sabe se pedido foi recebido
(
    gen_random_uuid(),
    (SELECT id FROM public.gm_restaurants LIMIT 1), -- Ajustar para restaurante específico
    'Adicionar feedback claro após envio de pedido (web)',
    'critical',
    'pending',
    ARRAY['dev', 'manager'],
    'ux_fix',
    NOW()
),
-- ERRO-002: Garçom não sabe origem do pedido
(
    gen_random_uuid(),
    (SELECT id FROM public.gm_restaurants LIMIT 1),
    'Indicar origem do pedido (web vs garçom) no AppStaff',
    'critical',
    'pending',
    ARRAY['dev'],
    'ux_fix',
    NOW()
),
-- ERRO-003: Ação "acknowledge" não é clara
(
    gen_random_uuid(),
    (SELECT id FROM public.gm_restaurants LIMIT 1),
    'Tornar ação "acknowledge" mais clara (mudar para "VER PEDIDO")',
    'critical',
    'pending',
    ARRAY['dev'],
    'ux_fix',
    NOW()
),
-- ERRO-004: Duplo clique em pagamento
(
    gen_random_uuid(),
    (SELECT id FROM public.gm_restaurants LIMIT 1),
    'Proteger contra duplo clique em pagamento (debounce)',
    'critical',
    'pending',
    ARRAY['dev'],
    'technical_fix',
    NOW()
);

-- TAREFAS URGENTES (Prioridade: urgent)

INSERT INTO public.gm_tasks (
    id,
    restaurant_id,
    title,
    priority,
    status,
    assigned_roles,
    category,
    created_at
) VALUES
-- ERRO-005: Cliente não sabe quando pedido estará pronto
(
    gen_random_uuid(),
    (SELECT id FROM public.gm_restaurants LIMIT 1),
    'Adicionar página de status do pedido (web) com atualizações em tempo real',
    'urgent',
    'pending',
    ARRAY['dev'],
    'feature',
    NOW()
),
-- ERRO-006: Não há notificação push
(
    gen_random_uuid(),
    (SELECT id FROM public.gm_restaurants LIMIT 1),
    'Implementar notificação push para pedidos web',
    'urgent',
    'pending',
    ARRAY['dev'],
    'feature',
    NOW()
),
-- ERRO-007: Cozinheiro não percebe novo pedido
(
    gen_random_uuid(),
    (SELECT id FROM public.gm_restaurants LIMIT 1),
    'Melhorar alertas visuais no KDS (flash, borda piscando, vibração)',
    'urgent',
    'pending',
    ARRAY['dev'],
    'ux_fix',
    NOW()
),
-- ERRO-008: Garçom não sabe quantas ações pendentes
(
    gen_random_uuid(),
    (SELECT id FROM public.gm_restaurants LIMIT 1),
    'Adicionar contador discreto de ações pendentes no AppStaff',
    'urgent',
    'pending',
    ARRAY['dev'],
    'ux_fix',
    NOW()
),
-- ERRO-009: Não há como dividir conta
(
    gen_random_uuid(),
    (SELECT id FROM public.gm_restaurants LIMIT 1),
    'Adicionar opção de dividir conta no QuickPayModal',
    'urgent',
    'pending',
    ARRAY['dev'],
    'feature',
    NOW()
),
-- ERRO-010: Não há confirmação de valor total
(
    gen_random_uuid(),
    (SELECT id FROM public.gm_restaurants LIMIT 1),
    'Adicionar confirmação final de valor total antes de processar pagamento',
    'urgent',
    'pending',
    ARRAY['dev'],
    'ux_fix',
    NOW()
);

-- NOTA: Tarefas médias e baixas podem ser adicionadas posteriormente
-- conforme priorização do time.
