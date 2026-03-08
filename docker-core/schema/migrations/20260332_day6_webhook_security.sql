-- ============================================================================
-- Day 6 Phase 4: Webhook Secret Encryption & Security Hardening
-- File: 20260332_day6_webhook_security.sql
-- Purpose:
--   - Encrypt webhook secrets at rest using pgcrypto
--   - Provide RPCs for storing encrypted secrets and verifying signatures
--   - Prepare database layer for gateway integration
-- ============================================================================

BEGIN;

-- Ensure pgcrypto extension is available for encryption/HMAC helpers
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 1. Schema Enhancements on webhook_secrets
-- ============================================================================

-- Add encrypted secret storage and hash column (for quick equality checks)
ALTER TABLE public.webhook_secrets
ADD COLUMN IF NOT EXISTS secret_encrypted BYTEA,
ADD COLUMN IF NOT EXISTS secret_hash TEXT;

-- Optional: future migrations can safely drop/ignore secret_key once all
-- providers are migrated to encrypted storage. For now we keep it to allow
-- gradual rollout.

-- ============================================================================
-- 2. RPC: store_webhook_secret_encrypted
-- ============================================================================
-- API:
--   store_webhook_secret_encrypted(
--     p_webhook_id UUID,
--     p_secret_plain TEXT,
--     p_master_key TEXT
--   )
--
-- Behaviour:
--   - Encrypts p_secret_plain with pgcrypto and p_master_key
--   - Stores ciphertext in webhook_secrets.secret_encrypted
--   - Stores SHA-256 hex hash in webhook_secrets.secret_hash
--   - Optionally nulls legacy secret_key column
--
-- Notes:
--   - p_master_key should come from a secure runtime source
--     (e.g. WEBHOOK_SECRET_KEY env → session_setting in PostgREST/Supabase).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.store_webhook_secret_encrypted(
  p_webhook_id UUID,
  p_secret_plain TEXT,
  p_master_key TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  secret_hash TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists BOOLEAN;
  v_hash TEXT;
BEGIN
  IF p_webhook_id IS NULL OR p_secret_plain IS NULL OR p_master_key IS NULL THEN
    RETURN QUERY SELECT
      FALSE,
      'webhook_id, secret_plain and master_key are required',
      NULL::TEXT;
    RETURN;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.webhook_secrets WHERE id = p_webhook_id
  ) INTO v_exists;

  IF NOT v_exists THEN
    RETURN QUERY SELECT
      FALSE,
      'Webhook secret configuration not found',
      NULL::TEXT;
    RETURN;
  END IF;

  -- Compute deterministic hash for quick comparisons (non-reversible)
  v_hash := encode(digest(p_secret_plain::bytea, 'sha256'), 'hex');

  UPDATE public.webhook_secrets
  SET
    secret_encrypted = pgp_sym_encrypt(p_secret_plain, p_master_key),
    secret_hash = v_hash,
    -- Keep legacy secret_key for now, but clear it when we have encrypted value
    secret_key = NULL,
    updated_at = NOW()
  WHERE id = p_webhook_id;

  RETURN QUERY SELECT
    TRUE,
    'Webhook secret encrypted and stored successfully',
    v_hash;
END;
$$;

ALTER FUNCTION public.store_webhook_secret_encrypted(UUID, TEXT, TEXT) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.store_webhook_secret_encrypted(UUID, TEXT, TEXT) TO service_role;

-- ============================================================================
-- 3. RPC: verify_webhook_signature_encrypted
-- ============================================================================
-- API:
--   verify_webhook_signature_encrypted(
--     p_webhook_id UUID,
--     p_payload TEXT,
--     p_signature TEXT,
--     p_master_key TEXT
--   )
--
-- Behaviour:
--   - Decrypts secret_encrypted using p_master_key
--   - Computes expected HMAC-SHA256 signature over p_payload
--   - Compares with provided p_signature
--   - Returns (is_valid, error_message)
--
-- Notes:
--   - Signature encoding is assumed to be hex (common for HMAC headers).
--   - If secret_encrypted is NULL, falls back to legacy secret_key when present.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.verify_webhook_signature_encrypted(
  p_webhook_id UUID,
  p_payload TEXT,
  p_signature TEXT,
  p_master_key TEXT
)
RETURNS TABLE(
  is_valid BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret_encrypted BYTEA;
  v_secret_plain TEXT;
  v_legacy_secret TEXT;
  v_expected_sig TEXT;
BEGIN
  IF p_webhook_id IS NULL THEN
    RETURN QUERY SELECT
      FALSE,
      'Missing webhook_id';
    RETURN;
  END IF;

  IF p_payload IS NULL OR p_signature IS NULL THEN
    RETURN QUERY SELECT
      FALSE,
      'Missing payload or signature';
    RETURN;
  END IF;

  SELECT
    secret_encrypted,
    secret_key
  INTO
    v_secret_encrypted,
    v_legacy_secret
  FROM public.webhook_secrets
  WHERE id = p_webhook_id
    AND is_active = TRUE;

  IF v_secret_encrypted IS NULL AND v_legacy_secret IS NULL THEN
    RETURN QUERY SELECT
      FALSE,
      'No secret configured for this webhook';
    RETURN;
  END IF;

  IF v_secret_encrypted IS NOT NULL THEN
    IF p_master_key IS NULL THEN
      RETURN QUERY SELECT
        FALSE,
        'Master key required to decrypt webhook secret';
      RETURN;
    END IF;

    v_secret_plain := pgp_sym_decrypt(v_secret_encrypted, p_master_key);
  ELSE
    -- Fallback to legacy plaintext secret
    v_secret_plain := v_legacy_secret;
  END IF;

  IF v_secret_plain IS NULL THEN
    RETURN QUERY SELECT
      FALSE,
      'Secret could not be resolved';
    RETURN;
  END IF;

  -- Compute expected HMAC-SHA256 signature in hex form
  v_expected_sig :=
    encode(hmac(p_payload::bytea, v_secret_plain::bytea, 'sha256'), 'hex');

  IF lower(trim(p_signature)) = lower(trim(v_expected_sig)) THEN
    RETURN QUERY SELECT
      TRUE,
      NULL::TEXT;
  ELSE
    RETURN QUERY SELECT
      FALSE,
      'Signature mismatch';
  END IF;
END;
$$;

ALTER FUNCTION public.verify_webhook_signature_encrypted(UUID, TEXT, TEXT, TEXT)
  OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.verify_webhook_signature_encrypted(UUID, TEXT, TEXT, TEXT)
  TO service_role;

-- ============================================================================
-- 4. Permissions Hardening
-- ============================================================================

-- Ensure anon cannot read or modify webhook secrets
REVOKE ALL ON public.webhook_secrets FROM anon;

COMMIT;

