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
