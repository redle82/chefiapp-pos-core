-- =============================================================================
-- Device Pairing Codes — Short alphanumeric codes for desktop device pairing
-- =============================================================================
-- Data: 2026-06-01
-- Objetivo: Permite ao admin gerar um código curto (6 caracteres alfanuméricos)
--           para vincular dispositivos desktop (TPV/KDS) sem precisar de QR.
--           Desktop não pode escanear QR de si próprio — pairing por código
--           é mais natural. Código expira em 5 minutos e só pode ser
--           consumido uma vez.
-- Contrato: DESKTOP_DISTRIBUTION_CONTRACT, OPERATIONAL_INSTALLATION_CONTRACT.
-- =============================================================================

-- 1. Add pairing_code column to existing tokens table -------------------------

ALTER TABLE public.gm_device_install_tokens
    ADD COLUMN IF NOT EXISTS pairing_code VARCHAR(7);
    -- Format: XXXX-XX (4+dash+2 = 7 chars stored, 6 alphanumeric)

COMMENT ON COLUMN public.gm_device_install_tokens.pairing_code IS
  'Short human-readable code for desktop device pairing (format: XXXX-XX). '
  'Null for QR-only tokens. Unique among active (unconsumed, unexpired) tokens.';

-- Partial unique index: unconsumed tokens must have unique codes.
-- (Expired tokens that were never consumed keep their code; collision is
--  checked at generation time via the RPC, and expiry is enforced at consumption.)
CREATE UNIQUE INDEX IF NOT EXISTS idx_dit_pairing_code_active
    ON public.gm_device_install_tokens(pairing_code)
    WHERE pairing_code IS NOT NULL
      AND consumed_at IS NULL;

-- 2. Helper: generate random pairing code ------------------------------------
--    Uses A-Z, 2-9 (excludes 0/O/1/I/L to avoid confusion)

CREATE OR REPLACE FUNCTION public._generate_pairing_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    code  TEXT := '';
    i     INT;
BEGIN
    FOR i IN 1..6 LOOP
        code := code || substr(chars, floor(random() * length(chars))::int + 1, 1);
    END LOOP;
    -- Format as XXXX-XX
    RETURN substr(code, 1, 4) || '-' || substr(code, 5, 2);
END;
$$;

-- 3. RPC: create_device_pairing_code -----------------------------------------
--    Called by Admin UI to generate a short code for desktop pairing.
--    Also creates a standard token for backward compat.

CREATE OR REPLACE FUNCTION public.create_device_pairing_code(
    p_restaurant_id UUID,
    p_device_type   TEXT DEFAULT 'TPV',
    p_device_name   TEXT DEFAULT NULL,
    p_ttl_minutes   INT  DEFAULT 5
)
RETURNS SETOF public.gm_device_install_tokens
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_code TEXT;
    v_attempts INT := 0;
BEGIN
    -- Generate unique code (retry on collision with active codes)
    LOOP
        v_code := public._generate_pairing_code();
        -- Check no active token has this code
        IF NOT EXISTS (
            SELECT 1 FROM public.gm_device_install_tokens
            WHERE pairing_code = v_code
              AND consumed_at IS NULL
              AND expires_at > now()
        ) THEN
            EXIT;
        END IF;
        v_attempts := v_attempts + 1;
        IF v_attempts > 10 THEN
            RAISE EXCEPTION 'PAIRING_CODE_COLLISION: Could not generate unique code after 10 attempts.';
        END IF;
    END LOOP;

    RETURN QUERY
    INSERT INTO public.gm_device_install_tokens
        (restaurant_id, device_type, device_name, expires_at, pairing_code, created_by)
    VALUES
        (p_restaurant_id, p_device_type, p_device_name,
         now() + (p_ttl_minutes || ' minutes')::INTERVAL,
         v_code, NULL)
    RETURNING *;
END;
$$;

COMMENT ON FUNCTION public.create_device_pairing_code IS
  'Generate a short pairing code (XXXX-XX) for desktop device provisioning. '
  'Code expires in p_ttl_minutes (default 5). Called from Admin > Dispositivos.';

-- 4. RPC: consume_device_pairing_code ----------------------------------------
--    Called by the desktop app after user enters the code.
--    Same atomic logic as consume_device_install_token but keyed on code.

CREATE OR REPLACE FUNCTION public.consume_device_pairing_code(
    p_code        TEXT,
    p_device_meta JSONB DEFAULT '{}'::jsonb
)
RETURNS SETOF public.gm_terminals
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_tok   public.gm_device_install_tokens%ROWTYPE;
    v_tid   UUID;
    v_name  TEXT;
    v_normalized TEXT;
BEGIN
    -- Normalize: uppercase + strip dashes/spaces
    v_normalized := upper(regexp_replace(p_code, '[^A-Z0-9]', '', 'g'));

    -- Find and lock the token
    SELECT * INTO v_tok
    FROM public.gm_device_install_tokens
    WHERE regexp_replace(pairing_code, '[^A-Z0-9]', '', 'g') = v_normalized
      AND consumed_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'CODE_NOT_FOUND: Código inválido o ya utilizado.';
    END IF;

    IF v_tok.expires_at < now() THEN
        RAISE EXCEPTION 'CODE_EXPIRED: Código expirado.';
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

COMMENT ON FUNCTION public.consume_device_pairing_code IS
  'Desktop app enters the short code, this RPC creates a terminal and marks consumed. '
  'Normalizes input (strips dashes, uppercases). Raises on invalid/expired.';

-- 5. PostgREST exposure ------------------------------------------------------

GRANT EXECUTE ON FUNCTION public.create_device_pairing_code TO anon;
GRANT EXECUTE ON FUNCTION public.consume_device_pairing_code TO anon;

DO $$ BEGIN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.create_device_pairing_code TO authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.consume_device_pairing_code TO authenticated';
EXCEPTION WHEN undefined_object THEN
    NULL;
END $$;
