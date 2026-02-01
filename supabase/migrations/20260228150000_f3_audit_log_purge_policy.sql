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
