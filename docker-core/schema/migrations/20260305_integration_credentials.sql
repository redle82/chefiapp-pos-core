-- ============================================================================
-- Integration Credentials — Secure token storage for OAuth integrations
-- ============================================================================
-- Stores encrypted OAuth tokens and API keys for third-party integrations
-- (Google Business, Instagram, WhatsApp Business, etc.)
--
-- Security:
--   - Tokens encrypted at rest (pgcrypto + app-level encryption)
--   - RLS enforced: only the owning restaurant can read/write
--   - Automatic token expiry tracking
--   - Audit trail via updated_at
-- ============================================================================

-- Ensure pgcrypto is available for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS gm_integration_credentials (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id  UUID NOT NULL REFERENCES gm_restaurants(id) ON DELETE CASCADE,

  -- Integration identifier (e.g., 'google_business', 'instagram', 'whatsapp_business')
  provider       TEXT NOT NULL,

  -- Credential type: 'oauth2', 'api_key', 'webhook_secret'
  credential_type TEXT NOT NULL DEFAULT 'oauth2',

  -- Encrypted token data (JSON blob encrypted with pgcrypto)
  -- Contains: access_token, refresh_token, scope, token_type
  encrypted_data  BYTEA,

  -- Non-secret metadata (safe to query without decryption)
  account_id      TEXT,          -- External account/profile ID
  account_name    TEXT,          -- Human-readable account name
  scopes          TEXT[],        -- Granted OAuth scopes

  -- Token lifecycle
  expires_at      TIMESTAMPTZ,   -- When the access token expires
  refreshed_at    TIMESTAMPTZ,   -- Last successful token refresh

  -- Status tracking
  status          TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'revoked', 'error')),
  last_error      TEXT,          -- Last error message (if status = 'error')

  -- Audit
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One credential per provider per restaurant
  UNIQUE (restaurant_id, provider)
);

-- RLS: Only the owning restaurant can access its credentials
ALTER TABLE gm_integration_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY integration_credentials_tenant_isolation
  ON gm_integration_credentials
  FOR ALL
  USING (
    restaurant_id IN (
      SELECT rm.restaurant_id
      FROM gm_restaurant_members rm
      WHERE rm.user_id = auth.uid()
    )
  );

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_integration_credentials_restaurant_provider
  ON gm_integration_credentials (restaurant_id, provider);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_integration_credentials_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_integration_credentials_updated
  BEFORE UPDATE ON gm_integration_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_integration_credentials_timestamp();

-- Helper RPC: Encrypt and store credentials
CREATE OR REPLACE FUNCTION store_integration_credential(
  p_restaurant_id UUID,
  p_provider TEXT,
  p_credential_type TEXT,
  p_token_data JSONB,
  p_account_id TEXT DEFAULT NULL,
  p_account_name TEXT DEFAULT NULL,
  p_scopes TEXT[] DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_encryption_key TEXT DEFAULT 'chefiapp-integration-key'
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO gm_integration_credentials (
    restaurant_id, provider, credential_type,
    encrypted_data, account_id, account_name,
    scopes, expires_at, status
  ) VALUES (
    p_restaurant_id, p_provider, p_credential_type,
    pgp_sym_encrypt(p_token_data::text, p_encryption_key),
    p_account_id, p_account_name,
    p_scopes, p_expires_at, 'active'
  )
  ON CONFLICT (restaurant_id, provider)
  DO UPDATE SET
    credential_type = EXCLUDED.credential_type,
    encrypted_data = EXCLUDED.encrypted_data,
    account_id = EXCLUDED.account_id,
    account_name = EXCLUDED.account_name,
    scopes = EXCLUDED.scopes,
    expires_at = EXCLUDED.expires_at,
    status = 'active',
    last_error = NULL
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper RPC: Read decrypted credentials (only callable by authenticated users with access)
CREATE OR REPLACE FUNCTION read_integration_credential(
  p_restaurant_id UUID,
  p_provider TEXT,
  p_encryption_key TEXT DEFAULT 'chefiapp-integration-key'
) RETURNS JSONB AS $$
DECLARE
  v_data BYTEA;
  v_result JSONB;
BEGIN
  SELECT encrypted_data INTO v_data
  FROM gm_integration_credentials
  WHERE restaurant_id = p_restaurant_id
    AND provider = p_provider
    AND status = 'active';

  IF v_data IS NULL THEN
    RETURN NULL;
  END IF;

  v_result := pgp_sym_decrypt(v_data, p_encryption_key)::jsonb;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
