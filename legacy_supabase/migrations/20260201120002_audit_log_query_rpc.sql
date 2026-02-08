-- Onda 2 · A3 — Endpoint consultável para audit log (admin/DPO).
-- RPC get_audit_logs: filtros por tenant, período, event_type, action; apenas membros ativos.
-- Ref: docs/architecture/AUDIT_LOG_SPEC.md §5 Acesso e export

CREATE OR REPLACE FUNCTION public.get_audit_logs(
    p_restaurant_id UUID,
    p_from TIMESTAMPTZ DEFAULT NULL,
    p_to TIMESTAMPTZ DEFAULT NULL,
    p_event_type TEXT DEFAULT NULL,
    p_action TEXT DEFAULT NULL,
    p_limit INT DEFAULT 500
)
RETURNS TABLE (
    id UUID,
    tenant_id UUID,
    actor_id UUID,
    actor_type TEXT,
    action TEXT,
    resource_entity TEXT,
    resource_id TEXT,
    metadata JSONB,
    event_type TEXT,
    result TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_limit INT;
BEGIN
    -- Apenas owner ou membro ativo do restaurante (AUDIT_LOG_SPEC: roles autorizadas)
    IF NOT (
        EXISTS (SELECT 1 FROM public.gm_restaurants r WHERE r.id = p_restaurant_id AND r.owner_id = auth.uid())
        OR public.is_user_member_of_restaurant(p_restaurant_id)
    ) THEN
        RAISE EXCEPTION 'Access Denied: You are not a member of this restaurant.';
    END IF;

    v_limit := LEAST(COALESCE(NULLIF(p_limit, 0), 500), 2000);

    RETURN QUERY
    SELECT
        a.id,
        a.tenant_id,
        a.actor_id,
        a.actor_type,
        a.action,
        a.resource_entity,
        a.resource_id,
        a.metadata,
        a.event_type,
        a.result,
        a.created_at
    FROM public.gm_audit_logs a
    WHERE a.tenant_id = p_restaurant_id
      AND (p_from IS NULL OR a.created_at >= p_from)
      AND (p_to IS NULL OR a.created_at <= p_to)
      AND (p_event_type IS NULL OR p_event_type = '' OR a.event_type = p_event_type)
      AND (p_action IS NULL OR p_action = '' OR a.action = p_action)
    ORDER BY a.created_at DESC
    LIMIT v_limit;
END;
$$;

COMMENT ON FUNCTION public.get_audit_logs(UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, INT) IS
  'Consulta trilha de auditoria (DPO/admin). Filtros: tenant, período, event_type, action. Máx 2000 linhas. Apenas membros ativos do restaurante.';
