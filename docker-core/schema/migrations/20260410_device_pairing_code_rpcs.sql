-- =============================================================================
-- RPCs create_device_pairing_code / consume_device_pairing_code (aliases)
-- =============================================================================
-- O frontend (devicesApi) chama estes nomes; o schema tem create_device_install_token
-- e consume_device_install_token. Esta migração expõe os nomes esperados como
-- wrappers. Requer: 20260303_device_install_tokens.sql (tabela + RPCs _install_token).
-- =============================================================================

-- create_device_pairing_code: mesmo contrato que create_device_install_token
CREATE OR REPLACE FUNCTION public.create_device_pairing_code(
    p_restaurant_id UUID,
    p_device_type   TEXT DEFAULT 'TPV',
    p_device_name   TEXT DEFAULT NULL,
    p_ttl_minutes   INT  DEFAULT 5
)
RETURNS SETOF public.gm_device_install_tokens
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.create_device_install_token(
        p_restaurant_id, p_device_type, p_device_name, p_ttl_minutes
    );
END;
$$;

COMMENT ON FUNCTION public.create_device_pairing_code IS
  'Alias for create_device_install_token. Generate one-time pairing code for device provisioning (Admin > TPVs / Dispositivos).';

-- consume_device_pairing_code: mesmo contrato que consume_device_install_token (p_code = p_token)
CREATE OR REPLACE FUNCTION public.consume_device_pairing_code(
    p_code       TEXT,
    p_device_meta JSONB DEFAULT '{}'::jsonb
)
RETURNS SETOF public.gm_terminals
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.consume_device_install_token(p_code, p_device_meta);
END;
$$;

COMMENT ON FUNCTION public.consume_device_pairing_code IS
  'Alias for consume_device_install_token. Device calls with pairing code to register terminal.';

-- Grants
GRANT EXECUTE ON FUNCTION public.create_device_pairing_code TO anon;
GRANT EXECUTE ON FUNCTION public.consume_device_pairing_code TO anon;
DO $$ BEGIN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.create_device_pairing_code TO authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.consume_device_pairing_code TO authenticated';
EXCEPTION WHEN undefined_object THEN
    NULL;
END $$;
