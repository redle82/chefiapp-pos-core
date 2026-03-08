-- =============================================================================
-- Mobile Activation v1 (QR + PIN)
-- Core is SSOT for activation token lifecycle, one-time use and revocation.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.gm_mobile_activation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  staff_member_id UUID NOT NULL,
  requested_role TEXT NOT NULL,
  label TEXT,
  token_hash TEXT NOT NULL UNIQUE,
  pin_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'consumed', 'revoked', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_by_admin_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  pin_shown_at TIMESTAMPTZ,
  consumed_at TIMESTAMPTZ,
  consumed_by_install_id TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_gm_mobile_activation_requests_restaurant
  ON public.gm_mobile_activation_requests(restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gm_mobile_activation_requests_status_expires
  ON public.gm_mobile_activation_requests(status, expires_at);

CREATE INDEX IF NOT EXISTS idx_gm_mobile_activation_requests_staff
  ON public.gm_mobile_activation_requests(staff_member_id, created_at DESC);

COMMENT ON TABLE public.gm_mobile_activation_requests IS
  'Activation v1 requests for AppStaff QR+PIN pairing. Stores token/pin hashes only.';

-- Atomic consume (one-time use)
CREATE OR REPLACE FUNCTION public.mobile_consume_activation_request(
  p_request_id UUID,
  p_install_id TEXT
)
RETURNS SETOF public.gm_mobile_activation_requests
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.gm_mobile_activation_requests
  SET
    status = 'consumed',
    consumed_at = now(),
    consumed_by_install_id = p_install_id
  WHERE id = p_request_id
    AND status = 'pending'
    AND consumed_at IS NULL
    AND expires_at > now()
  RETURNING *;
END;
$$;

-- Atomic attempts increment (+ optional revoke by threshold)
CREATE OR REPLACE FUNCTION public.mobile_register_invalid_pin_attempt(
  p_request_id UUID,
  p_max_attempts INTEGER DEFAULT 5,
  p_revoke_reason TEXT DEFAULT 'max_pin_attempts'
)
RETURNS SETOF public.gm_mobile_activation_requests
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.gm_mobile_activation_requests
  SET
    attempts = attempts + 1,
    status = CASE WHEN attempts + 1 >= p_max_attempts THEN 'revoked' ELSE status END,
    revoked_at = CASE WHEN attempts + 1 >= p_max_attempts THEN now() ELSE revoked_at END,
    revoked_reason = CASE WHEN attempts + 1 >= p_max_attempts THEN p_revoke_reason ELSE revoked_reason END
  WHERE id = p_request_id
  RETURNING *;
END;
$$;

GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE ON public.gm_mobile_activation_requests TO anon;
GRANT EXECUTE ON FUNCTION public.mobile_consume_activation_request TO anon;
GRANT EXECUTE ON FUNCTION public.mobile_register_invalid_pin_attempt TO anon;

DO $$ BEGIN
  EXECUTE 'GRANT SELECT, INSERT, UPDATE ON public.gm_mobile_activation_requests TO authenticated';
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.mobile_consume_activation_request TO authenticated';
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.mobile_register_invalid_pin_attempt TO authenticated';
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;
