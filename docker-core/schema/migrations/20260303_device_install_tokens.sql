-- =============================================================================
-- gm_device_install_tokens — One-time tokens for device provisioning
-- =============================================================================
-- Data: 2026-03-03
-- Objetivo: Permite ao admin gerar um token QR que, ao ser lido por um
--           dispositivo, liga-o automaticamente ao restaurante. O token
--           expira em 5 minutos (configurable via `expires_at`) e só pode
--           ser consumido uma única vez (`consumed_at IS NULL`).
--           Ao consumir, um novo registo em gm_terminals é criado e o
--           terminal_id fica registado no token.
-- Contrato: CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.
-- =============================================================================

-- 1. Table ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.gm_device_install_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    token       TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    device_type TEXT NOT NULL DEFAULT 'APPSTAFF'
                CHECK (device_type IN ('TPV', 'KDS', 'APPSTAFF', 'WAITER')),
    device_name TEXT,                       -- optional friendly name preset by admin
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at  TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '5 minutes',
    consumed_at TIMESTAMPTZ,                -- null while pending
    terminal_id UUID REFERENCES public.gm_terminals(id),  -- set on consume
    created_by  UUID                        -- admin user id who generated it
);

CREATE INDEX IF NOT EXISTS idx_dit_restaurant
    ON public.gm_device_install_tokens(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_dit_token
    ON public.gm_device_install_tokens(token)
    WHERE consumed_at IS NULL;              -- fast lookup for pending tokens

COMMENT ON TABLE public.gm_device_install_tokens IS
  'One-time install tokens for device provisioning via QR. '
  'Admin generates → device scans → token consumed → terminal created. '
  'CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.';

-- 2. RPC: create_device_install_token ------------------------------------
--    Called by Admin UI to generate a new QR token.
--    Returns the full token row (including the secret `token` field).

CREATE OR REPLACE FUNCTION public.create_device_install_token(
    p_restaurant_id UUID,
    p_device_type   TEXT DEFAULT 'APPSTAFF',
    p_device_name   TEXT DEFAULT NULL,
    p_ttl_minutes   INT  DEFAULT 5
)
RETURNS SETOF public.gm_device_install_tokens
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO public.gm_device_install_tokens
        (restaurant_id, device_type, device_name, expires_at, created_by)
    VALUES
        (p_restaurant_id, p_device_type, p_device_name,
         now() + (p_ttl_minutes || ' minutes')::INTERVAL,
         NULL)  -- TODO: extract from JWT when auth is wired
    RETURNING *;
END;
$$;

COMMENT ON FUNCTION public.create_device_install_token IS
  'Generate a one-time install token for device provisioning. '
  'TTL defaults to 5 minutes. Called from Admin > Dispositivos.';

-- 3. RPC: consume_device_install_token -----------------------------------
--    Called by the device (Staff PWA / TPV) after scanning the QR.
--    Validates the token, creates a gm_terminal row, marks consumed.
--    Returns the new terminal row.

CREATE OR REPLACE FUNCTION public.consume_device_install_token(
    p_token       TEXT,
    p_device_meta JSONB DEFAULT '{}'::jsonb
)
RETURNS SETOF public.gm_terminals
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_tok   public.gm_device_install_tokens%ROWTYPE;
    v_tid   UUID;
    v_name  TEXT;
BEGIN
    -- Find and lock the token
    SELECT * INTO v_tok
    FROM public.gm_device_install_tokens
    WHERE token = p_token
      AND consumed_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'TOKEN_NOT_FOUND: Token inválido ou já utilizado.';
    END IF;

    IF v_tok.expires_at < now() THEN
        RAISE EXCEPTION 'TOKEN_EXPIRED: Token expirado.';
    END IF;

    -- Generate terminal name
    v_name := COALESCE(v_tok.device_name,
        v_tok.device_type || '-' || substring(v_tok.token FROM 1 FOR 6));

    -- Create terminal
    v_tid := gen_random_uuid();
    INSERT INTO public.gm_terminals
        (id, restaurant_id, type, name, registered_at, last_heartbeat_at, status, metadata)
    VALUES
        (v_tid, v_tok.restaurant_id, v_tok.device_type, v_name,
         now(), now(), 'active', p_device_meta);

    -- Mark token consumed
    UPDATE public.gm_device_install_tokens
    SET consumed_at = now(), terminal_id = v_tid
    WHERE id = v_tok.id;

    RETURN QUERY
    SELECT * FROM public.gm_terminals WHERE id = v_tid;
END;
$$;

COMMENT ON FUNCTION public.consume_device_install_token IS
  'Device scans QR, calls this RPC with the token string. '
  'Creates a terminal, marks token consumed. Raises on invalid/expired.';

-- 4. RPC: device_heartbeat ----------------------------------------------
--    Called periodically by each device to signal it's alive.
--    Updates last_heartbeat_at on gm_terminals.

CREATE OR REPLACE FUNCTION public.device_heartbeat(
    p_terminal_id UUID,
    p_meta        JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.gm_terminals
    SET last_heartbeat_at = now(),
        last_seen_at      = now(),
        metadata          = metadata || p_meta
    WHERE id = p_terminal_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'TERMINAL_NOT_FOUND: Terminal % não existe.', p_terminal_id;
    END IF;

    -- Also insert into heartbeats log if table exists
    INSERT INTO public.gm_device_heartbeats (terminal_id, heartbeat_at)
    VALUES (p_terminal_id, now())
    ON CONFLICT DO NOTHING;
END;
$$;

COMMENT ON FUNCTION public.device_heartbeat IS
  'Periodic heartbeat from a device. Updates last_heartbeat_at and logs.';

-- 5. RPC: revoke_terminal ------------------------------------------------
--    Admin can revoke a device, setting status = 'revoked'.

CREATE OR REPLACE FUNCTION public.revoke_terminal(
    p_terminal_id UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.gm_terminals
    SET status = 'revoked'
    WHERE id = p_terminal_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'TERMINAL_NOT_FOUND: Terminal % não existe.', p_terminal_id;
    END IF;
END;
$$;

COMMENT ON FUNCTION public.revoke_terminal IS
  'Revoke a terminal. Sets status to revoked. Called from Admin > Dispositivos.';

-- 6. PostgREST exposure --------------------------------------------------
--    Grant anon access to the RPCs (the device calling consume_ is unauthenticated
--    at that point — it only has the secret token).

GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT ON public.gm_device_install_tokens TO anon;
GRANT SELECT, INSERT, UPDATE ON public.gm_terminals TO anon;
GRANT EXECUTE ON FUNCTION public.create_device_install_token TO anon;
GRANT EXECUTE ON FUNCTION public.consume_device_install_token TO anon;
GRANT EXECUTE ON FUNCTION public.device_heartbeat TO anon;
GRANT EXECUTE ON FUNCTION public.revoke_terminal TO anon;

-- Also grant to authenticated role if it exists
DO $$ BEGIN
    EXECUTE 'GRANT SELECT, INSERT ON public.gm_device_install_tokens TO authenticated';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE ON public.gm_terminals TO authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.create_device_install_token TO authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.consume_device_install_token TO authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.device_heartbeat TO authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.revoke_terminal TO authenticated';
EXCEPTION WHEN undefined_object THEN
    NULL; -- role doesn't exist, skip
END $$;
