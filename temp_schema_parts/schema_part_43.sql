-- Onda 3 · F1 — Eventos de autenticação em gm_audit_logs (AUDIT_LOG_SPEC §3.1).
-- login_success, login_failure, logout registados para trilha de auditoria.
-- Ref: docs/architecture/AUDIT_LOG_SPEC.md

-- 1. Permitir tenant_id e actor_id NULL para eventos de auth (login_failure sem tenant/utilizador)
ALTER TABLE public.gm_audit_logs
  ALTER COLUMN tenant_id DROP NOT NULL,
  ALTER COLUMN actor_id DROP NOT NULL;

COMMENT ON COLUMN public.gm_audit_logs.tenant_id IS 'Restaurant (tenant). NULL only for auth events e.g. login_failure.';
COMMENT ON COLUMN public.gm_audit_logs.actor_id IS 'User who performed action. NULL only for login_failure.';

-- 2. RPC: log_login_failure — callable by anon (falha de login = utilizador não autenticado)
CREATE OR REPLACE FUNCTION public.log_login_failure(p_identifier text, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.gm_audit_logs (
    tenant_id, actor_id, action, resource_entity, resource_id,
    metadata, event_type, actor_type, result
  ) VALUES (
    NULL,
    NULL,
    'LOGIN_FAILURE',
    'auth',
    coalesce(nullif(trim(p_identifier), ''), 'unknown'),
    jsonb_build_object('identifier', coalesce(p_identifier, ''), 'reason', coalesce(p_reason, '')),
    'login_failure',
    'system',
    'failure'
  );
END;
$$;

COMMENT ON FUNCTION public.log_login_failure(text, text) IS
  'F1 Onda 3: regista tentativa de login falhada em gm_audit_logs. Callable by anon.';

GRANT EXECUTE ON FUNCTION public.log_login_failure(text, text) TO anon;

-- 3. RPC: record_auth_event — login_success e logout (callable by authenticated)
CREATE OR REPLACE FUNCTION public.record_auth_event(p_event_type text, p_metadata jsonb DEFAULT '{}')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_rid uuid;
  v_count int := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'record_auth_event requires authenticated user.';
  END IF;
  IF p_event_type IS NULL OR p_event_type NOT IN ('login_success', 'logout') THEN
    RAISE EXCEPTION 'record_auth_event: p_event_type must be login_success or logout.';
  END IF;

  FOR v_rid IN
    SELECT id FROM public.gm_restaurants WHERE owner_id = v_uid
    UNION
    SELECT restaurant_id FROM public.gm_restaurant_members
    WHERE user_id = v_uid AND disabled_at IS NULL
  LOOP
    INSERT INTO public.gm_audit_logs (
      tenant_id, actor_id, action, resource_entity, resource_id,
      metadata, event_type, actor_type, result
    ) VALUES (
      v_rid,
      v_uid,
      CASE p_event_type WHEN 'login_success' THEN 'LOGIN_SUCCESS' ELSE 'LOGOUT' END,
      'auth',
      v_uid::text,
      p_metadata,
      p_event_type,
      'user',
      'success'
    );
    v_count := v_count + 1;
  END LOOP;

  -- Se o utilizador não pertence a nenhum restaurante (ex.: conta nova), insere uma linha com tenant_id NULL
  IF v_count = 0 THEN
    INSERT INTO public.gm_audit_logs (
      tenant_id, actor_id, action, resource_entity, resource_id,
      metadata, event_type, actor_type, result
    ) VALUES (
      NULL,
      v_uid,
      CASE p_event_type WHEN 'login_success' THEN 'LOGIN_SUCCESS' ELSE 'LOGOUT' END,
      'auth',
      v_uid::text,
      p_metadata,
      p_event_type,
      'user',
      'success'
    );
  END IF;
END;
$$;

COMMENT ON FUNCTION public.record_auth_event(text, jsonb) IS
  'F1 Onda 3: regista login_success ou logout em gm_audit_logs (uma linha por tenant do utilizador).';

GRANT EXECUTE ON FUNCTION public.record_auth_event(text, jsonb) TO authenticated;

-- 4. RLS: permitir que utilizadores vejam os próprios eventos de auth com tenant_id NULL
DROP POLICY IF EXISTS "Enable select for tenant members" ON public.gm_audit_logs;
CREATE POLICY "Enable select for tenant members" ON public.gm_audit_logs
FOR SELECT USING (
  (gm_audit_logs.tenant_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.gm_restaurant_members
    WHERE restaurant_id = gm_audit_logs.tenant_id AND user_id = auth.uid()
  ))
  OR (gm_audit_logs.tenant_id IS NULL AND gm_audit_logs.actor_id = auth.uid())
);
;
-- Onda 3 · F2 — Eventos cash_register_opened e cash_register_closed em gm_audit_logs (AUDIT_LOG_SPEC §3.4).
-- Triggers em gm_cash_registers: abertura (INSERT status=open) e fecho (UPDATE open→closed).
-- Ref: docs/architecture/AUDIT_LOG_SPEC.md

-- 1. Trigger: abertura de caixa (INSERT com status = 'open')
CREATE OR REPLACE FUNCTION public.gm_cash_registers_audit_opened()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'open' THEN
    INSERT INTO public.gm_audit_logs (
      tenant_id, actor_id, action, resource_entity, resource_id,
      metadata, event_type, actor_type, result
    ) VALUES (
      NEW.restaurant_id,
      auth.uid(),
      'CASH_REGISTER_OPENED',
      'cash_register',
      NEW.id::text,
      jsonb_build_object(
        'name', NEW.name,
        'opening_balance_cents', COALESCE(NEW.opening_balance_cents, 0),
        'opened_by', COALESCE(NEW.opened_by, '')
      ),
      'cash_register_opened',
      'user',
      'success'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_gm_cash_registers_audit_opened ON public.gm_cash_registers;
CREATE TRIGGER tr_gm_cash_registers_audit_opened
  AFTER INSERT ON public.gm_cash_registers
  FOR EACH ROW
  EXECUTE FUNCTION public.gm_cash_registers_audit_opened();

COMMENT ON FUNCTION public.gm_cash_registers_audit_opened() IS
  'F2 Onda 3: regista cash_register_opened em gm_audit_logs (AUDIT_LOG_SPEC §3.4).';

-- 2. Trigger: fecho de caixa (UPDATE de status 'open' para 'closed')
CREATE OR REPLACE FUNCTION public.gm_cash_registers_audit_closed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'open' AND NEW.status = 'closed' THEN
    INSERT INTO public.gm_audit_logs (
      tenant_id, actor_id, action, resource_entity, resource_id,
      metadata, event_type, actor_type, result
    ) VALUES (
      NEW.restaurant_id,
      auth.uid(),
      'CASH_REGISTER_CLOSED',
      'cash_register',
      NEW.id::text,
      jsonb_build_object(
        'opening_balance_cents', COALESCE(OLD.opening_balance_cents, 0),
        'closing_balance_cents', COALESCE(NEW.closing_balance_cents, 0),
        'total_sales_cents', COALESCE(NEW.total_sales_cents, 0),
        'closed_by', COALESCE(NEW.closed_by, '')
      ),
      'cash_register_closed',
      'user',
      'success'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_gm_cash_registers_audit_closed ON public.gm_cash_registers;
CREATE TRIGGER tr_gm_cash_registers_audit_closed
  AFTER UPDATE ON public.gm_cash_registers
  FOR EACH ROW
  EXECUTE FUNCTION public.gm_cash_registers_audit_closed();

COMMENT ON FUNCTION public.gm_cash_registers_audit_closed() IS
  'F2 Onda 3: regista cash_register_closed em gm_audit_logs (AUDIT_LOG_SPEC §3.4).';
;
-- Onda 3 · F3 — Política de purge/retenção para gm_audit_logs (RETENTION_POLICY).
-- Purge apenas por job/autoridade; trigger permite DELETE quando app.allow_audit_purge = 'on'.
-- Ref: docs/architecture/RETENTION_POLICY.md, docs/ops/AUDIT_LOG_PURGE_RUNBOOK.md

-- 1. Alterar trigger de imutabilidade: permitir DELETE quando purge autorizado (session var)
CREATE OR REPLACE FUNCTION public.gm_audit_logs_immutable()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  IF tg_op = 'UPDATE' THEN
    RAISE EXCEPTION 'gm_audit_logs: updates not allowed (immutable audit trail)';
  END IF;
  IF tg_op = 'DELETE' THEN
    -- Purge autorizado apenas quando session var definida por RPC de purge (F3)
    IF current_setting('app.allow_audit_purge', true) <> 'on' THEN
      RAISE EXCEPTION 'gm_audit_logs: deletes not allowed (immutable audit trail). Use authorised purge job.';
    END IF;
  END IF;
  RETURN COALESCE(OLD, NEW);
END;
$$;

COMMENT ON FUNCTION public.gm_audit_logs_immutable() IS
  'Imutabilidade: bloqueia UPDATE; permite DELETE apenas quando app.allow_audit_purge=on (purge autorizado F3).';

-- 2. RPC: purge de registos mais antigos que p_cutoff (apenas service_role / uso autorizado)
CREATE OR REPLACE FUNCTION public.purge_audit_logs_older_than(p_cutoff timestamptz)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted BIGINT;
BEGIN
  -- Exigir que o corte seja pelo menos 1 ano atrás (evitar purge acidental recente)
  IF p_cutoff IS NULL OR p_cutoff > (now() - interval '1 year') THEN
    RAISE EXCEPTION 'purge_audit_logs_older_than: p_cutoff must be at least 1 year ago (retention policy).';
  END IF;

  SET LOCAL app.allow_audit_purge = 'on';
  WITH deleted AS (
    DELETE FROM public.gm_audit_logs
    WHERE created_at < p_cutoff
    RETURNING id
  )
  SELECT count(*)::BIGINT INTO v_deleted FROM deleted;

  RETURN v_deleted;
END;
$$;

COMMENT ON FUNCTION public.purge_audit_logs_older_than(timestamptz) IS
  'F3 Onda 3: purge autorizado de gm_audit_logs (registos com created_at < p_cutoff). Conforme RETENTION_POLICY. Uso: cron/ops com service_role.';

-- Apenas service_role (backend/cron) pode executar; authenticated e anon não.
REVOKE EXECUTE ON FUNCTION public.purge_audit_logs_older_than(timestamptz) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.purge_audit_logs_older_than(timestamptz) FROM anon;
REVOKE EXECUTE ON FUNCTION public.purge_audit_logs_older_than(timestamptz) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.purge_audit_logs_older_than(timestamptz) TO service_role;
;
