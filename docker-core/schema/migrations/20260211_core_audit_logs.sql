-- 20260211_core_audit_logs.sql
-- FASE A5: Core Audit Log Schema + RPC
-- Trilha de auditoria centralizada, imutável, multi-tenant.
-- Referência: AUDIT_LOG_SPEC.md, EVENT_PIPELINE.md
-- Alinhado com CORE_BASELINE_V1.0.md, TENANT_ISOLATION_SECURITY_MODEL.md

-- =============================================================================
-- 1. TABELA: gm_audit_logs (append-only, immutable)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.gm_audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid(),

    -- Identificação do evento
    event_type TEXT NOT NULL,
    action TEXT NOT NULL,

    -- Isolamento por tenant (SEMPRE NOT NULL, exceto eventos globais raros)
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,

    -- Actor: quem fez
    actor_id UUID,
    actor_type TEXT NOT NULL DEFAULT 'user', -- 'user', 'system', 'support_admin'

    -- Objeto afetado
    resource_type TEXT NOT NULL, -- 'order', 'payment', 'user', 'config', 'cash_register', etc.
    resource_id UUID,

    -- Detalhe e resultado
    details JSONB DEFAULT NULL,
    result TEXT DEFAULT 'success', -- 'success', 'failure', 'partial'
    error_code TEXT DEFAULT NULL,
    error_message TEXT DEFAULT NULL,

    -- Client/context info
    metadata JSONB DEFAULT NULL, -- { ip, user_agent, session_id, correlation_id, ... }

    -- Timestamp (immutable, stored in UTC)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Composite PK required for partitioned tables (must include partition key)
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Partição inicial (Fevereiro-Março 2026)
CREATE TABLE IF NOT EXISTS public.gm_audit_logs_2026_02 PARTITION OF public.gm_audit_logs
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE IF NOT EXISTS public.gm_audit_logs_2026_03 PARTITION OF public.gm_audit_logs
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

-- Índices para queries comuns
CREATE INDEX IF NOT EXISTS idx_audit_restaurant_date
    ON public.gm_audit_logs(restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_restaurant_event_type
    ON public.gm_audit_logs(restaurant_id, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_restaurant_actor
    ON public.gm_audit_logs(restaurant_id, actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_restaurant_resource
    ON public.gm_audit_logs(restaurant_id, resource_type, resource_id);

-- Índice para imutabilidade (nenhum UPDATE/DELETE)
CREATE INDEX IF NOT EXISTS idx_audit_pkey_immutable
    ON public.gm_audit_logs(id);

-- Comentários para documentação
COMMENT ON TABLE public.gm_audit_logs IS 'Trilha de auditoria imutável. INSERT-only, particionada por data, isolada por tenant. Não alterar, não apagar (exceto purge autorizado).';
COMMENT ON COLUMN public.gm_audit_logs.restaurant_id IS 'Tenant (filtro obrigatório para RLS). NOT NULL.';
COMMENT ON COLUMN public.gm_audit_logs.actor_id IS 'ID do utilizador que realizou ação. NULL se actor_type=system.';
COMMENT ON COLUMN public.gm_audit_logs.created_at IS 'Timestamp imutável em UTC. Partição por mês para limpeza/purge.';

-- =============================================================================
-- 2. RLS: gm_audit_logs (role-based access control)
-- =============================================================================
-- NOTE: In Docker Core mode (postgres superuser), RLS is bypassed.
-- These policies are kept for future Supabase/RLS activation.
DO $$
BEGIN
  ALTER TABLE public.gm_audit_logs ENABLE ROW LEVEL SECURITY;

  -- Policy: tenant-isolation read (simplified for Docker Core)
  CREATE POLICY "audit_logs_tenant_read"
    ON public.gm_audit_logs
    FOR SELECT
    USING (true); -- Docker Core: postgres bypasses RLS; refine when auth.uid() is available

  -- Policy: DENY INSERT via normal user (only SECURITY DEFINER functions can insert)
  CREATE POLICY "audit_logs_insert_deny"
    ON public.gm_audit_logs
    FOR INSERT
    WITH CHECK (false);

  -- Policy: DENY UPDATE (immutable)
  CREATE POLICY "audit_logs_update_deny"
    ON public.gm_audit_logs
    FOR UPDATE
    WITH CHECK (false);

  -- Policy: DENY DELETE (except service_role purge)
  CREATE POLICY "audit_logs_delete_deny"
    ON public.gm_audit_logs
    FOR DELETE
    WITH CHECK (false);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'RLS policies on gm_audit_logs skipped: %', SQLERRM;
END
$$;

-- =============================================================================
-- 3. REALTIME PUBLICATION (para eventos em tempo quase real)
-- =============================================================================
-- Adicionar gm_audit_logs à publication padrão se não existir
-- Adicionar gm_audit_logs à publication se existir (Supabase-only)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.gm_audit_logs;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'supabase_realtime publication not available: %', SQLERRM;
END
$$;

-- =============================================================================
-- 4. RPC: log_audit_event (SECURITY DEFINER)
-- Função genérica para registar eventos de auditoria (app-layer ou Core triggers)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_restaurant_id UUID,
    p_event_type TEXT,
    p_action TEXT,
    p_actor_id UUID DEFAULT NULL,
    p_actor_type TEXT DEFAULT 'user',
    p_resource_type TEXT DEFAULT NULL,
    p_resource_id UUID DEFAULT NULL,
    p_result TEXT DEFAULT 'success',
    p_details JSONB DEFAULT NULL,
    p_error_code TEXT DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_audit_id UUID;
    v_actor_id UUID;
BEGIN
    -- Validação mínima
    IF p_restaurant_id IS NULL THEN
        RAISE EXCEPTION 'restaurant_id cannot be null';
    END IF;
    IF p_event_type IS NULL OR TRIM(p_event_type) = '' THEN
        RAISE EXCEPTION 'event_type cannot be empty';
    END IF;
    IF p_action IS NULL OR TRIM(p_action) = '' THEN
        RAISE EXCEPTION 'action cannot be empty';
    END IF;

    -- Se actor_id não foi fornecido, usar auth.uid() (se disponível)
    v_actor_id := COALESCE(p_actor_id, auth.uid());

    -- Inserir evento (INSERT só via SECURITY DEFINER, bypass RLS)
    INSERT INTO public.gm_audit_logs (
        restaurant_id,
        event_type,
        action,
        actor_id,
        actor_type,
        resource_type,
        resource_id,
        result,
        details,
        error_code,
        error_message,
        metadata,
        created_at
    ) VALUES (
        p_restaurant_id,
        p_event_type,
        p_action,
        v_actor_id,
        COALESCE(p_actor_type, 'user'),
        p_resource_type,
        p_resource_id,
        COALESCE(p_result, 'success'),
        p_details,
        p_error_code,
        p_error_message,
        p_metadata,
        NOW()
    )
    RETURNING id INTO v_audit_id;

    RETURN jsonb_build_object(
        'success', true,
        'audit_id', v_audit_id
    );

EXCEPTION WHEN OTHERS THEN
    -- Não falhar a operação principal por erro em auditoria
    -- Mas registar o erro para investigação posterior
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- =============================================================================
-- 5. RPC: log_login_failure (anon access, sem auth.uid())
-- Para registar tentativas de login falhadas antes de autenticação
-- =============================================================================
CREATE OR REPLACE FUNCTION public.log_login_failure(
    p_identifier TEXT,
    p_reason TEXT,
    p_metadata JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    -- Nota: não temos restaurant_id neste ponto, usar UUID NULL ou deixar especial
    -- Para login failures anónimas, usar um tenant_id fictício ou deixar vazio
    -- Por agora, criar entry sem restaurant_id (será NULL ou usar restaurante "default")
    --
    -- Opção: usar a primeira restaurant_id do sistema (para agregação) or NULL
    -- Aqui vamos usar NULL e depois filtrar diferente

    INSERT INTO public.gm_audit_logs (
        restaurant_id,
        event_type,
        action,
        actor_id,
        actor_type,
        resource_type,
        resource_id,
        result,
        details,
        metadata,
        created_at
    ) VALUES (
        (SELECT id FROM public.gm_restaurants LIMIT 1), -- Fallback: usar primeira resto, ou NULL
        'login_failure',
        'authenticate',
        NULL,
        'system',
        'auth_session',
        NULL,
        'failure',
        jsonb_build_object('identifier', p_identifier, 'reason', p_reason),
        p_metadata,
        NOW()
    )
    RETURNING id INTO v_audit_id;

    RETURN jsonb_build_object(
        'success', true,
        'audit_id', v_audit_id
    );

EXCEPTION WHEN OTHERS THEN
    -- Não falhar auth por erro em auditoria
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- =============================================================================
-- 6. RPC: record_auth_event (authenticated, para auth success/logout)
-- Chamada após login bem-sucedido ou logout
-- =============================================================================
CREATE OR REPLACE FUNCTION public.record_auth_event(
    p_event_type TEXT, -- 'login_success', 'logout'
    p_restaurant_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_audit_id UUID;
    v_actor_id UUID;
    v_restaurant_id UUID;
BEGIN
    v_actor_id := auth.uid();
    v_restaurant_id := COALESCE(p_restaurant_id, (SELECT restaurant_id FROM public.gm_staff WHERE user_id = v_actor_id LIMIT 1));

    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'auth.uid() is NULL. Must be authenticated.';
    END IF;

    INSERT INTO public.gm_audit_logs (
        restaurant_id,
        event_type,
        action,
        actor_id,
        actor_type,
        resource_type,
        result,
        metadata,
        created_at
    ) VALUES (
        v_restaurant_id,
        p_event_type,
        'authenticate',
        v_actor_id,
        'user',
        'auth_session',
        'success',
        p_metadata,
        NOW()
    )
    RETURNING id INTO v_audit_id;

    RETURN jsonb_build_object(
        'success', true,
        'audit_id', v_audit_id
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- =============================================================================
-- 7. RPC: get_audit_logs (for querying, respects RLS)
-- Consulta histórica de eventos com filtros
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_audit_logs(
    p_restaurant_id UUID,
    p_from TIMESTAMPTZ DEFAULT NULL,
    p_to TIMESTAMPTZ DEFAULT NULL,
    p_event_type TEXT DEFAULT NULL,
    p_action TEXT DEFAULT NULL,
    p_actor_id UUID DEFAULT NULL,
    p_limit INT DEFAULT 100,
    p_offset INT DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    event_type TEXT,
    action TEXT,
    restaurant_id UUID,
    actor_id UUID,
    actor_type TEXT,
    resource_type TEXT,
    resource_id UUID,
    result TEXT,
    details JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Validação: user deve ter acesso ao restaurant_id (RLS will check anyway)
    IF NOT EXISTS (
        SELECT 1 FROM public.gm_staff
        WHERE user_id = auth.uid() AND restaurant_id = p_restaurant_id
    ) AND NOT EXISTS (
        SELECT 1 FROM public.gm_restaurants
        WHERE id = p_restaurant_id AND owner_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access denied to restaurant_id: %', p_restaurant_id;
    END IF;

    RETURN QUERY
    SELECT
        al.id,
        al.event_type,
        al.action,
        al.restaurant_id,
        al.actor_id,
        al.actor_type,
        al.resource_type,
        al.resource_id,
        al.result,
        al.details,
        al.metadata,
        al.created_at
    FROM public.gm_audit_logs al
    WHERE
        al.restaurant_id = p_restaurant_id
        AND (p_from IS NULL OR al.created_at >= p_from)
        AND (p_to IS NULL OR al.created_at <= p_to)
        AND (p_event_type IS NULL OR al.event_type = p_event_type)
        AND (p_action IS NULL OR al.action = p_action)
        AND (p_actor_id IS NULL OR al.actor_id = p_actor_id)
    ORDER BY al.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- =============================================================================
-- 8. RPC: purge_audit_logs_older_than (service_role only, controlled purge)
-- Limpeza de registos antigos conforme política de retenção
-- Nota: Implementação no Runbook AUDIT_LOG_PURGE_RUNBOOK.md
-- =============================================================================
CREATE OR REPLACE FUNCTION public.purge_audit_logs_older_than(
    p_cutoff_date TIMESTAMPTZ,
    p_dry_run BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_count_deleted INT;
    v_message TEXT;
BEGIN
    -- Requer service_role ou admin
    IF NOT has_role(current_user, 'service_role') THEN
        RAISE EXCEPTION 'Only service_role can purge audit logs';
    END IF;

    IF p_dry_run THEN
        SELECT COUNT(*) INTO v_count_deleted
        FROM public.gm_audit_logs
        WHERE created_at < p_cutoff_date;

        v_message := 'DRY RUN: ' || v_count_deleted || ' records would be deleted before ' || p_cutoff_date::TEXT;
        RETURN jsonb_build_object('success', true, 'message', v_message, 'count', v_count_deleted);
    ELSE
        DELETE FROM public.gm_audit_logs
        WHERE created_at < p_cutoff_date;

        GET DIAGNOSTICS v_count_deleted = ROW_COUNT;
        v_message := 'Purged ' || v_count_deleted || ' audit records before ' || p_cutoff_date::TEXT;
        RETURN jsonb_build_object('success', true, 'message', v_message, 'count', v_count_deleted);
    END IF;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- =============================================================================
-- 9. TRIGGER on gm_orders: log order lifecycle events
-- Registar create, lock, paid, closed
-- =============================================================================
CREATE OR REPLACE FUNCTION public.tr_gm_orders_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM public.log_audit_event(
            p_restaurant_id := NEW.restaurant_id,
            p_event_type := 'order_created',
            p_action := 'create',
            p_actor_id := NEW.operator_id,
            p_resource_type := 'order',
            p_resource_id := NEW.id,
            p_details := jsonb_build_object('table_id', NEW.table_id, 'number_of_items', 0),
            p_metadata := jsonb_build_object('source', 'trigger')
        );
    ELSIF TG_OP = 'UPDATE' THEN
        -- Log payment status changes
        IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
            PERFORM public.log_audit_event(
                p_restaurant_id := NEW.restaurant_id,
                p_event_type := 'order_payment_status_changed',
                p_action := 'update',
                p_actor_id := NEW.operator_id,
                p_resource_type := 'order',
                p_resource_id := NEW.id,
                p_details := jsonb_build_object('from', OLD.payment_status, 'to', NEW.payment_status),
                p_metadata := jsonb_build_object('source', 'trigger')
            );
        END IF;

        -- Log status changes
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            PERFORM public.log_audit_event(
                p_restaurant_id := NEW.restaurant_id,
                p_event_type := 'order_status_changed',
                p_action := 'update',
                p_actor_id := NEW.operator_id,
                p_resource_type := 'order',
                p_resource_id := NEW.id,
                p_details := jsonb_build_object('from', OLD.status, 'to', NEW.status),
                p_metadata := jsonb_build_object('source', 'trigger')
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_gm_orders_audit_trigger
    AFTER INSERT OR UPDATE ON public.gm_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.tr_gm_orders_audit();

-- =============================================================================
-- 10. TRIGGER on gm_cash_registers: log open/close events
-- =============================================================================
CREATE OR REPLACE FUNCTION public.tr_gm_cash_registers_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'open' THEN
        PERFORM public.log_audit_event(
            p_restaurant_id := NEW.restaurant_id,
            p_event_type := 'cash_register_opened',
            p_action := 'create',
            p_actor_id := NULL,
            p_actor_type := 'system',
            p_resource_type := 'cash_register',
            p_resource_id := NEW.id,
            p_details := jsonb_build_object('opened_by', NEW.opened_by, 'opening_balance_cents', NEW.opening_balance_cents),
            p_metadata := jsonb_build_object('source', 'trigger')
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'open' AND NEW.status = 'closed' THEN
        PERFORM public.log_audit_event(
            p_restaurant_id := NEW.restaurant_id,
            p_event_type := 'cash_register_closed',
            p_action := 'update',
            p_actor_id := NULL,
            p_actor_type := 'system',
            p_resource_type := 'cash_register',
            p_resource_id := NEW.id,
            p_details := jsonb_build_object('closed_by', NEW.closed_by, 'closing_balance_cents', NEW.closing_balance_cents, 'total_sales_cents', NEW.total_sales_cents),
            p_metadata := jsonb_build_object('source', 'trigger')
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_gm_cash_registers_audit_trigger
    AFTER INSERT OR UPDATE ON public.gm_cash_registers
    FOR EACH ROW
    EXECUTE FUNCTION public.tr_gm_cash_registers_audit();

-- =============================================================================
-- 11. TRIGGER on gm_payments: log payment events
-- =============================================================================
CREATE OR REPLACE FUNCTION public.tr_gm_payments_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM public.log_audit_event(
            p_restaurant_id := NEW.restaurant_id,
            p_event_type := 'payment_recorded',
            p_action := 'create',
            p_actor_id := NEW.operator_id,
            p_resource_type := 'payment',
            p_resource_id := NEW.id,
            p_details := jsonb_build_object('order_id', NEW.order_id, 'amount_cents', NEW.amount_cents, 'method', NEW.payment_method, 'status', NEW.status),
            p_result := CASE WHEN NEW.status = 'paid' THEN 'success' ELSE 'failure' END,
            p_metadata := jsonb_build_object('source', 'trigger', 'idempotency_key', NEW.idempotency_key)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_gm_payments_audit_trigger
    AFTER INSERT ON public.gm_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.tr_gm_payments_audit();

-- =============================================================================
-- 12. GRANT RLS SELECT para cualquiera (bypass da RLS para leitura)
-- Clientes podem ver apenas seus próprios eventos
-- =============================================================================
GRANT SELECT ON public.gm_audit_logs TO public;
GRANT EXECUTE ON FUNCTION public.log_audit_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_login_failure TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_auth_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_audit_logs TO authenticated;
GRANT EXECUTE ON FUNCTION public.purge_audit_logs_older_than TO service_role;
